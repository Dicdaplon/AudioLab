/**
 * Chroma extraction: turn a magnitude spectrum into a 12-D pitch-class vector.
 *
 * For each FFT bin within [minFreq, maxFreq], we map its center frequency to
 * the nearest pitch class and accumulate its energy. The resulting vector is
 * L1-normalized so it sums to 1 (or stays zero if the input is silent).
 *
 * Because of that normalisation every non-silent frame carries the same
 * total weight downstream: the sliding-window averages are level-invariant
 * (a loud frame does not dominate a quiet one), not energy-weighted.
 *
 * Resolution caveat: bins are assigned by rounding their centre frequency
 * to the nearest semitone. With the AnalyserNode's Blackman window the
 * main lobe spans about ±3 bins (±9 Hz at 48 kHz / 16384), which is ±2.7
 * semitones at 55 Hz and ±0.7 semitone at 220 Hz, so a low bass note leaks
 * part of its energy into the neighbouring pitch classes.
 *
 * Alternative (opt-in, `binning: "gaussian"` and `compression: "log"`): each
 * bin is shared between its two nearest semitones with a Gaussian weight of
 * its distance to them (σ = 0.3 semitone by default), so a bin that sits
 * between two notes counts for little, and each bin's energy is compressed
 * as log(1 + γ·E / E_max) before summing, so the bass and the loudest
 * partials no longer drown the rest. Both follow common chroma practice
 * (Müller, Fundamentals of Music Processing, 2015, §3.1 and §5.2).
 */

import { freqToMidi, freqToPitchClass } from "../utils/notes";

export const CHROMA_SIZE = 12;

export interface ChromaOptions {
  /** Sample rate of the original signal (Hz). Required to compute bin frequencies. */
  sampleRate: number;
  /** Lowest frequency to include in the chroma sum. Default 55 Hz (A1). */
  minFreq?: number;
  /** Highest frequency to include. Default 5000 Hz. */
  maxFreq?: number;
  /** Use squared magnitude (energy) instead of linear magnitude. Default true. */
  useEnergy?: boolean;
  /**
   * How a bin is assigned to pitch classes. "nearest" (default): all of it
   * to the nearest semitone. "gaussian": shared between the two nearest
   * semitones with a Gaussian weight of the distance (see `gaussianWidth`).
   */
  binning?: "nearest" | "gaussian";
  /** σ of the Gaussian binning, in semitones. Default 0.3. */
  gaussianWidth?: number;
  /**
   * "none" (default): bin weights summed as they are. "log": each weight w
   * becomes log(1 + γ·w / w_max) with γ = `logGain`; level-invariant.
   */
  compression?: "none" | "log";
  /** γ of the log compression. Default 100: the knee sits 20 dB (in energy) under the loudest bin. */
  logGain?: number;
  /** Tuning offset of the reference A4, in cents (A = 440·2^(c/1200)). Default 0. */
  tuningCents?: number;
}

/** Gaussian-binning and log-compression preset of `spectrumToChroma`. */
export const GAUSSIAN_LOG_CHROMA: Readonly<
  Pick<ChromaOptions, "binning" | "gaussianWidth" | "compression" | "logGain">
> = { binning: "gaussian", gaussianWidth: 0.3, compression: "log", logGain: 100 };

/**
 * Compute a chroma vector from a magnitude spectrum.
 *
 * @param spectrum  Magnitude values of an FFT, length N (typically fftSize/2).
 * @param options   Sample rate and frequency range.
 * @returns         Float32Array of length 12, L1-normalized.
 */
export function spectrumToChroma(
  spectrum: ArrayLike<number>,
  options: ChromaOptions,
): Float32Array {
  const { sampleRate, minFreq = 55, maxFreq = 5000, useEnergy = true } = options;
  const chroma = new Float32Array(CHROMA_SIZE);
  const n = spectrum.length;
  if (n === 0) return chroma;
  if (
    (options.binning ?? "nearest") !== "nearest" ||
    (options.compression ?? "none") !== "none" ||
    (options.tuningCents ?? 0) !== 0
  ) {
    return weightedChroma(spectrum, options);
  }

  // Bin k of an N-point one-sided spectrum corresponds to frequency
  //   f_k = k * sampleRate / (2 * N)   when spectrum.length == fftSize / 2
  // We treat the input length as fftSize/2, which matches AnalyserNode's
  // getFloatFrequencyData output.
  const binHz = sampleRate / (2 * n);

  for (let k = 1; k < n; k++) {
    const freq = k * binHz;
    if (freq < minFreq || freq > maxFreq) continue;
    const mag = spectrum[k];
    if (!Number.isFinite(mag) || mag <= 0) continue;
    const weight = useEnergy ? mag * mag : mag;
    const pc = freqToPitchClass(freq);
    chroma[pc] += weight;
  }

  return l1Normalize(chroma);
}

