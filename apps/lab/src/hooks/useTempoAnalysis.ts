/**
 * Live tempo analysis: gapless sample capture → `TempoAnalyzer` →
 * envelope spectrum and BPM estimate, refreshed a few times per second.
 *
 * Mount this hook only where the result is displayed (the FFT tab): the
 * capture and the analysis stop as soon as the component unmounts or
 * `enabled` turns false.
 */

import { useEffect, useRef, useState } from "react";

import {
  type CaptureMethod,
  DEFAULT_FFT_SETTINGS,
  type MicSource,
  type SampleCapture,
  startSampleCapture,
  TempoAnalyzer,
  type TempoFrame,
} from "@audiolab/core";

export interface UseTempoAnalysisOptions {
  /** Run the capture and analysis. Default true. */
  enabled?: boolean;
  /** Cutoff of the onset-strength lowpass, in Hz. */
  lowpassCutoffHz?: number;
  /** How often the envelope spectrum is recomputed. Default 5 Hz. */
  updatesPerSecond?: number;
}

export interface TempoAnalysisState {
  /** Latest analysis, or null while idle. */
  frame: TempoFrame | null;
  /** How samples are captured, once the capture has started. */
  captureMethod: CaptureMethod | null;
}

const IDLE: TempoAnalysisState = { frame: null, captureMethod: null };

export function useTempoAnalysis(
  mic: MicSource | null,
  options: UseTempoAnalysisOptions = {},
): TempoAnalysisState {
  const enabled = options.enabled ?? true;
  const lowpassCutoffHz = options.lowpassCutoffHz ?? DEFAULT_FFT_SETTINGS.onsetLowpassHz;
  const updatesPerSecond = options.updatesPerSecond ?? 5;

  const [state, setState] = useState<TempoAnalysisState>(IDLE);
  const analyzerRef = useRef<TempoAnalyzer | null>(null);
  const cutoffRef = useRef(lowpassCutoffHz);
  cutoffRef.current = lowpassCutoffHz;

  useEffect(() => {
    if (!mic || !enabled) {
      analyzerRef.current = null;
      setState(IDLE);
      return;
    }

    const analyzer = new TempoAnalyzer({
      sampleRate: mic.context.sampleRate,
      lowpassCutoffHz: cutoffRef.current,
    });
    analyzerRef.current = analyzer;

    let cancelled = false;
    let capture: SampleCapture | null = null;
    void startSampleCapture(mic.context, mic.source, (samples) => analyzer.pushSamples(samples))
      .then((c) => {
        if (cancelled) {
          c.stop();
          return;
        }
        capture = c;
        setState({ frame: analyzer.analyze(), captureMethod: c.method });
      })
      .catch(() => {
        // Capture could not start (context closed meanwhile): stay idle.
      });

    const timer = setInterval(() => {
      if (!capture) return;
      setState({ frame: analyzer.analyze(), captureMethod: capture.method });
    }, 1000 / updatesPerSecond);

    return () => {
      cancelled = true;
      clearInterval(timer);
      capture?.stop();
      if (analyzerRef.current === analyzer) analyzerRef.current = null;
    };
  }, [mic, enabled, updatesPerSecond]);

  useEffect(() => {
    analyzerRef.current?.setLowpassCutoff(lowpassCutoffHz);
  }, [lowpassCutoffHz]);

  return state;
}
