// @vitest-environment node
/**
 * The method registries (const array, derived type, default, guard), the
 * engine defaults taken from the shared settings, the `filterTolerance`
 * alias and the chord ranking shared between a push and its snapshot.
 */
import { describe, expect, it } from "vitest";

import { detectChord } from "../../src/analysis/chordDetection";
import {
  TEMPO_ANALYZER_DEFAULTS,
  TEMPO_METHODS,
  isTempoMethod,
} from "../../src/analysis/engine/tempoAnalyzer";
import { TONALITY_ENGINE_DEFAULTS, TonalityEngine } from "../../src/analysis/engine/tonalityEngine";
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
import { HIGH_WATER_MARK_DEFAULTS } from "../../src/analysis/highWaterMark";
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

describe("TonalityEngine defaults", () => {
  it("keep their values, now read from the shared settings", () => {
    expect(TONALITY_ENGINE_DEFAULTS).toEqual({
      framesPerSecond: 10,
      chordWindowSeconds: 1,
      liveAcquisitionSeconds: 8,
      tonalityAcquisitionSeconds: 30,
      minFreq: 55,
      maxFreq: 5000,
      filterTolerancy: HIGH_WATER_MARK_DEFAULTS.tolerancy,
      filterMemory: HIGH_WATER_MARK_DEFAULTS.memory,
      filterMode: HIGH_WATER_MARK_DEFAULTS.mode,
    });
  });

  it("take filterTolerance as an alias of filterTolerancy", () => {
    const old = new TonalityEngine({ filterTolerancy: 0.3 });
    expect(old.config.filterTolerancy).toBe(0.3);
    expect(old.config.filterTolerance).toBe(0.3);

    const engine = new TonalityEngine({ filterTolerance: 0.4, filterTolerancy: 0.9 });
    expect(engine.config.filterTolerancy).toBe(0.4); // the new name wins
    engine.configure({ filterTolerancy: 0.6 }); // a later patch under the old name applies
    expect(engine.config.filterTolerance).toBe(0.6);
    engine.configure({ filterTolerance: 2 });
    expect(engine.config.filterTolerancy).toBe(1); // clamped
    engine.configure({ filterMemory: 4 });
    expect(engine.config.filterTolerance).toBe(1);
    expect(new TonalityEngine().config.filterTolerance).toBe(HIGH_WATER_MARK_DEFAULTS.tolerancy);
  });
});

describe("chord ranking shared by the chord key vote and the snapshot", () => {
  /** Chromas of C, F, G and Am, with a bit of noise, frame by frame. */
  function frames(): Float32Array[] {
    const chords = [
      [0, 4, 7],
      [5, 9, 0],
      [7, 11, 2],
      [9, 0, 4],
    ];
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 0.1;
    const out: Float32Array[] = [];
    for (const pcs of chords) {
      for (let i = 0; i < 15; i++) {
        const c = Float32Array.from({ length: 12 }, () => rnd());
        for (const pc of pcs) c[pc] += 1;
        out.push(c);
      }
    }
    out.push(new Float32Array(12)); // a silent frame
    return out;
  }

  it("gives the same chords as ranking the window again, in fresh arrays", () => {
    const chordsVote = new TonalityEngine({ keyMethod: "chords" });
    const profile = new TonalityEngine();
    for (const chroma of frames()) {
      const a = chordsVote.processChroma(chroma);
      const b = profile.processChroma(chroma);
      expect(a.chords).toEqual(b.chords);
      expect(a.chords).toEqual(detectChord(a.chordChroma));
      const again = chordsVote.snapshot();
      expect(again.chords).toEqual(a.chords);
      expect(again.chords).not.toBe(a.chords);
    }
  });

  it("does not reuse a ranking across a configuration change", () => {
    const engine = new TonalityEngine({ keyMethod: "chords" });
    for (const chroma of frames().slice(0, 10)) engine.pushChroma(chroma);
    engine.configure({ chordQualities: ["maj", "min", "dom7"] });
    const frame = engine.snapshot();
    expect(frame.chords).toEqual(
      detectChord(frame.chordChroma, { qualities: ["maj", "min", "dom7"] }),
    );
  });
});
