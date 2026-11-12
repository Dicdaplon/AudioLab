import { describe, expect, it } from "vitest";

import {
  chordDegree,
  fifthsIndex,
  keyPitchClasses,
  scaleDegree,
} from "../../../src/analysis/readout/harmony";

describe("harmony readouts", () => {
  it("lists the notes of a key", () => {
    expect(keyPitchClasses(0, "maj")).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(keyPitchClasses(9, "min")).toEqual([9, 11, 0, 2, 4, 5, 7]);
  });

  it("gives scale degrees, with the raised seventh in minor", () => {
    expect(scaleDegree(7, 0, "maj")).toBe(5);
    expect(scaleDegree(1, 0, "maj")).toBeNull();
    expect(scaleDegree(8, 9, "min")).toBe(7); // G sharp in A minor
    expect(scaleDegree(-3, 0, "maj")).toBe(6);
  });

  it("orders pitch classes on the circle of fifths", () => {
    expect([0, 7, 2, 9, 5, 11].map(fifthsIndex)).toEqual([0, 1, 2, 3, 11, 5]);
  });

  it("names chords as roman numerals in major", () => {
    expect(chordDegree(0, "maj", 0, "maj")).toEqual({ degree: 1, numeral: "I", diatonic: true });
    expect(chordDegree(9, "min", 0, "maj")).toEqual({ degree: 6, numeral: "vi", diatonic: true });
    expect(chordDegree(7, "dom7", 0, "maj")).toEqual({ degree: 5, numeral: "V7", diatonic: true });
    expect(chordDegree(11, "min7b5", 0, "maj")).toMatchObject({ numeral: "viiø7", diatonic: true });
    expect(chordDegree(10, "maj", 0, "maj")).toEqual({
      degree: 7,
      numeral: "♭VII",
      diatonic: false,
    });
    expect(chordDegree(2, "dom7", 0, "maj")).toMatchObject({ numeral: "II7", diatonic: false });
  });

  it("names chords in minor, with the harmonic-minor V and vii°", () => {
    expect(chordDegree(0, "maj", 9, "min").numeral).toBe("III");
    expect(chordDegree(4, "dom7", 9, "min")).toMatchObject({ numeral: "V7", diatonic: true });
    expect(chordDegree(8, "dim", 9, "min")).toEqual({ degree: 7, numeral: "vii°", diatonic: true });
    expect(chordDegree(2, "min", 9, "min").numeral).toBe("iv");
  });

  it("spells chromatic roots the usual way", () => {
    expect(chordDegree(6, "dim", 0, "maj").numeral).toBe("♯iv°"); // F sharp dim in C
    expect(chordDegree(8, "maj", 0, "maj").numeral).toBe("♭VI");
    expect(chordDegree(6, "min", 9, "min").numeral).toBe("♯vi"); // F sharp m in A minor
    expect(chordDegree(10, "maj", 9, "min").numeral).toBe("♭II");
  });
});
