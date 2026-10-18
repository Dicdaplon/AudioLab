/**
 * Live onset analysis: the Web Audio glue around the pure `OnsetPipeline`.
 *
 *   source ─► startSampleCapture (worklet, frame-tagged batches)
 *                 ├─► OnsetPipeline.push(samples, startFrame) ─► onsets
 *                 ├─► AudioClockSync.observeBatch(…)           ─► clock map,
 *                 │                                               delivery stats
 *                 └─► options.onSamples (share the capture, e.g. a PitchTracker)
 *
 * The loop renders nothing. Read the state with `latest()` at your own
 * pace, or `subscribe()` to every accepted onset. Onsets are timestamped
 * in AudioContext seconds (`time`, sample-exact on the worklet path) and,
 * once the clock map exists, in `performance.now()` milliseconds
 * (`perfTimeMs`) for a game drawn with requestAnimationFrame. Neither
 * includes the input latency: apply a `TimingBudget` when scoring.
 *
 * The default batch is 512 samples (≈ 11 ms at 48 kHz) rather than the
 * capture's 2048: timestamps do not depend on it, but onsets reach the page
 * up to 32 ms sooner, which a player feels.
 *
 * `stop()` disconnects the capture; the AudioContext and the source belong
 * to the caller and are never touched.
 */

import { StreamHistory } from "../analysis/onset/afterOnset";
import { OnsetPipeline, type OnsetPipelineOptions } from "../analysis/onset/onsetPipeline";
import type { OnsetEvent } from "../analysis/onset/onsetDetector";
import type { NoiseGateState } from "../analysis/gate/noiseGate";
import { AudioClockSync, type ClockSyncStats } from "../timing/clockSync";
import type { TimingBudgetInput } from "../timing/timingBudget";
import type { MicSource } from "./micStream";
import {
  startSampleCapture,
  type CaptureMethod,
  type SampleBatchInfo,
  type SampleCapture,
  type SampleListener,
} from "./sampleCapture";

export interface TimedOnset extends OnsetEvent {
  /** `time` on the performance.now() clock, in ms; null before the clock map exists. */
  perfTimeMs: number | null;
}

export interface OnsetAnalysisSnapshot {
  /** Gate after the last batch (floor, thresholds, open, noisy). */
  gate: NoiseGateState;
  /** Last accepted onsets, oldest first. */
  recentOnsets: readonly TimedOnset[];
  /** Clock map and capture delivery statistics. */
  clock: ClockSyncStats;
  /** AudioContext time up to which every onset is known, in s (for `TimingScorer.advance`). */
  analysedTime: number;
  /** Delay between an attack and its report by the detector, in ms. */
  decisionLatencyMs: number;
  /** False on the analyser fallback: frames are estimated, not exact. */
  exactTiming: boolean;
  /** Onsets accepted, candidates rejected by the gate margin. */
  counts: { accepted: number; rejected: number };
}

export type OnsetListener = (onset: TimedOnset) => void;

/**
 * A captured batch, with the AudioContext time up to which every onset is
 * known once this batch is analysed (see `OnsetAnalysisSnapshot.analysedTime`).
 */
export type AnalysedBatchListener = (
  samples: Float32Array,
  info: SampleBatchInfo,
  analysedTime: number,
) => void;

/** After each captured batch, once its onsets were delivered to `subscribe`. */
export type BatchListener = (history: StreamHistory | null, analysedTime: number) => void;

export interface OnsetAnalysis {
  readonly method: CaptureMethod;
  readonly pipeline: OnsetPipeline;
  readonly clock: AudioClockSync;
  readonly sampleRate: number;
  /**
   * The last `historySeconds` of samples, by stream frame, or null without
   * that option. Pushed before the batch's onsets are delivered.
   */
  readonly history: StreamHistory | null;
  latest(): OnsetAnalysisSnapshot;
  /** Called for every accepted onset; returns an unsubscribe function. */
  subscribe(listener: OnsetListener): () => void;
  /**
   * Called after every batch, once its onsets were delivered, with the time
   * up to which every onset is known (`attachPlayAlong` runs on it).
   */
  subscribeBatch(listener: BatchListener): () => void;
  /** Disconnect the capture. Idempotent. */
  stop(): void;
}

