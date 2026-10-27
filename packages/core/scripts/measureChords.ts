/**
 * Chord confusion, printed as markdown for the README.
 *
 *   npm run measure:chords                 synthetic guitar (tests/helpers/guitar.ts)
 *   npm run measure:chords -- <dir>        your recordings
 *
 * A recording directory holds audio files (wav/mp3/flac/ogg), one chord per
 * file (strum it and let it ring), and a `labels.csv` with one
 * `file,chordKey` line per file, e.g. `e7-take1.wav,4-dom7` (keys as
 * `chordKey` writes them: root pitch class, a dash, the quality id).
 * Every frame from one chord window after the start until the level falls
 * 30 dB below its peak counts as a take.
 *
 * Each candidate set (triads, sevenths, all) is measured: the share of
 * takes matched under the `exact` and `triad` policies, the spread of the
 * top-1 probability (to choose `minProbability`), then the confusion.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { chordName, type ChordQuality } from "../src/analysis/chordDetection";
import { TonalityEngine } from "../src/analysis/engine/tonalityEngine";
import { matchesTarget, parseChordKey } from "../src/analysis/chordRef";
import { decodeAudioFile } from "../src/offline/decodeAudio";
import { Confusion, percentile } from "../tests/helpers/confusion";
import { GUITAR_VOICINGS, QUALITY_SETS, guitarChordConfusion } from "../tests/helpers/guitarChords";
import { analyserFrames } from "../tests/helpers/synth";

const FPS = 10;

function report(name: string, confusion: Confusion, probabilities: number[]): string {
  const pct = (x: number) => `${Math.round(100 * x)} %`;
  return [
    `### ${name}`,
    "",
    `${confusion.takes} takes: exact ${pct(confusion.rate("exact"))}, ` +
      `triad ${pct(confusion.rate("triad"))}. Top-1 probability: ` +
      `p10 ${percentile(probabilities, 0.1).toFixed(2)}, ` +
      `median ${percentile(probabilities, 0.5).toFixed(2)}.`,
    "",
    confusion.toMarkdown(),
    "",
  ].join("\n");
}

async function measureRecordings(dir: string, qualities: readonly ChordQuality[]) {
  const confusion = new Confusion();
  const probabilities: number[] = [];
  const labels = readFileSync(path.join(dir, "labels.csv"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  for (const line of labels) {
    const [file, key] = line.split(",").map((s) => s.trim());
    const target = parseChordKey(key);
    const played = chordName(target.root, target.quality);
    const audio = await decodeAudioFile(path.join(dir, file));
    const fftSize = audio.sampleRate >= 32_000 ? 16_384 : 4096;
    const engine = new TonalityEngine({ framesPerSecond: FPS, chordQualities: qualities });
    const frames = analyserFrames(audio.samples, fftSize, Math.round(audio.sampleRate / FPS)).map(
      (db) => engine.processDbSpectrum(db, audio.sampleRate),
    );
    const peak = Math.max(...frames.map((f) => f.signalLevelDb));
    for (const frame of frames.slice(FPS)) {
      if (frame.signalLevelDb < peak - 30) break;
      const top = frame.chords[0];
      confusion.add(played, top.name, {
        exact: matchesTarget(top, target),
        triad: matchesTarget(top, target, { accept: "triad" }),
      });
      probabilities.push(top.probability);
    }
  }
  return { confusion, probabilities };
}

const dir = process.argv[2];
const out: string[] = [
  dir ? `## Recorded chords (${dir})` : "## Synthetic guitar chords (model, not recordings)",
  "",
];
for (const [name, qualities] of Object.entries(QUALITY_SETS)) {
  if (dir) {
    const { confusion, probabilities } = await measureRecordings(dir, qualities);
    out.push(report(`${name}: ${qualities.join(", ")}`, confusion, probabilities));
  } else {
    const { confusion, topProbabilities } = guitarChordConfusion(GUITAR_VOICINGS, { qualities });
    out.push(report(`${name}: ${qualities.join(", ")}`, confusion, topProbabilities));
  }
}
console.log(out.join("\n"));
