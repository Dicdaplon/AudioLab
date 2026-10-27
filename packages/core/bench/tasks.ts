/**
 * The four tasks of the benchmark, each run on one item under one
 * condition, producing records for the aggregation (see stats.ts) and a few
 * details for the report.
 */
import { GAUSSIAN_LOG_CHROMA } from "../src/analysis/chroma";
import { TempoAnalyzer } from "../src/analysis/engine/tempoAnalyzer";
import {
  TonalityEngine,
  type TonalityEngineConfig,
  type TonalityFrame,
} from "../src/analysis/engine/tonalityEngine";
import { chordPitchClasses } from "../src/analysis/chordDetection";
import { NoteModelChords } from "../src/analysis/notes";
import type { TempoAnalyzerMethod } from "../src/analysis/engine/tempoAnalyzer";
import { nodeBasicPitchRunner } from "./noteModelNode";
import { OnsetPipeline } from "../src/analysis/onset/onsetPipeline";
import type { OnsetMethod } from "../src/analysis/onset/onsetMethods";
import {
  analyzeOverall,
  computeChromaSequence,
  runPresenceTonality,
} from "../src/offline/offlinePipeline";
import { pushChunks } from "../tests/helpers/onsets";
import { runFrames, scoreProgression, type ProgressionScore } from "../tests/helpers/progressions";
import { analyserFrames } from "../tests/helpers/synth";
import {
  keyMerged,
  keyMirex,
  keyStrict,
  onsetScore,
  tempoAcc1,
  tempoAcc2,
  tempoOctaveError,
  type KeyRef,
} from "./metrics";
import type { ChordItem, ItemBase, KeyItem, OnsetItem, PitchItem, TempoItem } from "./sources";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PitchTracker, type PitchEstimate } from "../src/analysis/pitch";
import { PyinTracker } from "../src/analysis/pyin";
import { CrepeTracker, parseCrepeModel, type CrepeModel } from "../src/analysis/crepe";
import type { Rec, Split } from "./stats";

export const CHORD_METHODS: Record<string, Partial<TonalityEngineConfig>> = {
  "default (1 s window)": {},
  "hmm + gaussian-log (opt-in)": { chordSmoothing: "hmm", chromaMethod: "gaussian-log" },
  "cqt + hmm (opt-in)": { chordSmoothing: "hmm", chromaMethod: "cqt" },
};

/** The AI chord method (Basic Pitch), run when onnxruntime-node is available. */
export const AI_CHORD_METHOD = "AI note reader (opt-in)";

export const KEY_METHODS = [
  "default (energy, Krumhansl)",
  "gaussian-log (energy, Krumhansl, opt-in)",
  "presence (default live path)",
  "live engine, profile (default)",
  "live engine, chords vote (opt-in)",
] as const;

export const TEMPO_METHODS: Record<string, TempoAnalyzerMethod> = {
  "default (TempoAnalyzer)": "envelope",
  "flux (opt-in)": "flux",
};

/** The live analyser framing: 10 fps, 16384 points from 32 kHz up, 4096 below. */
function analyser(sampleRate: number): { fftSize: number; hop: number } {
  return { fftSize: sampleRate >= 32_000 ? 16_384 : 4096, hop: Math.round(sampleRate / 10) };
}

/** The offline key framing: 8192 / 2048 from 32 kHz up, 4096 / 1024 below (same spacing). */
function keyFraming(sampleRate: number) {
  return sampleRate >= 32_000
    ? { fftSize: 8192, hopSize: 2048, minFreq: 55, maxFreq: 5000 }
    : { fftSize: 4096, hopSize: 1024, minFreq: 55, maxFreq: 5000 };
}

const PRESENCE = {
  liveAcquisitionSeconds: 8,
  tonalityAcquisitionSeconds: 30,
  filter: { tolerancy: 0.35, memory: 3, mode: "mean" as const },
};

type Ctx = { condition: string; split: Split };

function rec(
  task: Rec["task"],
  metric: string,
  method: string,
  item: ItemBase,
  ctx: Ctx,
  x: number,
  m: number,
): Rec {
  return {
    task,
    metric,
    method,
    condition: ctx.condition,
    split: ctx.split,
    source: item.source,
    stratum: item.stratum,
    cluster: item.cluster,
    item: item.id,
    x,
    m,
  };
}

export interface ChordDetail {
  condition: string;
  split: Split;
  method: string;
  score: ProgressionScore;
}

/** What a frame shows: the top chord, or nothing when "no chord" outweighs it. */
function shown(frame: TonalityFrame): { answer: string | null } {
  const top = frame.chords[0];
  if (!top || (frame.noChordProbability ?? 0) > top.probability) return { answer: null };
  return { answer: chordPitchClasses(top.root, top.quality).join(",") };
}

