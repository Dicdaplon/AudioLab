import { describe, expect, it } from "vitest";

import type { ChordQuality, ChordScore } from "../../../src/analysis/chordDetection";
import { ChordChangeTracker } from "../../../src/analysis/readout/chordChanges";

function c(root: number, quality: ChordQuality, probability: number): ChordScore {
  return { root, quality, name: `${root}${quality}`, similarity: 0.9, probability };
}
const AM = [c(9, "min", 0.5), c(0, "maj", 0.2)];
const C = [c(0, "maj", 0.5), c(9, "min", 0.2)];
const CLOSE = [c(0, "maj", 0.3), c(9, "min", 0.28)];

describe("ChordChangeTracker", () => {
  it("confirms a chord after the hold time, once", () => {
    const t = new ChordChangeTracker();
    expect(t.push(AM, -20, 0).changed).toBe(false);
    expect(t.push(AM, -20, 0.1).current).toBeNull();
    const r = t.push(AM, -20, 0.3);
    expect(r.changed).toBe(true);
    expect(r.current).toMatchObject({ root: 9, quality: "min" });
    expect(t.push(AM, -20, 0.4).changed).toBe(false);
  });

  it("ignores a flicker shorter than the hold time", () => {
    const t = new ChordChangeTracker();
    t.push(AM, -20, 0);
    t.push(AM, -20, 0.3);
    t.push(C, -20, 1.0);
    expect(t.push(AM, -20, 1.1).current?.root).toBe(9);
    expect(t.push(AM, -20, 2).history).toHaveLength(1);
  });

  it("needs a margin and a minimum gap between changes", () => {
    const t = new ChordChangeTracker();
    t.push(AM, -20, 0);
    t.push(AM, -20, 0.3);
    t.push(CLOSE, -20, 0.35);
    expect(t.push(CLOSE, -20, 0.65).changed).toBe(false); // lead 0.02 < 0.04
    t.push(C, -20, 0.66);
    expect(t.push(C, -20, 0.69).changed).toBe(false); // held 0.34 s but gap 0.39 s
    expect(t.push(C, -20, 0.71).changed).toBe(true);
  });

  it("keeps a timed history, trimmed to its length", () => {
    const t = new ChordChangeTracker({ historyLength: 2, minGapSeconds: 0 });
    let time = 0;
    for (const chords of [AM, C, AM]) {
      t.push(chords, -20, (time += 0.01));
      t.push(chords, -20, (time += 0.3));
    }
    const r = t.push(AM, -20, (time += 1));
    expect(r.history.map((s) => s.chord.root)).toEqual([0, 9]);
    expect(r.history[1].end).toBeCloseTo(time);
    expect(r.history[0].end - r.history[0].start).toBeGreaterThan(0);
  });

  it("turns silent after sustained quiet without a change", () => {
    const t = new ChordChangeTracker();
    t.push(AM, -20, 0);
    t.push(AM, -20, 0.3);
    expect(t.push(C, -95, 0.4).silent).toBe(false);
    const r = t.push(C, -95, 1.1);
    expect(r).toMatchObject({ silent: true, changed: false, runnerUp: null });
    expect(r.current?.root).toBe(9);
    expect(t.push(AM, -20, 1.2).silent).toBe(false);
  });

  it("reports a close runner-up, and resets", () => {
    const t = new ChordChangeTracker();
    expect(t.push(CLOSE, -20, 0).runnerUp?.root).toBe(9);
    t.push(C, -20, 0.1);
    t.push(C, -20, 0.4);
    expect(t.push(CLOSE, -20, 0.5).runnerUp?.root).toBe(9);
    expect(t.push([c(9, "min", 0.3), c(0, "maj", 0.29)], -20, 0.6).runnerUp?.root).toBe(9);
    t.reset();
    expect(t.push([], -20, 1)).toMatchObject({ current: null, history: [], margin: 0 });
  });
});
