/**
 * Regression floors on the synthetic guitar chord confusion (the README
 * tables come from `npm run measure:chords`, which uses more takes). The
 * model is not a recording: these guard the detector against drifting,
 * they do not prove guitar accuracy.
 */
import { describe, expect, it } from "vitest";

import { GUITAR_VOICINGS, QUALITY_SETS, guitarChordConfusion } from "../helpers/guitarChords";

const SEEDS = [1, 2];

describe("synthetic guitar chords", () => {
  it("triads only: every major and minor voicing is read right", () => {
    const { confusion } = guitarChordConfusion(GUITAR_VOICINGS, {
      qualities: QUALITY_SETS.triads,
      seeds: SEEDS,
    });
    for (const name of ["E", "Em", "A", "Am", "C", "D", "Dm", "G"]) {
      expect(confusion.share(name, name), name).toBe(1);
    }
  });

  it("all qualities: the neighbours are told apart", () => {
    const { confusion } = guitarChordConfusion(GUITAR_VOICINGS, {
      qualities: QUALITY_SETS.all,
      seeds: SEEDS,
    });
    expect(confusion.rate("exact")).toBeGreaterThanOrEqual(0.9);
    // Triads never turn into their seventh, sixth or suspended neighbours.
    for (const name of ["E", "A", "Am", "C", "D"]) {
      expect(confusion.share(name, name), name).toBe(1);
    }
    for (const name of ["E7", "A7", "D7", "Asus4", "Dsus4", "C6"]) {
      expect(confusion.share(name, name), name).toBeGreaterThanOrEqual(0.75);
    }
  });

  it("sevenths: the triad policy accepts every seventh as its triad and back", () => {
    const { confusion } = guitarChordConfusion(GUITAR_VOICINGS, {
      qualities: QUALITY_SETS.sevenths,
      seeds: SEEDS,
    });
    expect(confusion.share("E7", "E7") + confusion.share("E7", "E")).toBe(1);
    expect(confusion.share("A7", "A7") + confusion.share("A7", "A")).toBe(1);
  });
});
