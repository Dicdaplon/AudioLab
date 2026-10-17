/**
 * Wolf Jumper detection: turns analysis frames into the `noteDetected` and
 * `chordDetected` actions of `gameReducer`. No React, no timers: the caller
 * pushes one frame per analysis tick while the game is playing and
 * dispatches what comes back.
 *
 *   - NOTES: by default the strongest pitch class of the last
 *     `noteSmoothFrames` instantaneous chromas (≈ 300 ms of smoothing),
 *     confirmed over `noteConfirmations` frames with an energy of at least
 *     `minNoteEnergy`: fast and snappy. With `noteSource: "pitch"` the note
 *     is the pitch class of a monophonic pitch estimate (`PitchTracker`)
 *     instead, confirmed at a clarity of at least `minPitchClarity`; the
 *     caller supplies that estimate in the frame, since a `TonalityFrame`
 *     carries no samples.
 *   - CHORDS: the top-1 chord of the detector's 1 s chord window, confirmed
 *     over `chordConfirmations` frames at a score of at least
 *     `minChordProbability`: robust. Given the chords the game is waiting
 *     for, a detection that matches one of them under `chordAccept` counts
 *     as that chord (so "triad" lets E collect an E7 bonus).
 *   - Both are gated. With `gate: "fixed"` (the default) frames at or below
 *     `noiseGateDb` count as silence. With `gate: "adaptive"` an adaptive
 *     noise gate learns the room's background from the frame levels and
 *     opens 6 dB above it (a clear pitch opens it too), so the player has
 *     nothing to set; the step reports its state as `gate`.
 *   - Notes outside the note pool never count (the display still gets them).
 *   - A frame already seen (same `instantaneousChroma` / `chords` objects)
 *     is not counted twice, so pushing from a re-render or a StrictMode
 *     double effect is harmless.
 *
 * `stepWolfDetector` is the pure transition; `WolfJumperDetector` holds the
 * state for callers that prefer an object.
 */

import type { ChordScore } from "../analysis/chordDetection";
import type { PitchEstimate } from "../analysis/pitch";
import {
  initialNoiseGateState,
  stepNoiseGate,
  type NoiseGateState,
} from "../analysis/gate/noiseGate";
import { chordKey, matchesTarget, parseChordKey, type ChordAcceptPolicy } from "./chordRef";
import type { ChordRef } from "./chordRef";
import { EMPTY_CONFIRMATION, stepConfirmation, type ConfirmationState } from "./confirmation";
import { resolveConfig } from "../utils/resolveConfig";
import {
  WOLF_JUMPER_DETECTION_DEFAULTS,
  dominantNote,
  pushChromaFrame,
  type DominantNote,
  type GameAction,
  type GameState,
  type WolfJumperDetectionConfig,
} from "./wolfJumper";

export type NoteSource = "chroma" | "pitch";

/** "fixed": the `noiseGateDb` threshold; "adaptive": learnt from the room. */
export type GateMode = "fixed" | "adaptive";

export interface WolfDetectorConfig extends WolfJumperDetectionConfig {
  /** Frames whose `signalLevelDb` is at or below this level are ignored (`gate: "fixed"`). */
  noiseGateDb: number;
  /** How silence is told apart. Default "fixed". */
  gate: GateMode;
  /** Time between two analysis frames, in ms, for the adaptive gate. Default 100. */
  frameMs: number;
  /** Where the played note comes from. */
  noteSource: NoteSource;
  /** Minimum clarity of a pitch estimate (`noteSource: "pitch"`). */
  minPitchClarity: number;
  /** Which detected chords count for a bonus chord. */
  chordAccept: ChordAcceptPolicy;
}

export const WOLF_DETECTOR_DEFAULTS: WolfDetectorConfig = {
  ...WOLF_JUMPER_DETECTION_DEFAULTS,
  noiseGateDb: -60,
  gate: "fixed",
  frameMs: 100,
  noteSource: "chroma",
  minPitchClarity: 0.9,
  chordAccept: "exact",
};

