import { describe, it, expect } from "vitest";

import {
  HighWaterMarkFilter,
  HIGH_WATER_MARK_DEFAULTS,
  HIGH_WATER_MARK_MEMORY_MAX,
  HIGH_WATER_MARK_MEMORY_MIN,
} from "../src/analysis/highWaterMark";

describe("HighWaterMarkFilter", () => {
  it("uses sensible defaults", () => {
    const f = new HighWaterMarkFilter();
    expect(f.getTolerancy()).toBe(HIGH_WATER_MARK_DEFAULTS.tolerancy);
    expect(f.getMemory()).toBe(HIGH_WATER_MARK_DEFAULTS.memory);
    expect(f.getMode()).toBe(HIGH_WATER_MARK_DEFAULTS.mode);
  });

  it("clamps tolerancy to [0, 1]", () => {
    const f = new HighWaterMarkFilter({ tolerancy: 2 });
    expect(f.getTolerancy()).toBe(1);
    f.setTolerancy(-0.5);
    expect(f.getTolerancy()).toBe(0);
  });

  it("clamps memory to [2, 15] and rounds non-integers", () => {
    const f = new HighWaterMarkFilter({ memory: 0 });
    expect(f.getMemory()).toBe(HIGH_WATER_MARK_MEMORY_MIN);
    f.setMemory(100);
    expect(f.getMemory()).toBe(HIGH_WATER_MARK_MEMORY_MAX);
    f.setMemory(5.7);
    expect(f.getMemory()).toBe(6);
  });

  it("passes everything through when tolerancy = 0", () => {
    const f = new HighWaterMarkFilter({ tolerancy: 0 });
    const input = new Float32Array([0.1, 0.5, 0.01, 0.0]);
    const out = f.filter(input);
    expect(out[0]).toBeCloseTo(0.1, 6);
    expect(out[1]).toBeCloseTo(0.5, 6);
    expect(out[2]).toBeCloseTo(0.01, 6);
    expect(out[3]).toBe(0);
  });

  it("zeroes everything below 50% of the running peak average", () => {
    const f = new HighWaterMarkFilter({ tolerancy: 0.5, memory: 3 });
    // First frame: peak = 1, history = [1], threshold = 0.5
    const out1 = f.filter(new Float32Array([0.4, 1.0, 0.6, 0.2]));
    expect(out1[0]).toBe(0); // 0.4 < 0.5
    expect(out1[1]).toBeCloseTo(1.0, 6);
    expect(out1[2]).toBeCloseTo(0.6, 6);
    expect(out1[3]).toBe(0); // 0.2 < 0.5
  });

  it("threshold tracks the mean of the last N peaks", () => {
    const f = new HighWaterMarkFilter({ tolerancy: 0.5, memory: 3 });
    f.filter(new Float32Array([1.0, 0, 0, 0])); // peak 1, mem [1]
    f.filter(new Float32Array([0.5, 0, 0, 0])); // peak 0.5, mem [1, 0.5]
    f.filter(new Float32Array([0.5, 0, 0, 0])); // peak 0.5, mem [1, 0.5, 0.5]
    // threshold = 0.5 * mean(1, 0.5, 0.5) = 0.5 * 0.666... = 0.333...
    expect(f.currentThreshold).toBeCloseTo(0.5 * (2 / 3), 6);
  });

  it("memory window slides correctly (capacity N)", () => {
    const f = new HighWaterMarkFilter({ tolerancy: 1, memory: 2 });
    f.filter(new Float32Array([2, 0, 0])); // mem [2]
    f.filter(new Float32Array([4, 0, 0])); // mem [2, 4]
    f.filter(new Float32Array([6, 0, 0])); // mem [4, 6] (2 evicted)
    expect(f.currentThreshold).toBe(5); // 1.0 * mean(4, 6) = 5
  });

  it("shrinking memory drops oldest peaks", () => {
    const f = new HighWaterMarkFilter({ tolerancy: 1, memory: 5 });
    for (const v of [1, 2, 3, 4, 5]) f.filter(new Float32Array([v]));
    expect(f.currentThreshold).toBe(3); // mean(1..5) = 3
    f.setMemory(2);
    // After shrink, only the last 2 peaks remain: 4 and 5.
    expect(f.currentThreshold).toBe(4.5);
  });

  it("median mode is more robust to outliers", () => {
    const fMean = new HighWaterMarkFilter({
      tolerancy: 1,
      memory: 5,
      mode: "mean",
    });
    const fMed = new HighWaterMarkFilter({
      tolerancy: 1,
      memory: 5,
      mode: "median",
    });
    // 4 normal peaks of ~1, then one outlier of 100.
    for (const v of [1, 1, 1, 1, 100]) {
      fMean.filter(new Float32Array([v]));
      fMed.filter(new Float32Array([v]));
    }
    expect(fMean.currentThreshold).toBeCloseTo(20.8, 1); // (1+1+1+1+100)/5
    expect(fMed.currentThreshold).toBeCloseTo(1, 6); // median = 1
  });

  it("filterToIndicator returns 0/1 vector", () => {
    const f = new HighWaterMarkFilter({ tolerancy: 0.5 });
    const ind = f.filterToIndicator(new Float32Array([0.1, 0.5, 1.0, 0.0]));
    expect(Array.from(ind)).toEqual([0, 1, 1, 0]);
  });

  it("reset clears the peak history", () => {
    const f = new HighWaterMarkFilter({ tolerancy: 0.5 });
    f.filter(new Float32Array([10, 0, 0]));
    expect(f.lastPeak).toBe(10);
    f.reset();
    expect(f.lastPeak).toBe(0);
    expect(f.currentThreshold).toBe(0);
  });
});
