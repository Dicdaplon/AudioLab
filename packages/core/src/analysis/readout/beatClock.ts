/**
 * Beat clock: a beat phase for a display, from a tempo estimate and the
 * onsets.
 *
 * The tempo analysers give a BPM and a confidence but no phase. The clock
 * keeps an anchor (the time of one beat) and the period, and nudges the
 * anchor towards onsets that land near a predicted beat, a first-order
 * phase-locked loop: strong, on-time attacks pull it in, off-beat notes
 * (outside `captureWindow` of a period) are ignored. With no confident
 * tempo, there is no phase: a wrong pulse is worse than none.
 */

export interface BeatClockOptions {
  /** Tempo estimates below this confidence stop the clock. Default 0.5. */
  minConfidence?: number;
  /** Share of a period around a predicted beat in which an onset corrects the phase. Default 0.2. */
  captureWindow?: number;
  /** Fraction of the timing error corrected per onset. Default 0.25. */
  gain?: number;
  /** Beats per bar, for `bar` / `beatInBar`. Default 4. */
  beatsPerBar?: number;
}

export const BEAT_CLOCK_DEFAULTS: Required<BeatClockOptions> = {
  minConfidence: 0.5,
  captureWindow: 0.2,
  gain: 0.25,
  beatsPerBar: 4,
};

export interface BeatPhase {
  /** Position inside the beat, in [0, 1); 0 is the beat. */
  phase: number;
  /** Beats since the anchor (integer, can be negative). */
  beat: number;
  /** Position in the bar, 0 … beatsPerBar − 1 (0 is the downbeat, by convention). */
  beatInBar: number;
  /** Beat period, in seconds. */
  period: number;
}

export class BeatClock {
  private readonly o: Required<BeatClockOptions>;
  private period: number | null = null;
  private anchor: number | null = null;

  constructor(options: BeatClockOptions = {}) {
    this.o = { ...BEAT_CLOCK_DEFAULTS, ...options };
  }

  /** Feed the latest tempo estimate (null = none). Keeps the anchor when the BPM drifts. */
  setTempo(estimate: { bpm: number; confidence: number } | null): void {
    if (!estimate || estimate.confidence < this.o.minConfidence || !(estimate.bpm > 0)) {
      this.period = null;
      return;
    }
    this.period = 60 / estimate.bpm;
  }

  /** Feed an onset (time in seconds, on the same clock as `at`). */
  onset(timeSeconds: number): void {
    if (this.period === null) {
      this.anchor = timeSeconds;
      return;
    }
    if (this.anchor === null) {
      this.anchor = timeSeconds;
      return;
    }
    const beats = (timeSeconds - this.anchor) / this.period;
    const error = beats - Math.round(beats); // in periods, (-0.5, 0.5]
    if (Math.abs(error) <= this.o.captureWindow) {
      this.anchor += error * this.period * this.o.gain;
    }
  }

  /** Phase at `timeSeconds`, or null without a confident tempo or an anchor. */
  at(timeSeconds: number): BeatPhase | null {
    if (this.period === null || this.anchor === null) return null;
    const beats = (timeSeconds - this.anchor) / this.period;
    const beat = Math.floor(beats);
    const bar = this.o.beatsPerBar;
    return {
      phase: beats - beat,
      beat,
      beatInBar: ((beat % bar) + bar) % bar,
      period: this.period,
    };
  }

  reset(): void {
    this.period = null;
    this.anchor = null;
  }
}
