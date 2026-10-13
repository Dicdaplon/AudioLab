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
 * Layout only: the rules live in `engine.ts`, detection and the animation
 * loop in `useWolfJumper.ts`. This component re-renders with the detector
 * (~10 Hz); per-frame updates stay inside `Scene`.
 */

import type { ChordScore } from "../../../analysis/chordDetection";
import { MicPrompt } from "../MicPrompt";
import { INITIAL_TRAVEL_MS, MIN_TRAVEL_MS, findNoteDef } from "./constants";
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
}

export function WolfJumper({
  instantaneousChroma,
  chords,
  running,
  signalLevelDb,
  onStart,
}: WolfJumperProps) {
  const { store, noiseGateDb, setNoiseGateDb, gateOpen, note, reset } = useWolfJumper({
    instantaneousChroma,
    chords,
    running,
    signalLevelDb,
  });

  return (
    <div className="jumper">
      <Hud store={store} />
      <Scene store={store} onRestart={reset} />

      <NoiseGate
        signalLevelDb={signalLevelDb}
        thresholdDb={noiseGateDb}
        gateOpen={gateOpen}
        onThresholdChange={setNoiseGateDb}
      />

      <DetectionStatus
        gateOpen={gateOpen}
        noteName={(note && findNoteDef(note.pc)?.name) ?? "—"}
        noteEnergy={note?.energy ?? 0}
        chordName={chords[0]?.name ?? "—"}
        chordProbability={chords[0]?.probability ?? 0}
      />

      {!running && <MicPrompt message="Démarre le micro pour lancer le jeu." onStart={onStart} />}

      <div className="game-actions">
        <button type="button" className="mic-btn mic-reset" onClick={reset}>
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
