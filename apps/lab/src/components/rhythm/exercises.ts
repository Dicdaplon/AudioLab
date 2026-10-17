/**
 * Exercise material of the Rhythm tab: written rhythms (note positions in
 * beats, two bars of 4/4) and the sequences of the scrolling exercises.
 */

import type { ChordRef } from "@audiolab/core/games";

export interface RhythmPattern {
  id: string;
  name: string;
  /** Note positions, in beats from the first downbeat. */
  beats: number[];
}

export const BEATS_PER_BAR = 4;
export const PATTERN_BARS = 2;

export const RHYTHM_PATTERNS: readonly RhythmPattern[] = [
  { id: "quarters", name: "Quarter notes", beats: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: "eighths", name: "Two eighths on beat 3", beats: [0, 1, 2, 2.5, 3, 4, 5, 6, 6.5, 7] },
  { id: "dotted", name: "Dotted quarter", beats: [0, 1.5, 2, 3, 4, 5.5, 6, 7] },
  { id: "offbeat", name: "Off-beat", beats: [0, 1, 1.5, 2.5, 3, 4, 5, 5.5, 6.5, 7] },
];

export type ScrollMode = "notes" | "chords";

export interface ScrollStep {
  /** Position in beats. */
  beat: number;
  /** Pitch class (notes mode) or chord (chords mode). */
  note?: number;
  chord?: ChordRef;
}

export interface ScrollSequence {
  bpm: number;
  steps: ScrollStep[];
}

/** Open strings E A D G B E, twice, one per beat. */
const OPEN_STRINGS = [4, 9, 2, 7, 11, 4];

export const SCROLL_SEQUENCES: Record<ScrollMode, ScrollSequence> = {
  notes: {
    bpm: 66,
    steps: [...OPEN_STRINGS, ...OPEN_STRINGS.slice().reverse()].map((note, i) => ({
      beat: i,
      note,
    })),
  },
  chords: {
    bpm: 72,
    steps: (
      [
        { root: 4, quality: "min" },
        { root: 0, quality: "maj" },
        { root: 7, quality: "maj" },
        { root: 2, quality: "maj" },
        { root: 4, quality: "min" },
        { root: 0, quality: "maj" },
        { root: 7, quality: "maj" },
        { root: 2, quality: "maj" },
      ] as ChordRef[]
    ).map((chord, i) => ({ beat: i * 2, chord })),
  },
};
