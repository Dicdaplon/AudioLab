/**
 * Chord progressions on the synthetic guitar, with the time of every
 * change known, and the three numbers the alternative chord methods are
 * compared on:
 *
 *   accuracy        share of frames whose answer is the chord sounding at
 *                   that moment (the answer the player sees, so a smoothing
 *                   lag counts against it)
 *   delay           time from a chord change to the first frame from which
 *                   the new chord is the answer for two frames running
 *   wrong switches  changes of the answer to a chord that is not sounding,
 *                   per minute (the "flicker")
 *
 * The guitar is a model (tests/helpers/guitar.ts): baselines, not a
 * benchmark of real playing.
 */
import type { TonalityEngineConfig } from "../../src/analysis/engine/tonalityEngine";
import { TonalityEngine } from "../../src/analysis/engine/tonalityEngine";
import { chordPitchClasses, type ChordQuality } from "../../src/analysis/chordDetection";
import { strum, voicingNotes } from "./guitar";
import { GUITAR_VOICINGS } from "./guitarChords";
import { analyserFrames, concat, mulberry32 } from "./synth";

export const PROG_SR = 12_000;
export const PROG_FFT = 4096;
export const PROG_FPS = 10;

export interface ProgressionChord {
  name: string;
  root: number;
  quality: ChordQuality;
  start: number;
  end: number;
}

export interface Progression {
  signal: Float32Array;
  chords: ProgressionChord[];
  seconds: number;
}

const TRIAD_VOICINGS = GUITAR_VOICINGS.filter(
  (v) => v.chord.quality === "maj" || v.chord.quality === "min",
);

/**
 * `count` chords drawn at random (never the same twice in a row), each held
 * for `minBeats` to `maxBeats` beats at `bpm` and strummed once per beat.
 * Defaults: 2 to 4 beats at 100 BPM (1.2 to 2.4 s per chord).
 */
export function syntheticProgression(opts: {
  seed: number;
  count?: number;
  bpm?: number;
  snrDb?: number;
  minBeats?: number;
  maxBeats?: number;
}): Progression {
  const { seed, count = 12, bpm = 100, snrDb = 30, minBeats = 2, maxBeats = 4 } = opts;
  const rand = mulberry32(seed);
  const beat = 60 / bpm;
  const parts: Float32Array[] = [];
  const chords: ProgressionChord[] = [];
  let t = 0;
  let previous = -1;
  for (let c = 0; c < count; c++) {
    let pick = Math.floor(rand() * TRIAD_VOICINGS.length);
    while (pick === previous) pick = Math.floor(rand() * TRIAD_VOICINGS.length);
    previous = pick;
    const v = TRIAD_VOICINGS[pick];
    const beats = minBeats + Math.floor(rand() * (maxBeats - minBeats + 1));
    for (let b = 0; b < beats; b++) {
      parts.push(
        strum(voicingNotes(v.shape), {
          sampleRate: PROG_SR,
          seconds: beat,
          seed: seed * 1000 + c * 10 + b,
          snrDb,
        }),
      );
    }
    chords.push({ name: v.name, ...v.chord, start: t, end: t + beats * beat });
    t += beats * beat;
  }
  return { signal: concat(parts), chords, seconds: t };
}

export interface ProgressionScore {
  frames: number;
  correct: number;
  /** Frames answered "no chord" (null). */
  silent: number;
  /** Delay of every detected change, in seconds. */
  delays: number[];
  changes: number;
  missed: number;
  /** Wrong switches within `TRANSITION_SECONDS` after a real change. */
  wrongInTransition: number;
  /** Wrong switches while the same chord keeps ringing. */
  wrongSteady: number;
  seconds: number;
}

/** A switch this soon after a real change counts as a transition artefact. */
export const TRANSITION_SECONDS = 0.5;

export interface RunOptions {
  sampleRate?: number;
  fftSize?: number;
  fps?: number;
  /**
   * Consumer-side hysteresis: the shown answer only changes once a new
   * top-1 has held for this many frames. Default 1 (no hold).
   */
  holdFrames?: number;
  /**
   * Turns the engine's top chord into what is shown (e.g. G7 → G with the
   * majmin reduction), or null for "nothing shown". Default: as detected.
   */
  display?: (chord: ShownChord) => ShownChord | null;
}

export interface ShownChord {
  root: number;
  quality: ChordQuality;
}

export interface FrameAnswer {
  /** End time of the analyser window, in seconds. */
  time: number;
  /** Pitch set of the shown chord ("0,4,7"), or null. */
  answer: string | null;
  /** The shown chord, or null. */
  chord: ShownChord | null;
}

/**
 * What the engine answers at each analyser frame, with the frame's end time.
 * The answer is the top chord's pitch set, or null when there is none or
 * when the HMM's "no chord" state outweighs it.
 */
export function runEngine(
  signal: Float32Array,
  cfg: Partial<TonalityEngineConfig>,
  opts: RunOptions = {},
): FrameAnswer[] {
  const { sampleRate = PROG_SR, fftSize = PROG_FFT, fps = PROG_FPS } = opts;
  const hop = Math.round(sampleRate / fps);
  return runFrames(analyserFrames(signal, fftSize, hop), cfg, opts);
}

