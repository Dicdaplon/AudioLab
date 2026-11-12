import { describe, expect, it } from "vitest";

import type { KeyMode, KeyScore } from "../../../src/analysis/keyDetection";
import { combineKeyRankings, relativeKey } from "../../../src/analysis/readout/keyBlend";

function k(tonic: number, mode: KeyMode, probability: number): KeyScore {
  return { tonic, mode, name: "", shortName: "", correlation: 0.8, probability };
}

describe("relativeKey", () => {
  it("pairs a major key with its relative minor, both ways", () => {
    expect(relativeKey(0, "maj")).toEqual({ tonic: 9, mode: "min" });
    expect(relativeKey(9, "min")).toEqual({ tonic: 0, mode: "maj" });
    expect(relativeKey(7, "maj")).toEqual({ tonic: 4, mode: "min" });
    expect(relativeKey(2, "min")).toEqual({ tonic: 5, mode: "maj" });
  });
});

describe("combineKeyRankings", () => {
  it("averages the energy and presence rankings", () => {
    const r = combineKeyRankings(
      [k(0, "maj", 0.6), k(9, "min", 0.4)],
      [k(9, "min", 0.7), k(0, "maj", 0.3)],
    );
    expect(r).toHaveLength(24);
    expect(r[0].probability).toBeCloseTo(0.55, 5);
    expect(r.reduce((a, s) => a + s.probability, 0)).toBeCloseTo(1, 5);
    expect(r[0]).toMatchObject({ tonic: 9, mode: "min", shortName: "Am", name: "A minor" });
  });

  it("lets the time on the tonic chord pick between relatives", () => {
    const energy = [k(0, "maj", 0.52), k(9, "min", 0.48)];
    const chordsOnAm = [
      { chord: { root: 9, quality: "min" as const, name: "Am" }, start: 0, end: 8 },
      { chord: { root: 0, quality: "maj" as const, name: "C" }, start: 8, end: 9 },
    ];
    expect(combineKeyRankings(energy, [])[0].mode).toBe("maj");
    const r = combineKeyRankings(energy, [], chordsOnAm);
    expect(r[0]).toMatchObject({ tonic: 9, mode: "min" });
    expect(combineKeyRankings(energy, [], chordsOnAm, { chordWeight: 0 })[0].mode).toBe("maj");
  });

  it("copes with empty rankings", () => {
    const r = combineKeyRankings([], []);
    expect(r).toHaveLength(24);
    expect(r[0].probability).toBe(0);
  });
});
