import { describe, expect, it } from "vitest";

import { noteValue } from "../../../src/analysis/readout/noteValues";

describe("noteValue", () => {
  const beat = 60 / 96; // 96 BPM

  it("names the nearest written value at the tempo", () => {
    expect(noteValue(4 * beat, beat)).toBe("whole");
    expect(noteValue(2 * beat, beat)).toBe("half");
    expect(noteValue(beat, beat)).toBe("quarter");
    expect(noteValue(beat / 2, beat)).toBe("eighth");
  });

  it("rounds on a ratio scale, and clamps to the shortest and longest values", () => {
    expect(noteValue(1.4 * beat, beat)).toBe("quarter");
    expect(noteValue(1.5 * beat, beat)).toBe("half");
    expect(noteValue(0.1 * beat, beat)).toBe("eighth");
    expect(noteValue(9 * beat, beat)).toBe("whole");
  });

  it("has no answer without a beat or a duration", () => {
    expect(noteValue(1, 0)).toBeNull();
    expect(noteValue(0, beat)).toBeNull();
  });
});