/** The part of a `TonalityFrame` the detector reads, plus an optional pitch estimate. */
export interface WolfDetectorFrame {
  instantaneousChroma: Float32Array;
  chords: readonly ChordScore[];
  signalLevelDb: number;
  /** Latest `PitchTracker` estimate; read only with `noteSource: "pitch"`. */
  pitch?: PitchEstimate | null;
}

export interface WolfDetectorState {
  /** Last `noteSmoothFrames` chromas. */
  history: readonly Float32Array[];
  note: ConfirmationState<number>;
  chord: ConfirmationState<string>;
  /** Objects of the last counted frame, to skip repeats. */
  lastChroma: Float32Array | null;
  lastChords: readonly ChordScore[] | null;
  lastPitch: PitchEstimate | null | undefined;
  /** Adaptive gate state, stepped on new frames only. */
  gate: NoiseGateState;
}

export const INITIAL_WOLF_DETECTOR_STATE: WolfDetectorState = {
  history: [],
  note: EMPTY_CONFIRMATION,
  chord: EMPTY_CONFIRMATION,
  lastChroma: null,
  lastChords: null,
  lastPitch: undefined,
  gate: initialNoiseGateState(),
};

export interface WolfDetectorStep {
  state: WolfDetectorState;
  /** Actions for `gameReducer`, in order. */
  actions: GameAction[];
  /** The note heard, for display; may be outside the note pool. */
  note: DominantNote | null;
  gateOpen: boolean;
  /** Adaptive gate state (background, thresholds); null with `gate: "fixed"`. */
  gate: NoiseGateState | null;
}

/** Chords of the bonuses still on screen: the `targetChords` of a push. */
export function aliveBonusChords(game: GameState): ChordRef[] {
  return game.bonuses.filter((b) => b.status === "alive").map((b) => b.chord);
}

export function stepWolfDetector(
  state: WolfDetectorState,
  frame: WolfDetectorFrame,
  notePool: readonly number[],
  targetChords: readonly ChordRef[] | undefined,
  config: WolfDetectorConfig,
): WolfDetectorStep {
  const actions: GameAction[] = [];
  const newChroma = frame.instantaneousChroma !== state.lastChroma;

  // --- Gate ---
  let gateState = state.gate;
  let gateOpen: boolean;
  if (config.gate === "adaptive") {
    // One step per analysis frame (a new chroma): pitch estimates may arrive
    // more often, and each step counts `frameMs`.
    if (newChroma) {
      const clear = (frame.pitch?.clarity ?? 0) >= config.minPitchClarity;
      gateState = stepNoiseGate(state.gate, {
        levelDb: frame.signalLevelDb,
        dtMs: config.frameMs,
        tonal: config.noteSource === "pitch" && clear,
      });
    }
    gateOpen = gateState.open;
  } else {
    gateOpen = frame.signalLevelDb > config.noiseGateDb;
  }

  // --- Notes ---
  const history = newChroma
    ? pushChromaFrame(state.history, frame.instantaneousChroma, config.noteSmoothFrames)
    : state.history;

  let note: DominantNote | null;
  let noteOptions: { required: number; minProbability: number };
  let newNoteFrame: boolean;
  if (config.noteSource === "pitch") {
    const pitch = frame.pitch ?? null;
    note = pitch ? { pc: pitch.pitchClass, energy: pitch.clarity } : null;
    noteOptions = { required: config.noteConfirmations, minProbability: config.minPitchClarity };
    newNoteFrame = frame.pitch !== state.lastPitch || newChroma;
  } else {
    note = dominantNote(history);
    noteOptions = { required: config.noteConfirmations, minProbability: config.minNoteEnergy };
    newNoteFrame = newChroma;
  }
  const noteLabel = gateOpen && note !== null && notePool.includes(note.pc) ? note.pc : null;
  const noteProbability = note?.energy ?? 0;
  let noteState = state.note;
  // A qualifying label counts once per frame; a failing one resets at once.
  if (newNoteFrame || noteLabel === null || noteProbability < noteOptions.minProbability) {
    const step = stepConfirmation(state.note, noteLabel, noteProbability, noteOptions);
    noteState = step.state;
    if (step.confirmed !== null) actions.push({ type: "noteDetected", pc: step.confirmed });
  }

  // --- Chords ---
  const top = frame.chords[0] ?? null;
  let chordLabel: string | null = null;
  if (gateOpen && top !== null) {
    if (targetChords === undefined) {
      chordLabel = chordKey(top);
    } else {
      const target = targetChords.find((t) =>
        matchesTarget(top, t, { accept: config.chordAccept }),
      );
      chordLabel = target ? chordKey(target) : null;
    }
  }
  const chordProbability = top?.probability ?? 0;
  const chordOptions = {
    required: config.chordConfirmations,
    minProbability: config.minChordProbability,
  };
  let chordState = state.chord;
  if (
    frame.chords !== state.lastChords ||
    chordLabel === null ||
    chordProbability < chordOptions.minProbability
  ) {
    const step = stepConfirmation(state.chord, chordLabel, chordProbability, chordOptions);
    chordState = step.state;
    if (step.confirmed !== null) {
      actions.push({ type: "chordDetected", chord: parseChordKey(step.confirmed) });
    }
  }

  return {
    state: {
      history,
      note: noteState,
      chord: chordState,
      lastChroma: frame.instantaneousChroma,
      lastChords: frame.chords,
      lastPitch: frame.pitch,
      gate: gateState,
    },
    actions,
    note,
    gateOpen,
    gate: config.gate === "adaptive" ? gateState : null,
  };
}

