/**
 * Build the "backing-tracks" dataset from full backing tracks whose key (and
 * sometimes tempo) is written in the title.
 *
 *   npm run build:backing-dataset -w packages/core -- \
 *     --sources <dir of the mp3s> --out <AILab>/datasets/backing-tracks [--tests]
 *
 * For each track in TRACKS:
 *   1. hash and decode the mp3 (stereo, native rate);
 *   2. drop the first and last 10 % (intro / outro);
 *   3. cut the rest into 10 s clips, no overlap (the remainder is dropped);
 *   4. write each clip as 16-bit stereo WAV, and one line per clip in
 *      `manifest.jsonl` (labels from the title, offsets in source samples);
 *   5. run the AudioLab detectors on every clip and on the trimmed track and
 *      write them to `predictions/audiolab-<version>.jsonl`. These are NOT
 *      labels: they are there to spot suspicious clips and as a baseline.
 *
 * `--tests` also writes the middle clip of each track, mono, to
 * `tests/Sample/BackingClips/` for the short regression suite.
 *
 * Everything needed to rebuild the same files (source hashes, decoder
 * versions, git commit, parameters) goes to `build-info.json`. The labels
 * live in TRACKS below, written by hand from the titles, not parsed.
 */

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import decode from "audio-decode";

import { applyHannWindow, fftMagnitude } from "../src/analysis/fft";
import { TempoAnalyzer } from "../src/analysis/engine/tempoAnalyzer";
import type { KeyScore } from "../src/analysis/keyDetection";
import {
  analyzeOverall,
  computeChromaSequence,
  runPresenceTonality,
} from "../src/offline/offlinePipeline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(CORE_ROOT, "..", "..");
const TEST_CLIPS_DIR = path.join(CORE_ROOT, "tests", "Sample", "BackingClips");

export const SCHEMA_VERSION = 1;
/** Bump on any change of the clips or labels; note it in the dataset's CHANGELOG.md. */
export const DATASET_VERSION = "1.0.0";
const LICENSE = "proprietary, unknown terms; private research only, no redistribution";
const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TRIM_RATIO = 0.1;
const CLIP_SECONDS = 10;

/** Same front-end as the sample regression suite (tests/samples/fixtures.ts). */
const FRAME_OPTIONS = { fftSize: 8192, hopSize: 2048, minFreq: 55, maxFreq: 5000 } as const;
const PRESENCE_OPTIONS = {
  liveAcquisitionSeconds: 8,
  tonalityAcquisitionSeconds: 30,
  filter: { tolerancy: 0.35, memory: 3, mode: "mean" as const },
};

interface Track {
  /** Stable id, used in file names and as the cross-validation fold. */
  id: string;
  /** Source file name, exactly as downloaded. */
  file: string;
  /** Key as written in the title. */
  tonic: string;
  mode: "major" | "minor";
  /** Scale named in the title ("dorian"), or null when only "minor" is given. */
  scale: string | null;
  /** Tempo written in the title, or null. */
  bpm: number | null;
  /** Style words of the title. */
  styles: string[];
  /**
   * Keys a key detector may answer and still be right: the tonic key, the
   * relative major (same notes) and, for a mode, the major key whose notes
   * it uses (B dorian = notes of A major).
   */
  acceptedKeys: string[];
  /** Things to know before trusting the label. */
  notes: string;
  /** Why the title label is doubtful, when the audio contradicts it. */
  labelSuspect?: string;
}

