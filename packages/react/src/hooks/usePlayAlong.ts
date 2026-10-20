"use client";

/**
 * A play-along exercise for React: `attachPlayAlong` (from
 * `@audiolab/core/rhythm`) behind React state. One run at a time, its
 * results as state, its end detected, and the speaker → microphone round
 * trip measured from the metronome's echoes (kept across runs).
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
 * Without React, use `attachPlayAlong` on `startOnsetAnalysis` directly.
 */

import { useCallback, useRef, useState } from "react";

import { ClickEchoFilter, StreamHistory } from "@audiolab/core";
import {
  attachPlayAlong,
  type ExpectedNote,
  type NoteResult,
  type PlayAlongOnset,
  type PlayAlongOptions,
  type PlayAlongRun,
  type PlayAlongSource,
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
  /** Sounds outside every note's window in the current run (they cost points). */
  strays: number;
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
/** Stands for the history until the first batch brings the real one. */
const NO_HISTORY_YET = new StreamHistory(1);

/** A `PlayAlongSource` fed by the hook's onOnset / onBatch callbacks. */
function createSource(sampleRate: () => number) {
  const onsetListeners = new Set<(onset: PlayAlongOnset) => void>();
  const batchListeners = new Set<(history: StreamHistory | null, analysedTime: number) => void>();
  let last: StreamHistory | null = null;
  const source: PlayAlongSource = {
    get sampleRate() {
      return sampleRate();
    },
    get history() {
      return last ?? NO_HISTORY_YET;
    },
    subscribe(l) {
      onsetListeners.add(l);
      return () => onsetListeners.delete(l);
    },
    subscribeBatch(l) {
      batchListeners.add(l);
      return () => batchListeners.delete(l);
    },
  };
  return {
    source,
    onset(o: PlayAlongOnset) {
      for (const l of onsetListeners) l(o);
    },
    batch(h: StreamHistory, t: number) {
      last = h;
      for (const l of batchListeners) l(h, t);
    },
  };
}

export function usePlayAlong(): PlayAlongControls {
  const runRef = useRef<PlayAlongRun | null>(null);
  const echoRef = useRef<ClickEchoFilter | null>(null);
  echoRef.current ??= new ClickEchoFilter();
  const sampleRateRef = useRef(48000);
  const feedRef = useRef<ReturnType<typeof createSource> | null>(null);
  feedRef.current ??= createSource(() => sampleRateRef.current);
  const [results, setResults] = useState<readonly NoteResult[] | null>(null);
  const [done, setDone] = useState(false);
  const [strays, setStrays] = useState(0);
  const [active, setActive] = useState(false);
  const [roundTrip, setRoundTrip] = useState<{ ms: number | null; spread: number }>({
    ms: null,
    spread: 0,
  });

  const start = useCallback(
    (notes: readonly ExpectedNote[], options: PlayAlongStartOptions, endTime: number) => {
      runRef.current?.stop();
      const { clickTimes, clickBand, sampleRate, ...rest } = options;
      sampleRateRef.current = sampleRate;
      const run = attachPlayAlong(feedRef.current!.source, notes, {
        ...rest,
        endTime,
        clicks: clickTimes
          ? { times: clickTimes, filter: echoRef.current!, band: clickBand }
          : undefined,
      });
      runRef.current = run;
      run.subscribe((event) => {
        if (runRef.current !== run) return;
        if (event.type === "results") {
          setResults([...run.results]);
          setStrays(run.strays);
        }
        if (event.type === "roundTrip") setRoundTrip({ ms: event.ms, spread: event.spreadMs });
        if (event.type === "done") {
          setResults([...event.results]);
          setStrays(run.strays);
          setDone(true);
          setActive(false);
        }
      });
      setResults(run.results);
      setStrays(0);
      setDone(false);
      setActive(true);
    },
    [],
  );

  const stop = useCallback(() => {
    runRef.current?.finish();
  }, []);

  const onOnset = useCallback((onset: PlayAlongOnset) => feedRef.current!.onset(onset), []);
  const onBatch = useCallback(
    (history: StreamHistory, analysedTime: number) => feedRef.current!.batch(history, analysedTime),
    [],
  );
  const onsets = useCallback(() => runRef.current?.onsets ?? NO_ONSETS, []);

  return {
    start,
    stop,
    results,
    strays,
    done,
    active,
    onsets,
    roundTripMs: roundTrip.ms,
    roundTripSpreadMs: roundTrip.spread,
    onOnset,
    onBatch,
  };
}