/** The live CQT path: the latest 32768 samples (what an AnalyserNode keeps) at every frame. */
function runTimeDomain(
  samples: Float32Array,
  sr: number,
  cfg: Partial<TonalityEngineConfig>,
  fftSize: number,
  hop: number,
) {
  const engine = new TonalityEngine({ framesPerSecond: 10, ...cfg });
  const out: { time: number; answer: string | null }[] = [];
  for (let end = fftSize; end <= samples.length; end += hop) {
    const frame = engine.processTimeDomain(samples.subarray(Math.max(0, end - 32768), end), sr);
    out.push({ time: end / sr, ...shown(frame) });
  }
  return out;
}

/**
 * The AI path as it runs live: audio pushed in 0.25 s blocks, the model run
 * after each one, and every display frame (10 a second) showing the newest
 * decision available at that moment, look-ahead and all.
 */
async function runNoteModel(samples: Float32Array, sr: number, fftSize: number, hop: number) {
  const runner = await nodeBasicPitchRunner();
  if (!runner) return null;
  const live = new NoteModelChords({ sampleRate: sr });
  const block = Math.round(sr / 4);
  const decisions: { at: number; answer: string | null }[] = [];
  for (let i = 0; i < samples.length; i += block) {
    live.push(samples.subarray(i, Math.min(samples.length, i + block)));
    const res = await live.analyse(runner);
    const c = res?.chord;
    decisions.push({
      at: Math.min(samples.length, i + block) / sr,
      answer: c ? chordPitchClasses(c.root, c.quality).join(",") : null,
    });
  }
  const out: { time: number; answer: string | null }[] = [];
  let k = -1;
  for (let end = fftSize; end <= samples.length; end += hop) {
    const t = end / sr;
    while (k + 1 < decisions.length && decisions[k + 1].at <= t) k++;
    out.push({ time: t, answer: k >= 0 ? decisions[k].answer : null });
  }
  return out;
}

export async function runChords(
  item: ChordItem,
  samples: Float32Array,
  ctx: Ctx,
): Promise<{ recs: Rec[]; details: ChordDetail[] }> {
  const sr = item.audio.sampleRate;
  const { fftSize, hop } = analyser(sr);
  const frames = analyserFrames(samples, fftSize, hop);
  const recs: Rec[] = [];
  const details: ChordDetail[] = [];
  const runs: [string, { time: number; answer: string | null }[] | null][] = Object.entries(
    CHORD_METHODS,
  ).map(([method, cfg]) => [
    method,
    cfg.chromaMethod === "cqt"
      ? runTimeDomain(samples, sr, cfg, fftSize, hop)
      : runFrames(frames, cfg, { sampleRate: sr, fftSize, fps: 10 }),
  ]);
  runs.push([AI_CHORD_METHOD, await runNoteModel(samples, sr, fftSize, hop)]);
  for (const [method, out] of runs) {
    if (!out) continue;
    const score = scoreProgression(item.reference, out);
    if (score.frames === 0) continue;
    recs.push(
      rec("chords", "accuracy", method, item, ctx, score.correct / score.frames, score.frames),
    );
    details.push({ condition: ctx.condition, split: ctx.split, method, score });
  }
  return { recs, details };
}

export function runKeys(item: KeyItem, samples: Float32Array, ctx: Ctx): Rec[] {
  const sr = item.audio.sampleRate;
  const audio = { samples, sampleRate: sr, durationSeconds: samples.length / sr };
  const framing = keyFraming(sr);
  const nearest = computeChromaSequence(audio, framing);
  const gaussian = computeChromaSequence(audio, { ...framing, chroma: GAUSSIAN_LOG_CHROMA });
  const answers: [string, KeyRef | undefined][] = [
    [KEY_METHODS[0], analyzeOverall(nearest, 0).keys[0]],
    [KEY_METHODS[1], analyzeOverall(gaussian, 0).keys[0]],
    [
      KEY_METHODS[2],
      runPresenceTonality(nearest, { ...PRESENCE, framesPerSecond: sr / framing.hopSize }).keys[0],
    ],
  ];
  // The live engine over the whole item (its long window covers it), profile and chords vote.
  const { fftSize, hop } = analyser(sr);
  const dbFrames = analyserFrames(samples, fftSize, hop);
  for (const [method, keyMethod] of [
    [KEY_METHODS[3], "profile"],
    [KEY_METHODS[4], "chords"],
  ] as const) {
    const engine = new TonalityEngine({
      framesPerSecond: 10,
      tonalityAcquisitionSeconds: Math.ceil(samples.length / sr) + 1,
      keyMethod,
    });
    let frame: TonalityFrame | null = null;
    for (const db of dbFrames) frame = engine.processDbSpectrum(db, sr);
    answers.push([method, frame?.tonalityKeys[0]]);
  }
  const recs: Rec[] = [];
  for (const [method, k] of answers) {
    if (!k) continue;
    const strict = keyStrict(k, item.key) ? 1 : 0;
    recs.push(rec("keys", "strict", method, item, ctx, strict, 1));
    recs.push(rec("keys", "merged", method, item, ctx, keyMerged(k, item.key) ? 1 : 0, 1));
    recs.push(rec("keys", "mirex", method, item, ctx, keyMirex(k, item.key), 1));
    recs.push(rec("keys", `strict:${item.key.mode}`, method, item, ctx, strict, 1));
  }
  return recs;
}

