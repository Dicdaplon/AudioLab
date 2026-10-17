/**
 * Adaptive noise gate with no setting to adjust. Pure TypeScript.
 *
 * It decides, level after level, whether someone is playing. The
 * threshold follows the background (`stepLevelFloor`) instead of being a
 * slider, and every rule leans towards letting sound through, because
 * cutting a real note is worse for a learner than reacting to a noise:
 *
 *   floor   = min of the smoothed level over the last `floorWindowMs`,
 *             starting at `minFloorDb` and rising at most
 *             `floorRiseDbPerSecond` (default 6 dB/s); it falls at once
 *   opens   when level ≥ floor + `openMarginDb`   (default 6 dB, instantly)
 *           or `tonal` is true (a caller's cue, e.g. a clear pitch)
 *   closes  when level < floor + `closeMarginDb`  (default 3 dB, hysteresis)
 *           and not tonal, for `holdMs` in a row   (default 250 ms: a guitar
 *           decays slowly and must not be chopped between notes)
 *   starts  open for `warmupMs` (default 500 ms) while the floor is learnt
 *
 * The rise limit is what keeps a player who starts at once, and keeps a
 * steady level, from being learnt as background: the floor needs 10 s to
 * climb from −90 to −30 dBFS, and any decay between notes pulls it back
 * down. In a quiet room it reaches the real background (around −65 dBFS)
 * in about 4 s, with the gate a little too open meanwhile.
 *
 * The floor is clamped to [`minFloorDb`, `maxFloorDb`]. Above
 * `noisyFloorDb` the room is flagged `noisy`: the gate keeps working with
 * its relative margin, and a UI can suggest moving somewhere quieter
 * instead of silently blocking everything.
 *
 * The gate decides about a *continuous* stream (show "listening", skip
 * silent frames). Onsets need less: a single comparison of their level
 * with the floor, see `OnsetPipeline`.
 *
 * `stepNoiseGate` is the pure transition; `AdaptiveNoiseGate` holds the
 * state for callers that prefer an object.
 */

import {
  INITIAL_LEVEL_FLOOR_STATE,
  levelFloorOf,
  stepLevelFloor,
  type LevelFloorState,
} from "./levelFloorTracker";
import { resolveConfig } from "../../utils/resolveConfig";

export interface NoiseGateConfig {
  /** Open margin above the floor, in dB. Default 6. */
  openMarginDb: number;
  /** Close margin above the floor, in dB (≤ openMarginDb). Default 3. */
  closeMarginDb: number;
  /** Time below the close threshold before closing, in ms. Default 250. */
  holdMs: number;
  /** Open time at start while the floor is learnt, in ms. Default 500. */
  warmupMs: number;
  /** Memory of the floor, in ms. Default 6000. */
  floorWindowMs: number;
  /** Smoothing of the level that feeds the floor (one-pole), in ms. Default 50. */
  floorSmoothingMs: number;
  /** Fastest rise of the floor, in dB per second. Default 6. */
  floorRiseDbPerSecond: number;
  /** Floor clamp, in dBFS. Defaults −90 and −30. */
  minFloorDb: number;
  maxFloorDb: number;
  /** Floor above which the room counts as noisy, in dBFS. Default −45. */
  noisyFloorDb: number;
}

export const NOISE_GATE_DEFAULTS: NoiseGateConfig = {
  openMarginDb: 6,
  closeMarginDb: 3,
  holdMs: 250,
  warmupMs: 500,
  floorWindowMs: 6000,
  floorSmoothingMs: 50,
  floorRiseDbPerSecond: 6,
  minFloorDb: -90,
  maxFloorDb: -30,
  noisyFloorDb: -45,
};

export interface NoiseGateInput {
  /** Level of the step, in dBFS (e.g. a `BandLevelMeter` block or a frame level). */
  levelDb: number;
  /** Duration of the step, in ms. */
  dtMs: number;
  /** Optional cue that can only open the gate (e.g. a pitch estimate of high clarity). */
  tonal?: boolean;
}

