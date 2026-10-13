// @vitest-environment node
import { describe, it, expect } from "vitest";

import { applyHannWindow, fftInPlace, fftMagnitude } from "../src/analysis/fft";

describe("fftInPlace", () => {
  it("rejects non-power-of-two lengths", () => {
    const r = new Float64Array(6);
    const i = new Float64Array(6);
    expect(() => fftInPlace(r, i)).toThrow();
  });

  it("rejects mismatched lengths", () => {
    expect(() => fftInPlace(new Float64Array(8), new Float64Array(16))).toThrow();
  });

  it("DFT of [1, 0, 0, 0, ...] is constant 1 across all bins", () => {
    const N = 16;
    const real = new Float64Array(N);
    const imag = new Float64Array(N);
    real[0] = 1;
    fftInPlace(real, imag);
    for (let k = 0; k < N; k++) {
      expect(Math.hypot(real[k], imag[k])).toBeCloseTo(1, 10);
    }
  });

  it("DFT of a constant signal puts all energy in bin 0", () => {
    const N = 64;
    const real = new Float64Array(N).fill(1);
    const imag = new Float64Array(N);
    fftInPlace(real, imag);
    expect(real[0]).toBeCloseTo(N, 10);
    expect(imag[0]).toBeCloseTo(0, 10);
    for (let k = 1; k < N; k++) {
      expect(Math.hypot(real[k], imag[k])).toBeCloseTo(0, 10);
    }
  });
});

describe("fftMagnitude", () => {
  it("returns a one-sided spectrum of length N/2", () => {
    const frame = new Float32Array(64);
    const mag = fftMagnitude(frame);
    expect(mag.length).toBe(32);
  });

  it("identifies the bin of a pure sinusoid", () => {
    // Build a signal x[n] = cos(2π k₀ n / N) with k₀ = 5.
    const N = 256;
    const k0 = 5;
    const frame = new Float32Array(N);
    for (let n = 0; n < N; n++) frame[n] = Math.cos((2 * Math.PI * k0 * n) / N);
    const mag = fftMagnitude(frame);
    let peak = 0;
    let peakIdx = 0;
    for (let k = 0; k < mag.length; k++) {
      if (mag[k] > peak) {
        peak = mag[k];
        peakIdx = k;
      }
    }
    expect(peakIdx).toBe(k0);
  });

  it("Parseval-like: sum of squared magnitudes ≈ N · sum of squared samples (one-sided × 2 inside)", () => {
    // For a real signal, Σ_{k=0}^{N-1} |X[k]|² = N · Σ_n x[n]². Our magnitude
    // array is one-sided (length N/2). We reconstruct the full-side sum.
    const N = 128;
    const frame = new Float32Array(N);
    for (let n = 0; n < N; n++) frame[n] = Math.sin((2 * Math.PI * 7 * n) / N);
    let signalEnergy = 0;
    for (let n = 0; n < N; n++) signalEnergy += frame[n] * frame[n];
    const mag = fftMagnitude(frame);
    let specEnergy = mag[0] * mag[0];
    for (let k = 1; k < mag.length; k++) specEnergy += 2 * mag[k] * mag[k];
    // Nyquist bin is k = N/2; included once because it's real. For odd k that
    // are not 0 or N/2, the symmetric pair doubles. Acceptable approximation.
    expect(specEnergy).toBeCloseTo(N * signalEnergy, 3);
  });
});

describe("applyHannWindow", () => {
  it("zeros the endpoints", () => {
    const f = new Float32Array(8).fill(1);
    applyHannWindow(f);
    expect(f[0]).toBeCloseTo(0, 10);
    expect(f[f.length - 1]).toBeCloseTo(0, 10);
  });

  it("peaks at 1 in the middle", () => {
    const f = new Float32Array(9).fill(1);
    applyHannWindow(f);
    expect(f[4]).toBeCloseTo(1, 10);
  });

  it("is symmetric", () => {
    const f = new Float32Array(16).fill(1);
    applyHannWindow(f);
    for (let i = 0; i < f.length / 2; i++) {
      expect(f[i]).toBeCloseTo(f[f.length - 1 - i], 10);
    }
  });
});
