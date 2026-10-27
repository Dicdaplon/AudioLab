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
 *   is loaded, or if it cannot be (no URL, network error), "mpm" runs:
 *   `activeMethod` says which one is running, `modelError` why CREPE is not.
 *
 * The trackers come from `createPitchTracker` and the model from
 * `loadCrepeModelCached` (@audiolab/core), usable without React.
 */

import { useEffect, useRef, useState } from "react";

import {
  A4_FREQ,
  type CaptureMethod,
  createPitchTracker,
  type LivePitchTracker,
  loadCrepeModelCached,
  type MicSource,
  type PitchEstimate,
  type PitchMethod,
  type PitchTrackerOptions,
  type SampleCapture,
  startSampleCapture,
} from "@audiolab/core";

/** The estimators of `method` (defined in @audiolab/core, re-exported here). */
export type { PitchMethod } from "@audiolab/core";

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
  /**
   * The estimator running: `method`, except "crepe", which runs "mpm" until
   * its model is loaded, and for good if it cannot be (see `modelError`).
   */
  activeMethod: PitchMethod;
  /** Why the CREPE model is not running ("crepe" only): no URL, or the load failed. */
  modelError: Error | null;
}

/** `modelError` of "crepe" without `crepeModelUrl` (one instance, so states compare equal). */
const NO_CREPE_URL = new Error('usePitch: method "crepe" needs crepeModelUrl, running MPM');

/** The state before any estimate: "crepe" starts on "mpm". */
function idle(method: PitchMethod, modelError: Error | null = null): PitchState {
  return {
    estimate: null,
    captureMethod: null,
    activeMethod: method === "crepe" ? "mpm" : method,
    modelError,
  };
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

  const [state, setState] = useState<PitchState>(() => idle(method));
  const trackerRef = useRef<LivePitchTracker | null>(null);
  const referenceRef = useRef(referenceA4);
  referenceRef.current = referenceA4;

  useEffect(() => {
    const noUrl = method === "crepe" && !crepeModelUrl ? NO_CREPE_URL : null;
    if (!mic || !enabled) {
      trackerRef.current = null;
      setState(idle(method, noUrl));
      return;
    }

    const options: PitchTrackerOptions = {
      sampleRate: mic.context.sampleRate,
      referenceA4: referenceRef.current,
      windowSize,
      hopSize,
      medianFrames,
      hysteresisCents,
      minFrequency,
      maxFrequency,
      peakThreshold,
      clarityThreshold,
      silenceRms,
    };
    // "crepe" starts on the MPM tracker (no model yet).
    let tracker = createPitchTracker(method, options);
    let activeMethod: PitchMethod = method === "crepe" ? "mpm" : method;
    let modelError = noUrl;
    trackerRef.current = tracker;
    setState((prev) =>
      prev.activeMethod === activeMethod && prev.modelError === modelError
        ? prev
        : { ...prev, activeMethod, modelError },
    );

    let cancelled = false;
    if (method === "crepe" && crepeModelUrl) {
      loadCrepeModelCached(crepeModelUrl)
        .then((model) => {
          if (cancelled) return;
          tracker = createPitchTracker(
            "crepe",
            { ...options, referenceA4: referenceRef.current },
            model,
          );
          trackerRef.current = tracker;
          activeMethod = "crepe";
          setState((prev) => ({ ...prev, activeMethod }));
        })
        .catch((error: unknown) => {
          console.warn("usePitch: CREPE model unavailable, staying on MPM", error);
          if (cancelled) return;
          modelError = error instanceof Error ? error : new Error(String(error));
          setState((prev) => ({ ...prev, modelError }));
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
        setState({ estimate: tracker.estimate, captureMethod: c.method, activeMethod, modelError });
      })
      .catch(() => {
        // Capture could not start (context closed meanwhile): stay idle.
      });

    const timer = setInterval(() => {
      if (!capture) return;
      const captureMethod = capture.method;
      const estimate = tracker.estimate;
      setState((prev) =>
        estimateKey(prev.estimate) === estimateKey(estimate) &&
        prev.captureMethod === captureMethod &&
        prev.activeMethod === activeMethod &&
        prev.modelError === modelError
          ? prev
          : { estimate, captureMethod, activeMethod, modelError },
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
