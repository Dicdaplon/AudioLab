"use client";

/**
 * Live chords from a note model ("AI listening", Basic Pitch): gapless
 * sample capture → `NoteModelChords` (resampling to 22050 Hz, the latest
 * 2 s handed to the model, chord HMM on its note posteriors).
 *
 * The SDK ships no neural runtime: pass a `NoteModelRunner` (the lab builds
 * one on onnxruntime-web, in a worker). While `runner` is null the hook
 * stays idle, so the model can load lazily. The model runs every
 * `intervalMs` (default 250 ms), never twice at once: a slow device simply
 * runs it less often. Results lag the audio by the 174 ms the model needs
 * after a frame, plus up to one interval, plus the inference time.
 */

import { useEffect, useState } from "react";

import {
  type CaptureMethod,
  type ChordScore,
  type MicSource,
  type NoteChordOptions,
  type NoteChordResult,
  NoteModelChords,
  type NoteModelRunner,
  type SampleCapture,
  startSampleCapture,
} from "@audiolab/core";

export interface UseNoteModelChordsOptions extends NoteChordOptions {
  /** The model. Null keeps the hook idle (e.g. while it loads). */
  runner: NoteModelRunner | null;
  /** Run the capture and the model. Default true. */
  enabled?: boolean;
  /** Time between model runs, ms. Default 250. */
  intervalMs?: number;
}

export interface NoteModelChordsState {
  /** The chord heard, or null (silence, or before the first result). */
  chord: ChordScore | null;
  /** The 24 triads ranked by the HMM posterior (empty before the first result). */
  chords: ChordScore[];
  /** MIDI notes the model hears (posterior ≥ the note threshold). */
  notes: number[];
  /** The full latest result (stream times, "no chord" posterior). */
  result: NoteChordResult | null;
  /** True once the model has answered at least once. */
  ready: boolean;
  /** The runner's failure, if any; the hook stops running the model then. */
  error: Error | null;
  /** Duration of the last model run, ms (worker round trip included). */
  inferenceMs: number | null;
  /** How samples are captured, once the capture has started. */
  captureMethod: CaptureMethod | null;
}

const IDLE: NoteModelChordsState = {
  chord: null,
  chords: [],
  notes: [],
  result: null,
  ready: false,
  error: null,
  inferenceMs: null,
  captureMethod: null,
};

export function useNoteModelChords(
  mic: MicSource | null,
  options: UseNoteModelChordsOptions,
): NoteModelChordsState {
  const {
    runner,
    enabled = true,
    intervalMs = 250,
    lambdaBass,
    meanChordSeconds,
    emissionExponent,
    temperature,
    noteThreshold,
    trebleMinMidi,
    bassRange,
  } = options;
  const bassLo = bassRange?.[0];
  const bassHi = bassRange?.[1];
  const [state, setState] = useState<NoteModelChordsState>(IDLE);

  useEffect(() => {
    if (!mic || !enabled || !runner) {
      setState(IDLE);
      return;
    }
    const engine = new NoteModelChords({
      sampleRate: mic.context.sampleRate,
      lambdaBass,
      meanChordSeconds,
      emissionExponent,
      temperature,
      noteThreshold,
      trebleMinMidi,
      bassRange: bassLo !== undefined && bassHi !== undefined ? [bassLo, bassHi] : undefined,
    });
    let cancelled = false;
    let busy = false;
    let capture: SampleCapture | null = null;
    let inferenceMs: number | null = null;
    const timed: NoteModelRunner = {
      async run(window) {
        const t0 = performance.now();
        const out = await runner.run(window);
        inferenceMs = performance.now() - t0;
        return out;
      },
    };

    void startSampleCapture(mic.context, mic.source, (samples) => engine.push(samples))
      .then((c) => {
        if (cancelled) {
          c.stop();
          return;
        }
        capture = c;
        setState({ ...IDLE, captureMethod: c.method });
      })
      .catch(() => {
        // Capture could not start (context closed meanwhile): stay idle.
      });

    const tick = () => {
      if (!capture || busy) return;
      const method = capture.method;
      const before = engine.latest;
      busy = true;
      engine
        .analyse(timed)
        .then((result) => {
          // Same object: no new audio, or no step reliable yet.
          if (cancelled || !result || result === before) return;
          setState({
            chord: result.chord,
            chords: result.chords,
            notes: result.notes,
            result,
            ready: true,
            error: null,
            inferenceMs,
            captureMethod: method,
          });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          clearInterval(timer);
          const error = err instanceof Error ? err : new Error(String(err));
          setState((prev) => ({ ...prev, error }));
        })
        .finally(() => {
          busy = false;
        });
    };
    const timer = setInterval(tick, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
      capture?.stop();
    };
  }, [
    mic,
    enabled,
    runner,
    intervalMs,
    lambdaBass,
    meanChordSeconds,
    emissionExponent,
    temperature,
    noteThreshold,
    trebleMinMidi,
    bassLo,
    bassHi,
  ]);

  return state;
}
