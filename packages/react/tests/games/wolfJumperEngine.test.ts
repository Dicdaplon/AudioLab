// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  BONUS_INTERVAL_MAX_MS,
  BONUS_INTERVAL_MIN_MS,
  BONUS_LANES,
  ENEMY_LANES,
  FADE_MS,
  FIRST_BONUS_DELAY_MS,
  INITIAL_SPAWN_MS,
  INITIAL_TRAVEL_MS,
  MAX_HP,
  MAX_TICK_MS,
  MIN_SPAWN_MS,
  MIN_TRAVEL_MS,
  NOTE_POOL,
  SAME_NOTE_COUNT,
  SHIELD_DURATION_MS,
  SLOW_DURATION_MS,
  SLOW_FACTOR,
  type BonusType,
} from "../../src/games/wolf-jumper/constants";
import {
  computeSpawnMs,
  computeTravelMs,
  createInitialState,
  gameReducer,
  shieldRemainingMs,
  slowRemainingMs,
  type GameAction,
  type GameState,
} from "../../src/games/wolf-jumper/engine";
import { SeededRandom, nextRandom } from "../../src/games/wolf-jumper/rng";

const SEED = 42;
const TRAVEL_PER_MS = 1 / INITIAL_TRAVEL_MS;

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

/** Advances the clock in maximum-size steps. */
function advance(state: GameState, ms: number): GameState {
  let s = state;
  let left = ms;
  while (left > 0) {
    const dt = Math.min(MAX_TICK_MS, left);
    s = gameReducer(s, { type: "tick", dtMs: dt });
    left -= dt;
  }
  return s;
}

/** A game that is not started, so ticks never spawn anything by themselves. */
function idle(): GameState {
  return createInitialState(SEED);
}

/** Spawns an enemy and moves it to `progress` directly. */
function withEnemy(state: GameState, pc: number, progress = 0): GameState {
  const s = run(state, { type: "spawnEnemy", pc, lane: 1 });
  const last = s.enemies.length - 1;
  return { ...s, enemies: s.enemies.map((e, i) => (i === last ? { ...e, progress } : e)) };
}

function withBonus(state: GameState, bonusType: BonusType, chordName = "C"): GameState {
  return run(state, { type: "spawnBonus", bonusType, chordName, lane: 0 });
}

