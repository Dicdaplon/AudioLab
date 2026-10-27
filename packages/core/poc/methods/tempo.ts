/**
 * Tempo proof-of-concept methods. All of them share one onset-strength
 * novelty curve (log-compressed spectral flux, 10 ms hop, frames ending at
 * their time stamp) and read a tempo once a second from 8 s on, from the
 * novelty frames heard so far (causal).
 *
 *   ellis    autocorrelation × log-Gaussian prior (Ellis 2007)
 *   pt       generalised autocorrelation, harmonic enhancement, pulse-train
 *            cross-correlation (Percival & Tzanetakis 2014)
 *   tgram    Fourier tempogram (Grosche & Müller 2011) + causal HMM filter
 *            in log-tempo for continuity
 */
import { fftInPlace } from "../../src/analysis/fft";
import { stft } from "../dsp";
import type { TempoMethod } from "../evaluate";

// ── Novelty ────────────────────────────────────────────────────────────

export interface NoveltyOpts {
  /** Flux band, Hz. */
  lo: number;
  hi: number;
  /** Log compression γ on window-normalised magnitudes. */
  gamma: number;
  /** Subtract a causal moving mean over this many seconds (0 = off), then half-wave rectify. */
  localMean: number;
}

const NOV: NoveltyOpts = { lo: 30, hi: 8000, gamma: 100, localMean: 0.5 };

interface Novelty {
  o: Float32Array;
  /** Frames per second. */
  fr: number;
  /** End time of frame 0, s. */
  t0: number;
}

function novelty(x: Float32Array, sr: number, opts: Partial<NoveltyOpts> = {}): Novelty {
  const { lo, hi, gamma, localMean } = { ...NOV, ...opts };
  const fftSize = sr > 32_000 ? 2048 : 1024;
  const hop = Math.round(sr / 100);
  const s = stft(x, sr, fftSize, hop);
  const k0 = Math.max(1, Math.floor(lo / s.binHz));
  const k1 = Math.min(fftSize / 2 - 1, Math.ceil(hi / s.binHz));
  const norm = 4 / fftSize;
  const o = new Float32Array(s.mag.length);
  let prev: Float32Array | null = null;
  for (let f = 0; f < s.mag.length; f++) {
    const m = s.mag[f];
    const cur = new Float32Array(k1 - k0 + 1);
    for (let k = k0; k <= k1; k++) cur[k - k0] = Math.log1p(gamma * norm * m[k]);
    if (prev) {
      let d = 0;
      for (let k = 0; k < cur.length; k++) d += Math.max(0, cur[k] - prev[k]);
      o[f] = d;
    }
    prev = cur;
  }
  const fr = sr / hop;
  if (localMean > 0) {
    const n = Math.max(1, Math.round(localMean * fr));
    const out = new Float32Array(o.length);
    let acc = 0;
    for (let i = 0; i < o.length; i++) {
      acc += o[i];
      if (i >= n) acc -= o[i - n];
      out[i] = Math.max(0, o[i] - acc / Math.min(n, i + 1));
    }
    return { o: out, fr, t0: fftSize / sr };
  }
  return { o, fr, t0: fftSize / sr };
}

/**
 * One reading a second from 8 s on: `estimate` sees the last `window`
 * seconds of novelty whose frames end at or before the reading time.
 */
function readings(
  x: Float32Array,
  sr: number,
  nov: Novelty,
  window: number,
  estimate: (w: Float32Array) => number,
): number[] {
  const out: number[] = [];
  const W = Math.round(window * nov.fr);
  for (let t = 8; t <= x.length / sr + 1e-9; t++) {
    const last = Math.floor((t - nov.t0) * nov.fr + 1e-6); // last frame index with time ≤ t
    const end = Math.min(nov.o.length, last + 1);
    const start = Math.max(0, end - W);
    out.push(estimate(nov.o.subarray(start, end)));
  }
  return out;
}

// ── Shared pieces ──────────────────────────────────────────────────────

const MIN_BPM = 40;
const MAX_BPM = 240;

/** Log-Gaussian tempo prior (Ellis 2007): centre in BPM, width in octaves. */
const prior = (bpm: number, centre: number, sigma: number) => {
  const z = Math.log2(bpm / centre) / sigma;
  return Math.exp(-0.5 * z * z);
};

function centred(w: Float32Array): Float64Array {
  let m = 0;
  for (const v of w) m += v;
  m /= w.length || 1;
  return Float64Array.from(w, (v) => v - m);
}

/** Plain autocorrelation r[τ] for τ in [0, maxLag] (biased, normalised by r[0]). */
function acf(w: Float32Array, maxLag: number): Float64Array {
  const c = centred(w);
  const r = new Float64Array(maxLag + 1);
  for (let l = 0; l <= maxLag; l++) {
    let s = 0;
    for (let i = l; i < c.length; i++) s += c[i] * c[i - l];
    r[l] = s;
  }
  if (r[0] > 0) for (let l = maxLag; l >= 0; l--) r[l] /= r[0];
  return r;
}

