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

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import { type ChordScore, chordName, GATE_STRICTNESS } from "@audiolab/core";
import {
  CHORD_GAME_DEFAULTS,
  CHORD_POOLS,
  CHORD_POOL_IDS,
  type ChordAcceptPolicy,
  type ChordRef,
  chordGameReducer,
  chordKey,
  DEFAULT_CHORD_POOL,
  INITIAL_CHORD_GAME_STATS,
  matchesTarget,
  pickChord,
  sameChord,
} from "@audiolab/core/games";
import { SelectField } from "../../components/Field";
import { Panel } from "../../components/Panel";
import { GateStrictnessField } from "../../components/GateStrictnessField";
import { Segments } from "../../components/Segments";
import { useAdaptiveGate } from "../../hooks/useAdaptiveGate";
import { Icon } from "../../ui/Icon";
import { MicPrompt } from "../MicPrompt";
import { useConfirmedDetection } from "../useConfirmedDetection";
import { CHORD_POOL_LABELS_EN } from "./labels";

const HIT_FLASH_MS = 350;
const NO_CHORDS: readonly ChordRef[] = [];

/** A chord set the player can pick, with its label. */
export interface ChordGamePool {
  id: string;
  label: string;
  chords: readonly ChordRef[];
}

/** The built-in pools of `@audiolab/core/games`, with their English labels. */
export const DEFAULT_CHORD_GAME_POOLS: readonly ChordGamePool[] = CHORD_POOL_IDS.map((id) => ({
  id,
  label: CHORD_POOL_LABELS_EN[id],
  chords: CHORD_POOLS[id],
}));

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
  /**
   * Chord sets offered to the player, in order. Default the built-in pools.
   * The detector must rank the qualities they use (`chordQualities` of `useTonality`).
   */
  pools?: readonly ChordGamePool[];
  /** Which detections count for the target (see `matchesTarget`). Default "exact". */
  accept?: ChordAcceptPolicy;
  /**
   * Signal level of the latest frame (`useTonality().signalLevelDb`). Given, an
   * adaptive noise gate learns the room and a chord heard in the noise does not
   * count; the player gets a "Noise filter" slider. Omitted: no gate.
   */
  signalLevelDb?: number;
  /** Starting strictness of that gate, 0 gentle … 1 strict. Default `GATE_STRICTNESS.chords`. */
  gateStrictness?: number;
}

export function ChordGame({
  chords,
  running,
  onStart,
  confirmations = CHORD_GAME_DEFAULTS.confirmations,
  minProbability = CHORD_GAME_DEFAULTS.minProbability,
  pools = DEFAULT_CHORD_GAME_POOLS,
  accept = "exact",
  signalLevelDb,
  gateStrictness = GATE_STRICTNESS.chords,
}: ChordGameProps) {
  const [strictness, setStrictness] = useState(gateStrictness);
  const gate = useAdaptiveGate(signalLevelDb, chords, {
    strictness,
    enabled: running && signalLevelDb !== undefined,
  });
  const gateOpen = signalLevelDb === undefined || gate === null || gate.open;
  const [poolId, setPoolId] = useState<string>(DEFAULT_CHORD_POOL);
  const selected = pools.find((p) => p.id === poolId) ?? pools[0];
  // Pools are constants in practice: keyed on the selected pool, not the list identity.
  const pool = useMemo(() => selected?.chords ?? NO_CHORDS, [selected]);

  // The first target is drawn after mount: a random draw during render would
  // differ between the server and the client and break hydration.
  const [target, setTarget] = useState<ChordRef | null>(null);
  useEffect(() => {
    if (!target) setTarget(pickChord(pool));
  }, [pool, target]);
  const [stats, dispatch] = useReducer(chordGameReducer, INITIAL_CHORD_GAME_STATS);
  const [justHit, setJustHit] = useState(false);

  const top = chords[0];
  const topName = (gateOpen && top?.name) || "—";
  const topProb = top?.probability ?? 0;
  const match =
    running &&
    gateOpen &&
    top !== undefined &&
    target !== null &&
    matchesTarget(top, target, { accept });

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

  const changePool = (id: string) => {
    setPoolId(id);
    const nextPool = pools.find((p) => p.id === id)?.chords ?? [];
    if (!target || !nextPool.some((c) => sameChord(c, target))) {
      setTarget(pickChord(nextPool));
      resetConfirmation();
    }
  };

  return (
    <div className="al-game al-game--chords">
      {!running && <MicPrompt message="Start the microphone to play." onStart={onStart} />}

      <Panel className="al-game__panel">
        <SelectField id="pool" label="Chord set" value={selected?.id ?? ""} onChange={changePool}>
          {pools.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({p.chords.length})
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
            label={confirmation.count > 0 ? "Hold the chord" : "Play the chord"}
          />
          <span className="al-game__progress-text">
            {confirmation.count > 0 ? "Hold the chord…" : "Play the chord"}
          </span>
        </div>

        <p className="al-game__status">
          I hear:{" "}
          <span className={match ? "al-chip al-chip--match" : "al-chip"}>
            {match && <Icon name="check" size={14} />}
            {topName}
          </span>
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

        {signalLevelDb !== undefined && (
          <GateStrictnessField
            id="chord-game-gate"
            value={strictness}
            onChange={setStrictness}
            defaultValue={gateStrictness}
          />
        )}

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
          Play the chord and hold it until the bar fills.
          {accept === "triad" && " The plain chord counts too: E for E7, and E7 for E."}
        </p>
      </Panel>
    </div>
  );
}
