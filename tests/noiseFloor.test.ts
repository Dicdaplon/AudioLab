// @vitest-environment node
import { describe, it, expect } from "vitest";

import { estimateNoiseFloor } from "../src/analysis/noiseFloor";

describe("estimateNoiseFloor", () => {
  it("computes median of a spectrum", () => {
    const spectrum = new Float32Array([-80, -70, -60, -50, -40]);
    const result = estimateNoiseFloor(spectrum, "median");
    expect(result.noiseFloorDb).toBe(-60); // Middle value.
    expect(result.method).toBe("median");
  });

  it("computes mean of a spectrum", () => {
    const spectrum = new Float32Array([-80, -70, -60, -50, -40]);
    const result = estimateNoiseFloor(spectrum, "mean");
    const expected = (-80 - 70 - 60 - 50 - 40) / 5;
    expect(result.noiseFloorDb).toBeCloseTo(expected, 5);
    expect(result.method).toBe("mean");
  });

  it("computes 80th percentile", () => {
    // [0, 10, 20, 30, 40, 50, 60, 70, 80, 90] → 80th percentile ≈ 72
    const spectrum = new Float32Array(
      Array.from({ length: 10 }, (_, i) => i * 10),
    );
    const result = estimateNoiseFloor(spectrum, "p80");
    expect(result.noiseFloorDb).toBeGreaterThanOrEqual(70);
    expect(result.noiseFloorDb).toBeLessThanOrEqual(80);
    expect(result.method).toBe("p80");
  });

  it("defaults to median", () => {
    const spectrum = new Float32Array([-80, -70, -60, -50, -40]);
    const result = estimateNoiseFloor(spectrum);
    expect(result.method).toBe("median");
    expect(result.noiseFloorDb).toBe(-60);
  });

  it("handles non-finite values gracefully", () => {
    const spectrum = new Float32Array([
      -80, -70, -Infinity, -50, -40,
    ]);
    const result = estimateNoiseFloor(spectrum, "mean");
    // Mean should skip -Infinity.
    expect(result.noiseFloorDb).toBeCloseTo((-80 - 70 - 50 - 40) / 4, 5);
  });

  it("clamps result to -100 dB if all values are non-finite", () => {
    const spectrum = new Float32Array([-Infinity, -Infinity, -Infinity]);
    const result = estimateNoiseFloor(spectrum, "median");
    expect(result.noiseFloorDb).toBe(-100);
  });
});
