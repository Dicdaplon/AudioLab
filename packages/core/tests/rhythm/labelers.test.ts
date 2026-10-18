// @vitest-environment node
import { describe, expect, it } from "vitest";

import { StreamHistory } from "../../src/analysis/onset/afterOnset";
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
