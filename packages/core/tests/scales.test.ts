import { describe, expect, it } from "vitest";

import {
  SCALES,
  SCALE_NAMES_EN,
  matchScales,
  scalePitchClasses,
  type ScaleDefinition,
} from "../src/analysis/scales";

/** Presence vector with the given pitch classes at `weight` (1 by default). */
function presence(pitchClasses: number[], weight = 1): Float32Array {
  const p = new Float32Array(12);
  for (const pc of pitchClasses) p[pc] = weight;
  return p;
}

const C = 0;
const D = 2;
const E = 4;
const F = 5;
const G = 7;
const A = 9;
const B = 11;

describe("built-in scales", () => {
  it("covers the requested families with stable ids and labels", () => {
    const ids = SCALES.map((s) => s.id);
    expect(ids).toEqual([
      "major",
      "minor",
      "harmonic-minor",
      "melodic-minor",
      "dorian",
      "phrygian",
      "lydian",
      "mixolydian",
      "locrian",
      "major-pentatonic",
      "minor-pentatonic",
      "blues",
    ]);
    for (const scale of SCALES) {
      expect(scale.intervals[0]).toBe(0);
      expect([...scale.intervals]).toEqual([...scale.intervals].sort((a, b) => a - b));
      expect(new Set(scale.intervals).size).toBe(scale.intervals.length);
      expect(SCALE_NAMES_EN[scale.id]).toBeTypeOf("string");
    }
  });

  it("rotates a scale to a tonic", () => {
    const major = SCALES.find((s) => s.id === "major")!;
    expect(scalePitchClasses(major, G)).toEqual([7, 9, 11, 0, 2, 4, 6]);
    expect(scalePitchClasses(major, -5)).toEqual([7, 9, 11, 0, 2, 4, 6]);
  });
});

describe("matchScales", () => {
  it("ranks C major pentatonic and A minor pentatonic first for C D E G A", () => {
    const matches = matchScales(presence([C, D, E, G, A]));
    expect(matches[0]).toMatchObject({
      scaleId: "major-pentatonic",
      tonic: C,
      score: 1,
      missing: [],
      outside: [],
    });
    expect(matches[1]).toMatchObject({
      scaleId: "minor-pentatonic",
      tonic: A,
      score: 1,
      missing: [],
      outside: [],
    });
    expect(matches[0].pitchClasses).toEqual([C, D, E, G, A]);
    // Then A blues (one missing: the blue note), then the seven-note scales
    // that hold all five notes, two missing each, in list order then by
    // tonic: C major, F major, G major, ...
    expect(matches[2]).toMatchObject({ scaleId: "blues", tonic: A, missing: [3], outside: [] });
    expect(matches.slice(3, 6).map((m) => [m.scaleId, m.tonic])).toEqual([
      ["major", C],
      ["major", F],
      ["major", G],
    ]);
    expect(matches[3].missing).toEqual([F, B]);
    expect(matches[3].score).toBeCloseTo(5 / 7, 6);
    expect(matches).toHaveLength(SCALES.length * 12);
  });

  it("puts every scale containing all played notes before any with an outside note", () => {
    const matches = matchScales(presence([C, D, E, F, G, A, B]));
    const firstOutside = matches.findIndex((m) => m.outside.length > 0);
    expect(matches[0]).toMatchObject({ scaleId: "major", tonic: C, missing: [], outside: [] });
    // The seven modes of C major share its notes: 7 candidates with nothing
    // missing (major C, minor A, dorian D, phrygian E, lydian F, mixolydian G, locrian B).
    expect(matches.slice(0, 7).map((m) => [m.scaleId, m.tonic])).toEqual([
      ["major", C],
      ["minor", A],
      ["dorian", D],
      ["phrygian", E],
      ["lydian", F],
      ["mixolydian", G],
      ["locrian", B],
    ]);
    for (const m of matches.slice(0, firstOutside)) expect(m.outside).toEqual([]);
    expect(matches[firstOutside].outside.length).toBeGreaterThan(0);
  });

  it("reports missing and outside notes", () => {
    const blues = SCALES.filter((s) => s.id === "blues");
    const [match] = matchScales(presence([A, C, D, E, G, 1]), blues); // A blues + C#
    expect(match).toMatchObject({ scaleId: "blues", tonic: A });
    expect(match.missing).toEqual([3]); // D# (the blue note) was not played
    expect(match.outside).toEqual([1]); // C# is not in A blues
    expect(match.score).toBeCloseTo((5 / 6) * (5 / 6), 6);
  });

  it("uses the weights to break ties between scales with one outside note", () => {
    // F major (F G A Bb C D E) and G major (G A B C D E F#) both miss one
    // played note when B and Bb are both heard: the heavier one wins.
    const p = presence([C, D, E, F, G, A]);
    p[10] = 0.9; // Bb strong
    p[B] = 0.1; // B weak
    const majors = SCALES.filter((s) => s.id === "major");
    const [first, second] = matchScales(p, majors);
    expect(first).toMatchObject({ tonic: F, outside: [B] });
    expect(second).toMatchObject({ tonic: C, outside: [10] });
  });

  it("applies the presence threshold", () => {
    const p = presence([C, E, G], 0.8);
    p[1] = 0.05; // C# below threshold
    const strict = matchScales(p, undefined, { threshold: 0.1 });
    expect(strict[0].outside).toEqual([]);
    const lax = matchScales(p, undefined, { threshold: 0 });
    expect(lax[0].outside.length + lax[0].missing.length).toBeGreaterThan(0);
  });

  it("returns an empty list when nothing was played", () => {
    expect(matchScales(new Float32Array(12))).toEqual([]);
    expect(matchScales(presence([C], 0.5), undefined, { threshold: 0.5 })).toEqual([]);
  });

  it("limits the result with topN and accepts caller-provided scales", () => {
    const wholeTone: ScaleDefinition = { id: "whole-tone", intervals: [0, 2, 4, 6, 8, 10] };
    const matches = matchScales(presence([C, D, E]), [wholeTone], { topN: 3 });
    expect(matches).toHaveLength(3);
    expect(matches.map((m) => m.tonic)).toEqual([C, D, E]);
    expect(matches[0].scaleId).toBe("whole-tone");
    expect(matches[0].missing).toEqual([6, 8, 10]);
  });

  it("accepts 0/1 arrays and rejects other lengths", () => {
    const flags = [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0]; // C D E G A
    expect(matchScales(flags)[0]).toMatchObject({ scaleId: "major-pentatonic", tonic: C });
    expect(() => matchScales([1, 0, 1])).toThrow(/length 12/);
  });
});
