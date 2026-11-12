/**
 * Pure helpers of the guitar timeline's staff view and bends (no canvas):
 * how a note is spelled in the song's key, where it sits on a treble staff
 * in guitar notation, how many ledger lines it needs, and how a bend is
 * labelled in a tablature.
 *
 * Guitar music is written an octave above where it sounds (the "treble 8vb"
 * clef), so the low E string (E2) is written E3, under the staff.
 */

import type { KeyRef } from "@audiolab/core";

import type { Notation } from "../names";

/** Written pitch = sounding pitch + this, in semitones (guitar notation). */
export const GUITAR_WRITTEN_OFFSET = 12;
/** Notes needing more ledger lines than this are drawn an octave nearer, marked 8va / 8vb. */
export const MAX_LEDGERS = 2;

/** Major tonics read with flats (F B♭ E♭ A♭ D♭ G♭); a minor key uses its relative major. */
const FLAT_MAJOR_TONICS = new Set([5, 10, 3, 8, 1, 6]);

/** Letter (0 = C … 6 = B) and accidental of each pitch class, with sharps or with flats. */
const SHARP_SPELLING: readonly (readonly [number, -1 | 0 | 1])[] = [
  [0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0],
]; // prettier-ignore
const FLAT_SPELLING: readonly (readonly [number, -1 | 0 | 1])[] = [
  [0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0],
]; // prettier-ignore

const LETTERS_EN = ["C", "D", "E", "F", "G", "A", "B"];
const LETTERS_FR = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"];

/** Diatonic step of the staff's bottom line (E4: octave 4 × 7 + letter E). */
const BOTTOM_LINE_STEP = 4 * 7 + 2;
/** Half-gaps from the bottom line to the top line (F5). */
export const TOP_LINE_POS = 8;

/** True when the key reads with flats; no key reads with sharps. */
export function usesFlats(key: KeyRef | null): boolean {
  if (!key) return false;
  const major = key.mode === "min" ? (key.tonic + 3) % 12 : key.tonic;
  return FLAT_MAJOR_TONICS.has(major);
}

export interface Spelling {
  /** 0 = C … 6 = B. */
  letter: number;
  /** -1 flat, 0 natural, 1 sharp. */
  accidental: -1 | 0 | 1;
  /** Diatonic step: octave × 7 + letter (C4 = 28). */
  step: number;
}

/** Spell a MIDI note with sharps or flats. */
export function spellNote(midi: number, flats: boolean): Spelling {
  const pc = ((midi % 12) + 12) % 12;
  const [letter, accidental] = (flats ? FLAT_SPELLING : SHARP_SPELLING)[pc];
  const octave = Math.floor(midi / 12) - 1;
  return { letter, accidental, step: octave * 7 + letter };
}

/** Spelled name: "B♭", "Fa♯". */
export function spelledName(s: Spelling, notation: Notation): string {
  const letter = (notation === "fr" ? LETTERS_FR : LETTERS_EN)[s.letter];
  return letter + (s.accidental === 1 ? "♯" : s.accidental === -1 ? "♭" : "");
}

/**
 * Ledger lines a staff position needs (in half-gaps above the bottom line):
 * positive above the staff, negative below, 0 on it.
 */
export function ledgerCount(pos: number): number {
  if (pos >= TOP_LINE_POS + 2) return Math.floor((pos - TOP_LINE_POS) / 2);
  if (pos <= -2) return -Math.floor(-pos / 2);
  return 0;
}

export interface StaffNote extends Spelling {
  /** Position in half-gaps above the bottom line, after any octave shift. */
  pos: number;
  /** Octaves the head was moved to stay within the ledger limit: -1 = drawn lower (8va), 1 = higher (8vb). */
  shift: number;
}

/** Where a sounding MIDI note sits on the guitar staff, octave-shifted past MAX_LEDGERS. */
export function staffNote(midi: number, flats: boolean): StaffNote {
  const spelling = spellNote(midi + GUITAR_WRITTEN_OFFSET, flats);
  let pos = spelling.step - BOTTOM_LINE_STEP;
  let shift = 0;
  while (ledgerCount(pos) > MAX_LEDGERS) {
    pos -= 7;
    shift -= 1;
  }
  while (ledgerCount(pos) < -MAX_LEDGERS) {
    pos += 7;
    shift += 1;
  }
  return { ...spelling, pos, shift };
}