export interface NoiseGateState {
  open: boolean;
  /** Background level, clamped, in dBFS (minFloorDb until the first level). */
  floorDb: number;
  openThresholdDb: number;
  closeThresholdDb: number;
  /** True during the warm-up (the gate is held open). */
  warmingUp: boolean;
  /**
   * True while the floor is still climbing towards the background (rise
   * limit): the threshold is lower than it will be. An exercise can wait for
   * it before a count-in ("listening to the room…").
   */
  settling: boolean;
  /** True when the floor is above `noisyFloorDb`. */
  noisy: boolean;
  /** Last input level, in dBFS. */
  levelDb: number;
  // The fields below are the reducer's own state: read them, do not build on them.
  /** Internal: time spent below the close threshold, in ms. */
  readonly belowMs: number;
  /** Internal: time since the start, in ms. */
  readonly elapsedMs: number;
  /** Internal: smoothed level fed to the floor. */
  readonly smoothedDb: number | null;
  /** Internal: floor tracker state. */
  readonly floor: LevelFloorState;
}

export function initialNoiseGateState(
  config: NoiseGateConfig = NOISE_GATE_DEFAULTS,
): NoiseGateState {
  return {
    open: true,
    floorDb: config.minFloorDb,
    openThresholdDb: config.minFloorDb + config.openMarginDb,
    closeThresholdDb: config.minFloorDb + config.closeMarginDb,
    warmingUp: true,
    settling: true,
    noisy: false,
    levelDb: -Infinity,
    belowMs: 0,
    elapsedMs: 0,
    smoothedDb: null,
    floor: INITIAL_LEVEL_FLOOR_STATE,
  };
}

export function stepNoiseGate(
  state: NoiseGateState,
  input: NoiseGateInput,
  config: NoiseGateConfig = NOISE_GATE_DEFAULTS,
): NoiseGateState {
  const dtMs = Math.max(0, input.dtMs);
  const level = Number.isFinite(input.levelDb) ? input.levelDb : config.minFloorDb - 30;

  const alpha = config.floorSmoothingMs > 0 ? 1 - Math.exp(-dtMs / config.floorSmoothingMs) : 1;
  const smoothedDb =
    state.smoothedDb === null ? level : state.smoothedDb + alpha * (level - state.smoothedDb);
  const floor = stepLevelFloor(state.floor, smoothedDb, dtMs, {
    windowMs: config.floorWindowMs,
    subWindows: 6,
  });
  const target = Math.min(
    config.maxFloorDb,
    Math.max(config.minFloorDb, levelFloorOf(floor) ?? config.minFloorDb),
  );
  const floorDb = Math.min(target, state.floorDb + (config.floorRiseDbPerSecond * dtMs) / 1000);
  const openThresholdDb = floorDb + config.openMarginDb;
  const closeThresholdDb = floorDb + Math.min(config.closeMarginDb, config.openMarginDb);

  const elapsedMs = state.elapsedMs + dtMs;
  const warmingUp = elapsedMs < config.warmupMs;
  const tonal = input.tonal === true;

  let open = state.open;
  let belowMs = state.belowMs;
  if (warmingUp || tonal || level >= openThresholdDb) {
    open = true;
    belowMs = 0;
  } else if (level < closeThresholdDb) {
    belowMs += dtMs;
    if (belowMs >= config.holdMs) open = false;
  } else {
    // Between the two thresholds: keep the current decision.
    belowMs = 0;
  }

  return {
    open,
    floorDb,
    openThresholdDb,
    closeThresholdDb,
    warmingUp,
    settling: floorDb < target - 1,
    noisy: floorDb > config.noisyFloorDb,
    levelDb: level,
    belowMs,
    elapsedMs,
    smoothedDb,
    floor,
  };
}

/** Object wrapper of `stepNoiseGate`. */
export class AdaptiveNoiseGate {
  private cfg: NoiseGateConfig;
  private current: NoiseGateState;

  constructor(config: Partial<NoiseGateConfig> = {}) {
    this.cfg = resolveConfig(NOISE_GATE_DEFAULTS, config);
    this.current = initialNoiseGateState(this.cfg);
  }

  get config(): Readonly<NoiseGateConfig> {
    return this.cfg;
  }

  get state(): NoiseGateState {
    return this.current;
  }

  get open(): boolean {
    return this.current.open;
  }

  /** Change the tuning; the learnt floor is kept. */
  configure(patch: Partial<NoiseGateConfig>): void {
    this.cfg = resolveConfig(this.cfg, patch);
  }

  push(input: NoiseGateInput): NoiseGateState {
    this.current = stepNoiseGate(this.current, input, this.cfg);
    return this.current;
  }

  /** Forget the floor and warm up again (new room, new microphone). */
  reset(): void {
    this.current = initialNoiseGateState(this.cfg);
  }
}
