/**
 * Four 12 s GuitarSet excerpts (tests/Sample/GuitarSet, CC BY 4.0): real
 * acoustic guitar with time-aligned lead-sheet chords. Each chord method
 * goes through the live path and is scored on the MIREX majmin reduction at
 * every frame (what the player would see); the accuracy may drop at most
 * ACCURACY_SLACK below the value measured on 2026-10-26. The key must stay
 * within RANK_SLACK of its measured rank (the key or its relative).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { TonalityEngineConfig } from "../../src/analysis/engine/tonalityEngine";
import { decodeAudioFile } from "../../src/offline/decodeAudio";
import { analyzeOverall, computeChromaSequence } from "../../src/offline/offlinePipeline";
import { majMin, parseHarte } from "../helpers/harte";
import { runFrames, scoreProgression, summarise, type Progression } from "../helpers/progressions";
import { analyserFrames } from "../helpers/synth";
import { FRAME_OPTIONS, SAMPLES_DIR, expectKeyRank } from "./fixtures";

const DIR = path.join(SAMPLES_DIR, "GuitarSet");
const ACCURACY_SLACK = 0.05;
const FFT = 16_384;

const METHODS: Record<string, Partial<TonalityEngineConfig>> = {
  default: {},
  hmm: { chordSmoothing: "hmm" },
};

/** Accuracy per method and the key's rank, measured on 2026-10-26. */
const CASES = [
  { id: "03_Rock3-148-C_comp", accepted: ["C", "Am"], default: 0.65, hmm: 0.718, keyRank: 1 },
  { id: "04_SS3-98-C_comp", accepted: ["C", "Am"], default: 0.718, hmm: 0.778, keyRank: 1 },
  { id: "05_Funk3-98-A_comp", accepted: ["A", "F#m"], default: 0.35, hmm: 0.256, keyRank: 1 },
  { id: "03_Jazz2-187-F#_comp", accepted: ["F#m", "A"], default: 0.375, hmm: 0.462, keyRank: 1 },
] as const;

function reference(id: string): Progression {
  const meta = JSON.parse(readFileSync(path.join(DIR, `${id}.json`), "utf8")) as {
    chords: { start: number; end: number; label: string }[];
  };
  const chords = meta.chords.flatMap((c) => {
    const r = majMin(parseHarte(c.label));
    return r ? [{ name: c.label, ...r, start: c.start, end: c.end }] : [];
  });
  return { signal: new Float32Array(0), chords, seconds: 12 };
}

describe("GuitarSet excerpts: chords at display time and key", () => {
  for (const c of CASES) {
    it(`${c.id}: each method keeps its accuracy, the key keeps its rank`, async () => {
      const audio = await decodeAudioFile(path.join(DIR, `${c.id}.wav`));
      const frames = analyserFrames(audio.samples, FFT, Math.round(audio.sampleRate / 10));
      const prog = reference(c.id);
      for (const [name, cfg] of Object.entries(METHODS)) {
        const out = runFrames(frames, cfg, { sampleRate: audio.sampleRate, fftSize: FFT, fps: 10 });
        const { accuracy } = summarise([scoreProgression(prog, out)]);
        const measured = c[name as "default" | "hmm"];
        expect(accuracy, `${c.id} ${name}: measured ${measured}`).toBeGreaterThanOrEqual(
          measured - ACCURACY_SLACK,
        );
      }
      const keys = analyzeOverall(computeChromaSequence(audio, FRAME_OPTIONS), 0).keys;
      expectKeyRank(c.id, keys, c.accepted, c.keyRank);
    });
  }
});
