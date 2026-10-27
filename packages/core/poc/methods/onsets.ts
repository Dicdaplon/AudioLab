/**
 * Onset detection POC: gate strictness, adaptive whitening, complex domain,
 * high-frequency content, against a plain log spectral flux and a
 * SuperFlux-like ODF, all with the same peak picker (poc/dsp.ts pickPeaks).
 * Notes and results: poc/notes/onsets.md.
 *
 * Frames are causal (each STFT frame ends at its time). pickPeaks returns
 * the frame index over the frame rate, i.e. the *start* of the frame
 * window; `offset` moves that to where an attack sits on average when the
 * ODF peaks (calibrated on the POC clean items, see the notes).
 */
import { BandLevelMeter } from "../../src/analysis/gate/bandLevelMeter";
import { AdaptiveNoiseGate } from "../../src/analysis/gate/noiseGate";
import { gateTuning } from "../../src/analysis/gate/strictness";
import { OnsetPipeline, type OnsetPipelineOptions } from "../../src/analysis/onset/onsetPipeline";
import { pushChunks } from "../../tests/helpers/onsets";
import { pickPeaks, stft, type Stft } from "../dsp";
import type { OnsetMethod } from "../evaluate";

// --- 1. the SDK pipeline with other gate settings ---------------------------------

export const sdk =
  (options: Omit<OnsetPipelineOptions, "sampleRate">): OnsetMethod =>
  (x, sr) => {
    const p = new OnsetPipeline({ sampleRate: sr, ...options });
    return pushChunks(x, (chunk, frame) => p.push(chunk, frame).onsets, [512]).map((o) => o.time);
  };

// --- ODFs on a causal STFT ------------------------------------------------------------

type Odf = (s: Stft) => Float32Array;

const hwr = (v: number) => (v > 0 ? v : 0);

/** Plain log spectral flux on linear bins: Σ_k HWR(log(1+λX[n]) − log(1+λX[n−1])). */
export const logFlux =
  (lambda = 1): Odf =>
  (s) => {
    const out = new Float32Array(s.mag.length);
    let prev: Float32Array | null = null;
    for (let n = 0; n < s.mag.length; n++) {
      const cur = s.mag[n].map((v) => Math.log1p(lambda * v));
      if (prev) {
        let sum = 0;
        for (let k = 1; k < cur.length; k++) sum += hwr(cur[k] - prev[k]);
        out[n] = sum;
      }
      prev = cur;
    }
    return out;
  };

/** Triangular log-frequency filterbank (bands per octave, fmin..fmax). */
function filterbank(bins: number, binHz: number, perOctave = 24, fmin = 30, fmax = 16000) {
  const centres: number[] = [];
  for (let f = fmin; f <= fmax; f *= Math.pow(2, 1 / perOctave)) {
    const b = Math.round(f / binHz);
    if (b < bins && b !== centres.at(-1)) centres.push(b);
  }
  const bands: { from: number; weights: Float32Array }[] = [];
  for (let i = 1; i < centres.length - 1; i++) {
    const [l, c, r] = [centres[i - 1], centres[i], centres[i + 1]];
    const w = new Float32Array(r - l + 1);
    for (let k = l; k <= r; k++)
      w[k - l] = k <= c ? (k - l + 1) / (c - l + 1) : (r - k + 1) / (r - c + 1);
    let sum = 0;
    for (const v of w) sum += v;
    bands.push({ from: l, weights: w.map((v) => v / sum) });
  }
  return bands;
}

/** SuperFlux-like: log filterbank, max filter (±1 band) on the reference μ frames back. */
export const superFlux =
  (mu = 2, lambda = 1): Odf =>
  (s) => {
    const fb = filterbank(s.fftSize / 2, s.binHz);
    const S = s.mag.map((m) =>
      Float32Array.from(fb, ({ from, weights }) => {
        let v = 0;
        for (let i = 0; i < weights.length; i++) v += weights[i] * m[from + i];
        return Math.log1p(lambda * v);
      }),
    );
    const out = new Float32Array(S.length);
    for (let n = mu; n < S.length; n++) {
      const ref = S[n - mu];
      let sum = 0;
      for (let b = 0; b < ref.length; b++) {
        const r = Math.max(ref[b], ref[b - 1] ?? 0, ref[b + 1] ?? 0);
        sum += hwr(S[n][b] - r);
      }
      out[n] = sum / ref.length;
    }
    return out;
  };

