import { describe, expect, it } from "vitest";

import {
  computeSpawnMs,
  computeTravelMs,
  createInitialState,
  dominantNote,
  gameReducer,
  nextRandom,
  pushChromaFrame,
  resolveWolfJumperConfig,
  SeededRandom,
  shieldRemainingMs,
  slowRemainingMs,
  WOLF_JUMPER_DEFAULTS,
  WOLF_JUMPER_DETECTION_DEFAULTS,
  type BonusType,
  type ChordRef,
  type GameAction,
  type GameState,
} from "../../src/games";

const {
  bonusIntervalMaxMs: BONUS_INTERVAL_MAX_MS,
  bonusIntervalMinMs: BONUS_INTERVAL_MIN_MS,
  bonusLanes: BONUS_LANES,
  enemyLanes: ENEMY_LANES,
  fadeMs: FADE_MS,
  firstBonusDelayMs: FIRST_BONUS_DELAY_MS,
  initialSpawnMs: INITIAL_SPAWN_MS,
  initialTravelMs: INITIAL_TRAVEL_MS,
  maxHp: MAX_HP,
  maxTickMs: MAX_TICK_MS,
  minSpawnMs: MIN_SPAWN_MS,
  minTravelMs: MIN_TRAVEL_MS,
  notePool: NOTE_POOL,
  sameNoteCount: SAME_NOTE_COUNT,
  shieldDurationMs: SHIELD_DURATION_MS,
  slowDurationMs: SLOW_DURATION_MS,
  slowFactor: SLOW_FACTOR,
} = WOLF_JUMPER_DEFAULTS;

const C: ChordRef = { root: 0, quality: "maj" };
const G: ChordRef = { root: 7, quality: "maj" };
const Am: ChordRef = { root: 9, quality: "min" };
const Em: ChordRef = { root: 4, quality: "min" };

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

function withBonus(state: GameState, bonusType: BonusType, chord: ChordRef = C): GameState {
  return run(state, { type: "spawnBonus", bonusType, chord, lane: 0 });
}

