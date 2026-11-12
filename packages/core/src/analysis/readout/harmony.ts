/**
 * Harmony helpers for a display: the notes of a key, a chord's degree in it
 * (roman numeral), a note's scale degree, and the circle-of-fifths order.
 *
 * Minor keys use the natural minor for membership; the raised leading tone
 * (V and vii° of harmonic minor) is still named as a diatonic degree, since
 * that is how a minor-key blues or gypsy-jazz tune is played.
 */

import { CHORD_QUALITY_INTERVALS, type ChordQuality } from "../chordDetection";
import type { KeyMode } from "../keyDetection";

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11] as const;
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10] as const;
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** The seven pitch classes of a key (natural minor for "min"), tonic first. */
export function keyPitchClasses(tonic: number, mode: KeyMode): number[] {
  return (mode === "min" ? MINOR_STEPS : MAJOR_STEPS).map((s) => mod12(tonic + s));
}

/** Scale degree of a pitch class in a key, 1 … 7, or null when outside the scale. */
export function scaleDegree(pc: number, tonic: number, mode: KeyMode): number | null {
  const steps: readonly number[] = mode === "min" ? MINOR_STEPS : MAJOR_STEPS;
  const i = steps.indexOf(mod12(pc - tonic));
  if (i >= 0) return i + 1;
  // Harmonic minor's raised seventh still reads as degree 7.
  if (mode === "min" && mod12(pc - tonic) === 11) return 7;
  return null;
}

/** Position of a pitch class on the circle of fifths: C = 0, G = 1, D = 2, … F = 11. */
export function fifthsIndex(pc: number): number {
  return mod12(pc * 7);
}

export interface ChordDegree {
  /** Degree of the root, 1 … 7 (a chromatic root counts as the degree it alters). */
  degree: number;
  /** Roman numeral with accidentals and quality marks, e.g. "vi", "V7", "♭VII", "vii°". */
  numeral: string;
  /** True when every chord tone belongs to the key (raised 7th allowed in minor). */
  diatonic: boolean;
}

const MINORISH: ReadonlySet<ChordQuality> = new Set(["min", "min7", "min6", "dim", "min7b5"]);
const SUFFIX: Readonly<Record<ChordQuality, string>> = {
  maj: "",
  min: "",
  dom7: "7",
  maj7: "maj7",
  min7: "7",
  sus2: "sus2",
  sus4: "sus4",
  maj6: "6",
  min6: "6",
  dim: "°",
  min7b5: "ø7",
};

/**
 * Chromatic roots, as [accidental, degree index], following the usual
 * spelling: borrowed ♭II, ♭III, ♭VI, ♭VII and the ♯IV of a secondary
 * dominant in major; ♭II, ♯III, ♯IV and the raised ♯VI (melodic minor) in
 * minor, whose raised seventh is plain VII (harmonic minor).
 */
const CHROMATIC: Readonly<Record<KeyMode, Readonly<Record<number, readonly [string, number]>>>> = {
  maj: { 1: ["♭", 1], 3: ["♭", 2], 6: ["♯", 3], 8: ["♭", 5], 10: ["♭", 6] },
  min: { 1: ["♭", 1], 4: ["♯", 2], 6: ["♯", 3], 9: ["♯", 5], 11: ["", 6] },
};

/**
 * Roman numeral of a chord in a key, relative to the key's own scale (in A
 * minor, C is "III"; in C major, B♭ is "♭VII"). Upper case for
 * major-sounding qualities, lower case for minor and diminished ones.
 */
export function chordDegree(
  root: number,
  quality: ChordQuality,
  tonic: number,
  mode: KeyMode,
): ChordDegree {
  const interval = mod12(root - tonic);
  const own: readonly number[] = mode === "min" ? MINOR_STEPS : MAJOR_STEPS;
  const diatonicIndex = own.indexOf(interval);
  const [accidental, index] =
    diatonicIndex >= 0 ? (["", diatonicIndex] as const) : CHROMATIC[mode][interval];
  const base = NUMERALS[index];
  const numeral =
    accidental + (MINORISH.has(quality) ? base.toLowerCase() : base) + SUFFIX[quality];

  const tones = CHORD_QUALITY_INTERVALS[quality].map((i) => mod12(root + i));
  const diatonic = tones.every((t) => scaleDegree(t, tonic, mode) !== null);
  return { degree: index + 1, numeral, diatonic };
}
