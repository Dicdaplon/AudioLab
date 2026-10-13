"use client";

/**
 * Chord ear-training game.
 *
 * The app picks a target chord from a pool. The user plays it on their
 * instrument. Detection is considered a "hit" when the live detector
 * reports the target chord as top-1 for `confirmations` consecutive frames
 * (that filters out transient false matches during chord changes).
 *
 * Once a hit is confirmed, score / streak increment and a new (different)
 * target chord is drawn. The rules (pools, draw, scoring, confirmation)
 * come from `@audiolab/core/games`; this file is the English UI.
 */

import { useCallback, useEffect, useReducer, useState } from "react";

import { type ChordScore, chordName } from "@audiolab/core";
import {
  CHORD_GAME_DEFAULTS,
  CHORD_POOLS,
  CHORD_POOL_IDS,
  type ChordPoolId,
  type ChordRef,
  chordGameReducer,
  chordKey,
  DEFAULT_CHORD_POOL,
  INITIAL_CHORD_GAME_STATS,
  pickChord,
  sameChord,
} from "@audiolab/core/games";
import { SelectField } from "../../components/Field";
import { Panel } from "../../components/Panel";
import { Segments } from "../../components/Segments";
import { Icon } from "../../ui/Icon";
import { MicPrompt } from "../MicPrompt";
import { useConfirmedDetection } from "../useConfirmedDetection";
import { CHORD_POOL_LABELS_EN } from "./labels";

const HIT_FLASH_MS = 350;

interface ChordGameProps {
  /** Latest chord ranking from `useTonality` (already sorted by probability). */
  chords: ChordScore[];
  /** Whether the mic is currently capturing. */
  running: boolean;
  /** Tells the user how to start the mic if it isn't running. */
  onStart?: () => void;
  /** Consecutive frames needed for a hit. Default `CHORD_GAME_DEFAULTS.confirmations`. */
  confirmations?: number;
  /** Minimum top-1 score of a counted frame. Default `CHORD_GAME_DEFAULTS.minProbability`. */
  minProbability?: number;
}

export function ChordGame({
  chords,
  running,
  onStart,
  confirmations = CHORD_GAME_DEFAULTS.confirmations,
  minProbability = CHORD_GAME_DEFAULTS.minProbability,
}: ChordGameProps) {
  const [poolId, setPoolId] = useState<ChordPoolId>(DEFAULT_CHORD_POOL);
  const pool = CHORD_POOLS[poolId];

  // The first target is drawn after mount: a random draw during render would
  // differ between the server and the client and break hydration.
  const [target, setTarget] = useState<ChordRef | null>(null);
  useEffect(() => {
    if (!target) setTarget(pickChord(pool));
  }, [pool, target]);
  const [stats, dispatch] = useReducer(chordGameReducer, INITIAL_CHORD_GAME_STATS);
  const [justHit, setJustHit] = useState(false);

  const top = chords[0];
  const topName = top?.name ?? "—";
  const topProb = top?.probability ?? 0;
  const match = running && top !== undefined && target !== null && sameChord(top, target);

  const advance = useCallback(
    (kind: "hit" | "skip") => {
      dispatch({ type: kind });
      if (kind === "hit") setJustHit(true);
      setTarget(pickChord(pool, target ?? undefined));
    },
    [pool, target],
  );

  const confirmation = useConfirmedDetection({
    frame: chords,
    label: match ? chordKey(target) : null,
    probability: topProb,
    required: confirmations,
    minProbability,
    onConfirm: () => advance("hit"),
  });
  const { reset: resetConfirmation } = confirmation;

  useEffect(() => {
    if (!justHit) return;
    const t = window.setTimeout(() => setJustHit(false), HIT_FLASH_MS);
    return () => window.clearTimeout(t);
  }, [justHit]);

  const skip = () => {
    resetConfirmation();
    advance("skip");
  };

  const resetScores = () => {
    dispatch({ type: "reset" });
    resetConfirmation();
    setTarget(pickChord(pool));
  };

  const changePool = (id: ChordPoolId) => {
    setPoolId(id);
    const nextPool = CHORD_POOLS[id];
    if (!target || !nextPool.some((c) => sameChord(c, target))) {
      setTarget(pickChord(nextPool));
      resetConfirmation();
    }
  };

  return (
    <div className="al-game al-game--chords">
      {!running && <MicPrompt message="Start the microphone to play." onStart={onStart} />}

      <Panel className="al-game__panel">
        <SelectField
          id="pool"
          label="Chord set"
          value={poolId}
          onChange={(v) => changePool(v as ChordPoolId)}
        >
          {CHORD_POOL_IDS.map((id) => (
            <option key={id} value={id}>
              {CHORD_POOL_LABELS_EN[id]} ({CHORD_POOLS[id].length})
            </option>
          ))}
        </SelectField>

        <div
          className="al-readout al-readout--target"
          data-hit={justHit ? "" : undefined}
          role="group"
          aria-label="Target chord"
        >
          <span className="al-surtitre">Play</span>
          <strong className="al-readout__value">
            {target ? chordName(target.root, target.quality) : "—"}
          </strong>
        </div>

        <div className="al-game__progress">
          <Segments
            count={confirmations}
            filled={confirmation.count}
            label={`${confirmation.count} of ${confirmations} consecutive frames`}
          />
          <span className="al-game__progress-text al-num">
            {confirmation.count}/{confirmations} consecutive frames
          </span>
        </div>

        <p className="al-game__status">
          Detected:{" "}
          <span className={match ? "al-chip al-chip--match" : "al-chip"}>
            {match && <Icon name="check" size={14} />}
            {topName}
          </span>{" "}
          <span className="al-num">({(topProb * 100).toFixed(0)} %)</span>
        </p>

        <dl className="al-stat-grid">
          <div className="al-stat">
            <dt className="al-stat__label">Score</dt>
            <dd className="al-stat__value">{stats.score}</dd>
          </div>
          <div className="al-stat">
            <dt className="al-stat__label">Streak</dt>
            <dd className="al-stat__value">{stats.streak}</dd>
          </div>
          <div className="al-stat">
            <dt className="al-stat__label">Best</dt>
            <dd className="al-stat__value">{stats.bestStreak}</dd>
          </div>
          <div className="al-stat">
            <dt className="al-stat__label">Skipped</dt>
            <dd className="al-stat__value">{stats.skipped}</dd>
          </div>
        </dl>

        <div className="al-game__actions">
          <button type="button" className="al-btn al-btn--quiet al-btn--touch" onClick={skip}>
            Skip
          </button>
          <button
            type="button"
            className="al-btn al-btn--quiet al-btn--touch"
            onClick={resetScores}
          >
            <Icon name="reset" />
            Reset score
          </button>
        </div>

        <p className="al-hint">
          To validate, the target chord must be detected as top-1 for {confirmations} consecutive
          frames with a probability ≥ {(minProbability * 100).toFixed(0)} %. Hold the chord for
          about 1 s so the analysis window can settle.
        </p>
      </Panel>
    </div>
  );
}
