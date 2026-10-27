/**
 * The live analysis loop: an AnalyserNode on the given source, polled at
 * the engine's frame rate, each spectrum run through a `TonalityEngine`.
 *
 * The loop renders nothing. Read the last frame with `latest()` at your own
 * pace (a requestAnimationFrame, a game tick) or `subscribe()` to every
 * frame. `stop()` clears the timer and detaches the analyser from the
 * source; the AudioContext and the source belong to the caller and are
 * never touched.
 *
 * The cadence is the engine's `framesPerSecond`, read at start, so the
 * windows (sized in seconds at that rate) and the polling cannot disagree.
 * To change the rate, stop and start again.
 *
 * With `chromaMethod: "cqt"` the engine needs the time signal: a second
 * AnalyserNode (32768 samples, the longest the Web Audio API keeps) is
 * attached on demand, and each frame also reads its time-domain data.
 */

import { createAnalyser, readSpectrumDb } from "./analyser";
import { dbSpectrumToMagnitude } from "../analysis/chroma";
import { ANALYSIS_DEFAULTS } from "../config/settings";
import {
  TonalityEngine,
  type TonalityEngineConfig,
  type TonalityFrame,
} from "../analysis/engine/tonalityEngine";

/** The raw spectrum of a frame. `db` is a reused buffer: copy it to keep it. */
export interface LiveSpectrum {
  db: Float32Array;
  sampleRate: number;
}

export type LiveFrameListener = (frame: TonalityFrame, spectrum: LiveSpectrum) => void;

export interface LiveAnalysisOptions {
  context: AudioContext;
  source: AudioNode;
  /** An engine to drive (kept, with its configuration), or the configuration of a new one. */
  engine?: TonalityEngine | Partial<TonalityEngineConfig>;
  /** Shorthand for the engine's `framesPerSecond`. */
  framesPerSecond?: number;
  /** AnalyserNode FFT size. Default `ANALYSIS_DEFAULTS.fftSize` (16384). */
  fftSize?: number;
}

export interface LiveAnalysis {
  readonly engine: TonalityEngine;
  /** The last frame, or `null` before the first one. */
  latest(): TonalityFrame | null;
  /** Called on every frame; returns the unsubscribe function. */
  subscribe(listener: LiveFrameListener): () => void;
  /** Stops polling and detaches the analyser. Idempotent. */
  stop(): void;
}

export function startLiveAnalysis(options: LiveAnalysisOptions): LiveAnalysis {
  const { context, source, framesPerSecond } = options;
  const engine =
    options.engine instanceof TonalityEngine
      ? options.engine
      : new TonalityEngine({
          ...options.engine,
          ...(framesPerSecond !== undefined && { framesPerSecond }),
        });
  if (options.engine instanceof TonalityEngine && framesPerSecond !== undefined) {
    engine.configure({ framesPerSecond });
  }

  const setup = createAnalyser(context, source, {
    fftSize: options.fftSize ?? ANALYSIS_DEFAULTS.fftSize,
  });
  const listeners = new Set<LiveFrameListener>();
  let last: TonalityFrame | null = null;

  let timeAnalyser: AnalyserNode | null = null;
  let timeBuffer: Float32Array<ArrayBuffer> | null = null;

  const tick = () => {
    const db = readSpectrumDb(setup);
    if (engine.config.chromaMethod === "cqt") {
      if (!timeAnalyser) {
        timeAnalyser = context.createAnalyser();
        timeAnalyser.fftSize = 32768;
        source.connect(timeAnalyser);
        timeBuffer = new Float32Array(timeAnalyser.fftSize);
      }
      timeAnalyser.getFloatTimeDomainData(timeBuffer!);
      const level = engine.signalLevelDb(dbSpectrumToMagnitude(db), setup.sampleRate);
      last = engine.processTimeDomain(timeBuffer!, setup.sampleRate, level);
    } else {
      last = engine.processDbSpectrum(db, setup.sampleRate);
    }
    const spectrum = { db, sampleRate: setup.sampleRate };
    for (const listener of [...listeners]) listener(last, spectrum);
  };
  let timer: ReturnType<typeof setInterval> | null = setInterval(
    tick,
    1000 / engine.config.framesPerSecond,
  );

  return {
    engine,
    latest: () => last,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stop() {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
      listeners.clear();
      try {
        source.disconnect(setup.analyser);
      } catch {
        // Already disconnected (or the source was torn down by its owner).
      }
      setup.analyser.disconnect();
      if (timeAnalyser) {
        try {
          source.disconnect(timeAnalyser);
        } catch {
          // Already disconnected.
        }
        timeAnalyser = null;
      }
    },
  };
}
