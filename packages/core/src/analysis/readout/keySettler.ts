/**
 * Key settler: turns the per-frame key ranking into a key a display can show
 * without flickering.
 *
 * Every frame votes for its top-ranked key. Each of the 24 keys keeps an
 * exponential moving average of its votes (its "stability", in [0, 1]), so
 * the displayed key is the one that has led most consistently over the last
 * few seconds, not the one that leads right now. Three phases with
 * hysteresis sit on top:
 *
 *   listening ──(stability > hesitateAbove)──► hesitant
 *   hesitant ──(stability > settleAbove for settleSeconds)──► settled
 *   hesitant ──(stability < listenBelow)──► listening
 *   settled ──(stability < unsettleBelow, no rival above hesitateAbove)──► hesitant
 *   settled ──(another key > settleAbove for modulationSeconds)──► settled on it (modulation)
 *
 * A settled key is sticky: while another key is rising it stays on display
 * until that key has led for `modulationSeconds`.
 *
 * Quiet frames (below `minLevelDb`) do not vote: noodling between songs is
 * not a reason to lose the key, `reset()` is. Time comes from the caller, so
 * the settler is deterministic and testable without timers.
 */

import type { KeyMode, KeyScore } from "../keyDetection";

export interface KeySettlerOptions {
  /** Time constant of the vote average, in seconds. Default 1.5. */
  stabilitySeconds?: number;
  /** Below this stability the settler goes back to listening. Default 0.3. */
  listenBelow?: number;
  /** Above this stability a listening settler names a candidate. Default 0.38. */
  hesitateAbove?: number;
  /** Stability a key must hold for `settleSeconds` to settle. Default 0.62. */
  settleAbove?: number;
  /** Below this stability a settled key is questioned again. Default 0.5. */
  unsettleBelow?: number;
  /** Seconds above `settleAbove` before settling. Default 4. */
  settleSeconds?: number;
  /** Seconds another key must lead above `settleAbove` to count as a modulation. Default 6. */
  modulationSeconds?: number;
  /**
   * Frames quieter than this do not vote, on the scale of
   * `TonalityFrame.signalLevelDb` (mean spectral magnitude; −100 is digital
   * silence, music sits around −85 … −70). Default −90.
   */
  minLevelDb?: number;
  /** A runner-up is reported only above this stability. Default 0.15. */
  runnerUpAbove?: number;
}

export const KEY_SETTLER_DEFAULTS: Required<KeySettlerOptions> = {
  stabilitySeconds: 1.5,
  listenBelow: 0.3,
  hesitateAbove: 0.38,
  settleAbove: 0.62,
  unsettleBelow: 0.5,
  settleSeconds: 4,
  modulationSeconds: 6,
  minLevelDb: -90,
  runnerUpAbove: 0.15,
};

export type KeyPhase = "listening" | "hesitant" | "settled";

export interface KeyRef {
  tonic: number;
  mode: KeyMode;
}

export interface KeyReading {
  phase: KeyPhase;
  /** Key to display: null while listening. */
  key: KeyRef | null;
  /** Second most stable key while hesitant, else null. */
  runnerUp: KeyRef | null;
  /** Stability of `key` (0 while listening). */
  stability: number;
  /** One-shot event of this frame: the key just settled, or changed while settled. */
  event: "settled" | "modulated" | null;
}

const KEYS = 24;

function indexOf(tonic: number, mode: KeyMode): number {
  return (mode === "min" ? 12 : 0) + (((tonic % 12) + 12) % 12);
}

function refOf(index: number): KeyRef {
  return { tonic: index % 12, mode: index >= 12 ? "min" : "maj" };
}

export class KeySettler {
  private readonly o: Required<KeySettlerOptions>;
  private readonly stability = new Float64Array(KEYS);
  private lastTime: number | null = null;
  private phase: KeyPhase = "listening";
  private shown = -1;
  /** Key above settleAbove (and since when) on the way to settling or modulating. */
  private challenger = -1;
  private challengerSince = 0;

