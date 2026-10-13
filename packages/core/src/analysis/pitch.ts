/**
 * Monophonic pitch detection for a tuner: the McLeod Pitch Method (MPM).
 *
 * The normalised square difference function (NSDF) of a window x[0..W)
 *
 *   n(τ) = 2·r(τ) / m(τ),   r(τ) = Σ x[j]·x[j+τ],   m(τ) = Σ (x[j]² + x[j+τ]²)
 *
 * (sums over j = 0 .. W−1−τ) lies in [−1, 1] and peaks at every multiple of
 * the period, with a value close to 1 for a periodic signal whatever its
 * amplitude envelope. The pitch is the *first* peak whose height reaches a
 * fraction `peakThreshold` of the highest peak, which avoids the octave-too-
 * low error of a plain maximum; the peak position is refined by parabolic
 * interpolation, then, when the window holds several periods, by the peak
 * at the largest usable multiple of that lag (the interpolation error in
 * samples is the same there and divides by the multiple).
 *
 * `r(τ)` is computed with two FFTs on the zero-padded window; `m(τ)` is
 * accumulated incrementally, so a 2048-sample window costs about two
 * 4096-point FFTs per call.
 *
 * Reference: McLeod, P. and Wyvill, G. (2005). A smarter way to find
 * pitch. ICMC.
 */

import { fftInPlace } from "./fft";
import { median } from "./math";
import { nextPow2 } from "./timeFft";
import { A4_FREQ, A4_MIDI } from "../utils/notes";

export interface PitchEstimate {
  /** Fundamental frequency in Hz. */
  frequency: number;
  /** Nearest equal-tempered note as a MIDI number (A4 = 69). */
  midi: number;
  /** Pitch class of `midi` (0 = C, ..., 11 = B). */
  pitchClass: number;
  /** Deviation from `midi` in cents, in [−50, 50] (a tracker may exceed it, see hysteresis). */
  cents: number;
  /** Height of the chosen NSDF peak, in [0, 1]: 1 is perfectly periodic. */
  clarity: number;
}

export interface PitchOptions {
  /** Frequency of A4 in Hz. Default 440. */
  referenceA4?: number;
  /** Lowest detectable frequency in Hz. Needs a window of at least two periods. Default 60. */
  minFrequency?: number;
  /** Highest detectable frequency in Hz. Default 2000. */
  maxFrequency?: number;
  /** A peak counts as the pitch when it reaches this fraction of the highest peak. Default 0.9. */
  peakThreshold?: number;
  /** Estimates whose clarity is below this value are reported as `null`. Default 0.8. */
  clarityThreshold?: number;
  /** Windows whose RMS is below this value are silence (`null`). Default 0.001 (−60 dBFS). */
  silenceRms?: number;
}

export const PITCH_DEFAULTS: Required<PitchOptions> = {
  referenceA4: A4_FREQ,
  minFrequency: 60,
  maxFrequency: 2000,
  peakThreshold: 0.9,
  clarityThreshold: 0.8,
  silenceRms: 0.001,
};

/** Defaults merged with the caller's options; explicit `undefined` keeps the default. */
function resolveOptions<T extends object>(defaults: T, options: Partial<T>): T {
  const resolved = { ...defaults };
  for (const key of Object.keys(options) as (keyof T)[]) {
    const value = options[key];
    if (value !== undefined) resolved[key] = value as T[keyof T];
  }
  return resolved;
}

/**
 * NSDF of `samples` for lags 0..maxLag (inclusive), after removing the
 * window's mean. `maxLag` is clamped to `samples.length − 1`.
 */
export function normalizedSquareDifference(
  samples: ArrayLike<number>,
  maxLag: number,
): Float64Array {
  const w = samples.length;
  const lags = Math.max(0, Math.min(maxLag, w - 1));
  const n = nextPow2(Math.max(2, 2 * w));
  const re = new Float64Array(n);
  const im = new Float64Array(n);

  let mean = 0;
  for (let i = 0; i < w; i++) mean += samples[i];
  mean /= Math.max(1, w);
  for (let i = 0; i < w; i++) re[i] = samples[i] - mean;

  // r(τ) through the power spectrum: the spectrum of a real signal is
  // conjugate-symmetric, so a second forward FFT of |X|² gives N·r(τ).
  fftInPlace(re, im);
  for (let k = 0; k < n; k++) {
    re[k] = re[k] * re[k] + im[k] * im[k];
    im[k] = 0;
  }
  fftInPlace(re, im);

  const nsdf = new Float64Array(lags + 1);
  let m = 0;
  for (let i = 0; i < w; i++) {
    const x = samples[i] - mean;
    m += 2 * x * x;
  }
  for (let tau = 0; tau <= lags; tau++) {
    nsdf[tau] = m > 0 ? (2 * re[tau]) / n / m : 0;
    const a = samples[tau] - mean;
    const b = samples[w - 1 - tau] - mean;
    m -= a * a + b * b;
  }
  return nsdf;
}

