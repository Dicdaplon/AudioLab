// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseCrepeModel } from "../../src/analysis/crepe";
import { StreamHistory, chordAfterOnset } from "../../src/analysis/onset/afterOnset";
import { chordLabeler, noteLabel, noteLabeler } from "../../src/rhythm";
import { voicingNotes } from "../helpers/guitar";
import { performance } from "../helpers/onsets";

const SR = 48000;

describe("labelers", () => {
  it("label notes by pitch class and chords by chord key", () => {
    const { signal, startFrames } = performance(
      [
        { time: 0.3, midi: 52 },
        { time: 1.0, midi: voicingNotes("022000"), strumMs: 10 },
      ],
      { seconds: 1.8, noiseRms: 0.001 },
    );
    const h = new StreamHistory(signal.length);
    h.push(signal, 0);
    const notes = noteLabeler(SR);
    const chords = chordLabeler(SR);
    expect(notes.readyAt(startFrames[0])).toBeGreaterThan(startFrames[0]);
    expect(notes.label(h, startFrames[0])).toBe(noteLabel(4));
    expect(chords.label(h, startFrames[1])).toBe("4-min");
    expect(chords.readyAt(startFrames[1])).toBe(startFrames[1] + 0.2 * SR);
    expect(noteLabel(-1)).toBe("11");
    const silent = new StreamHistory(SR);
    silent.push(new Float32Array(SR), 0);
    expect(notes.label(silent, 100)).toBeNull();
    expect(chords.label(silent, 100)).toBeNull();
  });
});

describe("labelers with a listening method", () => {
  const MODEL_FILE = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../apps/lab/public/models/crepe-tiny/crepe-tiny.bin",
  );
  const crepeModel = (() => {
    const b = readFileSync(MODEL_FILE);
    return parseCrepeModel(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  })();

  const { signal, startFrames } = performance(
    [
      { time: 0.3, midi: 52 }, // E3
      { time: 0.9, midi: 57 }, // A3
      { time: 1.5, midi: voicingNotes("x32010"), strumMs: 12 }, // C major
      { time: 2.3, midi: voicingNotes("022000"), strumMs: 10 }, // E minor
    ],
    { seconds: 3.2, noiseRms: 0.001 },
  );
  const h = new StreamHistory(signal.length);
  h.push(signal, 0);

  it("name the notes with pYIN and CREPE, each ready when its window is", () => {
    const mpm = noteLabeler(SR);
    const pyin = noteLabeler(SR, { method: "pyin" });
    const crepe = noteLabeler(SR, { method: "crepe", crepeModel });
    for (const labeler of [mpm, pyin, crepe]) {
      expect(labeler.label(h, startFrames[0])).toBe(noteLabel(4));
      expect(labeler.label(h, startFrames[1])).toBe(noteLabel(9));
    }
    const onset = startFrames[0];
    expect(mpm.readyAt(onset)).toBe(onset + 0.03 * SR + 2048);
    // pYIN decides the same window 50 ms later.
    expect(pyin.readyAt(onset)).toBe(mpm.readyAt(onset) + 0.05 * SR);
    expect(crepe.readyAt(onset)).toBeGreaterThan(mpm.readyAt(onset));
    const silent = new StreamHistory(SR);
    silent.push(new Float32Array(SR), 0);
    expect(pyin.label(silent, 100)).toBeNull();
    expect(crepe.label(silent, 100)).toBeNull();
  });

  it("refuse CREPE without a model", () => {
    expect(() => noteLabeler(SR, { method: "crepe" })).toThrow(/crepeModel/);
  });

  it("name the chords with every chroma method, ready at the same time", () => {
    for (const chromaMethod of ["nearest", "gaussian-log", "cqt"] as const) {
      const chords = chordLabeler(SR, { chromaMethod });
      expect(chords.label(h, startFrames[2])).toBe("0-maj");
      expect(chords.label(h, startFrames[3])).toBe("4-min");
      expect(chords.readyAt(startFrames[2])).toBe(startFrames[2] + 0.2 * SR);
    }
    // The default is the original chroma.
    expect(chordAfterOnset(h, startFrames[2], SR)).toEqual(
      chordAfterOnset(h, startFrames[2], SR, { chromaMethod: "nearest" }),
    );
  });
});
