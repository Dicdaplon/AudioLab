/**
 * Key detection via Krumhansl-Schmuckler correlation, jointly over the
 * 12 major and 12 minor keys.
 *
 * Given a chroma vector (12-D pitch-class histogram), we score each of the
 * 24 candidate keys by Pearson correlation against the corresponding mode
 * profile rotated to that tonic, then convert the 24 correlations into a
 * probability distribution by softmax.
 *
 * Reference:
 *   Krumhansl, C. L. (1990). Cognitive foundations of musical pitch.
 *   Section 2.4 — empirical key profiles from probe-tone experiments.
 */

import { CHROMA_SIZE } from "./chroma";
import { NOTE_NAMES } from "../utils/notes";

export type KeyMode = "maj" | "min";

/** Krumhansl & Kessler (1982) MAJOR-key profile. Index 0 = tonic. */
export const KRUMHANSL_MAJOR_PROFILE: readonly number[] = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];

/** Krumhansl & Kessler (1982) MINOR-key profile. Index 0 = tonic. */
export const KRUMHANSL_MINOR_PROFILE: readonly number[] = [
  6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

export const KEY_PROFILES: Record<KeyMode, readonly number[]> = {
  maj: KRUMHANSL_MAJOR_PROFILE,
  min: KRUMHANSL_MINOR_PROFILE,
};

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
  /** Probability assigned to this key after softmax over the 24 correlations. */
  probability: number;
}

/**
 * Score the 24 keys (12 major + 12 minor) against a chroma vector.
 *
 * @param chroma       Pitch-class energy vector (length 12). Need not be normalized.
 * @param temperature  Softmax temperature. Lower = more peaked. Default 0.1.
 * @returns            Array of 24 KeyScore entries, sorted by descending probability.
 */
export function detectKey(
  chroma: ArrayLike<number>,
  temperature = 0.1,
): KeyScore[] {
  if (chroma.length !== CHROMA_SIZE) {
    throw new Error(`expected chroma of length ${CHROMA_SIZE}, got ${chroma.length}`);
  }

  const candidates: Array<{ tonic: number; mode: KeyMode; correlation: number }> = [];
  for (const mode of ["maj", "min"] as const) {
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      candidates.push({
        tonic,
        mode,
        correlation: pearsonAgainstRotatedProfile(chroma, tonic, mode),
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
export function detectMajorKey(
  chroma: ArrayLike<number>,
  temperature = 0.1,
): KeyScore[] {
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
): number {
  const n = CHROMA_SIZE;
  const profile = KEY_PROFILES[mode];

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
    const profileIdx = ((i - tonic) % n + n) % n;
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

/** Numerically stable softmax with temperature. */
export function softmax(values: number[], temperature: number): number[] {
  const t = temperature > 0 ? temperature : 1;
  const scaled = values.map((v) => v / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  if (sum === 0) return values.map(() => 1 / values.length);
  return exps.map((e) => e / sum);
}
