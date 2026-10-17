/**
 * Background level ("noise floor") of a level stream over time. Pure.
 *
 * Not to be confused with `estimateNoiseFloor` (analysis/noiseFloor.ts),
 * which summarises the bins of ONE spectrum. This tracker follows the
 * quietest level of the recent past:
 *
 *   floor = min(level over the last `windowMs`)
 *
 * computed with sub-window minima (the "minimum statistics" layout of
 * R. Martin, "Noise power spectral density estimation based on optimal
 * smoothing and minimum statistics", IEEE Trans. Speech Audio Proc. 9(5),
 * 2001, without its bias compensation): the window is split into
 * `subWindows` slots; each slot keeps its own minimum and the oldest slot
 * is dropped when a new one starts.
 *
 * Behaviour that matters for a gate:
 *   - the floor FALLS at once when the level drops (a quieter moment is
 *     always the better estimate of the background);
 *   - it RISES only once a whole window has passed without a quieter
 *     moment (a fan switched on is learnt within `windowMs`; a sustained
 *     note is not mistaken for noise as long as there is a pause, or a
 *     decay, in every window);
 *   - without bias compensation the floor sits slightly under the mean
 *     background level, which errs on the side of letting notes through.
 */

import { resolveConfig } from "../../utils/resolveConfig";

export interface LevelFloorConfig {
  /** Memory of the minimum, in ms. Default 6000. */
  windowMs: number;
  /** Number of sub-windows (the rise granularity is windowMs / subWindows). Default 6. */
  subWindows: number;
}

export const LEVEL_FLOOR_DEFAULTS: LevelFloorConfig = {
  windowMs: 6000,
  subWindows: 6,
};

export interface LevelFloorState {
  /** Minimum of each closed sub-window, oldest first. */
  readonly closed: readonly number[];
  /** Minimum of the open sub-window. */
  readonly current: number;
  /** Time spent in the open sub-window, in ms. */
  readonly elapsedMs: number;
}

export const INITIAL_LEVEL_FLOOR_STATE: LevelFloorState = {
  closed: [],
  current: Infinity,
  elapsedMs: 0,
};

/** The floor of a state, or null before the first level. */
export function levelFloorOf(state: LevelFloorState): number | null {
  let m = state.current;
  for (const v of state.closed) if (v < m) m = v;
  return Number.isFinite(m) ? m : null;
}

/** Advance the tracker by one level observation lasting `dtMs`. */
export function stepLevelFloor(
  state: LevelFloorState,
  levelDb: number,
  dtMs: number,
  config: LevelFloorConfig = LEVEL_FLOOR_DEFAULTS,
): LevelFloorState {
  const slotMs = config.windowMs / Math.max(1, config.subWindows);
  let current = Number.isFinite(levelDb) ? Math.min(state.current, levelDb) : state.current;
  let elapsedMs = state.elapsedMs + Math.max(0, dtMs);
  let closed = state.closed;
  if (elapsedMs >= slotMs) {
    // Keep subWindows − 1 closed slots: with the open one they span the window.
    closed = [...closed, current].slice(-Math.max(0, config.subWindows - 1));
    current = Infinity;
    elapsedMs -= slotMs;
  }
  return { closed, current, elapsedMs };
}

/** Object wrapper of `stepLevelFloor`. */
export class LevelFloorTracker {
  readonly config: LevelFloorConfig;
  private state: LevelFloorState = INITIAL_LEVEL_FLOOR_STATE;

  constructor(config: Partial<LevelFloorConfig> = {}) {
    this.config = resolveConfig(LEVEL_FLOOR_DEFAULTS, config);
  }

  /** Current floor in dB, or null before the first level. */
  get floorDb(): number | null {
    return levelFloorOf(this.state);
  }

  push(levelDb: number, dtMs: number): number | null {
    this.state = stepLevelFloor(this.state, levelDb, dtMs, this.config);
    return this.floorDb;
  }

  reset(): void {
    this.state = INITIAL_LEVEL_FLOOR_STATE;
  }
}
