// @vitest-environment node
/** The method registries: const array, derived type, default, guard. */
import { describe, expect, it } from "vitest";

import {
  TEMPO_ANALYZER_DEFAULTS,
  TEMPO_METHODS,
  isTempoMethod,
} from "../../src/analysis/engine/tempoAnalyzer";
import {
  CHORD_METHOD_PRESETS,
  CHORD_SMOOTHINGS,
  CHROMA_METHODS,
  DEFAULT_CHORD_METHOD_PRESET,
  DEFAULT_CHORD_SMOOTHING,
  DEFAULT_CHROMA_METHOD,
  DEFAULT_KEY_METHOD,
  KEY_METHODS,
  isChordMethodPreset,
  isChordSmoothing,
  isChromaMethod,
  isKeyMethod,
} from "../../src/analysis/engine/tonalityMethods";
import {
  DEFAULT_PITCH_METHOD,
  PITCH_METHODS,
  isPitchMethod,
} from "../../src/analysis/pitchMethods";

describe("method registries", () => {
  it("list every method, with the original as the default", () => {
    expect(CHROMA_METHODS).toEqual(["nearest", "gaussian-log", "cqt"]);
    expect(KEY_METHODS).toEqual(["profile", "chords"]);
    expect(CHORD_SMOOTHINGS).toEqual(["window", "hmm"]);
    expect(TEMPO_METHODS).toEqual(["envelope", "flux"]);
    expect(PITCH_METHODS).toEqual(["mpm", "pyin", "crepe"]);
    expect([DEFAULT_CHROMA_METHOD, DEFAULT_KEY_METHOD, DEFAULT_CHORD_SMOOTHING]).toEqual([
      "nearest",
      "profile",
      "window",
    ]);
    expect(TEMPO_ANALYZER_DEFAULTS.method).toBe("envelope");
    expect(DEFAULT_PITCH_METHOD).toBe("mpm");
    expect(DEFAULT_CHORD_METHOD_PRESET).toBe("classic");
  });

  it("guard unknown values", () => {
    for (const [guard, ok] of [
      [isChromaMethod, "cqt"],
      [isKeyMethod, "chords"],
      [isChordSmoothing, "hmm"],
      [isTempoMethod, "flux"],
      [isPitchMethod, "pyin"],
      [isChordMethodPreset, "sharper"],
    ] as const) {
      expect(guard(ok)).toBe(true);
      expect(guard("x")).toBe(false);
      expect(guard(undefined)).toBe(false);
    }
    expect(isChordMethodPreset("toString")).toBe(false);
  });

  it("name the benchmarked chord methods as engine options", () => {
    expect(CHORD_METHOD_PRESETS).toEqual({
      classic: {},
      follow: { chordSmoothing: "hmm" },
      sharper: { chordSmoothing: "hmm", chromaMethod: "gaussian-log" },
      cqt: { chordSmoothing: "hmm", chromaMethod: "cqt" },
    });
  });
});
