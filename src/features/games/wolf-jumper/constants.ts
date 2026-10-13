/** Wolf Jumper tuning, content pools and scene geometry. */

// ---- Difficulty ----

export const INITIAL_TRAVEL_MS = 6000;
export const MIN_TRAVEL_MS = 2200;
export const TRAVEL_DECAY_PER_HIT_MS = 100;

export const INITIAL_SPAWN_MS = 1800;
export const MIN_SPAWN_MS = 700;
export const SPAWN_DECAY_PER_HIT_MS = 35;
/** Each enemy spawn interval is scaled by a random factor in [MIN, MIN + SPREAD). */
export const SPAWN_JITTER_MIN = 0.85;
export const SPAWN_JITTER_SPREAD = 0.3;

export const FIRST_BONUS_DELAY_MS = 6000;
export const BONUS_INTERVAL_MIN_MS = 11000;
export const BONUS_INTERVAL_MAX_MS = 16000;
export const BONUS_TRAVEL_MS = 7000; // bonuses move a bit slower than enemies

/** Killed / reached / collected / expired entities linger this long for their fade-out. */
export const FADE_MS = 400;
/**
 * Upper bound for one simulation step. Larger frame gaps (background tab,
 * debugger pause) are clamped so enemies cannot teleport onto the wolf.
 */
export const MAX_TICK_MS = 100;

// ---- Detection ----

export const NOTE_SMOOTH_FRAMES = 3; // ~300 ms smoothing on instantaneous chroma
export const NOTE_CONFIRMATIONS = 2; // ~200 ms once stable
export const CHORD_CONFIRMATIONS = 3;
export const MIN_NOTE_ENERGY = 0.14;
export const MIN_CHORD_PROB = 0.18;

export const DEFAULT_NOISE_GATE_DB = -60;

// ---- Bonuses and health ----

export const SHIELD_DURATION_MS = 7000;
export const SLOW_DURATION_MS = 7000;
export const SLOW_FACTOR = 0.5;
export const SAME_NOTE_COUNT = 5;
export const HP_BONUS_AMOUNT = 2;
export const MAX_HP = 5;

// ---- Scene geometry (px) ----

export const SCENE_WIDTH = 880;
export const SCENE_HEIGHT = 260;
export const WOLF_X = 100;
export const GROUND_Y = 200;
export const ENEMY_SIZE = 42;
export const BONUS_SIZE = 64;
/** Vertical offsets of the enemy lanes, relative to the ground. */
export const ENEMY_LANES = [-20, 0, 20] as const;
/** Vertical offsets of the bonus lanes. */
export const BONUS_LANES = [-15, 15] as const;

// ---- Pools ----

export interface NoteDef {
  pc: number;
  name: string;
  color: string;
}

export const NOTE_POOL: readonly NoteDef[] = [
  { pc: 0, name: "C", color: "#e63946" },
  { pc: 2, name: "D", color: "#f4a261" },
  { pc: 4, name: "E", color: "#e9c46a" },
  { pc: 5, name: "F", color: "#3da26e" },
  { pc: 7, name: "G", color: "#4cc9f0" },
  { pc: 9, name: "A", color: "#8338ec" },
  { pc: 11, name: "B", color: "#ff6fb5" },
];

export function findNoteDef(pc: number): NoteDef | undefined {
  return NOTE_POOL.find((n) => n.pc === pc);
}

export const BONUS_CHORDS: readonly string[] = ["C", "G", "D", "F", "Am", "Em", "Dm"];

export type BonusType = "hp" | "shield" | "slow" | "samenote";

export interface BonusTypeDef {
  id: BonusType;
  icon: string;
  short: string;
  color: string;
  label: string;
}

export const BONUS_TYPES: readonly BonusTypeDef[] = [
  { id: "hp", icon: "❤", short: "+2", color: "#ff5050", label: "+2 HP" },
  { id: "shield", icon: "🛡", short: "7s", color: "#4cc9f0", label: "Bouclier 7 s" },
  { id: "slow", icon: "🐢", short: "7s", color: "#8338ec", label: "Slow 7 s" },
  { id: "samenote", icon: "🎯", short: "×5", color: "#ffd60a", label: "Même note ×5" },
];

export function findBonusTypeDef(type: BonusType): BonusTypeDef {
  const def = BONUS_TYPES.find((t) => t.id === type);
  if (!def) throw new Error(`unknown bonus type: ${type}`);
  return def;
}
