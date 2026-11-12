// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  approach,
  approachAngle,
  clamp01,
  easeIn,
  easeOut,
  lerp,
  peakOf,
  snap,
  wrapAngle,
} from "../../src/stage/draw";
import {
  chordName,
  chordSuffix,
  isMinorQuality,
  keyShortName,
  modeName,
  noteName,
} from "../../src/stage/names";
import { STAGE_THEME, modeColour, withAlpha } from "../../src/stage/theme";

describe("stage names", () => {
  it("spells notes in French and English with real accidentals", () => {
    expect(noteName(0)).toBe("C");
    expect(noteName(3, "fr")).toBe("Mi♭");
    expect(noteName(-1, "fr")).toBe("Si");
    expect(noteName(13)).toBe("C♯");
  });

  it("names modes, keys and chords", () => {
    expect(modeName("min", "fr")).toBe("mineur");
    expect(modeName("maj")).toBe("major");
    expect(keyShortName(4, "min")).toBe("Em");
    expect(keyShortName(7, "maj", "fr")).toBe("Sol");
    expect(chordName(9, "min7", "fr")).toBe("Lam7");
    expect(chordName(11, "min7b5")).toBe("Bø");
    expect(chordSuffix("dom7")).toBe("7");
    expect(isMinorQuality("dim")).toBe(true);
    expect(isMinorQuality("maj7")).toBe(false);
  });
});

describe("stage theme", () => {
  it("has twelve colours per pitch-class ramp and a colour per mode", () => {
    expect(STAGE_THEME.pitch).toHaveLength(12);
    expect(STAGE_THEME.pitchBright).toHaveLength(12);
    expect(STAGE_THEME.pitchDark).toHaveLength(12);
    expect(modeColour(STAGE_THEME, "min")).toBe(STAGE_THEME.minor);
    expect(modeColour(STAGE_THEME, "maj")).toBe(STAGE_THEME.major);
  });

  it("turns a hex colour into rgba", () => {
    expect(withAlpha("#e8a75c", 0.5)).toBe("rgba(232, 167, 92, 0.5)");
  });
});

describe("stage drawing helpers", () => {
  it("clamps, interpolates and eases", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(lerp(2, 4, 0.5)).toBe(3);
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
    expect(easeIn(0.5)).toBeLessThan(0.5);
    expect(snap(0.37, 0.25)).toBe(0.25);
    expect(peakOf([0.1, 0.4, 0.2])).toBe(0.4);
    expect(peakOf([])).toBe(0);
  });

  it("approaches values and angles exponentially, the short way round", () => {
    expect(approach(0, 1)).toBe(0);
    expect(approach(1, 0)).toBe(1);
    expect(approach(1, 1)).toBeCloseTo(1 - Math.exp(-1));
    expect(Math.abs(wrapAngle(3 * Math.PI))).toBeCloseTo(Math.PI);
    expect(wrapAngle(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
    // From just below +π to just above −π: a small step, not a full turn.
    const a = approachAngle(Math.PI - 0.1, -Math.PI + 0.1, 100, 0.01);
    expect(Math.abs(wrapAngle(a - (-Math.PI + 0.1)))).toBeLessThan(1e-6);
  });
});
