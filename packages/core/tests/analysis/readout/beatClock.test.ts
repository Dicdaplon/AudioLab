import { describe, expect, it } from "vitest";

import { BeatClock } from "../../../src/analysis/readout/beatClock";

/** Distance of a phase to the beat, on the circle (0.999 is as close as 0.001). */
function offBeat(phase: number | undefined): number {
  const p = phase ?? NaN;
  return Math.min(p, 1 - p);
}

describe("BeatClock", () => {
  it("has no phase without a confident tempo or an anchor", () => {
    const b = new BeatClock();
    expect(b.at(1)).toBeNull();
    b.setTempo({ bpm: 120, confidence: 0.9 });
    expect(b.at(1)).toBeNull();
    b.onset(1);
    expect(b.at(1)).toMatchObject({ phase: 0, beat: 0, beatInBar: 0, period: 0.5 });
    b.setTempo({ bpm: 120, confidence: 0.2 });
    expect(b.at(1.25)).toBeNull();
    b.setTempo(null);
    expect(b.at(1.25)).toBeNull();
  });

  it("anchors on an onset seen before the tempo and counts beats in the bar", () => {
    const b = new BeatClock({ beatsPerBar: 3 });
    b.onset(2);
    b.setTempo({ bpm: 60, confidence: 1 });
    expect(b.at(2.5)?.phase).toBeCloseTo(0.5);
    expect(b.at(5.1)).toMatchObject({ beat: 3, beatInBar: 0 });
    expect(b.at(0.5)?.beatInBar).toBe(1); // beat -2
  });

  it("pulls the phase towards on-time onsets and ignores off-beat ones", () => {
    const b = new BeatClock({ gain: 0.5 });
    b.setTempo({ bpm: 60, confidence: 1 });
    b.onset(0);
    b.onset(1.1); // 0.1 period late: the anchor moves by 0.05 s
    expect(offBeat(b.at(2.05)?.phase)).toBeCloseTo(0, 5);
    b.onset(2.55); // half a beat off: ignored
    expect(offBeat(b.at(3.05)?.phase)).toBeCloseTo(0, 5);
    b.reset();
    expect(b.at(3)).toBeNull();
  });
});
