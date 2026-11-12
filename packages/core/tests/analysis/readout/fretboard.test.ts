import { describe, expect, it } from "vitest";

import { FretPlacer, STANDARD_TUNING } from "../../../src/analysis/readout/fretboard";

describe("FretPlacer", () => {
  it("lists every place a note can be played, up to the last fret", () => {
    const f = new FretPlacer();
    // E4 (64): 14th fret D, 9th G, 5th B, open high E (A string 19 and low E 24 are off the neck).
    expect(f.positions(64)).toEqual([
      { string: 2, fret: 14 },
      { string: 3, fret: 9 },
      { string: 4, fret: 5 },
      { string: 5, fret: 0 },
    ]);
    expect(f.positions(39)).toEqual([]);
    expect(f.place(30)).toBeNull();
    expect(STANDARD_TUNING).toEqual([40, 45, 50, 55, 59, 64]);
  });

  it("reads in first position by default, open strings included", () => {
    const f = new FretPlacer();
    const line = [45, 48, 50, 52, 55, 57, 60].map((m) => f.place(m)!);
    expect(line.every((p) => p.fret <= 3)).toBe(true);
    expect(line[0]).toEqual({ string: 1, fret: 0 });
  });

  it("starts in the pentatonic box of the key: A minor at the 5th fret", () => {
    const f = new FretPlacer();
    f.startInKey(9);
    // A minor pentatonic box: A C D E G A C D, all inside frets 4–8, no open strings.
    const box = [45, 48, 50, 52, 55, 57, 60, 62].map((m) => f.place(m)!);
    expect(box.every((p) => p.fret >= 4 && p.fret <= 8)).toBe(true);
    expect(box[0]).toEqual({ string: 0, fret: 5 });
    f.startInKey(4); // E: tonic on the open low E reads at the 12th fret
    expect(f.place(52)).toEqual({ string: 0, fret: 12 });
  });

  it("ignores one stray note, and moves the hand after two", () => {
    const f = new FretPlacer();
    f.startInKey(9);
    f.place(57); // A, 7th fret D string
    const stray = f.place(76); // E5, 12th fret high E: outside the window
    expect(stray!.fret).toBeGreaterThan(8);
    expect(f.place(60)).toEqual({ string: 3, fret: 5 }); // back in the box, no shift happened
    f.place(76);
    f.place(77);
    // The hand followed: the next note in that register stays up the neck.
    expect(f.place(74)!.fret).toBeGreaterThanOrEqual(10);
  });

  it("prefers a nearby string to a long jump, and resets", () => {
    const f = new FretPlacer();
    f.startInKey(9);
    f.place(64); // E4 on the B string, 5th fret
    const next = f.place(67)!; // G4: 8th fret B string (no jump) rather than 3rd fret high E
    expect(next).toEqual({ string: 4, fret: 8 });
    f.reset();
    expect(f.place(52)).toEqual({ string: 2, fret: 2 });
  });
});
