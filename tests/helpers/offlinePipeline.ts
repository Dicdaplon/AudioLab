/**
 * Offline analysis pipeline used by sample-based integration tests.
 *
 * Mirrors the live pipeline (mic → spectrum → chroma → window → detect),
 * but uses a Node-side mp3 decoder + pure-JS FFT instead of AnalyserNode.
 * The chroma / windowing / detection modules are imported as-is — so what
 * passes these tests passes the same code that runs in the browser.
 */

import { readFile } from "node:fs/promises";
import decode from "audio-decode";

import { CHROMA_SIZE, spectrumToChroma } from "../../src/analysis/chroma";
import { detectChord, type ChordScore } from "../../src/analysis/chordDetection";
import { detectKey, type KeyScore } from "../../src/analysis/keyDetection";
import { applyHannWindow, fftMagnitude } from "../../src/analysis/fft";
import { ChromaWindow } from "../../src/analysis/windowing";
import {
  HighWaterMarkFilter,
  type HighWaterMarkOptions,
} from "../../src/analysis/highWaterMark";
import { detectKeyFromPresence } from "../../src/analysis/presenceTonality";

export interface DecodedAudio {
  /** Mono Float32 signal (channels averaged). */
  samples: Float32Array;
  sampleRate: number;
  durationSeconds: number;
}

/** Decode an audio file (mp3/wav/flac/ogg) to mono Float32 samples. */
export async function decodeAudioFile(path: string): Promise<DecodedAudio> {
  const buf = await readFile(path);
  // `audio-decode` accepts any ArrayBuffer view; pass a Uint8Array.
  const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const audioBuffer = await decode(u8);
  const length = audioBuffer.length;
  const channels = audioBuffer.numberOfChannels;
  const mono = new Float32Array(length);
  for (let ch = 0; ch < channels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels;
  }
  return {
    samples: mono,
    sampleRate: audioBuffer.sampleRate,
    durationSeconds: length / audioBuffer.sampleRate,
  };
}

export interface FrameOptions {
  fftSize: number;
  /** Distance in samples between successive frame starts. */
  hopSize: number;
  minFreq?: number;
  maxFreq?: number;
}

/** Compute the chroma vector of a single audio frame. */
function frameChroma(
  frame: Float32Array,
  sampleRate: number,
  minFreq: number,
  maxFreq: number,
): Float32Array {
  applyHannWindow(frame);
  const mag = fftMagnitude(frame);
  return spectrumToChroma(mag, { sampleRate, minFreq, maxFreq });
}

/**
 * Slide a hop-sized window across the signal and return one chroma vector
 * per frame.
 */
export function computeChromaSequence(
  audio: DecodedAudio,
  opts: FrameOptions,
): Float32Array[] {
  const { fftSize, hopSize, minFreq = 55, maxFreq = 5000 } = opts;
  const chromas: Float32Array[] = [];
  const { samples, sampleRate } = audio;
  for (let start = 0; start + fftSize <= samples.length; start += hopSize) {
    const frame = samples.slice(start, start + fftSize);
    chromas.push(frameChroma(frame, sampleRate, minFreq, maxFreq));
  }
  return chromas;
}

/** Element-wise mean of a slice of chromas, L1-renormalized. */
export function aggregateChromas(
  chromas: Float32Array[],
  fromIdx = 0,
  toIdx = chromas.length,
): Float32Array {
  const out = new Float32Array(CHROMA_SIZE);
  const count = toIdx - fromIdx;
  if (count <= 0) return out;
  for (let i = fromIdx; i < toIdx; i++) {
    const c = chromas[i];
    for (let j = 0; j < CHROMA_SIZE; j++) out[j] += c[j];
  }
  let sum = 0;
  for (let j = 0; j < CHROMA_SIZE; j++) {
    out[j] /= count;
    sum += out[j];
  }
  if (sum > 0) for (let j = 0; j < CHROMA_SIZE; j++) out[j] /= sum;
  return out;
}

export interface SegmentScores {
  /** Aggregated chroma for this segment. */
  chroma: Float32Array;
  /** Chord ranking from `detectChord`. */
  chords: ChordScore[];
  /** Key ranking (24 candidates) from `detectKey`. */
  keys: KeyScore[];
}