export const TRACKS: readonly Track[] = [
  {
    id: "dm-rock-78",
    file: "D Minor Emotional Rock Guitar Backing Track 78 BPM.mp3",
    tonic: "D",
    mode: "minor",
    scale: null,
    bpm: 78,
    styles: ["rock", "ballad"],
    acceptedKeys: ["Dm", "F"],
    notes: "",
  },
  {
    id: "bm-dorian-funk-114",
    file: "Dorian Funk Fusion Guitar Backing Track Jam in Bm 114 BPM.mp3",
    tonic: "B",
    mode: "minor",
    scale: "dorian",
    bpm: 114,
    styles: ["funk", "fusion"],
    acceptedKeys: ["Bm", "D", "A"],
    notes: "Dorian: the notes of A major (G#, not G). A major/minor key finder may answer A.",
  },
  {
    id: "em-liquid-fusion",
    file: "Liquid Groove Fusion Em Guitar Backtrack.mp3",
    tonic: "E",
    mode: "minor",
    scale: null,
    bpm: null,
    styles: ["fusion", "groove"],
    acceptedKeys: ["Em", "G"],
    notes: "No tempo in the title.",
  },
  {
    id: "cm-neosoul-90",
    file: "Neo Soul RnB Guitar Backing Track in Cm – Chill Groove 90BPM.mp3",
    tonic: "C",
    mode: "minor",
    scale: null,
    bpm: 90,
    styles: ["neo-soul", "rnb"],
    acceptedKeys: ["Cm", "D#"],
    notes: "Extended chords (9ths, 11ths) are likely: they blur the key profile.",
    labelSuspect:
      "Measured pitch classes (F#, B, E, A, C#) leave out C and Eb, at A = 440 Hz: the file sounds " +
      "in B minor or around it, not C minor. Check by ear before using the key label.",
  },
  {
    id: "bm-parisian-ballad",
    file: "Parisian Emotional Bluesy Ballad Backing Track in B minor SZBT 1129.mp3",
    tonic: "B",
    mode: "minor",
    scale: null,
    bpm: null,
    styles: ["ballad", "blues"],
    acceptedKeys: ["Bm", "D"],
    notes: "SZBT 1129 is a catalogue number, not a tempo.",
  },
  {
    id: "am-sunset-blues",
    file: "Sunset Drive Blues Backing Track A minor.mp3",
    tonic: "A",
    mode: "minor",
    scale: null,
    bpm: null,
    styles: ["blues"],
    acceptedKeys: ["Am", "C"],
    notes: "Minor blues: the b7 everywhere can pull a key finder towards D.",
  },
];

// --- small helpers -----------------------------------------------------------

function sha256(buf: Uint8Array): string {
  return createHash("sha256").update(buf).digest("hex");
}

function packageVersion(dir: string): string {
  try {
    return (JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")) as { version: string })
      .version;
  } catch {
    return "unknown";
  }
}

function git(args: string): string {
  try {
    return execSync(`git ${args}`, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

/** 16-bit PCM WAV, interleaved, any channel count. */
function encodeWav(channels: Float32Array[], sampleRate: number): Buffer {
  const nCh = channels.length;
  const n = channels[0].length;
  const dataSize = n * nCh * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(nCh, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * nCh * 2, 28);
  buf.writeUInt16LE(nCh * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  let off = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nCh; c++) {
      const x = Math.max(-1, Math.min(1, channels[c][i]));
      buf.writeInt16LE(Math.round(x * 32767), off);
      off += 2;
    }
  }
  return buf;
}

function mixdown(channels: Float32Array[]): Float32Array {
  const out = new Float32Array(channels[0].length);
  for (const ch of channels) for (let i = 0; i < out.length; i++) out[i] += ch[i] / channels.length;
  return out;
}

/**
 * Key label in names and integers: tonic_pc 0–11 (C = 0), mode_id 0 major /
 * 1 minor, key_index = 12·mode_id + tonic_pc (0–23).
 */
function keyLabel(track: Track) {
  const tonicPc = PITCH_CLASSES.indexOf(track.tonic);
  if (tonicPc < 0) throw new Error(`unknown tonic ${track.tonic}`);
  const modeId = track.mode === "major" ? 0 : 1;
  return {
    tonic: track.tonic,
    tonic_pc: tonicPc,
    mode: track.mode,
    mode_id: modeId,
    key_index: 12 * modeId + tonicPc,
    scale: track.scale,
  };
}

/** "title_unverified" until checked by ear; "suspect" when the audio contradicts the title. */
function labelStatus(track: Track) {
  return {
    label_status: track.labelSuspect ? "suspect" : "title_unverified",
    label_note: track.labelSuspect ?? null,
  };
}

/** SHA-256 of the decoded PCM (channels one after the other, Float32 LE). */
function pcmSha256(channels: Float32Array[]): string {
  const h = createHash("sha256");
  for (const ch of channels) h.update(new Uint8Array(ch.buffer, ch.byteOffset, ch.byteLength));
  return h.digest("hex");
}

/** Peak level and the number of samples the 16-bit encoding clips. */
function peakInfo(channels: Float32Array[]) {
  let peak = 0;
  let clipped = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const a = Math.abs(ch[i]);
      if (a > peak) peak = a;
      if (a >= 1) clipped++;
    }
  }
  return {
    peak_dbfs: peak > 0 ? Math.round(200 * Math.log10(peak)) / 10 : -120,
    clipped_samples: clipped,
  };
}

function rmsDbfs(x: Float32Array): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  const rms = Math.sqrt(s / Math.max(1, x.length));
  return rms > 0 ? Math.round(200 * Math.log10(rms)) / 10 : -120;
}

