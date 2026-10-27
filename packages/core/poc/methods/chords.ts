/**
 * Chord POCs. Every variant goes through the same decoder (24 triad
 * templates, cosine similarity, then the SDK's 1 s window or the chord HMM),
 * so that only the front-end (the chroma) or the decision changes:
 *
 *   control         Hann STFT 16384 / 10 fps, nearest-semitone chroma (≈ SDK)
 *   glog            Gaussian binning + log compression (SDK opt-in)
 *   HPSS            harmonic part only (FitzGerald 2010), causal median filters
 *   denoise         spectral subtraction on a minimum-statistics noise estimate
 *                   (Boll 1979; Martin 2001)
 *   bass            separate bass chroma (55–200 Hz) pulling the root
 *                   (Mauch & Dixon 2010)
 *   NNLS            note activations by non-negative least squares on a
 *                   log-frequency spectrum (Mauch & Dixon, ISMIR 2010)
 *   VQT             variable-Q transform computed directly in time (Brown
 *                   1991; Schörkhuber et al. 2014)
 *   beat            chroma averaged since the last beat (Bello & Pickens 2005;
 *                   beats from the GuitarSet annotation, as a metronome)
 *   level N         the HMM's "no chord" from the signal level against a
 *                   running noise floor instead of the chroma flatness
 */
import { GAUSSIAN_LOG_CHROMA, spectrumToChroma } from "../../src/analysis/chroma";
import { ChordHmm, selfTransitionFor } from "../../src/analysis/chordHmm";
import { softmax } from "../../src/analysis/math";
import type { ChordMethod, ShownChord } from "../evaluate";
import type { PocItem } from "../data";
import { fold, hann, hzOf, l1, midiOf, stft } from "../dsp";

const FPS = 10;

export interface Feat {
  treble: Float32Array;
  bass: Float32Array | null;
  /** Mean in-band magnitude in dB (relative), for level-based decisions. */
  levelDb: number;
}

export interface Features {
  times: number[];
  feats: Feat[];
}

// --- templates and scoring ---------------------------------------------------------

const TRIADS: ShownChord[] = [];
const TEMPLATES: Float32Array[] = [];
for (const quality of ["maj", "min"] as const) {
  for (let root = 0; root < 12; root++) {
    const t = new Float32Array(12);
    for (const i of quality === "maj" ? [0, 4, 7] : [0, 3, 7]) t[(root + i) % 12] = 1;
    TRIADS.push({ root, quality });
    TEMPLATES.push(t);
  }
}

function cosine(a: Float32Array, b: Float32Array): number {
  let d = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < 12; i++) {
    d += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na > 0 && nb > 0 ? d / Math.sqrt(na * nb) : 0;
}

const FLAT = new Float32Array(12).fill(1);

/** Template scores (24), with the bass pulling chords whose root it holds. */
function scores(f: Feat, lambdaBass: number): number[] {
  let bmax = 0;
  if (f.bass) for (const v of f.bass) bmax = Math.max(bmax, v);
  return TEMPLATES.map((t, i) => {
    const bassTerm = f.bass && bmax > 0 ? lambdaBass * (f.bass[TRIADS[i].root] / bmax) : 0;
    return cosine(f.treble, t) + bassTerm;
  });
}

function mean(feats: Feat[]): Feat {
  const treble = new Float32Array(12);
  const bass = feats[0]?.bass ? new Float32Array(12) : null;
  for (const f of feats) {
    for (let i = 0; i < 12; i++) {
      treble[i] += f.treble[i] / feats.length;
      if (bass && f.bass) bass[i] += f.bass[i] / feats.length;
    }
  }
  return { treble, bass, levelDb: feats.at(-1)?.levelDb ?? -100 };
}

export interface DecodeOptions {
  mode: "window" | "hmm" | "beat";
  lambdaBass?: number;
  /** HMM "no chord" from chroma flatness (SDK) or from the level against a running floor. */
  noChord?: "flat" | "level" | "level+flat" | "none";
  meanChordSeconds?: number;
  kappa?: number;
  beats?: number[];
}

