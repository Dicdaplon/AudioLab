"use client";

/**
 * Glue between the live detector and the Wolf Jumper engine
 * (`@audiolab/core/games`).
 *
 *   - Owns the game store and runs the requestAnimationFrame loop, only while
 *     the mic is running and the game is not over.
 *   - NOTES: argmax of the last `noteSmoothFrames` instantaneous chromas
 *     (≈ 300 ms smoothing), confirmed `noteConfirmations` consecutive
 *     frames → fast and snappy.
 *   - CHORDS: top-1 of the detector's 1 s chord window, confirmed
 *     `chordConfirmations` frames with a score ≥ `minChordProbability` → robust.
 *   - Both pipelines are gated by the noise gate (signal-level dB threshold).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ChordScore } from "@audiolab/core";
import {
  chordKey,
  createInitialState,
  dominantNote,
  gameReducer,
  parseChordKey,
  pushChromaFrame,
  randomSeed,
  WOLF_JUMPER_DETECTION_DEFAULTS,
  type DominantNote,
  type GameAction,
  type GameState,
  type WolfJumperConfig,
  type WolfJumperDetectionConfig,
} from "@audiolab/core/games";
import { useConfirmedDetection } from "../useConfirmedDetection";
import { DEFAULT_NOISE_GATE_DB } from "./constants";
import { createStore, useStoreSelector, type Store } from "./store";

export type GameStore = Store<GameState, GameAction>;

export interface WolfJumperInputs {
  instantaneousChroma: Float32Array;
  chords: ChordScore[];
  running: boolean;
  signalLevelDb: number;
  /** Game tuning (note pool, bonus chords, speeds, health, ...), read once at mount. */
  config?: Partial<WolfJumperConfig>;
  /** Detection tuning (smoothing, confirmations, thresholds). */
  detection?: Partial<WolfJumperDetectionConfig>;
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
const selectNotePool = (s: GameState) => s.config.notePool;

export function useWolfJumper({
  instantaneousChroma,
  chords,
  running,
  signalLevelDb,
  config,
  detection,
}: WolfJumperInputs): WolfJumperController {
  const [store] = useState<GameStore>(() =>
    createStore(gameReducer, createInitialState(randomSeed(), config)),
  );
  const gameOver = useStoreSelector(store, selectGameOver);
  const notePool = useStoreSelector(store, selectNotePool);
  const playing = running && !gameOver;
  const {
    noteSmoothFrames = WOLF_JUMPER_DETECTION_DEFAULTS.noteSmoothFrames,
    noteConfirmations = WOLF_JUMPER_DETECTION_DEFAULTS.noteConfirmations,
    minNoteEnergy = WOLF_JUMPER_DETECTION_DEFAULTS.minNoteEnergy,
    chordConfirmations = WOLF_JUMPER_DETECTION_DEFAULTS.chordConfirmations,
    minChordProbability = WOLF_JUMPER_DETECTION_DEFAULTS.minChordProbability,
  } = detection ?? {};

  useAnimationFrames(
    playing,
    useCallback(() => store.dispatch({ type: "start" }), [store]),
    useCallback((dtMs: number) => store.dispatch({ type: "tick", dtMs }), [store]),
  );

  const [noiseGateDb, setNoiseGateDb] = useState(DEFAULT_NOISE_GATE_DB);
  const gateOpen = signalLevelDb > noiseGateDb;
  const listening = playing && gateOpen;

  // --- Notes ---
  const chromaFrames = useChromaHistory(instantaneousChroma, noteSmoothFrames);
  const note = useMemo(() => dominantNote(chromaFrames), [chromaFrames]);
  const noteInPool = note !== null && notePool.includes(note.pc);
  useConfirmedDetection({
    frame: instantaneousChroma,
    label: listening && noteInPool ? note.pc : null,
    probability: note?.energy ?? 0,
    required: noteConfirmations,
    minProbability: minNoteEnergy,
    onConfirm: (pc) => store.dispatch({ type: "noteDetected", pc }),
  });

  // --- Chords ---
  const topChord = chords[0];
  useConfirmedDetection({
    frame: chords,
    label: listening && topChord ? chordKey(topChord) : null,
    probability: topChord?.probability ?? 0,
    required: chordConfirmations,
    minProbability: minChordProbability,
    onConfirm: (key) => store.dispatch({ type: "chordDetected", chord: parseChordKey(key) }),
  });

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

/** Last `size` chroma frames, updated whenever a new frame arrives. */
function useChromaHistory(chroma: Float32Array, size: number): readonly Float32Array[] {
  const [history, setHistory] = useState<{
    latest: Float32Array | null;
    frames: readonly Float32Array[];
  }>({ latest: null, frames: [] });

  // Derive state from the incoming frame during render (no extra effect pass).
  if (history.latest !== chroma) {
    const next = { latest: chroma, frames: pushChromaFrame(history.frames, chroma, size) };
    setHistory(next);
    return next.frames;
  }
  return history.frames;
}
