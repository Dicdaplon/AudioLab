/**
 * Parameter sweep for the chord detector and the ToneBaseTonality pipeline.
 *
 * Runs offline on the project's sample mp3s, scores every parameter
 * combination against the known ground truth (chord grids and tonality),
 * and prints the best combinations.
 *
 * Usage:  npm run sweep
 *
 * Sample naming convention (FL Studio batch):
 *   <ChordGrid>_<transpositionSemitones>_<variantInstrument>.mp3
 *   e.g. CAmDmG_2_2.mp3  →  C, Am, Dm, G transposed +2 semitones, variant 2
 *
 * The chord grid string is parsed as a concatenation of chord tokens:
 *   [A-G] [#]? [m]?   (e.g. "C", "F#", "Am", "C#m")
 *
 * Scoring (per sample):
 *   - chord_score   : (# unique expected chords appearing in top-(N+2) of histogram) / N
 *   - tonality_score: based on rank of the accepted key in the ranked list
 *                     1 - (rank-1)/5, clamped to [0, 1] (so rank 1 → 1, rank ≥ 6 → 0)
 *
 * The accepted tonality set is {expected key, relative key} — so an Am sample
 * also accepts C major and vice-versa.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeChromaSequence,
  decodeAudioFile,
  runPresenceTonality,
  slidingChordHistogram,
} from "../tests/helpers/offlinePipeline";
import { NOTE_NAMES } from "../src/utils/notes";
import {
  keyShortName,
  type KeyScore,
} from "../src/analysis/keyDetection";
import type { HighWaterMarkMode } from "../src/analysis/highWaterMark";

// -----------------------------------------------------------------------------
// Paths
// -----------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const SAMPLES_DIR = path.join(PROJECT_ROOT, "tests", "Sample");
const FL_DIR = path.join(SAMPLES_DIR, "FLStudio");

// -----------------------------------------------------------------------------
// Chord grid parsing
// -----------------------------------------------------------------------------

function parseChordSequence(s: string): string[] {
  const chords: string[] = [];
  let i = 0;
  while (i < s.length) {
    if (!/[A-G]/.test(s[i])) {
      throw new Error(`expected note name at index ${i} of "${s}"`);
    }
    let end = i + 1;
    if (end < s.length && s[end] === "#") end++;
    if (end < s.length && s[end] === "m") end++;
    chords.push(s.slice(i, end));
    i = end;
  }
  return chords;
}

function transposeChord(chord: string, semitones: number): string {
  const isMinor = chord.endsWith("m");
  const base = isMinor ? chord.slice(0, -1) : chord;
  const idx = NOTE_NAMES.indexOf(base);
  if (idx < 0) throw new Error(`unknown chord root: ${base}`);
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return NOTE_NAMES[newIdx] + (isMinor ? "m" : "");
}

function relativeKeyShortName(shortName: string): string {
  // "Am" → "C", "C" → "Am", "F#m" → "A", "D" → "Bm", etc.
  const isMinor = shortName.endsWith("m");
  const base = isMinor ? shortName.slice(0, -1) : shortName;
  const idx = NOTE_NAMES.indexOf(base);
  if (idx < 0) throw new Error(`unknown key root: ${base}`);
  if (isMinor) {
    return NOTE_NAMES[(idx + 3) % 12];
  } else {
    return NOTE_NAMES[(idx + 9) % 12] + "m";
  }
}

function chordRootToKeyShort(rootChord: string): string {
  // The first chord of a progression is the tonic; its mode = the key mode.
  return rootChord;
}

// -----------------------------------------------------------------------------
// Sample definitions (ground truth)
// -----------------------------------------------------------------------------

interface SampleGroundTruth {
  file: string;
  /** Path relative to PROJECT_ROOT. */
  pathParts: string[];
  /** Chord grid (in order) if known. */
  expectedChords?: string[];
  /** Set of acceptable tonality short-names (key + relative). */
  acceptedKeys: string[];
  /** Tag for reporting (e.g. "clean", "fl-noisy"). */
  tag: string;
}

