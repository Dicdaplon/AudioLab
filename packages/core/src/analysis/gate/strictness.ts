/**
 * How strict the adaptive gate is, in three levels: gentle (lets quiet notes
 * through, reacts to more noise), normal (the defaults) and strict (ignores
 * more noise, needs firmer playing).
 *
 *                     gentle    normal    strict
 *   margin above the  4.2 dB    6 dB      8.5 dB    room's background
 *   hold before close 320 ms    250 ms    200 ms
 *
 * Underneath, a strictness in [0, 1] (0.25, 0.5, 0.75 for the levels;
 * `gateTuning` takes any value): the margin doubles every quarter of the
 * scale, so each level is about 3 dB apart, a step the ear clearly hears. A
 * gentle gate also holds longer, so a decaying note is not cut.
 *
 * `GATE_STRICTNESS` gives the level per use. Reasoned, not measured: what
 * each use loses when the gate is wrong.
 */

import type { NoiseGateConfig } from "./noiseGate";

/** The three levels a player chooses from. */
export type GateLevel = "gentle" | "normal" | "strict";

/** Strictness of each level. */
export const GATE_LEVELS: Readonly<Record<GateLevel, number>> = {
  gentle: 0.25,
  normal: 0.5,
  strict: 0.75,
};

/** The level closest to a strictness. */
export function gateLevelOf(strictness: number): GateLevel {
  if (strictness < 0.375) return "gentle";
  if (strictness <= 0.625) return "normal";
  return "strict";
}

/** What the gate is used for. */
export type GateUse = "notes" | "chords" | "rhythm" | "game";

/**
 * Default strictness per use:
 * - notes, gentle: a single string decays and is quiet; cutting it hurts
 *   more than reacting to a noise.
 * - chords and rhythm, normal: a strum or an attack is loud and clear.
 * - game, strict: a noise that fires a shot or a jump is worse than a note
 *   to play a little firmer.
 */
export const GATE_STRICTNESS: Readonly<Record<GateUse, number>> = {
  notes: GATE_LEVELS.gentle,
  chords: GATE_LEVELS.normal,
  rhythm: GATE_LEVELS.normal,
  game: GATE_LEVELS.strict,
};

export interface GateTuning extends Pick<
  NoiseGateConfig,
  "openMarginDb" | "closeMarginDb" | "holdMs"
> {
  /** Margin above the background for an onset to count (`OnsetPipeline`), in dB. */
  onsetMarginDb: number;
}

/** The gate settings of a strictness in [0, 1] (clamped; 0.5 = the defaults). */
export function gateTuning(strictness: number): GateTuning {
  const s = Number.isFinite(strictness) ? Math.min(1, Math.max(0, strictness)) : 0.5;
  const margin = 6 * Math.pow(2, 2 * (s - 0.5));
  return {
    openMarginDb: margin,
    closeMarginDb: margin / 2,
    holdMs: 250 * Math.pow(2, 1.4 * (0.5 - s)),
    onsetMarginDb: margin,
  };
}
