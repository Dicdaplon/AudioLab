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
 */

import { useCallback, useEffect, useState } from "react";

import type { ChordScore, PitchEstimate } from "@audiolab/core";
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
  detection?: Partial<Omit<WolfDetectorConfig, "noiseGateDb">>;
}

export interface WolfJumperController {
  store: GameStore;
  gameOver: boolean;
  noiseGateDb: number;
  setNoiseGateDb: (db: number) => void;
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

  const [noiseGateDb, setNoiseGateDb] = useState(DEFAULT_NOISE_GATE_DB);
  const gateOpen = signalLevelDb > noiseGateDb;

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
  }, [detector, store, playing, instantaneousChroma, chords, signalLevelDb, pitch]);

  const reset = useCallback(() => store.dispatch({ type: "reset" }), [store]);

  return { store, gameOver, noiseGateDb, setNoiseGateDb, gateOpen, note, reset };
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
