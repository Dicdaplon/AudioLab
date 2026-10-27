/**
 * Small DSP helpers shared by the proof-of-concept methods. Frames end at
 * their time stamp (causal), as a live analyser would see them.
 */
import { fftInPlace } from "../src/analysis/fft";

const hannCache = new Map<number, Float32Array>();
export function hann(n: number): Float32Array {
  let w = hannCache.get(n);
  if (!w) {
    w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
    hannCache.set(n, w);
  }
  return w;
}

export interface Stft {
  /** Magnitudes, one Float32Array of fftSize/2 bins per frame. */
  mag: Float32Array[];
  /** Phases (only when asked). */
  phase?: Float32Array[];
  /** End time of each frame, in seconds. */
  times: number[];
  binHz: number;
  hop: number;
  fftSize: number;
}

/** Hann-windowed STFT; frame k covers the `fftSize` samples ending at its time. */
export function stft(
  x: Float32Array,
  sampleRate: number,
  fftSize: number,
  hop: number,
  withPhase = false,
): Stft {
  const w = hann(fftSize);
  const mag: Float32Array[] = [];
  const phase: Float32Array[] = [];
  const times: number[] = [];
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  for (let end = fftSize; end <= x.length; end += hop) {
    for (let i = 0; i < fftSize; i++) {
      re[i] = x[end - fftSize + i] * w[i];
      im[i] = 0;
    }
    fftInPlace(re, im);
    const m = new Float32Array(fftSize / 2);
    const p = withPhase ? new Float32Array(fftSize / 2) : null;
    for (let k = 0; k < fftSize / 2; k++) {
      m[k] = Math.hypot(re[k], im[k]);
      if (p) p[k] = Math.atan2(im[k], re[k]);
    }
    mag.push(m);
    if (p) phase.push(p);
    times.push(end / sampleRate);
  }
  return { mag, ...(withPhase && { phase }), times, binHz: sampleRate / fftSize, hop, fftSize };
}

/**
 * Online peak picking of a detection function (Böck et al. 2012 style):
 * a frame is an onset when it is the maximum of the last `pre` frames, above
 * the mean of the last `avg` frames plus `delta`, and at least `wait`
 * frames after the previous onset.
 */
export function pickPeaks(
  odf: Float32Array,
  frameRate: number,
  {
    delta = 0.1,
    pre = 3,
    avg = 10,
    wait = 3,
    normalise = true,
  }: Partial<Record<"delta" | "pre" | "avg" | "wait", number>> & {
    normalise?: boolean;
  } = {},
): number[] {
  let d = odf;
  if (normalise) {
    let max = 0;
    for (const v of odf) max = Math.max(max, v);
    d = odf.map((v) => (max > 0 ? v / max : 0));
  }
  const out: number[] = [];
  let last = -Infinity;
  for (let i = 1; i < d.length - 1; i++) {
    // Causal with one frame of look-ahead: a peak is confirmed when the next frame is lower.
    if (!(d[i] >= d[i + 1])) continue;
    let isMax = true;
    for (let k = Math.max(0, i - pre); k < i; k++) if (d[k] > d[i]) isMax = false;
    if (!isMax) continue;
    let mean = 0;
    let n = 0;
    for (let k = Math.max(0, i - avg); k <= i; k++) {
      mean += d[k];
      n++;
    }
    if (d[i] < mean / n + delta) continue;
    if (i - last < wait) continue;
    out.push(i / frameRate);
    last = i;
  }
  return out;
}

export const midiOf = (hz: number) => 69 + 12 * Math.log2(hz / 440);
export const hzOf = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** L1-normalise in place (zeros stay zeros). */
export function l1(v: Float32Array): Float32Array {
  let s = 0;
  for (const x of v) s += x;
  if (s > 0) for (let i = 0; i < v.length; i++) v[i] /= s;
  return v;
}

/** Fold a semitone (MIDI-indexed, 128) vector into 12 pitch classes. */
export function fold(notes: Float32Array | Float64Array): Float32Array {
  const c = new Float32Array(12);
  for (let i = 0; i < notes.length; i++) c[i % 12] += notes[i];
  return c;
}
