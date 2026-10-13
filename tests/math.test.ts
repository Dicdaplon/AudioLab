// @vitest-environment node
import { describe, it, expect } from "vitest";

import { argmax, clamp, mean, median, softmax } from "../src/analysis/math";

describe("clamp", () => {
  it("clamps into the range and passes inner values through", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});

describe("argmax", () => {
  it("returns the index of the largest value, first on ties", () => {
    expect(argmax([1, 5, 5, 2])).toBe(1);
    expect(argmax(new Float32Array([0.1, 0.9, 0.3]))).toBe(1);
  });

  it("returns -1 for an empty input", () => {
    expect(argmax([])).toBe(-1);
  });
});

describe("mean / median", () => {
  it("computes the mean", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(mean([])).toBe(0);
  });

  it("computes the median for odd and even lengths without mutating", () => {
    const odd = [3, 1, 2];
    expect(median(odd)).toBe(2);
    expect(odd).toEqual([3, 1, 2]);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median(new Float32Array([0.5, 0.3, 0.4]))).toBeCloseTo(0.4, 6);
    expect(median([])).toBe(0);
  });
});

describe("softmax", () => {
  it("sums to 1 and is uniform for equal inputs", () => {
    const p = softmax([0.5, 0.5, 0.5, 0.5], 1);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    for (const v of p) expect(v).toBeCloseTo(0.25, 12);
  });

  it("maps a 0.1 difference to a factor e at temperature 0.1", () => {
    const [a, b] = softmax([1, 0.9], 0.1);
    expect(a / b).toBeCloseTo(Math.E, 4);
  });

  it("falls back to temperature 1 when given a non-positive temperature", () => {
    expect(softmax([1, 2], 0)).toEqual(softmax([1, 2], 1));
    expect(softmax([1, 2], -3)).toEqual(softmax([1, 2], 1));
  });

  it("is numerically stable for large inputs", () => {
    const p = softmax([1000, 1000.5], 0.1);
    expect(p.every(Number.isFinite)).toBe(true);
    expect(p[0] + p[1]).toBeCloseTo(1, 12);
  });
});
