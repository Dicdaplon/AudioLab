// @vitest-environment node
import { describe, it, expect } from "vitest";

import {
  BUTTERWORTH_ORDER,
  LowpassFilter,
  butterworthPoleAngles,
  designButterworthBiquad,
} from "../src/analysis/lowpass";

/** Pole radius of a biquad from its denominator (|z| = sqrt(a2)). */
function poleRadius(a2: number): number {
  return Math.sqrt(a2);
}

/** Steady-state amplitude of a sine pushed through the filter (last cycles). */
function measuredSineGain(filter: LowpassFilter, freqHz: number, sampleRate: number): number {
  const settleSeconds = 20 / freqHz;
  const measureSeconds = 4 / freqHz;
  const total = Math.round((settleSeconds + measureSeconds) * sampleRate);
  const measureFrom = Math.round(settleSeconds * sampleRate);
  let peak = 0;
  for (let n = 0; n < total; n++) {
    const y = filter.processSample(Math.sin((2 * Math.PI * freqHz * n) / sampleRate));
    if (n >= measureFrom) peak = Math.max(peak, Math.abs(y));
  }
  return peak;
}

describe("Butterworth design", () => {
  it("uses the textbook pole angles for a 4th-order filter", () => {
    const angles = butterworthPoleAngles(4);
    expect(angles).toHaveLength(2);
    expect(angles[0]).toBeCloseTo(Math.PI / 8, 12);
    expect(angles[1]).toBeCloseTo((3 * Math.PI) / 8, 12);
    // Section Q = 1 / (2 sin θ): 1.3066 and 0.5412.
    expect(1 / (2 * Math.sin(angles[0]))).toBeCloseTo(1.3066, 3);
    expect(1 / (2 * Math.sin(angles[1]))).toBeCloseTo(0.5412, 3);
    expect(BUTTERWORTH_ORDER).toBe(4);
  });

  it("gives θ = π/4 for a single second-order section", () => {
    expect(butterworthPoleAngles(2)[0]).toBeCloseTo(Math.PI / 4, 12);
  });

  it("rejects odd or non-positive orders", () => {
    expect(() => butterworthPoleAngles(3)).toThrow();
    expect(() => butterworthPoleAngles(0)).toThrow();
  });

  it("rejects normalised frequencies outside (0, 1)", () => {
    expect(() => designButterworthBiquad(0, Math.PI / 8)).toThrow();
    expect(() => designButterworthBiquad(1, Math.PI / 8)).toThrow();
  });

  it("has unity DC gain per section (b0 + b1 + b2 = 1 + a1 + a2)", () => {
    const c = designButterworthBiquad(0.01, Math.PI / 8);
    expect(c.b0 + c.b1 + c.b2).toBeCloseTo(1 + c.a1 + c.a2, 12);
  });
});

