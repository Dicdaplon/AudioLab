// @vitest-environment node
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect } from "vitest";

import {
  analyzeOverall,
  computeChromaSequence,
  runPresenceTonality,
  slidingChordHistogram,
} from "../src/analysis/offline/offlinePipeline";
import { decodeAudioFile } from "../src/analysis/offline/decodeAudio";
import { keyShortName, relativeMajorTonic } from "../src/analysis/keyDetection";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = path.join(__dirname, "Sample");
const FL_DIR = path.join(SAMPLES_DIR, "FLStudio");
const BACKING_DIR = path.join(SAMPLES_DIR, "Backing");

const FRAME_OPTIONS = {
  fftSize: 8192,
  hopSize: 2048,
  minFreq: 55,
  maxFreq: 5000,
} as const;

/** Chord window (seconds) and stride (seconds) for the sliding histogram. */
const CHORD_WINDOW_SEC = 1.0;
const CHORD_STRIDE_SEC = 0.25;

const TEST_TIMEOUT_MS = 30_000;

describe("sample-based chord detection (sliding histogram)", () => {
  /**
   * The user plays each progression repeatedly through the file. We don't
   * test temporal alignment; we test that all unique chords of the grid
   * end up in the top of the histogram of top-1 detections.
   */
  const cases: Array<{ file: string; expectedChords: string[] }> = [
    { file: "AmDmEAm.mp3", expectedChords: ["Am", "Dm", "E"] }, // 3 unique
    { file: "AmGFE.mp3", expectedChords: ["Am", "G", "F", "E"] }, // 4 unique
  ];

  for (const { file, expectedChords } of cases) {
    it(
      `${file}: all of {${expectedChords.join(", ")}} dominate the histogram`,
      async () => {
        const audio = await decodeAudioFile(path.join(SAMPLES_DIR, file));
        const chromas = computeChromaSequence(audio, FRAME_OPTIONS);

        const frameRate = audio.sampleRate / FRAME_OPTIONS.hopSize;
        const windowFrames = Math.max(1, Math.round(CHORD_WINDOW_SEC * frameRate));
        const strideFrames = Math.max(1, Math.round(CHORD_STRIDE_SEC * frameRate));

        const hist = slidingChordHistogram(chromas, windowFrames, strideFrames);
        expect(hist.totalWindows).toBeGreaterThan(10);

        // Accept the expected chords if they all fall within the top
        // (N + 2) of the histogram, where N is the unique count. A bit of
        // headroom for harmonic confusion (e.g. F major vs Am template).
        const lookupDepth = expectedChords.length + 2;
        const topNames = hist.entries.slice(0, lookupDepth).map((e) => e.name);

        const summary = hist.entries
          .slice(0, lookupDepth)
          .map((e) => `${e.name}(${(e.fraction * 100).toFixed(0)}%)`)
          .join(", ");

        for (const expected of expectedChords) {
          expect(
            topNames,
            `${file}: "${expected}" should be in top ${lookupDepth} of histogram. Got: [${summary}]`,
          ).toContain(expected);
        }
      },
      TEST_TIMEOUT_MS,
    );
  }
});

describe("sample-based tonality detection (24 keys)", () => {
  /**
   * For a minor tonality, both the minor key itself and its relative major
   * are acceptable answers (they share all 7 scale notes, so the chroma
   * alone can't fully disambiguate them).
   */
  const cases: Array<{ file: string; minorTonic: number; minorName: string }> = [
    { file: "AmTona.mp3", minorTonic: 9, minorName: "Am" },
    { file: "BmTona.mp3", minorTonic: 11, minorName: "Bm" },
    { file: "F#mTona.mp3", minorTonic: 6, minorName: "F#m" },
  ];

  for (const { file, minorTonic, minorName } of cases) {
    const relativeMajor = keyShortName(relativeMajorTonic(minorTonic), "maj");
    const accepted = [minorName, relativeMajor];

    it(
      `${file}: top key is ${minorName} or ${relativeMajor}`,
      async () => {
        const audio = await decodeAudioFile(path.join(SAMPLES_DIR, file));
        const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
        const overall = analyzeOverall(chromas, 0.1);

        // Top-5 of 24 candidates: still a strong assertion (random baseline
        // ~21%). Real-music recordings often emphasize the dominant (V) or
        // subdominant (IV), which can pollute the top-1 but rarely the top-5.
        const top5 = overall.keys.slice(0, 5);
        const top5Short = top5.map((k) => k.shortName);
        const summary = top5
          .map((k) => `${k.name}(${(k.probability * 100).toFixed(0)}%)`)
          .join(", ");

        const ok = top5Short.some((s) => accepted.includes(s));
        expect(
          ok,
          `${file}: expected ${minorName} or ${relativeMajor} in top 5, got [${summary}]`,
        ).toBe(true);
      },
      TEST_TIMEOUT_MS,
    );
  }
});

