// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  beamGroups,
  eventsFromDurations,
  figureOf,
  playedBeats,
  rhythmLength,
  staffStep,
} from "../../src/rhythm";

describe("rhythm notation", () => {
  it("turns durations into events, rests included", () => {
    const events = eventsFromDurations([1, 1, -1, 0.5, 0.5]);
    expect(events).toEqual([
      { beat: 0, duration: 1, rest: false },
      { beat: 1, duration: 1, rest: false },
      { beat: 2, duration: 1, rest: true },
      { beat: 3, duration: 0.5, rest: false },
      { beat: 3.5, duration: 0.5, rest: false },
    ]);
    expect(playedBeats(events)).toEqual([0, 1, 3, 3.5]);
    expect(rhythmLength(events)).toBe(4);
    expect(eventsFromDurations([1], 4)[0].beat).toBe(4);
  });

  it("picks the figure of a duration", () => {
    expect(figureOf(4)).toMatchObject({ base: 4, hollow: true, stem: false, flags: 0 });
    expect(figureOf(2)).toMatchObject({ base: 2, hollow: true, stem: true });
    expect(figureOf(1.5)).toMatchObject({ base: 1, dotted: true });
    expect(figureOf(0.5)).toMatchObject({ base: 0.5, flags: 1 });
    expect(figureOf(0.25)).toMatchObject({ base: 0.25, flags: 2 });
    expect(figureOf(0.75)).toMatchObject({ base: 0.5, dotted: true });
    expect(figureOf(1.2)).toMatchObject({ base: 1, dotted: false }); // no figure: the one below
    expect(figureOf(1.5).id).toBe("quarter");
    expect(figureOf(0.25).id).toBe("sixteenth");
    expect(figureOf(4).id).toBe("whole");
  });

  it("beams eighths and sixteenths inside a beat, never across one or over a rest", () => {
    const events = eventsFromDurations([1, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, -0.5, 0.5, 0.5, 1]);
    expect(beamGroups(events)).toEqual([[0], [1, 2], [3, 4, 5, 6], [7], [8], [9], [10]]);
    // The syncopated eighth-quarter-eighth: nothing to beam.
    expect(beamGroups(eventsFromDurations([0.5, 1, 0.5]))).toEqual([[0], [1], [2]]);
  });

  it("places notes on the staff by diatonic step", () => {
    expect(staffStep(64)).toEqual({ step: 30, sharp: false }); // E4: bottom line of the treble staff
    expect(staffStep(52 + 12)).toEqual({ step: 30, sharp: false });
    expect(staffStep(61)).toEqual({ step: 28, sharp: true }); // C#4
    expect(staffStep(59).step).toBe(27); // B3
  });
});
