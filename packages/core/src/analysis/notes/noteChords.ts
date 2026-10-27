/**
 * Chords from a note model ("AI listening"): instead of reading the chord
 * from the spectrum, a network (Basic Pitch) says which keys sound, and the
 * chord is read from those keys.
 *
 *   1. Every 0.1 s, the note posteriors of the last 100 ms are averaged.
 *   2. They fold into two 12-bin chromas: treble (MIDI 48, C3, and above)
 *      and bass (E2 to F#3, the low guitar strings).
 *   3. The 24 major and minor triad templates are scored by cosine
 *      similarity with the treble chroma, plus λ × the bass chroma at the
 *      chord's root (normalised to its peak): a bass note pulls the chords
 *      built on it (Mauch & Dixon 2010).
 *   4. Softmax (τ = 0.1) → the chord HMM of `chordHmm.ts` (mean chord 1 s,
 *      κ = 0.6, causal), which keeps a chord through a stray frame.
 *
 * The HMM keeps its "no chord" state, but only silence reaches it: when no
 * key reaches `noteThreshold` (0.3, the note threshold of basic-pitch's own
 * note extraction), the frame is "no chord"; otherwise the network has
 * heard notes and one of the 24 chords is chosen. Measured on held-out
 * GuitarSet takes (`poc/`), this front-end beat the spectral one by ~11
 * points in a quiet room; it degrades faster in noise.
 *
 * `NoteModelChords` is the live version: it resamples the incoming audio,
 * hands the latest 2 s to a `NoteModelRunner` on demand and decodes the
 * frames that are far enough from the window edge (174 ms look-ahead).
 */

import {
  BASIC_PITCH,
  checkNoteModelOutput,
  type NoteModelOutput,
  type NoteModelRunner,
} from "./basicPitch";
import { StreamResampler } from "./resample";
import { CHORD_TEMPLATES, cosineSimilarity, type ChordScore } from "../chordDetection";
import { ChordHmm, selfTransitionFor } from "../chordHmm";
import { CHROMA_SIZE } from "../chroma";
import { softmax } from "../math";

export interface NoteChordOptions {
  /** Weight of the bass chroma at the chord root. Default 0.3. */
  lambdaBass?: number;
  /** Mean chord duration of the HMM, s. Default 1. */
  meanChordSeconds?: number;
  /** HMM emission exponent κ. Default 0.6. */
  emissionExponent?: number;
  /** Softmax temperature on the template scores. Default 0.1. */
  temperature?: number;
  /** A key counts as sounding from this mean posterior; below it everywhere, "no chord". Default 0.3. */
  noteThreshold?: number;
  /** Lowest MIDI note of the treble chroma. Default 48 (C3). */
  trebleMinMidi?: number;
  /** MIDI range of the bass chroma, inclusive. Default [40, 54] (E2–F#3). */
  bassRange?: readonly [number, number];
}

/** Mean posteriors of a few frames, folded to pitch classes. */
export interface NoteChroma {
  /** Treble chroma, summing to 1 (all zeros when nothing sounds). */
  treble: Float32Array;
  /** Bass chroma (not normalised). */
  bass: Float32Array;
  /** Highest mean posterior of any key. */
  peak: number;
  /** MIDI notes whose mean posterior reaches the note threshold, ascending. */
  notes: number[];
}

export interface NoteChordDecision {
  /** The chord the HMM holds, or null for "no chord" (silence). */
  chord: ChordScore | null;
  /**
   * The 24 triads by HMM posterior (`probability`), best first;
   * `similarity` is the cosine with the treble chroma.
   */
  chords: ChordScore[];
  /** HMM posterior of "no chord". */
  noChord: number;
}

export interface NoteChordResult extends NoteChordDecision {
  /** Stream time of the decided frame, s since the first sample pushed. */
  time: number;
  /** Stream time of the newest audio analysed, s. `streamTime − time` ≥ the 174 ms look-ahead. */
  streamTime: number;
  /** Notes heard over the last 100 ms before `time` (MIDI). */
  notes: number[];
}

const DEFAULTS = {
  lambdaBass: 0.3,
  meanChordSeconds: 1,
  emissionExponent: 0.6,
  temperature: 0.1,
  noteThreshold: 0.3,
  trebleMinMidi: 48,
  bassRange: [40, 54] as const,
};