describe("FL Studio noisy samples — chord detection", () => {
  /**
   * CAmDmG progression (C major: I–vi–ii–V) with added drums + noise,
   * transposed +0 and +2 semitones. Three instrument variants each.
   * Expected chords (after transposition) must dominate the histogram.
   */
  const cases: Array<{ file: string; expectedChords: string[] }> = [
    { file: "CAmDmG_0_1.mp3", expectedChords: ["C", "Am", "Dm", "G"] },
    { file: "CAmDmG_0_2.mp3", expectedChords: ["C", "Am", "Dm", "G"] },
    { file: "CAmDmG_0_3.mp3", expectedChords: ["C", "Am", "Dm", "G"] },
    { file: "CAmDmG_2_1.mp3", expectedChords: ["D", "Bm", "Em", "A"] },
    { file: "CAmDmG_2_2.mp3", expectedChords: ["D", "Bm", "Em", "A"] },
    { file: "CAmDmG_2_3.mp3", expectedChords: ["D", "Bm", "Em", "A"] },
  ];

  for (const { file, expectedChords } of cases) {
    it(
      `${file}: {${expectedChords.join(", ")}} dominate the histogram`,
      async () => {
        const audio = await decodeAudioFile(path.join(FL_DIR, file));
        const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
        const frameRate = audio.sampleRate / FRAME_OPTIONS.hopSize;
        const wFr = Math.max(1, Math.round(CHORD_WINDOW_SEC * frameRate));
        const sFr = Math.max(1, Math.round(CHORD_STRIDE_SEC * frameRate));
        const hist = slidingChordHistogram(chromas, wFr, sFr);

        const lookupDepth = expectedChords.length + 2;
        const topNames = hist.entries.slice(0, lookupDepth).map((e) => e.name);
        const summary = hist.entries
          .slice(0, lookupDepth)
          .map((e) => `${e.name}(${(e.fraction * 100).toFixed(0)}%)`)
          .join(", ");

        for (const expected of expectedChords) {
          expect(
            topNames,
            `${file}: "${expected}" in top ${lookupDepth} histogram. Got [${summary}]`,
          ).toContain(expected);
        }
      },
      TEST_TIMEOUT_MS,
    );
  }
});

describe("FL Studio noisy samples — ToneBaseTonality", () => {
  /**
   * Same files, tested for tonality via the presence pipeline using the
   * sweep-tuned defaults (tol=0.35, mem=3, mean).
   */
  const cases: Array<{ file: string; tonicShort: string }> = [
    { file: "CAmDmG_0_1.mp3", tonicShort: "C" },
    { file: "CAmDmG_0_2.mp3", tonicShort: "C" },
    { file: "CAmDmG_0_3.mp3", tonicShort: "C" },
    { file: "CAmDmG_2_1.mp3", tonicShort: "D" },
    { file: "CAmDmG_2_2.mp3", tonicShort: "D" },
    { file: "CAmDmG_2_3.mp3", tonicShort: "D" },
  ];

  for (const { file, tonicShort } of cases) {
    // Major key: relative minor is at -3 semitones (Am for C major, Bm for D major).
    const minorRoot = tonicShort === "C" ? "Am" : tonicShort === "D" ? "Bm" : "";
    const accepted = [tonicShort, minorRoot];

    it(
      `${file}: top key is ${tonicShort} or ${minorRoot}`,
      async () => {
        const audio = await decodeAudioFile(path.join(FL_DIR, file));
        const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
        const frameRate = audio.sampleRate / FRAME_OPTIONS.hopSize;

        const result = runPresenceTonality(chromas, {
          liveAcquisitionSeconds: 8,
          tonalityAcquisitionSeconds: 30,
          framesPerSecond: frameRate,
          filter: { tolerancy: 0.35, memory: 3, mode: "mean" },
        });

        const top5 = result.keys.slice(0, 5);
        const top5Short = top5.map((k) => k.shortName);
        const summary = top5
          .map((k) => `${k.name}(${(k.probability * 100).toFixed(0)}%)`)
          .join(", ");

        const ok = top5Short.some((s) => accepted.includes(s));
        expect(
          ok,
          `${file}: expected ${tonicShort} or ${minorRoot} in top 5, got [${summary}]`,
        ).toBe(true);
      },
      TEST_TIMEOUT_MS,
    );
  }
});

