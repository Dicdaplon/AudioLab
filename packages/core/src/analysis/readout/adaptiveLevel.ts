/**
 * Adaptive level: whether an input is playing and how loud, relative to
 * that input, with no fixed threshold.
 *
 * The background comes from the adaptive noise gate (it learns the floor of
 * a loopback, a noisy amp or a quiet room); the ceiling follows the peaks,
 * jumping up on a louder passage and sinking slowly (`peakReleaseSeconds`),
 * so `level` stays in [0, 1] whatever the input's gain. Silence and
 * "playing" thresholds for a display can then be read off `open` instead of
 * guessed in dB.
 */

import { AdaptiveNoiseGate, type NoiseGateConfig } from "../gate/noiseGate";

export interface AdaptiveLevelOptions {
  /** Time for the ceiling to sink by `rangeDb`, in seconds. Default 30. */
  peakReleaseSeconds?: number;
  /** Smallest distance kept between floor and ceiling, in dB. Default 12. */
  minRangeDb?: number;
  /**
   * Tuning of the underlying gate. Defaults to `ADAPTIVE_LEVEL_GATE`, tuned
   * for `TonalityFrame.signalLevelDb`, where a digital loopback reads −100 in
   * silence and quiet music −90 … −80.
   */
  gate?: Partial<NoiseGateConfig>;
}

export const ADAPTIVE_LEVEL_GATE: Partial<NoiseGateConfig> = {
  minFloorDb: -100,
  maxFloorDb: -40,
  holdMs: 600,
};

export interface AdaptiveLevelReading {
  /** True while the input is playing (the gate is open). */
  open: boolean;
  /** Level between the floor (0) and the ceiling (1). */
  level: number;
  floorDb: number;
  ceilingDb: number;
  /** The input level, or the silence value when the gate is closed (for dB-based trackers). */
  gatedDb: number;
}

/** The level a closed gate reports to dB-based trackers. */
export const GATED_SILENCE_DB = -100;

export class AdaptiveLevel {
  private readonly gate: AdaptiveNoiseGate;
  private readonly release: number;
  private readonly minRange: number;
  private ceiling: number | null = null;
  private lastTime: number | null = null;

  constructor(options: AdaptiveLevelOptions = {}) {
    this.gate = new AdaptiveNoiseGate({ ...ADAPTIVE_LEVEL_GATE, ...options.gate });
    this.release = options.peakReleaseSeconds ?? 30;
    this.minRange = options.minRangeDb ?? 12;
  }

  /** Feed one level (dB) at a time in seconds. */
  push(levelDb: number, timeSeconds: number): AdaptiveLevelReading {
    const dt = this.lastTime === null ? 0.1 : Math.max(0, timeSeconds - this.lastTime);
    this.lastTime = timeSeconds;
    const db = Number.isFinite(levelDb) ? levelDb : GATED_SILENCE_DB;
    const state = this.gate.push({ levelDb: db, dtMs: dt * 1000 });
    const floor = state.floorDb;

    const span = Math.max(this.minRange, (this.ceiling ?? floor + this.minRange) - floor);
    if (this.ceiling === null || db > this.ceiling) this.ceiling = db;
    else this.ceiling -= (span * dt) / this.release;
    this.ceiling = Math.max(this.ceiling, floor + this.minRange);

    const level = Math.min(1, Math.max(0, (db - floor) / (this.ceiling - floor)));
    return {
      open: state.open,
      level: state.open ? level : 0,
      floorDb: floor,
      ceilingDb: this.ceiling,
      gatedDb: state.open ? db : GATED_SILENCE_DB,
    };
  }

  /** Re-tune the gate (e.g. its margins from `gateTuning(strictness)`); the floor is kept. */
  configure(gate: Partial<NoiseGateConfig>): void {
    this.gate.configure(gate);
  }

  reset(): void {
    this.gate.reset();
    this.ceiling = null;
    this.lastTime = null;
  }
}
