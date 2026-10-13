/**
 * The playfield. This is the only component that re-renders on every
 * animation frame: it subscribes to the moving entities and nothing else.
 *
 * Entities are positioned in a fixed 880 × 260 stage; the stage is scaled
 * to the width of its viewport so positions stay valid on any screen.
 */

import type { CSSProperties } from "react";

import { Mark } from "../../../components/Brand";
import { Icon, type IconName } from "../../../ui/Icon";
import { usePlotWidth } from "../../../ui/usePlotWidth";
import {
  BONUS_SIZE,
  ENEMY_SIZE,
  GROUND_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  WOLF_X,
  findBonusTypeDef,
  findNoteDef,
  type BonusType,
} from "./constants";
import {
  shieldRemainingMs,
  slowRemainingMs,
  type Bonus,
  type Enemy,
  type GameState,
} from "./engine";
import { shallowEqual, useStoreSelector, type ReadableStore } from "./store";

const selectScene = (s: GameState) => ({
  enemies: s.enemies,
  bonuses: s.bonuses,
  shieldOn: shieldRemainingMs(s) > 0,
  slowOn: slowRemainingMs(s) > 0,
  gameOver: s.gameOver,
});

const selectFinalScore = (s: GameState) => ({ score: s.score, bestStreak: s.bestStreak });

const BONUS_ICON: Record<BonusType, IconName> = {
  hp: "heart",
  shield: "shield",
  slow: "slow",
  samenote: "target",
};

const MAX_SCALE = 1.6;

/** Horizontal centre of an entity: right edge at progress 0, the wolf at 1. */
function entityX(progress: number): number {
  return SCENE_WIDTH - progress * (SCENE_WIDTH - WOLF_X);
}

interface SceneProps {
  store: ReadableStore<GameState>;
  onRestart: () => void;
}

export function Scene({ store, onRestart }: SceneProps) {
  const { enemies, bonuses, shieldOn, slowOn, gameOver } = useStoreSelector(
    store,
    selectScene,
    shallowEqual,
  );
  const [viewportRef, viewportWidth] = usePlotWidth(SCENE_WIDTH);
  // Fill the viewport; cap the magnification so sprites stay in proportion.
  const scale = Math.min(MAX_SCALE, viewportWidth / SCENE_WIDTH);

  return (
    <div
      className="scene-viewport"
      ref={viewportRef}
      style={{ height: Math.round(SCENE_HEIGHT * scale) }}
    >
      <div
        className="scene"
        data-slow={slowOn ? "" : undefined}
        style={{
          width: SCENE_WIDTH,
          height: SCENE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <div className="scene__ground" style={{ top: GROUND_Y }} />

        <div
          className="scene__runner"
          data-shield={shieldOn ? "" : undefined}
          style={{ left: WOLF_X, top: GROUND_Y - 50 }}
          role="img"
          aria-label={shieldOn ? "the wolf, shielded" : "the wolf"}
        >
          <Mark size={36} />
        </div>

        {enemies.map((e) => (
          <EnemySprite key={e.id} enemy={e} />
        ))}
        {bonuses.map((b) => (
          <BonusSprite key={b.id} bonus={b} />
        ))}

        {gameOver && <GameOverOverlay store={store} onRestart={onRestart} />}
      </div>
    </div>
  );
}

function EnemySprite({ enemy }: { enemy: Enemy }) {
  const note = findNoteDef(enemy.pc);
  return (
    <div
      className="scene__note"
      data-pc={enemy.pc}
      data-state={enemy.status}
      style={
        {
          left: entityX(enemy.progress) - ENEMY_SIZE / 2,
          top: GROUND_Y - ENEMY_SIZE + enemy.laneY,
          width: ENEMY_SIZE,
          height: ENEMY_SIZE,
          "--pc": `var(--viz-pc-${enemy.pc})`,
        } as CSSProperties
      }
    >
      <span>{note?.name}</span>
    </div>
  );
}

function BonusSprite({ bonus }: { bonus: Bonus }) {
  const typeDef = findBonusTypeDef(bonus.type);
  return (
    <div
      className="scene__bonus"
      data-type={bonus.type}
      data-state={bonus.status}
      style={{
        left: entityX(bonus.progress) - BONUS_SIZE / 2,
        top: GROUND_Y - BONUS_SIZE - 20 + bonus.laneY,
        width: BONUS_SIZE,
        height: BONUS_SIZE,
      }}
      title={typeDef.label}
    >
      <Icon name={BONUS_ICON[bonus.type]} size={14} className="scene__bonus-icon" />
      <span className="scene__bonus-chord">{bonus.chordName}</span>
      <span className="scene__bonus-short">{typeDef.short}</span>
    </div>
  );
}

function GameOverOverlay({ store, onRestart }: SceneProps) {
  const { score, bestStreak } = useStoreSelector(store, selectFinalScore, shallowEqual);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="overlay__card">
        <h3 className="overlay__title" id="game-over-title">
          Game over
        </h3>
        <p className="overlay__scores">
          Score <strong className="num">{score}</strong> · Best streak{" "}
          <strong className="num">{bestStreak}</strong>
        </p>
        <button type="button" className="btn btn--accent btn--touch" onClick={onRestart}>
          <Icon name="play" />
          Play again
        </button>
      </div>
    </div>
  );
}
