/**
 * The SDK as it is: the reference every POC method is compared with.
 */
import { GAUSSIAN_LOG_CHROMA } from "../../src/analysis/chroma";
import { TempoAnalyzer } from "../../src/analysis/engine/tempoAnalyzer";
import type { TonalityEngineConfig } from "../../src/analysis/engine/tonalityEngine";
import { OnsetPipeline } from "../../src/analysis/onset/onsetPipeline";
import { detectPitch } from "../../src/analysis/pitch";
import { analyzeOverall, computeChromaSequence } from "../../src/offline/offlinePipeline";
import { pushChunks } from "../../tests/helpers/onsets";
import { runFrames } from "../../tests/helpers/progressions";
import { analyserFrames } from "../../tests/helpers/synth";
import type { ChordMethod, KeyMethod, OnsetMethod, PitchMethod, TempoMethod } from "../evaluate";

export const sdkOnsets =
  (strictness = 0.5): OnsetMethod =>
  (x, sr) => {
    const p = new OnsetPipeline({ sampleRate: sr, strictness });
    return pushChunks(x, (chunk, frame) => p.push(chunk, frame).onsets, [512]).map((o) => o.time);
  };

/** Readings once a second from 8 s on, of any analyzer exposing push + read. */
export function readEverySecond(
  x: Float32Array,
  sr: number,
  push: (chunk: Float32Array) => void,
  read: () => number,
): number[] {
  const reads: number[] = [];
  let next = 8;
  for (let i = 0; i < x.length; i += 512) {
    push(x.subarray(i, Math.min(x.length, i + 512)));
    if (Math.min(x.length, i + 512) / sr >= next) {
      reads.push(read());
      next += 1;
    }
  }
  return reads;
}

export const sdkTempo: TempoMethod = (x, sr) => {
  const a = new TempoAnalyzer({ sampleRate: sr });
  return readEverySecond(
    x,
    sr,
    (c) => a.pushSamples(c),
    () => a.analyze().estimate?.bpm ?? NaN,
  );
};

export const sdkChords =
  (cfg: Partial<TonalityEngineConfig> = {}): ChordMethod =>
  (x, sr) => {
    const fft = sr >= 32_000 ? 16_384 : 4096;
    return runFrames(analyserFrames(x, fft, Math.round(sr / 10)), cfg, {
      sampleRate: sr,
      fftSize: fft,
      fps: 10,
    }).map((o) => ({
      time: o.time,
      chord: o.chord,
    }));
  };

export const sdkKey =
  (gaussian = false): KeyMethod =>
  (x, sr) => {
    const audio = { samples: x, sampleRate: sr, durationSeconds: x.length / sr };
    const opts = {
      fftSize: 8192,
      hopSize: 2048,
      minFreq: 55,
      maxFreq: 5000,
      ...(gaussian && { chroma: GAUSSIAN_LOG_CHROMA }),
    };
    return analyzeOverall(computeChromaSequence(audio, opts), 0).keys[0] ?? null;
  };

/** Run a frame-wise pitch estimator every 10 ms on a window centred on the frame. */
export function pitchTrack(
  x: Float32Array,
  sr: number,
  windowSize: number,
  estimate: (frame: Float32Array) => number,
): Float32Array {
  const frames = Math.floor(x.length / (sr / 100));
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    const centre = Math.round(i * (sr / 100));
    const start = centre - windowSize / 2;
    if (start < 0 || start + windowSize > x.length) continue;
    out[i] = estimate(x.subarray(start, start + windowSize));
  }
  return out;
}

export const sdkPitch: PitchMethod = (x, sr) =>
  pitchTrack(
    x,
    sr,
    2048,
    (f) => detectPitch(f, sr, { minFrequency: 70, maxFrequency: 1400 })?.frequency ?? 0,
  );

export const BASELINES = {
  onsets: { "SDK OnsetPipeline (normal gate)": sdkOnsets(0.5) },
  tempo: { "SDK TempoAnalyzer": sdkTempo },
  chords: {
    "SDK default (1 s window)": sdkChords(),
    "SDK hmm + gaussian-log": sdkChords({ chordSmoothing: "hmm", chromaMethod: "gaussian-log" }),
  },
  keys: { "SDK energy + Krumhansl": sdkKey(false), "SDK gaussian-log + Krumhansl": sdkKey(true) },
  pitch: { "SDK MPM (detectPitch, 2048)": sdkPitch },
};