export function decode(
  features: Features,
  opts: DecodeOptions,
): { time: number; chord: ShownChord | null }[] {
  const { times, feats } = features;
  const lambda = opts.lambdaBass ?? 0;
  const silent = (f: Feat) => f.treble.every((v) => v === 0);
  if (opts.mode === "window" || opts.mode === "beat") {
    let beatIdx = 0;
    return feats.map((_, i) => {
      let from = Math.max(0, i - (FPS - 1));
      if (opts.mode === "beat" && opts.beats?.length) {
        while (beatIdx + 1 < opts.beats.length && opts.beats[beatIdx + 1] <= times[i]) beatIdx++;
        const beatFrame = times.findIndex((t) => t >= opts.beats![beatIdx]);
        // Since the last beat, but at least 3 frames and at most 1 s.
        from = Math.max(Math.max(0, i - (FPS - 1)), Math.min(beatFrame < 0 ? 0 : beatFrame, i - 2));
      }
      const m = mean(feats.slice(from, i + 1).filter((x) => !silent(x)));
      if (silent(m)) return { time: times[i], chord: null };
      const s = scores(m, lambda);
      let best = 0;
      for (let k = 1; k < 24; k++) if (s[k] > s[best]) best = k;
      return { time: times[i], chord: TRIADS[best] };
    });
  }
  const hmm = new ChordHmm({
    states: 25,
    selfTransition: selfTransitionFor(opts.meanChordSeconds ?? 1, FPS),
    lagFrames: 0,
    emissionExponent: opts.kappa ?? 0.6,
  });
  const floorWindow: number[] = [];
  return feats.map((f, i) => {
    floorWindow.push(f.levelDb);
    if (floorWindow.length > 10 * FPS) floorWindow.shift();
    const floor = Math.min(...floorWindow);
    let e: number[];
    const flatness = cosine(f.treble, FLAT);
    const quiet =
      floorWindow.length >= 10 &&
      ((opts.noChord === "level" && f.levelDb < floor + 6) ||
        (opts.noChord === "level+flat" && f.levelDb < floor + 3 && flatness > 0.8));
    if (silent(f) || quiet) {
      e = Array.from({ length: 25 }, (_, k) => (k === 24 ? 1 : 0));
    } else {
      const s = scores(f, lambda);
      const best = Math.max(...s);
      const nScore =
        opts.noChord === "none"
          ? -Infinity
          : opts.noChord === "level"
            ? best - 0.3
            : best + 2 * (flatness - 0.95);
      e = softmax([...s, nScore], 0.1);
    }
    const post = hmm.push(e);
    let arg = 0;
    for (let k = 1; k < 25; k++) if (post[k] > post[arg]) arg = k;
    return { time: times[i], chord: arg === 24 ? null : TRIADS[arg] };
  });
}

// --- front-ends ---------------------------------------------------------------------

const FFT = 16_384;

function levelDb(mag: Float32Array, binHz: number): number {
  let s = 0;
  let n = 0;
  for (let k = Math.ceil(55 / binHz); k < Math.min(mag.length, 5000 / binHz); k++) {
    s += mag[k];
    n++;
  }
  return 20 * Math.log10(s / Math.max(1, n) + 1e-12);
}

type Chromatise = (
  mag: Float32Array,
  sr: number,
) => { treble: Float32Array; bass: Float32Array | null };

const nearest: Chromatise = (mag, sr) => ({
  treble: spectrumToChroma(mag, { sampleRate: sr }),
  bass: null,
});
const glog: Chromatise = (mag, sr) => ({
  treble: spectrumToChroma(mag, { sampleRate: sr, ...GAUSSIAN_LOG_CHROMA }),
  bass: null,
});
const glogBass: Chromatise = (mag, sr) => ({
  treble: spectrumToChroma(mag, { sampleRate: sr, minFreq: 200, ...GAUSSIAN_LOG_CHROMA }),
  bass: spectrumToChroma(mag, {
    sampleRate: sr,
    minFreq: 55,
    maxFreq: 200,
    ...GAUSSIAN_LOG_CHROMA,
  }),
});

