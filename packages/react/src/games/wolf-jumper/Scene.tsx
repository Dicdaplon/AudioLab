"use client";

/**
 * The playfield. This is the only component that re-renders on every
 * animation frame: it subscribes to the moving entities and nothing else.
 *
 * Entities are positioned in a fixed 880 × 260 stage; the stage is scaled
 * to the width of its viewport so positions stay valid on any screen.
 */

import type { CSSProperties } from "react";

import { chordName, pitchClassName } from "@audiolab/core";
import {
  shieldRemainingMs,
  slowRemainingMs,
  type Bonus,
  type BonusType,
  type Enemy,
  type WolfJumperState,
  type WolfJumperConfig,
} from "@audiolab/core/games";
import { WOLF_ASPECT } from "./wolfArt";
import { WolfSprite } from "./WolfSprite";
import { Icon, type IconName } from "../../ui/Icon";
import { usePlotWidth } from "../../ui/usePlotWidth";
import {
  BONUS_SIZE,
  ENEMY_SIZE,
  GROUND_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  WOLF_X,
  bonusTypeLabels,
} from "./constants";
import { shallowEqual, useStoreSelector, type ReadableStore } from "./store";

const selectScene = (s: WolfJumperState) => ({
  config: s.config,
  enemies: s.enemies,
  bonuses: s.bonuses,
  shieldOn: shieldRemainingMs(s) > 0,
  slowOn: slowRemainingMs(s) > 0,
  gameOver: s.gameOver,
});

const selectFinalScore = (s: WolfJumperState) => ({ score: s.score, bestStreak: s.bestStreak });

const BONUS_ICON: Record<BonusType, IconName> = {
  hp: "heart",
  shield: "shield",
  slow: "slow",
  samenote: "target",
};

const MAX_SCALE = 1.6;

/** Rendered size of the wolf; its muzzle sits just past WOLF_X. */
const WOLF_SPRITE_WIDTH = 96;
const WOLF_SPRITE_HEIGHT = Math.round(WOLF_SPRITE_WIDTH * WOLF_ASPECT);

/** Horizontal centre of an entity: right edge at progress 0, the wolf at 1. */
function entityX(progress: number): number {
  return SCENE_WIDTH - progress * (SCENE_WIDTH - WOLF_X);
}

interface SceneProps {
  store: ReadableStore<WolfJumperState>;
  onRestart: () => void;
}

export function Scene({ store, onRestart }: SceneProps) {
  const { config, enemies, bonuses, shieldOn, slowOn, gameOver } = useStoreSelector(
    store,
    selectScene,
    shallowEqual,
  );
  const [viewportRef, viewportWidth] = usePlotWidth(SCENE_WIDTH);
  // Fill the viewport; cap the magnification so sprites stay in proportion.
  const scale = Math.min(MAX_SCALE, viewportWidth / SCENE_WIDTH);

  return (
    <div
      className="al-scene-viewport"
      ref={viewportRef}
      style={{ height: Math.round(SCENE_HEIGHT * scale) }}
    >
      <div
        className="al-scene"
        data-slow={slowOn ? "" : undefined}
        style={{
          width: SCENE_WIDTH,
          height: SCENE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <div className="al-scene__ground" style={{ top: GROUND_Y }} />

        <div
          className="al-scene__runner"
          data-shield={shieldOn ? "" : undefined}
          style={{ left: WOLF_X - WOLF_SPRITE_WIDTH * 0.66, top: GROUND_Y - WOLF_SPRITE_HEIGHT }}
          role="img"
          aria-label={shieldOn ? "the wolf, shielded" : "the wolf"}
        >
          <WolfSprite width={WOLF_SPRITE_WIDTH} />
        </div>

        {enemies.map((e) => (
          <EnemySprite key={e.id} enemy={e} />
        ))}
        {bonuses.map((b) => (
          <BonusSprite key={b.id} bonus={b} config={config} />
        ))}

        {gameOver && <GameOverOverlay store={store} onRestart={onRestart} />}
      </div>
    </div>
  );
}

function EnemySprite({ enemy }: { enemy: Enemy }) {
  return (
    <div
      className="al-scene__note"
      data-pc={enemy.pc}
      data-state={enemy.status}
      style={
        {
          left: entityX(enemy.progress) - ENEMY_SIZE / 2,
          top: GROUND_Y - ENEMY_SIZE + enemy.laneY,
          width: ENEMY_SIZE,
          height: ENEMY_SIZE,
          "--pc": `var(--al-viz-pc-${enemy.pc})`,
        } as CSSProperties
      }
    >
      <span>{pitchClassName(enemy.pc)}</span>
    </div>
  );
}

function BonusSprite({ bonus, config }: { bonus: Bonus; config: WolfJumperConfig }) {
  const labels = bonusTypeLabels(bonus.type, config);
  return (
    <div
      className="al-scene__bonus"
      data-type={bonus.type}
      data-state={bonus.status}
      style={{
        left: entityX(bonus.progress) - BONUS_SIZE / 2,
        top: GROUND_Y - BONUS_SIZE - 20 + bonus.laneY,
        width: BONUS_SIZE,
        height: BONUS_SIZE,
      }}
      title={labels.label}
    >
      <Icon name={BONUS_ICON[bonus.type]} size={14} className="al-scene__bonus-icon" />
      <span className="al-scene__bonus-chord">
        {chordName(bonus.chord.root, bonus.chord.quality)}
      </span>
      <span className="al-scene__bonus-short">{labels.short}</span>
    </div>
  );
}

function GameOverOverlay({ store, onRestart }: SceneProps) {
  const { score, bestStreak } = useStoreSelector(store, selectFinalScore, shallowEqual);
  return (
    <div className="al-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="al-overlay__card">
        <h3 className="al-overlay__title" id="game-over-title">
          Game over
        </h3>
        <p className="al-overlay__scores">
          Score <strong className="al-num">{score}</strong> · Best streak{" "}
          <strong className="al-num">{bestStreak}</strong>
        </p>
        <button type="button" className="al-btn al-btn--accent al-btn--touch" onClick={onRestart}>
          <Icon name="play" />
          Play again
        </button>
      </div>
    </div>
  );
}