export interface Peak {
  /** Lag in samples (fractional after interpolation). */
  lag: number;
  /** NSDF value at that lag. */
  value: number;
}

/**
 * Local maxima of the positive lobes that follow the main lobe at τ = 0. A
 * lobe still rising at the last lag belongs to a period beyond the search
 * range and yields no peak.
 */
function keyMaxima(nsdf: Float64Array): Peak[] {
  const peaks: Peak[] = [];
  const last = nsdf.length - 1;
  let tau = 1;
  while (tau <= last && nsdf[tau] > 0) tau++;
  while (tau <= last) {
    if (nsdf[tau] > 0) {
      let best = tau;
      while (tau <= last && nsdf[tau] > 0) {
        if (nsdf[tau] > nsdf[best]) best = tau;
        tau++;
      }
      if (best < last) peaks.push({ lag: best, value: nsdf[best] });
    } else {
      tau++;
    }
  }
  return peaks;
}

/**
 * Vertex of the parabola through (lag−1, lag, lag+1). At the edges of the
 * array, or on a flat top, the integer peak is returned as is.
 */
export function interpolatePeak(nsdf: ArrayLike<number>, lag: number): Peak {
  if (lag <= 0 || lag >= nsdf.length - 1) return { lag, value: nsdf[lag] };
  const a = nsdf[lag - 1];
  const b = nsdf[lag];
  const c = nsdf[lag + 1];
  const denom = a - 2 * b + c;
  if (denom >= 0) return { lag, value: b };
  const delta = (a - c) / (2 * denom);
  return { lag: lag + delta, value: b - ((a - c) * delta) / 4 };
}

/**
 * Refines a fundamental lag with the peak at its largest usable multiple:
 * the lag at k·τ carries the same interpolation error, divided by k.
 */
function refineWithMultiples(nsdf: Float64Array, lag: number, minValue: number): number {
  const last = nsdf.length - 1;
  const radius = Math.max(2, Math.floor(lag / 4));
  for (let k = Math.floor(last / lag); k >= 2; k--) {
    const centre = Math.round(k * lag);
    const from = Math.max(1, centre - radius);
    const to = Math.min(last - 1, centre + radius);
    let best = -1;
    for (let i = from; i <= to; i++) {
      if (best < 0 || nsdf[i] > nsdf[best]) best = i;
    }
    if (best <= from || best >= to) continue; // not a local maximum inside the range
    if (nsdf[best] < minValue) continue;
    return interpolatePeak(nsdf, best).lag / k;
  }
  return lag;
}

/** Nearest equal-tempered note, pitch class and cents for a frequency. */
export function frequencyToPitch(
  frequency: number,
  clarity: number,
  referenceA4 = A4_FREQ,
): PitchEstimate {
  const midiFloat = A4_MIDI + 12 * Math.log2(frequency / referenceA4);
  const midi = Math.round(midiFloat);
  return {
    frequency,
    midi,
    pitchClass: ((midi % 12) + 12) % 12,
    cents: (midiFloat - midi) * 100,
    clarity,
  };
}

/**
 * Estimate the pitch of one window of samples, or `null` for silence, noise
 * and signals outside [minFrequency, maxFrequency].
 *
 * The window must hold at least two periods of the lowest note to detect
 * (lags are searched up to half the window): 2048 samples cover 60 Hz at
 * 48 kHz.
 */
export function detectPitch(
  samples: ArrayLike<number>,
  sampleRate: number,
  options: PitchOptions = {},
): PitchEstimate | null {
  const opts = resolveOptions(PITCH_DEFAULTS, options);
  const w = samples.length;
  if (w < 4 || !(sampleRate > 0)) return null;

  let energy = 0;
  for (let i = 0; i < w; i++) energy += samples[i] * samples[i];
  if (Math.sqrt(energy / w) < opts.silenceRms) return null;

  const maxLag = Math.min(Math.floor(w / 2), Math.floor(sampleRate / opts.minFrequency));
  const minLag = Math.max(2, Math.ceil(sampleRate / opts.maxFrequency));
  const nsdf = normalizedSquareDifference(samples, maxLag);

  const peaks = keyMaxima(nsdf).filter((p) => p.lag >= 2);
  if (peaks.length === 0) return null;
  let highest = 0;
  for (const p of peaks) highest = Math.max(highest, p.value);
  // The first peak that reaches the threshold; the highest one at worst.
  const threshold = Math.min(1, opts.peakThreshold) * highest;
  let chosen = peaks[0];
  for (const p of peaks) {
    if (p.value >= threshold) {
      chosen = p;
      break;
    }
  }
  if (chosen.lag < minLag || chosen.lag > maxLag) return null;

  const peak = interpolatePeak(nsdf, chosen.lag);
  const clarity = Math.min(1, peak.value);
  if (clarity < opts.clarityThreshold) return null;

  const lag = refineWithMultiples(nsdf, peak.lag, opts.clarityThreshold);
  return frequencyToPitch(sampleRate / lag, clarity, opts.referenceA4);
}

