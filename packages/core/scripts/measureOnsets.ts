/**
 * Onset timing accuracy, printed as markdown for docs/TIMING.md.
 *
 *   npm run measure:onsets                          synthetic plucks (tests/helpers/onsets.ts)
 *   npm run measure:onsets -- <audio> <labels.txt>  your recording
 *
 * The labels are an Audacity label track export (File → Export → Labels):
 * one `start<TAB>end<TAB>text` line per note, `start` in seconds at the
 * attack. Each detected onset is matched to the nearest label within
 * ±50 ms (one to one), as in the MIREX onset task; the error is detected −
 * labelled. The whole OnsetPipeline runs (detector + gate), in 512-sample
 * batches like the live capture.
 */

import { readFileSync } from "node:fs";

import { OnsetPipeline } from "../src/analysis/onset/onsetPipeline";
import type { OnsetEvent } from "../src/analysis/onset/onsetDetector";
import { decodeAudioFile } from "../src/offline/decodeAudio";
import {
  melody,
  performance,
  pushChunks,
  strums,
  strumsSpread,
  type NoteHit,
  type PerformanceOptions,
} from "../tests/helpers/onsets";

const TOLERANCE_MS = 50;

interface Row {
  name: string;
  notes: number;
  f: number;
  precision: number;
  recall: number;
  medianAbsMs: number;
  p90AbsMs: number;
  meanMs: number;
  localized: number;
  decisionMs: number;
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

function evaluate(
  name: string,
  onsets: OnsetEvent[],
  truthSeconds: number[],
  sampleRate: number,
): Row {
  const used = new Set<number>();
  const errors: number[] = [];
  let localized = 0;
  for (const t of truthSeconds) {
    let best = -1;
    let bestD = Infinity;
    onsets.forEach((o, i) => {
      const d = Math.abs(o.time - t);
      if (!used.has(i) && d < bestD) {
        best = i;
        bestD = d;
      }
    });
    if (best >= 0 && bestD * 1000 <= TOLERANCE_MS) {
      used.add(best);
      errors.push((onsets[best].time - t) * 1000);
      if (onsets[best].localized) localized++;
    }
  }
  const tp = errors.length;
  const precision = onsets.length ? tp / onsets.length : 0;
  const recall = truthSeconds.length ? tp / truthSeconds.length : 0;
  const abs = errors.map(Math.abs);
  return {
    name,
    notes: truthSeconds.length,
    f: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    precision,
    recall,
    medianAbsMs: quantile(abs, 0.5),
    p90AbsMs: quantile(abs, 0.9),
    meanMs: errors.reduce((s, e) => s + e, 0) / Math.max(1, tp),
    localized: tp ? localized / tp : 0,
    decisionMs:
      onsets.reduce((s, o) => s + (o.decidedAtFrame - o.frame), 0) /
      Math.max(1, onsets.length) /
      (sampleRate / 1000),
  };
}

function run(signal: Float32Array, sampleRate: number): OnsetEvent[] {
  const pipeline = new OnsetPipeline({ sampleRate });
  return pushChunks(signal, (chunk, frame) => pipeline.push(chunk, frame).onsets, [512]);
}

function synthetic(name: string, hits: NoteHit[], opts: PerformanceOptions): Row {
  const { signal, startFrames } = performance(hits, opts);
  const sr = opts.sampleRate ?? 48000;
  return evaluate(
    name,
    run(signal, sr),
    startFrames.map((f) => f / sr),
    sr,
  );
}

function table(rows: Row[]): string {
  const pct = (x: number) => `${Math.round(100 * x)} %`;
  const ms = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : "—");
  return [
    "| Case | Notes | F (±50 ms) | Precision | Recall | Median abs. error | p90 abs. error | Mean error | Attack found | Decision delay |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.name} | ${r.notes} | ${r.f.toFixed(2)} | ${pct(r.precision)} | ${pct(r.recall)} | ` +
        `${ms(r.medianAbsMs)} ms | ${ms(r.p90AbsMs)} ms | ${ms(r.meanMs)} ms | ${pct(r.localized)} | ` +
        `${ms(r.decisionMs)} ms |`,
    ),
  ].join("\n");
}

function readLabels(file: string): number[] {
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => Number.parseFloat(line.split("\t")[0]))
    .filter((t) => Number.isFinite(t));
}

const [audioFile, labelFile] = process.argv.slice(2);

if (audioFile && labelFile) {
  const { samples, sampleRate } = await decodeAudioFile(audioFile);
  const truth = readLabels(labelFile);
  console.log(table([evaluate(audioFile, run(samples, sampleRate), truth, sampleRate)]));
} else {
  const rows = [
    synthetic("Single notes, quiet room (−66 dBFS)", melody(40, 0.45, 1), {
      seconds: 19,
      noiseRms: 0.0005,
    }),
    synthetic("Single notes, noisy room (−50 dBFS)", melody(40, 0.45, 2), {
      seconds: 19,
      noiseRms: 0.003,
    }),
    synthetic("Single notes, loud room (−44 dBFS)", melody(40, 0.45, 3), {
      seconds: 19,
      noiseRms: 0.006,
    }),
    synthetic("Fast notes (eighths at 160 BPM)", melody(40, 0.1875, 4), {
      seconds: 8.5,
      noiseRms: 0.001,
    }),
    synthetic("Same note repeated", melody(30, 0.4, 5, 52), { seconds: 13, noiseRms: 0.001 }),
    synthetic("Soft attacks (15 ms ramp, no pick)", melody(40, 0.45, 6), {
      seconds: 19,
      noiseRms: 0.001,
      attackMs: 15,
      pick: false,
    }),
    synthetic("Strummed chords (15–50 ms across the strings)", strums(24, 7), {
      seconds: 20,
      noiseRms: 0.001,
    }),
    synthetic("Slow strums (60–100 ms across the strings)", strumsSpread(24, 8, 12, 20), {
      seconds: 20,
      noiseRms: 0.001,
    }),
  ];
  console.log(table(rows));
}
