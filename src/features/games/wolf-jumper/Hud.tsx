/**
 * Heads-up display: stats, health and active effects.
 *
 * Subscribes to a coarse snapshot (countdowns rounded up to 0.1 s), so it
 * re-renders at most ten times per second instead of on every frame.
 */

import type { CSSProperties } from "react";

import { Segments } from "../../../components/Segments";
import { Icon } from "../../../ui/Icon";
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

const formatTenths = (tenths: number) => `${(tenths / 10).toFixed(1)} s`;

export function Hud({ store }: { store: ReadableStore<GameState> }) {
  const hud = useStoreSelector(store, selectHud, shallowEqual);
  const travelMs = computeTravelMs(hud.score);
  const sameNote = hud.sameNotePc !== null ? findNoteDef(hud.sameNotePc) : undefined;
  const shieldOn = hud.shieldTenths > 0;
  const slowOn = hud.slowTenths > 0;
  const noEffect = !shieldOn && !slowOn && hud.sameNoteRemaining === 0;

  return (
    <div className="hud">
      <dl className="stat-grid hud__stats">
        <div className="stat">
          <dt className="stat__label">Score</dt>
          <dd className="stat__value">{hud.score}</dd>
        </div>
        <div className="stat">
          <dt className="stat__label">Streak</dt>
          <dd className="stat__value">{hud.streak}</dd>
        </div>
        <div className="stat">
          <dt className="stat__label">Best</dt>
          <dd className="stat__value">{hud.bestStreak}</dd>
        </div>
        <div className="stat">
          <dt className="stat__label">Speed</dt>
          <dd className="stat__value">{(travelMs / 1000).toFixed(1)} s</dd>
        </div>
      </dl>

      <div className="hud__row">
        <div className="hud__hp">
          <span className="surtitre">HP</span>
          <Segments
            className="segments--hp"
            count={MAX_HP}
            filled={hud.hp}
            label={`HP ${hud.hp} of ${MAX_HP}`}
          />
          <span className="num hud__hp-text">
            {hud.hp} / {MAX_HP}
          </span>
        </div>

        <ul className="hud__effects" aria-label="Active effects">
          {shieldOn && (
            <li className="badge badge--effect" data-type="shield">
              <Icon name="shield" size={14} />
              Shield <span className="num">{formatTenths(hud.shieldTenths)}</span>
            </li>
          )}
          {slowOn && (
            <li className="badge badge--effect" data-type="slow">
              <Icon name="slow" size={14} />
              Slow <span className="num">{formatTenths(hud.slowTenths)}</span>
            </li>
          )}
          {hud.sameNoteRemaining > 0 && sameNote && (
            <li
              className="badge badge--effect"
              data-type="samenote"
              style={{ "--pc": `var(--viz-pc-${sameNote.pc})` } as CSSProperties}
            >
              <Icon name="target" size={14} />
              Same note {sameNote.name} <span className="num">×{hud.sameNoteRemaining}</span>
            </li>
          )}
          {noEffect && <li className="hud__placeholder">no active effect</li>}
        </ul>
      </div>
    </div>
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
    <p className="status">
      <span className="status__label">Note</span>
      <span className="chip">{gateOpen ? noteName : "—"}</span>
      <span className="num">({(noteEnergy * 100).toFixed(0)} %)</span>
      <span className="status__sep" aria-hidden="true">
        ·
      </span>
      <span className="status__label">Chord</span>
      <span className="chip">{gateOpen ? chordName : "—"}</span>
      <span className="num">({(chordProbability * 100).toFixed(0)} %)</span>
      {!gateOpen && <span className="badge badge--gated">Gate closed</span>}
    </p>
  );
}