  constructor(options: KeySettlerOptions = {}) {
    this.o = { ...KEY_SETTLER_DEFAULTS, ...options };
  }

  /**
   * Feed one frame: the ranked keys (best first, as `TonalityFrame` gives
   * them), the signal level and the time in seconds (monotonic).
   */
  push(keys: readonly KeyScore[], levelDb: number, timeSeconds: number): KeyReading {
    const dt = this.lastTime === null ? 0 : Math.max(0, timeSeconds - this.lastTime);
    this.lastTime = timeSeconds;
    const top = keys[0];
    let event: KeyReading["event"] = null;

    if (top && levelDb >= this.o.minLevelDb && dt > 0) {
      const alpha = 1 - Math.exp(-dt / this.o.stabilitySeconds);
      const voted = indexOf(top.tonic, top.mode);
      for (let k = 0; k < KEYS; k++) {
        this.stability[k] += alpha * ((k === voted ? 1 : 0) - this.stability[k]);
      }
    }

    const best = this.argmax(-1);
    const bestStability = this.stability[best];
    const o = this.o;

    switch (this.phase) {
      case "listening":
        if (bestStability > o.hesitateAbove) {
          this.phase = "hesitant";
          this.shown = best;
          this.challenger = -1;
        }
        break;
      case "hesitant":
        this.shown = best;
        if (bestStability < o.listenBelow) {
          this.phase = "listening";
          this.shown = -1;
          this.challenger = -1;
        } else if (this.track(best, bestStability > o.settleAbove, timeSeconds, o.settleSeconds)) {
          this.phase = "settled";
          event = "settled";
        }
        break;
      case "settled": {
        const leader = best !== this.shown && bestStability > o.settleAbove ? best : -1;
        if (leader >= 0) {
          if (this.track(leader, true, timeSeconds, o.modulationSeconds)) {
            this.shown = leader;
            event = "modulated";
          }
          break;
        }
        this.challenger = -1;
        // A rising rival is a modulation in the making, not a reason to doubt:
        // only scattered votes (no clear rival) unsettle the key.
        const rival = best !== this.shown && bestStability > o.hesitateAbove;
        if (this.stability[this.shown] < o.unsettleBelow && !rival) {
          this.phase = "hesitant";
          this.shown = best;
        }
        break;
      }
    }

    if (this.shown < 0) {
      return { phase: this.phase, key: null, runnerUp: null, stability: 0, event };
    }
    let runnerUp: KeyRef | null = null;
    if (this.phase === "hesitant") {
      const second = this.argmax(this.shown);
      if (this.stability[second] > o.runnerUpAbove) runnerUp = refOf(second);
    }
    return {
      phase: this.phase,
      key: refOf(this.shown),
      runnerUp,
      stability: this.stability[this.shown],
      event,
    };
  }

  /** Forget everything (new song). */
  reset(): void {
    this.stability.fill(0);
    this.lastTime = null;
    this.phase = "listening";
    this.shown = -1;
    this.challenger = -1;
  }

  /**
   * Follow `candidate` while `holding`; true once it has held for `seconds`
   * (and then forgets it, so the event fires once).
   */
  private track(candidate: number, holding: boolean, now: number, seconds: number): boolean {
    if (!holding) {
      this.challenger = -1;
      return false;
    }
    if (this.challenger !== candidate) {
      this.challenger = candidate;
      this.challengerSince = now;
    }
    if (now - this.challengerSince >= seconds) {
      this.challenger = -1;
      return true;
    }
    return false;
  }

  private argmax(skip: number): number {
    let best = skip === 0 ? 1 : 0;
    for (let k = 0; k < KEYS; k++) {
      if (k !== skip && this.stability[k] > this.stability[best]) best = k;
    }
    return best;
  }
}