/** A 10 fps front-end from a magnitude-frame transform. */
function fromStft(
  chromatise: Chromatise,
  transform?: (frames: Float32Array[], binHz: number) => Float32Array[],
) {
  return (x: Float32Array, sr: number): Features => {
    const s = stft(x, sr, FFT, Math.round(sr / FPS));
    const mags = transform ? transform(s.mag, s.binHz) : s.mag;
    return {
      times: s.times,
      feats: mags.map((m, i) => ({ ...chromatise(m, sr), levelDb: levelDb(s.mag[i], s.binHz) })),
    };
  };
}

/**
 * Causal HPSS (FitzGerald 2010): harmonic = median over the last `timeFrames`
 * frames, percussive = median over `freqBins` bins of the current frame;
 * Wiener-like soft mask H²/(H²+P²). Runs at 20 fps, read at 10 fps.
 */
function hpssFront(chromatise: Chromatise, timeFrames = 9, freqBins = 17) {
  return (x: Float32Array, sr: number): Features => {
    const s = stft(x, sr, FFT, Math.round(sr / (2 * FPS)));
    const kMax = Math.min(FFT / 2, Math.ceil(5200 / s.binHz));
    const out: Feat[] = [];
    const times: number[] = [];
    const buf: number[] = [];
    for (let t = 1; t < s.mag.length; t += 2) {
      const m = s.mag[t];
      const h = new Float32Array(m.length);
      for (let k = 0; k < kMax; k++) {
        buf.length = 0;
        for (let u = Math.max(0, t - timeFrames + 1); u <= t; u++) buf.push(s.mag[u][k]);
        buf.sort((a, b) => a - b);
        const H = buf[buf.length >> 1];
        buf.length = 0;
        for (
          let j = Math.max(0, k - (freqBins >> 1));
          j <= Math.min(kMax - 1, k + (freqBins >> 1));
          j++
        )
          buf.push(m[j]);
        buf.sort((a, b) => a - b);
        const P = buf[buf.length >> 1];
        h[k] = (m[k] * (H * H)) / (H * H + P * P + 1e-12);
      }
      out.push({ ...chromatise(h, sr), levelDb: levelDb(m, s.binHz) });
      times.push(s.times[t]);
    }
    return { times, feats: out };
  };
}

/**
 * Spectral subtraction with a minimum-statistics noise estimate: the noise
 * power of each bin is the minimum of its smoothed power over the last
 * `seconds`; |Y|² = max(|X|² − α·N, β·|X|²).
 */
function denoise(alpha = 2, beta = 0.05, seconds = 6) {
  return (frames: Float32Array[], binHz: number): Float32Array[] => {
    const kMax = Math.min(frames[0]?.length ?? 0, Math.ceil(5200 / binHz));
    const smooth = new Float32Array(kMax);
    const history: Float32Array[] = [];
    return frames.map((m) => {
      const p = new Float32Array(kMax);
      for (let k = 0; k < kMax; k++) {
        p[k] = m[k] * m[k];
        smooth[k] = 0.7 * smooth[k] + 0.3 * p[k];
      }
      history.push(Float32Array.from(smooth));
      if (history.length > seconds * FPS) history.shift();
      const out = new Float32Array(m.length);
      for (let k = 0; k < kMax; k++) {
        let n = Infinity;
        for (const h of history) if (h[k] < n) n = h[k];
        out[k] = Math.sqrt(Math.max(p[k] - alpha * n, beta * p[k]));
      }
      return out;
    });
  };
}

// --- NNLS chroma ---------------------------------------------------------------------

