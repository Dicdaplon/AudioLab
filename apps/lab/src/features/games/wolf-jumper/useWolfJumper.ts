/**
 * Glue between the live detector and the Wolf Jumper engine.
 *
 *   - Owns the game store and runs the requestAnimationFrame loop, only while
 *     the mic is running and the game is not over.
 *   - NOTES: argmax of the last 3 instantaneous chromas (≈ 300 ms smoothing),
 *     confirmed 2 consecutive frames → fast and snappy.
 *   - CHORDS: top-1 of the detector's 1 s chord window, confirmed 3 frames
 *     with probability ≥ MIN_CHORD_PROB → robust.
 *   - Both pipelines are gated by the noise gate (signal-level dB threshold).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ChordScore } from "@audiolab/core";
import { useConfirmedDetection } from "../useConfirmedDetection";
import {
  CHORD_CONFIRMATIONS,
  DEFAULT_NOISE_GATE_DB,
  MIN_CHORD_PROB,
  MIN_NOTE_ENERGY,
  NOTE_CONFIRMATIONS,
  NOTE_SMOOTH_FRAMES,
  findNoteDef,
} from "./constants";
import { createInitialState, gameReducer, type GameAction, type GameState } from "./engine";
import { dominantNote, pushChromaFrame, type DominantNote } from "./noteDetection";
import { randomSeed } from "./rng";
import { createStore, useStoreSelector, type Store } from "./store";

export type GameStore = Store<GameState, GameAction>;

export interface WolfJumperInputs {
  instantaneousChroma: Float32Array;
  chords: ChordScore[];
  running: boolean;
  signalLevelDb: number;
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
}: WolfJumperInputs): WolfJumperController {
  const [store] = useState<GameStore>(() =>
    createStore(gameReducer, createInitialState(randomSeed())),
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
  const listening = playing && gateOpen;

  // --- Notes ---
  const chromaFrames = useChromaHistory(instantaneousChroma, NOTE_SMOOTH_FRAMES);
  const note = useMemo(() => dominantNote(chromaFrames), [chromaFrames]);
  const noteInPool = note !== null && findNoteDef(note.pc) !== undefined;
  useConfirmedDetection({
    frame: instantaneousChroma,
    label: listening && noteInPool ? note.pc : null,
    probability: note?.energy ?? 0,
    required: NOTE_CONFIRMATIONS,
    minProbability: MIN_NOTE_ENERGY,
    onConfirm: (pc) => store.dispatch({ type: "noteDetected", pc }),
  });

  // --- Chords ---
  const topChord = chords[0];
  useConfirmedDetection({
    frame: chords,
    label: listening && topChord ? topChord.name : null,
    probability: topChord?.probability ?? 0,
    required: CHORD_CONFIRMATIONS,
    minProbability: MIN_CHORD_PROB,
    onConfirm: (name) => store.dispatch({ type: "chordDetected", name }),
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