/**
 * The opt-in path of `spectrumToChroma`: Gaussian binning, log compression,
 * tuning. The compression applies to each FFT bin. Compressing per note
 * instead (gather the bins of each MIDI note first) was measured and did
 * not do better on the backing-tracks clips (docs/ALTERNATIVES.md).
 */
function weightedChroma(spectrum: ArrayLike<number>, options: ChromaOptions): Float32Array {
  const { sampleRate, minFreq = 55, maxFreq = 5000, useEnergy = true } = options;
  const gaussian = options.binning === "gaussian";
  const sigma = options.gaussianWidth ?? 0.3;
  const logGain = options.compression === "log" ? (options.logGain ?? 100) : 0;
  const tuning = (options.tuningCents ?? 0) / 100;
  const n = spectrum.length;
  const binHz = sampleRate / (2 * n);
  const kMin = Math.max(1, Math.ceil(minFreq / binHz));
  const kMax = Math.min(n - 1, Math.floor(maxFreq / binHz));

  let peak = 0;
  if (logGain > 0) {
    for (let k = kMin; k <= kMax; k++) {
      const mag = spectrum[k];
      if (Number.isFinite(mag) && mag > 0) peak = Math.max(peak, useEnergy ? mag * mag : mag);
    }
  }
  const chroma = new Float32Array(CHROMA_SIZE);
  const g = (d: number) => Math.exp((-d * d) / (2 * sigma * sigma));
  for (let k = kMin; k <= kMax; k++) {
    const mag = spectrum[k];
    if (!Number.isFinite(mag) || mag <= 0) continue;
    let w = useEnergy ? mag * mag : mag;
    if (logGain > 0) w = Math.log1p((logGain * w) / peak);
    const midi = freqToMidi(k * binHz) - tuning;
    const near = Math.round(midi);
    const pc = ((near % 12) + 12) % 12;
    if (!gaussian) {
      chroma[pc] += w;
      continue;
    }
    const d = midi - near;
    chroma[pc] += w * g(d);
    chroma[(pc + (d >= 0 ? 1 : 11)) % 12] += w * g(1 - Math.abs(d));
  }
  return l1Normalize(chroma);
}

/** L1-normalize a vector in place; return the same array. */
export function l1Normalize(v: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i];
  if (sum > 0) {
    for (let i = 0; i < v.length; i++) v[i] /= sum;
  }
  return v;
}

/** Average a list of chroma vectors element-wise. Returns a new vector. */
export function averageChromas(chromas: ArrayLike<ArrayLike<number>>): Float32Array {
  const result = new Float32Array(CHROMA_SIZE);
  const count = chromas.length;
  if (count === 0) return result;
  for (let i = 0; i < count; i++) {
    const c = chromas[i];
    for (let j = 0; j < CHROMA_SIZE; j++) result[j] += c[j];
  }
  for (let j = 0; j < CHROMA_SIZE; j++) result[j] /= count;
  return result;
}

/**
 * Convert AnalyserNode's getFloatFrequencyData output (dB, typically in
 * [-100, 0]) into a linear magnitude spectrum. Values below `floorDb` are
 * clamped to 0 so the chroma is not polluted by the noise floor.
 */
export function dbSpectrumToMagnitude(dbSpectrum: ArrayLike<number>, floorDb = -90): Float32Array {
  const out = new Float32Array(dbSpectrum.length);
  for (let i = 0; i < dbSpectrum.length; i++) {
    const db = dbSpectrum[i];
    if (!Number.isFinite(db) || db <= floorDb) {
      out[i] = 0;
    } else {
      out[i] = Math.pow(10, db / 20);
    }
  }
  return out;
}