const LOG_LO = 36; // C2
const LOG_HI = 100;
const PER = 3; // bins per semitone
const NOTES_LO = 40; // E2, the lowest guitar string
const NOTES_HI = 88;

let dictionary: Float32Array[] | null = null;
/** Note profiles on the log-frequency axis: partials h = 1..10 with amplitude s^(h−1). */
function nnlsDictionary(s = 0.7): Float32Array[] {
  if (dictionary) return dictionary;
  const nb = (LOG_HI - LOG_LO) * PER;
  dictionary = [];
  for (let n = NOTES_LO; n <= NOTES_HI; n++) {
    const col = new Float32Array(nb);
    for (let h = 1; h <= 10; h++) {
      const pos = (n + 12 * Math.log2(h) - LOG_LO) * PER;
      const i = Math.floor(pos);
      const frac = pos - i;
      const a = Math.pow(s, h - 1);
      if (i >= 0 && i < nb) col[i] += a * (1 - frac);
      if (i + 1 >= 0 && i + 1 < nb) col[i + 1] += a * frac;
    }
    let norm = 0;
    for (const v of col) norm += v * v;
    norm = Math.sqrt(norm);
    for (let i = 0; i < nb; i++) col[i] /= norm;
    dictionary.push(col);
  }
  return dictionary;
}

/** Log-frequency spectrum (3 bins/semitone) by interpolating the magnitude spectrum, then whitened. */
function logFreq(mag: Float32Array, binHz: number, whiten: boolean): Float32Array {
  const nb = (LOG_HI - LOG_LO) * PER;
  const y = new Float32Array(nb);
  for (let b = 0; b < nb; b++) {
    const f = hzOf(LOG_LO + b / PER) / binHz;
    const k = Math.floor(f);
    const frac = f - k;
    y[b] = (1 - frac) * (mag[k] ?? 0) + frac * (mag[k + 1] ?? 0);
  }
  if (!whiten) return y;
  // Subtract the running mean and divide by the running std over one octave (Mauch & Dixon 2010).
  const out = new Float32Array(nb);
  const half = 6 * PER;
  for (let b = 0; b < nb; b++) {
    let s = 0;
    let s2 = 0;
    let n = 0;
    for (let j = Math.max(0, b - half); j <= Math.min(nb - 1, b + half); j++) {
      s += y[j];
      s2 += y[j] * y[j];
      n++;
    }
    const m = s / n;
    const sd = Math.sqrt(Math.max(1e-12, s2 / n - m * m));
    out[b] = Math.max(0, (y[b] - m) / sd);
  }
  return out;
}

/** Non-negative activations by multiplicative updates (NNLS with a fixed dictionary). */
function nnls(x: Float32Array, W: Float32Array[], iterations = 40): Float32Array {
  const n = W.length;
  const h = new Float32Array(n);
  const wtx = new Float32Array(n);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let i = 0; i < x.length; i++) s += W[j][i] * x[i];
    wtx[j] = Math.max(0, s);
    h[j] = wtx[j];
  }
  const wh = new Float32Array(x.length);
  for (let it = 0; it < iterations; it++) {
    wh.fill(0);
    for (let j = 0; j < n; j++)
      if (h[j] > 0) for (let i = 0; i < x.length; i++) wh[i] += W[j][i] * h[j];
    for (let j = 0; j < n; j++) {
      let d = 0;
      for (let i = 0; i < x.length; i++) d += W[j][i] * wh[i];
      h[j] *= wtx[j] / (d + 1e-9);
    }
  }
  return h;
}

function nnlsChromatise(whiten: boolean, s = 0.7): Chromatise {
  return (mag, sr) => {
    const W = nnlsDictionary(s);
    const h = nnls(logFreq(mag, sr / FFT, whiten), W);
    const notes = new Float32Array(128);
    for (let j = 0; j < h.length; j++) notes[NOTES_LO + j] = h[j];
    const bassNotes = new Float32Array(128);
    for (let n = NOTES_LO; n < 55; n++) bassNotes[n] = notes[n];
    const trebleNotes = new Float32Array(128);
    for (let n = 48; n <= NOTES_HI; n++) trebleNotes[n] = notes[n];
    return { treble: l1(fold(trebleNotes)), bass: fold(bassNotes) };
  };
}

