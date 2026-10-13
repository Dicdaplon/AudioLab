/**
 * FFT-based time-domain analysis: converts magnitude spectrum to dB scale
 * and computes per-bin frequency assignment.
 *
 * Used for Section 1 (FFT magnitude + noise floor visualization) and Section 2
 * (temporal envelope analysis via lowpass filtering).
 */

import { fftMagnitude } from "./fft";

/**
 * Find the next power of 2 >= n.
 * @param n A positive integer.
 * @returns The smallest power of 2 that is >= n.
 */
export function nextPow2(n: number): number {
  if (n <= 0) throw new Error("nextPow2: input must be > 0");
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

export interface FftDbResult {
  /** FFT magnitude spectrum (linear scale). */
  magnitude: Float32Array;
  /** Magnitude spectrum converted to dB scale (20 * log10(mag)). */
  spectrumDb: Float32Array;
  /** Center frequency (Hz) of each bin. */
  binHz: number;
  /** Total number of bins in the one-sided spectrum. */
  binCount: number;
}

/**
 * Compute FFT of a real signal and convert to dB scale.
 *
 * @param signal Input audio frame (Float32Array).
 * @param sampleRate Sample rate in Hz.
 * @returns Object with magnitude, spectrumDb, and bin frequency information.
 *
 * The magnitude spectrum is one-sided (DC to Nyquist). Each bin k has
 * center frequency: f_k = k * binHz, where binHz = sampleRate / (2 * N).
 */
export function computeFftDb(signal: Float32Array, sampleRate: number): FftDbResult {
  const fftSize = nextPow2(signal.length);

  // Pad input to FFT size if necessary.
  const padded = new Float32Array(fftSize);
  for (let i = 0; i < signal.length; i++) padded[i] = signal[i];

  const magnitude = fftMagnitude(padded);
  const binCount = magnitude.length;
  const binHz = sampleRate / (2 * binCount);

  const spectrumDb = new Float32Array(binCount);
  for (let k = 0; k < binCount; k++) {
    const mag = magnitude[k];
    spectrumDb[k] = mag > 0 ? 20 * Math.log10(mag) : -Infinity;
  }

  return { magnitude, spectrumDb, binHz, binCount };
}