export interface OnsetAnalysisOptions {
  /** Pipeline settings (detector, gate, onset margin). */
  pipeline?: Omit<OnsetPipelineOptions, "sampleRate">;
  /** Worklet batch size, in samples. Default 512. */
  batchSize?: number;
  /** Onsets kept in `recentOnsets`. Default 32. */
  recentOnsets?: number;
  /** Also receive every captured batch (to run another analysis on the same capture). */
  onSamples?: AnalysedBatchListener;
  /** Try the AudioWorklet first. Default true. */
  preferWorklet?: boolean;
  /**
   * Keep this many seconds of samples in `history` (for the click echo check
   * and the note / chord labels of a play-along). Default 0: no history.
   * 3 s is plenty.
   */
  historySeconds?: number;
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : 0;
}

function hasSignal(samples: Float32Array): boolean {
  for (let i = 0; i < samples.length; i++) if (samples[i] !== 0) return true;
  return false;
}

export async function startOnsetAnalysis(
  context: AudioContext,
  source: AudioNode,
  options: OnsetAnalysisOptions = {},
): Promise<OnsetAnalysis> {
  const pipeline = new OnsetPipeline({ ...options.pipeline, sampleRate: context.sampleRate });
  const clock = new AudioClockSync();
  const keep = Math.max(1, options.recentOnsets ?? 32);
  const listeners = new Set<OnsetListener>();
  const batchListeners = new Set<BatchListener>();
  const historySeconds = options.historySeconds ?? 0;
  const history =
    historySeconds > 0 ? new StreamHistory(Math.round(historySeconds * context.sampleRate)) : null;
  let recent: TimedOnset[] = [];
  let analysedTime = 0;
  let exactTiming = true;
  let stopped = false;
  const decisionLatencyMs = pipeline.detector.decisionLatencySeconds * 1000;

  clock.markStart(nowMs());
  const onBatch: SampleListener = (samples, info) => {
    if (stopped) return;
    history?.push(samples, info.startFrame);
    clock.observeBatch({
      startFrame: info.startFrame,
      length: samples.length,
      sampleRate: info.sampleRate,
      receivedAtMs: info.receivedAtMs,
      hasSignal: hasSignal(samples),
    });
    exactTiming = info.exact;
    const { onsets } = pipeline.push(samples, info.startFrame);
    analysedTime =
      (info.startFrame + samples.length) / info.sampleRate -
      pipeline.detector.maxDecisionLatencySeconds;
    if (onsets.length > 0) {
      const timed = onsets.map((o) => ({ ...o, perfTimeMs: clock.contextTimeToPerfMs(o.time) }));
      recent = [...recent, ...timed].slice(-keep);
      for (const onset of timed) {
        for (const l of listeners) {
          // A failing listener must not stop the others, or the batch.
          try {
            l(onset);
          } catch (err) {
            console.error(err);
          }
        }
      }
    }
    options.onSamples?.(samples, info, analysedTime);
    for (const l of batchListeners) {
      try {
        l(history, analysedTime);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const capture: SampleCapture = await startSampleCapture(context, source, onBatch, {
    batchSize: options.batchSize ?? 512,
    preferWorklet: options.preferWorklet,
  });

  return {
    method: capture.method,
    pipeline,
    clock,
    sampleRate: context.sampleRate,
    history,
    latest: () => ({
      gate: pipeline.gate.state,
      recentOnsets: recent,
      clock: clock.stats(),
      analysedTime,
      decisionLatencyMs,
      exactTiming,
      counts: pipeline.counts,
    }),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeBatch(listener) {
      batchListeners.add(listener);
      return () => batchListeners.delete(listener);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      listeners.clear();
      batchListeners.clear();
      capture.stop();
    },
  };
}

/**
 * What the microphone session tells the timing budget: the input latency
 * the browser reports (if any), the device label (to spot Bluetooth) and,
 * given the context, its reported output latency (for an audible click).
 */
export function timingInputFromMic(
  mic: Pick<MicSource, "trackSettings" | "stream"> & { context?: BaseAudioContext },
): TimingBudgetInput {
  const settings = mic.trackSettings as MediaTrackSettings & { latency?: number };
  const label = mic.stream.getAudioTracks?.()[0]?.label;
  return {
    reportedInputLatencySeconds:
      typeof settings.latency === "number" ? settings.latency : undefined,
    deviceLabel: label || undefined,
    reportedOutputLatencySeconds: mic.context ? outputLatencySeconds(mic.context) : undefined,
  };
}

/**
 * Output latency the browser reports for a context (`outputLatency` +
 * `baseLatency`), in s, or undefined when it reports none.
 */
export function outputLatencySeconds(context: BaseAudioContext): number | undefined {
  const c = context as BaseAudioContext & { outputLatency?: number; baseLatency?: number };
  const total = (c.outputLatency ?? 0) + (c.baseLatency ?? 0);
  return total > 0 ? total : undefined;
}