describe("Backing track extracts (30 s each, mid-track)", () => {
  /**
   * 30 s extracts cut at 30 / 50 / 70 % of long backing tracks. The full
   * track has many chords going by; we only assert tonality (the chord
   * progression isn't known explicitly here).
   *
   * Both pipelines (energy + presence) must put the expected minor key or
   * its relative major in the top-3 of the 24-key ranking.
   */
  const cases: Array<{ file: string; minorName: string; relativeMajor: string }> = [
    { file: "BackingBm1_a.wav", minorName: "Bm", relativeMajor: "D" },
    { file: "BackingBm1_b.wav", minorName: "Bm", relativeMajor: "D" },
    { file: "BackingBm1_c.wav", minorName: "Bm", relativeMajor: "D" },
    { file: "BackingDm1_a.wav", minorName: "Dm", relativeMajor: "F" },
    { file: "BackingDm1_b.wav", minorName: "Dm", relativeMajor: "F" },
    { file: "BackingDm1_c.wav", minorName: "Dm", relativeMajor: "F" },
  ];

  for (const { file, minorName, relativeMajor } of cases) {
    const accepted = [minorName, relativeMajor];

    it(
      `${file} — energy tonality top-3 contains ${minorName} or ${relativeMajor}`,
      async () => {
        const audio = await decodeAudioFile(path.join(BACKING_DIR, file));
        const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
        const overall = analyzeOverall(chromas, 0.05);

        const top3 = overall.keys.slice(0, 3);
        const top3Short = top3.map((k) => k.shortName);
        const summary = top3
          .map((k) => `${k.shortName}(${(k.probability * 100).toFixed(0)}%)`)
          .join(", ");

        const ok = top3Short.some((s) => accepted.includes(s));
        expect(
          ok,
          `${file} energy: expected ${minorName} or ${relativeMajor} in top 3, got [${summary}]`,
        ).toBe(true);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      `${file} — presence tonality top-3 contains ${minorName} or ${relativeMajor}`,
      async () => {
        const audio = await decodeAudioFile(path.join(BACKING_DIR, file));
        const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
        const frameRate = audio.sampleRate / FRAME_OPTIONS.hopSize;

        const result = runPresenceTonality(chromas, {
          liveAcquisitionSeconds: 8,
          tonalityAcquisitionSeconds: 30,
          framesPerSecond: frameRate,
          filter: { tolerancy: 0.35, memory: 3, mode: "mean" },
        });

        const top3 = result.keys.slice(0, 3);
        const top3Short = top3.map((k) => k.shortName);
        const summary = top3
          .map((k) => `${k.shortName}(${(k.probability * 100).toFixed(0)}%)`)
          .join(", ");

        const ok = top3Short.some((s) => accepted.includes(s));
        expect(
          ok,
          `${file} presence: expected ${minorName} or ${relativeMajor} in top 3, got [${summary}]`,
        ).toBe(true);
      },
      TEST_TIMEOUT_MS,
    );
  }
});

describe("sample-based ToneBaseTonality (presence pipeline)", () => {
  /**
   * Same expectations as the energy-based tonality test, but driving the
   * pipeline through the HighWaterMarkFilter + presence accumulator. The
   * presence-based detection should ALSO put either the minor tonic or its
   * relative major in the top-5 of the 24-key ranking.
   */
  const cases: Array<{ file: string; minorTonic: number; minorName: string }> = [
    { file: "AmTona.mp3", minorTonic: 9, minorName: "Am" },
    { file: "BmTona.mp3", minorTonic: 11, minorName: "Bm" },
    { file: "F#mTona.mp3", minorTonic: 6, minorName: "F#m" },
  ];

  for (const { file, minorTonic, minorName } of cases) {
    const relativeMajor = keyShortName(relativeMajorTonic(minorTonic), "maj");
    const accepted = [minorName, relativeMajor];

    it(
      `${file}: presence-based top key is ${minorName} or ${relativeMajor}`,
      async () => {
        const audio = await decodeAudioFile(path.join(SAMPLES_DIR, file));
        const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
        const frameRate = audio.sampleRate / FRAME_OPTIONS.hopSize;

        const result = runPresenceTonality(chromas, {
          liveAcquisitionSeconds: 8,
          tonalityAcquisitionSeconds: 30,
          framesPerSecond: frameRate,
          filter: { tolerancy: 0.35, memory: 3, mode: "mean" },
        });

        const top5 = result.keys.slice(0, 5);
        const top5Short = top5.map((k) => k.shortName);
        const summary = top5
          .map((k) => `${k.name}(${(k.probability * 100).toFixed(0)}%)`)
          .join(", ");

        const ok = top5Short.some((s) => accepted.includes(s));
        expect(
          ok,
          `${file} (presence): expected ${minorName} or ${relativeMajor} in top 5, got [${summary}]`,
        ).toBe(true);
      },
      TEST_TIMEOUT_MS,
    );
  }
});
