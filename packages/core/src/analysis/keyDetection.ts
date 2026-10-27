/**
 * Key detection via Krumhansl-Schmuckler correlation, jointly over the
 * 12 major and 12 minor keys.
 *
 * Given a chroma vector (12-D pitch-class histogram), we score each of the
 * 24 candidate keys by Pearson correlation against the corresponding mode
 * profile rotated to that tonic, then convert the 24 correlations into a
 * probability distribution by softmax.
 *
 * The profiles default to Krumhansl–Kessler. Two corpus-based sets can be
 * chosen instead (`profile` option); they are alternatives to measure, not
 * replacements: all three were built from listening tests or scores, none
 * from audio, so none models the harmonics a recording adds (the 3rd
 * partial feeds the fifth, the 5th feeds the major third).
 *
 * References:
 *   Krumhansl, C. L. (1990). Cognitive foundations of musical pitch.
 *   Section 2.4 — empirical key profiles from probe-tone experiments.
 *   Temperley, D. (2007). Music and Probability, MIT Press, Table 6.1
 *   (the "CBMS" profiles, after Temperley 1999, Music Perception 17(1);
 *   and the Kostka–Payne corpus profiles).
 */

import { CHROMA_SIZE } from "./chroma";
import { softmax } from "./math";
import { NOTE_NAMES } from "../utils/notes";

export type KeyMode = "maj" | "min";

/** Krumhansl & Kessler (1982) MAJOR-key profile. Index 0 = tonic. */
export const KRUMHANSL_MAJOR_PROFILE: readonly number[] = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];

/** Krumhansl & Kessler (1982) MINOR-key profile. Index 0 = tonic. */
export const KRUMHANSL_MINOR_PROFILE: readonly number[] = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

export const KEY_PROFILES: Record<KeyMode, readonly number[]> = {
  maj: KRUMHANSL_MAJOR_PROFILE,
  min: KRUMHANSL_MINOR_PROFILE,
};

/** The key-profile sets `detectKey` can correlate against. */
export type KeyProfileName = "krumhansl" | "temperley" | "kostkaPayne";

/**
 * Key profiles by name. `krumhansl` is the default (`KEY_PROFILES`).
 * `temperley`: Temperley's CBMS profiles; `kostkaPayne`: pitch-class
 * frequencies in the Kostka–Payne harmony textbook excerpts. Both from
 * Temperley, Music and Probability (2007), Table 6.1, as tabulated by the
 * partitura library.
 */
export const KEY_PROFILE_SETS: Readonly<
  Record<KeyProfileName, Record<KeyMode, readonly number[]>>
> = {
  krumhansl: KEY_PROFILES,
  temperley: {
    maj: [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0],
    min: [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0],
  },
  kostkaPayne: {
    maj: [0.748, 0.06, 0.488, 0.082, 0.67, 0.46, 0.096, 0.715, 0.104, 0.366, 0.057, 0.4],
    min: [0.712, 0.048, 0.474, 0.618, 0.049, 0.46, 0.105, 0.747, 0.404, 0.067, 0.133, 0.33],
  },
};

export interface DetectKeyOptions {
  /** Softmax temperature. Default 0.1. */
  temperature?: number;
  /** Key-profile set. Default "krumhansl". */
  profile?: KeyProfileName;
}

export interface KeyScore {
  /** Tonic pitch class (0 = C, ..., 11 = B). */
  tonic: number;
  /** Mode of this candidate key. */
  mode: KeyMode;
  /** Display name, e.g. "C major" or "A minor". */
  name: string;
  /** Short display name, e.g. "C" or "Am". */
  shortName: string;
  /** Raw Pearson correlation with the rotated profile, in [-1, 1]. */
  correlation: number;
  /**
   * Softmax (τ = 0.1 by default) of the 24 correlations. A ranking score
   * that sums to 1 across the candidates, not a calibrated probability.
   */
  probability: number;
}

/**
 * Score the 24 keys (12 major + 12 minor) against a chroma vector.
 *
 * @param chroma   Pitch-class energy vector (length 12). Need not be normalized.
 * @param options  Temperature and profile set. A number is the temperature
 *                 (lower = more peaked, default 0.1), the original signature.
 * @returns        Array of 24 KeyScore entries, sorted by descending probability.
 */
export function detectKey(
  chroma: ArrayLike<number>,
  options: number | DetectKeyOptions = {},
): KeyScore[] {
  if (chroma.length !== CHROMA_SIZE) {
    throw new Error(`expected chroma of length ${CHROMA_SIZE}, got ${chroma.length}`);
  }
  const opts: DetectKeyOptions = typeof options === "number" ? { temperature: options } : options;
  const temperature = opts.temperature ?? 0.1;
  const profile = opts.profile ?? "krumhansl";

  const candidates: Array<{ tonic: number; mode: KeyMode; correlation: number }> = [];
  for (const mode of ["maj", "min"] as const) {
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      candidates.push({
        tonic,
        mode,
        correlation: pearsonAgainstRotatedProfile(chroma, tonic, mode, profile),
      });
    }
  }

  const probabilities = softmax(
    candidates.map((c) => c.correlation),
    temperature,
  );

  const results: KeyScore[] = candidates.map((c, i) => ({
    tonic: c.tonic,
    mode: c.mode,
    name: keyName(c.tonic, c.mode),
    shortName: keyShortName(c.tonic, c.mode),
    correlation: c.correlation,
    probability: probabilities[i],
  }));
  results.sort((a, b) => b.probability - a.probability);
  return results;
}

/**
 * Score only the 12 major keys (kept for callers that don't care about minors).
 * Probabilities are re-normalized to sum to 1 over the 12 major candidates.
 */
export function detectMajorKey(chroma: ArrayLike<number>, temperature = 0.1): KeyScore[] {
  const majors = detectKey(chroma, temperature).filter((k) => k.mode === "maj");
  const sum = majors.reduce((a, k) => a + k.probability, 0);
  if (sum > 0) {
    for (const m of majors) m.probability /= sum;
  }
  return majors;
}

/**
 * Pearson correlation between a chroma vector and the chosen mode profile
 * rotated so that index 0 corresponds to `tonic`.
 */
export function pearsonAgainstRotatedProfile(
  chroma: ArrayLike<number>,
  tonic: number,
  mode: KeyMode = "maj",
  profileSet: KeyProfileName = "krumhansl",
): number {
  const n = CHROMA_SIZE;
  const profile = KEY_PROFILE_SETS[profileSet][mode];

  let meanX = 0;
  let meanY = 0;
  for (let i = 0; i < n; i++) {
    meanX += chroma[i];
    meanY += profile[i];
  }
  meanX /= n;
  meanY /= n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const profileIdx = (((i - tonic) % n) + n) % n;
    const dx = chroma[i] - meanX;
    const dy = profile[profileIdx] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return num / den;
}

/** "C major", "A minor". */
export function keyName(tonic: number, mode: KeyMode): string {
  return `${NOTE_NAMES[tonic]} ${mode === "maj" ? "major" : "minor"}`;
}

/** "C", "Am". */
export function keyShortName(tonic: number, mode: KeyMode): string {
  return mode === "maj" ? NOTE_NAMES[tonic] : `${NOTE_NAMES[tonic]}m`;
}

/** Relative-major tonic of a minor key (and vice versa via reverse offset). */
export function relativeMajorTonic(minorTonic: number): number {
  return (minorTonic + 3) % CHROMA_SIZE;
}

export { softmax };