/** One tempo reading a second once the 8 s window is full; shares of right readings. */
export function runTempo(item: TempoItem, samples: Float32Array, ctx: Ctx): Rec[] {
  return Object.entries(TEMPO_METHODS).flatMap(([method, m]) =>
    runTempoWith(item, samples, ctx, method, m),
  );
}

function runTempoWith(
  item: TempoItem,
  samples: Float32Array,
  ctx: Ctx,
  method: string,
  tempoMethod: TempoAnalyzerMethod,
): Rec[] {
  const sr = item.audio.sampleRate;
  const analyzer = new TempoAnalyzer({ sampleRate: sr, method: tempoMethod });
  const readings: number[] = [];
  const block = 512;
  let nextRead = 8;
  for (let i = 0; i < samples.length; i += block) {
    analyzer.pushSamples(samples.subarray(i, Math.min(samples.length, i + block)));
    const t = Math.min(samples.length, i + block) / sr;
    if (t >= nextRead) {
      const est = analyzer.analyze().estimate;
      readings.push(est ? est.bpm : NaN);
      nextRead += 1;
    }
  }
  if (readings.length === 0) return [];
  const share = (f: (bpm: number) => boolean) =>
    readings.filter((b) => Number.isFinite(b) && f(b)).length / readings.length;
  return [
    rec(
      "tempo",
      "acc1",
      method,
      item,
      ctx,
      share((b) => tempoAcc1(b, item.bpm)),
      1,
    ),
    rec(
      "tempo",
      "acc2",
      method,
      item,
      ctx,
      share((b) => tempoAcc2(b, item.bpm)),
      1,
    ),
    rec(
      "tempo",
      "octave",
      method,
      item,
      ctx,
      share((b) => tempoOctaveError(b, item.bpm)),
      1,
    ),
  ];
}

export interface OnsetDetail {
  condition: string;
  split: Split;
  errors: number[];
}

/** Seconds of noise alone before the music, for the gate to learn the room. */
export const PRE_ROLL = 4;

export const ONSET_BENCH_METHODS: Record<string, OnsetMethod> = {
  "default (classic)": "classic",
  "sensitive (opt-in)": "sensitive",
  "superflux-complex (opt-in)": "superflux-complex",
};

export function detectOnsets(
  samples: Float32Array,
  sampleRate: number,
  method: OnsetMethod = "classic",
): number[] {
  const pipeline = new OnsetPipeline({ sampleRate, method });
  return pushChunks(samples, (chunk, frame) => pipeline.push(chunk, frame).onsets, [512]).map(
    (o) => o.time,
  );
}

/** `samples` already holds the pre-roll when `preRoll` > 0. */
export function runOnsets(
  item: OnsetItem,
  samples: Float32Array,
  preRoll: number,
  ctx: Ctx,
): { recs: Rec[]; detail: OnsetDetail } {
  const sr = item.audio.sampleRate;
  const reference = item.onsets.map((t) => t + preRoll);
  const n = Math.max(1, reference.length);
  const recs: Rec[] = [];
  let errors: number[] = [];
  for (const [method, m] of Object.entries(ONSET_BENCH_METHODS)) {
    const estimated = detectOnsets(samples, sr, m).filter((t) => t >= preRoll - 0.05);
    const s = onsetScore(reference, estimated);
    if (m === "classic") errors = s.errors;
    recs.push(
      rec("onsets", "f", method, item, ctx, s.f, n),
      rec("onsets", "precision", method, item, ctx, s.precision, n),
      rec("onsets", "recall", method, item, ctx, s.recall, n),
      ...(item.part ? [rec("onsets", `f:${item.part}`, method, item, ctx, s.f, n)] : []),
    );
  }
  return { recs, detail: { condition: ctx.condition, split: ctx.split, errors } };
}

export interface NoiseControl {
  condition: string;
  onsetsPerMinute: number;
  /** Share of frames showing a chord, per chord method. */
  chordShown: Record<string, number>;
  tempo: { bpm: number | null; confidence: number | null };
  key: { name: string; probability: number } | null;
}

