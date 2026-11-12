import { describe, expect, it } from "vitest";

import type { PitchEstimate } from "../../../src/analysis/pitch";
import { NoteSegmenter } from "../../../src/analysis/readout/noteSegments";

function est(midi: number, cents = 0, clarity = 0.9): PitchEstimate {
  return { frequency: 440, midi, pitchClass: midi % 12, cents, clarity };
}

/** Feed `midi` (null = silence) every 20 ms from `from` for `seconds`. */
function feed(s: NoteSegmenter, from: number, seconds: number, midi: number | null, cents = 0) {
  for (let t = from; t < from + seconds - 1e-9; t += 0.02)
    s.push(midi === null ? null : est(midi, cents), t);
}

describe("NoteSegmenter", () => {
  it("turns a melody into timed notes with their mean cents", () => {
    const s = new NoteSegmenter();
    feed(s, 0, 0.3, 69, 4);
    feed(s, 0.3, 0.2, 71, -8);
    feed(s, 0.5, 0.3, null);
    const notes = s.notes;
    expect(notes.map((n) => n.midi)).toEqual([69, 71]);
    expect(notes[0].cents).toBeCloseTo(4);
    expect(notes[0].start).toBe(0);
    expect(notes[0].end).toBeCloseTo(0.3, 1);
    expect(notes[1].open).toBe(false);
    expect(notes[1].end).toBeLessThan(0.6);
  });

  it("bridges short dropouts, but splits on a new attack", () => {
    const s = new NoteSegmenter();
    feed(s, 0, 0.2, 64);
    feed(s, 0.2, 0.06, null);
    feed(s, 0.26, 0.2, 64);
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0].open).toBe(true);
    s.onset(0.46);
    feed(s, 0.46, 0.2, 64);
    expect(s.notes).toHaveLength(2);
  });

  it("drops glitches and unclear estimates, keeps a bounded history, and resets", () => {
    const s = new NoteSegmenter({ historyLength: 3 });
    s.push(est(60), 0);
    s.push(est(62), 0.02);
    s.push(est(62, 0, 0.3), 0.04);
    feed(s, 0.2, 0.1, null);
    expect(s.notes).toHaveLength(0);
    for (let i = 0; i < 5; i++) feed(s, 1 + i * 0.2, 0.2, 60 + i);
    expect(s.notes.map((n) => n.midi)).toEqual([62, 63, 64]);
    s.reset();
    expect(s.notes).toHaveLength(0);
  });
});