/**
 * Global tuning (cents from A = 440 Hz) and pitch-class shares of a signal:
 * spectral peaks between 80 Hz and 2 kHz, parabolic interpolation, circular
 * mean of their deviation from the nearest semitone weighted by energy. A
 * measurement, not a label.
 */
function measureTuning(x: Float32Array, sr: number) {
  const N = 16384;
  let re = 0;
  let im = 0;
  const pc = new Float64Array(12);
  for (let s = 0; s + N <= x.length; s += N) {
    const f = x.slice(s, s + N);
    applyHannWindow(f);
    const m = fftMagnitude(f);
    for (let k = 2; k < m.length - 1; k++) {
      const hz = (k * sr) / N;
      if (hz < 80 || hz > 2000 || !(m[k] > m[k - 1] && m[k] >= m[k + 1])) continue;
      const d = (0.5 * (m[k - 1] - m[k + 1])) / (m[k - 1] - 2 * m[k] + m[k + 1]);
      const midi = 69 + 12 * Math.log2(((k + d) * sr) / N / 440);
      const dev = midi - Math.round(midi);
      const w = m[k] * m[k];
      re += w * Math.cos(2 * Math.PI * dev);
      im += w * Math.sin(2 * Math.PI * dev);
      pc[((Math.round(midi) % 12) + 12) % 12] += w;
    }
  }
  const total = pc.reduce((a, b) => a + b, 0) || 1;
  return {
    tuning_cents: Math.round((1000 * Math.atan2(im, re)) / (2 * Math.PI)) / 10,
    pitch_class_share: Array.from(pc, (v) => Math.round((1000 * v) / total) / 1000),
  };
}

const top = (keys: KeyScore[], n = 3) =>
  keys.slice(0, n).map((k) => ({ key: k.shortName, p: Math.round(k.probability * 1000) / 1000 }));

/** AudioLab's key and tempo readings for one mono excerpt. */
function audiolabPredictions(samples: Float32Array, sampleRate: number) {
  const audio = { samples, sampleRate, durationSeconds: samples.length / sampleRate };
  const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
  const fps = sampleRate / FRAME_OPTIONS.hopSize;
  const energy = analyzeOverall(chromas, 0).keys;
  const presence = runPresenceTonality(chromas, { ...PRESENCE_OPTIONS, framesPerSecond: fps }).keys;
  const tempo = new TempoAnalyzer({ sampleRate, windowSeconds: audio.durationSeconds });
  tempo.pushSamples(samples);
  const estimate = tempo.analyze().estimate;
  return {
    energy_key: top(energy),
    presence_key: top(presence),
    tempo: estimate
      ? {
          bpm: Math.round(estimate.bpm * 10) / 10,
          confidence: Math.round(estimate.confidence * 1000) / 1000,
        }
      : null,
  };
}

