/**
 * Chord methods compared on progressions, printed as markdown.
 *
 *   npm run measure:progressions -w packages/core
 *
 * 1. Synthetic guitar progressions (tests/helpers/progressions.ts), change
 *    times known, two tempos: "steady" (1.2–2.4 s per chord) and "fast"
 *    (0.43–0.86 s per chord, where a model expecting 2 s chords should
 *    suffer). Accuracy with a 95 % bootstrap interval over progressions,
 *    delay after a change, missed changes, wrong switches split into
 *    transition artefacts and steady-state flicker, and frames answered
 *    "no chord".
 * 2. The real loops of tests/Sample (AmDmEAm, AmGFE), change times unknown:
 *    share of frames answering a chord of the grid, answer changes per
 *    minute. Both reward inertia: read them with care.
 * 3. JS cost per frame of each method (the FFT itself runs natively in the
 *    AnalyserNode and is the same for all).
 *
 * Every configuration goes through the live path (AnalyserNode emulation at
 * 10 fps → TonalityEngine.processDbSpectrum).
 */
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { CHORD_QUALITIES, chordPitchClasses } from "../src/analysis/chordDetection";
import { TonalityEngine, type TonalityEngineConfig } from "../src/analysis/engine/tonalityEngine";
import { decodeAudioFile } from "../src/offline/decodeAudio";
import { NOTE_NAMES } from "../src/utils/notes";
import { strum, voicingNotes } from "../tests/helpers/guitar";
import {
  bootstrap,
  runEngine,
  scoreProgression,
  summarise,
  syntheticProgression,
  type ProgressionScore,
} from "../tests/helpers/progressions";
import { analyserFrames, concat } from "../tests/helpers/synth";

const SAMPLES = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "tests", "Sample");

interface Method {
  cfg: Partial<TonalityEngineConfig>;
  holdFrames?: number;
}

export const METHODS: Record<string, Method> = {
  "window 1 s (default)": { cfg: {} },
  "window 0.5 s": { cfg: { chordWindowSeconds: 0.5 } },
  "window 0.5 s + hold 2 frames": { cfg: { chordWindowSeconds: 0.5 }, holdFrames: 2 },
  "gaussian-log chroma": { cfg: { chromaMethod: "gaussian-log" } },
  hmm: { cfg: { chordSmoothing: "hmm" } },
  "hmm, lag 0.3 s": { cfg: { chordSmoothing: "hmm", chordHmm: { lagSeconds: 0.3 } } },
  "hmm + gaussian-log": { cfg: { chordSmoothing: "hmm", chromaMethod: "gaussian-log" } },
};

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SNRS = [30, 20];
const SCENARIOS = {
  "steady (100 BPM, 2–4 beats per chord)": { bpm: 100, minBeats: 2, maxBeats: 4 },
  "fast (140 BPM, 1–2 beats per chord)": { bpm: 140, minBeats: 1, maxBeats: 2 },
};

const pct = (x: number) => `${(100 * x).toFixed(1)}`;
const ms = (x: number) => (Number.isFinite(x) ? `${Math.round(1000 * x)}` : "–");

/** "Am" → A minor, "E" → E major (the loops only use triads). */
function parseChordName(name: string) {
  const minor = name.endsWith("m");
  const root = NOTE_NAMES.indexOf(minor ? name.slice(0, -1) : name);
  if (root < 0) throw new Error(`unknown chord ${name}`);
  return { root, quality: minor ? ("min" as const) : ("maj" as const) };
}

function synthetic(): void {
  for (const [label, sc] of Object.entries(SCENARIOS)) {
    const progs = SEEDS.flatMap((seed) =>
      SNRS.map((snrDb) => syntheticProgression({ seed, snrDb, ...sc })),
    );
    const minutes = progs.reduce((s, p) => s + p.seconds, 0) / 60;
    const changes = progs.reduce((s, p) => s + p.chords.length - 1, 0);
    console.log(
      `### Synthetic guitar, ${label}: ${progs.length} progressions, ` +
        `${minutes.toFixed(1)} min, ${changes} changes\n`,
    );
    console.log(
      "| Method | Accuracy % [95 % CI] | Delay median / p90 (ms) | Missed % | " +
        "Wrong switches / min: transition, steady | No chord % |",
    );
    console.log("| --- | --- | --- | --- | --- | --- |");
    for (const [name, m] of Object.entries(METHODS)) {
      const scores: ProgressionScore[] = progs.map((p) =>
        scoreProgression(p, runEngine(p.signal, m.cfg, { holdFrames: m.holdFrames })),
      );
      const s = summarise(scores);
      const [lo, hi] = bootstrap(scores, (x) => summarise(x).accuracy);
      console.log(
        `| ${name} | ${pct(s.accuracy)} [${pct(lo)}–${pct(hi)}] | ` +
          `${ms(s.medianDelay)} / ${ms(s.p90Delay)} | ${pct(s.missedShare)} | ` +
          `${s.wrongTransitionPerMinute.toFixed(1)}, ${s.wrongSteadyPerMinute.toFixed(1)} | ` +
          `${pct(s.silentShare)} |`,
      );
    }
    console.log("");
  }
}

