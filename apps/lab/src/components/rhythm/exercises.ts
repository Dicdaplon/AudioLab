/**
 * Exercise material of the Rhythm tab: written rhythms (durations in beats,
 * a negative one for a rest, two bars of 4/4) and the sequences of the
 * scrolling exercises.
 */

import type { ChordRef } from "@audiolab/core/games";
import { eventsFromDurations, type RhythmEvent } from "@audiolab/core/rhythm";

export interface RhythmPattern {
  id: string;
  name: string;
  /** Two bars of durations in beats; negative for a rest. */
  durations: number[];
}

export const BEATS_PER_BAR = 4;
export const PATTERN_BARS = 2;

export const RHYTHM_PATTERNS: readonly RhythmPattern[] = [
  { id: "quarters", name: "Quarter notes", durations: [1, 1, 1, 1, 1, 1, 1, 1] },
  { id: "halves", name: "Half and quarter notes", durations: [2, 1, 1, 2, 2] },
  {
    id: "eighths",
    name: "Two eighths on beat 3",
    durations: [1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 1],
  },
  { id: "rests", name: "A rest on beat 3", durations: [1, 1, -1, 1, 1, 1, -1, 1] },
  { id: "dotted", name: "Dotted quarter", durations: [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1] },
  {
    id: "gallop",
    name: "Eighths on beats 2 and 4",
    durations: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5],
  },
  { id: "offbeat", name: "Off-beat", durations: [1, 0.5, 1, 0.5, 1, 1, 0.5, 1, 0.5, 1] },
  {
    id: "upbeats",
    name: 'Only the "and"s',
    durations: [
      -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5,
    ],
  },
  {
    id: "sixteenths",
    name: "Sixteenths on beat 4",
    durations: [1, 1, 1, 0.25, 0.25, 0.25, 0.25, 1, 1, 1, 0.25, 0.25, 0.25, 0.25],
  },
];

/** The pattern played `times` times in a row, as rhythm events. */
export function patternEvents(pattern: RhythmPattern, times = 1): RhythmEvent[] {
  return eventsFromDurations(Array.from({ length: times }, () => pattern.durations).flat());
}

export const TEMPI = [50, 60, 70, 80, 90, 100, 120] as const;

export type ScrollMode = "notes" | "chords";

export interface ScrollSequence {
  events: RhythmEvent[];
  /** Sounding MIDI note of each event (notes mode). */
  midi?: number[];
  /** Chord of each event (chords mode). */
  chords?: ChordRef[];
}

/** Open strings E2 A2 D3 G3 B3 E4, up then down, one per beat. */
const OPEN_STRINGS = [40, 45, 50, 55, 59, 64];
const STRINGS_UP_DOWN = [...OPEN_STRINGS, ...OPEN_STRINGS.slice().reverse()];

const PROGRESSION: ChordRef[] = [
  { root: 4, quality: "min" },
  { root: 0, quality: "maj" },
  { root: 7, quality: "maj" },
  { root: 2, quality: "maj" },
];

export const SCROLL_SEQUENCES: Record<ScrollMode, ScrollSequence> = {
  notes: {
    events: eventsFromDurations(STRINGS_UP_DOWN.map(() => 1)),
    midi: STRINGS_UP_DOWN,
  },
  chords: {
    events: eventsFromDurations([2, 2, 2, 2, 2, 2, 2, 2]),
    chords: [...PROGRESSION, ...PROGRESSION],
  },
};
