/**
 * Ready-made `OnsetLabeler`s for `PlayAlongSession`: what note or chord was
 * played at an onset, analysed on the samples just after it.
 *
 * The labels are stable keys, the ones to put in `ExpectedNote.label`:
 *   notes   the pitch class as a string, "0" (C) … "11" (B)  (`noteLabel`)
 *   chords  `chordKey({ root, quality })`, e.g. "4-min" for E minor
 * so the default `labelMatches` (equality) compares them directly.
 *
 * Both take the listening methods of `noteAfterOnset` / `chordAfterOnset`
 * (opt-in, the originals stay the defaults):
 *   noteLabeler(sr, { method: "pyin" })                 pYIN, 50 ms later
 *   noteLabeler(sr, { method: "crepe", crepeModel })    CREPE tiny
 *   chordLabeler(sr, { chromaMethod: "cqt" })           constant-Q chroma
 * There is no chord smoothing option: each label is a one-shot verdict on
 * the segment after its onset, with no frame sequence for the HMM of
 * `chordSmoothing: "hmm"` to smooth (and smoothing across onsets would pull
 * a chord change towards the previous chord).
 */

import {
  chordAfterOnset,
  chordReadyAt,
  noteAfterOnset,
  noteReadyAt,
  type ChordAfterOnsetOptions,
  type NoteAfterOnsetOptions,
} from "../analysis/onset/afterOnset";
import { chordKey } from "../analysis/chordRef";
import type { OnsetLabeler } from "./playAlong";

/** Label of an expected note: its pitch class as a string. */
export function noteLabel(pitchClass: number): string {
  return String(((pitchClass % 12) + 12) % 12);
}

/** Labels notes by pitch class. Throws when `method: "crepe"` comes without `crepeModel`. */
export function noteLabeler(sampleRate: number, options: NoteAfterOnsetOptions = {}): OnsetLabeler {
  if (options.method === "crepe" && !options.crepeModel) {
    throw new Error('noteLabeler: method "crepe" needs a loaded crepeModel');
  }
  return {
    readyAt: (frame) => noteReadyAt(frame, sampleRate, options),
    label: (history, frame) => {
      const pitch = noteAfterOnset(history, frame, sampleRate, options);
      return pitch ? noteLabel(pitch.pitchClass) : null;
    },
  };
}

/** Labels chords by `chordKey`. */
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
