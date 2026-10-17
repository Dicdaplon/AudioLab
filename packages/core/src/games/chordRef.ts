/**
 * How the games name a chord: a root pitch class and a quality, never a
 * display string. `ChordScore` from the detector satisfies `ChordRef`
 * structurally, so a detection can be passed to the engines as is.
 */

import {
  CHORD_QUALITIES,
  baseTriad,
  chordPitchClasses,
  type ChordQuality,
} from "../analysis/chordDetection";

export interface ChordRef {
  /** Root pitch class (0 = C, ..., 11 = B). */
  root: number;
  quality: ChordQuality;
}

export function sameChord(a: ChordRef, b: ChordRef): boolean {
  return a.root === b.root && a.quality === b.quality;
}

/** Stable primitive key, e.g. "9-min" for A minor (usable as a confirmation label). */
export function chordKey(chord: ChordRef): string {
  return `${chord.root}-${chord.quality}`;
}

const CHORD_KEY = new RegExp(`^(\\d{1,2})-(${CHORD_QUALITIES.join("|")})$`);

/** Inverse of `chordKey`. Throws on a malformed key. */
export function parseChordKey(key: string): ChordRef {
  const match = CHORD_KEY.exec(key);
  const root = match ? Number(match[1]) : -1;
  if (!match || root > 11) throw new Error(`invalid chord key: ${key}`);
  return { root, quality: match[2] as ChordQuality };
}

/**
 * When a detected chord counts for a target:
 *
 * - `"exact"`: same pitch classes. For major and minor this is `sameChord`;
 *   it also accepts the other name of an identical pitch set (C6 for Am7,
 *   Esus4 for Asus2), which chroma cannot tell apart.
 * - `"triad"`: exact, or same root and same base triad, so E and E7 match
 *   each other (added notes are optional) but Asus4 does not match A.
 */
export type ChordAcceptPolicy = "exact" | "triad";

export interface MatchesTargetOptions {
  /** Default `"exact"`. */
  accept?: ChordAcceptPolicy;
}

export function matchesTarget(
  detected: ChordRef,
  target: ChordRef,
  { accept = "exact" }: MatchesTargetOptions = {},
): boolean {
  if (sameChord(detected, target)) return true;
  if (
    accept === "triad" &&
    detected.root === target.root &&
    baseTriad(detected.quality) === baseTriad(target.quality)
  ) {
    return true;
  }
  const a = chordPitchClasses(detected.root, detected.quality);
  const b = chordPitchClasses(target.root, target.quality);
  return a.length === b.length && a.every((pc, i) => pc === b[i]);
}
