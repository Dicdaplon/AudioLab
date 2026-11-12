import { describe, expect, it } from "vitest";

import { SongBreak } from "../../../src/analysis/readout/songBreak";

describe("SongBreak", () => {
  it("fires once after a long silence, and re-arms on sound", () => {
    const b = new SongBreak({ seconds: 2 });
    expect(b.push(-80, 0)).toBe(false);
    expect(b.push(-100, 1)).toBe(false);
    expect(b.push(-100, 2.9)).toBe(false);
    expect(b.push(-100, 3)).toBe(true);
    expect(b.push(-100, 10)).toBe(false);
    expect(b.push(-80, 11)).toBe(false);
    expect(b.push(-100, 12)).toBe(false);
    expect(b.push(-100, 14)).toBe(true);
  });

  it("ignores short pauses, with the default threshold", () => {
    const b = new SongBreak();
    for (let t = 0; t < 7; t += 0.1) expect(b.push(-95, t)).toBe(false);
    expect(b.push(-85, 7.5)).toBe(false);
    expect(b.push(-95, 8)).toBe(false);
  });
});
