/**
 * Shared loader for the real-audio regression suite. Each fixture is decoded
 * and turned into a chroma sequence once per worker, whatever the number of
 * assertions made on it.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { expect, vi } from "vitest";

import {
  analyzeOverall,
  computeChromaSequence,
  runPresenceTonality,
  slidingChordHistogram,
  type SlidingChordHistogram,
} from "../../src/analysis/offline/offlinePipeline";
import { decodeAudioFile } from "../../src/analysis/offline/decodeAudio";
import type { KeyScore } from "../../src/analysis/keyDetection";

export const SAMPLES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "Sample");

/** Offline front-end: 8192-point Hann FFT, hop 2048 (~21.5 fps at 44.1 kHz). */
export const FRAME_OPTIONS = {
  fftSize: 8192,
  hopSize: 2048,
  minFreq: 55,
  maxFreq: 5000,
} as const;

/** Sweep-tuned defaults of the presence pipeline (see `npm run sweep`). */
export const PRESENCE_OPTIONS = {
  liveAcquisitionSeconds: 8,
  tonalityAcquisitionSeconds: 30,
  filter: { tolerancy: 0.35, memory: 3, mode: "mean" as const },
};

/** Sliding chord histogram: 1 s windows every 0.25 s. */
export const CHORD_WINDOW_SEC = 1.0;
export const CHORD_STRIDE_SEC = 0.25;

/**
 * Allowed slack on key ranks: each case records the rank the pipeline
 * reaches today and may lose at most this many places.
 */
export const RANK_SLACK = 1;

/** Allowed drop (absolute fraction of windows) in chord-histogram coverage. */
export const COVERAGE_SLACK = 0.05;

export interface Fixture {
  chromas: Float32Array[];
  sampleRate: number;
  framesPerSecond: number;
  durationSeconds: number;
}

const cache = new Map<string, Promise<Fixture>>();

async function load(relPath: string): Promise<Fixture> {
  // mpg123-decoder logs a harmless MPG123_ERR on trailing junk in some MP3s;
  // keep it out of the test output but let any other error through.
  const original = console.error;
  const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("mpg123-decoder:")) return;
    original(...args);
  });
  try {
    const audio = await decodeAudioFile(path.join(SAMPLES_DIR, relPath));
    return {
      chromas: computeChromaSequence(audio, FRAME_OPTIONS),
      sampleRate: audio.sampleRate,
      framesPerSecond: audio.sampleRate / FRAME_OPTIONS.hopSize,
      durationSeconds: audio.durationSeconds,
    };
  } finally {
    spy.mockRestore();
  }
}

/** Decode + chroma, memoised per relative path. */
export function fixture(relPath: string): Promise<Fixture> {
  let p = cache.get(relPath);
  if (!p) {
    p = load(relPath);
    cache.set(relPath, p);
  }
  return p;
}

/** Energy pipeline: whole-file chroma (head/tail trimmed) → Krumhansl-Schmuckler. */
export async function energyKeys(relPath: string, trimRatio: number): Promise<KeyScore[]> {
  const { chromas } = await fixture(relPath);
  return analyzeOverall(chromas, trimRatio).keys;
}

/** Presence pipeline: chromas replayed through the live TonalityEngine. */
export async function presenceKeys(relPath: string): Promise<KeyScore[]> {
  const { chromas, framesPerSecond } = await fixture(relPath);
  return runPresenceTonality(chromas, { ...PRESENCE_OPTIONS, framesPerSecond }).keys;
}

export async function chordHistogram(relPath: string): Promise<SlidingChordHistogram> {
  const { chromas, framesPerSecond } = await fixture(relPath);
  const windowFrames = Math.max(1, Math.round(CHORD_WINDOW_SEC * framesPerSecond));
  const strideFrames = Math.max(1, Math.round(CHORD_STRIDE_SEC * framesPerSecond));
  return slidingChordHistogram(chromas, windowFrames, strideFrames);
}

/** 1-based rank of the best accepted key (Infinity if none is ranked). */
export function bestRank(keys: KeyScore[], accepted: readonly string[]): number {
  const i = keys.findIndex((k) => accepted.includes(k.shortName));
  return i < 0 ? Infinity : i + 1;
}

export function describeKeys(keys: KeyScore[], n = 5): string {
  return keys
    .slice(0, n)
    .map((k) => `${k.shortName}(${(k.probability * 100).toFixed(1)}%)`)
    .join(", ");
}

/** Assert the best accepted key ranks no worse than `measured + RANK_SLACK`. */
export function expectKeyRank(
  label: string,
  keys: KeyScore[],
  accepted: readonly string[],
  measured: number,
): number {
  const rank = bestRank(keys, accepted);
  const limit = measured + RANK_SLACK;
  expect(
    rank,
    `${label}: {${accepted.join(", ")}} ranked ${rank}, limit ${limit} (measured ${measured}). ` +
      `Ranking: [${describeKeys(keys)}]`,
  ).toBeLessThanOrEqual(limit);
  return rank;
}

/** Mean reciprocal rank of a list of 1-based ranks. */
export function meanReciprocalRank(ranks: number[]): number {
  return ranks.reduce((s, r) => s + 1 / r, 0) / ranks.length;
}

/**
 * Assert that the N most frequent top-1 chords are exactly the N expected
 * ones, and that together they still win at least `measuredCoverage −
 * COVERAGE_SLACK` of the windows.
 */
export function expectChordGrid(
  label: string,
  hist: SlidingChordHistogram,
  expected: readonly string[],
  measuredCoverage: number,
): void {
  const n = expected.length;
  const summary = hist.entries
    .slice(0, n + 2)
    .map((e) => `${e.name}(${(e.fraction * 100).toFixed(1)}%)`)
    .join(", ");
  expect(hist.totalWindows, `${label}: windows`).toBeGreaterThan(10);
  expect(
    hist.entries
      .slice(0, n)
      .map((e) => e.name)
      .sort(),
    `${label}: top ${n} of the histogram. Got [${summary}]`,
  ).toEqual([...expected].sort());
  const coverage = hist.entries
    .filter((e) => expected.includes(e.name))
    .reduce((s, e) => s + e.fraction, 0);
  expect(
    coverage,
    `${label}: {${expected.join(", ")}} win ${(coverage * 100).toFixed(1)}% of windows ` +
      `(measured ${(measuredCoverage * 100).toFixed(1)}%). Got [${summary}]`,
  ).toBeGreaterThanOrEqual(measuredCoverage - COVERAGE_SLACK);
}
