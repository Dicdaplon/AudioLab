/**
 * Ready-made `OnsetLabeler`s for `PlayAlongSession`: what note or chord was
 * played at an onset, analysed on the samples just after it.
 *
 * The labels are stable keys, the ones to put in `ExpectedNote.label`:
 *   notes   the pitch class as a string, "0" (C) … "11" (B)  (`noteLabel`)
 *   chords  `chordKey({ root, quality })`, e.g. "4-min" for E minor
 * so the default `labelMatches` (equality) compares them directly.
 */

import {
  chordAfterOnset,
  chordReadyAt,
  noteAfterOnset,
  noteReadyAt,
  type ChordAfterOnsetOptions,
  type NoteAfterOnsetOptions,
} from "../analysis/onset/afterOnset";
import { chordKey } from "../games/chordRef";
import type { OnsetLabeler } from "./playAlong";

/** Label of an expected note: its pitch class as a string. */
export function noteLabel(pitchClass: number): string {
  return String(((pitchClass % 12) + 12) % 12);
}

export function noteLabeler(sampleRate: number, options: NoteAfterOnsetOptions = {}): OnsetLabeler {
  return {
    readyAt: (frame) => noteReadyAt(frame, sampleRate, options),
    label: (history, frame) => {
      const pitch = noteAfterOnset(history, frame, sampleRate, options);
      return pitch ? noteLabel(pitch.pitchClass) : null;
    },
  };
}

export function chordLabeler(
  sampleRate: number,
  options: ChordAfterOnsetOptions = {},
): OnsetLabeler {
  return {
    readyAt: (frame) => chordReadyAt(frame, sampleRate, options),
    label: (history, frame) => {
      const best = chordAfterOnset(history, frame, sampleRate, options)[0];
      return best ? chordKey(best) : null;
    },
  };
}
