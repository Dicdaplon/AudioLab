/**
 * Pure-JS radix-2 Cooley-Tukey FFT, used for offline / Node-side analysis.
 *
 * In the browser we rely on AnalyserNode (optimized C++). This module is a
 * drop-in equivalent for tests and any non-browser entry point: it computes
 * a magnitude spectrum from a real signal, so its output can be fed directly
 * into `spectrumToChroma`.
 */

/** Hann window applied in-place to a real frame. */
export function applyHannWindow(frame: Float32Array): void {
  const N = frame.length;
  const denom = N - 1;
  for (let n = 0; n < N; n++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / denom));
    frame[n] *= w;
  }
}

/**
 * In-place radix-2 FFT. `real` and `imag` must have the same length, which
 * must be a power of two. After the call they contain the DFT of the input.
 */
export function fftInPlace(real: Float64Array, imag: Float64Array): void {
  const N = real.length;
  if (N !== imag.length) throw new Error("real/imag length mismatch");
  if (N < 2 || (N & (N - 1)) !== 0) {
    throw new Error(`FFT length must be a power of two ≥ 2, got ${N}`);
  }

  // Bit-reverse permutation.
  let j = 0;
  for (let i = 1; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = real[i];
      real[i] = real[j];
      real[j] = tr;
      const ti = imag[i];
      imag[i] = imag[j];
      imag[j] = ti;
    }
  }

  // Cooley-Tukey butterflies.
  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wpr = Math.cos(angle);
    const wpi = Math.sin(angle);
    for (let i = 0; i < N; i += len) {
      let wr = 1;
      let wi = 0;
      for (let k = 0; k < half; k++) {
        const tr = wr * real[i + k + half] - wi * imag[i + k + half];
        const ti = wr * imag[i + k + half] + wi * real[i + k + half];
        real[i + k + half] = real[i + k] - tr;
        imag[i + k + half] = imag[i + k] - ti;
        real[i + k] += tr;
        imag[i + k] += ti;
        const nwr = wr * wpr - wi * wpi;
        wi = wr * wpi + wi * wpr;
        wr = nwr;
      }
    }
  }
}

/**
 * Magnitude spectrum of a real signal. Length of the result is `N / 2`
 * (one-sided), matching what AnalyserNode would deliver in the browser.
 *
 * The input frame is treated as read-only; an internal copy is made before
 * FFT so the caller can reuse the buffer.
 */
export function fftMagnitude(frame: Float32Array): Float32Array {
  const N = frame.length;
  const real = new Float64Array(N);
  const imag = new Float64Array(N);
  for (let i = 0; i < N; i++) real[i] = frame[i];
  fftInPlace(real, imag);
  const half = N >> 1;
  const out = new Float32Array(half);
  for (let k = 0; k < half; k++) {
    out[k] = Math.hypot(real[k], imag[k]);
  }
  return out;
}
