/** What every exercise of the Rhythm tab receives from the tab. */

import type { OnsetAnalysis, TimingBudget } from "@audiolab/core";
import type { MetronomeControls, PlayAlongControls } from "@audiolab/react";

import type { OnsetBus } from "./onsetBus";

export interface ExerciseEnv {
  /** Raw onsets, for the free-tempo written rhythm. */
  bus: OnsetBus;
  /** The play-along run shared by the exercises (one at a time). */
  play: PlayAlongControls;
  analysis: OnsetAnalysis | null;
  budget: TimingBudget | null;
  sampleRate: number;
  running: boolean;
  /** Current AudioContext time, or null. */
  now: () => number | null;
  bpm: number;
  metronome: MetronomeControls;
}

export const VERDICT_TEXT: Record<string, string> = {
  onTime: "On time",
  early: "Early",
  late: "Late",
  missed: "Missed",
};

/** Mean score of the notes, out of 100 (each note scores 0..1, a missed one 0). */
export function scoreOutOf100(scores: readonly (number | null)[]): number {
  if (scores.length === 0) return 0;
  return Math.round((100 * scores.reduce<number>((s, v) => s + (v ?? 0), 0)) / scores.length);
}
