/**
 * A continuous score per note, between 0 and 1, on top of the tiers: a
 * Gaussian of the timing offset,
 *
 *   score = exp(−Δ² / (2σ²))
 *
 * 1 dead on, falling smoothly as the note drifts, never quite 0 for a note
 * that was played (a missed note scores 0). A note passes at `SCORE_PASS`
 * (0.8). By default σ is derived from the on-time window so that its edge
 * scores exactly 0.8: the "onTime" tier and "score ≥ 0.8" then say the same
 * thing. With ±100 ms on time, σ ≈ 149.7 ms.
 */

import type { TimingTolerance } from "./tolerance";

/** A note passes from this score on. */
export const SCORE_PASS = 0.8;

/** exp(−Δ² / (2σ²)), in [0, 1]; 0 for a non-finite offset or σ ≤ 0. */
export function timingScore(deltaMs: number, sigmaMs: number): number {
  if (!Number.isFinite(deltaMs) || !(sigmaMs > 0)) return 0;
  return Math.exp(-(deltaMs * deltaMs) / (2 * sigmaMs * sigmaMs));
}

/**
 * The σ that gives `score` at an offset of `deltaMs`: "0.8 at ±80 ms" is
 * `sigmaForScore(80, 0.8)`. `score` must be in (0, 1).
 */
export function sigmaForScore(deltaMs: number, score: number): number {
  if (!(score > 0 && score < 1)) throw new Error("score must be in (0, 1)");
  return Math.abs(deltaMs) / Math.sqrt(2 * Math.log(1 / score));
}

/** The default σ of a tolerance: its on-time edge scores `SCORE_PASS`. */
export function scoreSigmaFor(tolerance: TimingTolerance): number {
  return sigmaForScore(tolerance.onTimeMs, SCORE_PASS);
}

/**
 * What a stray sound costs, as a share of a perfect note: a sound outside
 * every note's window (`TimingScorerState.strays`) takes away a quarter of
 * what a note dead on brings. Lighter than a note gains, so a cough or a
 * fret buzz does not ruin a run, but playing everywhere does not pay either.
 */
export const STRAY_PENALTY = 0.25;

export interface ExerciseScore {
  /** Final score, 0–100: notes earned minus strays, never below 0. */
  score: number;
  /** What the notes earned, 0–100 (the mean of their scores). */
  notes: number;
  /** What the strays took away, in points (0–100 scale). */
  penalty: number;
  /** Stray sounds counted. */
  strays: number;
  /** Notes that pass (`SCORE_PASS`). */
  passed: number;
  /** Notes graded. */
  total: number;
}

/**
 * The score of a run: each note brings its score (0–1, a missed one 0), each
 * stray sound costs `strayPenalty` (default `STRAY_PENALTY`), all over the
 * number of notes, on 100:
 *
 *   score = max(0, Σ scores − penalty · strays) / notes · 100
 */
export function exerciseScore(
  scores: readonly (number | null)[],
  strays: number,
  strayPenalty: number = STRAY_PENALTY,
): ExerciseScore {
  const total = scores.length;
  if (total === 0) return { score: 0, notes: 0, penalty: 0, strays, passed: 0, total };
  const earned = scores.reduce<number>((s, v) => s + (v ?? 0), 0);
  const lost = Math.max(0, strayPenalty) * strays;
  return {
    score: (100 * Math.max(0, earned - lost)) / total,
    notes: (100 * earned) / total,
    penalty: (100 * lost) / total,
    strays,
    passed: scores.filter((v) => v !== null && v >= SCORE_PASS).length,
    total,
  };
}
