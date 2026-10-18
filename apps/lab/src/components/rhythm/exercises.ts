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
  { id: "rests", name: "A rest on beat 3", beats: [0, 1, 3, 4, 5, 7] },
  { id: "dotted", name: "Dotted quarter", beats: [0, 1.5, 2, 3, 4, 5.5, 6, 7] },
  {
    id: "gallop",
    name: "Eighths on beats 2 and 4",
    beats: [0, 1, 1.5, 2, 3, 3.5, 4, 5, 5.5, 6, 7, 7.5],
  },
  { id: "offbeat", name: "Off-beat", beats: [0, 1, 1.5, 2.5, 3, 4, 5, 5.5, 6.5, 7] },
  { id: "upbeats", name: 'Only the "and"s', beats: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5] },
];

/** The pattern played `times` times in a row (2 bars each). */
export function repeatPattern(beats: readonly number[], times: number): number[] {
  const span = BEATS_PER_BAR * PATTERN_BARS;
  return Array.from({ length: times }, (_, r) => beats.map((b) => b + r * span)).flat();
}

/** Counting syllables of the eighth-note slots of a bar: 1 & 2 & 3 & 4 &. */
export function countLabel(slot: number): string {
  const inBar = ((slot % (BEATS_PER_BAR * 2)) + BEATS_PER_BAR * 2) % (BEATS_PER_BAR * 2);
  return inBar % 2 === 0 ? String(inBar / 2 + 1) : "&";
}

export const TEMPI = [50, 60, 70, 80, 90, 100, 120] as const;

export type ScrollMode = "notes" | "chords";

export interface ScrollStep {
  /** Position in beats. */
  beat: number;
  /** Pitch class (notes mode) or chord (chords mode). */
  note?: number;
  chord?: ChordRef;
}

export interface ScrollSequence {
  steps: ScrollStep[];
}

/** Open strings E A D G B E, twice, one per beat. */
const OPEN_STRINGS = [4, 9, 2, 7, 11, 4];

export const SCROLL_SEQUENCES: Record<ScrollMode, ScrollSequence> = {
  notes: {
    steps: [...OPEN_STRINGS, ...OPEN_STRINGS.slice().reverse()].map((note, i) => ({
      beat: i,
      note,
    })),
  },
  chords: {
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
