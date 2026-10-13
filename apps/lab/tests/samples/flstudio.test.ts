/**
 * FL Studio renders of C–Am–Dm–G (I–vi–ii–V) with drums and added noise,
 * transposed by 0 and +2 semitones, three instrument variants each
 * (tests/Sample/FLStudio/CAmDmG_<transpose>_<variant>.mp3).
 *
 * Chords: the four grid chords must be exactly the four most frequent
 * winners of the sliding histogram. Keys: the major key or its relative
 * minor must rank within the measured rank + RANK_SLACK.
 */
import { describe, expect, it } from "vitest";

import {
  RANK_SLACK,
  bestRank,
  chordHistogram,
  energyKeys,
  expectChordGrid,
  expectKeyRank,
  meanReciprocalRank,
  presenceKeys,
} from "./fixtures";

const IN_C = { chords: ["C", "Am", "Dm", "G"], accepted: ["C", "Am"] } as const;
const IN_D = { chords: ["D", "Bm", "Em", "A"], accepted: ["D", "Bm"] } as const;

const CASES = [
  { file: "CAmDmG_0_1.mp3", ...IN_C, coverage: 0.843, energy: 3, presence: 1 },
  { file: "CAmDmG_0_2.mp3", ...IN_C, coverage: 0.919, energy: 1, presence: 2 },
  { file: "CAmDmG_0_3.mp3", ...IN_C, coverage: 0.976, energy: 2, presence: 2 },
  { file: "CAmDmG_2_1.mp3", ...IN_D, coverage: 0.832, energy: 1, presence: 1 },
  { file: "CAmDmG_2_2.mp3", ...IN_D, coverage: 0.976, energy: 1, presence: 1 },
  { file: "CAmDmG_2_3.mp3", ...IN_D, coverage: 0.959, energy: 2, presence: 1 },
].map((c) => ({ ...c, path: `FLStudio/${c.file}` }));

const TRIM = 0.1;

describe("FL Studio noisy renders: sliding chord histogram", () => {
  for (const c of CASES) {
    it(`${c.file}: top 4 winners are exactly {${c.chords.join(", ")}}`, async () => {
      expectChordGrid(c.file, await chordHistogram(c.path), c.chords, c.coverage);
    });
  }
});

describe("FL Studio noisy renders: energy key", () => {
  for (const c of CASES) {
    it(`${c.file}: ${c.accepted.join(" or ")} within top ${c.energy + RANK_SLACK}`, async () => {
      expectKeyRank(c.file, await energyKeys(c.path, TRIM), c.accepted, c.energy);
    });
  }

  it("MRR ≥ 0.7 (measured 0.72)", async () => {
    const ranks = await Promise.all(
      CASES.map(async (c) => bestRank(await energyKeys(c.path, TRIM), c.accepted)),
    );
    expect(meanReciprocalRank(ranks), `ranks ${ranks.join(", ")}`).toBeGreaterThanOrEqual(0.7);
  });
});

describe("FL Studio noisy renders: presence key", () => {
  for (const c of CASES) {
    it(`${c.file}: ${c.accepted.join(" or ")} within top ${c.presence + RANK_SLACK}`, async () => {
      expectKeyRank(c.file, await presenceKeys(c.path), c.accepted, c.presence);
    });
  }

  it("MRR ≥ 0.8 (measured 0.83)", async () => {
    const ranks = await Promise.all(
      CASES.map(async (c) => bestRank(await presenceKeys(c.path), c.accepted)),
    );
    expect(meanReciprocalRank(ranks), `ranks ${ranks.join(", ")}`).toBeGreaterThanOrEqual(0.8);
  });
});