async function realLoops(): Promise<void> {
  const loops = [
    { file: "AmDmEAm.mp3", grid: ["Am", "Dm", "E"] },
    { file: "AmGFE.mp3", grid: ["Am", "G", "F", "E"] },
  ];
  console.log("### Real loops (tests/Sample): change times unknown\n");
  console.log(
    "| Method | " + loops.map((l) => `${l.file}: in grid %, changes / min`).join(" | ") + " |",
  );
  console.log("| --- | " + loops.map(() => "---").join(" | ") + " |");
  // One at a time: the mp3 decoder initialises its wasm module lazily.
  const decoded: Awaited<ReturnType<typeof decodeAudioFile>>[] = [];
  for (const l of loops) decoded.push(await decodeAudioFile(path.join(SAMPLES, l.file)));
  for (const [name, m] of Object.entries(METHODS)) {
    const cells = loops.map((l, i) => {
      const audio = decoded[i];
      const fftSize = audio.sampleRate >= 32_000 ? 16_384 : 4096;
      const out = runEngine(audio.samples, m.cfg, {
        sampleRate: audio.sampleRate,
        fftSize,
        holdFrames: m.holdFrames,
      });
      const grid = new Set(
        l.grid.map((n) => {
          const c = parseChordName(n);
          return chordPitchClasses(c.root, c.quality).join(",");
        }),
      );
      const inGrid = out.filter((o) => o.answer !== null && grid.has(o.answer)).length / out.length;
      let changes = 0;
      for (let k = 1; k < out.length; k++) if (out[k].answer !== out[k - 1].answer) changes++;
      return `${pct(inGrid)}, ${(changes / (audio.durationSeconds / 60)).toFixed(0)}`;
    });
    console.log(`| ${name} | ${cells.join(" | ")} |`);
  }
  console.log("");
}

/** Median JS time per frame, at the live size (48 kHz, 16384-point spectra). */
function cpu(): void {
  const SR = 48_000;
  const shapes = ["x02210", "x32010", "320003", "xx0232"];
  const signal = concat(
    shapes.flatMap((shape, i) =>
      [0, 1, 2, 3].map((b) =>
        strum(voicingNotes(shape), { sampleRate: SR, seconds: 0.6, seed: 10 * i + b, snrDb: 30 }),
      ),
    ),
  );
  const frames = analyserFrames(signal, 16_384, SR / 10);
  const cases: Record<string, Partial<TonalityEngineConfig>> = {
    "window 1 s (default)": {},
    "gaussian-log chroma": { chromaMethod: "gaussian-log" },
    hmm: { chordSmoothing: "hmm" },
    "hmm + gaussian-log": { chordSmoothing: "hmm", chromaMethod: "gaussian-log" },
    "window 1 s, all 11 qualities": { chordQualities: CHORD_QUALITIES },
    "hmm, all 11 qualities": { chordSmoothing: "hmm", chordQualities: CHORD_QUALITIES },
  };
  console.log(
    `### JS cost per frame (${frames.length} frames of 8192 dB bins, Node ${process.version})\n`,
  );
  console.log("| Method | µs / frame (median of 5 runs) | Share of the 100 ms frame budget |");
  console.log("| --- | --- | --- |");
  for (const [name, cfg] of Object.entries(cases)) {
    const runs: number[] = [];
    for (let r = 0; r < 6; r++) {
      const engine = new TonalityEngine({ framesPerSecond: 10, ...cfg });
      const t0 = performance.now();
      for (const db of frames) engine.processDbSpectrum(db, SR);
      if (r > 0) runs.push(((performance.now() - t0) * 1000) / frames.length);
    }
    runs.sort((a, b) => a - b);
    const us = runs[2];
    console.log(`| ${name} | ${us.toFixed(0)} | ${((100 * us) / 100_000).toFixed(2)} % |`);
  }
}

async function main(): Promise<void> {
  synthetic();
  await realLoops();
  cpu();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
