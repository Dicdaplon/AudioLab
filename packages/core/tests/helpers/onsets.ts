/**
 * Synthetic performances with known note start times, for the onset,
 * gate and rhythm tests: plucked tones (with a short attack ramp and a
 * pick-noise burst) mixed into a timeline at exact sample positions, over
 * an optional noise floor.
 */
import { midiToHz, mulberry32, pluckedTone } from "./synth";

export interface NoteHit {
  /** Start time in seconds. */
  time: number;
  /** MIDI note, or several for a strum. */
  midi: number | readonly number[];
  /** Peak amplitude of the fundamental. Default 0.3. */
  amplitude?: number;
  /** Delay between successive strings of a strum, in ms. Default 15. */
  strumMs?: number;
}

export interface PerformanceOptions {
  sampleRate?: number;
  seconds: number;
  /** RMS of a white noise floor. Default 0 (none). */
  noiseRms?: number;
  /** Attack ramp of each pluck, in ms. Default 2. */
  attackMs?: number;
  /** Decay time constant of each pluck, in s. Default 0.8. */
  decaySeconds?: number;
  seed?: number;
}

/** One pluck: ramped attack + pick noise + decaying partials. */
export function pluck(
  midi: number,
  amplitude: number,
  { sampleRate = 48000, attackMs = 2, decaySeconds = 0.8, seconds = 1.2, seed = 3 } = {},
): Float32Array {
  const tone = pluckedTone(midiToHz(midi), { sampleRate, seconds, decaySeconds, seed });
  const rand = mulberry32(seed * 7 + 1);
  const ramp = Math.max(1, Math.round((attackMs / 1000) * sampleRate));
  const noiseLen = Math.round(0.004 * sampleRate);
  for (let i = 0; i < tone.length; i++) {
    const env = i < ramp ? i / ramp : 1;
    const pick = i < noiseLen ? (rand() - 0.5) * 0.6 * (1 - i / noiseLen) : 0;
    tone[i] = amplitude * (env * tone[i] + pick);
  }
  return tone;
}

/** Mix the hits into a timeline; returns the signal and the exact start frames. */
export function performance(
  hits: readonly NoteHit[],
  opts: PerformanceOptions,
): { signal: Float32Array; startFrames: number[] } {
  const { sampleRate = 48000, seconds, noiseRms = 0, seed = 11 } = opts;
  const signal = new Float32Array(Math.round(seconds * sampleRate));
  const startFrames: number[] = [];
  hits.forEach((hit, h) => {
    const notes = typeof hit.midi === "number" ? [hit.midi] : hit.midi;
    const start = Math.round(hit.time * sampleRate);
    startFrames.push(start);
    notes.forEach((midi, s) => {
      const offset = start + Math.round(((hit.strumMs ?? 15) / 1000) * sampleRate * s);
      const tone = pluck(midi, (hit.amplitude ?? 0.3) / Math.sqrt(notes.length), {
        sampleRate,
        attackMs: opts.attackMs,
        decaySeconds: opts.decaySeconds,
        seed: seed + h * 13 + s,
      });
      for (let i = 0; i < tone.length && offset + i < signal.length; i++) {
        signal[offset + i] += tone[i];
      }
    });
  });
  if (noiseRms > 0) {
    const rand = mulberry32(seed);
    const a = noiseRms * Math.sqrt(12);
    for (let i = 0; i < signal.length; i++) signal[i] += (rand() - 0.5) * a;
  }
  return { signal, startFrames };
}

/** Push a signal in chunks of varying length, as a capture would deliver it. */
export function pushChunks<T>(
  signal: Float32Array,
  push: (chunk: Float32Array, startFrame: number) => readonly T[] | void,
  sizes: readonly number[] = [128, 2048, 333, 512],
  firstFrame = 0,
): T[] {
  const out: T[] = [];
  let i = 0;
  let s = 0;
  while (i < signal.length) {
    const len = Math.min(sizes[s++ % sizes.length], signal.length - i);
    const result = push(signal.subarray(i, i + len), firstFrame + i);
    if (result) out.push(...result);
    i += len;
  }
  return out;
}
