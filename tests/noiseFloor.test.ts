// @vitest-environment node
import { describe, it, expect } from "vitest";

import {
  NOISE_FLOOR_SILENCE_DB,
  estimateNoiseFloor,
  isNoiseFloorMethod,
} from "../src/analysis/noiseFloor";

describe("estimateNoiseFloor", () => {
  const spectrum = new Float32Array([-80, -70, -60, -50, -40]);

  it("computes the median of a spectrum", () => {
    const result = estimateNoiseFloor(spectrum, "median");
    expect(result.noiseFloorDb).toBe(-60);
    expect(result.method).toBe("median");
  });

  it("averages the two middle values for an even-length median", () => {
    expect(estimateNoiseFloor([-80, -60], "median").noiseFloorDb).toBe(-70);
  });

  it("computes the mean of a spectrum", () => {
    const result = estimateNoiseFloor(spectrum, "mean");
    expect(result.noiseFloorDb).toBeCloseTo(-60, 5);
    expect(result.method).toBe("mean");
  });

  it("computes the 80th percentile", () => {
    const ramp = new Float32Array(Array.from({ length: 10 }, (_, i) => i * 10));
    const result = estimateNoiseFloor(ramp, "p80");
    expect(result.noiseFloorDb).toBe(70); // floor(0.8 * 9) = index 7
    expect(result.method).toBe("p80");
  });

  it("defaults to median", () => {
    expect(estimateNoiseFloor(spectrum).method).toBe("median");
  });

  it("ignores -Infinity and NaN bins for every method", () => {
    // Finite values: [-60, -50, -40, -30] → median -45, mean -45,
    // p80 = index floor(0.8 * 3) = 2 → -40. With -Infinity kept, the
    // median would have collapsed to -55 and the clamp to -100.
    const mixed = [-Infinity, -Infinity, -60, NaN, -50, -40, -30];
    expect(estimateNoiseFloor(mixed, "median").noiseFloorDb).toBe(-45);
    expect(estimateNoiseFloor(mixed, "mean").noiseFloorDb).toBeCloseTo(-45, 5);
    expect(estimateNoiseFloor(mixed, "p80").noiseFloorDb).toBe(-40);
  });

  it("returns the silence level when no bin is finite", () => {
    const silent = [-Infinity, -Infinity, -Infinity];
    for (const method of ["median", "mean", "p80"] as const) {
      expect(estimateNoiseFloor(silent, method).noiseFloorDb).toBe(NOISE_FLOOR_SILENCE_DB);
    }
    expect(estimateNoiseFloor([], "median").noiseFloorDb).toBe(NOISE_FLOOR_SILENCE_DB);
  });

  it("restricts the estimate to a bin range", () => {
    const values = [-10, -10, -90, -90, -90, -10, -10];
    expect(estimateNoiseFloor(values, "median", { fromBin: 2, toBin: 5 }).noiseFloorDb).toBe(-90);
    expect(estimateNoiseFloor(values, "median", { fromBin: 0, toBin: 2 }).noiseFloorDb).toBe(-10);
    // Out-of-range bounds are clamped.
    expect(estimateNoiseFloor(values, "median", { fromBin: -5, toBin: 100 }).noiseFloorDb).toBe(
      -10,
    );
  });

  it("does not mutate the input spectrum", () => {
    const input = new Float32Array([-40, -80, -60]);
    estimateNoiseFloor(input, "median");
    estimateNoiseFloor(input, "p80");
    expect(Array.from(input)).toEqual([-40, -80, -60]);
  });

  it("recognises the supported method names", () => {
    expect(isNoiseFloorMethod("median")).toBe(true);
    expect(isNoiseFloorMethod("p80")).toBe(true);
    expect(isNoiseFloorMethod("p50")).toBe(false);
  });
});
