"use client";

/**
 * A play-along exercise for React: one `PlayAlongSession` at a time, its
 * results as state, its end detected, and the speaker → microphone round
 * trip measured from the metronome's echoes.
 *
 * Wire it to `useOnsetAnalysis`:
 *
 *   const play = usePlayAlong();
 *   const { budget } = useOnsetAnalysis(mic, {
 *     onOnset: play.onOnset,
 *     onBatch: play.onBatch,
 *     reference: "audio",
 *     roundTripMs: play.roundTripMs,
 *   });
 *   play.start(notes, { sampleRate, tolerance, offsetMs: budget.offsetMs,
 *     clickTimes: () => metronome.clickTimes }, endTime);
 *
 * Always pass `clickTimes` when a metronome runs, even silent: it only lists
 * the clicks actually played, so turning the sound on mid-run stays safe.
 */

import { useCallback, useRef, useState } from "react";

import { ClickEchoFilter, type StreamHistory } from "@audiolab/core";
import {
  PlayAlongSession,
  type ExpectedNote,
  type NoteResult,
  type PlayAlongOnset,
  type PlayAlongOptions,
  type PlayedOnsetView,
} from "@audiolab/core/rhythm";

export interface PlayAlongStartOptions extends Omit<PlayAlongOptions, "clicks"> {
  /** Times of the clicks played (e.g. `() => metronome.clickTimes`). */
  clickTimes?: () => readonly number[];
  /** Band of the click, in Hz. Default `CLICK_BAND_HZ`. */
  clickBand?: readonly [number, number];
}

export interface PlayAlongControls {
  /** Start a run; `endTime` (AudioContext s) is when the last note's window is over. */
  start: (notes: readonly ExpectedNote[], options: PlayAlongStartOptions, endTime: number) => void;
  /** End the run now and grade what is left. */
  stop: () => void;
  /** Results of the current (or last) run, null before the first. */
  results: readonly NoteResult[] | null;
  /** True once the run is over and graded. */
  done: boolean;
  /** True between `start` and the end of the run. */
  active: boolean;
  /** Detected onsets of the current run, for `PlayAlongLane` (read each frame). */
  onsets: () => readonly PlayedOnsetView[];
  /** Measured speaker → microphone round trip, in ms, or null (headphones, no click yet). */
  roundTripMs: number | null;
  roundTripSpreadMs: number;
  /** Give to `useOnsetAnalysis({ onOnset })`. */
  onOnset: (onset: PlayAlongOnset) => void;
  /** Give to `useOnsetAnalysis({ onBatch })`. */
  onBatch: (history: StreamHistory, analysedTime: number) => void;
}

const NO_ONSETS: readonly PlayedOnsetView[] = [];

export function usePlayAlong(): PlayAlongControls {
  const sessionRef = useRef<PlayAlongSession | null>(null);
  const endRef = useRef(Infinity);
  const activeRef = useRef(false);
  const echoRef = useRef<ClickEchoFilter | null>(null);
  echoRef.current ??= new ClickEchoFilter();
  const [results, setResults] = useState<readonly NoteResult[] | null>(null);
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(false);
  const [roundTrip, setRoundTrip] = useState<{ ms: number | null; spread: number }>({
    ms: null,
    spread: 0,
  });

  const start = useCallback(
    (notes: readonly ExpectedNote[], options: PlayAlongStartOptions, endTime: number) => {
      const { clickTimes, clickBand, ...rest } = options;
      const session = new PlayAlongSession(notes, {
        ...rest,
        clicks: clickTimes
          ? { times: clickTimes, filter: echoRef.current!, band: clickBand }
          : undefined,
      });
      sessionRef.current = session;
      endRef.current = endTime;
      activeRef.current = true;
      setResults(session.results);
      setDone(false);
      setActive(true);
    },
    [],
  );

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (!session || !activeRef.current) return;
    activeRef.current = false;
    session.finish();
    setResults([...session.results]);
    setDone(true);
    setActive(false);
  }, []);

  const onOnset = useCallback((onset: PlayAlongOnset) => {
    if (activeRef.current) sessionRef.current?.onset(onset);
  }, []);

  const onBatch = useCallback((history: StreamHistory, analysedTime: number) => {
    const session = sessionRef.current;
    if (!session || !activeRef.current) return;
    if (session.update(history, analysedTime).length > 0) setResults([...session.results]);
    const echo = echoRef.current!;
    const ms = echo.roundTripMs;
    setRoundTrip((prev) => (prev.ms === ms ? prev : { ms, spread: echo.spreadMs }));
    if (analysedTime > endRef.current && session.done) {
      activeRef.current = false;
      setResults([...session.results]);
      setDone(true);
      setActive(false);
    }
  }, []);

  const onsets = useCallback(() => sessionRef.current?.onsets ?? NO_ONSETS, []);

  return {
    start,
    stop,
    results,
    done,
    active,
    onsets,
    roundTripMs: roundTrip.ms,
    roundTripSpreadMs: roundTrip.spread,
    onOnset,
    onBatch,
  };
}
