/**
 * Chroma extraction: turn a magnitude spectrum into a 12-D pitch-class vector.
 *
 * For each FFT bin within [minFreq, maxFreq], we map its center frequency to
 * the nearest pitch class and accumulate its energy. The resulting vector is
 * L1-normalized so it sums to 1 (or stays zero if the input is silent).
 */

import { freqToPitchClass } from "../utils/notes";

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
}

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