// --- VQT --------------------------------------------------------------------------------

interface Kernel {
  len: number;
  cos: Float32Array;
  sin: Float32Array;
  midi: number;
}
const kernelCache = new Map<string, Kernel[]>();

/** Variable-Q kernels, 24 bins/octave from E2 to ~4 kHz, bandwidth α·f + γ. */
function vqtKernels(sr: number, gamma: number): Kernel[] {
  const key = `${sr}|${gamma}`;
  let ks = kernelCache.get(key);
  if (ks) return ks;
  const alpha = Math.pow(2, 1 / 24) - 1;
  ks = [];
  for (let m = 40; m <= 98; m += 0.5) {
    const f = hzOf(m);
    const len = Math.min(Math.round((2 * sr) / (alpha * f + gamma)), Math.round(sr * 0.9));
    const w = hann(len);
    const c = new Float32Array(len);
    const s = new Float32Array(len);
    let norm = 0;
    for (let n = 0; n < len; n++) norm += w[n];
    for (let n = 0; n < len; n++) {
      c[n] = (w[n] * Math.cos((2 * Math.PI * f * n) / sr)) / norm;
      s[n] = (w[n] * Math.sin((2 * Math.PI * f * n) / sr)) / norm;
    }
    ks.push({ len, cos: c, sin: s, midi: m });
  }
  kernelCache.set(key, ks);
  return ks;
}

function vqtFront(gamma: number, logGain = 100) {
  return (x: Float32Array, sr: number): Features => {
    const ks = vqtKernels(sr, gamma);
    const hop = Math.round(sr / FPS);
    const times: number[] = [];
    const feats: Feat[] = [];
    for (let end = FFT; end <= x.length; end += hop) {
      const notes = new Float64Array(128);
      const bassNotes = new Float64Array(128);
      const mags: number[] = [];
      for (const k of ks) {
        let re = 0;
        let im = 0;
        const start = end - k.len;
        if (start < 0) {
          mags.push(0);
          continue;
        }
        for (let n = 0; n < k.len; n++) {
          re += x[start + n] * k.cos[n];
          im += x[start + n] * k.sin[n];
        }
        mags.push(re * re + im * im);
      }
      const peak = Math.max(...mags, 1e-20);
      ks.forEach((k, i) => {
        const v = Math.log1p((logGain * mags[i]) / peak);
        const n = Math.round(k.midi);
        // Quarter-tone bins: the on-semitone bin counts fully, the in-between one half to each side.
        const w = Math.abs(k.midi - n) < 0.01 ? 1 : 0.5;
        notes[Math.floor(k.midi)] += w * v;
        if (w < 1) notes[Math.ceil(k.midi)] += w * v;
        if (k.midi < 55) bassNotes[n] += v;
      });
      times.push(end / sr);
      const treble = fold(notes);
      feats.push({ treble: l1(treble), bass: fold(bassNotes), levelDb: 10 * Math.log10(peak) });
    }
    return { times, feats };
  };
}

// --- Basic Pitch (Bittner et al., ICASSP 2022) -------------------------------------------

/**
 * Note posteriors of Basic Pitch averaged over the last 100 ms at each
 * display frame, folded into a treble chroma (MIDI ≥ 48) and a bass chroma
 * (E2–F#3). The model also needs ~174 ms of look-ahead in streaming use.
 */
