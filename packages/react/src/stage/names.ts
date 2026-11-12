/**
 * Note, key and chord names for the stage, in French (solfège) or English
 * letters. The SDK's own names (`KeyScore.name`, `ChordScore.name`) are
 * English with ASCII sharps; a stage shows real ♯ / ♭ glyphs and, for a
 * French-speaking audience, Do Ré Mi.
 */

import type { ChordQuality, KeyMode } from "@audiolab/core";

export type Notation = "fr" | "en";

/** Spelling per pitch class: sharps, except E♭ and B♭ (the usual guitar spelling). */
const EN = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"];
const FR = ["Do", "Do♯", "Ré", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "Si♭", "Si"];

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

export function noteName(pc: number, notation: Notation = "en"): string {
  return (notation === "fr" ? FR : EN)[mod12(pc)];
}

/** "majeur" / "mineur" or "major" / "minor". */
export function modeName(mode: KeyMode, notation: Notation = "en"): string {
  if (notation === "fr") return mode === "min" ? "mineur" : "majeur";
  return mode === "min" ? "minor" : "major";
}

/** Short key name: "Em", "G". */
export function keyShortName(tonic: number, mode: KeyMode, notation: Notation = "en"): string {
  return noteName(tonic, notation) + (mode === "min" ? "m" : "");
}

const SUFFIX: Readonly<Record<ChordQuality, string>> = {
  maj: "",
  min: "m",
  dom7: "7",
  maj7: "maj7",
  min7: "m7",
  sus2: "sus2",
  sus4: "sus4",
  maj6: "6",
  min6: "m6",
  dim: "°",
  min7b5: "ø",
};

/** Chord quality suffix: "", "m", "7", "maj7", "°" … */
export function chordSuffix(quality: ChordQuality): string {
  return SUFFIX[quality];
}

/** Full chord name: "Am7", or "Lam7" in French. */
export function chordName(root: number, quality: ChordQuality, notation: Notation = "en"): string {
  return noteName(root, notation) + SUFFIX[quality];
}

/** True for chords that sound minor (minor third over the root). */
export function isMinorQuality(quality: ChordQuality): boolean {
  return (
    quality === "min" ||
    quality === "min7" ||
    quality === "min6" ||
    quality === "dim" ||
    quality === "min7b5"
  );
}
