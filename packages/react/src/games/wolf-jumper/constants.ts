/**
 * Wolf Jumper presentation: scene geometry and English labels. The rules
 * and their tuning live in `@audiolab/core/games` (`WOLF_JUMPER_DEFAULTS`).
 */

import type { BonusType, WolfJumperConfig } from "@audiolab/core/games";

export const DEFAULT_NOISE_GATE_DB = -60;

// ---- Scene geometry (px, in stage coordinates; the stage scales to fit) ----

export const SCENE_WIDTH = 880;
export const SCENE_HEIGHT = 260;
export const WOLF_X = 100;
export const GROUND_Y = 200;
export const ENEMY_SIZE = 42;
export const BONUS_SIZE = 64;

// ---- Labels ----

export interface BonusTypeLabels {
  /** Short effect text shown on the bonus box. */
  short: string;
  label: string;
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(0)} s`;

/** English labels of a bonus effect, for the game's tuning. */
export function bonusTypeLabels(type: BonusType, config: WolfJumperConfig): BonusTypeLabels {
  switch (type) {
    case "hp": {
      const text = `+${config.hpBonusAmount} HP`;
      return { short: text, label: text };
    }
    case "shield":
      return {
        short: seconds(config.shieldDurationMs),
        label: `Shield ${seconds(config.shieldDurationMs)}`,
      };
    case "slow":
      return {
        short: seconds(config.slowDurationMs),
        label: `Slow ${seconds(config.slowDurationMs)}`,
      };
    case "samenote":
      return { short: `×${config.sameNoteCount}`, label: `Same note ×${config.sameNoteCount}` };
  }
}
