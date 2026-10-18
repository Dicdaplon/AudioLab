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