describe("LowpassFilter", () => {
  it("rejects invalid parameters", () => {
    expect(() => new LowpassFilter(0, 48000)).toThrow();
    expect(() => new LowpassFilter(-1, 48000)).toThrow();
    expect(() => new LowpassFilter(24000, 0)).toThrow();
    expect(() => new LowpassFilter(24000, 48000)).toThrow(); // cutoff >= Nyquist
    expect(() => new LowpassFilter(NaN, 48000)).toThrow();
  });

  it.each([
    [0.5, 44100],
    [0.5, 48000],
    [2, 44100],
    [2, 48000],
    [10, 48000],
    [10, 8000],
  ])("is −3.01 dB at fc = %s Hz (fs = %s Hz)", (fc, fs) => {
    const f = new LowpassFilter(fc, fs);
    expect(f.magnitudeDb(fc)).toBeCloseTo(-3.01, 1);
    expect(Math.abs(f.magnitudeDb(fc) + 3.0103)).toBeLessThan(0.05);
  });

  it.each([
    [0.5, 48000],
    [2, 48000],
    [10, 48000],
    [2, 44100],
  ])("rolls off as a 4th-order Butterworth above fc = %s Hz (fs = %s)", (fc, fs) => {
    const f = new LowpassFilter(fc, fs);
    // |H(2fc)| = 1/sqrt(1 + 2^8) → −24.10 dB; |H(10fc)| ≈ −80 dB.
    expect(f.magnitudeDb(2 * fc)).toBeCloseTo(-24.1, 1);
    expect(Math.abs(f.magnitudeDb(10 * fc) + 80)).toBeLessThan(1);
  });

  it("has 0 dB gain at DC and a maximally flat, monotone passband", () => {
    const f = new LowpassFilter(2, 48000);
    expect(f.magnitudeDb(0)).toBeCloseTo(0, 4);
    // |H(f)| is non-increasing on (0, fc].
    let previous = f.magnitudeDb(0);
    for (let hz = 0.05; hz <= 2; hz += 0.05) {
      const db = f.magnitudeDb(hz);
      expect(db).toBeLessThanOrEqual(previous + 1e-6);
      expect(db).toBeGreaterThan(-3.1);
      previous = db;
    }
  });

  it("is stable over the whole slider range (pole radius < 1)", () => {
    for (const fs of [8000, 44100, 48000, 96000]) {
      for (const fc of [0.5, 1, 2, 5, 10, 20]) {
        const f = new LowpassFilter(fc, fs);
        for (const c of f.coefficients) {
          expect(poleRadius(c.a2)).toBeLessThan(1);
          expect(poleRadius(c.a2)).toBeGreaterThan(0);
        }
      }
    }
    // Badly conditioned but still stable: fc = 0.5 Hz at 48 kHz, 3π/8 section.
    const extreme = new LowpassFilter(0.5, 48000);
    expect(1 - poleRadius(extreme.coefficients[1].a2)).toBeCloseTo(6.0e-5, 5);
  });

  it("matches the analytic response when measured on a sine", () => {
    const fs = 1000;
    const fc = 10;
    expect(measuredSineGain(new LowpassFilter(fc, fs), fc, fs)).toBeCloseTo(
      Math.pow(10, -3.0103 / 20),
      2,
    );
    expect(measuredSineGain(new LowpassFilter(fc, fs), 2 * fc, fs)).toBeCloseTo(
      Math.pow(10, -24.1 / 20),
      2,
    );
    expect(measuredSineGain(new LowpassFilter(fc, fs), fc / 10, fs)).toBeCloseTo(1, 3);
  });

  it("settles a DC step to 1 at fc = 0.5 Hz / 48 kHz without NaN", () => {
    const f = new LowpassFilter(0.5, 48000);
    let y = 0;
    let overshoot = 0;
    for (let n = 0; n < 20 * 48000; n++) {
      y = f.processSample(1);
      if (!Number.isFinite(y)) throw new Error(`non-finite output at sample ${n}`);
      overshoot = Math.max(overshoot, y);
    }
    expect(y).toBeCloseTo(1, 5);
    // Butterworth step response overshoots by about 11 %.
    expect(overshoot).toBeGreaterThan(1.05);
    expect(overshoot).toBeLessThan(1.2);
  });

  it("processes a frame and returns the same length", () => {
    const f = new LowpassFilter(1, 48000);
    const out = f.processFrame(new Float32Array([1, 0.5, -0.3, 0.2]));
    expect(out).toHaveLength(4);
  });

  it("reset() really clears the state", () => {
    const f = new LowpassFilter(10, 48000);
    f.processFrame(new Float32Array(100).fill(1));
    const continued = f.processSample(1); // state is charged
    f.reset();
    const afterReset = f.processSample(1);
    const fresh = new LowpassFilter(10, 48000).processSample(1);
    expect(afterReset).toBe(fresh);
    expect(afterReset).not.toBe(continued);
  });

  it("setCutoff() then reset() is identical to a fresh instance", () => {
    const f = new LowpassFilter(2, 48000);
    f.processFrame(new Float32Array(50).fill(0.5));
    f.setCutoff(5, 48000);
    f.reset();
    const fresh = new LowpassFilter(5, 48000);
    const input = new Float32Array(20).map((_, i) => Math.sin(i));
    expect(Array.from(f.processFrame(input))).toEqual(Array.from(fresh.processFrame(input)));
    expect(f.cutoff).toBe(5);
  });

  it("setCutoff() changes the response and rejects values at or above Nyquist", () => {
    const f = new LowpassFilter(2, 48000);
    const before = f.magnitudeDb(4);
    f.setCutoff(4, 48000);
    expect(f.magnitudeDb(4)).toBeCloseTo(-3.01, 1);
    expect(f.magnitudeDb(4)).not.toBeCloseTo(before, 1);
    expect(() => f.setCutoff(24000, 48000)).toThrow();
    expect(() => f.setCutoff(0, 48000)).toThrow();
  });
});
