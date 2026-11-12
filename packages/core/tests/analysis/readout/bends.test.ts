/**
 * Bends against the things they must not be confused with: a vibrato, a
 * slow drift, a hammer-on, a slide. Pitch curves are synthetic, sampled at
 * 40 estimates per second like the stage, and given to the segmenter the
 * way the pitch tracker reports them: nearest semitone + cents.
 */
import { describe, expect, it } from "vitest";

import type { PitchEstimate } from "../../../src/analysis/pitch";
import { NoteSegmenter } from "../../../src/analysis/readout/noteSegments";

/** An estimate for a continuous pitch (in semitones, MIDI scale). */
function at(pitch: number): PitchEstimate {
  const midi = Math.round(pitch);
  return {
    frequency: 440 * 2 ** ((pitch - 69) / 12),
    midi,
    pitchClass: ((midi % 12) + 12) % 12,
    cents: (pitch - midi) * 100,
    clarity: 0.9,
  };
}

/** Feed `pitch(t)` for `seconds` at 40 estimates per second. */
function play(s: NoteSegmenter, seconds: number, pitch: (t: number) => number, from = 0) {
  for (let i = 0; i <= seconds * 40; i++) s.push(at(pitch(i / 40)), from + i / 40);
}

/** Smooth step from 0 to 1 between t0 and t1. */
function ramp(t: number, t0: number, t1: number): number {
  const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  return u * u * (3 - 2 * u);
}

describe("bend detection", () => {
  it("reads a whole-tone bend as one bent note, not as new notes", () => {
    const s = new NoteSegmenter();
    // E4, held 150 ms, bent up a tone over 250 ms, held.
    play(s, 1, (t) => 64 + 2 * ramp(t, 0.15, 0.4));
    expect(s.notes).toHaveLength(1);
    const note = s.notes[0];
    expect(note.midi).toBe(64);
    expect(note.bend).not.toBeNull();
    expect(note.bend!.cents).toBeGreaterThanOrEqual(195);
    expect(note.bend!.current).toBeGreaterThanOrEqual(195);
    expect(note.bend!.released).toBe(false);
    // The mean cents come from the unbent part only.
    expect(Math.abs(note.cents)).toBeLessThan(10);
  });

  it("marks a bend that comes back down as released, and a half-tone bend too", () => {
    const s = new NoteSegmenter();
    play(s, 1.2, (t) => 69 + ramp(t, 0.1, 0.3) - ramp(t, 0.7, 0.9));
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0].bend).toMatchObject({ released: true });
    expect(s.notes[0].bend!.cents).toBeGreaterThanOrEqual(95);
    expect(s.notes[0].bend!.current).toBeLessThan(30);
  });

  it("does not read a vibrato as a bend, even a wide one", () => {
    const s = new NoteSegmenter();
    play(s, 1.2, (t) => 64 + 0.4 * Math.sin(2 * Math.PI * 5.5 * t));
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0].bend).toBeNull();
    expect(s.notes[0].vibrato.active).toBe(true);
  });

  it("does not read a slow, small drift as a bend", () => {
    const s = new NoteSegmenter();
    play(s, 1, (t) => 64 + 0.4 * t);
    expect(s.notes[0].bend).toBeNull();
  });

  it("splits a hammer-on (a jump) into two notes, without a bend", () => {
    const s = new NoteSegmenter();
    play(s, 0.5, () => 64);
    play(s, 0.5, () => 66, 0.525);
    expect(s.notes.map((n) => n.midi)).toEqual([64, 66]);
    expect(s.notes.every((n) => n.bend === null)).toBe(true);
  });

  it("treats a glide beyond the bend range as a slide (a new note)", () => {
    const s = new NoteSegmenter();
    // Five semitones in 400 ms, continuous: no guitarist bends that far.
    play(s, 0.8, (t) => 60 + 5 * ramp(t, 0.1, 0.5));
    expect(s.notes.length).toBeGreaterThan(1);
    expect(s.notes[0].midi).toBe(60);
  });

  it("follows the bend live while the note sounds, with re-tunable thresholds", () => {
    const s = new NoteSegmenter({ minBendCents: 150 });
    play(s, 0.5, (t) => 64 + ramp(t, 0.1, 0.3));
    expect(s.notes[0].bend).toBeNull(); // a semitone is below 150 cents
    s.configure({ minBendCents: 70 });
    play(s, 0.3, (t) => 65 + ramp(t, 0, 0.2), 0.525);
    expect(s.notes[0].open).toBe(true);
    expect(s.notes[0].bend!.current).toBeGreaterThanOrEqual(190);
  });

  it("reads a downward bend: a pre-bent note released, or a dip", () => {
    const s = new NoteSegmenter();
    // Picked a tone up (pre-bend), held, then released down to the fretted note.
    play(s, 1, (t) => 66 - 2 * ramp(t, 0.2, 0.45));
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0].bend).toMatchObject({ direction: "down" });
    expect(s.notes[0].bend!.cents).toBeGreaterThanOrEqual(190);
  });

  it("keeps a short, violent vibrato in one note and never calls it a bend", () => {
    const s = new NoteSegmenter();
    // ±50 cents at 7 Hz for 0.35 s: about two and a half cycles.
    play(s, 0.35, (t) => 64 + 0.5 * Math.sin(2 * Math.PI * 7 * t));
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0].bend).toBeNull();
    expect(s.notes[0].vibrato.active).toBe(true);
  });
});

describe("vibrato speed", () => {
  it("names a 6 Hz vibrato within a third of a second", () => {
    const s = new NoteSegmenter();
    play(s, 0.3, (t) => 64 + 0.25 * Math.sin(2 * Math.PI * 6 * t));
    expect(s.notes[0].vibrato.active).toBe(true);
  });
});