/**
 * Adaptive whitening (Stowell & Plumbley 2007): P[k] ← max(X[k], floor,
 * r·P[k]); X[k] / P[k] feeds the ODF. `inner` is the ODF on the whitened
 * spectrogram (phases untouched).
 */
export const whitened =
  (inner: Odf, r = 0.997, floor = 1): Odf =>
  (s) => {
    const P = new Float32Array(s.fftSize / 2).fill(floor);
    const mag = s.mag.map((m) => {
      const w = new Float32Array(m.length);
      for (let k = 0; k < m.length; k++) {
        P[k] = Math.max(m[k], floor, r * P[k]);
        w[k] = m[k] / P[k];
      }
      return w;
    });
    return inner({ ...s, mag });
  };

/** Linear spectral flux Σ HWR(X[n] − X[n−1]) (the whitened values are already in [0, 1]). */
export const linFlux: Odf = (s) => {
  const out = new Float32Array(s.mag.length);
  for (let n = 1; n < s.mag.length; n++) {
    let sum = 0;
    for (let k = 1; k < s.mag[n].length; k++) sum += hwr(s.mag[n][k] - s.mag[n - 1][k]);
    out[n] = sum;
  }
  return out;
};

/**
 * Complex domain (Duxbury et al. 2003, Bello et al. 2004): the target is the
 * previous magnitude with the phase advanced at the previous rate,
 * X̂ = |X[n−1]|·e^{j(2φ[n−1] − φ[n−2])}; ODF = Σ |X[n] − X̂|. `rectified`
 * keeps only bins whose magnitude rises (Dixon 2006).
 */
export const complexDomain =
  (rectified = false): Odf =>
  (s) => {
    const { mag, phase } = s;
    if (!phase) throw new Error("complex domain needs phases");
    const out = new Float32Array(mag.length);
    for (let n = 2; n < mag.length; n++) {
      let sum = 0;
      for (let k = 1; k < mag[n].length; k++) {
        if (rectified && mag[n][k] <= mag[n - 1][k]) continue;
        const target = 2 * phase[n - 1][k] - phase[n - 2][k];
        const dr = mag[n][k] * Math.cos(phase[n][k]) - mag[n - 1][k] * Math.cos(target);
        const di = mag[n][k] * Math.sin(phase[n][k]) - mag[n - 1][k] * Math.sin(target);
        sum += Math.hypot(dr, di);
      }
      out[n] = sum;
    }
    return out;
  };

/**
 * High-frequency content (Masri 1996): HFC = Σ k·X[k]². Masri's detection
 * function (HFC[n]/HFC[n−1])·(HFC[n]/E[n]); `diff` instead takes the rise of
 * log HFC, HWR(log HFC[n] − log HFC[n−1]), which is level independent.
 */
export const hfc =
  (variant: "masri" | "diff"): Odf =>
  (s) => {
    const H = new Float64Array(s.mag.length);
    const E = new Float64Array(s.mag.length);
    s.mag.forEach((m, n) => {
      for (let k = 1; k < m.length; k++) {
        H[n] += k * m[k] * m[k];
        E[n] += m[k] * m[k];
      }
    });
    const out = new Float32Array(H.length);
    const eps = 1e-9;
    for (let n = 1; n < H.length; n++) {
      out[n] =
        variant === "masri"
          ? ((H[n] / (H[n - 1] + eps)) * (H[n] / (E[n] + eps))) / (s.fftSize / 2)
          : hwr(Math.log(H[n] + eps) - Math.log(H[n - 1] + eps));
    }
    return out;
  };

/** Sum of ODFs, each scaled by its own maximum. */
export const combined =
  (...odfs: Odf[]): Odf =>
  (s) => {
    const out = new Float32Array(s.mag.length);
    for (const f of odfs) {
      const d = f(s);
      let max = 0;
      for (const v of d) max = Math.max(max, v);
      if (max > 0) for (let i = 0; i < d.length; i++) out[i] += d[i] / max;
    }
    return out;
  };

// --- the SDK gate on any candidate list ----------------------------------------------

/**
 * The OnsetPipeline acceptance rule on outside candidates: the loudest
 * 10 ms band level in [onset, onset + 40 ms] must reach floor + margin,
 * with the floor of the AdaptiveNoiseGate at that time.
 */
