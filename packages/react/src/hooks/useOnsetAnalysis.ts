"use client";

/**
 * Live onsets for rhythm exercises: `startOnsetAnalysis` (frame-tagged
 * capture → onset detector → adaptive gate → audio/page clock map), a
 * sample history to check what was played at each onset, and the timing
 * budget of the session.
 *
 * Onsets are delivered to `onOnset` as they are decided (no re-render per
 * onset); the diagnostic snapshot (gate, clock statistics, recent onsets)
 * is published to React `updatesPerSecond` times per second. Mount the hook
 * where it is used: the capture stops when the component unmounts, when
 * `enabled` turns false or when the microphone goes away.
 */

import { useEffect, useRef, useState } from "react";

import {
  type CaptureMethod,
  estimateTimingBudget,
  type MicSource,
  type OnsetAnalysis,
  type OnsetAnalysisOptions,
  type OnsetAnalysisSnapshot,
  startOnsetAnalysis,
  StreamHistory,
  type TimedOnset,
  type TimingBudget,
  timingInputFromMic,
} from "@audiolab/core";

import { useDisplayFramePeriod } from "./useDisplayFramePeriod";

export interface UseOnsetAnalysisOptions {
  /** Run the capture and analysis. Default true. */
  enabled?: boolean;
  /** How often the snapshot is published to React. Default 10 Hz. */
  updatesPerSecond?: number;
  /** Pipeline settings (detector, gate, onset margin), read at start. */
  pipeline?: OnsetAnalysisOptions["pipeline"];
  /** Worklet batch size in samples, read at start. Default 512. */
  batchSize?: number;
  /** Seconds of samples kept for `noteAfterOnset` / `chordAfterOnset`. Default 3. */
  historySeconds?: number;
  /** Called for every accepted onset, with the history holding its samples. */
  onOnset?: (onset: TimedOnset, history: StreamHistory) => void;
  /**
   * Called after every captured batch with the AudioContext time up to
   * which every onset is known (e.g. to advance a scorer, resolve labels).
   */
  onBatch?: (history: StreamHistory, analysedTime: number) => void;
  /** Budget for strummed chords (adds the strum spread). Default false. */
  strummed?: boolean;
}

export interface OnsetAnalysisState {
  /** Latest diagnostic snapshot, or null while idle. */
  snapshot: OnsetAnalysisSnapshot | null;
  /** How samples are captured, once the capture has started. */
  captureMethod: CaptureMethod | null;
  /** Timing budget of the session (latency offset and uncertainty). */
  budget: TimingBudget | null;
  /** The running analysis (subscribe, clock map), or null while idle. */
  analysis: OnsetAnalysis | null;
  /** The sample history, or null while idle. */
  history: StreamHistory | null;
}

const IDLE: OnsetAnalysisState = {
  snapshot: null,
  captureMethod: null,
  budget: null,
  analysis: null,
  history: null,
};

export function useOnsetAnalysis(
  mic: MicSource | null,
  options: UseOnsetAnalysisOptions = {},
): OnsetAnalysisState {
  const { enabled = true, updatesPerSecond = 10, historySeconds = 3, strummed = false } = options;
  const [state, setState] = useState<OnsetAnalysisState>(IDLE);
  const framePeriodMs = useDisplayFramePeriod(enabled && mic !== null);

  // Read at start (pipeline, batch size) or on every call (callbacks).
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const budgetInputRef = useRef({ framePeriodMs, strummed });
  budgetInputRef.current = { framePeriodMs, strummed };

  useEffect(() => {
    if (!mic || !enabled) {
      setState(IDLE);
      return;
    }
    let cancelled = false;
    let analysis: OnsetAnalysis | null = null;
    const history = new StreamHistory(Math.round(historySeconds * mic.context.sampleRate));
    const micInput = timingInputFromMic(mic);

    const budgetOf = (snapshot: OnsetAnalysisSnapshot): TimingBudget => {
      const { framePeriodMs: frame, strummed: strum } = budgetInputRef.current;
      return estimateTimingBudget({
        ...micInput,
        displayFramePeriodMs: frame ?? undefined,
        clockSpreadMs: snapshot.clock.batches > 4 ? snapshot.clock.offsetSpreadMs : undefined,
        strummed: strum,
      });
    };

    void startOnsetAnalysis(mic.context, mic.source, {
      pipeline: optionsRef.current.pipeline,
      batchSize: optionsRef.current.batchSize,
      onSamples: (samples, info) => {
        history.push(samples, info.startFrame);
        if (!analysis) return;
        const analysedTime =
          (info.startFrame + samples.length) / info.sampleRate -
          analysis.pipeline.detector.decisionLatencySeconds;
        optionsRef.current.onBatch?.(history, analysedTime);
      },
    })
      .then((a) => {
        if (cancelled) {
          a.stop();
          return;
        }
        analysis = a;
        a.subscribe((onset) => optionsRef.current.onOnset?.(onset, history));
        const snapshot = a.latest();
        setState({
          snapshot,
          captureMethod: a.method,
          budget: budgetOf(snapshot),
          analysis: a,
          history,
        });
      })
      .catch(() => {
        // Capture could not start (context closed meanwhile): stay idle.
      });

    const timer = setInterval(() => {
      if (!analysis) return;
      const snapshot = analysis.latest();
      const a = analysis;
      setState({
        snapshot,
        captureMethod: a.method,
        budget: budgetOf(snapshot),
        analysis: a,
        history,
      });
    }, 1000 / updatesPerSecond);

    return () => {
      cancelled = true;
      clearInterval(timer);
      analysis?.stop();
    };
  }, [mic, enabled, updatesPerSecond, historySeconds]);

  return state;
}
