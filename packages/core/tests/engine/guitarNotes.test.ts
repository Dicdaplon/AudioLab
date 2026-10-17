/**
 * Wolf Jumper notes on the low strings, end to end: a wound-string model
 * (weak fundamental, loud 3rd harmonic, see `lowStringTone`) through the
 * live path, frame by frame, with a `PitchTracker` fed the same audio.
 *
 * The chroma's strongest bin of E2, F2, G2 is their fifth (B, C, D): with
 * `noteSource: "chroma"` the game hears the wrong note and the enemy
 * survives. The pitch tracker follows the period, so `noteSource: "pitch"`
 * hears the note. The upper octaves work with both.
 */
import { describe, expect, it } from "vitest";

import { TonalityEngine } from "../../src/analysis/engine/tonalityEngine";
import { PitchTracker } from "../../src/analysis/pitch";
import { WolfJumperDetector, type NoteSource } from "../../src/games";
import { lowStringTone, type LowStringOptions } from "../helpers/guitar";
import { FFT_SIZE, FPS, SR } from "../helpers/liveRig";
import { analyserFrames, scale } from "../helpers/synth";

const C_MAJOR = [0, 2, 4, 5, 7, 9, 11];
const HOP = SR / FPS;

/** Pitch classes the detector confirms while the note rings. */
function heardNotes(midi: number, noteSource: NoteSource, model: Partial<LowStringOptions> = {}) {
  // Played well above the default noise gate (-60 dB).
  const signal = scale(lowStringTone(midi, { sampleRate: SR, seconds: 1.5, ...model }), 4);
  const engine = new TonalityEngine({ framesPerSecond: FPS });
  const tracker = new PitchTracker({ sampleRate: SR, windowSize: 2048 });
  const detector = new WolfJumperDetector({ noteSource });
  const heard: number[] = [];
  analyserFrames(signal, FFT_SIZE, HOP).forEach((db, i) => {
    // The tracker has heard the same audio as the analyser window.
    const end = FFT_SIZE + i * HOP;
    tracker.push(signal.subarray(end - HOP, end));
    const frame = engine.processDbSpectrum(db, SR);
    for (const action of detector.push({ ...frame, pitch: tracker.estimate }, C_MAJOR)) {
      if (action.type === "noteDetected") heard.push(action.pc);
    }
  });
  return [...new Set(heard)];
}

describe("Wolf Jumper notes on the low strings", () => {
  it("the chroma hears the fifth of E2, F2 and G2", () => {
    expect(heardNotes(40, "chroma")).toEqual([11]); // E2 → B
    expect(heardNotes(41, "chroma")).toEqual([0]); // F2 → C
    expect(heardNotes(43, "chroma")).toEqual([2]); // G2 → D
  });

  it("the pitch tracker hears the note", () => {
    expect(heardNotes(40, "pitch")).toEqual([4]);
    expect(heardNotes(41, "pitch")).toEqual([5]);
    expect(heardNotes(43, "pitch")).toEqual([7]);
    expect(heardNotes(45, "pitch")).toEqual([9]);
  });

  it("both hear the upper octaves, whose fundamental the microphone keeps", () => {
    const treble = { fundamentalDb: 0, thirdHarmonicDb: -5 };
    for (const source of ["chroma", "pitch"] as const) {
      expect(heardNotes(64, source, treble), source).toEqual([4]); // E4
      expect(heardNotes(67, source, treble), source).toEqual([7]); // G4
    }
  });
});
