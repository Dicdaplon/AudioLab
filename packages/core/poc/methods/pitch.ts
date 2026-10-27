/**
 * Proof-of-concept pitch trackers (guitar tuner): YIN, pYIN, CREPE tiny,
 * and a few variants. See poc/notes/pitch.md for the references and results.
 *
 * Every method returns f0 every 10 ms, frame i centred at i·10 ms (as
 * pitchTrack in baselines.ts), 0 when unvoiced.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { fftInPlace } from "../../src/analysis/fft";
import { detectPitch, interpolatePeak, normalizedSquareDifference } from "../../src/analysis/pitch";
import type { PitchMethod } from "../evaluate";

const MIN_HZ = 70;
const MAX_HZ = 1400;
const SILENCE_RMS = 0.001;

// ---------------------------------------------------------------------------
// YIN (de Cheveigné & Kawahara 2002)
// ---------------------------------------------------------------------------

interface YinWork {
  n: number;
  re: Float64Array;
  im: Float64Array;
  re2: Float64Array;
  im2: Float64Array;
  energy: Float64Array;
}
const yinWork = new Map<number, YinWork>();

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Cumulative mean normalised difference d'(τ), τ = 0..maxLag, of a window
 * of W samples, with the integration length W − maxLag (every lag compares
 * the same number of samples). d(τ) = E(0) + E(τ) − 2·r(τ), r through FFTs.
 */
export function cmndf(x: Float32Array, maxLag: number, raw?: Float64Array): Float64Array {
  const w = x.length;
  const len = w - maxLag;
  const n = nextPow2(w + len);
  let k = yinWork.get(n);
  if (!k) {
    k = {
      n,
      re: new Float64Array(n),
      im: new Float64Array(n),
      re2: new Float64Array(n),
      im2: new Float64Array(n),
      energy: new Float64Array(n + 1),
    };
    yinWork.set(n, k);
  }
  const { re, im, re2, im2, energy } = k;
  let mean = 0;
  for (let i = 0; i < w; i++) mean += x[i];
  mean /= w;
  re.fill(0);
  im.fill(0);
  re2.fill(0);
  im2.fill(0);
  for (let i = 0; i < w; i++) re[i] = x[i] - mean;
  for (let i = 0; i < len; i++) re2[i] = x[i] - mean;
  energy[0] = 0;
  for (let i = 0; i < w; i++) energy[i + 1] = energy[i] + re[i] * re[i];
  fftInPlace(re, im); // X
  fftInPlace(re2, im2); // A
  // conj(A)·X, then the inverse through a forward FFT of the conjugate.
  for (let i = 0; i < n; i++) {
    const a = re2[i];
    const b = -im2[i];
    const c = re[i];
    const d = im[i];
    re2[i] = a * c - b * d;
    im2[i] = -(a * d + b * c);
  }
  fftInPlace(re2, im2);
  const out = new Float64Array(maxLag + 1);
  out[0] = 1;
  const e0 = energy[len];
  let running = 0;
  for (let tau = 1; tau <= maxLag; tau++) {
    const r = re2[tau] / n;
    const d = Math.max(0, e0 + (energy[tau + len] - energy[tau]) - 2 * r);
    if (raw) raw[tau] = d;
    running += d;
    out[tau] = running > 0 ? (d * tau) / running : 1;
  }
  return out;
}

function rms(x: Float32Array): number {
  let e = 0;
  for (let i = 0; i < x.length; i++) e += x[i] * x[i];
  return Math.sqrt(e / x.length);
}

/** Parabolic vertex of a minimum around lag t (lag, value). */
function parabola(y: ArrayLike<number>, t: number): { lag: number; value: number } {
  if (t <= 0 || t >= y.length - 1) return { lag: t, value: y[t] };
  const a = y[t - 1];
  const b = y[t];
  const c = y[t + 1];
  const den = a - 2 * b + c;
  if (den <= 0) return { lag: t, value: b };
  const delta = (a - c) / (2 * den);
  return { lag: t + delta, value: b - ((a - c) * delta) / 4 };
}

interface YinOptions {
  threshold: number;
  /** When no dip goes under the threshold: unvoiced (default) or the global minimum if under this. */
  fallback?: number;
  /** Parabolic interpolation on the raw difference d(τ) (true) or on d'(τ). */
  rawInterp?: boolean;
}

