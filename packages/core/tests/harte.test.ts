import { describe, expect, it } from "vitest";

import { majMin, parseHarte, parseHarteKey } from "./helpers/harte";

describe("Harte chord labels", () => {
  it("reads roots with accidentals and drops bass and extensions", () => {
    expect(parseHarte("C#:maj/5")).toEqual({ root: 1, quality: "maj" });
    expect(parseHarte("Bb:7")).toEqual({ root: 10, quality: "dom7" });
    expect(parseHarte("A:hdim7/b3")).toEqual({ root: 9, quality: "min7b5" });
    expect(parseHarte("C#:maj(b13)/b6")).toEqual({ root: 1, quality: "maj" });
    expect(parseHarte("Cb:min")).toEqual({ root: 11, quality: "min" });
    expect(parseHarte("G")).toEqual({ root: 7, quality: "maj" });
  });

  it("gives null for no chord and unknown qualities", () => {
    expect(parseHarte("N")).toBeNull();
    expect(parseHarte("C:aug")).toBeNull();
  });

  it("reduces to majmin like MIREX", () => {
    expect(majMin(parseHarte("G:7"))).toEqual({ root: 7, quality: "maj" });
    expect(majMin(parseHarte("A:min7"))).toEqual({ root: 9, quality: "min" });
    expect(majMin(parseHarte("B:hdim7"))).toBeNull();
  });

  it("reads GuitarSet keys", () => {
    expect(parseHarteKey("F#:minor")).toEqual({ tonic: 6, mode: "min" });
    expect(parseHarteKey("Eb:major")).toEqual({ tonic: 3, mode: "maj" });
  });
});
