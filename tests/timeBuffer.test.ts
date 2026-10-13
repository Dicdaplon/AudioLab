// @vitest-environment node
import { describe, it, expect } from "vitest";

import { TimeRingBuffer } from "../src/analysis/timeBuffer";

/** Reference model: a plain array trimmed to the newest `capacity` values. */
class ArrayModel {
  private data: number[] = [];
  constructor(private capacity: number) {}
  push(v: number): void {
    this.data.push(v);
    if (this.data.length > this.capacity) this.data.shift();
  }
  lastChronological(count: number): number[] {
    const tail = this.data.slice(Math.max(0, this.data.length - count));
    return [...new Array(count - tail.length).fill(0), ...tail];
  }
}

describe("TimeRingBuffer", () => {
  it("rejects invalid capacity", () => {
    expect(() => new TimeRingBuffer(0)).toThrow();
    expect(() => new TimeRingBuffer(-1)).toThrow();
    expect(() => new TimeRingBuffer(NaN)).toThrow();
  });

  it("reports correct capacity and initial size", () => {
    const buf = new TimeRingBuffer(100);
    expect(buf.capacity).toBe(100);
    expect(buf.size).toBe(0);
    expect(buf.isFull).toBe(false);
  });

  it("appends single samples and arrays", () => {
    const buf = new TimeRingBuffer(10);
    buf.push(1);
    buf.push(2);
    buf.push(new Float32Array([3, 4]));
    expect(buf.size).toBe(4);
  });

  it("wraps around when full", () => {
    const buf = new TimeRingBuffer(5);
    buf.push(new Float32Array([1, 2, 3, 4, 5]));
    expect(buf.size).toBe(5);
    expect(buf.isFull).toBe(true);
    buf.push(6);
    expect(buf.size).toBe(5);
  });

  it("lastSamples returns newest first, lastSeconds oldest first", () => {
    const buf = new TimeRingBuffer(5);
    buf.push([1, 2, 3, 4, 5, 6, 7]);
    expect(Array.from(buf.lastSamples(5))).toEqual([7, 6, 5, 4, 3]);
    expect(Array.from(buf.lastSeconds(5 / 100, 100))).toEqual([3, 4, 5, 6, 7]);
  });

  it("lastSamples pads with zeros when fewer samples are stored", () => {
    const buf = new TimeRingBuffer(10);
    buf.push(new Float32Array([1, 2, 3]));
    expect(Array.from(buf.lastSamples(10))).toEqual([3, 2, 1, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("lastSamples(count > capacity) never duplicates samples or returns NaN", () => {
    const partial = new TimeRingBuffer(5);
    partial.push([1, 2, 3]);
    expect(Array.from(partial.lastSamples(7))).toEqual([3, 2, 1, 0, 0, 0, 0]);

    const wrapped = new TimeRingBuffer(4);
    wrapped.push([1, 2, 3, 4, 5, 6]);
    const out = Array.from(wrapped.lastSamples(6));
    expect(out).toEqual([6, 5, 4, 3, 0, 0]);
    expect(out.every(Number.isFinite)).toBe(true);
  });

  it("lastSamplesChronological left-pads with zeros", () => {
    const buf = new TimeRingBuffer(4);
    buf.push([1, 2]);
    expect(Array.from(buf.lastSamplesChronological(4))).toEqual([0, 0, 1, 2]);
    expect(Array.from(buf.lastSamplesChronological(1))).toEqual([2]);
    expect(buf.lastSamplesChronological(0)).toHaveLength(0);
  });

  it("push of an array longer than capacity keeps only the newest samples", () => {
    const buf = new TimeRingBuffer(3);
    buf.push([1, 2, 3, 4, 5, 6, 7]);
    expect(buf.size).toBe(3);
    expect(Array.from(buf.lastSeconds(3, 1))).toEqual([5, 6, 7]);
    buf.push(8);
    expect(Array.from(buf.lastSeconds(3, 1))).toEqual([6, 7, 8]);
  });

  it("lastSeconds extracts a duration-based window in chronological order", () => {
    const buf = new TimeRingBuffer(1000);
    for (let i = 0; i < 200; i++) buf.push(i);
    const lastSec = buf.lastSeconds(1, 100);
    expect(lastSec).toHaveLength(100);
    expect(lastSec[0]).toBe(100);
    expect(lastSec[99]).toBe(199);
  });

  it("reset clears the buffer", () => {
    const buf = new TimeRingBuffer(10);
    buf.push(new Float32Array([1, 2, 3]));
    buf.reset();
    expect(buf.size).toBe(0);
    expect(buf.isFull).toBe(false);
    expect(Array.from(buf.lastSamples(2))).toEqual([0, 0]);
  });

  it("matches a naive array model under a seeded random workload", () => {
    const capacity = 7;
    const buf = new TimeRingBuffer(capacity);
    const model = new ArrayModel(capacity);
    let seed = 12345;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let step = 0; step < 500; step++) {
      const n = 1 + Math.floor(rand() * 10);
      const chunk = new Float32Array(n).map(() => Math.floor(rand() * 100));
      buf.push(chunk);
      for (const v of chunk) model.push(v);
      const count = 1 + Math.floor(rand() * 12);
      expect(Array.from(buf.lastSamplesChronological(count))).toEqual(
        model.lastChronological(count),
      );
      expect(Array.from(buf.lastSamples(count))).toEqual(model.lastChronological(count).reverse());
    }
  });
});
