/**
 * Wolf Jumper simulation as a pure reducer.
 *
 * Every rule of the game (movement, collisions, damage, kills, bonuses,
 * spawning, difficulty) lives here, with no React, timers or globals:
 *
 *   - Time is a game clock (`state.time`, ms) advanced only by `tick`, so a
 *     paused game (mic stopped, game over) does not age effects.
 *   - Randomness comes from a seed stored in the state, so a game is fully
 *     reproducible and StrictMode's double reducer calls give equal results.
 *   - Actions that change nothing return the same state object, letting
 *     subscribers skip re-renders.
 */

import {
  BONUS_CHORDS,
  BONUS_INTERVAL_MAX_MS,
  BONUS_INTERVAL_MIN_MS,
  BONUS_LANES,
  BONUS_TRAVEL_MS,
  BONUS_TYPES,
  ENEMY_LANES,
  FADE_MS,
  FIRST_BONUS_DELAY_MS,
  HP_BONUS_AMOUNT,
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
  SPAWN_DECAY_PER_HIT_MS,
  SPAWN_JITTER_MIN,
  SPAWN_JITTER_SPREAD,
  TRAVEL_DECAY_PER_HIT_MS,
  type BonusType,
} from "./constants";
import { SeededRandom } from "./rng";

// ---- State ----

export type EnemyStatus = "alive" | "killed" | "reached";
export type BonusStatus = "alive" | "collected" | "expired";

export interface Enemy {
  id: number;
  /** Pitch class (0..11) the player must play to kill it. */
  pc: number;
  /** 0 at the right edge, 1 at the wolf. */
  progress: number;
  /** Progress per game-clock ms, before the slow factor. */
  speed: number;
  /** Vertical offset from the ground line (px). */
  laneY: number;
  status: EnemyStatus;
  /** Game time at which it stopped being alive (drives the fade-out). */
  endedAt: number | null;
}

export interface Bonus {
  id: number;
  type: BonusType;
  chordName: string;
  progress: number;
  speed: number;
  laneY: number;
  status: BonusStatus;
  endedAt: number | null;
}

export interface ActiveEffects {
  shieldUntil: number;
  slowUntil: number;
  sameNoteRemaining: number;
  sameNotePc: number | null;
}

export interface GameState {
  /** Game clock (ms). */
  time: number;
  /** PRNG state, see `rng.ts`. */
  seed: number;
  enemies: readonly Enemy[];
  bonuses: readonly Bonus[];
  effects: ActiveEffects;
  score: number;
  streak: number;
  bestStreak: number;
  hp: number;
  gameOver: boolean;
  nextEnemyId: number;
  nextBonusId: number;
  /** Game time of the next automatic spawn (`Infinity` until started). */
  nextEnemyAt: number;
  nextBonusAt: number;
}

// ---- Actions ----

export type GameAction =
  /** Begin or resume play: schedules an immediate enemy and the first bonus. */
  | { type: "start" }
  /** Advance the simulation by `dtMs` of wall-clock time. */
  | { type: "tick"; dtMs: number }
  /** A confirmed note: kills every alive enemy of that pitch class. */
  | { type: "noteDetected"; pc: number }
  /** A confirmed chord: collects every alive bonus labelled with it. */
  | { type: "chordDetected"; name: string }
  /** Spawn one enemy now. Omitted fields are drawn from the seeded RNG. */
  | { type: "spawnEnemy"; pc?: number; lane?: number }
  /** Spawn one bonus now. Omitted fields are drawn from the seeded RNG. */
  | { type: "spawnBonus"; bonusType?: BonusType; chordName?: string; lane?: number }
  /** New game: full HP, empty field, zero score; keeps the RNG sequence. */
  | { type: "reset" };

// ---- Difficulty curves ----

export function computeTravelMs(score: number): number {
  return Math.max(MIN_TRAVEL_MS, INITIAL_TRAVEL_MS - score * TRAVEL_DECAY_PER_HIT_MS);
}

export function computeSpawnMs(score: number): number {
  return Math.max(MIN_SPAWN_MS, INITIAL_SPAWN_MS - score * SPAWN_DECAY_PER_HIT_MS);
}

// ---- Selectors ----

export function shieldRemainingMs(state: GameState): number {
  return Math.max(0, state.effects.shieldUntil - state.time);
}

