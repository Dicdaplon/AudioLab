import { CHORD_TEMPLATES } from "@audiolab/core";

export type PoolKey = "open-major" | "open-minor" | "open-mix" | "all-major" | "all-minor" | "all";

export interface ChordPool {
  label: string;
  chords: readonly string[];
}

/** Chord subsets the player can practise with. */
export const CHORD_POOLS: Record<PoolKey, ChordPool> = {
  "open-major": {
    label: "Open major (guitar)",
    chords: ["C", "G", "D", "A", "E", "F"],
  },
  "open-minor": {
    label: "Open minor (guitar)",
    chords: ["Am", "Em", "Dm"],
  },
  "open-mix": {
    label: "Open chords mix",
    chords: ["C", "G", "D", "A", "E", "F", "Am", "Em", "Dm"],
  },
  "all-major": {
    label: "All major",
    chords: CHORD_TEMPLATES.filter((c) => c.quality === "maj").map((c) => c.name),
  },
  "all-minor": {
    label: "All minor",
    chords: CHORD_TEMPLATES.filter((c) => c.quality === "min").map((c) => c.name),
  },
  all: {
    label: "All chords",
    chords: CHORD_TEMPLATES.map((c) => c.name),
  },
};

export const POOL_KEYS = Object.keys(CHORD_POOLS) as PoolKey[];

export const DEFAULT_POOL: PoolKey = "open-mix";

/**
 * Draws a chord from `pool`, avoiding `exclude` when another choice exists.
 * `rng` returns a float in [0, 1) and defaults to `Math.random`.
 */
export function pickChord(
  pool: readonly string[],
  exclude?: string,
  rng: () => number = Math.random,
): string {
  if (pool.length === 0) return "";
  if (pool.length === 1) return pool[0];
  const candidates = exclude ? pool.filter((c) => c !== exclude) : pool;
  return candidates[Math.floor(rng() * candidates.length)];
}
