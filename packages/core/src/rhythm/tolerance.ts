/**
 * Timing tolerance: how far from its target a note may land and still
 * count, derived from what the measurement chain can resolve.
 *
 *   |Δ| ≤ onTimeMs              → "onTime"
 *   onTimeMs < |Δ| ≤ windowMs   → "early" / "late"
 *   no onset within windowMs    → "missed"
 *
 * Learner-friendly defaults (onTime ±100 ms, window ±300 ms), set after
 * play-testing: the ±50 / ±150 ms of rhythm games felt too strict for
 * learners on a laptop microphone. They sit above
 * the "good" windows of rhythm games (±70–100 ms) and the precision the
 * chain reaches in a browser (±10–25 ms after correction). A window
 * narrower than the chain's own uncertainty would grade the microphone,
 * not the player: `toleranceFromUncertainty` widens the defaults to 2σ
 * (on time) and 3σ (window) when the budget says so.
 */

export type TimingTier = "onTime" | "early" | "late" | "missed";

export interface TimingTolerance {
  /** Half width of the "on time" window, in ms. */
  onTimeMs: number;
  /** Half width of the matching window, in ms (beyond it an onset is not this note). */
  windowMs: number;
}

export const TIMING_TOLERANCE_DEFAULTS: TimingTolerance = {
  onTimeMs: 100,
  windowMs: 300,
};

/**
 * Tolerance for a measurement chain of standard deviation `uncertaintyMs`
 * (`TimingBudget.uncertaintyMs`): never narrower than `base`, never
 * narrower than 2σ / 3σ.
 */
export function toleranceFromUncertainty(
  uncertaintyMs: number,
  base: TimingTolerance = TIMING_TOLERANCE_DEFAULTS,
): TimingTolerance {
  const sigma = Math.max(0, uncertaintyMs);
  const onTimeMs = Math.max(base.onTimeMs, 2 * sigma);
  return { onTimeMs, windowMs: Math.max(base.windowMs, 3 * sigma, onTimeMs * 1.5) };
}

/** Tier of a matched note from its signed offset (positive = late). */
export function classifyDelta(deltaMs: number, tolerance: TimingTolerance): TimingTier {
  const a = Math.abs(deltaMs);
  if (a <= tolerance.onTimeMs) return "onTime";
  if (a <= tolerance.windowMs) return deltaMs < 0 ? "early" : "late";
  return "missed";
}