export function slowRemainingMs(state: GameState): number {
  return Math.max(0, state.effects.slowUntil - state.time);
}

// ---- Initial state ----

const NO_EFFECTS: ActiveEffects = {
  shieldUntil: 0,
  slowUntil: 0,
  sameNoteRemaining: 0,
  sameNotePc: null,
};

export function createInitialState(seed: number): GameState {
  return {
    time: 0,
    seed,
    enemies: [],
    bonuses: [],
    effects: NO_EFFECTS,
    score: 0,
    streak: 0,
    bestStreak: 0,
    hp: MAX_HP,
    gameOver: false,
    nextEnemyId: 1,
    nextBonusId: 1,
    nextEnemyAt: Infinity,
    nextBonusAt: Infinity,
  };
}

// ---- Reducer ----

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "reset":
      return withRng(createInitialState(state.seed), scheduleSpawns);
    case "start":
      return state.gameOver ? state : withRng(state, scheduleSpawns);
    case "tick":
      return state.gameOver ? state : withRng(state, (s, rng) => tick(s, action.dtMs, rng));
    case "noteDetected":
      return state.gameOver ? state : killNote(state, action.pc);
    case "chordDetected":
      return state.gameOver ? state : withRng(state, (s, rng) => collectChord(s, action.name, rng));
    case "spawnEnemy":
      return state.gameOver
        ? state
        : withRng(state, (s, rng) => spawnEnemy(s, rng, action.pc, action.lane));
    case "spawnBonus":
      return state.gameOver
        ? state
        : withRng(state, (s, rng) =>
            spawnBonus(s, rng, action.bonusType, action.chordName, action.lane),
          );
  }
}

/** Runs `step` with an RNG cursor and stores the advanced seed in the result. */
function withRng(state: GameState, step: (s: GameState, rng: SeededRandom) => GameState) {
  const rng = new SeededRandom(state.seed);
  const next = step(state, rng);
  if (next === state && rng.seed === state.seed) return state;
  return { ...next, seed: rng.seed };
}

function scheduleSpawns(state: GameState, rng: SeededRandom): GameState {
  return {
    ...state,
    nextEnemyAt: state.time,
    nextBonusAt:
      state.time +
      FIRST_BONUS_DELAY_MS +
      rng.next() * (BONUS_INTERVAL_MIN_MS - FIRST_BONUS_DELAY_MS),
  };
}

function tick(state: GameState, dtMs: number, rng: SeededRandom): GameState {
  const dt = Math.min(MAX_TICK_MS, Math.max(0, dtMs));
  if (dt === 0) return state;

  const time = state.time + dt;
  const speedFactor = state.effects.slowUntil > time ? SLOW_FACTOR : 1;
  const shieldOn = state.effects.shieldUntil > time;
  const isFaded = (endedAt: number | null) => endedAt !== null && time - endedAt > FADE_MS;

  let hits = 0;
  let shieldKills = 0;
  const enemies: Enemy[] = [];
  for (const e of state.enemies) {
    if (e.status !== "alive") {
      if (!isFaded(e.endedAt)) enemies.push(e);
      continue;
    }
    const progress = e.progress + e.speed * dt * speedFactor;
    if (progress < 1) {
      enemies.push({ ...e, progress });
    } else if (shieldOn) {
      shieldKills += 1;
      enemies.push({ ...e, progress: 1, status: "killed", endedAt: time });
    } else {
      hits += 1;
      enemies.push({ ...e, progress: 1, status: "reached", endedAt: time });
    }
  }

  const bonuses: Bonus[] = [];
  for (const b of state.bonuses) {
    if (b.status !== "alive") {
      if (!isFaded(b.endedAt)) bonuses.push(b);
      continue;
    }
    const progress = b.progress + b.speed * dt * speedFactor;
    bonuses.push(
      progress < 1 ? { ...b, progress } : { ...b, progress: 1, status: "expired", endedAt: time },
    );
  }

  const hp = Math.max(0, state.hp - hits);
  let next: GameState = {
    ...state,
    time,
    enemies,
    bonuses,
    score: state.score + shieldKills,
    streak: hits > 0 ? 0 : state.streak,
    hp,
    gameOver: hp === 0,
  };
  if (next.gameOver) return next;

  if (time >= next.nextEnemyAt) {
    next = spawnEnemy(next, rng);
    const jitter = SPAWN_JITTER_MIN + rng.next() * SPAWN_JITTER_SPREAD;
    next = { ...next, nextEnemyAt: time + computeSpawnMs(next.score) * jitter };
  }
  if (time >= next.nextBonusAt) {
    next = spawnBonus(next, rng);
    const interval =
      BONUS_INTERVAL_MIN_MS + rng.next() * (BONUS_INTERVAL_MAX_MS - BONUS_INTERVAL_MIN_MS);
    next = { ...next, nextBonusAt: time + interval };
  }
  return next;
}

