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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CHORD_TEMPLATES, type ChordScore } from "../analysis/chordDetection";

const CONFIRMATIONS_NEEDED = 3; // ~300 ms at 10 Hz on top of the 1 s chord window
const MIN_PROBABILITY = 0.18;

type PoolKey =
  | "open-major"
  | "open-minor"
  | "open-mix"
  | "all-major"
  | "all-minor"
  | "all";

interface Pool {
  label: string;
  chords: string[];
}

/** Pool subsets the user can pick from. */
const POOLS: Record<PoolKey, Pool> = {
  "open-major": {
    label: "Majeurs ouverts (guitare)",
    chords: ["C", "G", "D", "A", "E", "F"],
  },
  "open-minor": {
    label: "Mineurs ouverts (guitare)",
    chords: ["Am", "Em", "Dm"],
  },
  "open-mix": {
    label: "Open chords mix",
    chords: ["C", "G", "D", "A", "E", "F", "Am", "Em", "Dm"],
  },
  "all-major": {
    label: "Tous majeurs (12)",
    chords: CHORD_TEMPLATES.filter((c) => c.quality === "maj").map((c) => c.name),
  },
  "all-minor": {
    label: "Tous mineurs (12)",
    chords: CHORD_TEMPLATES.filter((c) => c.quality === "min").map((c) => c.name),
  },
  all: {
    label: "Tous les accords (24)",
    chords: CHORD_TEMPLATES.map((c) => c.name),
  },
};

function pickRandom(pool: readonly string[], exclude?: string): string {
  if (pool.length === 0) return "";
  if (pool.length === 1) return pool[0];
  const filtered = exclude ? pool.filter((c) => c !== exclude) : pool;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

interface ChordGameProps {
  /** Latest chord ranking from `useTonality` (already sorted by probability). */
  chords: ChordScore[];
  /** Whether the mic is currently capturing. */
  running: boolean;
  /** Tells the user how to start the mic if it isn't running. */
  onStart?: () => void;
}

export function ChordGame({ chords, running, onStart }: ChordGameProps) {
  const [poolKey, setPoolKey] = useState<PoolKey>("open-mix");
  const pool = POOLS[poolKey].chords;

  const [target, setTarget] = useState<string>(() => pickRandom(pool));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [confirmation, setConfirmation] = useState(0);
  const [justHit, setJustHit] = useState(false);

  // Mirror of confirmation count for the detection effect, so we don't pay
  // the cost of a state setter on every "still matching" frame.
  const confRef = useRef(0);

  // Redraw a target when the pool changes (and current target falls out of it).
  useEffect(() => {
    if (!pool.includes(target)) {
      setTarget(pickRandom(pool));
      confRef.current = 0;
      setConfirmation(0);
    }
  }, [pool, target]);

  const advance = useCallback(
    (kind: "hit" | "skip") => {
      confRef.current = 0;
      setConfirmation(0);
      if (kind === "hit") {
        setScore((s) => s + 1);
        setStreak((s) => {
          const ns = s + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
        setJustHit(true);
        setTimeout(() => setJustHit(false), 350);
      } else {
        setSkipped((n) => n + 1);
        setStreak(0);
      }
      setTarget((cur) => pickRandom(pool, cur));
    },
    [pool],
  );

  // Detection loop — reacts to every new chord ranking.
  useEffect(() => {
    if (!running || chords.length === 0) {
      if (confRef.current > 0) {
        confRef.current = 0;
        setConfirmation(0);
      }
      return;
    }
    const top = chords[0];
    const isMatch =
      top.name === target && top.probability >= MIN_PROBABILITY;

    if (isMatch) {
      confRef.current += 1;
      setConfirmation(confRef.current);
      if (confRef.current >= CONFIRMATIONS_NEEDED) {
        advance("hit");
      }
    } else if (confRef.current > 0) {
      confRef.current = 0;
      setConfirmation(0);
    }
  }, [chords, target, running, advance]);

  const resetScores = useCallback(() => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSkipped(0);
    confRef.current = 0;
    setConfirmation(0);
    setTarget(pickRandom(pool));
  }, [pool]);

  const topName = chords[0]?.name ?? "—";
  const topProb = chords[0]?.probability ?? 0;
  const progress = Math.min(1, confirmation / CONFIRMATIONS_NEEDED);

  const poolEntries = useMemo(
    () =>
      (Object.keys(POOLS) as PoolKey[]).map((k) => ({
        key: k,
        label: POOLS[k].label,
        size: POOLS[k].chords.length,
      })),
    [],
  );

  return (
    <div className="chord-game">
      {!running && (
        <div className="game-mic-prompt">
          <p>🎤 Démarre le micro pour jouer.</p>
          {onStart && (
            <button type="button" className="mic-btn mic-start" onClick={onStart}>
              Démarrer le micro
            </button>
          )}
        </div>
      )}

      <div className="game-pool">
        <label htmlFor="pool">Banque d'accords :</label>
        <select
          id="pool"
          value={poolKey}
          onChange={(e) => setPoolKey(e.target.value as PoolKey)}
        >
          {poolEntries.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label} ({p.size})
            </option>
          ))}
        </select>
      </div>

      <div className={`game-target ${justHit ? "hit" : ""}`}>
        <span className="game-target-label">Joue :</span>
        <span className="game-target-name">{target}</span>
      </div>

      <div className="game-progress">
        <div
          className="game-progress-fill"
          style={{ width: `${(progress * 100).toFixed(0)}%` }}
        />
        <span className="game-progress-text">
          {confirmation}/{CONFIRMATIONS_NEEDED} frames consécutives
        </span>
      </div>

      <div className="game-detected">
        <span>Détecté : </span>
        <span
          className={
            "game-detected-name " +
            (running && topName === target ? "match" : "no-match")
          }
        >
          {topName}
        </span>
        <span className="game-detected-prob">
          ({(topProb * 100).toFixed(0)}%)
        </span>
      </div>

      <div className="game-stats">
        <div>
          <span className="game-stat-label">Score</span>
          <span className="game-stat-value">{score}</span>
        </div>
        <div>
          <span className="game-stat-label">Streak</span>
          <span className="game-stat-value">{streak}</span>
        </div>
        <div>
          <span className="game-stat-label">Meilleur</span>
          <span className="game-stat-value">{bestStreak}</span>
        </div>
        <div>
          <span className="game-stat-label">Passés</span>
          <span className="game-stat-value">{skipped}</span>
        </div>
      </div>

      <div className="game-actions">
        <button
          type="button"
          className="mic-btn mic-reset"
          onClick={() => advance("skip")}
        >
          Passer
        </button>
        <button
          type="button"
          className="mic-btn mic-reset"
          onClick={resetScores}
        >
          Reset score
        </button>
      </div>

      <p className="game-hint">
        Validation : l'accord ciblé doit être détecté en top-1 pendant{" "}
        {CONFIRMATIONS_NEEDED} frames consécutives avec une probabilité ≥{" "}
        {(MIN_PROBABILITY * 100).toFixed(0)}%. Tiens l'accord ≈ 1 s pour que la
        fenêtre d'analyse se stabilise.
      </p>
    </div>
  );
}
