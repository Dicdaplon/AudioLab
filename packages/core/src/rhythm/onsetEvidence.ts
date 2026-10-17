/**
 * What was played at each onset: pairs onsets with label observations
 * (pitch classes, chord keys…) made just after them. Pure, generic.
 *
 * A pitch or chord estimate is wrong during the attack itself (pick noise,
 * the previous note still ringing) and needs a few tens of ms to settle:
 * the label of an onset at t is the observation that dominates
 *
 *   [t + fromMs, t + toMs]      (defaults 40 and 160 ms)
 *
 * weighted by each observation's confidence. The verdict therefore comes
 * `toMs` after the onset: the timing is known at once, the label shortly
 * after (`TimingScorer` keeps the two apart).
 *
 * Observations must be timestamped in the onsets' clock, at the CENTRE of
 * the audio they were computed from, and that audio must be short enough
 * to fit the interval: a pitch tracker on 2048-sample windows (43 ms) or a
 * chroma of ~100 ms from the same sample stream. The live tonality frames
 * (1 s chord window, polled) are not timestamped this way and do not fit.
 */

export interface LabelObservation<L> {
  /** Centre of the analysed audio, in seconds (onset clock). */
  time: number;
  /** What was heard, or null for "nothing clear". */
  label: L | null;
  /** Confidence in [0, 1]. Default 1. */
  weight?: number;
}

export interface OnsetLabel<L> {
  onsetId: number;
  onsetTime: number;
  /** Dominant label, or null if nothing clear was heard. */
  label: L | null;
  /** Share of the total weight held by `label`, in [0, 1]. */
  confidence: number;
  /** Observations that fell in the interval. */
  observations: number;
}

export interface OnsetEvidenceOptions<L> {
  /** Interval after the onset, in ms. Defaults 40 and 160. */
  fromMs?: number;
  toMs?: number;
  /** Key of a label, for counting (default `String(label)`). */
  keyOf?: (label: L) => string;
  /** Observations kept, in seconds. Default 2. */
  historySeconds?: number;
}

export class OnsetEvidence<L> {
  readonly fromMs: number;
  readonly toMs: number;
  private readonly keyOf: (label: L) => string;
  private readonly historySeconds: number;
  private readonly observations: LabelObservation<L>[] = [];
  private readonly pending: { id: number; time: number }[] = [];

  constructor(options: OnsetEvidenceOptions<L> = {}) {
    this.fromMs = options.fromMs ?? 40;
    this.toMs = options.toMs ?? 160;
    if (!(this.toMs > this.fromMs)) throw new Error("toMs must be > fromMs");
    this.keyOf = options.keyOf ?? ((label) => String(label));
    this.historySeconds = options.historySeconds ?? 2;
  }

  observe(observation: LabelObservation<L>): void {
    this.observations.push(observation);
  }

  addOnset(onset: { id: number; time: number }): void {
    this.pending.push({ id: onset.id, time: onset.time });
  }

  /** Onsets still waiting for their interval to end. */
  get pendingCount(): number {
    return this.pending.length;
  }

  /**
   * Resolve every onset whose interval ended before `now` (seconds, onset
   * clock; the time up to which observations are complete).
   */
  resolve(now: number): OnsetLabel<L>[] {
    const out: OnsetLabel<L>[] = [];
    for (let i = 0; i < this.pending.length;) {
      const p = this.pending[i];
      if (p.time + this.toMs / 1000 > now) {
        i++;
        continue;
      }
      this.pending.splice(i, 1);
      out.push(this.labelAt(p.id, p.time));
    }
    const horizon = now - this.historySeconds;
    while (this.observations.length > 0 && this.observations[0].time < horizon) {
      this.observations.shift();
    }
    return out;
  }

  private labelAt(onsetId: number, onsetTime: number): OnsetLabel<L> {
    const from = onsetTime + this.fromMs / 1000;
    const to = onsetTime + this.toMs / 1000;
    const weights = new Map<string, { label: L; weight: number }>();
    let total = 0;
    let count = 0;
    for (const o of this.observations) {
      if (o.time < from || o.time > to) continue;
      count++;
      const w = Math.max(0, o.weight ?? 1);
      total += w;
      if (o.label === null) continue;
      const key = this.keyOf(o.label);
      const entry = weights.get(key);
      if (entry) entry.weight += w;
      else weights.set(key, { label: o.label, weight: w });
    }
    let best: { label: L; weight: number } | null = null;
    for (const e of weights.values()) if (!best || e.weight > best.weight) best = e;
    return {
      onsetId,
      onsetTime,
      label: best ? best.label : null,
      confidence: best && total > 0 ? best.weight / total : 0,
      observations: count,
    };
  }
}