function spawnEnemy(state: GameState, rng: SeededRandom, pc?: number, lane?: number): GameState {
  let effects = state.effects;
  let notePc: number;
  if (pc !== undefined) {
    notePc = pc;
  } else if (effects.sameNoteRemaining > 0 && effects.sameNotePc !== null) {
    // "Same note ×5" bonus overrides the random draw.
    notePc = effects.sameNotePc;
    const remaining = effects.sameNoteRemaining - 1;
    effects = {
      ...effects,
      sameNoteRemaining: remaining,
      sameNotePc: remaining > 0 ? effects.sameNotePc : null,
    };
  } else {
    notePc = rng.pick(NOTE_POOL).pc;
  }
  const laneIndex = lane ?? rng.int(ENEMY_LANES.length);

  const enemy: Enemy = {
    id: state.nextEnemyId,
    pc: notePc,
    progress: 0,
    speed: 1 / computeTravelMs(state.score),
    laneY: ENEMY_LANES[laneIndex],
    status: "alive",
    endedAt: null,
  };
  return {
    ...state,
    effects,
    enemies: [...state.enemies, enemy],
    nextEnemyId: state.nextEnemyId + 1,
  };
}

function spawnBonus(
  state: GameState,
  rng: SeededRandom,
  bonusType?: BonusType,
  chordName?: string,
  lane?: number,
): GameState {
  const bonus: Bonus = {
    id: state.nextBonusId,
    type: bonusType ?? rng.pick(BONUS_TYPES).id,
    chordName: chordName ?? rng.pick(BONUS_CHORDS),
    progress: 0,
    speed: 1 / BONUS_TRAVEL_MS,
    laneY: BONUS_LANES[lane ?? rng.int(BONUS_LANES.length)],
    status: "alive",
    endedAt: null,
  };
  return { ...state, bonuses: [...state.bonuses, bonus], nextBonusId: state.nextBonusId + 1 };
}

function killNote(state: GameState, pc: number): GameState {
  let kills = 0;
  const enemies = state.enemies.map((e): Enemy => {
    if (e.status !== "alive" || e.pc !== pc) return e;
    kills += 1;
    return { ...e, status: "killed", endedAt: state.time };
  });
  if (kills === 0) return state;

  const streak = state.streak + kills;
  return {
    ...state,
    enemies,
    score: state.score + kills,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
  };
}

function collectChord(state: GameState, name: string, rng: SeededRandom): GameState {
  const collected: BonusType[] = [];
  const bonuses = state.bonuses.map((b): Bonus => {
    if (b.status !== "alive" || b.chordName !== name) return b;
    collected.push(b.type);
    return { ...b, status: "collected", endedAt: state.time };
  });
  if (collected.length === 0) return state;

  return collected.reduce<GameState>((s, type) => applyBonus(s, type, rng), {
    ...state,
    bonuses,
  });
}

function applyBonus(state: GameState, type: BonusType, rng: SeededRandom): GameState {
  const { effects, time } = state;
  switch (type) {
    case "hp":
      return { ...state, hp: Math.min(MAX_HP, state.hp + HP_BONUS_AMOUNT) };
    case "shield":
      return {
        ...state,
        effects: {
          ...effects,
          shieldUntil: Math.max(effects.shieldUntil, time + SHIELD_DURATION_MS),
        },
      };
    case "slow":
      return {
        ...state,
        effects: { ...effects, slowUntil: Math.max(effects.slowUntil, time + SLOW_DURATION_MS) },
      };
    case "samenote":
      return {
        ...state,
        effects: {
          ...effects,
          sameNoteRemaining: SAME_NOTE_COUNT,
          sameNotePc: rng.pick(NOTE_POOL).pc,
        },
      };
  }
}
