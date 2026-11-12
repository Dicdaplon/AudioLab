/**
 * Settings of a stage display (stream overlay, stage screen): the analysis
 * windows and thresholds a performer may want to adjust live. Types,
 * defaults, ranges for the controls, and a normaliser for values read from
 * storage or a URL. Framework-free: the React stage and any other front end
 * share this single source of truth.
 */

import { gateTuning } from "../analysis/gate/strictness";

export interface StageSettings {
  /** Chord detection window, in seconds (longer = steadier, slower to follow). */
  chordWindowSeconds: number;
  /** Song-key window, in seconds. */
  songSeconds: number;
  /** Where the chords are read: the mix ("harmony") or the instrument ("notes"). */
  chordSource: "harmony" | "notes";
  /** Adaptive gate, 0 gentle (quiet playing counts) … 1 strict (only clear playing counts). */
  gateStrictness: number;
  /** Time a new chord must hold before it is shown, in seconds. */
  chordHoldSeconds: number;
  /** Score lead a new chord needs over the runner-up. */
  chordMinMargin: number;
  /** Silence that ends a song and starts the key over, in seconds (0 = never). */
  songBreakSeconds: number;
  /** Pitch clarity a note needs to be drawn, 0 … 1. */
  noteClarity: number;
  /** Smallest vibrato shown, in ± cents. */
  vibratoMinCents: number;
}

export const DEFAULT_STAGE_SETTINGS: StageSettings = {
  chordWindowSeconds: 1,
  songSeconds: 180,
  chordSource: "harmony",
  gateStrictness: 0.5,
  chordHoldSeconds: 0.25,
  chordMinMargin: 0.04,
  songBreakSeconds: 8,
  noteClarity: 0.6,
  vibratoMinCents: 12,
};

export type NumericStageSetting = Exclude<keyof StageSettings, "chordSource">;

export interface SettingRange {
  min: number;
  max: number;
  step: number;
}

/** Control ranges, also the clamp bounds of `normalizeStageSettings`. */
export const STAGE_SETTING_RANGES: Readonly<Record<NumericStageSetting, SettingRange>> = {
  chordWindowSeconds: { min: 0.5, max: 8, step: 0.5 },
  songSeconds: { min: 30, max: 300, step: 10 },
  gateStrictness: { min: 0, max: 1, step: 0.05 },
  chordHoldSeconds: { min: 0.1, max: 1, step: 0.05 },
  chordMinMargin: { min: 0, max: 0.2, step: 0.01 },
  songBreakSeconds: { min: 0, max: 30, step: 1 },
  noteClarity: { min: 0.3, max: 0.95, step: 0.05 },
  vibratoMinCents: { min: 5, max: 40, step: 1 },
};

/**
 * Complete settings from any partial or untrusted value (parsed JSON, URL
 * parameters): unknown keys are dropped, numbers are clamped to their range,
 * anything invalid falls back to the default.
 */
export function normalizeStageSettings(value: unknown): StageSettings {
  const input =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const out: StageSettings = { ...DEFAULT_STAGE_SETTINGS };
  for (const key of Object.keys(STAGE_SETTING_RANGES) as NumericStageSetting[]) {
    const raw = input[key];
    const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
    if (typeof n === "number" && Number.isFinite(n)) {
      const { min, max } = STAGE_SETTING_RANGES[key];
      out[key] = Math.min(max, Math.max(min, n));
    }
  }
  if (input.chordSource === "harmony" || input.chordSource === "notes") {
    out.chordSource = input.chordSource;
  }
  return out;
}

/** What `stageTrackerOptions` returns: the `configure()` argument of each tracker. */
export interface StageTrackerOptions {
  chordChanges: { holdSeconds: number; minMargin: number };
  songBreak: { seconds: number };
  noteSegmenter: { minClarity: number; vibrato: { minExtentCents: number } };
  /** For `AdaptiveLevel.configure` (the gate margins of `gateTuning(gateStrictness)`). */
  levelGate: { openMarginDb: number; closeMarginDb: number };
}

/**
 * The tracker settings that follow from stage settings, so every host (the
 * React stage or another front end) re-tunes `ChordChangeTracker`,
 * `SongBreak`, `NoteSegmenter` and `AdaptiveLevel` the same way. A song
 * break of 0 means never (an infinite silence).
 */
export function stageTrackerOptions(settings: StageSettings): StageTrackerOptions {
  const { openMarginDb, closeMarginDb } = gateTuning(settings.gateStrictness);
  return {
    chordChanges: { holdSeconds: settings.chordHoldSeconds, minMargin: settings.chordMinMargin },
    songBreak: { seconds: settings.songBreakSeconds || Infinity },
    noteSegmenter: {
      minClarity: settings.noteClarity,
      vibrato: { minExtentCents: settings.vibratoMinCents },
    },
    levelGate: { openMarginDb, closeMarginDb },
  };
}
