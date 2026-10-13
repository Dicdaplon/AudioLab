/**
 * Wolf Jumper — endless-runner game with notes (enemies) + chord bonuses.
 *
 * Gameplay:
 *   - Notes (small coloured discs) fly in from the right. Play the matching
 *     pitch class to kill ALL alive enemies of that note at once (satisfying
 *     chain kills, especially with the "Same-note × 5" bonus).
 *   - Bonuses (golden boxes labelled with a chord) appear occasionally. Play
 *     the chord to collect them. Effects:
 *       ❤+2     restore 2 HP
 *       🛡 7 s  shield — incoming enemies are killed instead of damaging
 *       🐢 7 s  slow — enemies move at half speed
 *       🎯×5    next 5 enemy spawns share the same note
 *   - Score, streak and best streak are tracked. HP reaches 0 → Game Over.
 *
 * The rules live in `engine.ts`; detection and the animation loop in
 * `useWolfJumper.ts`.
 */

import type { ChordScore } from "../../../analysis/chordDetection";
import { MicPrompt } from "../MicPrompt";
import {
  BONUS_SIZE,
  ENEMY_SIZE,
  GROUND_Y,
  INITIAL_TRAVEL_MS,
  MAX_HP,
  MIN_TRAVEL_MS,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  WOLF_X,
  findBonusTypeDef,
  findNoteDef,
} from "./constants";
import { computeTravelMs, shieldRemainingMs, slowRemainingMs, type GameState } from "./engine";
import { useStoreSelector } from "./store";
import { useWolfJumper } from "./useWolfJumper";

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

const selectState = (s: GameState) => s;

interface WolfJumperProps {
  /** Instantaneous chroma (per-frame, ~100 ms). */
  instantaneousChroma: Float32Array;
  /** Ranked chord scores (1 s window). */
  chords: ChordScore[];
  /** Mic running. */
  running: boolean;
  /** Average dB signal level in music band. */
  signalLevelDb: number;
  /** Start mic callback. */
  onStart?: () => void;
}

