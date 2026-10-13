/**
 * Spectral derivative: compute the finite-difference approximation of how
 * a spectrum evolves over time.
 *
 * Used in Section 2 to detect temporal changes in the spectrum (e.g. note
 * onsets, vibrato modulation). The derivative is computed as:
 *
 *   d[k] = (spectrum[k] - prevSpectrum[k]) / dt
 *
 * where dt is typically the frame interval (100 ms at 10 Hz analysis rate).
 */

/**
 * Compute the finite-difference derivative of two spectra.
 *
 * @param currentSpectrum Current dB magnitude spectrum.
 * @param prevSpectrum Previous dB magnitude spectrum (same length).
 * @param dtSeconds Time elapsed between frames (typically 0.1 s at 10 Hz).
 * @returns Derivative in dB/s.
 *
 * If spectra have different lengths, the shorter length is used.
 * Non-finite values (e.g., -Infinity) are treated as silent (-100 dB floor).
 */
export function spectralDerivative(
  currentSpectrum: ArrayLike<number>,
  prevSpectrum: ArrayLike<number>,
  dtSeconds: number = 0.1,
): Float32Array {
  const n = Math.min(currentSpectrum.length, prevSpectrum.length);
  const derivative = new Float32Array(n);

  const floor = -100;

  for (let k = 0; k < n; k++) {
    const curr = Number.isFinite(currentSpectrum[k]) ? currentSpectrum[k] : floor;
    const prev = Number.isFinite(prevSpectrum[k]) ? prevSpectrum[k] : floor;

    derivative[k] = (curr - prev) / dtSeconds;
  }

  return derivative;
}

/**
 * Smooth a spectrum with a simple moving-average filter (temporal smoothing).
 * Useful to reduce jitter before computing the derivative.
 *
 * @param spectrum Input spectrum.
 * @param windowSize Number of past frames to average (including current).
 * @param history Array of past spectra (most recent last). Will be mutated.
 * @returns Smoothed spectrum.
 */
export function smoothSpectrumTemporal(
  spectrum: ArrayLike<number>,
  windowSize: number,
  history: ArrayLike<number>[],
): Float32Array {
  const n = spectrum.length;
  const out = new Float32Array(n);

  // Add current spectrum to history.
  const specCopy = new Float32Array(n);
  for (let i = 0; i < n; i++) specCopy[i] = spectrum[i];

  // We'd typically mutate a shared history array, but to keep this pure,
  // we compute on-the-fly. A caller can maintain history as a mutable array.
  const framesToAvg = Math.min(windowSize, history.length + 1);
  let sumCount = 0;

  // Average the history frames up to windowSize.
  const histStart = Math.max(0, history.length - (framesToAvg - 1));
  for (let h = histStart; h < history.length; h++) {
    const frame = history[h];
    for (let k = 0; k < n; k++) {
      out[k] += frame[k];
    }
    sumCount++;
  }

  // Add the current frame.
  for (let k = 0; k < n; k++) {
    out[k] += spectrum[k];
  }
  sumCount++;

  // Normalize.
  for (let k = 0; k < n; k++) {
    out[k] /= sumCount;
  }

  return out;
}
