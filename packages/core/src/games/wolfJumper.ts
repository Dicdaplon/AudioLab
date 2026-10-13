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
 *   - The tuning lives in `state.config`, resolved once by
 *     `createInitialState(seed, config?)` from `WOLF_JUMPER_DEFAULTS`: a host
 *     can restrict the note pool to a scale, change the bonus chords, the
 *     speeds or the health without touching the rules.
 *
 * Notes are pitch classes (0..11) and chords are `ChordRef`s; the display
 * names belong to the UI.
 */

import { type ChordRef, sameChord } from "./chordRef";
import { SeededRandom } from "./rng";
import { CHROMA_SIZE } from "../analysis/chroma";

// ---- Configuration ----

export type BonusType = "hp" | "shield" | "slow" | "samenote";

export const BONUS_TYPES: readonly BonusType[] = ["hp", "shield", "slow", "samenote"];

export interface WolfJumperConfig {
  /** Pitch classes an enemy can carry (C major by default). */
  notePool: readonly number[];
  /** Chords a bonus can ask for. */
  bonusChords: readonly ChordRef[];
  /** Bonus effects that can spawn. */
  bonusTypes: readonly BonusType[];
  /** Health at the start and the cap for the HP bonus. */
  maxHp: number;
  /** Enemy travel time (right edge → wolf) at score 0, in ms, ... */
  initialTravelMs: number;
  /** ... decreasing by this much per point ... */
  travelDecayPerHitMs: number;
  /** ... down to this floor. */
  minTravelMs: number;
  /** Interval between automatic enemy spawns at score 0, in ms, ... */
  initialSpawnMs: number;
  /** ... decreasing by this much per point ... */
  spawnDecayPerHitMs: number;
  /** ... down to this floor. */
  minSpawnMs: number;
  /** Each spawn interval is scaled by a random factor in [min, min + spread). */
  spawnJitterMin: number;
  spawnJitterSpread: number;
  /** Delay before the first bonus after `start`, in ms. */
  firstBonusDelayMs: number;
  /** Interval between bonuses, drawn uniformly in [min, max] ms. */
  bonusIntervalMinMs: number;
  bonusIntervalMaxMs: number;
  /** Bonus travel time, in ms. */
  bonusTravelMs: number;
  /** Finished entities linger this long for their fade-out, in ms. */
  fadeMs: number;
  /** Upper bound for one simulation step, in ms (clamps long frame gaps). */
  maxTickMs: number;
  shieldDurationMs: number;
  slowDurationMs: number;
  /** Speed multiplier while the slow effect is on. */
  slowFactor: number;
  /** Number of spawns forced to one note by the same-note bonus. */
  sameNoteCount: number;
  /** HP restored by the HP bonus. */
  hpBonusAmount: number;
  /** Vertical offsets of the enemy lanes, in stage pixels relative to the ground. */
  enemyLanes: readonly number[];
  /** Vertical offsets of the bonus lanes. */
  bonusLanes: readonly number[];
}

const maj = (root: number): ChordRef => ({ root, quality: "maj" });
const min = (root: number): ChordRef => ({ root, quality: "min" });

export const WOLF_JUMPER_DEFAULTS: WolfJumperConfig = {
  notePool: [0, 2, 4, 5, 7, 9, 11],
  bonusChords: [maj(0), maj(7), maj(2), maj(5), min(9), min(4), min(2)],
  bonusTypes: BONUS_TYPES,
  maxHp: 5,
  initialTravelMs: 6000,
  travelDecayPerHitMs: 100,
  minTravelMs: 2200,
  initialSpawnMs: 1800,
  spawnDecayPerHitMs: 35,
  minSpawnMs: 700,
  spawnJitterMin: 0.85,
  spawnJitterSpread: 0.3,
  firstBonusDelayMs: 6000,
  bonusIntervalMinMs: 11000,
  bonusIntervalMaxMs: 16000,
  bonusTravelMs: 7000,
  fadeMs: 400,
  maxTickMs: 100,
  shieldDurationMs: 7000,
  slowDurationMs: 7000,
  slowFactor: 0.5,
  sameNoteCount: 5,
  hpBonusAmount: 2,
  enemyLanes: [-20, 0, 20],
  bonusLanes: [-15, 15],
};

