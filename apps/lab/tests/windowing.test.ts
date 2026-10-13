import { describe, it, expect } from "vitest";

import { ChromaWindow } from "../src/analysis/windowing";
import { CHROMA_SIZE } from "../src/analysis/chroma";

function unit(pc: number): Float32Array {
  const v = new Float32Array(CHROMA_SIZE);
  v[pc] = 1;
  return v;
}

describe("ChromaWindow", () => {
  it("rejects invalid configuration", () => {
    expect(() => new ChromaWindow({ windowSeconds: 0, framesPerSecond: 10 })).toThrow();
    expect(() => new ChromaWindow({ windowSeconds: 8, framesPerSecond: 0 })).toThrow();
  });

  it("rejects chromas with wrong length", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 10 });
    expect(() => w.push(new Float32Array(11))).toThrow();
  });

  it("aggregates to zero when empty", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 10 });
    const agg = w.aggregate();
    expect(Array.from(agg)).toEqual(new Array(12).fill(0));
  });

  it("computes the mean of pushed frames (L1-normalized)", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 4 });
    w.push(unit(0));
    w.push(unit(0));
    w.push(unit(7));
    w.push(unit(7));
    const agg = w.aggregate();
    expect(agg[0]).toBeCloseTo(0.5, 6);
    expect(agg[7]).toBeCloseTo(0.5, 6);
  });

  it("discards the oldest frame when capacity is exceeded", () => {
    // capacity = windowSeconds * framesPerSecond = 1 * 3 = 3
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 3 });
    w.push(unit(0));
    w.push(unit(0));
    w.push(unit(0));
    expect(w.size).toBe(3);
    w.push(unit(7)); // evicts first
    w.push(unit(7)); // evicts second
    w.push(unit(7)); // evicts third
    expect(w.size).toBe(3);
    const agg = w.aggregate();
    expect(agg[7]).toBeCloseTo(1, 6);
    expect(agg[0]).toBe(0);
  });

  it("reset clears the window", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 10 });
    w.push(unit(2));
    w.push(unit(2));
    expect(w.size).toBe(2);
    w.reset();
    expect(w.size).toBe(0);
    expect(Array.from(w.aggregate())).toEqual(new Array(12).fill(0));
  });

  it("maxSize matches windowSeconds * framesPerSecond", () => {
    const w = new ChromaWindow({ windowSeconds: 8, framesPerSecond: 10 });
    expect(w.maxSize).toBe(80);
  });

  it("aggregateRaw returns the mean WITHOUT L1-renormalization", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 4 });
    // Two indicator vectors: half the bins active on each frame.
    const a = new Float32Array(12);
    a[0] = 1;
    const b = new Float32Array(12);
    b[0] = 1;
    b[6] = 1;
    w.push(a);
    w.push(b);
    const raw = w.aggregateRaw();
    // Bin 0 active in both frames → mean 1; bin 6 in one of two → mean 0.5.
    expect(raw[0]).toBeCloseTo(1);
    expect(raw[6]).toBeCloseTo(0.5);
  });

  it("resize shrinks capacity and drops oldest frames", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 5 });
    for (let i = 0; i < 5; i++) {
      const v = unit(i);
      w.push(v);
    }
    expect(w.size).toBe(5);
    w.resize({ windowSeconds: 1, framesPerSecond: 2 }); // capacity 2
    expect(w.maxSize).toBe(2);
    expect(w.size).toBe(2);
    // Should now hold only the last two frames (indicators on PCs 3 and 4).
    const raw = w.aggregateRaw();
    expect(raw[3]).toBeCloseTo(0.5);
    expect(raw[4]).toBeCloseTo(0.5);
    expect(raw[0]).toBe(0);
  });

  it("resize growing capacity preserves all current frames", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 2 });
    w.push(unit(0));
    w.push(unit(7));
    w.resize({ windowSeconds: 1, framesPerSecond: 10 }); // capacity 10
    expect(w.size).toBe(2);
    expect(w.maxSize).toBe(10);
    const raw = w.aggregateRaw();
    expect(raw[0]).toBeCloseTo(0.5);
    expect(raw[7]).toBeCloseTo(0.5);
  });

  it("resize to the same capacity is a no-op", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 3 });
    w.push(unit(2));
    w.resize({ windowSeconds: 1, framesPerSecond: 3 });
    expect(w.size).toBe(1);
    expect(w.maxSize).toBe(3);
  });

  it("resize rejects invalid configuration", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 3 });
    expect(() => w.resize({ windowSeconds: 0, framesPerSecond: 3 })).toThrow();
    expect(() => w.resize({ windowSeconds: 1, framesPerSecond: 0 })).toThrow();
  });

  it("keeps the mean of L1-normalised frames L1-normalised before renormalisation", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 5 });
    for (let i = 0; i < 5; i++) {
      const v = new Float32Array(12).fill(0);
      v[i] = 0.5;
      v[(i + 5) % 12] = 0.5; // each frame sums to 1
      w.push(v);
    }
    const raw = w.aggregateRaw();
    expect(raw.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
  });

  it("running sum matches a naive recomputation through wraps and resizes", () => {
    const w = new ChromaWindow({ windowSeconds: 1, framesPerSecond: 7 });
    // Model: the frames the window should hold (newest last).
    let kept: Float32Array[] = [];
    let seed = 99;
    const rand = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    const check = () => {
      const expected = new Array(12).fill(0);
      for (const f of kept) for (let j = 0; j < 12; j++) expected[j] += f[j] / kept.length;
      const raw = w.aggregateRaw();
      expect(w.size).toBe(kept.length);
      for (let j = 0; j < 12; j++) expect(raw[j]).toBeCloseTo(expected[j], 5);
    };
    const resize = (fps: number) => {
      w.resize({ windowSeconds: 1, framesPerSecond: fps });
      kept = kept.slice(-w.maxSize);
      check();
    };
    for (let i = 0; i < 200; i++) {
      const f = new Float32Array(12).map(() => rand());
      w.push(f);
      kept.push(f);
      kept = kept.slice(-w.maxSize);
      check();
      if (i === 50) resize(3);
      if (i === 120) resize(11);
    }
  });
});
