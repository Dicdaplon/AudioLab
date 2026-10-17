import { describe, expect, it } from "vitest";

import { CHORD_QUALITIES, type ChordQuality } from "../../src/analysis/chordDetection";
import {
  chordKey,
  matchesTarget,
  parseChordKey,
  type ChordAcceptPolicy,
  type ChordRef,
} from "../../src/games";

const chord = (root: number, quality: ChordQuality): ChordRef => ({ root, quality });

describe("parseChordKey", () => {
  it("round-trips every chord of every quality", () => {
    for (const quality of CHORD_QUALITIES) {
      for (let root = 0; root < 12; root++) {
        expect(parseChordKey(chordKey(chord(root, quality)))).toEqual(chord(root, quality));
      }
    }
    expect(chordKey(chord(4, "dom7"))).toBe("4-dom7");
    expect(() => parseChordKey("4-7")).toThrow(/invalid chord key/);
    expect(() => parseChordKey("4-dom7x")).toThrow(/invalid chord key/);
  });
});

describe("matchesTarget", () => {
  const E = chord(4, "maj");
  const E7 = chord(4, "dom7");
  const A = chord(9, "maj");
  const Am = chord(9, "min");
  const Am7 = chord(9, "min7");
  const C6 = chord(0, "maj6");
  const Asus2 = chord(9, "sus2");
  const Asus4 = chord(9, "sus4");
  const Esus4 = chord(4, "sus4");

  const cases: [ChordRef, ChordRef, exact: boolean, triad: boolean][] = [
    [E, E, true, true],
    [E, E7, false, true],
    [E7, E, false, true],
    [Am, Am7, false, true],
    [A, Am, false, false],
    [Asus4, A, false, false],
    [Asus2, Asus4, false, false],
    // Identical pitch sets: chroma cannot tell them apart.
    [C6, Am7, true, true],
    [Esus4, Asus2, true, true],
    [chord(0, "min6"), chord(9, "min7b5"), true, true],
    [chord(11, "min7b5"), chord(11, "dim"), false, true],
  ];

  it.each(cases)("%j against %j", (detected, target, exact, triad) => {
    const check = (accept: ChordAcceptPolicy) => matchesTarget(detected, target, { accept });
    expect(check("exact")).toBe(exact);
    expect(check("triad")).toBe(triad);
    expect(matchesTarget(detected, target)).toBe(exact);
  });
});
