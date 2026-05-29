// @vitest-environment node
import { describe, it, expect } from "vitest";

import { TimeRingBuffer } from "../src/analysis/timeBuffer";

describe("TimeRingBuffer", () => {
  it("rejects invalid capacity", () => {
    expect(() => new TimeRingBuffer(0)).toThrow();
    expect(() => new TimeRingBuffer(-1)).toThrow();
  });

  it("reports correct capacity and initial size", () => {
    const buf = new TimeRingBuffer(100);
    expect(buf.capacity).toBe(100);
    expect(buf.size).toBe(0);
    expect(buf.isFull).toBe(false);
  });

  it("appends single samples", () => {
    const buf = new TimeRingBuffer(10);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.size).toBe(3);
  });

  it("appends arrays of samples", () => {
    const buf = new TimeRingBuffer(10);
    buf.push(new Float32Array([1, 2, 3]));
    expect(buf.size).toBe(3);
  });

  it("wraps around when full", () => {
    const buf = new TimeRingBuffer(5);
    buf.push(new Float32Array([1, 2, 3, 4, 5]));
    expect(buf.size).toBe(5);

    // Next push triggers the wrap and marks as full.
    buf.push(6);
    expect(buf.size).toBe(5);
    expect(buf.isFull).toBe(true);
  });

  it("lastSamples returns newest samples in reverse order", () => {
    const buf = new TimeRingBuffer(10);
    buf.push(new Float32Array([1, 2, 3, 4, 5]));

    const last3 = buf.lastSamples(3);
    expect(last3.length).toBe(3);
    expect(last3[0]).toBe(5); // Most recent first.
    expect(last3[1]).toBe(4);
    expect(last3[2]).toBe(3);
  });

  it("lastSamples pads with zeros if requested more than available", () => {
    const buf = new TimeRingBuffer(10);
    buf.push(new Float32Array([1, 2, 3]));

    const last10 = buf.lastSamples(10);
    expect(last10.length).toBe(10);
    expect(last10[0]).toBe(3); // Most recent.
    expect(last10[3]).toBe(0); // Padding.
  });

  it("lastSeconds extracts duration-based window in chronological order", () => {
    const buf = new TimeRingBuffer(1000);
    const sampleRate = 100; // 100 Hz
    const durationSeconds = 1;

    // Push 2 seconds worth of samples.
    for (let i = 0; i < 200; i++) {
      buf.push(i);
    }

    const lastSec = buf.lastSeconds(durationSeconds, sampleRate);
    expect(lastSec.length).toBe(100); // 1 second at 100 Hz.

    // Should be in chronological order (oldest first).
    expect(lastSec[0]).toBe(100); // 100 samples ago.
    expect(lastSec[99]).toBe(199); // Most recent.
  });

  it("reset clears the buffer", () => {
    const buf = new TimeRingBuffer(10);
    buf.push(new Float32Array([1, 2, 3]));
    expect(buf.size).toBe(3);

    buf.reset();
    expect(buf.size).toBe(0);
    expect(buf.isFull).toBe(false);
  });

  it("correctly handles wrap-around in lastSamples", () => {
    const buf = new TimeRingBuffer(5);
    buf.push(new Float32Array([1, 2, 3, 4, 5]));
    buf.push(6); // Now buffer is [6, 2, 3, 4, 5], writeIndex at 1.
    buf.push(7); // Now buffer is [6, 7, 3, 4, 5], writeIndex at 2.

    const last5 = buf.lastSamples(5);
    // Most recent is 7, then 6, then 5, 4, 3.
    expect(last5[0]).toBe(7);
    expect(last5[1]).toBe(6);
    expect(last5[2]).toBe(5);
    expect(last5[3]).toBe(4);
    expect(last5[4]).toBe(3);
  });
});
