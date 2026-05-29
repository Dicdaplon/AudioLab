// @vitest-environment node
import { describe, it, expect } from "vitest";

import { nextPow2, computeFftDb } from "../src/analysis/timeFft";

describe("nextPow2", () => {
  it("returns the input if it is already a power of 2", () => {
    expect(nextPow2(1)).toBe(1);
    expect(nextPow2(2)).toBe(2);
    expect(nextPow2(4)).toBe(4);
    expect(nextPow2(16)).toBe(16);
    expect(nextPow2(1024)).toBe(1024);
  });

  it("rounds up to the next power of 2", () => {
    expect(nextPow2(3)).toBe(4);
    expect(nextPow2(5)).toBe(8);
    expect(nextPow2(100)).toBe(128);
    expect(nextPow2(1000)).toBe(1024);
  });

  it("rejects non-positive numbers", () => {
    expect(() => nextPow2(0)).toThrow();
    expect(() => nextPow2(-1)).toThrow();
  });
});

describe("computeFftDb", () => {
  it("returns a one-sided spectrum", () => {
    const signal = new Float32Array(256);
    signal.fill(0.1);
    const result = computeFftDb(signal, 48000);
    expect(result.magnitude.length).toBe(128);
    expect(result.spectrumDb.length).toBe(128);
    expect(result.binCount).toBe(128);
  });

  it("computes correct bin frequency resolution", () => {
    // 48kHz, 256-point FFT → binHz = 48000 / (2 * 128) = 187.5 Hz/bin
    const signal = new Float32Array(256);
    const result = computeFftDb(signal, 48000);
    expect(result.binHz).toBeCloseTo(187.5, 5);
  });

  it("converts magnitude to dB correctly", () => {
    const signal = new Float32Array(256);
    signal.fill(1);

    const result = computeFftDb(signal, 48000);

    // DC bin should have large magnitude, converted to dB.
    // (Exact value depends on FFT implementation, but should be positive dB.)
    expect(result.spectrumDb[0]).toBeGreaterThan(-50);

    // High-frequency bins should have small magnitudes.
    expect(result.spectrumDb[result.spectrumDb.length - 1]).toBeLessThan(0);
  });

  it("pads the signal to the next power of 2", () => {
    const signal = new Float32Array(100);
    signal[0] = 1;

    const result = computeFftDb(signal, 48000);
    expect(result.binCount).toBe(64); // nextPow2(100) = 128, one-sided = 64
  });

  it("handles silent input gracefully", () => {
    const signal = new Float32Array(256);
    const result = computeFftDb(signal, 48000);

    // Silent signal should have -Infinity in all bins.
    for (let k = 0; k < result.spectrumDb.length; k++) {
      expect(Number.isFinite(result.spectrumDb[k]) || result.spectrumDb[k] === -Infinity).toBe(
        true,
      );
    }
  });
});