function gated(times: number[], x: Float32Array, sr: number, strictness: number): number[] {
  const { onsetMarginDb, ...tuning } = gateTuning(strictness);
  const meter = new BandLevelMeter({ sampleRate: sr });
  const gate = new AdaptiveNoiseGate(tuning);
  const blockMs = (meter.blockSize / sr) * 1000;
  const blocks: { end: number; level: number; floor: number }[] = [];
  for (const b of meter.push(x, 0)) {
    const st = gate.push({ levelDb: b.levelDb, dtMs: blockMs });
    blocks.push({ end: b.endFrame / sr, level: b.levelDb, floor: st.floorDb });
  }
  return times.filter((t) => {
    let level = -Infinity;
    let floor = -Infinity;
    for (const b of blocks) {
      if (b.end <= t) continue;
      if (b.end - blockMs / 1000 > t + 0.04) break;
      level = Math.max(level, b.level);
      floor = b.floor;
    }
    return level >= floor + onsetMarginDb;
  });
}

// --- method builder ---------------------------------------------------------------------

interface Spec {
  odf: Odf;
  fft?: number;
  hop?: number;
  phase?: boolean;
  /** Seconds added to the frame start (pickPeaks output). Default: half a window. */
  offset?: number;
  peaks?: Parameters<typeof pickPeaks>[2];
  /** Run the SDK gate (strictness) on the picked onsets. */
  gate?: number;
  /**
   * Scale the ODF by a decaying running maximum (per-frame decay) instead of
   * pickPeaks' whole-file maximum, which a live detector cannot know.
   */
  causalNorm?: number;
}

/** Divide by a running maximum that decays by `decay` per frame. */
function runningMaxNorm(d: Float32Array, decay: number): Float32Array {
  let m = 1e-9;
  return d.map((v) => {
    m = Math.max(v, m * decay);
    return v / m;
  });
}

export const method =
  ({
    odf,
    fft = 2048,
    hop = 441,
    phase = false,
    offset,
    peaks,
    gate,
    causalNorm,
  }: Spec): OnsetMethod =>
  (x, sr) => {
    const s = stft(x, sr, fft, hop, phase);
    const shift = offset ?? fft / 2 / sr;
    const d = odf(s);
    const t = (
      causalNorm === undefined
        ? pickPeaks(d, sr / hop, peaks)
        : pickPeaks(runningMaxNorm(d, causalNorm), sr / hop, { ...peaks, normalise: false })
    ).map((v) => v + shift);
    return gate === undefined ? t : gated(t, x, sr, gate);
  };

/** The ODFs, default parameters (fft 2048, hop 441). */
export const ODFS = {
  logFlux: logFlux(),
  superFlux: superFlux(),
  whiteFlux: whitened(linFlux),
  whiteLogFlux: whitened(logFlux(10), 0.997, 5),
  complex: complexDomain(false),
  rcd: complexDomain(true),
  hfcMasri: hfc("masri"),
  hfcDiff: hfc("diff"),
};

/**
 * Untuned variants use pickPeaks' defaults (delta 0.1, wait 3 = 30 ms).
 * "tuned" variants had delta / wait chosen on this POC set (not held out).
 */
export const METHODS: Record<string, OnsetMethod> = {
  // 1. Gate strictness (the SDK detector unchanged), then the SDK picker's delta.
  "SDK gentle gate (0.25)": sdk({ strictness: 0.25 }),
  "SDK strict gate (0.75)": sdk({ strictness: 0.75 }),
  "SDK delta 0.01 (tuned)": sdk({ peaks: { delta: 0.01 } }),
  // References for the ODF comparison, same peak picker.
  "log flux": method({ odf: ODFS.logFlux }),
  "SuperFlux-like": method({ odf: ODFS.superFlux }),
  // 2. Adaptive whitening.
  "whitened flux": method({ odf: ODFS.whiteFlux }),
  "whitened log flux": method({ odf: ODFS.whiteLogFlux }),
  // 3. Complex domain.
  "complex domain": method({ odf: ODFS.complex, phase: true }),
  "rectified CD": method({ odf: ODFS.rcd, phase: true }),
  // 4. High-frequency content.
  "HFC (Masri)": method({ odf: ODFS.hfcMasri }),
  "HFC log diff": method({ odf: ODFS.hfcDiff }),
  // Pushing further.
  "SuperFlux d.05 w5 (tuned)": method({ odf: ODFS.superFlux, peaks: { delta: 0.05, wait: 5 } }),
  "SuperFlux causal norm (tuned)": method({
    odf: ODFS.superFlux,
    peaks: { delta: 0.1, wait: 5 },
    causalNorm: 0.999,
  }),
  "SuperFlux+RCD (tuned)": method({
    odf: combined(ODFS.superFlux, ODFS.rcd),
    phase: true,
    peaks: { delta: 0.07, wait: 5 },
  }),
};
