/**
 * 30 s extracts cut at 30 / 50 / 70 % of two long backing tracks
 * (tests/Sample/Backing). The chord grid is not annotated, so only the key
 * is checked: the minor key or its relative major must rank within the
 * measured rank + RANK_SLACK, and both pipelines currently get every file
 * right at rank 1.
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

const IN_BM = { accepted: ["Bm", "D"] } as const;
const IN_DM = { accepted: ["Dm", "F"] } as const;

const CASES = [
  { file: "BackingBm1_a.wav", ...IN_BM, energy: 1, presence: 1 },
  { file: "BackingBm1_b.wav", ...IN_BM, energy: 1, presence: 1 },
  { file: "BackingBm1_c.wav", ...IN_BM, energy: 1, presence: 1 },
  { file: "BackingDm1_a.wav", ...IN_DM, energy: 1, presence: 1 },
  { file: "BackingDm1_b.wav", ...IN_DM, energy: 1, presence: 1 },
  { file: "BackingDm1_c.wav", ...IN_DM, energy: 1, presence: 1 },
].map((c) => ({ ...c, path: `Backing/${c.file}` }));

const TRIM = 0.05;

describe("backing-track extracts: energy key", () => {
  for (const c of CASES) {
    it(`${c.file}: ${c.accepted.join(" or ")} within top ${c.energy + RANK_SLACK}`, async () => {
      expectKeyRank(c.file, await energyKeys(c.path, TRIM), c.accepted, c.energy);
    });
  }

  it("MRR ≥ 0.9 (measured 1.0: at most one file may slip to rank 2)", async () => {
    const ranks = await Promise.all(
      CASES.map(async (c) => bestRank(await energyKeys(c.path, TRIM), c.accepted)),
    );
    expect(meanReciprocalRank(ranks), `ranks ${ranks.join(", ")}`).toBeGreaterThanOrEqual(0.9);
  });
});

describe("backing-track extracts: presence key", () => {
  for (const c of CASES) {
    it(`${c.file}: ${c.accepted.join(" or ")} within top ${c.presence + RANK_SLACK}`, async () => {
      expectKeyRank(c.file, await presenceKeys(c.path), c.accepted, c.presence);
    });
  }

  it("MRR ≥ 0.9 (measured 1.0: at most one file may slip to rank 2)", async () => {
    const ranks = await Promise.all(
      CASES.map(async (c) => bestRank(await presenceKeys(c.path), c.accepted)),
    );
    expect(meanReciprocalRank(ranks), `ranks ${ranks.join(", ")}`).toBeGreaterThanOrEqual(0.9);
  });
});
