// @vitest-environment node
import { describe, it, expect } from "vitest";

import { CHROMA_SIZE } from "../../src/analysis/chroma";
import {
  SILENCE_LEVEL_DB,
  TonalityEngine,
  emptyTonalityFrame,
} from "../../src/analysis/engine/tonalityEngine";
import { HighWaterMarkFilter } from "../../src/analysis/highWaterMark";
import { detectKeyFromPresence } from "../../src/analysis/presenceTonality";
import { ChromaWindow } from "../../src/analysis/windowing";
import { midiToFreq } from "../../src/utils/notes";

/** L1-normalised chroma with equal weight on the given pitch classes. */
function chromaOf(...pcs: number[]): Float32Array {
  const v = new Float32Array(CHROMA_SIZE);
  for (const pc of pcs) v[pc] = 1 / pcs.length;
  return v;
}

/**
 * AnalyserNode-style dB spectrum: `levelDb` peaks at the fundamentals of the
 * given MIDI notes plus two harmonics, -Infinity elsewhere (silent bins).
 */
function dbSpectrumFor(
  midiNotes: number[],
  { sampleRate = 48000, fftSize = 16384, levelDb = -20 } = {},
): Float32Array {
  const bins = fftSize / 2;
  const binHz = sampleRate / fftSize;
  const db = new Float32Array(bins).fill(-Infinity);
  for (const midi of midiNotes) {
    for (let h = 1; h <= 3; h++) {
      const k = Math.round((midiToFreq(midi) * h) / binHz);
      if (k < bins) db[k] = Math.max(db[k], levelDb - 6 * (h - 1));
    }
  }
  return db;
}

