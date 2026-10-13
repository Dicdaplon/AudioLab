"use client";

/**
 * Live pitch for a tuner: gapless sample capture → `PitchTracker` → a
 * smoothed `PitchEstimate`, published to React a few times per second.
 *
 * The capture (AudioWorklet, AnalyserNode fallback) and the analysis run
 * on every batch; the component only re-renders at `updatesPerSecond`, and
 * only when the estimate changed. Mount the hook where the result is
 * displayed: it stops as soon as the component unmounts or `enabled`
 * turns false.
 */

import { useEffect, useRef, useState } from "react";

import {
  A4_FREQ,
  type CaptureMethod,
  type MicSource,
  type PitchEstimate,
  PitchTracker,
  type PitchTrackerOptions,
  type SampleCapture,
  startSampleCapture,
} from "@audiolab/core";

export interface UsePitchOptions extends Omit<PitchTrackerOptions, "sampleRate" | "referenceA4"> {
  /** Run the capture and analysis. Default true. */
  enabled?: boolean;
  /** How often the estimate is published to React. Default 20 Hz. */
  updatesPerSecond?: number;
  /** Tuning reference in Hz; changing it does not restart the capture. Default 440. */
  referenceA4?: number;
}

export interface PitchState {
  /** Latest smoothed estimate, or null while idle, on silence or on noise. */
  estimate: PitchEstimate | null;
  /** How samples are captured, once the capture has started. */
  captureMethod: CaptureMethod | null;
}

const IDLE: PitchState = { estimate: null, captureMethod: null };

/** Identity of an estimate for change detection (midi follows from frequency and cents). */
function estimateKey(e: PitchEstimate | null): string {
  return e === null ? "" : `${e.frequency}|${e.cents}|${e.clarity}`;
}

export function usePitch(mic: MicSource | null, options: UsePitchOptions = {}): PitchState {
  const {
    enabled = true,
    updatesPerSecond = 20,
    referenceA4 = A4_FREQ,
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
  const trackerRef = useRef<PitchTracker | null>(null);
  const referenceRef = useRef(referenceA4);
  referenceRef.current = referenceA4;

  useEffect(() => {
    if (!mic || !enabled) {
      trackerRef.current = null;
      setState(IDLE);
      return;
    }

    const tracker = new PitchTracker({
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
    });
    trackerRef.current = tracker;

    let cancelled = false;
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
      const method = capture.method;
      setState((prev) =>
        estimateKey(prev.estimate) === estimateKey(tracker.estimate) &&
        prev.captureMethod === method
          ? prev
          : { estimate: tracker.estimate, captureMethod: method },
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