const SAMPLES: SampleGroundTruth[] = (() => {
  const out: SampleGroundTruth[] = [];

  // Existing clean samples.
  const cleanChord: Array<[string, string[], string]> = [
    ["AmDmEAm.mp3", ["Am", "Dm", "E", "Am"], "Am"],
    ["AmGFE.mp3", ["Am", "G", "F", "E"], "Am"],
  ];
  for (const [file, chords, tonic] of cleanChord) {
    out.push({
      file,
      pathParts: ["tests", "Sample", file],
      expectedChords: chords,
      acceptedKeys: [tonic, relativeKeyShortName(tonic)],
      tag: "clean-chord",
    });
  }
  const cleanTonal: Array<[string, string]> = [
    ["AmTona.mp3", "Am"],
    ["BmTona.mp3", "Bm"],
    ["F#mTona.mp3", "F#m"],
  ];
  for (const [file, tonic] of cleanTonal) {
    out.push({
      file,
      pathParts: ["tests", "Sample", file],
      acceptedKeys: [tonic, relativeKeyShortName(tonic)],
      tag: "clean-tonality",
    });
  }

  // FL Studio noisy samples.
  for (const file of [
    "CAmDmG_0_1.mp3",
    "CAmDmG_0_2.mp3",
    "CAmDmG_0_3.mp3",
    "CAmDmG_2_1.mp3",
    "CAmDmG_2_2.mp3",
    "CAmDmG_2_3.mp3",
  ]) {
    const base = file.replace(/\.mp3$/, "");
    const [chordStr, tStr] = base.split("_");
    const semitones = parseInt(tStr, 10);
    const chords = parseChordSequence(chordStr).map((c) =>
      transposeChord(c, semitones),
    );
    const tonicKey = chordRootToKeyShort(chords[0]); // first chord = tonic
    out.push({
      file,
      pathParts: ["tests", "Sample", "FLStudio", file],
      expectedChords: chords,
      acceptedKeys: [tonicKey, relativeKeyShortName(tonicKey)],
      tag: "fl-noisy",
    });
  }

  // Backing track extracts (30 s each, mid-track). Tonality-only — no
  // explicit chord grid ground truth.
  const backings: Array<[string, string]> = [
    ["BackingBm1_a.wav", "Bm"],
    ["BackingBm1_b.wav", "Bm"],
    ["BackingBm1_c.wav", "Bm"],
    ["BackingDm1_a.wav", "Dm"],
    ["BackingDm1_b.wav", "Dm"],
    ["BackingDm1_c.wav", "Dm"],
  ];
  for (const [file, tonic] of backings) {
    out.push({
      file,
      pathParts: ["tests", "Sample", "Backing", file],
      acceptedKeys: [tonic, relativeKeyShortName(tonic)],
      tag: "backing",
    });
  }

  return out;
})();

// -----------------------------------------------------------------------------
// Loading
// -----------------------------------------------------------------------------

const FRAME_OPTIONS = { fftSize: 8192, hopSize: 2048, minFreq: 55, maxFreq: 5000 };

interface LoadedSample {
  gt: SampleGroundTruth;
  chromas: Float32Array[];
  sampleRate: number;
  durationSeconds: number;
}

async function loadAllSamples(): Promise<LoadedSample[]> {
  const loaded: LoadedSample[] = [];
  for (const gt of SAMPLES) {
    const filePath = path.join(PROJECT_ROOT, ...gt.pathParts);
    process.stdout.write(`  loading ${gt.file}... `);
    const audio = await decodeAudioFile(filePath);
    const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
    loaded.push({
      gt,
      chromas,
      sampleRate: audio.sampleRate,
      durationSeconds: audio.durationSeconds,
    });
    process.stdout.write(
      `${audio.durationSeconds.toFixed(1)}s, ${chromas.length} frames\n`,
    );
  }
  return loaded;
}