export function WolfJumper({
  instantaneousChroma,
  chords,
  running,
  signalLevelDb,
  onStart,
}: WolfJumperProps) {
  const game = useWolfJumper({ instantaneousChroma, chords, running, signalLevelDb });
  const { noiseGateDb, setNoiseGateDb, gateOpen, note, reset: resetGame } = game;
  const state = useStoreSelector(game.store, selectState);
  const { enemies, bonuses, effects, score, streak, bestStreak, hp, gameOver } = state;

  // --- Noise gate ---
  const signalNorm = clamp((signalLevelDb + 90) / 80, 0, 1);
  const gateNorm = clamp((noiseGateDb + 90) / 80, 0, 1);

  // --- Computed UI values (game clock, no wall-clock reads in render) ---
  const shieldRemaining = shieldRemainingMs(state);
  const slowRemaining = slowRemainingMs(state);
  const shieldOn = shieldRemaining > 0;
  const slowOn = slowRemaining > 0;
  const currentTravelMs = computeTravelMs(score);

  const detectedNoteName = note ? (findNoteDef(note.pc)?.name ?? "—") : "—";
  const topChord = chords[0]?.name ?? "—";
  const topChordProb = chords[0]?.probability ?? 0;

  return (
    <div className="jumper">
      <div className="jumper-topbar">
        <div className="jumper-stats">
          <div>
            <span className="jumper-stat-label">Score</span>
            <span className="jumper-stat-value">{score}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Streak</span>
            <span className="jumper-stat-value">{streak}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Meilleur</span>
            <span className="jumper-stat-value">{bestStreak}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Vitesse</span>
            <span className="jumper-stat-value">{(currentTravelMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div className="jumper-hp">
          <span className="jumper-hp-label">PV</span>
          <div className="jumper-hp-hearts">
            {Array.from({ length: MAX_HP }, (_, i) => (
              <span key={i} className={i < hp ? "heart full" : "heart empty"}>
                {i < hp ? "❤" : "♡"}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="jumper-effects">
        {shieldOn && (
          <div className="jumper-effect shield">
            🛡 <span>{(shieldRemaining / 1000).toFixed(1)}s</span>
          </div>
        )}
        {slowOn && (
          <div className="jumper-effect slow">
            🐢 <span>{(slowRemaining / 1000).toFixed(1)}s</span>
          </div>
        )}
        {effects.sameNoteRemaining > 0 && effects.sameNotePc !== null && (
          <div
            className="jumper-effect samenote"
            style={{ borderColor: findNoteDef(effects.sameNotePc)?.color }}
          >
            🎯{" "}
            <span>
              {findNoteDef(effects.sameNotePc)?.name} ×{effects.sameNoteRemaining}
            </span>
          </div>
        )}
        {!shieldOn && !slowOn && effects.sameNoteRemaining === 0 && (
          <div className="jumper-effect placeholder">aucun effet actif</div>
        )}
      </div>

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

        {enemies.map((e) => {
          const noteDef = findNoteDef(e.pc);
          const x = SCENE_WIDTH - e.progress * (SCENE_WIDTH - WOLF_X);
          const cls =
            "jumper-enemy " +
            (e.status === "killed" ? "killed " : "") +
            (e.status === "reached" ? "reached " : "");
          return (
            <div
              key={e.id}
              className={cls}
              style={{
                left: x - ENEMY_SIZE / 2,
                top: GROUND_Y - ENEMY_SIZE + e.laneY,
                width: ENEMY_SIZE,
                height: ENEMY_SIZE,
                background: noteDef?.color,
                borderColor: noteDef?.color,
              }}
            >
              <span>{noteDef?.name}</span>
            </div>
          );
        })}

        {bonuses.map((b) => {
          const x = SCENE_WIDTH - b.progress * (SCENE_WIDTH - WOLF_X);
          const cls =
            "jumper-bonus " +
            (b.status === "collected" ? "collected " : "") +
            (b.status === "expired" ? "expired " : "");
          const typeDef = findBonusTypeDef(b.type);
          return (
            <div
              key={b.id}
              className={cls}
              style={{
                left: x - BONUS_SIZE / 2,
                top: GROUND_Y - BONUS_SIZE - 20 + b.laneY,
                width: BONUS_SIZE,
                height: BONUS_SIZE,
                borderColor: typeDef.color,
              }}
              title={typeDef.label}
            >
              <span className="jumper-bonus-icon">{typeDef.icon}</span>
              <span className="jumper-bonus-chord">{b.chordName}</span>
              <span className="jumper-bonus-short">{typeDef.short}</span>
            </div>
          );
        })}

        {gameOver && (
          <div className="jumper-overlay">
            <div className="jumper-overlay-card">
              <h3>Game Over</h3>
              <p>
                Score : <strong>{score}</strong> · Meilleur streak : <strong>{bestStreak}</strong>
              </p>
              <button type="button" className="mic-btn mic-start" onClick={resetGame}>
                Rejouer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="jumper-noisegate">
        <div className="jumper-noisegate-header">
          <label htmlFor="gate">Noise gate</label>
          <span className="jumper-noisegate-value">{noiseGateDb.toFixed(0)} dB</span>
        </div>
        <div className="jumper-noisegate-meter">
          <div
            className="jumper-noisegate-bar"
            style={{ width: `${(signalNorm * 100).toFixed(1)}%` }}
          />
          <div
            className={`jumper-noisegate-threshold ${gateOpen ? "open" : "closed"}`}
            style={{ left: `${(gateNorm * 100).toFixed(1)}%` }}
            title="Seuil du noise gate"
          />
          <span className="jumper-noisegate-current">{signalLevelDb.toFixed(0)} dB</span>
        </div>
        <input
          id="gate"
          type="range"
          min={-90}
          max={-20}
          step={1}
          value={noiseGateDb}
          onChange={(e) => setNoiseGateDb(Number(e.target.value))}
        />
      </div>

      <div className="jumper-status">
        <div className="jumper-status-row">
          <span className="jumper-status-label">Note détectée :</span>
          <span className="jumper-status-detected">{gateOpen ? detectedNoteName : "—"}</span>
          <span className="jumper-status-energy">({((note?.energy ?? 0) * 100).toFixed(0)}%)</span>
          <span className="jumper-status-label">| Accord :</span>
          <span className="jumper-status-detected">{gateOpen ? topChord : "—"}</span>
          <span className="jumper-status-energy">({(topChordProb * 100).toFixed(0)}%)</span>
          {!gateOpen && <span className="jumper-status-gated">[gate fermé]</span>}
        </div>
      </div>

      {!running && <MicPrompt message="Démarre le micro pour lancer le jeu." onStart={onStart} />}

      <div className="game-actions">
        <button type="button" className="mic-btn mic-reset" onClick={resetGame}>
          Reset
        </button>
      </div>

      <p className="game-hint">
        Joue la <strong>note</strong> sur l'obstacle pour le détruire (kill chain : toutes les notes
        identiques sur l'écran tombent d'un coup). Les bonus dorés sont des <strong>accords</strong>{" "}
        à jouer pour activer un effet : ❤+2, 🛡 7 s, 🐢 7 s, 🎯 5 notes identiques. La vitesse
        augmente avec le score ({(INITIAL_TRAVEL_MS / 1000).toFixed(1)} s →{" "}
        {(MIN_TRAVEL_MS / 1000).toFixed(1)} s). Détection note ≈ 300 ms (smoothing 3 frames + 2
        frames de confirmation). Détection accord = top-1 sur la fenêtre 1 s + 3 frames de
        confirmation.
      </p>
    </div>
  );
}
