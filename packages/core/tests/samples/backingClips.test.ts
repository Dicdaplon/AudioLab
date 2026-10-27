/**
 * One 10 s clip from the middle of each backing track of the AILab
 * "backing-tracks" dataset (tests/Sample/BackingClips, written by
 * `npm run build:backing-dataset -- --tests`). The key labels come from the
 * track titles, so these are regression checks: each method may lose at
 * most RANK_SLACK places against the rank it reaches today, which says
 * nothing about it being right.
 *
 * The clips are commercial audio and are not committed: the suite skips
 * when they are missing. cm-neosoul-90 is left out: its title says C minor
 * but the file measures around B minor (see the dataset's sources.json).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";

import { GAUSSIAN_LOG_CHROMA } from "../../src/analysis/chroma";
import { decodeAudioFile } from "../../src/offline/decodeAudio";
import {
  analyzeOverall,
  computeChromaSequence,
  runPresenceTonality,
} from "../../src/offline/offlinePipeline";
import { FRAME_OPTIONS, PRESENCE_OPTIONS, SAMPLES_DIR, expectKeyRank } from "./fixtures";

const DIR = path.join(SAMPLES_DIR, "BackingClips");

/** Ranks measured on 2026-10-23 (AudioLab 0.5.0 + the opt-in alternatives). */
const CASES = [
  { id: "dm-rock-78", accepted: ["Dm", "F"], energy: 1, presence: 1, gaussianLog: 1 },
  { id: "bm-dorian-funk-114", accepted: ["Bm", "D", "A"], energy: 2, presence: 5, gaussianLog: 5 },
  { id: "em-liquid-fusion", accepted: ["Em", "G"], energy: 4, presence: 5, gaussianLog: 1 },
  { id: "bm-parisian-ballad", accepted: ["Bm", "D"], energy: 1, presence: 1, gaussianLog: 1 },
  { id: "am-sunset-blues", accepted: ["Am", "C"], energy: 1, presence: 1, gaussianLog: 1 },
] as const;

const present = CASES.every((c) => existsSync(path.join(DIR, `${c.id}.wav`)));

async function load(id: string) {
  return decodeAudioFile(path.join(DIR, `${id}.wav`));
}

describe.skipIf(!present)("backing-track clips (regression, labels from titles)", () => {
  for (const c of CASES) {
    it(`${c.id}: default energy, presence and gaussian-log energy keep their ranks`, async () => {
      const audio = await load(c.id);
      const chromas = computeChromaSequence(audio, FRAME_OPTIONS);
      const gaussian = computeChromaSequence(audio, {
        ...FRAME_OPTIONS,
        chroma: GAUSSIAN_LOG_CHROMA,
      });
      const fps = audio.sampleRate / FRAME_OPTIONS.hopSize;
      expectKeyRank(`${c.id} energy`, analyzeOverall(chromas, 0.05).keys, c.accepted, c.energy);
      expectKeyRank(
        `${c.id} presence`,
        runPresenceTonality(chromas, { ...PRESENCE_OPTIONS, framesPerSecond: fps }).keys,
        c.accepted,
        c.presence,
      );
      expectKeyRank(
        `${c.id} gaussian-log`,
        analyzeOverall(gaussian, 0.05).keys,
        c.accepted,
        c.gaussianLog,
      );
    });
  }
});
