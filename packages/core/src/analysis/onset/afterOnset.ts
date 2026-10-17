/**
 * What was played at an onset: the note or the chord heard just after it,
 * analysed on the samples themselves. Pure TypeScript.
 *
 * The live tonality frames cannot answer "which chord at 12.345 s": their
 * chord window spans a second and they are polled without an audio
 * timestamp. Here the samples are kept with their stream frames
 * (`StreamHistory`), and once an onset is decided the segment that follows
 * it is analysed directly:
 *
 *   note   McLeod pitch (`detectPitch`) on `windowSize` samples (default
 *          2048 ≈ 43 ms) starting `skipMs` after the attack
 *   chord  chroma of a Hann-windowed FFT over [onset + skipMs,
 *          onset + skipMs + durationMs] (default 30 → 200 ms), then
 *          `detectChord`
 *
 * Skipping the first tens of ms avoids the pick noise and the previous
 * note still decaying; the verdict is available `skipMs + window` after
 * the onset. A short chord segment has a coarse spectrum (6 Hz bins for
 * 170 ms), so low bass notes leak into their neighbours: chord labels from
 * this path are less sure than the 1 s live window, and should gate a
 * "right chord" verdict with a generous threshold.
 */

import { detectChord, type ChordScore, type DetectChordOptions } from "../chordDetection";
import { spectrumToChroma } from "../chroma";
import { detectPitch, type PitchEstimate, type PitchOptions } from "../pitch";
import { computeFftDb, nextPow2 } from "../timeFft";

/** Samples of a stream addressed by their frame, over the last `capacity` frames. */
export class StreamHistory {
  private readonly buffer: Float32Array;
  /** Stream frame just after the newest sample. */
  private end = 0;
  private stored = 0;

  constructor(capacityFrames: number) {
    if (!(capacityFrames >= 1)) throw new Error("capacityFrames must be ≥ 1");
    this.buffer = new Float32Array(Math.floor(capacityFrames));
  }

  get capacity(): number {
    return this.buffer.length;
  }

  /** Oldest and newest+1 frames available. */
  get range(): { from: number; to: number } {
    return { from: this.end - this.stored, to: this.end };
  }

  /** Append samples whose first one is at `startFrame` (a gap clears the history). */
  push(samples: ArrayLike<number>, startFrame: number = this.end): void {
    if (startFrame !== this.end) this.stored = 0;
    const cap = this.buffer.length;
    for (let i = 0; i < samples.length; i++) {
      this.buffer[(startFrame + i) % cap] = samples[i];
    }
    this.end = startFrame + samples.length;
    this.stored = Math.min(cap, this.stored + samples.length);
  }

  /** Copy of frames [from, from + length), or null if not all of them are stored. */
  read(from: number, length: number): Float32Array | null {
    const { from: first, to } = this.range;
    if (from < first || from + length > to || length < 0) return null;
    const cap = this.buffer.length;
    const out = new Float32Array(length);
    for (let i = 0; i < length; i++) out[i] = this.buffer[(((from + i) % cap) + cap) % cap];
    return out;
  }
}

export interface NoteAfterOnsetOptions extends PitchOptions {
  /** Delay after the attack before the analysed window, in ms. Default 30. */
  skipMs?: number;
  /** Window length in samples. Default 2048. */
  windowSize?: number;
}

/** First frame after which `noteAfterOnset` can answer. */
export function noteReadyAt(
  onsetFrame: number,
  sampleRate: number,
  options: NoteAfterOnsetOptions = {},
): number {
  const skip = Math.round(((options.skipMs ?? 30) / 1000) * sampleRate);
  return onsetFrame + skip + (options.windowSize ?? 2048);
}

/**
 * Pitch of the note started at `onsetFrame`, or null if nothing periodic
 * was heard (or the samples are not available yet / any more).
 */
export function noteAfterOnset(
  history: StreamHistory,
  onsetFrame: number,
  sampleRate: number,
  options: NoteAfterOnsetOptions = {},
): PitchEstimate | null {
  const { skipMs = 30, windowSize = 2048, ...pitch } = options;
  const start = onsetFrame + Math.round((skipMs / 1000) * sampleRate);
  const segment = history.read(start, windowSize);
  return segment ? detectPitch(segment, sampleRate, pitch) : null;
}

export interface ChordAfterOnsetOptions extends DetectChordOptions {
  /** Delay after the attack before the analysed segment, in ms. Default 30. */
  skipMs?: number;
  /** Segment length, in ms. Default 170. */
  durationMs?: number;
  /** Chroma range, in Hz. Defaults 70 and 2000. */
  minFreq?: number;
  maxFreq?: number;
  /** Segments quieter than this RMS give no chord. Default 0.001 (−60 dBFS). */
  silenceRms?: number;
}

/** First frame after which `chordAfterOnset` can answer. */
export function chordReadyAt(
  onsetFrame: number,
  sampleRate: number,
  options: ChordAfterOnsetOptions = {},
): number {
  const ms = (options.skipMs ?? 30) + (options.durationMs ?? 170);
  return onsetFrame + Math.round((ms / 1000) * sampleRate);
}

/**
 * Chord candidates (best first, see `detectChord`) for the chord started at
 * `onsetFrame`; an empty list on silence or when the samples are missing.
 */
export function chordAfterOnset(
  history: StreamHistory,
  onsetFrame: number,
  sampleRate: number,
  options: ChordAfterOnsetOptions = {},
): ChordScore[] {
  const {
    skipMs = 30,
    durationMs = 170,
    minFreq = 70,
    maxFreq = 2000,
    silenceRms = 0.001,
    ...chordOptions
  } = options;
  const start = onsetFrame + Math.round((skipMs / 1000) * sampleRate);
  const length = Math.round((durationMs / 1000) * sampleRate);
  const segment = history.read(start, length);
  if (!segment) return [];
  let energy = 0;
  for (let i = 0; i < segment.length; i++) energy += segment[i] * segment[i];
  if (Math.sqrt(energy / segment.length) < silenceRms) return [];
  const { magnitude } = computeFftDb(segment, sampleRate, { fftSize: nextPow2(length) });
  const chroma = spectrumToChroma(magnitude, { sampleRate, minFreq, maxFreq });
  return detectChord(chroma, chordOptions);
}
