/**
 * Clean guitar improvisations in a minor key (tests/Sample/*Tona.mp3).
 *
 * A minor key and its relative major share all seven scale notes, so either
 * one is an accepted answer. `energy` / `presence` hold the rank each
 * pipeline reaches today; a case may lose at most RANK_SLACK places, and the
 * mean reciprocal rank (MRR) over the group has a floor just below today's.
 */
import { describe, expect, it } from "vitest";

import {
  RANK_SLACK,
  bestRank,
  energyKeys,
  expectKeyRank,
  meanReciprocalRank,
  presenceKeys,
} from "./fixtures";

const CASES = [
  { file: "AmTona.mp3", accepted: ["Am", "C"], energy: 3, presence: 1 },
  { file: "BmTona.mp3", accepted: ["Bm", "D"], energy: 1, presence: 2 },
  { file: "F#mTona.mp3", accepted: ["F#m", "A"], energy: 4, presence: 1 },
] as const;

const TRIM = 0.1;

describe("minor-key improvisations: energy pipeline (whole-file chroma)", () => {
  for (const c of CASES) {
    it(`${c.file}: ${c.accepted.join(" or ")} within top ${c.energy + RANK_SLACK}`, async () => {
      expectKeyRank(c.file, await energyKeys(c.file, TRIM), c.accepted, c.energy);
    });
  }

  it("MRR ≥ 0.5 (measured 0.53)", async () => {
    const ranks = await Promise.all(
      CASES.map(async (c) => bestRank(await energyKeys(c.file, TRIM), c.accepted)),
    );
    expect(meanReciprocalRank(ranks), `ranks ${ranks.join(", ")}`).toBeGreaterThanOrEqual(0.5);
  });
});

describe("minor-key improvisations: presence pipeline (TonalityEngine)", () => {
  for (const c of CASES) {
    it(`${c.file}: ${c.accepted.join(" or ")} within top ${c.presence + RANK_SLACK}`, async () => {
      expectKeyRank(c.file, await presenceKeys(c.file), c.accepted, c.presence);
    });
  }

  it("MRR ≥ 0.8 (measured 0.83)", async () => {
    const ranks = await Promise.all(
      CASES.map(async (c) => bestRank(await presenceKeys(c.file), c.accepted)),
    );
    expect(meanReciprocalRank(ranks), `ranks ${ranks.join(", ")}`).toBeGreaterThanOrEqual(0.8);
  });
});