/** Decisions per second (one feature per 0.1 s). */
const FEATURE_RATE = 10;
/** Posteriors averaged per feature, s. */
const AVERAGE_SECONDS = 0.1;

/**
 * Average note-posterior frames and fold them into a treble and a bass
 * chroma. `frames` holds rows of 88 posteriors (index 0 = MIDI 21).
 */
export function noteChroma(
  frames: readonly ArrayLike<number>[],
  options: Pick<NoteChordOptions, "noteThreshold" | "trebleMinMidi" | "bassRange"> = {},
): NoteChroma {
  const threshold = options.noteThreshold ?? DEFAULTS.noteThreshold;
  const trebleMin = options.trebleMinMidi ?? DEFAULTS.trebleMinMidi;
  const [bassLo, bassHi] = options.bassRange ?? DEFAULTS.bassRange;
  const { keys, lowestMidi } = BASIC_PITCH;
  const mean = new Float64Array(keys);
  for (const row of frames) for (let j = 0; j < keys; j++) mean[j] += row[j] ?? 0;
  const treble = new Float32Array(CHROMA_SIZE);
  const bass = new Float32Array(CHROMA_SIZE);
  const notes: number[] = [];
  let peak = 0;
  let total = 0;
  for (let j = 0; j < keys; j++) {
    const v = frames.length > 0 ? mean[j] / frames.length : 0;
    const midi = lowestMidi + j;
    if (v > peak) peak = v;
    if (v >= threshold && v > 0) notes.push(midi);
    if (midi >= trebleMin) {
      treble[midi % CHROMA_SIZE] += v;
      total += v;
    }
    if (midi >= bassLo && midi <= bassHi) bass[midi % CHROMA_SIZE] += v;
  }
  if (total > 0) for (let i = 0; i < CHROMA_SIZE; i++) treble[i] /= total;
  return { treble, bass, peak, notes };
}

const N_CHORDS = CHORD_TEMPLATES.length; // 24
const NO_CHORD = N_CHORDS;

/** Template scores + bass pull + chord HMM, one chroma at a time (10 per second). */
export class NoteChordDecoder {
  private readonly hmm: ChordHmm;
  private readonly lambdaBass: number;
  private readonly temperature: number;
  private readonly noteThreshold: number;

  constructor(options: NoteChordOptions = {}) {
    this.lambdaBass = options.lambdaBass ?? DEFAULTS.lambdaBass;
    this.temperature = options.temperature ?? DEFAULTS.temperature;
    this.noteThreshold = options.noteThreshold ?? DEFAULTS.noteThreshold;
    this.hmm = new ChordHmm({
      states: N_CHORDS + 1,
      selfTransition: selfTransitionFor(
        options.meanChordSeconds ?? DEFAULTS.meanChordSeconds,
        FEATURE_RATE,
      ),
      lagFrames: 0,
      emissionExponent: options.emissionExponent ?? DEFAULTS.emissionExponent,
    });
  }

  reset(): void {
    this.hmm.reset();
  }

  /** Feed the chroma of the next 0.1 s step; returns the HMM's decision. */
  push(chroma: NoteChroma): NoteChordDecision {
    const similarities = CHORD_TEMPLATES.map((t) => cosineSimilarity(chroma.treble, t.template));
    let emissions: number[];
    if (chroma.peak < this.noteThreshold) {
      emissions = similarities.map(() => 0);
      emissions.push(1);
    } else {
      let bassPeak = 0;
      for (const v of chroma.bass) if (v > bassPeak) bassPeak = v;
      const scores = similarities.map(
        (s, i) =>
          s +
          (bassPeak > 0 ? (this.lambdaBass * chroma.bass[CHORD_TEMPLATES[i].root]) / bassPeak : 0),
      );
      emissions = softmax([...scores, -Infinity], this.temperature);
    }
    const posterior = this.hmm.push(emissions);
    const chords: ChordScore[] = CHORD_TEMPLATES.map((t, i) => ({
      root: t.root,
      quality: t.quality,
      name: t.name,
      similarity: similarities[i],
      probability: posterior[i],
    }));
    chords.sort((a, b) => b.probability - a.probability);
    const noChord = posterior[NO_CHORD];
    return { chord: chords[0].probability > noChord ? chords[0] : null, chords, noChord };
  }
}