function collect(state: GameState, bonusType: BonusType): GameState {
  return run(withBonus(state, bonusType, Am), { type: "chordDetected", chord: Am });
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

describe("configuration", () => {
  it("resolves the defaults, ignoring fields passed as undefined", () => {
    expect(resolveWolfJumperConfig()).toEqual(WOLF_JUMPER_DEFAULTS);
    expect(resolveWolfJumperConfig({ maxHp: undefined, notePool: [0] })).toEqual({
      ...WOLF_JUMPER_DEFAULTS,
      notePool: [0],
    });
    expect(WOLF_JUMPER_DETECTION_DEFAULTS.noteConfirmations).toBe(2);
  });

  it("stores the resolved config in the state and keeps it across reset", () => {
    const s = createInitialState(SEED, { maxHp: 3 });
    expect(s.config.maxHp).toBe(3);
    expect(s.hp).toBe(3);
    expect(run(s, { type: "reset" }).config).toBe(s.config);
    expect(idle().config).toEqual(WOLF_JUMPER_DEFAULTS);
  });

  it("draws enemies from a restricted note pool (a scale) and bonuses from custom chords", () => {
    const pool = [9, 0, 2, 4, 7]; // A minor pentatonic
    let s = createInitialState(SEED, { notePool: pool, bonusChords: [Em], bonusTypes: ["hp"] });
    for (let i = 0; i < 40; i++) s = run(s, { type: "spawnEnemy" }, { type: "spawnBonus" });
    for (const e of s.enemies) expect(pool).toContain(e.pc);
    expect(new Set(s.enemies.map((e) => e.pc)).size).toBe(pool.length);
    for (const b of s.bonuses) expect(b).toMatchObject({ chord: Em, type: "hp" });
    s = collect(s, "samenote");
    expect(pool).toContain(s.effects.sameNotePc);
  });

  it("uses the configured health, bonus amounts and durations", () => {
    let s = createInitialState(SEED, {
      maxHp: 3,
      hpBonusAmount: 1,
      shieldDurationMs: 1000,
      slowDurationMs: 2000,
      sameNoteCount: 2,
    });
    s = { ...collect(collect(collect({ ...s, hp: 1 }, "hp"), "shield"), "slow"), streak: 0 };
    expect(s.hp).toBe(2);
    expect(shieldRemainingMs(s)).toBe(1000);
    expect(slowRemainingMs(s)).toBe(2000);
    s = collect(s, "samenote");
    expect(s.effects.sameNoteRemaining).toBe(2);
    expect(collect({ ...s, hp: 3 }, "hp").hp).toBe(3);
  });

  it("uses the configured speeds and spawn rhythm", () => {
    const s = run(createInitialState(SEED, { initialTravelMs: 1000, bonusTravelMs: 500 }), {
      type: "spawnEnemy",
      pc: 0,
    });
    expect(s.enemies[0].speed).toBeCloseTo(1 / 1000);
    expect(run(s, { type: "spawnBonus" }).bonuses[0].speed).toBeCloseTo(1 / 500);

    let fast = run(
      createInitialState(SEED, {
        initialSpawnMs: 200,
        minSpawnMs: 100,
        spawnJitterMin: 1,
        spawnJitterSpread: 0,
        maxTickMs: 50,
      }),
      { type: "start" },
      { type: "tick", dtMs: 16 },
    );
    expect(fast.nextEnemyAt).toBe(16 + 200);
    fast = run(fast, { type: "tick", dtMs: 1000 }); // clamped to 50 ms
    expect(fast.time).toBe(66);
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
    for (const pc of pcs) expect(NOTE_POOL).toContain(pc);
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
    s = run(s, { type: "tick", dtMs: 16 }, { type: "chordDetected", chord: C });
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
      { type: "chordDetected", chord: C },
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
    let s = withBonus(withBonus(withBonus(idle(), "slow", G), "shield", G), "hp", Em);
    s = run(s, { type: "chordDetected", chord: G });
    expect(s.bonuses.map((b) => b.status)).toEqual(["collected", "collected", "alive"]);
    expect(slowRemainingMs(s)).toBe(SLOW_DURATION_MS);
    expect(shieldRemainingMs(s)).toBe(SHIELD_DURATION_MS);
  });

  it("matches a chord by root and quality, not by identity", () => {
    const s = withBonus(idle(), "hp", G);
    expect(run(s, { type: "chordDetected", chord: { root: 7, quality: "min" } })).toBe(s);
    expect(run(s, { type: "chordDetected", chord: { root: 7, quality: "maj" } })).not.toBe(s);
  });

  it("returns the same state when no bonus matches", () => {
    const s = withBonus(idle(), "hp", G);
    expect(run(s, { type: "chordDetected", chord: Am })).toBe(s);
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
    for (const b of s.bonuses) {
      expect(BONUS_LANES).toContain(b.laneY);
      expect(WOLF_JUMPER_DEFAULTS.bonusChords).toContainEqual(b.chord);
    }
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

  it("plays the same game as before the move for a given seed (default tuning)", () => {
    // Pinned from the engine before its move to core (seed 1, start, 8 s of
    // 100 ms ticks, no input): the same enemies in the same lanes.
    const s = advance(run(createInitialState(1), { type: "start" }), 8000);
    expect(s.enemies.slice(0, 4).map((e) => [e.pc, e.laneY])).toEqual([
      [11, -20],
      [9, 0],
      [5, 0],
      [4, -20],
    ]);
    expect(s).toMatchObject({ hp: 4, score: 0, time: 8000 });
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
    s = withBonus(withEnemy(collect(s, "samenote"), 0, 0.999), "shield", G);
    deepFreeze(s);
    const actions: GameAction[] = [
      { type: "tick", dtMs: 100 },
      { type: "noteDetected", pc: 0 },
      { type: "chordDetected", chord: G },
      { type: "spawnEnemy" },
      { type: "spawnBonus" },
      { type: "start" },
      { type: "reset" },
    ];
    for (const action of actions) expect(() => gameReducer(s, action)).not.toThrow();
  });

  it("gives equal results when called twice (StrictMode)", () => {
    const s = withBonus(withEnemy(idle(), 0, 0.999), "samenote", G);
    const actions: GameAction[] = [
      { type: "tick", dtMs: 16 },
      { type: "chordDetected", chord: G },
      { type: "spawnEnemy" },
    ];
    for (const action of actions) expect(gameReducer(s, action)).toEqual(gameReducer(s, action));
  });
});

describe("note detection helpers", () => {
  function chroma(pc: number, energy = 0.8): Float32Array {
    const c = new Float32Array(12).fill(0.02);
    c[pc] = energy;
    return c;
  }

  it("keeps the last N well-formed frames", () => {
    let h: readonly Float32Array[] = [];
    const frames = [chroma(0), chroma(2), chroma(4), chroma(5)];
    for (const f of frames) h = pushChromaFrame(h, f, 3);
    expect(h).toEqual(frames.slice(1));
    expect(pushChromaFrame(h, new Float32Array(0), 3)).toBe(h);
  });

  it("returns the strongest pitch class of the averaged frames", () => {
    const n = dominantNote([chroma(0, 0.9), chroma(7, 0.5), chroma(7, 0.5)]);
    expect(n?.pc).toBe(7);
    expect(n?.energy).toBeCloseTo((0.5 + 0.5 + 0.02) / 3);
  });

  it("returns null without frames or on silence", () => {
    expect(dominantNote([])).toBeNull();
    expect(dominantNote([new Float32Array(12)])).toBeNull();
  });
});