export interface WolfJumperDetectionConfig {
  /** Instantaneous chroma frames averaged before taking the strongest note. */
  noteSmoothFrames: number;
  /** Consecutive frames a note must stay on top to count. */
  noteConfirmations: number;
  /** Minimum mean chroma energy of the note. */
  minNoteEnergy: number;
  /** Consecutive frames a chord must stay on top to count. */
  chordConfirmations: number;
  /** Minimum top-1 chord score. */
  minChordProbability: number;
}

/** ~300 ms of smoothing + 200 ms of confirmation for notes; 3 frames at ≥ 0.18 for chords. */
export const WOLF_JUMPER_DETECTION_DEFAULTS: WolfJumperDetectionConfig = {
  noteSmoothFrames: 3,
  noteConfirmations: 2,
  minNoteEnergy: 0.14,
  chordConfirmations: 3,
  minChordProbability: 0.18,
};

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
  /** Chord the player must play to collect it. */
  chord: ChordRef;
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
  /** Resolved tuning, fixed for the game. */
  config: WolfJumperConfig;
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
  /** A confirmed chord: collects every alive bonus asking for it. */
  | { type: "chordDetected"; chord: ChordRef }
  /** Spawn one enemy now. Omitted fields are drawn from the seeded RNG. */
  | { type: "spawnEnemy"; pc?: number; lane?: number }
  /** Spawn one bonus now. Omitted fields are drawn from the seeded RNG. */
  | { type: "spawnBonus"; bonusType?: BonusType; chord?: ChordRef; lane?: number }
  /** New game: full HP, empty field, zero score; keeps the RNG sequence and the config. */
  | { type: "reset" };

// ---- Difficulty curves ----

export function computeTravelMs(score: number, config: WolfJumperConfig = WOLF_JUMPER_DEFAULTS) {
  return Math.max(config.minTravelMs, config.initialTravelMs - score * config.travelDecayPerHitMs);
}

