/**
 * Clean guitar chord progressions played in a loop (tests/Sample/Am*.mp3).
 *
 * Temporal alignment is not tested: the top-1 chord of every 1 s window is
 * tallied, the N distinct chords of the grid must be exactly the N most
 * frequent winners, and together they must keep winning at least the
 * measured share of windows (minus COVERAGE_SLACK).
 */
import { describe, it } from "vitest";

import { chordHistogram, expectChordGrid } from "./fixtures";

const CASES = [
  { file: "AmDmEAm.mp3", chords: ["Am", "Dm", "E"], coverage: 0.787 },
  { file: "AmGFE.mp3", chords: ["Am", "G", "F", "E"], coverage: 0.854 },
] as const;

describe("chord progressions: sliding chord histogram", () => {
  for (const c of CASES) {
    it(`${c.file}: top ${c.chords.length} winners are exactly {${c.chords.join(", ")}}`, async () => {
      expectChordGrid(c.file, await chordHistogram(c.file), c.chords, c.coverage);
    });
  }
});
