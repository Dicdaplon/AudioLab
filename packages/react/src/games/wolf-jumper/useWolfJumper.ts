"use client";

/**
 * Glue between the live detector and the Wolf Jumper engine
 * (`@audiolab/core/games`).
 *
 *   - Owns the game store and runs the requestAnimationFrame loop, only while
 *     the mic is running and the game is not over.
 *   - Detection (note smoothing, note pool, confirmations, noise gate) is a
 *     `WolfJumperDetector`: each new analysis frame is pushed to it while
 *     playing, and the actions it returns are dispatched to the store. It is
 *     reset on pause, so a resumed game starts from fresh audio.
 *   - The noise gate is automatic by default (the detector's adaptive gate
 *     learns the room); setting a threshold switches it to manual.
 */

import { useCallback, useEffect, useState } from "react";

import {
  GATE_STRICTNESS,
  type ChordScore,
  type NoiseGateState,
  type PitchEstimate,
} from "@audiolab/core";
import {
  aliveBonusChords,
  createInitialState,
  gameReducer,
  randomSeed,
  WolfJumperDetector,
  type DominantNote,
  type GameAction,
  type GameState,
  type WolfDetectorConfig,
  type WolfJumperConfig,
} from "@audiolab/core/games";
import { DEFAULT_NOISE_GATE_DB } from "./constants";
import { createStore, useStoreSelector, type Store } from "./store";

export type GameStore = Store<GameState, GameAction>;

export interface WolfJumperInputs {
  instantaneousChroma: Float32Array;
  chords: ChordScore[];
  running: boolean;
  signalLevelDb: number;
  /** Latest `usePitch` estimate; read only with `detection.noteSource: "pitch"`. */
  pitch?: PitchEstimate | null;
  /** Game tuning (note pool, bonus chords, speeds, health, ...), read once at mount. */
  config?: Partial<WolfJumperConfig>;
  /** Detection tuning (smoothing, confirmations, thresholds, note source, chord policy). */
  detection?: Partial<Omit<WolfDetectorConfig, "noiseGateDb" | "gate">>;
  /** Initial gate mode. Default "auto". */
  gate?: GateSetting;
}

/** "auto": learnt from the room; "manual": the player's threshold. */
export type GateSetting = "auto" | "manual";

export interface WolfJumperController {
  store: GameStore;
  gameOver: boolean;
  /** Manual threshold, in dB (used in manual mode). */
  noiseGateDb: number;
  /** Set the manual threshold; switches the gate to manual. */
  setNoiseGateDb: (db: number) => void;
  gateMode: GateSetting;
  setGateMode: (mode: GateSetting) => void;
  /** How strict the automatic gate is, 0 gentle … 1 strict. */
  gateStrictness: number;
  setGateStrictness: (value: number) => void;
  /** Automatic gate state (background, threshold), null in manual mode or before a frame. */
  gate: NoiseGateState | null;
  gateOpen: boolean;
  /** Smoothed strongest pitch class, for display (may be outside the note pool). */
  note: DominantNote | null;
  reset: () => void;
}

const selectGameOver = (s: GameState) => s.gameOver;

export function useWolfJumper({
  instantaneousChroma,
  chords,
  running,
  signalLevelDb,
  pitch,
  config,
  detection,
  gate: initialGate = "auto",
}: WolfJumperInputs): WolfJumperController {
  const [store] = useState<GameStore>(() =>
    createStore(gameReducer, createInitialState(randomSeed(), config)),
  );
  const gameOver = useStoreSelector(store, selectGameOver);
  const playing = running && !gameOver;

  useAnimationFrames(
    playing,
    useCallback(() => store.dispatch({ type: "start" }), [store]),
    useCallback((dtMs: number) => store.dispatch({ type: "tick", dtMs }), [store]),
  );

  const [noiseGateDb, setManualDb] = useState(DEFAULT_NOISE_GATE_DB);
  const [gateMode, setGateMode] = useState<GateSetting>(initialGate);
  const setNoiseGateDb = useCallback((db: number) => {
    setManualDb(db);
    setGateMode("manual");
  }, []);
  const [gateStrictness, setGateStrictness] = useState(
    detection?.gateStrictness ?? GATE_STRICTNESS.game,
  );
  const [gate, setGate] = useState<NoiseGateState | null>(null);
  const gateOpen = gateMode === "manual" ? signalLevelDb > noiseGateDb : gate === null || gate.open;

  const [detector] = useState(
    () => new WolfJumperDetector({ ...detection, noiseGateDb: DEFAULT_NOISE_GATE_DB }),
  );
  const {
    noteSmoothFrames,
    noteConfirmations,
    minNoteEnergy,
    chordConfirmations,
    minChordProbability,
    noteSource,
    minPitchClarity,
    chordAccept,
  } = detection ?? {};
  // Declared before the push effect, so a frame always sees the latest tuning.
  useEffect(() => {
    detector.configure({
      noteSmoothFrames,
      noteConfirmations,
      minNoteEnergy,
      chordConfirmations,
      minChordProbability,
      noteSource,
      minPitchClarity,
      chordAccept,
      noiseGateDb,
      gate: gateMode === "auto" ? "adaptive" : "fixed",
      gateStrictness,
    });
  }, [
    detector,
    noteSmoothFrames,
    noteConfirmations,
    minNoteEnergy,
    chordConfirmations,
    minChordProbability,
    noteSource,
    minPitchClarity,
    chordAccept,
    noiseGateDb,
    gateMode,
    gateStrictness,
  ]);

  const [note, setNote] = useState<DominantNote | null>(null);
  useEffect(() => {
    if (!playing) {
      detector.reset();
      return;
    }
    const game = store.getState();
    const actions = detector.push(
      { instantaneousChroma, chords, signalLevelDb, pitch },
      game.config.notePool,
      aliveBonusChords(game),
    );
    actions.forEach(store.dispatch);
    const heard = detector.note;
    setNote((prev) => (prev?.pc === heard?.pc && prev?.energy === heard?.energy ? prev : heard));
    setGate(detector.gate);
  }, [detector, store, playing, instantaneousChroma, chords, signalLevelDb, pitch]);

  const reset = useCallback(() => store.dispatch({ type: "reset" }), [store]);

  return {
    store,
    gameOver,
    noiseGateDb,
    setNoiseGateDb,
    gateMode,
    setGateMode,
    gateStrictness,
    setGateStrictness,
    gate: gateMode === "auto" ? gate : null,
    gateOpen,
    note,
    reset,
  };
}

/**
 * Calls `onStart` then `onFrame(dtMs)` on every animation frame while
 * `active`. The first frame after (re)activation only sets the reference
 * timestamp, so paused time is never simulated.
 */
function useAnimationFrames(
  active: boolean,
  onStart: () => void,
  onFrame: (dtMs: number) => void,
): void {
  useEffect(() => {
    if (!active) return;
    onStart();
    let raf = 0;
    let last: number | null = null;
    const loop = (timestamp: number) => {
      if (last !== null) onFrame(timestamp - last);
      last = timestamp;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, onStart, onFrame]);
}