async function basicPitchFront(x: Float32Array, sr: number): Promise<Features> {
  const { basicPitchNotes } = await import("./basicPitch");
  const bp = await basicPitchNotes(x, sr);
  const times: number[] = [];
  const feats: Feat[] = [];
  for (let end = FFT; end <= x.length; end += Math.round(sr / FPS)) {
    const t = end / sr;
    const lo = Math.max(0, Math.ceil((t - 0.1) * bp.fps));
    const hi = Math.min(bp.notes.length - 1, Math.floor(t * bp.fps));
    const notes = new Float64Array(128);
    let total = 0;
    for (let n = lo; n <= hi; n++) {
      const row = bp.notes[n];
      for (let j = 0; j < row.length; j++) {
        notes[21 + j] += row[j];
        total += row[j];
      }
    }
    const treble = new Float64Array(128);
    const bass = new Float64Array(128);
    for (let m = 0; m < 128; m++) {
      if (m >= 48) treble[m] = notes[m];
      if (m >= 40 && m < 55) bass[m] = notes[m];
    }
    times.push(t);
    feats.push({
      treble: l1(fold(treble)),
      bass: fold(bass),
      levelDb: 10 * Math.log10(total + 1e-9),
    });
  }
  return { times, feats };
}

const asyncCache = new Map<string, Promise<Features>>();
function cachedAsync(name: string, front: (x: Float32Array, sr: number) => Promise<Features>) {
  return (x: Float32Array, sr: number): Promise<Features> => {
    const key = `${name}|${x.length}|${x[1000]}|${x[x.length >> 1]}`;
    let f = asyncCache.get(key);
    if (!f) {
      f = front(x, sr);
      asyncCache.set(key, f);
    }
    return f;
  };
}

// --- methods --------------------------------------------------------------------------

type Front = (x: Float32Array, sr: number) => Features;

const featureCache = new Map<string, Features>();
function cached(name: string, front: Front): (x: Float32Array, sr: number) => Features {
  return (x, sr) => {
    // Items are conditioned arrays: their identity is stable within a run.
    const key = `${name}|${x.length}|${x[1000]}|${x[x.length >> 1]}`;
    let f = featureCache.get(key);
    if (!f) {
      f = front(x, sr);
      featureCache.set(key, f);
    }
    return f;
  };
}

const method =
  (
    front: (x: Float32Array, sr: number) => Features | Promise<Features>,
    opts: Omit<DecodeOptions, "beats">,
  ): ChordMethod =>
  async (x, sr, item: PocItem) =>
    decode(await front(x, sr), { ...opts, beats: item.beats });

const F = {
  control: cached("control", fromStft(nearest)),
  glog: cached("glog", fromStft(glog)),
  glogBass: cached("glogBass", fromStft(glogBass)),
  hpss: cached("hpss", hpssFront(glog)),
  denoise: cached("denoise", fromStft(glog, denoise())),
  nnls: cached("nnls", fromStft(nnlsChromatise(true))),
  nnlsRaw: cached("nnlsRaw", fromStft(nnlsChromatise(false))),
  vqt0: cached("vqt0", vqtFront(0)),
  vqt20: cached("vqt20", vqtFront(20)),
  hpssNnls: cached("hpssNnls", hpssFront(nnlsChromatise(true))),
  basicPitch: cachedAsync("basicPitch", basicPitchFront),
};