/**
 * `runEngine` on spectra already computed (`analyserFrames` output), so one
 * recording is framed once for every method compared.
 */
export function runFrames(
  dbFrames: readonly Float32Array[],
  cfg: Partial<TonalityEngineConfig>,
  {
    sampleRate = PROG_SR,
    fftSize = PROG_FFT,
    fps = PROG_FPS,
    holdFrames = 1,
    display = (c) => c,
  }: RunOptions = {},
): FrameAnswer[] {
  const engine = new TonalityEngine({ framesPerSecond: fps, ...cfg });
  const hop = Math.round(sampleRate / fps);
  const keyOf = (c: ShownChord | null) =>
    c ? chordPitchClasses(c.root, c.quality).join(",") : null;
  let shown: ShownChord | null = null;
  let candidate: ShownChord | null = null;
  let held = 0;
  return dbFrames.map((db, i) => {
    const frame = engine.processDbSpectrum(db, sampleRate);
    const top = frame.chords[0];
    const raw =
      !top || (frame.noChordProbability ?? 0) > top.probability
        ? null
        : display({ root: top.root, quality: top.quality });
    if (keyOf(raw) === keyOf(candidate)) held++;
    else {
      candidate = raw;
      held = 1;
    }
    if (held >= holdFrames) shown = candidate;
    return { time: (fftSize + i * hop) / sampleRate, answer: keyOf(shown), chord: shown };
  });
}

export function scoreProgression(
  prog: Progression,
  outputs: { time: number; answer: string | null }[],
): ProgressionScore {
  const key = (c: ProgressionChord) => chordPitchClasses(c.root, c.quality).join(",");
  const truthAt = (t: number) => prog.chords.find((c) => t >= c.start && t < c.end);
  let correct = 0;
  let frames = 0;
  let silent = 0;
  let wrongInTransition = 0;
  let wrongSteady = 0;
  let prev: string | null = null;
  for (const o of outputs) {
    const truth = truthAt(o.time);
    if (!truth) continue;
    frames++;
    if (o.answer === null) silent++;
    if (o.answer === key(truth)) correct++;
    if (prev !== null && o.answer !== null && o.answer !== prev && o.answer !== key(truth)) {
      const sinceChange = o.time - truth.start;
      if (truth !== prog.chords[0] && sinceChange < TRANSITION_SECONDS) wrongInTransition++;
      else wrongSteady++;
    }
    if (o.answer !== null) prev = o.answer;
  }
  const delays: number[] = [];
  let missed = 0;
  for (const c of prog.chords.slice(1)) {
    const k = key(c);
    const window = outputs.filter((o) => o.time >= c.start && o.time < c.end);
    const hit = window.findIndex((o, i) => o.answer === k && window[i + 1]?.answer === k);
    if (hit < 0) missed++;
    else delays.push(window[hit].time - c.start);
  }
  return {
    frames,
    correct,
    silent,
    delays,
    changes: prog.chords.length - 1,
    missed,
    wrongInTransition,
    wrongSteady,
    seconds: prog.seconds,
  };
}

/** Pool several scores into the headline numbers. */
export function summarise(scores: ProgressionScore[]) {
  const sum = (f: (x: ProgressionScore) => number) => scores.reduce((s, x) => s + f(x), 0);
  const delays = scores.flatMap((x) => x.delays).sort((a, b) => a - b);
  const minutes = sum((x) => x.seconds) / 60;
  const q = (p: number) =>
    delays.length ? delays[Math.min(delays.length - 1, Math.floor(p * delays.length))] : NaN;
  return {
    accuracy: sum((x) => x.correct) / sum((x) => x.frames),
    silentShare: sum((x) => x.silent) / sum((x) => x.frames),
    medianDelay: q(0.5),
    p90Delay: q(0.9),
    missedShare: sum((x) => x.missed) / sum((x) => x.changes),
    wrongTransitionPerMinute: sum((x) => x.wrongInTransition) / minutes,
    wrongSteadyPerMinute: sum((x) => x.wrongSteady) / minutes,
    wrongSwitchesPerMinute: sum((x) => x.wrongInTransition + x.wrongSteady) / minutes,
  };
}

/**
 * 95 % bootstrap interval of a pooled statistic, resampling whole
 * progressions (they are the independent units, not the frames).
 */
export function bootstrap(
  scores: ProgressionScore[],
  stat: (s: ProgressionScore[]) => number,
  rounds = 1000,
  seed = 7,
): [number, number] {
  const rand = mulberry32(seed);
  const values: number[] = [];
  for (let r = 0; r < rounds; r++) {
    const sample = scores.map(() => scores[Math.floor(rand() * scores.length)]);
    values.push(stat(sample));
  }
  values.sort((a, b) => a - b);
  return [values[Math.floor(0.025 * rounds)], values[Math.floor(0.975 * rounds)]];
}
