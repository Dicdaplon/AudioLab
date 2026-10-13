/**
 * @audiolab/core/games — the pure engines of the ear-training games.
 *
 * No React, no timers, no display strings: notes are pitch classes
 * (0..11), chords are `{ root, quality }` references and pools have stable
 * ids. A UI (such as @audiolab/react) drives the reducers from its own
 * clock and detector and draws the labels it wants.
 */

export {
  EMPTY_CONFIRMATION,
  stepConfirmation,
  type ConfirmationOptions,
  type ConfirmationState,
  type ConfirmationStep,
} from "./confirmation";
export { SeededRandom, nextRandom, randomSeed } from "./rng";
export { chordKey, parseChordKey, sameChord, type ChordRef } from "./chordRef";
export {
  CHORD_GAME_DEFAULTS,
  CHORD_POOLS,
  CHORD_POOL_IDS,
  DEFAULT_CHORD_POOL,
  INITIAL_CHORD_GAME_STATS,
  chordGameReducer,
  pickChord,
  type ChordGameAction,
  type ChordGameConfig,
  type ChordGameStats,
  type ChordPoolId,
} from "./chordGame";
export {
  BONUS_TYPES,
  WOLF_JUMPER_DEFAULTS,
  WOLF_JUMPER_DETECTION_DEFAULTS,
  computeSpawnMs,
  computeTravelMs,
  createInitialState,
  dominantNote,
  gameReducer,
  pushChromaFrame,
  resolveWolfJumperConfig,
  shieldRemainingMs,
  slowRemainingMs,
  type ActiveEffects,
  type Bonus,
  type BonusStatus,
  type BonusType,
  type DominantNote,
  type Enemy,
  type EnemyStatus,
  type GameAction,
  type GameState,
  type WolfJumperConfig,
  type WolfJumperDetectionConfig,
} from "./wolfJumper";