describe("TonalityEngine", () => {
  it("starts from an empty frame", () => {
    const engine = new TonalityEngine();
    const frame = engine.snapshot();
    expect(frame).toEqual(emptyTonalityFrame());
    expect(frame.chords).toEqual([]);
    expect(frame.signalLevelDb).toBe(SILENCE_LEVEL_DB);
  });

  it("clamps the filter configuration", () => {
    const engine = new TonalityEngine({ filterTolerancy: 2, filterMemory: 100 });
    expect(engine.config.filterTolerancy).toBe(1);
    expect(engine.config.filterMemory).toBe(15);
  });

  it("detects a C major chord from repeated C-E-G chroma frames", () => {
    const engine = new TonalityEngine({ framesPerSecond: 10, chordWindowSeconds: 1 });
    let frame = engine.snapshot();
    for (let i = 0; i < 10; i++) frame = engine.processChroma(chromaOf(0, 4, 7));
    expect(frame.chords[0].name).toBe("C");
    expect(frame.chords[0].similarity).toBeCloseTo(1, 6);
    expect(frame.chordChroma[0]).toBeCloseTo(1 / 3, 6);
    expect(frame.liveKeys).toHaveLength(24);
  });

  it("runs the whole dB → magnitude → chroma path on a synthetic spectrum", () => {
    const engine = new TonalityEngine({ framesPerSecond: 10 });
    const db = dbSpectrumFor([60, 64, 67]); // C4 E4 G4
    let frame = engine.snapshot();
    for (let i = 0; i < 10; i++) frame = engine.processDbSpectrum(db, 48000);
    expect(frame.chords[0].name).toBe("C");
    expect(frame.instantaneousChroma[0]).toBeGreaterThan(0.2);
    expect(frame.signalLevelDb).toBeGreaterThan(SILENCE_LEVEL_DB);
    expect(Number.isFinite(frame.signalLevelDb)).toBe(true);
    // The same notes at 44.1 kHz give the same chord.
    const engine44 = new TonalityEngine({ framesPerSecond: 10 });
    const db44 = dbSpectrumFor([60, 64, 67], { sampleRate: 44100 });
    expect(engine44.processDbSpectrum(db44, 44100).chords[0].name).toBe("C");
  });

  it("processSpectrum (linear) matches processDbSpectrum (dB) above the gate", () => {
    const db = dbSpectrumFor([57, 60, 64]);
    const magnitude = db.map((d) => (Number.isFinite(d) ? Math.pow(10, d / 20) : 0));
    const fromDb = new TonalityEngine().processDbSpectrum(db, 48000);
    const fromLinear = new TonalityEngine().processSpectrum(magnitude, 48000);
    expect(fromLinear.chords[0].name).toBe("Am");
    for (let pc = 0; pc < CHROMA_SIZE; pc++) {
      expect(fromLinear.instantaneousChroma[pc]).toBeCloseTo(fromDb.instantaneousChroma[pc], 6);
    }
    expect(fromLinear.signalLevelDb).toBeCloseTo(fromDb.signalLevelDb, 6);
  });

  it("reports the silence level for an all-silent spectrum", () => {
    const engine = new TonalityEngine();
    const frame = engine.processDbSpectrum(new Float32Array(8192).fill(-Infinity), 48000);
    expect(frame.signalLevelDb).toBe(SILENCE_LEVEL_DB);
    expect(Array.from(frame.instantaneousChroma)).toEqual(new Array(12).fill(0));
  });

  it("never reports a quiet signal below the silence level", () => {
    // Mean in-band magnitude of a sparse, quiet spectrum is far below
    // 1e-5 (−100 dB); it must not read quieter than digital silence.
    const engine = new TonalityEngine();
    const quiet = engine.processDbSpectrum(dbSpectrumFor([57, 60, 64], { levelDb: -80 }), 48000);
    expect(quiet.chords[0].name).toBe("Am");
    expect(quiet.signalLevelDb).toBe(SILENCE_LEVEL_DB);
    const louder = engine.processDbSpectrum(dbSpectrumFor([57, 60, 64], { levelDb: -20 }), 48000);
    expect(louder.signalLevelDb).toBeGreaterThan(SILENCE_LEVEL_DB);
  });

  it("finds the key of a scale through the energy and presence paths", () => {
    const engine = new TonalityEngine({
      framesPerSecond: 10,
      liveAcquisitionSeconds: 1,
      tonalityAcquisitionSeconds: 2,
    });
    const cMajor = [0, 2, 4, 5, 7, 9, 11];
    let frame = engine.snapshot();
    for (let i = 0; i < 30; i++) frame = engine.processChroma(chromaOf(...cMajor));
    expect(["C", "Am"]).toContain(frame.liveKeys[0].shortName);
    expect(["C", "Am"]).toContain(frame.tonalityKeys[0].shortName);
    expect(["C", "Am"]).toContain(frame.presenceKeys[0].shortName);
    // Every scale note is present in every frame → presence 1 on those PCs.
    for (const pc of cMajor) expect(frame.presenceHistogram[pc]).toBeCloseTo(1, 6);
    expect(frame.presenceHistogram[1]).toBe(0);
  });

  it("matches a manual replay of the presence pipeline exactly", () => {
    const cfg = {
      framesPerSecond: 5,
      liveAcquisitionSeconds: 2,
      tonalityAcquisitionSeconds: 4,
      filterTolerancy: 0.35,
      filterMemory: 3,
      filterMode: "mean" as const,
    };
    const engine = new TonalityEngine(cfg);
    const live = new ChromaWindow({ windowSeconds: 2, framesPerSecond: 5 });
    const presence = new ChromaWindow({ windowSeconds: 4, framesPerSecond: 5 });
    const filter = new HighWaterMarkFilter({ tolerancy: 0.35, memory: 3, mode: "mean" });

    let seed = 7;
    const rand = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    let frame = engine.snapshot();
    for (let i = 0; i < 60; i++) {
      const c = new Float32Array(CHROMA_SIZE).map(() => rand());
      const sum = c.reduce((a, b) => a + b, 0);
      for (let j = 0; j < CHROMA_SIZE; j++) c[j] /= sum;
      frame = engine.processChroma(c);
      live.push(c);
      presence.push(filter.filterToIndicator(live.aggregate()));
    }
    const expected = presence.aggregateRaw();
    for (let j = 0; j < CHROMA_SIZE; j++) {
      expect(frame.presenceHistogram[j]).toBeCloseTo(expected[j], 6);
    }
    expect(frame.presenceKeys[0].shortName).toBe(detectKeyFromPresence(expected)[0].shortName);
    expect(frame.filterThreshold).toBeCloseTo(filter.currentThreshold, 10);
  });

  it("configure() resizes the windows keeping the newest frames", () => {
    const engine = new TonalityEngine({ framesPerSecond: 10, liveAcquisitionSeconds: 2 });
    for (let i = 0; i < 15; i++) engine.pushChroma(chromaOf(0));
    for (let i = 0; i < 5; i++) engine.pushChroma(chromaOf(7));
    // 20 frames held: 15 × C, 5 × G → live chroma 75 % C.
    expect(engine.snapshot().liveAcquisitionChroma[0]).toBeCloseTo(0.75, 6);
    engine.configure({ liveAcquisitionSeconds: 0.5 }); // keep the 5 newest
    const frame = engine.snapshot();
    expect(frame.liveAcquisitionChroma[7]).toBeCloseTo(1, 6);
    expect(frame.liveAcquisitionChroma[0]).toBe(0);
    expect(engine.config.liveAcquisitionSeconds).toBe(0.5);
  });

  it("configure() updates the filter threshold immediately", () => {
    const engine = new TonalityEngine({ filterTolerancy: 0.5, filterMemory: 3 });
    engine.pushChroma(chromaOf(0, 4));
    const before = engine.snapshot().filterThreshold;
    engine.configure({ filterTolerancy: 1 });
    expect(engine.snapshot().filterThreshold).toBeCloseTo(before * 2, 10);
  });

  it("reset() clears the state but keeps the configuration", () => {
    const engine = new TonalityEngine({ liveAcquisitionSeconds: 3 });
    for (let i = 0; i < 10; i++) engine.pushChroma(chromaOf(0, 4, 7));
    engine.reset();
    expect(engine.snapshot()).toEqual(emptyTonalityFrame());
    expect(engine.config.liveAcquisitionSeconds).toBe(3);
  });

  it("rejects chroma vectors of the wrong length", () => {
    const engine = new TonalityEngine();
    expect(() => engine.pushChroma(new Float32Array(11))).toThrow();
  });
});