export class WolfJumperDetector {
  private cfg: WolfDetectorConfig;
  private state: WolfDetectorState = INITIAL_WOLF_DETECTOR_STATE;
  private lastNote: DominantNote | null = null;
  private lastGateOpen = false;
  private lastGate: NoiseGateState | null = null;

  constructor(config: Partial<WolfDetectorConfig> = {}) {
    this.cfg = resolveConfig(WOLF_DETECTOR_DEFAULTS, config);
  }

  get config(): Readonly<WolfDetectorConfig> {
    return this.cfg;
  }

  /** Change the tuning (e.g. a noise-gate slider); the current runs are kept. */
  configure(patch: Partial<WolfDetectorConfig>): void {
    this.cfg = resolveConfig(this.cfg, patch);
  }

  /** The note heard in the last frame, for display (may be outside the pool). */
  get note(): DominantNote | null {
    return this.lastNote;
  }

  get gateOpen(): boolean {
    return this.lastGateOpen;
  }

  /** Adaptive gate state after the last frame, or null with `gate: "fixed"`. */
  get gate(): NoiseGateState | null {
    return this.lastGate;
  }

  /**
   * Feed one analysis frame; returns the actions to dispatch. Pass the
   * game's `config.notePool`, and `aliveBonusChords(state)` as
   * `targetChords` for the accept policy to apply.
   */
  push(
    frame: WolfDetectorFrame,
    notePool: readonly number[],
    targetChords?: readonly ChordRef[],
  ): GameAction[] {
    const step = stepWolfDetector(this.state, frame, notePool, targetChords, this.cfg);
    this.state = step.state;
    this.lastNote = step.note;
    this.lastGateOpen = step.gateOpen;
    this.lastGate = step.gate;
    return step.actions;
  }

  /** Forget the smoothing history and the runs (on a pause or a new game). */
  reset(): void {
    this.state = INITIAL_WOLF_DETECTOR_STATE;
    this.lastNote = null;
    this.lastGateOpen = false;
    this.lastGate = null;
  }
}