export interface PitchTrackerOptions extends PitchOptions {
  sampleRate: number;
  /** Samples per analysis window. Default 2048. */
  windowSize?: number;
  /** Samples between two analyses. Default half the window. */
  hopSize?: number;
  /** Odd number of raw estimates the median runs over. Default 3. */
  medianFrames?: number;
  /**
   * Once a note is displayed it keeps its name until the pitch is more than
   * 50 + hysteresisCents away from it, so the name does not flap at a
   * quarter-tone. Default 10.
   */
  hysteresisCents?: number;
}

/**
 * Streaming wrapper around `detectPitch` for a live tuner: push samples in
 * any batch size, read the smoothed estimate.
 *
 * Every `hopSize` samples the latest `windowSize` samples are analysed. The
 * reported estimate is the median of the last `medianFrames` raw estimates
 * (so one bad frame cannot move it), is `null` when fewer than half of
 * them are valid (silence, noise), and keeps the current note's name inside
 * the hysteresis band.
 */
export class PitchTracker {
  private readonly opts: Required<PitchTrackerOptions>;
  private readonly ring: Float32Array;
  private writeIndex = 0;
  private filled = 0;
  private sinceAnalysis = 0;
  private history: (PitchEstimate | null)[] = [];
  private current: PitchEstimate | null = null;

  constructor(options: PitchTrackerOptions) {
    const windowSize = options.windowSize ?? 2048;
    this.opts = resolveOptions(
      {
        ...PITCH_DEFAULTS,
        sampleRate: options.sampleRate,
        windowSize,
        hopSize: Math.floor(windowSize / 2),
        medianFrames: 3,
        hysteresisCents: 10,
      },
      options,
    );
    this.ring = new Float32Array(windowSize);
  }

  /** Latest smoothed estimate, or `null` while idle or on silence. */
  get estimate(): PitchEstimate | null {
    return this.current;
  }

  /** Change the tuning reference; the next analysis uses it. */
  setReferenceA4(hz: number): void {
    this.opts.referenceA4 = hz;
  }

  /** Forget every sample and estimate. */
  reset(): void {
    this.writeIndex = 0;
    this.filled = 0;
    this.sinceAnalysis = 0;
    this.history = [];
    this.current = null;
  }

  push(samples: ArrayLike<number>): void {
    const { windowSize, hopSize } = this.opts;
    for (let i = 0; i < samples.length; i++) {
      this.ring[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % windowSize;
      if (this.filled < windowSize) this.filled++;
      this.sinceAnalysis++;
      if (this.filled === windowSize && this.sinceAnalysis >= hopSize) {
        this.sinceAnalysis = 0;
        this.analyse();
      }
    }
  }

  private analyse(): void {
    const { windowSize, medianFrames } = this.opts;
    const window = new Float32Array(windowSize);
    const head = this.ring.subarray(this.writeIndex);
    window.set(head);
    window.set(this.ring.subarray(0, this.writeIndex), head.length);

    this.history.push(detectPitch(window, this.opts.sampleRate, this.opts));
    if (this.history.length > medianFrames) this.history.shift();
    this.current = this.smooth();
  }

  private smooth(): PitchEstimate | null {
    const { medianFrames, hysteresisCents, referenceA4 } = this.opts;
    const valid = this.history.filter((e): e is PitchEstimate => e !== null);
    if (valid.length < Math.ceil(medianFrames / 2)) return null;

    const midiFloat = median(valid.map((e) => A4_MIDI + 12 * Math.log2(e.frequency / referenceA4)));
    const clarity = median(valid.map((e) => e.clarity));
    const frequency = referenceA4 * Math.pow(2, (midiFloat - A4_MIDI) / 12);
    const fresh = frequencyToPitch(frequency, clarity, referenceA4);

    const held = this.current;
    if (held === null) return fresh;
    const centsFromHeld = (midiFloat - held.midi) * 100;
    if (Math.abs(centsFromHeld) > 50 + hysteresisCents) return fresh;
    return { ...fresh, midi: held.midi, pitchClass: held.pitchClass, cents: centsFromHeld };
  }
}