// --- main ----------------------------------------------------------------------

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const sourcesDir = path.resolve(arg("sources") ?? path.join(REPO_ROOT, "sample"));
  const outArg = arg("out");
  if (!outArg) throw new Error("--out <dataset dir> is required");
  const outDir = path.resolve(outArg);
  const writeTests = process.argv.includes("--tests");

  const audiolabVersion = packageVersion(CORE_ROOT);
  const predictionsName = `audiolab-${audiolabVersion}.jsonl`;
  await mkdir(path.join(outDir, "audio", "sources"), { recursive: true });
  await mkdir(path.join(outDir, "predictions"), { recursive: true });
  if (writeTests) await mkdir(TEST_CLIPS_DIR, { recursive: true });

  const manifest: string[] = [];
  const predictions: string[] = [];
  const sources: unknown[] = [];

  for (const track of TRACKS) {
    const srcPath = path.join(sourcesDir, track.file);
    const bytes = new Uint8Array(await readFile(srcPath));
    const sourceSha = sha256(bytes);
    await copyFile(srcPath, path.join(outDir, "audio", "sources", `${track.id}.mp3`));

    const decoded = await decode(bytes);
    const sr = decoded.sampleRate;
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, c) =>
      decoded.getChannelData(c),
    );
    const length = decoded.length;
    const trimStart = Math.floor(length * TRIM_RATIO);
    const trimEnd = Math.floor(length * (1 - TRIM_RATIO));
    const clipLen = CLIP_SECONDS * sr;
    const nClips = Math.floor((trimEnd - trimStart) / clipLen);
    console.log(`${track.id}: ${(length / sr).toFixed(1)} s, ${nClips} clips`);

    await mkdir(path.join(outDir, "audio", "clips", track.id), { recursive: true });
    for (let c = 0; c < nClips; c++) {
      const start = trimStart + c * clipLen;
      const end = start + clipLen;
      const clip = channels.map((ch) => ch.slice(start, end));
      const wav = encodeWav(clip, sr);
      const clipId = `${track.id}__c${String(c).padStart(3, "0")}`;
      const rel = `audio/clips/${track.id}/${clipId}.wav`;
      await writeFile(path.join(outDir, rel), wav);
      const mono = mixdown(clip);

      manifest.push(
        JSON.stringify({
          schema_version: SCHEMA_VERSION,
          clip_id: clipId,
          path: rel,
          track_id: track.id,
          fold: track.id,
          clip_index: c,
          source_start_sample: start,
          source_end_sample: end,
          start_seconds: Math.round((start / sr) * 1000) / 1000,
          sample_rate: sr,
          channels: channels.length,
          duration_seconds: CLIP_SECONDS,
          sha256: sha256(wav),
          rms_dbfs: rmsDbfs(mono),
          ...peakInfo(clip),
          key: keyLabel(track),
          accepted_keys: track.acceptedKeys,
          bpm: track.bpm,
          styles: track.styles,
          label_source: "title",
          label_scope: "track",
          ...labelStatus(track),
          license: LICENSE,
        }),
      );
      predictions.push(
        JSON.stringify({ scope: "clip", clip_id: clipId, ...audiolabPredictions(mono, sr) }),
      );

      if (writeTests && c === Math.floor(nClips / 2)) {
        await writeFile(path.join(TEST_CLIPS_DIR, `${track.id}.wav`), encodeWav([mono], sr));
      }
    }

    const trimmedMono = mixdown(channels.map((ch) => ch.subarray(trimStart, trimEnd)));
    predictions.push(
      JSON.stringify({
        scope: "track",
        track_id: track.id,
        ...audiolabPredictions(trimmedMono, sr),
      }),
    );

    sources.push({
      track_id: track.id,
      original_file: track.file,
      sha256: sourceSha,
      bytes: bytes.length,
      sample_rate: sr,
      channels: channels.length,
      duration_seconds: Math.round((length / sr) * 1000) / 1000,
      decoded_samples: length,
      decoded_sha256: pcmSha256(channels),
      trim_start_sample: trimStart,
      trim_end_sample: trimEnd,
      clips: nClips,
      key: keyLabel(track),
      accepted_keys: track.acceptedKeys,
      bpm: track.bpm,
      styles: track.styles,
      notes: track.notes,
      ...labelStatus(track),
      measured: measureTuning(trimmedMono, sr),
      source_url: null,
      channel: null,
      download_date: null,
      license: LICENSE,
    });
  }

  const manifestText = manifest.join("\n") + "\n";
  const sourcesText = JSON.stringify(sources, null, 2) + "\n";
  const predictionsText = predictions.join("\n") + "\n";
  await writeFile(path.join(outDir, "manifest.jsonl"), manifestText);
  await writeFile(path.join(outDir, "predictions", predictionsName), predictionsText);
  await writeFile(path.join(outDir, "sources.json"), sourcesText);
  const textSha = (t: string) => createHash("sha256").update(t).digest("hex");
  await writeFile(
    path.join(outDir, "build-info.json"),
    JSON.stringify(
      {
        schema_version: SCHEMA_VERSION,
        dataset_version: DATASET_VERSION,
        built_at: new Date().toISOString(),
        builder: "AudioLab packages/core/scripts/buildBackingDataset.ts",
        command: `npm run build:backing-dataset -w packages/core -- ${process.argv.slice(2).join(" ")}`,
        audiolab_commit: git("rev-parse HEAD"),
        audiolab_dirty: git("status --porcelain") !== "",
        audiolab_core_version: audiolabVersion,
        node: process.version,
        decoder: {
          "audio-decode": packageVersion(path.join(REPO_ROOT, "node_modules", "audio-decode")),
          "mpg123-decoder": packageVersion(path.join(REPO_ROOT, "node_modules", "mpg123-decoder")),
        },
        params: {
          trim_ratio: TRIM_RATIO,
          clip_seconds: CLIP_SECONDS,
          clip_overlap: 0,
          remainder: "dropped",
          wav: "PCM 16-bit, native rate, source channels",
          predictions_front_end: FRAME_OPTIONS,
          predictions_presence: PRESENCE_OPTIONS,
        },
        clips: manifest.length,
        files: {
          "manifest.jsonl": textSha(manifestText),
          "sources.json": textSha(sourcesText),
          [`predictions/${predictionsName}`]: textSha(predictionsText),
        },
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`\n${manifest.length} clips → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
