/**
 * Windowed, amplitude-normalised FFT of a real signal, in dB.
 *
 * dB reference ("dBFS-sine"): the one-sided magnitude is scaled by
 * 2 / Σw (1 / Σw for the DC bin), where w is the analysis window. A
 * full-scale sine of amplitude 1 centred on a bin therefore reads exactly
 * 0 dB, whatever the FFT size or window; a constant signal of value 1 reads
 * 0 dB at DC. Silence yields -Infinity in every bin.
 *
 * The window is applied over the actual signal length before zero-padding
 * to the next power of two, so padding only interpolates the spectrum and
 * does not change the normalisation.
 */

import { fftMagnitude } from "./fft";

export type FftWindow = "hann" | "rectangular";

export interface FftDbOptions {
  /** Analysis window. Default "hann" (periodic form, -31.5 dB sidelobes). */
  window?: FftWindow;
}

/** Smallest power of two ≥ n. */
export function nextPow2(n: number): number {
  if (n <= 0) throw new Error("nextPow2: input must be > 0");
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * Periodic Hann window of length N: w[n] = 0.5 − 0.5·cos(2πn / N).
 * The periodic form (denominator N, not N − 1) is the right choice for
 * spectral analysis: a bin-centred tone then leaks exactly −6.02 dB into
 * the two neighbouring bins and nothing elsewhere.
 */
export function periodicHannWindow(length: number): Float32Array {
  const w = new Float32Array(length);
  if (length === 1) {
    w[0] = 1;
    return w;
  }
  for (let n = 0; n < length; n++) {
    w[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / length);
  }
  return w;
}

export interface FftDbResult {
  /** Normalised one-sided magnitude (1.0 = full-scale sine). */
  magnitude: Float32Array;
  /** Magnitude in dB: 20·log10(magnitude), -Infinity for zero. */
  spectrumDb: Float32Array;
  /** Bin spacing in Hz: sampleRate / fftSize. */
  binHz: number;
  /** Number of bins in the one-sided spectrum (fftSize / 2). */
  binCount: number;
  /** FFT length actually used (next power of two ≥ signal length). */
  fftSize: number;
}

/**
 * Windowed FFT of a real signal, converted to dB (see module doc for the
 * reference level).
 *
 * @param signal Input samples (any length ≥ 1; zero-padded to a power of two).
 * @param sampleRate Sample rate of `signal`, in Hz.
 */
export function computeFftDb(
  signal: ArrayLike<number>,
  sampleRate: number,
  options: FftDbOptions = {},
): FftDbResult {
  const n = signal.length;
  if (n === 0) throw new Error("computeFftDb: signal must not be empty");
  const window = options.window ?? "hann";
  const fftSize = Math.max(2, nextPow2(n));

  const padded = new Float32Array(fftSize);
  let windowSum = 0;
  if (window === "rectangular") {
    for (let i = 0; i < n; i++) padded[i] = signal[i];
    windowSum = n;
  } else {
    const w = periodicHannWindow(n);
    for (let i = 0; i < n; i++) {
      padded[i] = signal[i] * w[i];
      windowSum += w[i];
    }
  }

  const magnitude = fftMagnitude(padded);
  const binCount = magnitude.length;
  const binHz = sampleRate / fftSize;

  // One-sided amplitude scaling: bins k ≥ 1 carry half of a real tone's
  // energy (the other half sits in the mirrored bin), hence the factor 2.
  const acScale = 2 / windowSum;
  const dcScale = 1 / windowSum;
  const spectrumDb = new Float32Array(binCount);
  for (let k = 0; k < binCount; k++) {
    const mag = magnitude[k] * (k === 0 ? dcScale : acScale);
    magnitude[k] = mag;
    spectrumDb[k] = mag > 0 ? 20 * Math.log10(mag) : -Infinity;
  }

  return { magnitude, spectrumDb, binHz, binCount, fftSize };
}