/** One YIN estimate (Hz, 0 = unvoiced) plus the aperiodicity of the chosen dip. */
function yinFrame(
  x: Float32Array,
  sr: number,
  { threshold, fallback = 0, rawInterp = false }: YinOptions,
): { f0: number; ap: number } {
  if (rms(x) < SILENCE_RMS) return { f0: 0, ap: 1 };
  const maxLag = Math.min(Math.floor(sr / MIN_HZ), Math.floor(x.length / 2));
  const minLag = Math.max(2, Math.floor(sr / MAX_HZ));
  const raw = new Float64Array(maxLag + 1);
  const d = cmndf(x, maxLag, raw);
  let tau = -1;
  for (let t = minLag; t < maxLag; t++) {
    if (d[t] < threshold) {
      while (t + 1 < maxLag && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    if (!(fallback > 0)) return { f0: 0, ap: 1 };
    let best = minLag;
    for (let t = minLag; t < maxLag; t++) if (d[t] < d[best]) best = t;
    if (d[best] >= fallback) return { f0: 0, ap: d[best] };
    tau = best;
  }
  const p = parabola(d, tau);
  const lag = rawInterp ? parabola(raw, tau).lag : p.lag;
  return { f0: sr / lag, ap: Math.max(0, p.value) };
}

/** Frame-wise track, window centred on i·10 ms (as baselines.pitchTrack). */
function track<T>(
  x: Float32Array,
  sr: number,
  windowSize: number,
  f: (frame: Float32Array) => T,
): (T | null)[] {
  const frames = Math.floor(x.length / (sr / 100));
  const out: (T | null)[] = [];
  for (let i = 0; i < frames; i++) {
    const centre = Math.round(i * (sr / 100));
    const start = centre - windowSize / 2;
    out.push(
      start < 0 || start + windowSize > x.length ? null : f(x.subarray(start, start + windowSize)),
    );
  }
  return out;
}

const yin =
  (threshold: number, windowSize = 2048, fallback = 0, rawInterp = false): PitchMethod =>
  (x, sr) =>
    Float32Array.from(
      track(x, sr, windowSize, (f) => yinFrame(f, sr, { threshold, fallback, rawInterp })),
      (r) => r?.f0 ?? 0,
    );

/**
 * YIN cross-checked by MPM: voiced when YIN's dip is under the threshold or
 * MPM's clarity reaches `clarity`; when the two disagree by more than 50
 * cents (an octave, a twelfth), the confident one wins, YIN when both are.
 */
const yinMpm =
  (threshold: number, clarity: number, windowSize = 2048): PitchMethod =>
  (x, sr) =>
    Float32Array.from(
      track(x, sr, windowSize, (f) => {
        const y = yinFrame(f, sr, { threshold, fallback: 0.5 });
        const m = detectPitch(f, sr, {
          minFrequency: MIN_HZ,
          maxFrequency: MAX_HZ,
          clarityThreshold: 0.5,
        });
        const yinVoiced = y.f0 > 0 && y.ap < threshold;
        const mpmVoiced = !!m && m.clarity >= clarity;
        if (!yinVoiced && !mpmVoiced) return 0;
        if (!m) return y.f0;
        if (!(y.f0 > 0)) return mpmVoiced ? m.frequency : 0;
        const cents = 1200 * Math.log2(y.f0 / m.frequency);
        if (Math.abs(cents) <= 50) return y.f0;
        // Disagreement: trust whichever is confident; YIN by default.
        if (mpmVoiced && !yinVoiced) return m.frequency;
        return y.f0;
      }),
      (v) => v ?? 0,
    );

// ---------------------------------------------------------------------------
// MPM refinement of any track (McLeod & Wyvill 2005)
// ---------------------------------------------------------------------------

/**
 * MPM's precise lag around a guide f0: the NSDF maximum within ±60 cents of
 * the guide lag, parabolic interpolation, then the peak at the largest usable
 * multiple of that lag (as detectPitch does, lags up to half the window).
 * 0 when there is no NSDF peak of height ≥ minValue there.
 */
function nsdfRefine(x: Float32Array, sr: number, guide: number, minValue = 0.5): number {
  const maxLag = Math.floor(x.length / 2);
  const lag0 = sr / guide;
  if (!(lag0 > 2) || lag0 >= maxLag) return 0;
  const nsdf = normalizedSquareDifference(x, maxLag);
  const span = Math.pow(2, 60 / 1200);
  const from = Math.max(2, Math.floor(lag0 / span));
  const to = Math.min(maxLag - 1, Math.ceil(lag0 * span));
  let best = -1;
  for (let t = from; t <= to; t++) {
    if (nsdf[t] >= nsdf[t - 1] && nsdf[t] >= nsdf[t + 1] && (best < 0 || nsdf[t] > nsdf[best]))
      best = t;
  }
  if (best < 0 || nsdf[best] < minValue) return 0;
  const lag = interpolatePeak(nsdf, best).lag;
  const last = nsdf.length - 1;
  const radius = Math.max(2, Math.floor(lag / 4));
  for (let k = Math.floor(last / lag); k >= 2; k--) {
    const centre = Math.round(k * lag);
    const a = Math.max(1, centre - radius);
    const b = Math.min(last - 1, centre + radius);
    let m = -1;
    for (let i = a; i <= b; i++) if (m < 0 || nsdf[i] > nsdf[m]) m = i;
    if (m <= a || m >= b || nsdf[m] < minValue) continue;
    return sr / (interpolatePeak(nsdf, m).lag / k);
  }
  return sr / lag;
}

/**
 * Any track, its voiced frames re-measured by nsdfRefine: the base method
 * decides voicing and the note (octave), MPM gives the cents.
 */
const refined =
  (base: PitchMethod, windowSize = 2048): PitchMethod =>
  (x, sr) => {
    const est = base(x, sr);
    const out = Float32Array.from(est);
    for (let i = 0; i < est.length; i++) {
      if (!(est[i] > 0)) continue;
      const start = Math.round(i * (sr / 100)) - windowSize / 2;
      if (start < 0 || start + windowSize > x.length) continue;
      const f = nsdfRefine(x.subarray(start, start + windowSize), sr, est[i]);
      if (f > 0 && Math.abs(1200 * Math.log2(f / est[i])) <= 50) out[i] = f;
    }
    return out;
  };

// ---------------------------------------------------------------------------
// pYIN (Mauch & Dixon 2014)
// ---------------------------------------------------------------------------

/** Beta(a, b) CDF for integer a, b: P(Binomial(a+b−1, x) ≥ a). */
function betaCdf(x: number, a: number, b: number): number {
  const n = a + b - 1;
  let s = 0;
  let c = 1; // C(n, k)
  for (let k = 0; k <= n; k++) {
    if (k >= a) s += c * Math.pow(x, k) * Math.pow(1 - x, n - k);
    c = (c * (n - k)) / (k + 1);
  }
  return s;
}

interface Candidate {
  f0: number;
  p: number;
}

const N_THRESH = 100;
function thresholdPrior(a: number, b: number): Float64Array {
  const p = new Float64Array(N_THRESH);
  for (let i = 0; i < N_THRESH; i++)
    p[i] = betaCdf((i + 1) / N_THRESH, a, b) - betaCdf(i / N_THRESH, a, b);
  return p;
}

/**
 * pYIN stage 1: every threshold s_i of a Beta prior gives the first CMNDF
 * trough under it its probability; when none, the global minimum gets
 * 1 % of it. Returns the candidates (Hz) with their probabilities.
 */
function pyinCandidates(x: Float32Array, sr: number, prior: Float64Array): Candidate[] {
  if (rms(x) < SILENCE_RMS) return [];
  const maxLag = Math.min(Math.floor(sr / MIN_HZ), Math.floor(x.length / 2));
  const minLag = Math.max(2, Math.floor(sr / MAX_HZ));
  const d = cmndf(x, maxLag);
  const troughs: number[] = [];
  for (let t = minLag; t < maxLag; t++) {
    if (d[t] < d[t - 1] && d[t] <= d[t + 1]) troughs.push(t);
  }
  if (!troughs.length) return [];
  let global = troughs[0];
  for (const t of troughs) if (d[t] < d[global]) global = t;
  const prob = new Map<number, number>();
  for (let i = 0; i < N_THRESH; i++) {
    const s = (i + 1) / N_THRESH;
    let hit = -1;
    for (const t of troughs) {
      if (d[t] < s) {
        hit = t;
        break;
      }
    }
    if (hit < 0) prob.set(global, (prob.get(global) ?? 0) + 0.01 * prior[i]);
    else prob.set(hit, (prob.get(hit) ?? 0) + prior[i]);
  }
  return [...prob].map(([t, p]) => ({ f0: sr / parabola(d, t).lag, p }));
}

interface PyinOptions {
  /** Beta prior over thresholds (mean a/(a+b)). pYIN: mean 0.1, 0.15 or 0.2. */
  a: number;
  b: number;
  /** Cents per pitch state. */
  binCents: number;
  /** Fastest pitch move, octaves per second (librosa's 35.92). */
  maxOctPerSec: number;
  /** Probability of a voiced ↔ unvoiced switch per frame. */
  switchProb: number;
  /** Weight of the YIN probabilities against the unvoiced hypothesis (pYIN: 0.5). */
  trust: number;
  /** Frames of look-ahead of the fixed-lag Viterbi (Infinity = offline). */
  lag: number;
  windowSize: number;
}

const PYIN_DEFAULTS: PyinOptions = {
  a: 2,
  b: 18,
  binCents: 20,
  maxOctPerSec: 35.92,
  switchProb: 0.01,
  trust: 0.5,
  lag: Infinity,
  windowSize: 2048,
};

/**
 * pYIN stage 2: an HMM over (pitch bin, voiced?) states, triangular pitch
 * transitions, a small voiced ↔ unvoiced switch probability; observation
 * of a voiced state = trust × candidate probability in its bin, of any
 * unvoiced state = (1 − trust × Σp) / bins. Decoded by Viterbi, either over
 * the whole excerpt or with a fixed lag (decision at t after t + lag frames).
 * The output frequency is the best candidate near the chosen bin.
 */
const pyin =
  (opts: Partial<PyinOptions> = {}): PitchMethod =>
  (x, sr) => {
    const o = { ...PYIN_DEFAULTS, ...opts };
    const prior = thresholdPrior(o.a, o.b);
    const cands = track(x, sr, o.windowSize, (f) => pyinCandidates(f, sr, prior));
    const T = cands.length;
    const nb = Math.ceil((1200 * Math.log2(MAX_HZ / MIN_HZ)) / o.binCents) + 1;
    const binOf = (f: number) => Math.round((1200 * Math.log2(f / MIN_HZ)) / o.binCents);
    const B = Math.max(1, Math.round((o.maxOctPerSec * 1200 * 0.01) / o.binCents));
    // Triangular log transition by distance, normalised.
    const lt = new Float64Array(2 * B + 1);
    let z = 0;
    for (let d = -B; d <= B; d++) z += B + 1 - Math.abs(d);
    for (let d = -B; d <= B; d++) lt[d + B] = Math.log((B + 1 - Math.abs(d)) / z);
    const lStay = Math.log(1 - o.switchProb);
    const lSwitch = Math.log(o.switchProb);

    const S = 2 * nb; // 0..nb-1 voiced, nb..2nb-1 unvoiced
    let score = new Float64Array(S).fill(-Infinity);
    for (let k = nb; k < S; k++) score[k] = Math.log(1 / nb);
    const back: Int16Array[] = [];
    const scores: Float64Array[] = [];
    const obsV = new Float64Array(nb);
    const bestV = new Float64Array(nb);
    const argV = new Int16Array(nb);
    const bestU = new Float64Array(nb);
    const argU = new Int16Array(nb);
    for (let t = 0; t < T; t++) {
      obsV.fill(0);
      let sum = 0;
      for (const c of cands[t] ?? []) {
        const k = binOf(c.f0);
        if (k < 0 || k >= nb) continue;
        obsV[k] += o.trust * c.p;
        sum += o.trust * c.p;
      }
      const lObsU = Math.log(Math.max(1e-12, 1 - sum) / nb);
      const next = new Float64Array(S);
      const bp = new Int16Array(S);
      if (t === 0) {
        for (let k = 0; k < nb; k++) {
          next[k] = -Infinity;
          next[nb + k] = score[nb + k] + lObsU;
          bp[k] = bp[nb + k] = nb + k;
        }
      } else {
        for (let k = 0; k < nb; k++) {
          let bv = -Infinity;
          let av = 0;
          let bu = -Infinity;
          let au = nb;
          const from = Math.max(0, k - B);
          const to = Math.min(nb - 1, k + B);
          for (let j = from; j <= to; j++) {
            const w = lt[j - k + B];
            const sv = score[j] + w;
            if (sv > bv) {
              bv = sv;
              av = j;
            }
            const su = score[nb + j] + w;
            if (su > bu) {
              bu = su;
              au = nb + j;
            }
          }
          bestV[k] = bv;
          argV[k] = av;
          bestU[k] = bu;
          argU[k] = au;
        }
        for (let k = 0; k < nb; k++) {
          const lObsV = obsV[k] > 0 ? Math.log(obsV[k]) : -Infinity;
          // Into voiced k: from voiced (stay) or unvoiced (switch).
          const a1 = bestV[k] + lStay;
          const a2 = bestU[k] + lSwitch;
          if (a1 >= a2) {
            next[k] = a1 + lObsV;
            bp[k] = argV[k];
          } else {
            next[k] = a2 + lObsV;
            bp[k] = argU[k];
          }
          const b1 = bestU[k] + lStay;
          const b2 = bestV[k] + lSwitch;
          if (b1 >= b2) {
            next[nb + k] = b1 + lObsU;
            bp[nb + k] = argU[k];
          } else {
            next[nb + k] = b2 + lObsU;
            bp[nb + k] = argV[k];
          }
        }
      }
      // Renormalise to keep the numbers small.
      let m = -Infinity;
      for (let k = 0; k < S; k++) m = Math.max(m, next[k]);
      for (let k = 0; k < S; k++) next[k] -= m;
      score = next;
      back.push(bp);
      scores.push(next);
    }

    const argmax = (v: Float64Array) => {
      let best = 0;
      for (let k = 1; k < v.length; k++) if (v[k] > v[best]) best = k;
      return best;
    };
    const states = new Int32Array(T);
    if (!Number.isFinite(o.lag)) {
      let s = argmax(scores[T - 1]);
      for (let t = T - 1; t >= 0; t--) {
        states[t] = s;
        s = back[t][s];
      }
    } else {
      for (let t = 0; t < T; t++) {
        const end = Math.min(T - 1, t + o.lag);
        let s = argmax(scores[end]);
        for (let u = end; u > t; u--) s = back[u][s];
        states[t] = s;
      }
    }
    const out = new Float32Array(T);
    for (let t = 0; t < T; t++) {
      const s = states[t];
      if (s >= nb) continue;
      let best: Candidate | null = null;
      for (const c of cands[t] ?? []) {
        if (Math.abs(binOf(c.f0) - s) <= 1 && (!best || c.p > best.p)) best = c;
      }
      out[t] = best ? best.f0 : MIN_HZ * Math.pow(2, (s * o.binCents) / 1200);
    }
    return out;
  };

// ---------------------------------------------------------------------------
// CREPE tiny (Kim, Salamon, Li & Bello 2018), inference only, pure TS
// ---------------------------------------------------------------------------

/**
 * The TF.js export of the tiny model from github.com/marl/crepe (gh-pages
 * branch, model/, MIT licence), downloaded outside the repo.
 */
const CREPE_DIR =
  process.env.CREPE_DIR ??
  "C:/Users/chafi/AppData/Local/Temp/claude/c--Users-chafi-Documents-Dev-AudioLab/01b1f915-a549-4cb4-88a4-72fa5fdd2798/scratchpad/crepe";

interface Conv {
  /** [out][k][in] */
  w: Float32Array;
  bias: Float32Array;
  k: number;
  cin: number;
  cout: number;
  stride: number;
  /** BN folded: y = relu(conv)·scale + shift. */
  scale: Float32Array;
  shift: Float32Array;
}
interface Crepe {
  convs: Conv[];
  dense: Float32Array; // [360][256]
  denseBias: Float32Array;
}

let crepeModel: Crepe | null = null;
function loadCrepe(): Crepe {
  if (crepeModel) return crepeModel;
  const dir = path.join(CREPE_DIR, "model");
  const json = JSON.parse(readFileSync(path.join(dir, "model.json"), "utf8")) as {
    weightsManifest: { paths: string[]; weights: { name: string; shape: number[] }[] }[];
  };
  const tensors = new Map<string, { shape: number[]; data: Float32Array }>();
  for (const g of json.weightsManifest) {
    const buf = Buffer.concat(g.paths.map((p) => readFileSync(path.join(dir, p))));
    const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    let off = 0;
    for (const w of g.weights) {
      const n = w.shape.reduce((a, b) => a * b, 1);
      tensors.set(w.name, { shape: w.shape, data: all.slice(off, off + n) });
      off += n;
    }
  }
  const get = (n: string) => {
    const t = tensors.get(n);
    if (!t) throw new Error(`CREPE weight ${n} missing`);
    return t;
  };
  const convs: Conv[] = [];
  for (let l = 1; l <= 6; l++) {
    const kern = get(`crepe_conv${l}/kernel`); // [k, 1, in, out]
    const [k, , cin, cout] = kern.shape;
    const w = new Float32Array(cout * k * cin);
    for (let t = 0; t < k; t++)
      for (let i = 0; i < cin; i++)
        for (let o = 0; o < cout; o++)
          w[(o * k + t) * cin + i] = kern.data[(t * cin + i) * cout + o];
    const g = get(`crepe_conv${l}_BN/gamma`).data;
    const b = get(`crepe_conv${l}_BN/beta`).data;
    const mu = get(`crepe_conv${l}_BN/moving_mean`).data;
    const v = get(`crepe_conv${l}_BN/moving_variance`).data;
    const scale = new Float32Array(cout);
    const shift = new Float32Array(cout);
    for (let o = 0; o < cout; o++) {
      scale[o] = g[o] / Math.sqrt(v[o] + 0.001);
      shift[o] = b[o] - mu[o] * scale[o];
    }
    convs.push({
      w,
      bias: get(`crepe_conv${l}/bias`).data,
      k,
      cin,
      cout,
      stride: l === 1 ? 4 : 1,
      scale,
      shift,
    });
  }
  const dk = [...tensors.keys()].find((n) => n.endsWith("/kernel") && !n.startsWith("crepe_conv"))!;
  const db = dk.replace("/kernel", "/bias");
  const kd = get(dk); // [256, 360]
  const dense = new Float32Array(360 * 256);
  for (let i = 0; i < 256; i++)
    for (let o = 0; o < 360; o++) dense[o * 256 + i] = kd.data[i * 360 + o];
  crepeModel = { convs, dense, denseBias: get(db).data };
  return crepeModel;
}

/** Conv (TF "same" padding) + ReLU + BN + max-pool 2; input/output [time][channel]. */
function convLayer(c: Conv, x: Float32Array, len: number): { y: Float32Array; len: number } {
  const outLen = Math.ceil(len / c.stride);
  const padTotal = Math.max(0, (outLen - 1) * c.stride + c.k - len);
  const padBefore = Math.floor(padTotal / 2);
  const pooled = Math.floor(outLen / 2);
  const y = new Float32Array(pooled * c.cout);
  const tmp = new Float32Array(outLen);
  const { k, cin } = c;
  for (let o = 0; o < c.cout; o++) {
    const wo = o * k * cin;
    for (let t = 0; t < outLen; t++) {
      const s0 = t * c.stride - padBefore;
      const kFrom = Math.max(0, -s0);
      const kTo = Math.min(k, len - s0);
      let acc = c.bias[o];
      if (cin === 1) {
        for (let j = kFrom; j < kTo; j++) acc += c.w[wo + j] * x[s0 + j];
      } else {
        for (let j = kFrom; j < kTo; j++) {
          const wb = wo + j * cin;
          const xb = (s0 + j) * cin;
          for (let i = 0; i < cin; i++) acc += c.w[wb + i] * x[xb + i];
        }
      }
      tmp[t] = (acc > 0 ? acc : 0) * c.scale[o] + c.shift[o];
    }
    for (let t = 0; t < pooled; t++) y[t * c.cout + o] = Math.max(tmp[2 * t], tmp[2 * t + 1]);
  }
  return { y, len: pooled };
}

function crepeFrame(m: Crepe, frame: Float32Array): Float32Array {
  let mean = 0;
  for (const v of frame) mean += v;
  mean /= frame.length;
  let sd = 0;
  for (const v of frame) sd += (v - mean) * (v - mean);
  sd = Math.max(1e-8, Math.sqrt(sd / frame.length));
  let x: Float32Array = frame.map((v) => (v - mean) / sd);
  let len = 1024;
  for (const c of m.convs) ({ y: x, len } = convLayer(c, x, len));
  const out = new Float32Array(360);
  for (let o = 0; o < 360; o++) {
    let acc = m.denseBias[o];
    const wo = o * 256;
    for (let i = 0; i < 256; i++) acc += m.dense[wo + i] * x[i];
    out[o] = 1 / (1 + Math.exp(-acc));
  }
  return out;
}

/** Windowed-sinc resampling to 16 kHz (Hann-windowed, cut-off 0.95 × 8 kHz). */
function resampleTo16k(x: Float32Array, sr: number): Float32Array {
  if (sr === 16000) return x;
  const ratio = 16000 / sr;
  const n = Math.floor(x.length * ratio);
  const y = new Float32Array(n);
  const fc = 0.95 * Math.min(1, ratio) * 0.5; // cycles per input sample
  const half = Math.ceil(16 / (2 * fc));
  for (let i = 0; i < n; i++) {
    const c = i / ratio;
    const c0 = Math.floor(c);
    let acc = 0;
    for (let j = c0 - half + 1; j <= c0 + half; j++) {
      if (j < 0 || j >= x.length) continue;
      const d = j - c;
      const win = 0.5 + 0.5 * Math.cos((Math.PI * d) / half);
      const s = d === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * d) / (Math.PI * d);
      acc += x[j] * s * win;
    }
    y[i] = acc;
  }
  return y;
}

/** CREPE activations (frames × 360), cached on disk by the hash of the input. */
const CREPE_STEP = Math.max(1, Number(process.env.CREPE_STEP ?? 1));

function crepeActivations(x: Float32Array, sr: number): Float32Array[] {
  const hash = createHash("sha1")
    .update(Buffer.from(x.buffer, x.byteOffset, x.byteLength))
    .update(String(sr))
    .update(CREPE_STEP > 1 ? `step${CREPE_STEP}` : "")
    .digest("hex");
  const cacheDir = path.join(CREPE_DIR, "cache");
  const file = path.join(cacheDir, `${hash}.bin`);
  const frames = Math.floor(x.length / (sr / 100));
  if (existsSync(file)) {
    const b = readFileSync(file);
    const all = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
    return Array.from({ length: frames }, (_, i) => all.subarray(i * 360, (i + 1) * 360));
  }
  const m = loadCrepe();
  const y = resampleTo16k(x, sr);
  const all = new Float32Array(frames * 360);
  for (let i = 0; i < frames; i++) {
    // CREPE_STEP > 1: run the model every N frames and hold the activation between (confirmation runs).
    if (i % CREPE_STEP !== 0) {
      all.copyWithin(i * 360, (i - 1) * 360, i * 360);
      continue;
    }
    const centre = i * 160;
    // CREPE pads the signal by half a window (centred frames).
    const f = new Float32Array(1024);
    for (let j = 0; j < 1024; j++) {
      const s = centre - 512 + j;
      f[j] = s >= 0 && s < y.length ? y[s] : 0;
    }
    all.set(crepeFrame(m, f), i * 360);
  }
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(file, Buffer.from(all.buffer));
  return Array.from({ length: frames }, (_, i) => all.subarray(i * 360, (i + 1) * 360));
}

const CENTS = Float64Array.from({ length: 360 }, (_, i) => 1997.3794084376191 + (7180 * i) / 359);

/** CREPE's local weighted average around the argmax (±4 bins). */
function crepeDecode(a: Float32Array): { f0: number; conf: number } {
  let c = 0;
  for (let i = 1; i < 360; i++) if (a[i] > a[c]) c = i;
  let s = 0;
  let w = 0;
  for (let i = Math.max(0, c - 4); i < Math.min(360, c + 5); i++) {
    s += a[i] * CENTS[i];
    w += a[i];
  }
  return { f0: 10 * Math.pow(2, s / w / 1200), conf: a[c] };
}

const crepe =
  (confidence: number, viterbi = false): PitchMethod =>
  (x, sr) => {
    const act = crepeActivations(x, sr);
    if (viterbi) return crepeViterbi(act, confidence);
    return Float32Array.from(act, (a) => {
      const { f0, conf } = crepeDecode(a);
      return conf >= confidence && f0 >= MIN_HZ * 0.9 && f0 <= MAX_HZ * 1.1 ? f0 : 0;
    });
  };

/**
 * CREPE's own smoothing (crepe.core.to_viterbi_cents): a Viterbi over the 360
 * bins with transitions decaying linearly to 0 at 12 bins (2.4 semitones),
 * observations = normalised activations; voicing stays the max activation.
 * Offline (whole excerpt).
 */
function crepeViterbi(act: Float32Array[], confidence: number): Float32Array {
  const T = act.length;
  const B = 12;
  const lt = new Float64Array(2 * B + 1);
  let z = 0;
  for (let d = -B; d <= B; d++) z += Math.max(0, B - Math.abs(d));
  for (let d = -B; d <= B; d++) lt[d + B] = Math.log(Math.max(1e-12, (B - Math.abs(d)) / z));
  let score = new Float64Array(360);
  const back: Int16Array[] = [];
  for (let t = 0; t < T; t++) {
    let s = 0;
    for (const v of act[t]) s += v;
    const next = new Float64Array(360);
    const bp = new Int16Array(360);
    for (let k = 0; k < 360; k++) {
      let best = -Infinity;
      let arg = k;
      if (t > 0) {
        for (let j = Math.max(0, k - B); j <= Math.min(359, k + B); j++) {
          const v = score[j] + lt[j - k + B];
          if (v > best) {
            best = v;
            arg = j;
          }
        }
      } else best = 0;
      next[k] = best + Math.log(Math.max(1e-12, act[t][k] / Math.max(1e-12, s)));
      bp[k] = arg;
    }
    let m = -Infinity;
    for (const v of next) m = Math.max(m, v);
    for (let k = 0; k < 360; k++) next[k] -= m;
    score = next;
    back.push(bp);
  }
  let s = 0;
  for (let k = 1; k < 360; k++) if (score[k] > score[s]) s = k;
  const path_ = new Int32Array(T);
  for (let t = T - 1; t >= 0; t--) {
    path_[t] = s;
    s = back[t][s];
  }
  const out = new Float32Array(T);
  for (let t = 0; t < T; t++) {
    const a = act[t];
    const c = path_[t];
    let sum = 0;
    let w = 0;
    for (let i = Math.max(0, c - 4); i < Math.min(360, c + 5); i++) {
      sum += a[i] * CENTS[i];
      w += a[i];
    }
    let mx = 0;
    for (const v of a) mx = Math.max(mx, v);
    const f0 = 10 * Math.pow(2, sum / w / 1200);
    out[t] = mx >= confidence && f0 >= MIN_HZ * 0.9 && f0 <= MAX_HZ * 1.1 ? f0 : 0;
  }
  return out;
}

export const METHODS: Record<string, PitchMethod> = {
  "YIN 0.15": yin(0.15),
  "YIN 0.15 w4096": yin(0.15, 4096),
  "YIN 0.30": yin(0.3),
  "YIN 0.30 + MPM octave check": yinMpm(0.3, 0.8),
  "YIN 0.30 + MPM refine": refined(yin(0.3)),
  "pYIN offline": pyin(),
  "pYIN lag 50 ms": pyin({ lag: 5 }),
  "pYIN causal (lag 0)": pyin({ lag: 0 }),
  "pYIN beta(3,17)": pyin({ a: 3, b: 17 }),
  "pYIN trust 0.3": pyin({ trust: 0.3 }),
  "CREPE tiny (conf 0.5)": crepe(0.5),
  "CREPE tiny Viterbi (conf 0.5)": crepe(0.5, true),
  "CREPE tiny (conf 0.6) + MPM refine": refined(crepe(0.6)),
  "CREPE tiny (conf 0.7) + MPM refine": refined(crepe(0.7)),
};

// Exposed for the variants below and scratch scripts.
export const _internals = { yin, yinMpm, pyin, crepe, refined, yinFrame, track };
