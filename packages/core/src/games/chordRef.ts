/**
 * How the games name a chord: a root pitch class and a quality, never a
 * display string. `ChordScore` from the detector satisfies `ChordRef`
 * structurally, so a detection can be passed to the engines as is.
 */

import type { ChordQuality } from "../analysis/chordDetection";

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

/** Inverse of `chordKey`. Throws on a malformed key. */
export function parseChordKey(key: string): ChordRef {
  const match = /^(\d{1,2})-(maj|min)$/.exec(key);
  const root = match ? Number(match[1]) : -1;
  if (!match || root > 11) throw new Error(`invalid chord key: ${key}`);
  return { root, quality: match[2] as ChordQuality };
}