/** Generalised autocorrelation: IFFT(|FFT(x)|^p), zero-padded (no circular wrap). */
function gacf(w: Float32Array, p: number): Float64Array {
  const c = centred(w);
  let n = 2;
  while (n < 2 * c.length) n <<= 1;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  re.set(c);
  fftInPlace(re, im);
  for (let k = 0; k < n; k++) {
    re[k] = Math.pow(re[k] * re[k] + im[k] * im[k], p / 2);
    im[k] = 0;
  }
  fftInPlace(re, im); // real & even → forward FFT = n · inverse
  const r = new Float64Array(c.length);
  for (let l = 0; l < c.length; l++) r[l] = re[l] / n;
  if (r[0] > 0) for (let l = c.length - 1; l >= 0; l--) r[l] /= r[0];
  return r;
}

/** Parabolic interpolation around index i of y. */
function parabolic(y: ArrayLike<number>, i: number): number {
  if (i <= 0 || i >= y.length - 1) return i;
  const a = y[i - 1];
  const b = y[i];
  const c = y[i + 1];
  const d = a - 2 * b + c;
  return d < 0 ? i + (0.5 * (a - c)) / d : i;
}

// ── 1. Ellis 2007: ACF × prior ─────────────────────────────────────────

interface EllisOpts {
  window: number;
  centre: number;
  sigma: number;
  /** Exponential smoothing of the ACF across readings (0 = off). */
  smooth: number;
  /** Harmonic enhancement weight: r(τ) + h·r(2τ) + h·r(4τ)/2 (0 = off). */
  harmonic: number;
  nov: Partial<NoveltyOpts>;
}

const ellis =
  (o: Partial<EllisOpts> = {}): TempoMethod =>
  (x, sr) => {
    const { window, centre, sigma, smooth, harmonic, nov } = {
      window: 8,
      centre: 120,
      sigma: 1.4,
      smooth: 0,
      harmonic: 0,
      nov: {},
      ...o,
    };
    const N = novelty(x, sr, nov);
    const minLag = Math.floor((60 * N.fr) / MAX_BPM);
    const maxLag = Math.ceil((60 * N.fr) / MIN_BPM);
    const span = harmonic > 0 ? 4 * maxLag + 4 : maxLag + 1;
    let avg: Float64Array | null = null;
    return readings(x, sr, N, window, (w) => {
      if (w.length < maxLag + 2) return NaN;
      let r = acf(w, Math.min(span, w.length - 1));
      if (smooth > 0) {
        if (!avg || avg.length !== r.length) avg = Float64Array.from(r);
        else for (let l = 0; l < r.length; l++) avg[l] = smooth * avg[l] + (1 - smooth) * r[l];
        r = avg;
      }
      if (harmonic > 0) {
        const src = r;
        const at = (l: number) => (l < src.length ? Math.max(0, src[l]) : 0);
        const h = new Float64Array(maxLag + 2);
        for (let l = 0; l <= maxLag + 1; l++) {
          h[l] = at(l) + harmonic * at(2 * l) + (harmonic / 2) * at(4 * l);
        }
        r = h;
      }
      const s = new Float64Array(maxLag + 2);
      let best = -1;
      for (let l = minLag; l <= maxLag; l++) {
        s[l] = Math.max(0, r[l]) * prior((60 * N.fr) / l, centre, sigma);
        if (best < 0 || s[l] > s[best]) best = l;
      }
      return s[best] > 0 ? (60 * N.fr) / parabolic(s, best) : NaN;
    });
  };

// ── 2. Percival & Tzanetakis 2014 ──────────────────────────────────────

interface PtOpts {
  window: number;
  /** Candidate BPM range (P&T: 50–210). */
  lo: number;
  hi: number;
  candidates: number;
  /** Prior on the final choice (0 width = none). */
  centre: number;
  sigma: number;
  /** Accumulate candidate scores across readings (Gaussian-smeared histogram), decay per reading. */
  accumulate: number;
  nov: Partial<NoveltyOpts>;
}

/** Score of a candidate lag: cross-correlation with pulse trains over all phases (P&T §III-C). */
function pulseScores(w: Float32Array, lag: number): { max: number; variance: number } {
  const n = w.length;
  const L = Math.round(lag);
  const vals: number[] = [];
  for (let phi = 0; phi < L; phi++) {
    let s = 0;
    // Four beats at τ (weight 1), at 2τ (0.5) and at 1.5τ (0.5), counted back from the end (most recent audio).
    for (let b = 0; b < 4; b++) {
      const i1 = n - 1 - phi - Math.round(b * lag);
      const i2 = n - 1 - phi - Math.round(2 * b * lag);
      const i3 = n - 1 - phi - Math.round(1.5 * b * lag);
      if (i1 >= 0) s += w[i1];
      if (i2 >= 0) s += 0.5 * w[i2];
      if (i3 >= 0) s += 0.5 * w[i3];
    }
    vals.push(s);
  }
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  return { max: Math.max(...vals), variance };
}

