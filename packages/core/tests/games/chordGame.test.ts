import { describe, expect, it } from "vitest";

import {
  CHORD_GAME_DEFAULTS,
  CHORD_POOLS,
  CHORD_POOL_IDS,
  chordGameReducer,
  chordKey,
  DEFAULT_CHORD_POOL,
  INITIAL_CHORD_GAME_STATS,
  parseChordKey,
  pickChord,
  sameChord,
  type ChordRef,
} from "../../src/games";

const C: ChordRef = { root: 0, quality: "maj" };
const G: ChordRef = { root: 7, quality: "maj" };
const D: ChordRef = { root: 2, quality: "maj" };
const Am: ChordRef = { root: 9, quality: "min" };

describe("chord references", () => {
  it("compares by root and quality", () => {
    expect(sameChord(C, { root: 0, quality: "maj" })).toBe(true);
    expect(sameChord(C, { root: 0, quality: "min" })).toBe(false);
    expect(sameChord(C, G)).toBe(false);
  });

  it("round-trips through a primitive key", () => {
    expect(chordKey(Am)).toBe("9-min");
    expect(parseChordKey("9-min")).toEqual(Am);
    expect(parseChordKey(chordKey(C))).toEqual(C);
    expect(() => parseChordKey("12-maj")).toThrow(/invalid chord key/);
    expect(() => parseChordKey("Am")).toThrow(/invalid chord key/);
  });
});

describe("chord pools", () => {
  it("builds the 12-chord pools from the templates and keeps stable ids", () => {
    expect(CHORD_POOL_IDS).toEqual([
      "open-major",
      "open-minor",
      "open-mix",
      "all-major",
      "all-minor",
      "all",
    ]);
    expect(CHORD_POOLS["all-major"]).toHaveLength(12);
    expect(CHORD_POOLS["all-minor"]).toHaveLength(12);
    expect(CHORD_POOLS.all).toHaveLength(24);
    expect(CHORD_POOLS["open-mix"]).toHaveLength(9);
    expect(CHORD_POOLS["open-major"][0]).toEqual(C);
    expect(CHORD_POOLS["open-minor"][0]).toEqual(Am);
    expect(CHORD_POOLS[DEFAULT_CHORD_POOL]).toBe(CHORD_POOLS["open-mix"]);
    for (const quality of ["maj", "min"] as const) {
      expect(CHORD_POOLS.all.filter((c) => c.quality === quality)).toHaveLength(12);
    }
  });

  it("exposes the confirmation defaults", () => {
    expect(CHORD_GAME_DEFAULTS).toEqual({ confirmations: 3, minProbability: 0.18 });
  });
});

describe("pickChord", () => {
  it("returns null for an empty pool", () => {
    expect(pickChord([])).toBeNull();
  });

  it("returns the only chord of a single-chord pool, even if excluded", () => {
    expect(pickChord([C], C)).toBe(C);
  });

  it("never returns the excluded chord when there is a choice", () => {
    const pool = [C, G, D];
    for (const r of [0, 0.34, 0.67, 0.999]) {
      expect(pickChord(pool, G, () => r)).not.toEqual(G);
    }
  });

  it("maps the rng output onto the pool", () => {
    expect(pickChord([C, G, D], undefined, () => 0)).toBe(C);
    expect(pickChord([C, G, D], undefined, () => 0.999)).toBe(D);
  });
});

describe("chordGameReducer", () => {
  it("increments score, streak and best streak on a hit", () => {
    const s = chordGameReducer(chordGameReducer(INITIAL_CHORD_GAME_STATS, { type: "hit" }), {
      type: "hit",
    });
    expect(s).toEqual({ score: 2, streak: 2, bestStreak: 2, skipped: 0 });
  });

  it("breaks the streak on a skip but keeps the best streak", () => {
    let s = chordGameReducer(INITIAL_CHORD_GAME_STATS, { type: "hit" });
    s = chordGameReducer(s, { type: "skip" });
    s = chordGameReducer(s, { type: "hit" });
    expect(s).toEqual({ score: 2, streak: 1, bestStreak: 1, skipped: 1 });
  });

  it("resets everything", () => {
    const s = chordGameReducer(
      { score: 3, streak: 1, bestStreak: 2, skipped: 4 },
      { type: "reset" },
    );
    expect(s).toEqual(INITIAL_CHORD_GAME_STATS);
  });
});
