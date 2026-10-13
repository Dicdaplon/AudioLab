// @vitest-environment node
import { describe, it, expect } from "vitest";

import { computeFftDb, nextPow2, periodicHannWindow } from "../src/analysis/timeFft";
import { estimateNoiseFloor } from "../src/analysis/noiseFloor";

/** Cosine of amplitude `amp` centred exactly on bin `k` of an N-point FFT. */
function binCentredCosine(N: number, k: number, amp = 1): Float32Array {
  const s = new Float32Array(N);
  for (let n = 0; n < N; n++) s[n] = amp * Math.cos((2 * Math.PI * k * n) / N);
  return s;
}

describe("nextPow2", () => {
  it("returns the input if it is already a power of 2", () => {
    expect(nextPow2(1)).toBe(1);
    expect(nextPow2(2)).toBe(2);
    expect(nextPow2(1024)).toBe(1024);
  });

  it("rounds up to the next power of 2", () => {
    expect(nextPow2(3)).toBe(4);
    expect(nextPow2(100)).toBe(128);
    expect(nextPow2(1000)).toBe(1024);
  });

  it("rejects non-positive numbers", () => {
    expect(() => nextPow2(0)).toThrow();
    expect(() => nextPow2(-1)).toThrow();
  });
});

describe("periodicHannWindow", () => {
  it("starts at 0, peaks at 1 in the middle and sums to N/2", () => {
    const N = 64;
    const w = periodicHannWindow(N);
    expect(w[0]).toBe(0);
    expect(w[N / 2]).toBeCloseTo(1, 12);
    let sum = 0;
    for (const v of w) sum += v;
    expect(sum).toBeCloseTo(N / 2, 5);
    // Periodic form: w[n] = w[N - n] (not w[N - 1 - n]).
    expect(w[1]).toBeCloseTo(w[N - 1], 12);
  });

  it("is a single 1 for length 1", () => {
    expect(Array.from(periodicHannWindow(1))).toEqual([1]);
  });
});

describe("computeFftDb", () => {
  it("returns a one-sided spectrum with binHz = sampleRate / fftSize", () => {
    const result = computeFftDb(new Float32Array(256), 48000);
    expect(result.binCount).toBe(128);
    expect(result.fftSize).toBe(256);
    expect(result.binHz).toBeCloseTo(187.5, 9);
    expect(computeFftDb(new Float32Array(65536), 48000).binHz).toBeCloseTo(0.7324, 4);
    expect(computeFftDb(new Float32Array(16384), 44100).binHz).toBeCloseTo(2.6917, 4);
  });

  it("reads 0 dB for a full-scale bin-centred sine, independent of N (rectangular)", () => {
    for (const N of [256, 4096]) {
      const k = 10;
      const r = computeFftDb(binCentredCosine(N, k), 48000, { window: "rectangular" });
      expect(r.magnitude[k]).toBeCloseTo(1, 9);
      expect(r.spectrumDb[k]).toBeCloseTo(0, 6);
      for (let j = 0; j < r.binCount; j++) {
        if (j !== k) expect(r.magnitude[j]).toBeLessThan(1e-6);
      }
    }
  });

  it("reads 0 dB at the tone bin and -6.02 dB at k±1 with the Hann window", () => {
    const N = 1024;
    const k = 37;
    const r = computeFftDb(binCentredCosine(N, k), 48000);
    expect(r.spectrumDb[k]).toBeCloseTo(0, 6);
    expect(r.spectrumDb[k - 1]).toBeCloseTo(-6.02, 2);
    expect(r.spectrumDb[k + 1]).toBeCloseTo(-6.02, 2);
    // No leakage beyond the ±1 bins for a bin-centred tone.
    for (let j = 0; j < r.binCount; j++) {
      if (Math.abs(j - k) > 1) expect(r.spectrumDb[j]).toBeLessThan(-120);
    }
  });

  it("keeps Hann leakage below -31 dB three bins away from an off-centre tone", () => {
    const N = 1024;
    const f = 40.5; // half-way between bins: worst case for leakage
    const s = new Float32Array(N).map((_, n) => Math.cos((2 * Math.PI * f * n) / N));
    const r = computeFftDb(s, N);
    const peak = Math.max(r.spectrumDb[40], r.spectrumDb[41]);
    for (let j = 0; j < r.binCount; j++) {
      if (Math.abs(j - f) >= 3) expect(r.spectrumDb[j] - peak).toBeLessThan(-31);
    }
  });

  it("scales amplitude linearly (0.5 → -6.02 dB)", () => {
    const r = computeFftDb(binCentredCosine(512, 8, 0.5), 48000);
    expect(r.spectrumDb[8]).toBeCloseTo(-6.02, 2);
  });

  it("reads 0 dB at DC for a constant signal of 1", () => {
    const ones = new Float32Array(256).fill(1);
    expect(computeFftDb(ones, 48000, { window: "rectangular" }).spectrumDb[0]).toBeCloseTo(0, 6);
    expect(computeFftDb(ones, 48000).spectrumDb[0]).toBeCloseTo(0, 6);
  });

  it("zero-pads to the next power of two without changing the scale", () => {
    const signal = binCentredCosine(100, 5); // 100 samples → padded to 128
    const r = computeFftDb(signal, 48000, { window: "rectangular" });
    expect(r.binCount).toBe(64);
    expect(r.fftSize).toBe(128);
    expect(r.binHz).toBe(computeFftDb(new Float32Array(128), 48000).binHz);
    // The tone lands 0.4 bin off-centre (5/100 → 6.4/128); the rectangular
    // window's scalloping loss there is sinc(0.4) ≈ 0.82.
    const peak = Math.max(...Array.from(r.magnitude));
    expect(peak).toBeCloseTo(0.82, 1);
    expect(peak).toBeLessThanOrEqual(1.0001);
  });

  it("returns -Infinity everywhere for silence, and the noise floor clamps", () => {
    const r = computeFftDb(new Float32Array(256), 48000);
    for (let k = 0; k < r.binCount; k++) expect(r.spectrumDb[k]).toBe(-Infinity);
    for (const method of ["median", "mean", "p80"] as const) {
      expect(estimateNoiseFloor(r.spectrumDb, method).noiseFloorDb).toBe(-100);
    }
  });

  it("rejects an empty signal", () => {
    expect(() => computeFftDb(new Float32Array(0), 48000)).toThrow();
  });
});