const pt =
  (o: Partial<PtOpts> = {}): TempoMethod =>
  (x, sr) => {
    const { window, lo, hi, candidates, centre, sigma, accumulate, nov } = {
      window: 8,
      lo: 50,
      hi: 210,
      candidates: 10,
      centre: 120,
      sigma: 0,
      accumulate: 0,
      nov: {},
      ...o,
    };
    const N = novelty(x, sr, nov);
    const minLag = Math.floor((60 * N.fr) / hi);
    const maxLag = Math.ceil((60 * N.fr) / lo);
    // Histogram over BPM (1 BPM bins) for the accumulator.
    const hist = new Float64Array(MAX_BPM + 1);
    return readings(x, sr, N, window, (w) => {
      if (w.length < maxLag + 2) return NaN;
      const r = gacf(w, 0.5);
      // Harmonic enhancement: EA(τ) = A(τ) + A(2τ) + A(4τ).
      const ea = new Float64Array(maxLag + 2);
      for (let l = minLag; l <= maxLag + 1; l++) {
        ea[l] = r[l] + (2 * l < r.length ? r[2 * l] : 0) + (4 * l < r.length ? r[4 * l] : 0);
      }
      // Top peaks.
      const peaks: number[] = [];
      for (let l = minLag + 1; l <= maxLag; l++) {
        if (ea[l] > ea[l - 1] && ea[l] >= ea[l + 1]) peaks.push(l);
      }
      peaks.sort((a, b) => ea[b] - ea[a]);
      const cand = peaks.slice(0, candidates).map((l) => parabolic(ea, l));
      if (!cand.length) return NaN;
      const sc = cand.map((l) => pulseScores(w, l));
      const sumMax = sc.reduce((a, b) => a + b.max, 0) || 1;
      const sumVar = sc.reduce((a, b) => a + b.variance, 0) || 1;
      const score = sc.map(
        (s, i) =>
          (s.max / sumMax + s.variance / sumVar) *
          (sigma > 0 ? prior((60 * N.fr) / cand[i], centre, sigma) : 1),
      );
      if (accumulate > 0) {
        for (let b = 0; b < hist.length; b++) hist[b] *= accumulate;
        cand.forEach((l, i) => {
          const bpm = (60 * N.fr) / l;
          for (let b = Math.max(0, Math.floor(bpm - 6)); b <= Math.min(MAX_BPM, bpm + 6); b++) {
            hist[b] += score[i] * Math.exp(-0.5 * ((b - bpm) / 2) ** 2);
          }
        });
        let best = 0;
        for (let b = 1; b < hist.length; b++) if (hist[b] > hist[best]) best = b;
        return parabolic(hist, best);
      }
      let best = 0;
      for (let i = 1; i < cand.length; i++) if (score[i] > score[best]) best = i;
      return (60 * N.fr) / cand[best];
    });
  };

// ── 3. Fourier tempogram + causal HMM (Grosche & Müller 2011) ──────────

interface TgramOpts {
  window: number;
  centre: number;
  sigma: number;
  /** HMM transition width in octaves per reading (0 = no continuity: frame-wise argmax). */
  hmm: number;
  /** Exponential smoothing of the tempogram column (0 = off), instead of / with the HMM. */
  smooth: number;
  /** Add the tempogram at 2× and ½× (harmonic sum, weight). */
  harmonic: number;
  nov: Partial<NoveltyOpts>;
}

const BPM_STEPS = 64; // per octave
const GRID: number[] = [];
for (let b = MIN_BPM; b <= MAX_BPM; b *= Math.pow(2, 1 / BPM_STEPS)) GRID.push(b);

/** |Σ o[n] w[n] e^{−2πi f n}| over the BPM grid (Hann-windowed, mean removed). */
function tempogramColumn(w: Float32Array, fr: number): Float64Array {
  const c = centred(w);
  const n = c.length;
  for (let i = 0; i < n; i++) c[i] *= 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  const out = new Float64Array(GRID.length);
  for (let g = 0; g < GRID.length; g++) {
    const omega = (2 * Math.PI * GRID[g]) / 60 / fr;
    // Recurrence for cos/sin to keep it cheap.
    const cw = Math.cos(omega);
    const sw = Math.sin(omega);
    let cr = 1;
    let ci = 0;
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      re += c[i] * cr;
      im -= c[i] * ci;
      const t = cr * cw - ci * sw;
      ci = cr * sw + ci * cw;
      cr = t;
    }
    out[g] = Math.hypot(re, im);
  }
  return out;
}