function collect(state: GameState, bonusType: BonusType): GameState {
  return run(withBonus(state, bonusType, "Am"), { type: "chordDetected", name: "Am" });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe("difficulty curves", () => {
  it("speeds up with the score and clamps at the minimum", () => {
    expect(computeTravelMs(0)).toBe(INITIAL_TRAVEL_MS);
    expect(computeTravelMs(10)).toBe(INITIAL_TRAVEL_MS - 1000);
    expect(computeTravelMs(1000)).toBe(MIN_TRAVEL_MS);
    expect(computeSpawnMs(0)).toBe(INITIAL_SPAWN_MS);
    expect(computeSpawnMs(1000)).toBe(MIN_SPAWN_MS);
  });
});

describe("rng", () => {
  it("is deterministic and stays in [0, 1)", () => {
    expect(nextRandom(1)).toEqual(nextRandom(1));
    const rng = new SeededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("gameReducer: setup", () => {
  it("starts with full HP, an empty field and nothing scheduled", () => {
    const s = idle();
    expect(s).toMatchObject({ hp: MAX_HP, score: 0, streak: 0, gameOver: false, time: 0 });
    expect(s.enemies).toEqual([]);
    expect(s.nextEnemyAt).toBe(Infinity);
    expect(advance(s, 5000).enemies).toEqual([]);
  });

  it("spawns an enemy with the requested note and lane", () => {
    const s = run(idle(), { type: "spawnEnemy", pc: 7, lane: 2 });
    expect(s.enemies).toEqual([
      {
        id: 1,
        pc: 7,
        progress: 0,
        speed: TRAVEL_PER_MS,
        laneY: ENEMY_LANES[2],
        status: "alive",
        endedAt: null,
      },
    ]);
    expect(run(s, { type: "spawnEnemy" }).enemies[1].id).toBe(2);
  });

  it("draws random enemies from the note pool and lanes", () => {
    let s = idle();
    for (let i = 0; i < 50; i++) s = run(s, { type: "spawnEnemy" });
    const pcs = new Set(s.enemies.map((e) => e.pc));
    for (const pc of pcs) expect(NOTE_POOL.map((n) => n.pc)).toContain(pc);
    expect(pcs.size).toBeGreaterThan(3);
    for (const e of s.enemies) expect(ENEMY_LANES).toContain(e.laneY);
  });

  it("enemies spawned at a higher score travel faster", () => {
    const s = run({ ...idle(), score: 20 }, { type: "spawnEnemy", pc: 0 });
    expect(s.enemies[0].speed).toBeCloseTo(1 / computeTravelMs(20));
  });
});

describe("gameReducer: tick", () => {
  it("moves enemies proportionally to elapsed time", () => {
    const s = run(withEnemy(idle(), 0), { type: "tick", dtMs: 50 });
    expect(s.time).toBe(50);
    expect(s.enemies[0].progress).toBeCloseTo(50 * TRAVEL_PER_MS);
  });

  it("clamps long frame gaps so enemies cannot teleport", () => {
    const s = run(withEnemy(idle(), 0), { type: "tick", dtMs: 10_000 });
    expect(s.time).toBe(MAX_TICK_MS);
    expect(s.enemies[0].progress).toBeCloseTo(MAX_TICK_MS * TRAVEL_PER_MS);
  });

  it("ignores empty or negative steps", () => {
    const s = withEnemy(idle(), 0);
    expect(run(s, { type: "tick", dtMs: 0 })).toBe(s);
    expect(run(s, { type: "tick", dtMs: -16 })).toBe(s);
  });

  it("costs one HP per enemy that reaches the wolf and breaks the streak", () => {
    let s = { ...withEnemy(idle(), 0, 0.999), streak: 3, bestStreak: 3 };
    s = run(s, { type: "tick", dtMs: 16 });
    expect(s.hp).toBe(MAX_HP - 1);
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(3);
    expect(s.enemies[0]).toMatchObject({ status: "reached", progress: 1, endedAt: 16 });
  });

  it("applies the damage of every enemy reaching in the same tick", () => {
    let s = withEnemy(withEnemy(withEnemy(idle(), 0, 0.999), 2, 0.999), 4, 0.5);
    s = run(s, { type: "tick", dtMs: 16 });
    expect(s.hp).toBe(MAX_HP - 2);
    expect(s.enemies.map((e) => e.status)).toEqual(["reached", "reached", "alive"]);
  });

  it("does not damage twice for an enemy that already reached", () => {
    const s = advance(withEnemy(idle(), 0, 0.999), 300);
    expect(s.hp).toBe(MAX_HP - 1);
  });

  it("drops finished entities after their fade-out", () => {
    let s = run(withEnemy(idle(), 0), { type: "noteDetected", pc: 0 });
    s = advance(s, FADE_MS);
    expect(s.enemies).toHaveLength(1);
    s = advance(s, MAX_TICK_MS);
    expect(s.enemies).toHaveLength(0);
  });

  it("expires bonuses that reach the wolf without effect", () => {
    let s = withBonus(idle(), "hp");
    s = { ...s, bonuses: [{ ...s.bonuses[0], progress: 0.999 }] };
    s = run(s, { type: "tick", dtMs: 16 }, { type: "chordDetected", name: "C" });
    expect(s.bonuses[0].status).toBe("expired");
    expect(s.hp).toBe(MAX_HP);
  });

  it("ends the game when HP reaches zero and freezes it", () => {
    let s = { ...withEnemy(withEnemy(idle(), 0, 0.999), 2, 0.999), hp: 1 };
    s = run(s, { type: "tick", dtMs: 16 });
    expect(s.hp).toBe(0);
    expect(s.gameOver).toBe(true);

    const actions: GameAction[] = [
      { type: "tick", dtMs: 16 },
      { type: "start" },
      { type: "spawnEnemy", pc: 0 },
      { type: "spawnBonus" },
      { type: "noteDetected", pc: 0 },
      { type: "chordDetected", name: "C" },
    ];
    for (const action of actions) expect(gameReducer(s, action)).toBe(s);
  });
});

describe("gameReducer: notes", () => {
  it("kills every alive enemy of the played note at once (chain kill)", () => {
    let s = withEnemy(withEnemy(withEnemy(idle(), 0, 0.2), 2, 0.4), 0, 0.6);
    s = run(s, { type: "noteDetected", pc: 0 });
    expect(s.enemies.map((e) => e.status)).toEqual(["killed", "alive", "killed"]);
    expect(s).toMatchObject({ score: 2, streak: 2, bestStreak: 2 });
  });

  it("does not count an enemy twice", () => {
    let s = run(withEnemy(idle(), 0), { type: "noteDetected", pc: 0 });
    const again = run(s, { type: "noteDetected", pc: 0 });
    expect(again).toBe(s);
    s = run(withEnemy(s, 0), { type: "noteDetected", pc: 0 });
    expect(s.score).toBe(2);
  });

  it("returns the same state when nothing matches", () => {
    const s = withEnemy(idle(), 0);
    expect(run(s, { type: "noteDetected", pc: 5 })).toBe(s);
  });

  it("tracks the best streak across a break", () => {
    let s = withEnemy(withEnemy(idle(), 0), 2);
    s = run(s, { type: "noteDetected", pc: 0 }, { type: "noteDetected", pc: 2 });
    expect(s.bestStreak).toBe(2);
    s = advance(withEnemy(s, 4, 0.999), 16);
    expect(s.streak).toBe(0);
    s = run(withEnemy(s, 5), { type: "noteDetected", pc: 5 });
    expect(s).toMatchObject({ streak: 1, bestStreak: 2, score: 3 });
  });
});

describe("gameReducer: bonuses", () => {
  it("collects every alive bonus of the played chord and only those", () => {
    let s = withBonus(withBonus(withBonus(idle(), "slow", "G"), "shield", "G"), "hp", "Em");
    s = run(s, { type: "chordDetected", name: "G" });
    expect(s.bonuses.map((b) => b.status)).toEqual(["collected", "collected", "alive"]);
    expect(slowRemainingMs(s)).toBe(SLOW_DURATION_MS);
    expect(shieldRemainingMs(s)).toBe(SHIELD_DURATION_MS);
  });

  it("returns the same state when no bonus matches", () => {
    const s = withBonus(idle(), "hp", "G");
    expect(run(s, { type: "chordDetected", name: "Am" })).toBe(s);
  });

  it("hp: restores two HP, capped at the maximum", () => {
    expect(collect({ ...idle(), hp: 2 }, "hp").hp).toBe(4);
    expect(collect({ ...idle(), hp: 4 }, "hp").hp).toBe(MAX_HP);
  });

  it("shield: kills incoming enemies for points instead of damage", () => {
    let s = { ...collect(idle(), "shield"), streak: 2 };
    s = advance(withEnemy(s, 0, 0.999), 16);
    expect(s.enemies[0].status).toBe("killed");
    expect(s).toMatchObject({ hp: MAX_HP, score: 1, streak: 2 });
  });

  it("shield: expires after its duration", () => {
    let s = advance(collect(idle(), "shield"), SHIELD_DURATION_MS);
    expect(shieldRemainingMs(s)).toBe(0);
    s = advance(withEnemy(s, 0, 0.999), 16);
    expect(s.enemies[0].status).toBe("reached");
    expect(s.hp).toBe(MAX_HP - 1);
  });

  it("shield: a second pickup extends rather than stacks", () => {
    let s = advance(collect(idle(), "shield"), 3000);
    s = collect(s, "shield");
    expect(s.effects.shieldUntil).toBe(3000 + SHIELD_DURATION_MS);
  });

  it("slow: halves the speed of enemies and bonuses until it expires", () => {
    let s = withBonus(withEnemy(collect(idle(), "slow"), 0), "hp");
    s = run(s, { type: "tick", dtMs: 100 });
    expect(s.enemies[0].progress).toBeCloseTo(100 * TRAVEL_PER_MS * SLOW_FACTOR);
    expect(s.bonuses[1].progress).toBeCloseTo((100 / 7000) * SLOW_FACTOR);

    s = advance(s, SLOW_DURATION_MS);
    const before = s.enemies[0].progress;
    s = run(s, { type: "tick", dtMs: 100 });
    expect(slowRemainingMs(s)).toBe(0);
    expect(s.enemies[0].progress - before).toBeCloseTo(100 * TRAVEL_PER_MS);
  });

  it("samenote: the next five random spawns share one note", () => {
    let s = collect(idle(), "samenote");
    const pc = s.effects.sameNotePc;
    expect(pc).not.toBeNull();
    expect(s.effects.sameNoteRemaining).toBe(SAME_NOTE_COUNT);

    for (let i = 0; i < SAME_NOTE_COUNT; i++) s = run(s, { type: "spawnEnemy" });
    expect(s.enemies.map((e) => e.pc)).toEqual(Array(SAME_NOTE_COUNT).fill(pc));
    expect(s.effects).toMatchObject({ sameNoteRemaining: 0, sameNotePc: null });
  });

  it("samenote: an explicit note does not consume the effect", () => {
    const s = run(collect(idle(), "samenote"), { type: "spawnEnemy", pc: 11 });
    expect(s.enemies[0].pc).toBe(11);
    expect(s.effects.sameNoteRemaining).toBe(SAME_NOTE_COUNT);
  });

  it("random bonuses use the configured chords and lanes", () => {
    let s = idle();
    for (let i = 0; i < 30; i++) s = run(s, { type: "spawnBonus" });
    for (const b of s.bonuses) expect(BONUS_LANES).toContain(b.laneY);
    expect(new Set(s.bonuses.map((b) => b.type)).size).toBe(4);
  });
});

describe("gameReducer: spawning schedule", () => {
  it("start spawns an enemy on the next tick and schedules the first bonus", () => {
    let s = run(idle(), { type: "start" });
    expect(s.nextBonusAt).toBeGreaterThanOrEqual(FIRST_BONUS_DELAY_MS);
    expect(s.nextBonusAt).toBeLessThan(BONUS_INTERVAL_MIN_MS);

    s = run(s, { type: "tick", dtMs: 16 });
    expect(s.enemies).toHaveLength(1);
    const interval = s.nextEnemyAt - 16;
    expect(interval).toBeGreaterThanOrEqual(INITIAL_SPAWN_MS * 0.85);
    expect(interval).toBeLessThan(INITIAL_SPAWN_MS * 1.15);
  });

  it("keeps spawning enemies and bonuses over time", () => {
    // Shield the wolf for the whole run so the game does not end.
    let s = run(idle(), { type: "start" });
    let enemies = 0;
    let bonuses = 0;
    for (let t = 0; t < 30_000; t += MAX_TICK_MS) {
      s = { ...s, effects: { ...s.effects, shieldUntil: Infinity } };
      const prevE = s.nextEnemyId;
      const prevB = s.nextBonusId;
      s = run(s, { type: "tick", dtMs: MAX_TICK_MS });
      enemies += s.nextEnemyId - prevE;
      bonuses += s.nextBonusId - prevB;
    }
    expect(enemies).toBeGreaterThan(30_000 / (INITIAL_SPAWN_MS * 1.15) - 1);
    expect(bonuses).toBeGreaterThanOrEqual(
      Math.floor((30_000 - BONUS_INTERVAL_MIN_MS) / BONUS_INTERVAL_MAX_MS) + 1,
    );
  });

  it("is deterministic for a given seed", () => {
    const play = (seed: number) => advance(run(createInitialState(seed), { type: "start" }), 8000);
    expect(play(1)).toEqual(play(1));
    expect(play(1).enemies.map((e) => e.pc)).not.toEqual(play(2).enemies.map((e) => e.pc));
  });
});

describe("gameReducer: reset and purity", () => {
  it("reset starts a fresh, scheduled game", () => {
    let s = advance(run({ ...withEnemy(idle(), 0, 0.999), hp: 1 }, { type: "start" }), 100);
    expect(s.gameOver).toBe(true);
    s = run(s, { type: "reset" });
    expect(s).toMatchObject({
      hp: MAX_HP,
      score: 0,
      streak: 0,
      bestStreak: 0,
      gameOver: false,
      time: 0,
      enemies: [],
      bonuses: [],
      nextEnemyAt: 0,
    });
    expect(run(s, { type: "tick", dtMs: 16 }).enemies).toHaveLength(1);
  });

  it("never mutates its input", () => {
    let s = run(idle(), { type: "start" });
    s = withBonus(withEnemy(collect(s, "samenote"), 0, 0.999), "shield", "G");
    deepFreeze(s);
    const actions: GameAction[] = [
      { type: "tick", dtMs: 100 },
      { type: "noteDetected", pc: 0 },
      { type: "chordDetected", name: "G" },
      { type: "spawnEnemy" },
      { type: "spawnBonus" },
      { type: "start" },
      { type: "reset" },
    ];
    for (const action of actions) expect(() => gameReducer(s, action)).not.toThrow();
  });

  it("gives equal results when called twice (StrictMode)", () => {
    const s = withBonus(withEnemy(idle(), 0, 0.999), "samenote", "G");
    const actions: GameAction[] = [
      { type: "tick", dtMs: 16 },
      { type: "chordDetected", name: "G" },
      { type: "spawnEnemy" },
    ];
    for (const action of actions) expect(gameReducer(s, action)).toEqual(gameReducer(s, action));
  });
});
