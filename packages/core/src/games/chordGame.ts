/**
 * Chord ear-training game: the pure parts. A UI picks a target chord from
 * a pool, confirms the detection with `stepConfirmation` and keeps the
 * score with `chordGameReducer`.
 */

import { CHORD_TEMPLATES } from "../analysis/chordDetection";
import { type ChordRef, sameChord } from "../analysis/chordRef";

export type ChordPoolId =
  "open-major" | "open-minor" | "open-mix" | "all-major" | "all-minor" | "all";

const maj = (root: number): ChordRef => ({ root, quality: "maj" });
const min = (root: number): ChordRef => ({ root, quality: "min" });

/** C G D A E F major and A E D minor (F is a barre chord on guitar). */
const OPEN_MAJOR: readonly ChordRef[] = [maj(0), maj(7), maj(2), maj(9), maj(4), maj(5)];
const OPEN_MINOR: readonly ChordRef[] = [min(9), min(4), min(2)];

/**
 * Example pools, the ones of the lab app ChordGame, keyed by a stable id.
 * Hosts with their own teaching material should pass their own lists to
 * `pickChord` (which takes any pool); these are not extended to the
 * qualities beyond major and minor.
 */
export const CHORD_POOLS: Readonly<Record<ChordPoolId, readonly ChordRef[]>> = {
  "open-major": OPEN_MAJOR,
  "open-minor": OPEN_MINOR,
  "open-mix": [...OPEN_MAJOR, ...OPEN_MINOR],
  "all-major": CHORD_TEMPLATES.filter((c) => c.quality === "maj").map((c) => maj(c.root)),
  "all-minor": CHORD_TEMPLATES.filter((c) => c.quality === "min").map((c) => min(c.root)),
  all: CHORD_TEMPLATES.map((c) => ({ root: c.root, quality: c.quality })),
};

export const CHORD_POOL_IDS = Object.keys(CHORD_POOLS) as ChordPoolId[];

export const DEFAULT_CHORD_POOL: ChordPoolId = "open-mix";

export interface ChordGameConfig {
  /** Consecutive detection frames with the target on top needed for a hit. */
  confirmations: number;
  /** Frames whose top-1 score is below this value break the run. */
  minProbability: number;
}

/** 3 frames (~300 ms at 10 Hz on top of the 1 s chord window) at a score ≥ 0.18. */
export const CHORD_GAME_DEFAULTS: ChordGameConfig = { confirmations: 3, minProbability: 0.18 };

/**
 * Draws a chord from `pool`, avoiding `exclude` when another choice exists.
 * `rng` returns a float in [0, 1) and defaults to `Math.random`. Returns
 * `null` for an empty pool.
 */
export function pickChord(
  pool: readonly ChordRef[],
  exclude?: ChordRef,
  rng: () => number = Math.random,
): ChordRef | null {
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  const candidates = exclude ? pool.filter((c) => !sameChord(c, exclude)) : pool;
  return candidates[Math.floor(rng() * candidates.length)];
}

export interface ChordGameStats {
  score: number;
  streak: number;
  bestStreak: number;
  skipped: number;
}

export type ChordGameAction = { type: "hit" } | { type: "skip" } | { type: "reset" };

export const INITIAL_CHORD_GAME_STATS: ChordGameStats = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  skipped: 0,
};

/** Score bookkeeping as a pure reducer. */
export function chordGameReducer(stats: ChordGameStats, action: ChordGameAction): ChordGameStats {
  switch (action.type) {
    case "hit": {
      const streak = stats.streak + 1;
      return {
        ...stats,
        score: stats.score + 1,
        streak,
        bestStreak: Math.max(stats.bestStreak, streak),
      };
    }
    case "skip":
      return { ...stats, skipped: stats.skipped + 1, streak: 0 };
    case "reset":
      return INITIAL_CHORD_GAME_STATS;
  }
}
