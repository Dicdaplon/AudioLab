"use client";

/**
 * Latency by ear: a count-in of 4 clicks, then 8 clicks to play on;
 * `measureTapLatency` turns the notes into the delay the player lives with
 * (Bluetooth headphones included, which no web API measures). The test has
 * its own metronome, always audible, and its own play-along run, which tells
 * the click's echoes from the notes when there are no headphones.
 *
 * Feed it the same onsets as the exercise, and give its result to the budget:
 *
 *   const test = useLatencyTest(mic?.context ?? null);
 *   useOnsetAnalysis(mic, {
 *     reference: "audio",
 *     calibration: test.result?.reliable ? test.result : null,
 *     onOnset: (o) => { play.onOnset(o); test.onOnset(o); },
 *     onBatch: (h, t) => { play.onBatch(h, t); test.onBatch(h, t); },
 *   });
 *
 * The result is not stored: keep it per device (e.g. localStorage) and pass
 * the stored one when the test has not run.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type BeatGrid,
  LATENCY_TEST,
  latencyTestClicks,
  measureTapLatency,
  StreamHistory,
  TAP_LATENCY_DEFAULTS,
  type TapLatency,
} from "@audiolab/core";
import type { PlayAlongOnset } from "@audiolab/core/rhythm";

import { useMetronome } from "./useMetronome";
import { usePlayAlong } from "./usePlayAlong";

export interface LatencyTestControls {
  /** Start the test (count-in, then the clicks to play on). */
  start: () => void;
  /** Cancel the test; the last result stays. */
  stop: () => void;
  /** True while the test runs. */
  active: boolean;
  /** Beat grid of the running (or last) test, count-in included, for `BeatLights`. */
  grid: Readonly<BeatGrid> | null;
  /** Notes heard so far in the running test (echoes of the click excluded). */
  taps: number;
  /** Result of the last finished test, or null. */
  result: TapLatency | null;
  /** Give to `useOnsetAnalysis({ onOnset })`. */
  onOnset: (onset: PlayAlongOnset) => void;
  /** Give to `useOnsetAnalysis({ onBatch })`. */
  onBatch: (history: StreamHistory, analysedTime: number) => void;
}

export function useLatencyTest(context: BaseAudioContext | null): LatencyTestControls {
  const play = usePlayAlong();
  const metronome = useMetronome(context);
  const [grid, setGrid] = useState<Readonly<BeatGrid> | null>(null);
  const [result, setResult] = useState<TapLatency | null>(null);
  const clicksRef = useRef<number[] | null>(null);
  const cancelledRef = useRef(false);
  const { start: startRun, stop: stopRun, onsets, done } = play;
  const { start: startMetronome, stop: stopMetronome } = metronome;

  const start = useCallback(() => {
    const m = context
      ? startMetronome({ bpm: LATENCY_TEST.bpm, beatsPerBar: LATENCY_TEST.countIn, sound: true })
      : null;
    if (!context || !m) return;
    const clicks = latencyTestClicks(m.grid);
    clicksRef.current = clicks;
    cancelledRef.current = false;
    setGrid(m.grid);
    // The run only sorts the notes from the click's echoes: no offset, no
    // learnt bias, so its played times are the raw onset times.
    startRun(
      clicks.map((time, id) => ({ id, time })),
      {
        sampleRate: context.sampleRate,
        offsetMs: 0,
        adaptiveBias: false,
        clickTimes: () => m.clickTimes,
      },
      clicks[clicks.length - 1] + TAP_LATENCY_DEFAULTS.maxDelayMs / 1000,
    );
  }, [context, startMetronome, startRun]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    stopRun();
    stopMetronome();
  }, [stopRun, stopMetronome]);

  useEffect(() => {
    if (!done || !clicksRef.current) return;
    stopMetronome();
    const clicks = clicksRef.current;
    clicksRef.current = null;
    if (cancelledRef.current) return;
    const taps = onsets()
      .filter((o) => !o.echo)
      .map((o) => o.time);
    // Nothing heard is a failed test too, not "no test".
    setResult(
      measureTapLatency(clicks, taps) ?? {
        offsetMs: 0,
        spreadMs: 0,
        taps: 0,
        clicks: clicks.length,
        reliable: false,
        delaysMs: [],
      },
    );
  }, [done, onsets, stopMetronome]);

  return {
    start,
    stop,
    active: play.active,
    grid,
    taps: play.active ? onsets().filter((o) => !o.echo).length : 0,
    result,
    onOnset: play.onOnset,
    onBatch: play.onBatch,
  };
}
