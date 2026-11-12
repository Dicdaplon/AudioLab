/**
 * Tempo smoother: a steady BPM for a display, from the tempo analyser's
 * successive estimates.
 *
 * Each estimate votes for its BPM (1-BPM bins, weighted by its confidence);
 * votes fade with a time constant of `memorySeconds`, so the reading follows
 * a real tempo change in a few seconds but ignores one-off jumps (a fill, a
 * half-tempo reading on a sparse bar). This is the causal "decaying vote
 * across readings" that docs/POC-METHODS.md (§6) found to improve the
 * flux + autocorrelation estimate (§5) the stage uses. The result is the
 * vote-weighted mean around the winning bin, and the winning share of the
 * votes as its confidence.
 */

export interface TempoSmootherOptions {
  /** Time constant of the vote fading, in seconds. Default 6. */
  memorySeconds?: number;
  /** Estimates below this confidence do not vote. Default 0.2. */
  minConfidence?: number;
  /** BPM range kept. Default [40, 240]. */
  range?: readonly [number, number];
}

export const TEMPO_SMOOTHER_DEFAULTS: Required<TempoSmootherOptions> = {
  memorySeconds: 6,
  minConfidence: 0.2,
  range: [40, 240],
};

export interface SmoothedTempo {
  /** BPM, to a tenth. */
  bpm: number;
  /** Share of the recent votes behind it, in [0, 1]. */
  confidence: number;
}

export class TempoSmoother {
  private readonly o: Required<TempoSmootherOptions>;
  private readonly votes: Float64Array;
  private lastTime: number | null = null;

  constructor(options: TempoSmootherOptions = {}) {
    this.o = { ...TEMPO_SMOOTHER_DEFAULTS, ...options };
    this.votes = new Float64Array(this.o.range[1] - this.o.range[0] + 1);
  }

  /** Feed the latest estimate (null for none) at a time in seconds; read the smoothed tempo. */
  push(
    estimate: { bpm: number; confidence: number } | null,
    timeSeconds: number,
  ): SmoothedTempo | null {
    const [lo, hi] = this.o.range;
    if (this.lastTime !== null) {
      const fade = Math.exp(-Math.max(0, timeSeconds - this.lastTime) / this.o.memorySeconds);
      for (let i = 0; i < this.votes.length; i++) this.votes[i] *= fade;
    }
    this.lastTime = timeSeconds;
    if (
      estimate &&
      estimate.confidence >= this.o.minConfidence &&
      estimate.bpm >= lo &&
      estimate.bpm <= hi
    ) {
      this.votes[Math.round(estimate.bpm) - lo] += estimate.confidence;
    }
    return this.read();
  }

  reset(): void {
    this.votes.fill(0);
    this.lastTime = null;
  }

  private read(): SmoothedTempo | null {
    let total = 0;
    let best = 0;
    for (let i = 0; i < this.votes.length; i++) {
      total += this.votes[i];
      if (this.votes[i] > this.votes[best]) best = i;
    }
    if (total <= 1e-6) return null;
    let sum = 0;
    let weight = 0;
    for (let i = Math.max(0, best - 2); i <= Math.min(this.votes.length - 1, best + 2); i++) {
      sum += (i + this.o.range[0]) * this.votes[i];
      weight += this.votes[i];
    }
    return { bpm: Math.round((sum / weight) * 10) / 10, confidence: Math.min(1, weight / total) };
  }
}
