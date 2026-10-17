// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  StreamHistory,
  chordAfterOnset,
  chordReadyAt,
  noteAfterOnset,
  noteReadyAt,
} from "../../src/analysis/onset/afterOnset";
import { OnsetDetector } from "../../src/analysis/onset/onsetDetector";
import { voicingNotes } from "../helpers/guitar";
import { performance, pushChunks } from "../helpers/onsets";

const SR = 48000;

describe("StreamHistory", () => {
  it("reads frames by their stream position and forgets across a gap", () => {
    const h = new StreamHistory(8);
    h.push([1, 2, 3, 4, 5, 6], 100);
    expect(Array.from(h.read(102, 3)!)).toEqual([3, 4, 5]);
    h.push([7, 8, 9, 10]); // continues at 106; capacity 8 keeps 102..109
    expect(h.range).toEqual({ from: 102, to: 110 });
    expect(h.read(101, 2)).toBeNull();
    expect(Array.from(h.read(106, 4)!)).toEqual([7, 8, 9, 10]);
    h.push([0], 500);
    expect(h.range).toEqual({ from: 500, to: 501 });
  });
});

describe("what was played after an onset", () => {
  it("names the note and the chord of each onset of a performance", () => {
    const { signal } = performance(
      [
        { time: 0.3, midi: 52 }, // E3
        { time: 0.9, midi: 57 }, // A3
        { time: 1.5, midi: voicingNotes("x32010"), strumMs: 12 }, // C major
        { time: 2.3, midi: voicingNotes("320003"), strumMs: 12 }, // G major
      ],
      { seconds: 3.2, noiseRms: 0.001 },
    );
    const history = new StreamHistory(SR * 2);
    const detector = new OnsetDetector({ sampleRate: SR });
    const onsets = pushChunks(signal, (chunk, frame) => {
      history.push(chunk, frame);
      return detector.push(chunk, frame);
    });
    // Read everything once the performance is in the history (live code
    // waits for noteReadyAt / chordReadyAt instead).
    const full = new StreamHistory(signal.length);
    full.push(signal, 0);
    expect(onsets).toHaveLength(4);
    expect(noteReadyAt(onsets[0].frame, SR)).toBeGreaterThan(onsets[0].frame);
    expect(chordReadyAt(onsets[2].frame, SR)).toBe(onsets[2].frame + 0.2 * SR);

    expect(noteAfterOnset(full, onsets[0].frame, SR)?.pitchClass).toBe(4);
    expect(noteAfterOnset(full, onsets[1].frame, SR)?.pitchClass).toBe(9);
    expect(chordAfterOnset(full, onsets[2].frame, SR)[0]).toMatchObject({
      root: 0,
      quality: "maj",
    });
    expect(chordAfterOnset(full, onsets[3].frame, SR)[0]).toMatchObject({
      root: 7,
      quality: "maj",
    });
    // Too late for the live history: the first samples were overwritten.
    expect(noteAfterOnset(history, onsets[0].frame, SR)).toBeNull();
  });

  it("gives nothing on silence", () => {
    const h = new StreamHistory(SR);
    h.push(new Float32Array(SR), 0);
    expect(chordAfterOnset(h, 1000, SR)).toEqual([]);
    expect(noteAfterOnset(h, 1000, SR)).toBeNull();
  });
});
