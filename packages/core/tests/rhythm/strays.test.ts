// @vitest-environment node
import { describe, expect, it } from "vitest";

import { StreamHistory } from "../../src/analysis/onset/afterOnset";
import { exerciseScore, PlayAlongSession, scoreTimings, STRAY_PENALTY } from "../../src/rhythm";

// Four notes one second apart: windows of ±300 ms (the default).
const notes = [1, 2, 3, 4].map((time, id) => ({ id, time }));

describe("stray sounds", () => {
  it("are the sounds outside every window, not the second strum on a note", () => {
    const state = scoreTimings(notes, [
      { id: 0, time: 1.0 },
      { id: 1, time: 1.08 }, // a second strum on note 0: an extra, not a stray
      { id: 2, time: 1.5 }, // between notes 0 and 1: a stray
      { id: 3, time: 2.02 },
      { id: 4, time: 3.0 },
      { id: 5, time: 4.0 },
      { id: 6, time: 4.6 }, // after the last note: a stray
    ]);
    expect(state.extras.map((o) => o.id)).toEqual([1, 2, 6]);
    expect(state.strays.map((o) => o.id)).toEqual([2, 6]);
  });

  it("cost a quarter of a perfect note, never below 0", () => {
    expect(STRAY_PENALTY).toBe(0.25);
    const s = exerciseScore([1, 1, 0.8, 0.6], 2);
    expect(s.notes).toBeCloseTo(85, 9);
    expect(s.penalty).toBeCloseTo(12.5, 9);
    expect(s.score).toBeCloseTo(72.5, 9);
    expect(s.passed).toBe(3);
    // Playing everywhere does not pay.
    expect(exerciseScore([1, 0, 0, 0], 12).score).toBe(0);
    expect(exerciseScore([], 3).score).toBe(0);
    expect(exerciseScore([1, null], 0, 0).score).toBe(50);
  });

  it("are flagged in a play-along session", () => {
    const session = new PlayAlongSession(notes, { sampleRate: 48000 });
    const history = new StreamHistory(48000);
    [1.01, 1.5, 2.0, 3.0, 4.0].forEach((time, id) =>
      session.onset({ id, time, frame: Math.round(time * 48000) }),
    );
    session.update(history, 5);
    expect(session.strays).toBe(1);
    expect(session.onsets.filter((o) => o.stray).map((o) => o.id)).toEqual([1]);
  });
});
