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

import type { ChordScore } from "../../../analysis/chordDetection";
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

  const [target, setTarget] = useState(() => pickChord(pool));
  const [stats, dispatch] = useReducer(chordGameReducer, INITIAL_STATS);
  const [justHit, setJustHit] = useState(false);

  const top = chords[0];
  const topName = top?.name ?? "—";
  const topProb = top?.probability ?? 0;

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

  const progress = Math.min(1, confirmation.count / CONFIRMATIONS_NEEDED);

  return (
    <div className="chord-game">
      {!running && <MicPrompt message="Start the microphone to play." onStart={onStart} />}

      <div className="game-pool">
        <label htmlFor="pool">Chord set:</label>
        <select id="pool" value={poolKey} onChange={(e) => changePool(e.target.value as PoolKey)}>
          {POOL_KEYS.map((key) => (
            <option key={key} value={key}>
              {CHORD_POOLS[key].label} ({CHORD_POOLS[key].chords.length})
            </option>
          ))}
        </select>
      </div>

      <div className={`game-target ${justHit ? "hit" : ""}`}>
        <span className="game-target-label">Play:</span>
        <span className="game-target-name">{target}</span>
      </div>

      <div className="game-progress">
        <div className="game-progress-fill" style={{ width: `${(progress * 100).toFixed(0)}%` }} />
        <span className="game-progress-text">
          {confirmation.count}/{CONFIRMATIONS_NEEDED} consecutive frames
        </span>
      </div>

      <div className="game-detected">
        <span>Detected: </span>
        <span
          className={"game-detected-name " + (running && topName === target ? "match" : "no-match")}
        >
          {topName}
        </span>
        <span className="game-detected-prob">({(topProb * 100).toFixed(0)}%)</span>
      </div>

      <div className="game-stats">
        <div>
          <span className="game-stat-label">Score</span>
          <span className="game-stat-value">{stats.score}</span>
        </div>
        <div>
          <span className="game-stat-label">Streak</span>
          <span className="game-stat-value">{stats.streak}</span>
        </div>
        <div>
          <span className="game-stat-label">Best</span>
          <span className="game-stat-value">{stats.bestStreak}</span>
        </div>
        <div>
          <span className="game-stat-label">Skipped</span>
          <span className="game-stat-value">{stats.skipped}</span>
        </div>
      </div>

      <div className="game-actions">
        <button type="button" className="mic-btn mic-reset" onClick={skip}>
          Skip
        </button>
        <button type="button" className="mic-btn mic-reset" onClick={resetScores}>
          Reset score
        </button>
      </div>

      <p className="game-hint">
        To validate, the target chord must be detected as top-1 for {CONFIRMATIONS_NEEDED}{" "}
        consecutive frames with a probability ≥ {(MIN_PROBABILITY * 100).toFixed(0)}%. Hold the
        chord for about 1 s so the analysis window can settle.
      </p>
    </div>
  );
}
