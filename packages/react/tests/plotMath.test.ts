// @vitest-environment node
import { describe, it, expect } from "vitest";

import { axisTicks, decimateMinMax, signalRange, valueToPixel } from "../src/ui/plotMath";

describe("signalRange", () => {
  it("gives a symmetric range for bipolar signals", () => {
    expect(signalRange([0.2, -0.5, 0.1])).toEqual({ min: -0.5, max: 0.5 });
  });

  it("starts at zero for non-negative signals", () => {
    expect(signalRange([0, 0.3, 0.8])).toEqual({ min: 0, max: 0.8 });
  });

  it("never returns a degenerate range (all zeros, NaN, empty)", () => {
    for (const s of [new Float32Array(100), [NaN, NaN], [], [0, 0, 0]]) {
      const r = signalRange(s);
      expect(r.max - r.min).toBeGreaterThan(0);
    }
  });

  it("ignores non-finite samples", () => {
    expect(signalRange([Infinity, -0.25, NaN, 0.1])).toEqual({ min: -0.25, max: 0.25 });
  });
});

describe("axisTicks", () => {
  it("returns evenly spaced ticks including both ends", () => {
    expect(axisTicks({ min: -1, max: 1 }, 5)).toEqual([-1, -0.5, 0, 0.5, 1]);
  });

  it("terminates with the exact tick count on a zero-width range", () => {
    expect(axisTicks({ min: 0, max: 0 }, 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it("uses at least two ticks", () => {
    expect(axisTicks({ min: 0, max: 4 }, 1)).toEqual([0, 4]);
  });
});

describe("valueToPixel", () => {
  it("maps the range linearly onto the axis", () => {
    expect(valueToPixel(0, { min: -1, max: 1 }, 40, 200)).toBe(140);
    expect(valueToPixel(1, { min: -1, max: 1 }, 40, 200)).toBe(240);
  });

  it("maps everything to the origin on a degenerate range", () => {
    expect(valueToPixel(5, { min: 2, max: 2 }, 40, 200)).toBe(40);
  });
});

describe("decimateMinMax", () => {
  it("keeps every peak when reducing to fewer columns", () => {
    const signal = new Float32Array(1000);
    signal[123] = 1; // a single-sample spike
    signal[777] = -0.5;
    const { min, max } = decimateMinMax(signal, 50);
    expect(max).toHaveLength(50);
    expect(Math.max(...Array.from(max))).toBe(1);
    expect(Math.min(...Array.from(min))).toBe(-0.5);
  });

  it("maps samples 1:1 when there are fewer samples than columns", () => {
    const { min, max } = decimateMinMax([1, 2, 3], 10);
    expect(Array.from(min)).toEqual([1, 2, 3]);
    expect(Array.from(max)).toEqual([1, 2, 3]);
  });

  it("returns empty arrays for an empty signal", () => {
    const { min, max } = decimateMinMax([], 10);
    expect(min).toHaveLength(0);
    expect(max).toHaveLength(0);
  });

  it("treats non-finite samples as absent", () => {
    const { min, max } = decimateMinMax([NaN, NaN], 1);
    expect(Array.from(min)).toEqual([0]);
    expect(Array.from(max)).toEqual([0]);
  });
});
