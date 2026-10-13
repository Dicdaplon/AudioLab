/**
 * The playfield. This is the only component that re-renders on every
 * animation frame: it subscribes to the moving entities and nothing else.
 */

import {
  BONUS_SIZE,
  ENEMY_SIZE,
  GROUND_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  WOLF_X,
  findBonusTypeDef,
  findNoteDef,
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

  return (
    <div
      className={`jumper-scene ${slowOn ? "slow-tint" : ""}`}
      style={{ width: SCENE_WIDTH, height: SCENE_HEIGHT }}
    >
      <div className="jumper-sky" />
      <div className="jumper-ground" style={{ top: GROUND_Y }} />

      <div
        className={`jumper-wolf-wrap ${shieldOn ? "shielded" : ""}`}
        style={{ left: WOLF_X, top: GROUND_Y - 50 }}
      >
        {shieldOn && <div className="jumper-wolf-shield" />}
        <div className="jumper-wolf">🐺</div>
      </div>

      {enemies.map((e) => (
        <EnemySprite key={e.id} enemy={e} />
      ))}
      {bonuses.map((b) => (
        <BonusSprite key={b.id} bonus={b} />
      ))}

      {gameOver && <GameOverOverlay store={store} onRestart={onRestart} />}
    </div>
  );
}

function EnemySprite({ enemy }: { enemy: Enemy }) {
  const note = findNoteDef(enemy.pc);
  const statusClass = enemy.status === "alive" ? "" : `${enemy.status} `;
  return (
    <div
      className={`jumper-enemy ${statusClass}`}
      style={{
        left: entityX(enemy.progress) - ENEMY_SIZE / 2,
        top: GROUND_Y - ENEMY_SIZE + enemy.laneY,
        width: ENEMY_SIZE,
        height: ENEMY_SIZE,
        background: note?.color,
        borderColor: note?.color,
      }}
    >
      <span>{note?.name}</span>
    </div>
  );
}

function BonusSprite({ bonus }: { bonus: Bonus }) {
  const typeDef = findBonusTypeDef(bonus.type);
  const statusClass = bonus.status === "alive" ? "" : `${bonus.status} `;
  return (
    <div
      className={`jumper-bonus ${statusClass}`}
      style={{
        left: entityX(bonus.progress) - BONUS_SIZE / 2,
        top: GROUND_Y - BONUS_SIZE - 20 + bonus.laneY,
        width: BONUS_SIZE,
        height: BONUS_SIZE,
        borderColor: typeDef.color,
      }}
      title={typeDef.label}
    >
      <span className="jumper-bonus-icon">{typeDef.icon}</span>
      <span className="jumper-bonus-chord">{bonus.chordName}</span>
      <span className="jumper-bonus-short">{typeDef.short}</span>
    </div>
  );
}

function GameOverOverlay({ store, onRestart }: SceneProps) {
  const { score, bestStreak } = useStoreSelector(store, selectFinalScore, shallowEqual);
  return (
    <div className="jumper-overlay">
      <div className="jumper-overlay-card">
        <h3>Game Over</h3>
        <p>
          Score: <strong>{score}</strong> · Best streak: <strong>{bestStreak}</strong>
        </p>
        <button type="button" className="mic-btn mic-start" onClick={onRestart}>
          Play again
        </button>
      </div>
    </div>
  );
}