// -----------------------------------------------------------------------------
// Scoring
// -----------------------------------------------------------------------------

function chordScoreForSample(found: string[], expected: string[]): number {
  const unique = Array.from(new Set(expected));
  let hits = 0;
  for (const c of unique) if (found.includes(c)) hits++;
  return hits / unique.length;
}

function tonalityScoreForSample(keys: KeyScore[], accepted: string[]): number {
  for (let i = 0; i < keys.length; i++) {
    if (accepted.includes(keys[i].shortName)) {
      // Linear decay: rank 1 → 1.0, rank 6+ → 0.
      return Math.max(0, 1 - i / 5);
    }
  }
  return 0;
}

// -----------------------------------------------------------------------------
// Chord sweep
// -----------------------------------------------------------------------------

interface ChordParams {
  chordWindowSec: number;
  chordStrideSec: number;
}

interface ChordSweepResult {
  params: ChordParams;
  meanScore: number;
  perSample: Array<{ file: string; tag: string; score: number; top: string[] }>;
}

function sweepChord(samples: LoadedSample[]): ChordSweepResult[] {
  const grid: ChordParams[] = [];
  for (const cw of [0.5, 0.75, 1.0, 1.5, 2.0]) {
    for (const cs of [0.1, 0.25, 0.5]) {
      grid.push({ chordWindowSec: cw, chordStrideSec: cs });
    }
  }

  const eligible = samples.filter((s) => s.gt.expectedChords);

  const results: ChordSweepResult[] = [];
  for (const params of grid) {
    let sum = 0;
    const perSample: ChordSweepResult["perSample"] = [];
    for (const s of eligible) {
      const frameRate = s.sampleRate / FRAME_OPTIONS.hopSize;
      const wFr = Math.max(1, Math.round(params.chordWindowSec * frameRate));
      const sFr = Math.max(1, Math.round(params.chordStrideSec * frameRate));
      const hist = slidingChordHistogram(s.chromas, wFr, sFr);
      const topN = s.gt.expectedChords!.length + 2;
      const top = hist.entries.slice(0, topN);
      const found = top.map((e) => e.name);
      const score = chordScoreForSample(found, s.gt.expectedChords!);
      sum += score;
      perSample.push({
        file: s.gt.file,
        tag: s.gt.tag,
        score,
        top: top.map((e) => `${e.name}(${(e.fraction * 100).toFixed(0)}%)`),
      });
    }
    results.push({ params, meanScore: sum / eligible.length, perSample });
  }

  results.sort((a, b) => b.meanScore - a.meanScore);
  return results;
}

// -----------------------------------------------------------------------------
// Tonality sweep
// -----------------------------------------------------------------------------

interface TonalityParams {
  liveAcquisitionSeconds: number;
  tonalityAcquisitionSeconds: number;
  maxFilterTolerancy: number;
  maxFilterMemory: number;
  maxFilterMode: HighWaterMarkMode;
}

interface TonalitySweepResult {
  params: TonalityParams;
  meanScore: number;
  perTagMean: Record<string, number>;
  perSample: Array<{ file: string; tag: string; score: number; top: string[] }>;
}

