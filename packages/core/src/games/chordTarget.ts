/**
 * "Play this chord": confirms that the detector hears a target chord.
 *
 * Feed one analysis frame per call. A frame counts when the top-1 chord
 * matches the target under the accept policy (`matchesTarget`), its score
 * reaches `minProbability` and the signal is above the noise gate; the
 * target is confirmed after `confirmations` such frames in a row. Any other
 * frame restarts the count, and so does a new target (the run is keyed on
 * the target, not on the detected name, so E and E7 alternating under the
 * triad policy keep counting).
 *
 * `stepChordTarget` is the pure transition; `ChordTargetMatcher` holds the
 * state for callers that prefer an object. No timers, no React.
 */

import type { ChordScore } from "../analysis/chordDetection";
import { CHORD_GAME_DEFAULTS, type ChordGameConfig } from "./chordGame";
import { chordKey, matchesTarget, type ChordAcceptPolicy, type ChordRef } from "./chordRef";
import { EMPTY_CONFIRMATION, stepConfirmation, type ConfirmationState } from "./confirmation";
import { resolveConfig } from "../utils/resolveConfig";
import {
  initialNoiseGateState,
  NOISE_GATE_DEFAULTS,
  stepNoiseGate,
  type NoiseGateState,
} from "../analysis/gate/noiseGate";
import { GATE_STRICTNESS, gateTuning } from "../analysis/gate/strictness";
import type { GateMode } from "./wolfDetector";

export interface ChordTargetConfig extends ChordGameConfig {
  /** Which detections count for the target. Default `"exact"`. */
  accept: ChordAcceptPolicy;
  /**
   * How silence is told apart (`ChordTargetMatcher` only): "adaptive" learns the
   * room's background (default), "fixed" uses `noiseGateDb`.
   */
  gate: GateMode;
  /** How strict the adaptive gate is, 0 gentle … 1 strict. Default `GATE_STRICTNESS.chords` (normal, 0.5). */
  gateStrictness: number;
  /** Time between two frames, in ms, for the adaptive gate. Default 100. */
  frameMs: number;
  /** Frames whose `signalLevelDb` is at or below this level do not count (`gate: "fixed"`). Default −Infinity (no gate). */
  noiseGateDb: number;
}

export const CHORD_TARGET_DEFAULTS: ChordTargetConfig = {
  ...CHORD_GAME_DEFAULTS,
  accept: "exact",
  gate: "adaptive",
  gateStrictness: GATE_STRICTNESS.chords,
  frameMs: 100,
  noiseGateDb: -Infinity,
};

/** The part of a `TonalityFrame` the matcher reads. */
export interface ChordTargetFrame {
  chords: readonly ChordScore[];
  /** Omitted: the gate is considered open. */
  signalLevelDb?: number;
  /** The gate's verdict, when the caller runs one (the matcher does, with `gate: "adaptive"`). */
  gateOpen?: boolean;
}

export interface ChordTargetStep {
  state: ConfirmationState<string>;
  /** The top-1 chord of the frame, or `null` for an empty ranking. */
  top: ChordScore | null;
  /** The top-1 chord counts for the target in this frame. */
  matched: boolean;
  /** Frames counted so far in the current run (0 after a confirmation). */
  count: number;
  /** This frame confirmed the target. */
  confirmed: boolean;
}

export function stepChordTarget(
  state: ConfirmationState<string>,
  frame: ChordTargetFrame,
  target: ChordRef | null,
  config: ChordTargetConfig,
): ChordTargetStep {
  const top = frame.chords[0] ?? null;
  const gateOpen = frame.gateOpen ?? (frame.signalLevelDb ?? Infinity) > config.noiseGateDb;
  const matched = gateOpen && top !== null && target !== null && matchesTarget(top, target, config);
  const step = stepConfirmation(state, matched ? chordKey(target) : null, top?.probability ?? 0, {
    required: config.confirmations,
    minProbability: config.minProbability,
  });
  return {
    state: step.state,
    top,
    matched,
    count: step.state.count,
    confirmed: step.confirmed !== null,
  };
}

export class ChordTargetMatcher {
  private cfg: ChordTargetConfig;
  private state: ConfirmationState<string> = EMPTY_CONFIRMATION;
  private gateState: NoiseGateState = initialNoiseGateState();

  constructor(config: Partial<ChordTargetConfig> = {}) {
    this.cfg = resolveConfig(CHORD_TARGET_DEFAULTS, config);
  }

  get config(): Readonly<ChordTargetConfig> {
    return this.cfg;
  }

  /** Change the tuning; the current run is kept. */
  configure(patch: Partial<ChordTargetConfig>): void {
    this.cfg = resolveConfig(this.cfg, patch);
  }

  /** The adaptive gate (background, thresholds, open). */
  get gate(): NoiseGateState {
    return this.gateState;
  }

  /** Frames counted so far in the current run. */
  get count(): number {
    return this.state.count;
  }

  /** Feed one analysis frame. */
  push(frame: ChordTargetFrame, target: ChordRef | null): ChordTargetStep {
    let gated = frame;
    if (
      this.cfg.gate === "adaptive" &&
      frame.signalLevelDb !== undefined &&
      frame.gateOpen === undefined
    ) {
      this.gateState = stepNoiseGate(
        this.gateState,
        { levelDb: frame.signalLevelDb, dtMs: this.cfg.frameMs },
        { ...NOISE_GATE_DEFAULTS, ...gateTuning(this.cfg.gateStrictness) },
      );
      gated = { ...frame, gateOpen: this.gateState.open };
    }
    const step = stepChordTarget(this.state, gated, target, this.cfg);
    this.state = step.state;
    return step;
  }

  /** Forget the current run (on a skip, a pause, a new game). */
  reset(): void {
    this.state = EMPTY_CONFIRMATION;
  }
}
