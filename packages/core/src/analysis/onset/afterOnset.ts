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

export interface ClickBandOptions {
  /** Band of the click, in Hz. Default 2300–4000 (`CLICK_BAND_HZ`, the metronome's clicks). */
  band?: readonly [number, number];
  /** Length of the compared segments, in ms (rounded up to a power of two). Default 10 (≈ 11 ms at 48 kHz). */
  windowMs?: number;
}

export interface SpectralRise {
  /** Share of the new energy that lies in the band, in [0, 1]. */
  bandShare: number;
  /** Total energy after vs before (80 Hz – 10 kHz), in dB: > 0 when something starts. */
  riseDb: number;
  /** Level of the new energy alone, in dB (relative: compare two rises, not to dBFS). */
  levelDb: number;
  /** New energy per half-octave band (`RISE_BAND_EDGES_HZ`): the shape of what appeared. */
  bands: readonly number[];
}

const DEFAULT_CLICK_BAND: readonly [number, number] = [2300, 4000];

/** Edges of the half-octave bands of `SpectralRise.bands`, 100 Hz – 9 kHz, in Hz. */
export const RISE_BAND_EDGES_HZ: readonly number[] = Array.from({ length: 14 }, (_, i) =>
  Math.round(100 * Math.pow(2, i / 2)),
);

/**
 * How alike two rises are, from their band shapes: 1 for the same spectrum
 * at any loudness, near 0 for unrelated ones (cosine of the square roots, so
 * the loudest band does not decide alone). A metronome's echo against the
 * echoes learnt during the count-in scores above 0.85; a guitar attack under
 * 0.25, and an echo over strings still ringing 0.4–1 (synthetic clave and
 * strums, see the tests).
 */
export function riseSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = Math.sqrt(Math.max(0, a[i]));
    const y = Math.sqrt(Math.max(0, b[i]));
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na > 0 && nb > 0 ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * What appears at a frame: the power spectrum of the `windowMs` after it,
 * compared with the one just before. Only the increase counts, so a note
 * already ringing does not dilute it. Null when the samples are missing.
 */
export function spectralRise(
  history: StreamHistory,
  frame: number,
  sampleRate: number,
  options: ClickBandOptions = {},
): SpectralRise | null {
  const [lo, hi] = options.band ?? DEFAULT_CLICK_BAND;
  const length = clickWindowLength(sampleRate, options.windowMs);
  const before = history.read(frame - length, length);
  const after = history.read(frame, length);
  if (!before || !after) return null;
  const pb = computeFftDb(before, sampleRate, { fftSize: length }).magnitude;
  const pa = computeFftDb(after, sampleRate, { fftSize: length }).magnitude;
  const binHz = sampleRate / length;
  const edges = RISE_BAND_EDGES_HZ;
  const bands = new Array<number>(edges.length - 1).fill(0);
  let inBand = 0;
  let rise = 0;
  let energyBefore = 0;
  let energyAfter = 0;
  let band = 0;
  for (let k = 1; k < pa.length; k++) {
    const f = k * binHz;
    if (f < 80 || f > 10000) continue;
    const a = pa[k] * pa[k];
    const b = pb[k] * pb[k];
    energyBefore += b;
    energyAfter += a;
    const r = Math.max(0, a - b);
    rise += r;
    if (f >= lo && f <= hi) inBand += r;
    while (band < bands.length && f >= edges[band + 1]) band++;
    if (band < bands.length && f >= edges[band]) bands[band] += r;
  }
  return {
    bandShare: rise > 0 ? inBand / rise : 0,
    riseDb: 10 * Math.log10((energyAfter + 1e-20) / (energyBefore + 1e-20)),
    levelDb: 10 * Math.log10(rise + 1e-20),
    bands,
  };
}

/** Samples in each compared segment of `spectralRise`. */
export function clickWindowLength(sampleRate: number, windowMs = 10): number {
  return nextPow2(Math.round((windowMs / 1000) * sampleRate));
}

/**
 * Share of the energy that appears at an onset which lies in a narrow band:
 * close to 1 for a metronome click picked up by the microphone (a sine
 * burst), low for a guitar attack (broadband, even over a ringing note).
 * Null when the samples are not available.
 */
export function clickBandShare(
  history: StreamHistory,
  onsetFrame: number,
  sampleRate: number,
  options: ClickBandOptions = {},
): number | null {
  return spectralRise(history, onsetFrame, sampleRate, options)?.bandShare ?? null;
}