/** What the detectors report on noise alone (no music). */
export function runNoiseControl(
  noise: Float32Array,
  sampleRate: number,
  condition: string,
): NoiseControl {
  const minutes = noise.length / sampleRate / 60;
  const onsets = detectOnsets(noise, sampleRate).length / minutes;
  const { fftSize, hop } = analyser(sampleRate);
  const frames = analyserFrames(noise, fftSize, hop);
  const chordShown: Record<string, number> = {};
  for (const [method, cfg] of Object.entries(CHORD_METHODS)) {
    const out = runFrames(frames, cfg, { sampleRate, fftSize, fps: 10 });
    chordShown[method] = out.filter((o) => o.answer !== null).length / Math.max(1, out.length);
  }
  const tempo = new TempoAnalyzer({ sampleRate });
  tempo.pushSamples(noise);
  const est = tempo.analyze().estimate;
  const audio = { samples: noise, sampleRate, durationSeconds: noise.length / sampleRate };
  const k = analyzeOverall(computeChromaSequence(audio, keyFraming(sampleRate)), 0).keys[0];
  return {
    condition,
    onsetsPerMinute: Math.round(onsets * 10) / 10,
    chordShown,
    tempo: {
      bpm: est ? Math.round(est.bpm) : null,
      confidence: est ? Math.round(est.confidence * 100) / 100 : null,
    },
    key: k ? { name: k.name, probability: Math.round(k.probability * 100) / 100 } : null,
  };
}

// --- pitch ---------------------------------------------------------------------------------

const CREPE_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/lab/public/models/crepe-tiny/crepe-tiny.bin",
);
let crepeModel: CrepeModel | null | undefined;
function crepe(): CrepeModel | null {
  if (crepeModel === undefined) {
    crepeModel = existsSync(CREPE_FILE)
      ? parseCrepeModel(new Uint8Array(readFileSync(CREPE_FILE)).buffer)
      : null;
  }
  return crepeModel;
}

interface Tracker {
  push(samples: ArrayLike<number>): void;
  readonly estimate: PitchEstimate | null;
}

export const PITCH_METHODS: Record<string, (sr: number) => Tracker | null> = {
  "default (MPM tracker)": (sr) => new PitchTracker({ sampleRate: sr }),
  "pYIN (opt-in)": (sr) => new PyinTracker({ sampleRate: sr }),
  "CREPE tiny (opt-in)": (sr) => {
    const m = crepe();
    return m ? new CrepeTracker(m, { sampleRate: sr }) : null;
  },
};

/**
 * Each tracker as the tuner runs it: samples pushed in 512-sample blocks,
 * the display reading the estimate ten times a second, compared with the
 * reference at that moment.
 */
export function runPitch(item: PitchItem, samples: Float32Array, ctx: Ctx): Rec[] {
  const sr = item.audio.sampleRate;
  const recs: Rec[] = [];
  for (const [method, make] of Object.entries(PITCH_METHODS)) {
    const tracker = make(sr);
    if (!tracker) continue;
    let voiced = 0;
    let w50 = 0;
    let w10 = 0;
    let octave = 0;
    let unvoiced = 0;
    let falseVoice = 0;
    let nextRead = 0.1;
    for (let i = 0; i < samples.length; i += 512) {
      tracker.push(samples.subarray(i, Math.min(samples.length, i + 512)));
      const t = Math.min(samples.length, i + 512) / sr;
      if (t < nextRead) continue;
      nextRead += 0.1;
      const ref = item.f0[Math.round(t * 100)];
      if (ref === undefined || Number.isNaN(ref)) continue;
      const est = tracker.estimate?.frequency ?? 0;
      if (ref === 0) {
        unvoiced++;
        if (est > 0) falseVoice++;
        continue;
      }
      voiced++;
      if (!(est > 0)) continue;
      const cents = Math.abs(1200 * Math.log2(est / ref));
      if (cents <= 50) w50++;
      if (cents <= 10) w10++;
      if (Math.abs(cents - 1200) <= 50 || Math.abs(cents - 1902) <= 50) octave++;
    }
    if (voiced > 0) {
      recs.push(rec("pitch", "rpa50", method, item, ctx, w50 / voiced, voiced));
      recs.push(rec("pitch", "rpa10", method, item, ctx, w10 / voiced, voiced));
      recs.push(rec("pitch", "octave", method, item, ctx, octave / voiced, voiced));
    }
    if (unvoiced > 0)
      recs.push(rec("pitch", "falseVoice", method, item, ctx, falseVoice / unvoiced, unvoiced));
  }
  return recs;
}