/** One model window: the latest 2 s at 22050 Hz, zero-padded at the start. */
export interface NoteModelWindow {
  input: Float32Array;
  /** Model-rate sample index just past the window's last sample. */
  endSample: number;
}

/**
 * Live chords from a note model. Push microphone samples as they come; call
 * `analyse(runner)` every ~250 ms (not concurrently): it runs the model on
 * the latest 2 s and decodes every 0.1 s step that is now at least 174 ms
 * from the window edge. Steps older than the window's reliable part (calls
 * more than ~1.6 s apart) are skipped, not guessed.
 */
export class NoteModelChords {
  readonly sampleRate: number;
  private readonly options: NoteChordOptions;
  private readonly resampler: StreamResampler;
  private readonly decoder: NoteChordDecoder;
  /** The last `windowSamples` model-rate samples, as a ring. */
  private readonly ring = new Float32Array(BASIC_PITCH.windowSamples);
  private written = 0;
  private lastWindowEnd = 0;
  /** Index of the next 0.1 s step to decode. */
  private nextStep = 0;
  private last: NoteChordResult | null = null;

  constructor(options: NoteChordOptions & { sampleRate: number }) {
    this.sampleRate = options.sampleRate;
    this.options = options;
    this.resampler = new StreamResampler(options.sampleRate, BASIC_PITCH.sampleRate);
    this.decoder = new NoteChordDecoder(options);
  }

  /** Latest result, or null before the first decoded step. */
  get latest(): NoteChordResult | null {
    return this.last;
  }

  /** Seconds of audio received (at the model rate). */
  get receivedSeconds(): number {
    return this.written / BASIC_PITCH.sampleRate;
  }

  push(samples: ArrayLike<number>): void {
    const y = this.resampler.push(samples);
    const ring = this.ring;
    const n = ring.length;
    // Only the last `n` samples of a long block can survive.
    const skip = Math.max(0, y.length - n);
    let pos = (this.written + skip) % n;
    for (let i = skip; i < y.length; i++) {
      ring[pos] = y[i];
      pos = pos + 1 === n ? 0 : pos + 1;
    }
    this.written += y.length;
  }

  /** The window to run next, or null when no audio arrived since the last one. */
  nextWindow(): NoteModelWindow | null {
    if (this.written === this.lastWindowEnd) return null;
    const n = this.ring.length;
    const input = new Float32Array(n);
    const have = Math.min(this.written, n);
    const start = this.written - have;
    for (let i = 0; i < have; i++) input[n - have + i] = this.ring[(start + i) % n];
    this.lastWindowEnd = this.written;
    return { input, endSample: this.written };
  }

  /**
   * Decode a model output for `window` (from `nextWindow`). Returns the
   * newest result, or the previous one when no new step was reliable yet.
   */
  accept(window: NoteModelWindow, output: NoteModelOutput): NoteChordResult | null {
    checkNoteModelOutput(output);
    const { sampleRate: sr, hop, windowSamples, windowFrames, edgeFrames } = BASIC_PITCH;
    const firstSample = window.endSample - windowSamples;
    const lastValid = windowFrames - 1 - edgeFrames;
    const span = AVERAGE_SECONDS * sr;
    for (;;) {
      const time = this.nextStep / FEATURE_RATE;
      const at = time * sr - firstSample; // window-relative sample of the step
      const hi = Math.floor(at / hop);
      if (hi > lastValid) break;
      const lo = Math.floor((at - span) / hop) + 1;
      this.nextStep++;
      if (lo < edgeFrames) continue; // before the reliable part of this window
      const chroma = noteChroma(output.notes.slice(lo, hi + 1), this.options);
      this.last = {
        ...this.decoder.push(chroma),
        time,
        streamTime: window.endSample / sr,
        notes: chroma.notes,
      };
    }
    return this.last;
  }

  /** `nextWindow` → `runner.run` → `accept`. Null until a step could be decoded. */
  async analyse(runner: NoteModelRunner): Promise<NoteChordResult | null> {
    const window = this.nextWindow();
    if (!window) return this.last;
    return this.accept(window, await runner.run(window.input));
  }

  reset(): void {
    this.resampler.reset();
    this.decoder.reset();
    this.ring.fill(0);
    this.written = 0;
    this.lastWindowEnd = 0;
    this.nextStep = 0;
    this.last = null;
  }
}
