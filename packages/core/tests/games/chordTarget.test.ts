import { describe, expect, it } from "vitest";

import type { ChordQuality, ChordScore } from "../../src/analysis/chordDetection";
import { ChordTargetMatcher, type ChordRef } from "../../src/games";

function frame(root: number, quality: ChordQuality, probability = 0.6, signalLevelDb?: number) {
  const chords: ChordScore[] = [{ root, quality, name: "", similarity: 0.9, probability }];
  return { chords, signalLevelDb };
}

const E7: ChordRef = { root: 4, quality: "dom7" };

describe("ChordTargetMatcher", () => {
  it("confirms a target held for `confirmations` frames", () => {
    const m = new ChordTargetMatcher();
    expect(m.push(frame(4, "dom7"), E7)).toMatchObject({ matched: true, count: 1 });
    expect(m.push(frame(4, "dom7"), E7).count).toBe(2);
    expect(m.push(frame(4, "dom7"), E7)).toMatchObject({ confirmed: true, count: 0 });
  });

  it("applies the accept policy", () => {
    const exact = new ChordTargetMatcher();
    expect(exact.push(frame(4, "maj"), E7).matched).toBe(false);
    const triad = new ChordTargetMatcher({ accept: "triad" });
    triad.push(frame(4, "maj"), E7);
    triad.push(frame(4, "dom7"), E7);
    expect(triad.push(frame(4, "maj"), E7).confirmed).toBe(true);
  });

  it("restarts on a miss, a weak frame, a closed gate or a new target", () => {
    const m = new ChordTargetMatcher({ noiseGateDb: -60 });
    m.push(frame(4, "dom7"), E7);
    expect(m.push(frame(9, "maj"), E7).count).toBe(0);
    m.push(frame(4, "dom7"), E7);
    expect(m.push(frame(4, "dom7", 0.1), E7).count).toBe(0);
    m.push(frame(4, "dom7"), E7);
    expect(m.push(frame(4, "dom7", 0.6, -70), E7).count).toBe(0);
    m.push(frame(4, "dom7"), E7);
    expect(m.push(frame(9, "maj"), { root: 9, quality: "maj" }).count).toBe(1);
    expect(m.push(frame(9, "maj"), null)).toMatchObject({ matched: false, count: 0 });
  });

  it("configure and reset", () => {
    const m = new ChordTargetMatcher();
    m.configure({ confirmations: 1 });
    expect(m.config.confirmations).toBe(1);
    expect(m.push(frame(4, "dom7"), E7).confirmed).toBe(true);
    m.configure({ confirmations: 3 });
    m.push(frame(4, "dom7"), E7);
    expect(m.count).toBe(1);
    m.reset();
    expect(m.count).toBe(0);
    expect(m.push({ chords: [] }, E7)).toMatchObject({ top: null, matched: false });
  });
});