/** Aggregate the whole sequence (with optional head/tail trimming). */
export function analyzeOverall(
  chromas: Float32Array[],
  trimRatio = 0.1,
): SegmentScores {
  const total = chromas.length;
  const from = Math.floor(total * trimRatio);
  const to = Math.ceil(total * (1 - trimRatio));
  const chroma = aggregateChromas(chromas, from, to);
  return {
    chroma,
    chords: detectChord(chroma),
    keys: detectKey(chroma),
  };
}

export interface SlidingChordHistogramEntry {
  name: string;
  /** Number of windows where this chord was top-1. */
  count: number;
  /** Fraction of windows where this chord was top-1 (∈ [0, 1]). */
  fraction: number;
  /** Mean cosine similarity of this chord across windows where it was top-1. */
  meanSimilarity: number;
}

export interface SlidingChordHistogram {
  /** Number of windows analyzed. */
  totalWindows: number;
  /** Entries sorted by count descending. */
  entries: SlidingChordHistogramEntry[];
}

/**
 * Slide a chroma window of `windowFrames` frames across the chroma sequence
 * with `strideFrames` between starts. At each position, aggregate the window
 * to a single chroma, run `detectChord`, and tally the top-1 result.
 *
 * Returns a histogram of how often each chord won, sorted by count.
 */
export function slidingChordHistogram(
  chromas: Float32Array[],
  windowFrames: number,
  strideFrames: number,
): SlidingChordHistogram {
  if (windowFrames <= 0 || strideFrames <= 0) {
    throw new Error("windowFrames and strideFrames must be > 0");
  }
  const counts = new Map<string, { count: number; simSum: number }>();
  let totalWindows = 0;
  for (let start = 0; start + windowFrames <= chromas.length; start += strideFrames) {
    const chroma = aggregateChromas(chromas, start, start + windowFrames);
    const sum = chroma.reduce((a, b) => a + b, 0);
    if (sum === 0) continue; // skip silent windows
    const top = detectChord(chroma)[0];
    const entry = counts.get(top.name) ?? { count: 0, simSum: 0 };
    entry.count += 1;
    entry.simSum += top.similarity;
    counts.set(top.name, entry);
    totalWindows += 1;
  }
  const entries: SlidingChordHistogramEntry[] = [];
  for (const [name, { count, simSum }] of counts) {
    entries.push({
      name,
      count,
      fraction: totalWindows > 0 ? count / totalWindows : 0,
      meanSimilarity: count > 0 ? simSum / count : 0,
    });
  }
  entries.sort((a, b) => b.count - a.count);
  return { totalWindows, entries };
}

export interface PresenceTonalityRunOptions {
  /** Live acquisition window length (seconds). */
  liveAcquisitionSeconds: number;
  /** Tonality acquisition window length (seconds). */
  tonalityAcquisitionSeconds: number;
  /** Frame rate of the chroma sequence (frames per second). */
  framesPerSecond: number;
  /** High-water-mark filter parameters. */
  filter?: HighWaterMarkOptions;
}

export interface PresenceTonalityRunResult {
  /** Final presence histogram (mean of indicator vectors over the tonality window). */
  presence: Float32Array;
  /** Tonality ranking derived from the presence histogram. */
  keys: KeyScore[];
}

/**
 * Replays the ToneBaseTonality pipeline (live window → HWM filter → indicator
 * → tonality presence accumulator → detectKey) over a precomputed chroma
 * sequence, returning the final presence histogram and tonality ranking.
 */
export function runPresenceTonality(
  chromas: Float32Array[],
  opts: PresenceTonalityRunOptions,
): PresenceTonalityRunResult {
  const live = new ChromaWindow({
    windowSeconds: opts.liveAcquisitionSeconds,
    framesPerSecond: opts.framesPerSecond,
  });
  const presence = new ChromaWindow({
    windowSeconds: opts.tonalityAcquisitionSeconds,
    framesPerSecond: opts.framesPerSecond,
  });
  const filter = new HighWaterMarkFilter(opts.filter);

  for (const c of chromas) {
    live.push(c);
    const liveAgg = live.aggregate();
    const indicator = filter.filterToIndicator(liveAgg);
    presence.push(indicator);
  }
  const histogram = presence.aggregateRaw();
  return { presence: histogram, keys: detectKeyFromPresence(histogram) };
}
