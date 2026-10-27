/** What every exercise of the Rhythm tab receives from the tab. */

import type {
  ChordAfterOnsetOptions,
  NoteAfterOnsetOptions,
  OnsetAnalysis,
  TimingBudget,
} from "@audiolab/core";
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
  /** Options of the scrolling notes' `noteLabeler` (the picked pitch method). */
  noteLabel: NoteAfterOnsetOptions;
  /** Options of the scrolling chords' `chordLabeler` (the picked chroma). */
  chordLabel: ChordAfterOnsetOptions;
}

export const VERDICT_TEXT: Record<string, string> = {
  onTime: "On time",
  early: "Early",
  late: "Late",
  missed: "Missed",
};