function sweepTonality(samples: LoadedSample[]): TonalitySweepResult[] {
  const grid: TonalityParams[] = [];
  for (const liveSec of [4, 8, 12, 16]) {
    for (const tonSec of [15, 30, 60]) {
      for (const tol of [0.2, 0.35, 0.5, 0.65, 0.8]) {
        for (const mem of [3, 5, 10]) {
          for (const mode of ["mean", "median"] as HighWaterMarkMode[]) {
            grid.push({
              liveAcquisitionSeconds: liveSec,
              tonalityAcquisitionSeconds: tonSec,
              maxFilterTolerancy: tol,
              maxFilterMemory: mem,
              maxFilterMode: mode,
            });
          }
        }
      }
    }
  }

  const results: TonalitySweepResult[] = [];
  for (const params of grid) {
    let sum = 0;
    const perSample: TonalitySweepResult["perSample"] = [];
    for (const s of samples) {
      const frameRate = s.sampleRate / FRAME_OPTIONS.hopSize;
      const out = runPresenceTonality(s.chromas, {
        liveAcquisitionSeconds: params.liveAcquisitionSeconds,
        tonalityAcquisitionSeconds: params.tonalityAcquisitionSeconds,
        framesPerSecond: frameRate,
        filter: {
          tolerancy: params.maxFilterTolerancy,
          memory: params.maxFilterMemory,
          mode: params.maxFilterMode,
        },
      });
      const score = tonalityScoreForSample(out.keys, s.gt.acceptedKeys);
      sum += score;
      perSample.push({
        file: s.gt.file,
        tag: s.gt.tag,
        score,
        top: out.keys
          .slice(0, 3)
          .map((k) => `${k.shortName}(${(k.probability * 100).toFixed(0)}%)`),
      });
    }
    const tagBuckets = new Map<string, number[]>();
    for (const s of perSample) {
      const bucket = tagBuckets.get(s.tag) ?? [];
      bucket.push(s.score);
      tagBuckets.set(s.tag, bucket);
    }
    const perTagMean: Record<string, number> = {};
    for (const [tag, scores] of tagBuckets) {
      perTagMean[tag] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    results.push({
      params,
      meanScore: sum / samples.length,
      perTagMean,
      perSample,
    });
  }

  results.sort((a, b) => b.meanScore - a.meanScore);
  return results;
}

// -----------------------------------------------------------------------------
// Reporting
// -----------------------------------------------------------------------------

function printChordTop(results: ChordSweepResult[], topN: number): void {
  console.log(
    "  rank | score | window | stride | per-sample (score · top-N · file)",
  );
  console.log("  ".padEnd(64, "-"));
  for (let i = 0; i < Math.min(topN, results.length); i++) {
    const r = results[i];
    console.log(
      `  ${String(i + 1).padStart(4)} | ${r.meanScore.toFixed(3)} | ${r.params.chordWindowSec.toFixed(2)}s | ${r.params.chordStrideSec.toFixed(2)}s`,
    );
  }
}

function printChordDetail(best: ChordSweepResult): void {
  console.log(
    `\n  best chord params : window=${best.params.chordWindowSec}s, stride=${best.params.chordStrideSec}s`,
  );
  console.log(`  per-sample breakdown:`);
  for (const s of best.perSample) {
    console.log(`    [${s.tag}] ${s.file}  score=${s.score.toFixed(2)}  top: [${s.top.join(", ")}]`);
  }
}

function printTonalityTop(results: TonalitySweepResult[], topN: number): void {
  // Discover tags from the first row.
  const tags = Object.keys(results[0]?.perTagMean ?? {});
  const tagHeader = tags.map((t) => t.padEnd(15)).join(" ");
  console.log(
    `  rank | score | live | ton  | tol  | mem | mode    | ${tagHeader}`,
  );
  console.log("  ".padEnd(72 + tagHeader.length, "-"));
  for (let i = 0; i < Math.min(topN, results.length); i++) {
    const r = results[i];
    const tagCols = tags
      .map((t) => `${t}:${(r.perTagMean[t] ?? 0).toFixed(2)}`.padEnd(15))
      .join(" ");
    console.log(
      `  ${String(i + 1).padStart(4)} | ${r.meanScore.toFixed(3)} | ${r.params.liveAcquisitionSeconds.toString().padStart(2)}s  | ${r.params.tonalityAcquisitionSeconds.toString().padStart(3)}s | ${r.params.maxFilterTolerancy.toFixed(2)} | ${r.params.maxFilterMemory.toString().padStart(2)}  | ${r.params.maxFilterMode.padEnd(6)} | ${tagCols}`,
    );
  }
}

/** Print, for each tag, the single combo that maximizes that tag's score. */
function printBestPerTag(results: TonalitySweepResult[]): void {
  const tags = Object.keys(results[0]?.perTagMean ?? {});
  console.log("\nBest combo PER TAG (showing global score in brackets):");
  for (const tag of tags) {
    let bestIdx = 0;
    for (let i = 1; i < results.length; i++) {
      if ((results[i].perTagMean[tag] ?? 0) > (results[bestIdx].perTagMean[tag] ?? 0)) {
        bestIdx = i;
      }
    }
    const r = results[bestIdx];
    const tagScore = (r.perTagMean[tag] ?? 0).toFixed(3);
    console.log(
      `  [${tag.padEnd(15)}] tagScore=${tagScore} (global=${r.meanScore.toFixed(3)})  live=${r.params.liveAcquisitionSeconds}s ton=${r.params.tonalityAcquisitionSeconds}s tol=${r.params.maxFilterTolerancy} mem=${r.params.maxFilterMemory} ${r.params.maxFilterMode}`,
    );
  }
}

function printTonalityDetail(best: TonalitySweepResult): void {
  console.log(
    `\n  best tonality params : live=${best.params.liveAcquisitionSeconds}s, ton=${best.params.tonalityAcquisitionSeconds}s, tol=${best.params.maxFilterTolerancy}, mem=${best.params.maxFilterMemory}, mode=${best.params.maxFilterMode}`,
  );
  console.log(`  per-sample breakdown:`);
  for (const s of best.perSample) {
    console.log(`    [${s.tag}] ${s.file}  score=${s.score.toFixed(2)}  top3: [${s.top.join(", ")}]`);
  }
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

(async () => {
  console.log(`Parameter sweep — ${SAMPLES.length} samples\n`);
  console.log("Loading samples (decode mp3 + compute chromas once each):");
  const t0 = Date.now();
  const samples = await loadAllSamples();
  console.log(`Loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  // ----- Chord sweep -----
  console.log("=".repeat(72));
  console.log("CHORD SWEEP");
  console.log("=".repeat(72));
  const tChord0 = Date.now();
  const chordResults = sweepChord(samples);
  console.log(
    `Tried ${chordResults.length} combinations in ${((Date.now() - tChord0) / 1000).toFixed(1)}s\n`,
  );
  console.log("Top 10:");
  printChordTop(chordResults, 10);
  printChordDetail(chordResults[0]);

  // ----- Tonality sweep -----
  console.log("\n" + "=".repeat(72));
  console.log("TONALITY (ToneBaseTonality) SWEEP");
  console.log("=".repeat(72));
  const tTon0 = Date.now();
  const tonResults = sweepTonality(samples);
  console.log(
    `Tried ${tonResults.length} combinations in ${((Date.now() - tTon0) / 1000).toFixed(1)}s\n`,
  );
  console.log("Top 10:");
  printTonalityTop(tonResults, 10);
  printBestPerTag(tonResults);
  printTonalityDetail(tonResults[0]);

  // ----- Recommended defaults -----
  console.log("\n" + "=".repeat(72));
  console.log("RECOMMENDED DEFAULTS");
  console.log("=".repeat(72));
  const bc = chordResults[0];
  const bt = tonResults[0];
  console.log(`
Chord detection:
  chordWindowSeconds = ${bc.params.chordWindowSec}
  chordStrideSeconds = ${bc.params.chordStrideSec}

ToneBaseTonality:
  liveAcquisitionSeconds     = ${bt.params.liveAcquisitionSeconds}
  tonalityAcquisitionSeconds = ${bt.params.tonalityAcquisitionSeconds}
  maxFilterTolerancy         = ${bt.params.maxFilterTolerancy}
  maxFilterMemory            = ${bt.params.maxFilterMemory}
  maxFilterMode              = "${bt.params.maxFilterMode}"
`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
