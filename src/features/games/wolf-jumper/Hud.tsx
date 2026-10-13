/**
 * Heads-up display: stats, health and active effects.
 *
 * Subscribes to a coarse snapshot (countdowns rounded up to 0.1 s), so it
 * re-renders at most ten times per second instead of on every frame.
 */

import { MAX_HP, findNoteDef } from "./constants";
import { computeTravelMs, shieldRemainingMs, slowRemainingMs, type GameState } from "./engine";
import { shallowEqual, useStoreSelector, type ReadableStore } from "./store";

const toTenths = (ms: number) => Math.ceil(ms / 100);

const selectHud = (s: GameState) => ({
  score: s.score,
  streak: s.streak,
  bestStreak: s.bestStreak,
  hp: s.hp,
  shieldTenths: toTenths(shieldRemainingMs(s)),
  slowTenths: toTenths(slowRemainingMs(s)),
  sameNotePc: s.effects.sameNotePc,
  sameNoteRemaining: s.effects.sameNoteRemaining,
});

const formatTenths = (tenths: number) => `${(tenths / 10).toFixed(1)}s`;

export function Hud({ store }: { store: ReadableStore<GameState> }) {
  const hud = useStoreSelector(store, selectHud, shallowEqual);
  const travelMs = computeTravelMs(hud.score);
  const sameNote = hud.sameNotePc !== null ? findNoteDef(hud.sameNotePc) : undefined;
  const shieldOn = hud.shieldTenths > 0;
  const slowOn = hud.slowTenths > 0;

  return (
    <>
      <div className="jumper-topbar">
        <div className="jumper-stats">
          <div>
            <span className="jumper-stat-label">Score</span>
            <span className="jumper-stat-value">{hud.score}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Streak</span>
            <span className="jumper-stat-value">{hud.streak}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Meilleur</span>
            <span className="jumper-stat-value">{hud.bestStreak}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Vitesse</span>
            <span className="jumper-stat-value">{(travelMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div className="jumper-hp">
          <span className="jumper-hp-label">PV</span>
          <div className="jumper-hp-hearts">
            {Array.from({ length: MAX_HP }, (_, i) => (
              <span key={i} className={i < hud.hp ? "heart full" : "heart empty"}>
                {i < hud.hp ? "❤" : "♡"}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="jumper-effects">
        {shieldOn && (
          <div className="jumper-effect shield">
            🛡 <span>{formatTenths(hud.shieldTenths)}</span>
          </div>
        )}
        {slowOn && (
          <div className="jumper-effect slow">
            🐢 <span>{formatTenths(hud.slowTenths)}</span>
          </div>
        )}
        {hud.sameNoteRemaining > 0 && sameNote && (
          <div className="jumper-effect samenote" style={{ borderColor: sameNote.color }}>
            🎯{" "}
            <span>
              {sameNote.name} ×{hud.sameNoteRemaining}
            </span>
          </div>
        )}
        {!shieldOn && !slowOn && hud.sameNoteRemaining === 0 && (
          <div className="jumper-effect placeholder">aucun effet actif</div>
        )}
      </div>
    </>
  );
}

interface DetectionStatusProps {
  gateOpen: boolean;
  noteName: string;
  noteEnergy: number;
  chordName: string;
  chordProbability: number;
}

/** What the detector currently hears, as seen by the game. */
export function DetectionStatus({
  gateOpen,
  noteName,
  noteEnergy,
  chordName,
  chordProbability,
}: DetectionStatusProps) {
  return (
    <div className="jumper-status">
      <div className="jumper-status-row">
        <span className="jumper-status-label">Note détectée :</span>
        <span className="jumper-status-detected">{gateOpen ? noteName : "—"}</span>
        <span className="jumper-status-energy">({(noteEnergy * 100).toFixed(0)}%)</span>
        <span className="jumper-status-label">| Accord :</span>
        <span className="jumper-status-detected">{gateOpen ? chordName : "—"}</span>
        <span className="jumper-status-energy">({(chordProbability * 100).toFixed(0)}%)</span>
        {!gateOpen && <span className="jumper-status-gated">[gate fermé]</span>}
      </div>
    </div>
  );
}