export function computeSpawnMs(score: number, config: WolfJumperConfig = WOLF_JUMPER_DEFAULTS) {
  return Math.max(config.minSpawnMs, config.initialSpawnMs - score * config.spawnDecayPerHitMs);
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

/** Defaults overridden by the given fields; explicit `undefined` keeps the default. */
export function resolveWolfJumperConfig(config: Partial<WolfJumperConfig> = {}): WolfJumperConfig {
  const resolved = { ...WOLF_JUMPER_DEFAULTS };
  for (const key of Object.keys(config) as (keyof WolfJumperConfig)[]) {
    const value = config[key];
    if (value !== undefined) {
      (resolved as Record<keyof WolfJumperConfig, unknown>)[key] = value;
    }
  }
  return resolved;
}

export function createInitialState(seed: number, config?: Partial<WolfJumperConfig>): GameState {
  return initialState(seed, resolveWolfJumperConfig(config));
}

function initialState(seed: number, config: WolfJumperConfig): GameState {
  return {
    config,
    time: 0,
    seed,
    enemies: [],
    bonuses: [],
    effects: NO_EFFECTS,
    score: 0,
    streak: 0,
    bestStreak: 0,
    hp: config.maxHp,
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
      return withRng(initialState(state.seed, state.config), scheduleSpawns);
    case "start":
      return state.gameOver ? state : withRng(state, scheduleSpawns);
    case "tick":
      return state.gameOver ? state : withRng(state, (s, rng) => tick(s, action.dtMs, rng));
    case "noteDetected":
      return state.gameOver ? state : killNote(state, action.pc);
    case "chordDetected":
      return state.gameOver
        ? state
        : withRng(state, (s, rng) => collectChord(s, action.chord, rng));
    case "spawnEnemy":
      return state.gameOver
        ? state
        : withRng(state, (s, rng) => spawnEnemy(s, rng, action.pc, action.lane));
    case "spawnBonus":
      return state.gameOver
        ? state
        : withRng(state, (s, rng) =>
            spawnBonus(s, rng, action.bonusType, action.chord, action.lane),
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
  const { firstBonusDelayMs, bonusIntervalMinMs } = state.config;
  return {
    ...state,
    nextEnemyAt: state.time,
    nextBonusAt:
      state.time + firstBonusDelayMs + rng.next() * (bonusIntervalMinMs - firstBonusDelayMs),
  };
}

function tick(state: GameState, dtMs: number, rng: SeededRandom): GameState {
  const cfg = state.config;
  const dt = Math.min(cfg.maxTickMs, Math.max(0, dtMs));
  if (dt === 0) return state;

  const time = state.time + dt;
  const speedFactor = state.effects.slowUntil > time ? cfg.slowFactor : 1;
  const shieldOn = state.effects.shieldUntil > time;
  const isFaded = (endedAt: number | null) => endedAt !== null && time - endedAt > cfg.fadeMs;

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
    const jitter = cfg.spawnJitterMin + rng.next() * cfg.spawnJitterSpread;
    next = { ...next, nextEnemyAt: time + computeSpawnMs(next.score, cfg) * jitter };
  }
  if (time >= next.nextBonusAt) {
    next = spawnBonus(next, rng);
    const interval =
      cfg.bonusIntervalMinMs + rng.next() * (cfg.bonusIntervalMaxMs - cfg.bonusIntervalMinMs);
    next = { ...next, nextBonusAt: time + interval };
  }
  return next;
}

function spawnEnemy(state: GameState, rng: SeededRandom, pc?: number, lane?: number): GameState {
  const cfg = state.config;
  let effects = state.effects;
  let notePc: number;
  if (pc !== undefined) {
    notePc = pc;
  } else if (effects.sameNoteRemaining > 0 && effects.sameNotePc !== null) {
    // The same-note bonus overrides the random draw.
    notePc = effects.sameNotePc;
    const remaining = effects.sameNoteRemaining - 1;
    effects = {
      ...effects,
      sameNoteRemaining: remaining,
      sameNotePc: remaining > 0 ? effects.sameNotePc : null,
    };
  } else {
    notePc = rng.pick(cfg.notePool);
  }
  const laneIndex = lane ?? rng.int(cfg.enemyLanes.length);

  const enemy: Enemy = {
    id: state.nextEnemyId,
    pc: notePc,
    progress: 0,
    speed: 1 / computeTravelMs(state.score, cfg),
    laneY: cfg.enemyLanes[laneIndex],
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
  chord?: ChordRef,
  lane?: number,
): GameState {
  const cfg = state.config;
  const bonus: Bonus = {
    id: state.nextBonusId,
    type: bonusType ?? rng.pick(cfg.bonusTypes),
    chord: chord ?? rng.pick(cfg.bonusChords),
    progress: 0,
    speed: 1 / cfg.bonusTravelMs,
    laneY: cfg.bonusLanes[lane ?? rng.int(cfg.bonusLanes.length)],
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

function collectChord(state: GameState, chord: ChordRef, rng: SeededRandom): GameState {
  const collected: BonusType[] = [];
  const bonuses = state.bonuses.map((b): Bonus => {
    if (b.status !== "alive" || !sameChord(b.chord, chord)) return b;
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
  const { effects, time, config: cfg } = state;
  switch (type) {
    case "hp":
      return { ...state, hp: Math.min(cfg.maxHp, state.hp + cfg.hpBonusAmount) };
    case "shield":
      return {
        ...state,
        effects: {
          ...effects,
          shieldUntil: Math.max(effects.shieldUntil, time + cfg.shieldDurationMs),
        },
      };
    case "slow":
      return {
        ...state,
        effects: {
          ...effects,
          slowUntil: Math.max(effects.slowUntil, time + cfg.slowDurationMs),
        },
      };
    case "samenote":
      return {
        ...state,
        effects: {
          ...effects,
          sameNoteRemaining: cfg.sameNoteCount,
          sameNotePc: rng.pick(cfg.notePool),
        },
      };
  }
}

// ---- Note detection helpers ----

export interface DominantNote {
  /** Pitch class 0..11. */
  pc: number;
  /** Mean chroma energy of that pitch class. */
  energy: number;
}

/** Appends `frame` to `history`, keeping the last `size` well-formed frames. */
export function pushChromaFrame(
  history: readonly Float32Array[],
  frame: Float32Array,
  size: number,
): readonly Float32Array[] {
  if (frame.length !== CHROMA_SIZE) return history;
  return [...history, frame].slice(-size);
}

/**
 * Strongest pitch class of the averaged frames, or `null` for no frames or
 * silence.
 */
export function dominantNote(frames: readonly Float32Array[]): DominantNote | null {
  if (frames.length === 0) return null;
  let best: DominantNote | null = null;
  for (let pc = 0; pc < CHROMA_SIZE; pc++) {
    let sum = 0;
    for (const f of frames) sum += f[pc];
    const energy = sum / frames.length;
    if (energy > 0 && (best === null || energy > best.energy)) best = { pc, energy };
  }
  return best;
}
