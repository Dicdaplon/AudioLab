"use client";

/**
 * Chord ear-training game.
 *
 * The app picks a target chord. The user plays it on their instrument.
 * Detection is considered a "hit" when the live detector reports the target
 * chord as top-1 for `CONFIRMATIONS_NEEDED` consecutive frames — that filters
 * out transient false matches during chord changes.
 *
 * Once a hit is confirmed, score / streak increment and a new (different)
 * target chord is drawn.
 */

import { useCallback, useEffect, useReducer, useState } from "react";

import type { ChordScore } from "@audiolab/core";
import { SelectField } from "../../components/Field";
import { Panel } from "../../components/Panel";
import { Segments } from "../../components/Segments";
import { Icon } from "../../ui/Icon";
import { MicPrompt } from "../MicPrompt";
import { useConfirmedDetection } from "../useConfirmedDetection";
import { CHORD_POOLS, DEFAULT_POOL, POOL_KEYS, pickChord, type PoolKey } from "./pools";
import { INITIAL_STATS, chordGameReducer } from "./scoring";

const CONFIRMATIONS_NEEDED = 3; // ~300 ms at 10 Hz on top of the 1 s chord window
const MIN_PROBABILITY = 0.18;
const HIT_FLASH_MS = 350;

interface ChordGameProps {
  /** Latest chord ranking from `useTonality` (already sorted by probability). */
  chords: ChordScore[];
  /** Whether the mic is currently capturing. */
  running: boolean;
  /** Tells the user how to start the mic if it isn't running. */
  onStart?: () => void;
}

export function ChordGame({ chords, running, onStart }: ChordGameProps) {
  const [poolKey, setPoolKey] = useState<PoolKey>(DEFAULT_POOL);
  const pool = CHORD_POOLS[poolKey].chords;

  // The first target is drawn after mount: a random draw during render would
  // differ between the server and the client and break hydration.
  const [target, setTarget] = useState("");
  useEffect(() => {
    if (!target) setTarget(pickChord(pool));
  }, [pool, target]);
  const [stats, dispatch] = useReducer(chordGameReducer, INITIAL_STATS);
  const [justHit, setJustHit] = useState(false);

  const top = chords[0];
  const topName = top?.name ?? "—";
  const topProb = top?.probability ?? 0;
  const match = running && topName === target;

  const advance = useCallback(
    (kind: "hit" | "skip") => {
      dispatch({ type: kind });
      if (kind === "hit") setJustHit(true);
      setTarget(pickChord(pool, target));
    },
    [pool, target],
  );

  const confirmation = useConfirmedDetection({
    frame: chords,
    label: running && top?.name === target ? target : null,
    probability: topProb,
    required: CONFIRMATIONS_NEEDED,
    minProbability: MIN_PROBABILITY,
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

  const changePool = (key: PoolKey) => {
    setPoolKey(key);
    const nextPool = CHORD_POOLS[key].chords;
    if (!nextPool.includes(target)) {
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
          value={poolKey}
          onChange={(v) => changePool(v as PoolKey)}
        >
          {POOL_KEYS.map((key) => (
            <option key={key} value={key}>
              {CHORD_POOLS[key].label} ({CHORD_POOLS[key].chords.length})
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
          <strong className="al-readout__value">{target || "—"}</strong>
        </div>

        <div className="al-game__progress">
          <Segments
            count={CONFIRMATIONS_NEEDED}
            filled={confirmation.count}
            label={`${confirmation.count} of ${CONFIRMATIONS_NEEDED} consecutive frames`}
          />
          <span className="al-game__progress-text al-num">
            {confirmation.count}/{CONFIRMATIONS_NEEDED} consecutive frames
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
          To validate, the target chord must be detected as top-1 for {CONFIRMATIONS_NEEDED}{" "}
          consecutive frames with a probability ≥ {(MIN_PROBABILITY * 100).toFixed(0)} %. Hold the
          chord for about 1 s so the analysis window can settle.
        </p>
      </Panel>
    </div>
  );
}