const tgram =
  (o: Partial<TgramOpts> = {}): TempoMethod =>
  (x, sr) => {
    const { window, centre, sigma, hmm, smooth, harmonic, nov } = {
      window: 8,
      centre: 120,
      sigma: 1.4,
      hmm: 0.1,
      smooth: 0,
      harmonic: 0,
      nov: {},
      ...o,
    };
    const N = novelty(x, sr, nov);
    const G = GRID.length;
    const pri = GRID.map((b) => prior(b, centre, sigma));
    // Transition kernel in grid steps.
    const sd = hmm * BPM_STEPS;
    const half = Math.ceil(3 * sd);
    const kern: number[] = [];
    for (let d = -half; d <= half; d++) kern.push(sd > 0 ? Math.exp(-0.5 * (d / sd) ** 2) : 1);
    let belief: Float64Array | null = null;
    let smoothed: Float64Array | null = null;
    return readings(x, sr, N, window, (w) => {
      if (w.length < 2 * N.fr) return NaN;
      let col = tempogramColumn(w, N.fr);
      if (harmonic > 0) {
        const h = new Float64Array(G);
        for (let g = 0; g < G; g++) {
          // Sub-harmonic sum: a beat rate is backed by its own subdivisions (2×, 4×).
          h[g] = col[g];
          if (g + BPM_STEPS < G) h[g] += harmonic * col[g + BPM_STEPS];
          if (g + 2 * BPM_STEPS < G) h[g] += (harmonic / 2) * col[g + 2 * BPM_STEPS];
        }
        col = h;
      }
      if (smooth > 0) {
        if (!smoothed) smoothed = col;
        else for (let g = 0; g < G; g++) smoothed[g] = smooth * smoothed[g] + (1 - smooth) * col[g];
        col = Float64Array.from(smoothed);
      }
      // Emission: column normalised to a max of 1, sharpened, times the prior.
      let mx = 0;
      for (const v of col) mx = Math.max(mx, v);
      if (!(mx > 0)) return NaN;
      const em = new Float64Array(G);
      for (let g = 0; g < G; g++) em[g] = Math.pow(col[g] / mx, 4) * pri[g] + 1e-6;
      if (hmm > 0) {
        let next: Float64Array;
        if (!belief) next = em;
        else {
          next = new Float64Array(G);
          for (let g = 0; g < G; g++) {
            let s = 0;
            for (let d = -half; d <= half; d++) {
              const j = g + d;
              if (j >= 0 && j < G) s += belief[j] * kern[d + half];
            }
            next[g] = (s + 1e-3) * em[g]; // small floor: a tempo change is always possible
          }
        }
        let tot = 0;
        for (const v of next) tot += v;
        for (let g = 0; g < G; g++) next[g] /= tot;
        belief = next;
      } else belief = em;
      let best = 0;
      for (let g = 1; g < G; g++) if (belief[g] > belief[best]) best = g;
      const fb = parabolic(belief, best);
      return MIN_BPM * Math.pow(2, fb / BPM_STEPS);
    });
  };

/**
 * The three ideas as published (Ellis prior σ = 1.4 oct, P&T without the
 * final octave classifier), then the variants kept after tuning ON THIS POC
 * SET (13 items, 68–200 BPM): prior width, harmonic enhancement, window,
 * continuity. The narrow priors (σ 0.7) are fitted to that tempo range.
 */
export const METHODS: Record<string, TempoMethod> = {
  "ellis ACF+prior 8s": ellis(),
  "P&T GACF+pulses 8s": pt(),
  "tempogram 8s, no continuity": tgram({ hmm: 0 }),
  "tempogram 8s + HMM": tgram(),
  // Variants (tuned here).
  "ellis s0.7": ellis({ sigma: 0.7 }),
  "ellis s0.7 harm1": ellis({ sigma: 0.7, harmonic: 1 }),
  "ellis s0.7 harm1 w10": ellis({ sigma: 0.7, harmonic: 1, window: 10 }),
  "ellis s0.7 harm1 ema0.7": ellis({ sigma: 0.7, harmonic: 1, smooth: 0.7 }),
  "ellis s1.0 harm1 ema0.7": ellis({ sigma: 1.0, harmonic: 1, smooth: 0.7 }),
  "P&T s0.7 acc0.8": pt({ sigma: 0.7, accumulate: 0.8 }),
  "P&T s1.0 acc0.8": pt({ sigma: 1.0, accumulate: 0.8 }),
  "tgram s0.7 harm1": tgram({ hmm: 0, sigma: 0.7, harmonic: 1 }),
  "tgram s0.7 harm1 HMM": tgram({ sigma: 0.7, harmonic: 1 }),
};
