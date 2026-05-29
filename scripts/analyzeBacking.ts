/**
 * Verbose analysis of the Backing/* extracts produced by extractBackingExtracts.ts.
 * Prints chord histogram, energy-based tonality, and presence-based tonality
 * for each excerpt, with the project's current default parameters.
 *
 * Usage: npm run analyze:backing  (or: tsx scripts/analyzeBacking.ts)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyzeOverall,
  computeChromaSequence,
  decodeAudioFile,
  runPresenceTonality,
  slidingChordHistogram,
} from "../tests/helpers/offlinePipeline";
import { HIGH_WATER_MARK_DEFAULTS } from "../src/analysis/highWaterMark";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const BACKING_DIR = path.join(PROJECT_ROOT, "tests", "Sample", "Backing");

const FRAME_OPTIONS = { fftSize: 8192, hopSize: 2048, minFreq: 55, maxFreq: 5000 };
const CHORD_WINDOW_SEC = 1.0;
const CHORD_STRIDE_SEC = 0.25;

const FILES = [
  "BackingBm1_a.wav",
  "BackingBm1_b.wav",
  "BackingBm1_c.wav",
  "BackingDm1_a.wav",
  "BackingDm1_b.wav",
  "BackingDm1_c.wav",
];

(async () => {
  for (const file of FILES) {
    console.log("\n" + "=".repeat(72));
    console.log(file);
    console.log("=".repeat(72));

    const audio = await decodeAudioFile(path.join(BACKING_DIR, file));
    const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
    const frameRate = audio.sampleRate / FRAME_OPTIONS.hopSize;

    // Chord detection — sliding histogram.
    const wFr = Math.max(1, Math.round(CHORD_WINDOW_SEC * frameRate));
    const sFr = Math.max(1, Math.round(CHORD_STRIDE_SEC * frameRate));
    const hist = slidingChordHistogram(chromas, wFr, sFr);
    console.log(
      `Chord histogram (${hist.totalWindows} windows, ${CHORD_WINDOW_SEC}s window / ${CHORD_STRIDE_SEC}s stride):`,
    );
    const top8 = hist.entries.slice(0, 8);
    for (const e of top8) {
      console.log(
        `  ${e.name.padStart(4)}: ${(e.fraction * 100).toFixed(1).padStart(5)}%  (cos avg ${e.meanSimilarity.toFixed(3)})`,
      );
    }

    // Energy-based tonality on the full extract.
    const overall = analyzeOverall(chromas, 0.05);
    console.log(`\nEnergy tonality (analyzeOverall, top 5):`);
    for (const k of overall.keys.slice(0, 5)) {
      console.log(
        `  ${k.shortName.padStart(4)} (${k.name.padEnd(10)})  ${(k.probability * 100).toFixed(1).padStart(5)}%  r=${k.correlation.toFixed(2)}`,
      );
    }

    // Presence-based tonality (ToneBaseTonality with current defaults).
    const presence = runPresenceTonality(chromas, {
      liveAcquisitionSeconds: 8,
      tonalityAcquisitionSeconds: 30,
      framesPerSecond: frameRate,
      filter: {
        tolerancy: HIGH_WATER_MARK_DEFAULTS.tolerancy,
        memory: HIGH_WATER_MARK_DEFAULTS.memory,
        mode: HIGH_WATER_MARK_DEFAULTS.mode,
      },
    });
    console.log(
      `\nPresence tonality (ToneBaseTonality, defaults tol=${HIGH_WATER_MARK_DEFAULTS.tolerancy}, mem=${HIGH_WATER_MARK_DEFAULTS.memory}, ${HIGH_WATER_MARK_DEFAULTS.mode}, top 5):`,
    );
    for (const k of presence.keys.slice(0, 5)) {
      console.log(
        `  ${k.shortName.padStart(4)} (${k.name.padEnd(10)})  ${(k.probability * 100).toFixed(1).padStart(5)}%  r=${k.correlation.toFixed(2)}`,
      );
    }

    // Presence histogram (per pitch class).
    console.log(`\nPresence histogram (fraction of time each PC was active):`);
    const pcs = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const presenceLine = pcs
      .map((p, i) => `${p}:${(presence.presence[i] * 100).toFixed(0).padStart(3)}`)
      .join("  ");
    console.log(`  ${presenceLine}`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
