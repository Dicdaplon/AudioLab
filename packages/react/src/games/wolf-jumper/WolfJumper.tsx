"use client";

/**
 * Wolf Jumper — endless-runner game with notes (enemies) + chord bonuses.
 *
 * Gameplay:
 *   - Notes (small discs) fly in from the right. Play the matching pitch
 *     class to kill ALL alive enemies of that note at once (satisfying
 *     chain kills, especially with the "Same note ×5" bonus).
 *   - Bonuses (boxes labelled with a chord) appear occasionally. Play the
 *     chord to collect them. Effects:
 *       +2 HP          restore 2 HP
 *       Shield 7 s     incoming enemies are killed instead of damaging
 *       Slow 7 s       enemies move at half speed
 *       Same note ×5   next 5 enemy spawns share the same note
 *   - Score, streak and best streak are tracked. HP reaches 0 → Game Over.
 *
 * Layout only: the rules live in `@audiolab/core/games`, detection and the
 * animation loop in `useWolfJumper.ts`. This component re-renders with the
 * detector (~10 Hz); per-frame updates stay inside `Scene`.
 */

import { useState } from "react";

import { type ChordScore, type PitchEstimate, pitchClassName } from "@audiolab/core";
import type { WolfDetectorConfig, WolfJumperConfig } from "@audiolab/core/games";
import { Icon } from "../../ui/Icon";
import { useMediaQuery } from "../../ui/useMediaQuery";
import { MicPrompt } from "../MicPrompt";
import { DetectionStatus, Hud } from "./Hud";
import { NoiseGate } from "./NoiseGate";
import { Scene } from "./Scene";
import { useWolfJumper } from "./useWolfJumper";

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
  /** Game tuning (note pool, bonus chords, speeds, health, ...), read once at mount. */
  config?: Partial<WolfJumperConfig>;
  /** Detection tuning (smoothing, confirmations, thresholds, note source, chord policy). */
  detection?: Partial<Omit<WolfDetectorConfig, "noiseGateDb">>;
  /** Latest `usePitch` estimate, read with `detection.noteSource: "pitch"`. */
  pitch?: PitchEstimate | null;
}

export function WolfJumper({
  instantaneousChroma,
  chords,
  running,
  signalLevelDb,
  onStart,
  config,
  detection,
  pitch,
}: WolfJumperProps) {
  // Under reduced motion nothing moves until the player asks for it.
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [armed, setArmed] = useState(false);
  const playing = running && (!reducedMotion || armed);

  const { store, noiseGateDb, setNoiseGateDb, gateOpen, note, reset } = useWolfJumper({
    instantaneousChroma,
    chords,
    running: playing,
    signalLevelDb,
    pitch,
    config,
    detection,
  });
  const tuning = store.getState().config;

  return (
    <div className="al-game al-game--jumper">
      {!running && (
        <MicPrompt message="Start the microphone to begin the game." onStart={onStart} />
      )}

      {running && reducedMotion && !armed && (
        <div className="al-notice al-notice--accent">
          <Icon name="play" className="al-notice__icon" />
          <div className="al-notice__body">
            <p className="al-notice__text">
              Your system asks for reduced motion: the notes start moving only when you launch the
              game.
            </p>
            <div className="al-notice__actions">
              <button
                type="button"
                className="al-btn al-btn--accent al-btn--touch"
                onClick={() => setArmed(true)}
              >
                <Icon name="play" />
                Launch
              </button>
            </div>
          </div>
        </div>
      )}

      <Hud store={store} />
      <Scene store={store} onRestart={reset} />

      <div className="al-game__controls">
        <NoiseGate
          signalLevelDb={signalLevelDb}
          thresholdDb={noiseGateDb}
          gateOpen={gateOpen}
          onThresholdChange={setNoiseGateDb}
        />

        <DetectionStatus
          gateOpen={gateOpen}
          noteName={note ? pitchClassName(note.pc) : "—"}
          noteEnergy={note?.energy ?? 0}
          chordName={chords[0]?.name ?? "—"}
          chordProbability={chords[0]?.probability ?? 0}
        />
      </div>

      <div className="al-game__actions">
        <button type="button" className="al-btn al-btn--quiet al-btn--touch" onClick={reset}>
          <Icon name="reset" />
          Reset
        </button>
      </div>

      <p className="al-hint">
        Play the <strong>note</strong> shown on an enemy to destroy it (chain kill: every enemy with
        the same note on screen goes down at once). Bonus boxes are <strong>chords</strong>: play
        one to trigger its effect: +{tuning.hpBonusAmount} HP, shield{" "}
        {(tuning.shieldDurationMs / 1000).toFixed(0)} s, slow{" "}
        {(tuning.slowDurationMs / 1000).toFixed(0)} s, or {tuning.sameNoteCount} identical notes.
        Speed increases with the score ({(tuning.initialTravelMs / 1000).toFixed(1)} s →{" "}
        {(tuning.minTravelMs / 1000).toFixed(1)} s). Note detection ≈ 300 ms (
        {detection?.noteSource === "pitch"
          ? "pitch tracker, 2 confirmation frames"
          : "3-frame chroma smoothing + 2 confirmation frames"}
        ). Chord detection = top-1 over the 1 s window + 3 confirmation frames.
      </p>
    </div>
  );
}
