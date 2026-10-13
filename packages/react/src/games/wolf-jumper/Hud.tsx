"use client";

/**
 * Heads-up display: stats, health and active effects.
 *
 * Subscribes to a coarse snapshot (countdowns rounded up to 0.1 s), so it
 * re-renders at most ten times per second instead of on every frame.
 */

import type { CSSProperties } from "react";

import { pitchClassName } from "@audiolab/core";
import {
  computeTravelMs,
  shieldRemainingMs,
  slowRemainingMs,
  type GameState,
} from "@audiolab/core/games";
import { Segments } from "../../components/Segments";
import { Icon } from "../../ui/Icon";
import { shallowEqual, useStoreSelector, type ReadableStore } from "./store";

const toTenths = (ms: number) => Math.ceil(ms / 100);

const selectHud = (s: GameState) => ({
  config: s.config,
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
  const maxHp = hud.config.maxHp;
  const travelMs = computeTravelMs(hud.score, hud.config);
  const sameNotePc = hud.sameNotePc;
  const shieldOn = hud.shieldTenths > 0;
  const slowOn = hud.slowTenths > 0;
  const noEffect = !shieldOn && !slowOn && hud.sameNoteRemaining === 0;

  return (
    <div className="al-hud">
      <dl className="al-stat-grid al-hud__stats">
        <div className="al-stat">
          <dt className="al-stat__label">Score</dt>
          <dd className="al-stat__value">{hud.score}</dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">Streak</dt>
          <dd className="al-stat__value">{hud.streak}</dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">Best</dt>
          <dd className="al-stat__value">{hud.bestStreak}</dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">Speed</dt>
          <dd className="al-stat__value">{(travelMs / 1000).toFixed(1)} s</dd>
        </div>
      </dl>

      <div className="al-hud__row">
        <div className="al-hud__hp">
          <span className="al-surtitre">HP</span>
          <Segments
            className="al-segments--hp"
            count={maxHp}
            filled={hud.hp}
            label={`HP ${hud.hp} of ${maxHp}`}
          />
          <span className="al-num al-hud__hp-text">
            {hud.hp} / {maxHp}
          </span>
        </div>

        <ul className="al-hud__effects" aria-label="Active effects">
          {shieldOn && (
            <li className="al-badge al-badge--effect" data-type="shield">
              <Icon name="shield" size={14} />
              Shield <span className="al-num">{formatTenths(hud.shieldTenths)}</span>
            </li>
          )}
          {slowOn && (
            <li className="al-badge al-badge--effect" data-type="slow">
              <Icon name="slow" size={14} />
              Slow <span className="al-num">{formatTenths(hud.slowTenths)}</span>
            </li>
          )}
          {hud.sameNoteRemaining > 0 && sameNotePc !== null && (
            <li
              className="al-badge al-badge--effect"
              data-type="samenote"
              style={{ "--pc": `var(--al-viz-pc-${sameNotePc})` } as CSSProperties}
            >
              <Icon name="target" size={14} />
              Same note {pitchClassName(sameNotePc)}{" "}
              <span className="al-num">×{hud.sameNoteRemaining}</span>
            </li>
          )}
          {noEffect && <li className="al-hud__placeholder">no active effect</li>}
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
    <p className="al-status">
      <span className="al-status__label">Note</span>
      <span className="al-chip">{gateOpen ? noteName : "—"}</span>
      <span className="al-num">({(noteEnergy * 100).toFixed(0)} %)</span>
      <span className="al-status__sep" aria-hidden="true">
        ·
      </span>
      <span className="al-status__label">Chord</span>
      <span className="al-chip">{gateOpen ? chordName : "—"}</span>
      <span className="al-num">({(chordProbability * 100).toFixed(0)} %)</span>
      {!gateOpen && <span className="al-badge al-badge--gated">Gate closed</span>}
    </p>
  );
}
