// @vitest-environment node
import { describe, it, expect } from "vitest";

import { LowpassFilter } from "../src/analysis/lowpass";

describe("LowpassFilter", () => {
  it("rejects invalid parameters", () => {
    expect(() => new LowpassFilter(0, 48000)).toThrow();
    expect(() => new LowpassFilter(-1, 48000)).toThrow();
    expect(() => new LowpassFilter(24000, 0)).toThrow();
    expect(() => new LowpassFilter(24000, 48000)).toThrow(); // Cutoff >= Nyquist
  });

  it("processes a single sample", () => {
    const filter = new LowpassFilter(1, 48000);
    const y = filter.processSample(1);
    expect(typeof y).toBe("number");
    expect(Number.isFinite(y)).toBe(true);
  });

  it("processes a frame and returns correct length", () => {
    const filter = new LowpassFilter(1, 48000);
    const input = new Float32Array([1, 0.5, -0.3, 0.2]);
    const output = filter.processFrame(input);
    expect(output.length).toBe(input.length);
  });

  it("attenuates a high-frequency sinusoid", () => {
    const sampleRate = 48000;
    const cutoffHz = 10;
    const filter = new LowpassFilter(cutoffHz, sampleRate);

    // Generate a 100 Hz sinusoid (well above the cutoff).
    const N = 1000;
    const signal = new Float32Array(N);
    const freqHz = 100;
    for (let n = 0; n < N; n++) {
      signal[n] = Math.sin((2 * Math.PI * freqHz * n) / sampleRate);
    }

    const output = filter.processFrame(signal);

    // Take the last 100 samples (after filter settles).
    const settled = output.slice(-100);
    const avgMag = settled.reduce((a, b) => a + Math.abs(b), 0) / settled.length;

    // Should be significantly attenuated (much < 1).
    expect(avgMag).toBeLessThan(0.1);
  });

  it("passes a low-frequency sinusoid", () => {
    const sampleRate = 48000;
    const cutoffHz = 10;
    const filter = new LowpassFilter(cutoffHz, sampleRate);

    // Generate a 1 Hz sinusoid (well below the cutoff).
    const N = 5000;
    const signal = new Float32Array(N);
    const freqHz = 1;
    for (let n = 0; n < N; n++) {
      signal[n] = Math.sin((2 * Math.PI * freqHz * n) / sampleRate);
    }

    const output = filter.processFrame(signal);

    // Take the last 1000 samples (after filter settles).
    const settled = output.slice(-1000);
    const avgMag = settled.reduce((a, b) => a + Math.abs(b), 0) / settled.length;

    // Should be passed with reasonable gain (expect ~ 0.7 due to filter roll-on).
    expect(avgMag).toBeGreaterThan(0.1);
  });

  it("reset clears state", () => {
    const filter = new LowpassFilter(10, 48000);

    // Process some samples to fill state.
    const signal = new Float32Array(100).fill(1);
    filter.processFrame(signal);

    // After reset, the next sample should be low.
    filter.reset();
    const y0 = filter.processSample(1);

    // Process again with the same input.
    filter.reset();
    const y1 = filter.processSample(1);

    expect(y0).toBeCloseTo(y1, 10);
  });
});
