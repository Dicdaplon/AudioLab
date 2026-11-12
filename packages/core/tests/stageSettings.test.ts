import { describe, expect, it } from "vitest";

import {
  DEFAULT_STAGE_SETTINGS,
  STAGE_SETTING_RANGES,
  normalizeStageSettings,
  stageTrackerOptions,
} from "../src/config/stageSettings";

describe("stage settings", () => {
  it("has defaults inside their ranges, on their steps", () => {
    for (const [key, range] of Object.entries(STAGE_SETTING_RANGES)) {
      const value = DEFAULT_STAGE_SETTINGS[key as keyof typeof STAGE_SETTING_RANGES];
      expect(value).toBeGreaterThanOrEqual(range.min);
      expect(value).toBeLessThanOrEqual(range.max);
      const steps = (value - range.min) / range.step;
      expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-9);
    }
  });

  it("normalises untrusted input: clamps, parses strings, drops the unknown", () => {
    expect(normalizeStageSettings(null)).toEqual(DEFAULT_STAGE_SETTINGS);
    expect(normalizeStageSettings("nope")).toEqual(DEFAULT_STAGE_SETTINGS);
    const s = normalizeStageSettings({
      chordWindowSeconds: "4",
      songSeconds: 9999,
      gateStrictness: -2,
      chordSource: "notes",
      noteClarity: NaN,
      extra: 1,
    });
    expect(s.chordWindowSeconds).toBe(4);
    expect(s.songSeconds).toBe(300);
    expect(s.gateStrictness).toBe(0);
    expect(s.chordSource).toBe("notes");
    expect(s.noteClarity).toBe(DEFAULT_STAGE_SETTINGS.noteClarity);
    expect("extra" in s).toBe(false);
    expect(normalizeStageSettings({ chordSource: "both", songBreakSeconds: "" }).chordSource).toBe(
      "harmony",
    );
  });
});

describe("stageTrackerOptions", () => {
  it("maps the settings to each tracker, a zero song break meaning never", () => {
    const o = stageTrackerOptions({
      ...DEFAULT_STAGE_SETTINGS,
      songBreakSeconds: 0,
      gateStrictness: 1,
    });
    expect(o.chordChanges).toEqual({ holdSeconds: 0.25, minMargin: 0.04 });
    expect(o.songBreak.seconds).toBe(Infinity);
    expect(o.noteSegmenter).toEqual({ minClarity: 0.6, vibrato: { minExtentCents: 12 } });
    const gentle = stageTrackerOptions({ ...DEFAULT_STAGE_SETTINGS, gateStrictness: 0 });
    expect(o.levelGate.openMarginDb).toBeGreaterThan(gentle.levelGate.openMarginDb);
    expect(stageTrackerOptions(DEFAULT_STAGE_SETTINGS).songBreak.seconds).toBe(8);
  });
});
