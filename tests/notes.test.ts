import { describe, it, expect } from "vitest";

import {
  freqToMidi,
  midiToFreq,
  freqToPitchClass,
  pitchClassName,
  pitchClassFrequencies,
  A_MINOR_PENTATONIC_PITCH_CLASSES,
  NOTE_NAMES,
  A4_FREQ,
  A4_MIDI,
} from "../src/utils/notes";

describe("notes conversions", () => {
  it("A4 round-trip is exact", () => {
    expect(freqToMidi(A4_FREQ)).toBeCloseTo(A4_MIDI, 10);
    expect(midiToFreq(A4_MIDI)).toBeCloseTo(A4_FREQ, 10);
  });

  it("midi <-> freq is invertible over the audible range", () => {
    for (let midi = 24; midi <= 108; midi += 7) {
      const f = midiToFreq(midi);
      expect(freqToMidi(f)).toBeCloseTo(midi, 10);
    }
  });

  it("pitch class of A4 is 9 (A)", () => {
    expect(freqToPitchClass(440)).toBe(9);
    expect(pitchClassName(9)).toBe("A");
  });

  it("pitch class of C4 (≈261.63 Hz) is 0 (C)", () => {
    expect(freqToPitchClass(261.626)).toBe(0);
    expect(pitchClassName(0)).toBe("C");
  });

  it("pitch class is octave-invariant", () => {
    // Three different octaves of E should all map to pitch class 4.
    expect(freqToPitchClass(midiToFreq(40))).toBe(4); // E2
    expect(freqToPitchClass(midiToFreq(52))).toBe(4); // E3
    expect(freqToPitchClass(midiToFreq(76))).toBe(4); // E5
  });

  it("NOTE_NAMES covers exactly 12 distinct entries", () => {
    expect(NOTE_NAMES).toHaveLength(12);
    expect(new Set(NOTE_NAMES).size).toBe(12);
  });
});

describe("pitchClassFrequencies", () => {
  it("lists the A minor pentatonic notes in ascending order within a band", () => {
    const freqs = pitchClassFrequencies(A_MINOR_PENTATONIC_PITCH_CLASSES, 100, 500);
    // A2 110, C3 130.8, D3 146.8, E3 164.8, G3 196, A3 220, C4 261.6, D4 293.7,
    // E4 329.6, G4 392, A4 440 → 11 notes.
    expect(freqs).toHaveLength(11);
    expect(freqs[0]).toBeCloseTo(110, 1);
    expect(freqs[freqs.length - 1]).toBeCloseTo(440, 1);
    for (let i = 1; i < freqs.length; i++) expect(freqs[i]).toBeGreaterThan(freqs[i - 1]);
  });

  it("is a five-note set (pentatonic), not a seven-note major scale", () => {
    expect(A_MINOR_PENTATONIC_PITCH_CLASSES).toHaveLength(5);
    expect([...A_MINOR_PENTATONIC_PITCH_CLASSES].sort((a, b) => a - b)).toEqual([0, 2, 4, 7, 9]);
  });
});