export const METHODS: Record<string, ChordMethod> = {
  "control: nearest, window": method(F.control, { mode: "window" }),
  "control: glog, hmm": method(F.glog, { mode: "hmm" }),
  "glog, window": method(F.glog, { mode: "window" }),
  "HPSS + glog, hmm": method(F.hpss, { mode: "hmm" }),
  "HPSS + glog, window": method(F.hpss, { mode: "window" }),
  "denoise + glog, hmm": method(F.denoise, { mode: "hmm" }),
  "bass λ0.3, glog, hmm": method(F.glogBass, { mode: "hmm", lambdaBass: 0.3 }),
  "bass λ0.3, glog, window": method(F.glogBass, { mode: "window", lambdaBass: 0.3 }),
  "NNLS, hmm": method(F.nnls, { mode: "hmm" }),
  "NNLS + bass λ0.3, hmm": method(F.nnls, { mode: "hmm", lambdaBass: 0.3 }),
  "NNLS unwhitened, hmm": method(F.nnlsRaw, { mode: "hmm" }),
  "VQT γ=0 (CQT), hmm": method(F.vqt0, { mode: "hmm" }),
  "VQT γ=20 Hz, hmm": method(F.vqt20, { mode: "hmm" }),
  "beat-sync, glog": method(F.glog, { mode: "beat" }),
  "level N, glog, hmm": method(F.glog, { mode: "hmm", noChord: "level" }),
  "level+flat N, glog, hmm": method(F.glog, { mode: "hmm", noChord: "level+flat" }),
  "NNLS + bass λ0.15, hmm": method(F.nnls, { mode: "hmm", lambdaBass: 0.15 }),
  "NNLS + bass λ0.5, hmm": method(F.nnls, { mode: "hmm", lambdaBass: 0.5 }),
  "NNLS + bass λ0.3, hmm D=2": method(F.nnls, {
    mode: "hmm",
    lambdaBass: 0.3,
    meanChordSeconds: 2,
  }),
  "NNLS + bass λ0.3, window": method(F.nnls, { mode: "window", lambdaBass: 0.3 }),
  "HPSS → NNLS + bass λ0.3, hmm": method(F.hpssNnls, { mode: "hmm", lambdaBass: 0.3 }),
  "CQT + bass λ0.3, hmm": method(F.vqt0, { mode: "hmm", lambdaBass: 0.3 }),
  "Basic Pitch, hmm": method(F.basicPitch, { mode: "hmm" }),
  "Basic Pitch + bass λ0.3, hmm": method(F.basicPitch, { mode: "hmm", lambdaBass: 0.3 }),
  "Basic Pitch + bass λ0.3, window": method(F.basicPitch, { mode: "window", lambdaBass: 0.3 }),
  "Basic Pitch + bass λ0.3, hmm no N": method(F.basicPitch, {
    mode: "hmm",
    lambdaBass: 0.3,
    noChord: "none",
  }),
  "tune: CQT + bass λ0.5, hmm": method(F.vqt0, { mode: "hmm", lambdaBass: 0.5 }),
  "tune: CQT + bass λ0.2, hmm": method(F.vqt0, { mode: "hmm", lambdaBass: 0.2 }),
  "tune: CQT + bass λ0.3, hmm D=2": method(F.vqt0, {
    mode: "hmm",
    lambdaBass: 0.3,
    meanChordSeconds: 2,
  }),
  "tune: CQT + bass λ0.3, hmm no N": method(F.vqt0, {
    mode: "hmm",
    lambdaBass: 0.3,
    noChord: "none",
  }),
  "tune: CQT + bass λ0.3, window": method(F.vqt0, { mode: "window", lambdaBass: 0.3 }),
  "tune: glog + bass λ0.5, hmm": method(F.glogBass, { mode: "hmm", lambdaBass: 0.5 }),
  "tune: glog + bass λ0.2, hmm": method(F.glogBass, { mode: "hmm", lambdaBass: 0.2 }),
  "tune: glog + bass λ0.3, hmm no N": method(F.glogBass, {
    mode: "hmm",
    lambdaBass: 0.3,
    noChord: "none",
  }),
  "tune: Basic Pitch + bass λ0.5, hmm no N": method(F.basicPitch, {
    mode: "hmm",
    lambdaBass: 0.5,
    noChord: "none",
  }),
  "tune: Basic Pitch + bass λ0.15, hmm no N": method(F.basicPitch, {
    mode: "hmm",
    lambdaBass: 0.15,
    noChord: "none",
  }),
  "Basic Pitch + bass λ0.3, hmm no N D=2": method(F.basicPitch, {
    mode: "hmm",
    lambdaBass: 0.3,
    noChord: "none",
    meanChordSeconds: 2,
  }),
};

export { F as FRONTS, midiOf };
