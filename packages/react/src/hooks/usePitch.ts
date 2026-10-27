"use client";

/**
 * Live pitch for a tuner: gapless sample capture → a pitch tracker → a
 * smoothed `PitchEstimate`, published to React a few times per second.
 *
 * The capture (AudioWorklet, AnalyserNode fallback) and the analysis run
 * on every batch; the component only re-renders at `updatesPerSecond`, and
 * only when the estimate changed. Mount the hook where the result is
 * displayed: it stops as soon as the component unmounts or `enabled`
 * turns false.
 *
 * Three estimators (`method`):
 *
 * - "mpm" (default): `PitchTracker`, the McLeod Pitch Method with a median
 *   over 3 frames and note hysteresis.
 * - "pyin": `PyinTracker`, probabilistic YIN with a 50 ms look-ahead
 *   Viterbi: steadier in noise, fewer octave errors, voices more
 *   generously.
 * - "crepe": `CrepeTracker`, the CREPE tiny network (1 MB model fetched
 *   from `crepeModelUrl`, cached per URL) deciding the note, MPM giving the
 *   cents. It runs at most 10 times a second, a few milliseconds each, on
 *   the main thread inside the capture callback: short enough not to need
 *   a worker on a laptop (~5 ms per run, ~5 % of a core). Until the model
 *   is loaded, or if it cannot be (no URL, network error), "mpm" runs.
 */

import { useEffect, useRef, useState } from "react";

import {
  A4_FREQ,
  type CaptureMethod,
  CrepeTracker,
  type CrepeModel,
  loadCrepeModel,
  type MicSource,
  type PitchEstimate,
  PitchTracker,
  type PitchTrackerOptions,
  PyinTracker,
  type SampleCapture,
  startSampleCapture,
} from "@audiolab/core";

export type PitchMethod = "mpm" | "pyin" | "crepe";

export interface UsePitchOptions extends Omit<PitchTrackerOptions, "sampleRate" | "referenceA4"> {
  /** Run the capture and analysis. Default true. */
  enabled?: boolean;
  /** How often the estimate is published to React. Default 20 Hz. */
  updatesPerSecond?: number;
  /** Tuning reference in Hz; changing it does not restart the capture. Default 440. */
  referenceA4?: number;
  /**
   * Pitch estimator. Default "mpm". `peakThreshold`, `clarityThreshold` and
   * `medianFrames` only apply to "mpm"; `windowSize` to "mpm" and "pyin";
   * `hopSize` to all three ("pyin" defaults to 10 ms, "crepe" never runs
   * more often than every 100 ms).
   */
  method?: PitchMethod;
  /** URL of the converted CREPE model (`crepe-tiny.bin`), required by "crepe". */
  crepeModelUrl?: string;
}

export interface PitchState {
  /** Latest smoothed estimate, or null while idle, on silence or on noise. */
  estimate: PitchEstimate | null;
  /** How samples are captured, once the capture has started. */
  captureMethod: CaptureMethod | null;
}

const IDLE: PitchState = { estimate: null, captureMethod: null };

/** What the hook needs from a tracker. */
interface LiveTracker {
  readonly estimate: PitchEstimate | null;
  push(samples: ArrayLike<number>): void;
  setReferenceA4(hz: number): void;
}

/** One fetch per model URL for the page's lifetime; a failed load is retried next time. */
const crepeModels = new Map<string, Promise<CrepeModel>>();

function crepeModel(url: string): Promise<CrepeModel> {
  const cached = crepeModels.get(url);
  if (cached) return cached;
  const model = loadCrepeModel(url);
  crepeModels.set(url, model);
  model.catch(() => crepeModels.delete(url));
  return model;
}

/** Identity of an estimate for change detection (midi follows from frequency and cents). */
function estimateKey(e: PitchEstimate | null): string {
  return e === null ? "" : `${e.frequency}|${e.cents}|${e.clarity}`;
}

export function usePitch(mic: MicSource | null, options: UsePitchOptions = {}): PitchState {
  const {
    enabled = true,
    updatesPerSecond = 20,
    referenceA4 = A4_FREQ,
    method = "mpm",
    crepeModelUrl,
    windowSize,
    hopSize,
    medianFrames,
    hysteresisCents,
    minFrequency,
    maxFrequency,
    peakThreshold,
    clarityThreshold,
    silenceRms,
  } = options;

  const [state, setState] = useState<PitchState>(IDLE);
  const trackerRef = useRef<LiveTracker | null>(null);
  const referenceRef = useRef(referenceA4);
  referenceRef.current = referenceA4;

  useEffect(() => {
    if (!mic || !enabled) {
      trackerRef.current = null;
      setState(IDLE);
      return;
    }

    const sampleRate = mic.context.sampleRate;
    const common = { sampleRate, hysteresisCents, minFrequency, maxFrequency, silenceRms };
    let tracker: LiveTracker =
      method === "pyin"
        ? new PyinTracker({ ...common, referenceA4: referenceRef.current, windowSize, hopSize })
        : new PitchTracker({
            ...common,
            referenceA4: referenceRef.current,
            windowSize,
            hopSize,
            medianFrames,
            peakThreshold,
            clarityThreshold,
          });
    trackerRef.current = tracker;

    let cancelled = false;
    if (method === "crepe" && crepeModelUrl) {
      crepeModel(crepeModelUrl)
        .then((model) => {
          if (cancelled) return;
          tracker = new CrepeTracker(model, {
            ...common,
            referenceA4: referenceRef.current,
            hopSize: Math.max(hopSize ?? 0, Math.round(sampleRate / 10)),
          });
          trackerRef.current = tracker;
        })
        .catch((error: unknown) => {
          console.warn("usePitch: CREPE model unavailable, staying on MPM", error);
        });
    }

    let capture: SampleCapture | null = null;
    void startSampleCapture(mic.context, mic.source, (samples) => tracker.push(samples))
      .then((c) => {
        if (cancelled) {
          c.stop();
          return;
        }
        capture = c;
        setState({ estimate: tracker.estimate, captureMethod: c.method });
      })
      .catch(() => {
        // Capture could not start (context closed meanwhile): stay idle.
      });

    const timer = setInterval(() => {
      if (!capture) return;
      const captureMethod = capture.method;
      const estimate = tracker.estimate;
      setState((prev) =>
        estimateKey(prev.estimate) === estimateKey(estimate) && prev.captureMethod === captureMethod
          ? prev
          : { estimate, captureMethod },
      );
    }, 1000 / updatesPerSecond);

    return () => {
      cancelled = true;
      clearInterval(timer);
      capture?.stop();
      if (trackerRef.current === tracker) trackerRef.current = null;
    };
  }, [
    mic,
    enabled,
    updatesPerSecond,
    method,
    crepeModelUrl,
    windowSize,
    hopSize,
    medianFrames,
    hysteresisCents,
    minFrequency,
    maxFrequency,
    peakThreshold,
    clarityThreshold,
    silenceRms,
  ]);

  useEffect(() => {
    trackerRef.current?.setReferenceA4(referenceA4);
  }, [referenceA4]);

  return state;
}
