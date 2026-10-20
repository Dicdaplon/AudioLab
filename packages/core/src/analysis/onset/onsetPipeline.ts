/**
 * Onset pipeline: detector + adaptive gate on one sample stream. Pure
 * TypeScript, the composition used by the live adapter and testable in
 * Node.
 *
 *   samples ─┬─► OnsetDetector ─────────► candidates ─┐
 *            └─► BandLevelMeter ─► AdaptiveNoiseGate ─┴─► accept? ─► onsets
 *
 * A candidate is accepted when the band level around its attack (the
 * loudest level block between the attack and the decision) reaches
 * `floor + onsetMarginDb`. The floor moves slowly, so evaluating it at the
 * decision rather than at the attack makes no practical difference. The
 * gate state itself (open / closed, with hysteresis and hold) is exposed
 * for display and for consumers of continuous frames, but does not veto
 * onsets: an attack that clears the margin counts even while the gate is
 * still closing from silence.
 *
 * Rejected candidates are counted, not lost silently: a UI can show that
 * the room is noisy, and a test can check what was filtered.
 */

import { BandLevelMeter, type BandLevelMeterOptions } from "../gate/bandLevelMeter";
import { AdaptiveNoiseGate, type NoiseGateConfig, type NoiseGateState } from "../gate/noiseGate";
import { GATE_STRICTNESS, gateTuning } from "../gate/strictness";
import { OnsetDetector, type OnsetDetectorOptions, type OnsetEvent } from "./onsetDetector";

export interface OnsetPipelineOptions extends OnsetDetectorOptions {
  /** Level meter settings (high-pass, block length). */
  level?: Omit<BandLevelMeterOptions, "sampleRate">;
  /** Gate settings. */
  gate?: Partial<NoiseGateConfig>;
  /** Margin above the floor for an onset to count, in dB. Default 6 (from `strictness`). */
  onsetMarginDb?: number;
  /**
   * How strict the gate is, 0 gentle … 1 strict (`gateTuning`). Default 0.5
   * (`GATE_STRICTNESS.rhythm`). Explicit `gate` and `onsetMarginDb` values win.
   * Can also be changed later on `strictness`.
   */
  strictness?: number;
  /**
   * A threshold set by hand, in dBFS, instead of floor + margin. Default
   * null (automatic). Can also be changed later on `manualThresholdDb`.
   */
  manualThresholdDb?: number | null;
}

export interface OnsetPipelineResult {
  /** Accepted onsets decided by this push, in order. */
  onsets: readonly OnsetEvent[];
  /** Gate state after this push. */
  gate: NoiseGateState;
}

const NONE: readonly OnsetEvent[] = Object.freeze([]);

export class OnsetPipeline {
  readonly detector: OnsetDetector;
  readonly meter: BandLevelMeter;
  readonly gate: AdaptiveNoiseGate;
  onsetMarginDb: number;
  /**
   * The level an onset must reach, set by hand (dBFS), or null for the
   * automatic threshold (floor + `onsetMarginDb`). Takes effect at the
   * next push; the gate keeps learning the floor either way.
   */
  manualThresholdDb: number | null;
  /** Recent band levels (end frame, dB), long enough to cover a decision delay. */
  private readonly levels: { endFrame: number; levelDb: number }[] = [];
  private currentStrictness: number;
  private accepted = 0;
  private rejected = 0;

  constructor(options: OnsetPipelineOptions) {
    this.detector = new OnsetDetector(options);
    this.meter = new BandLevelMeter({ ...options.level, sampleRate: options.sampleRate });
    this.currentStrictness = options.strictness ?? GATE_STRICTNESS.rhythm;
    const { onsetMarginDb, ...tuning } = gateTuning(this.currentStrictness);
    this.gate = new AdaptiveNoiseGate({ ...tuning, ...options.gate });
    this.onsetMarginDb = options.onsetMarginDb ?? onsetMarginDb;
    this.manualThresholdDb = options.manualThresholdDb ?? null;
  }

  /** How strict the gate is, 0 gentle … 1 strict. */
  get strictness(): number {
    return this.currentStrictness;
  }

  /** Retune the gate and the onset margin; the learnt background is kept. */
  set strictness(value: number) {
    const { onsetMarginDb, ...tuning } = gateTuning(value);
    this.currentStrictness = Math.min(1, Math.max(0, value));
    this.gate.configure(tuning);
    this.onsetMarginDb = onsetMarginDb;
  }

  /** The level an onset must reach now, in dBFS: by hand, or floor + margin. */
  get onsetThresholdDb(): number {
    return this.manualThresholdDb ?? this.gate.state.floorDb + this.onsetMarginDb;
  }

  get sampleRate(): number {
    return this.detector.sampleRate;
  }

  /** Onsets accepted and candidates rejected since the start. */
  get counts(): { accepted: number; rejected: number } {
    return { accepted: this.accepted, rejected: this.rejected };
  }

  reset(): void {
    this.detector.reset();
    this.meter.reset();
    this.gate.reset();
    this.levels.length = 0;
    this.accepted = 0;
    this.rejected = 0;
  }

  push(samples: ArrayLike<number>, startFrame?: number): OnsetPipelineResult {
    const blockMs = (this.meter.blockSize / this.sampleRate) * 1000;
    for (const block of this.meter.push(samples, startFrame)) {
      this.gate.push({ levelDb: block.levelDb, dtMs: blockMs });
      this.levels.push(block);
    }
    // Keep about 200 ms of levels: more than any decision delay.
    const keep = Math.ceil(200 / blockMs);
    if (this.levels.length > keep) this.levels.splice(0, this.levels.length - keep);

    const candidates = this.detector.push(samples, startFrame);
    if (candidates.length === 0) return { onsets: NONE, gate: this.gate.state };

    const threshold = this.onsetThresholdDb;
    const onsets: OnsetEvent[] = [];
    for (const c of candidates) {
      if (this.levelAround(c) >= threshold) {
        onsets.push(c);
        this.accepted++;
      } else {
        this.rejected++;
      }
    }
    return { onsets: onsets.length > 0 ? onsets : NONE, gate: this.gate.state };
  }

  /** Loudest band level whose block overlaps [attack, decision]. */
  private levelAround(onset: OnsetEvent): number {
    let best = -Infinity;
    const blockSize = this.meter.blockSize;
    for (const l of this.levels) {
      if (l.endFrame > onset.frame && l.endFrame - blockSize <= onset.decidedAtFrame) {
        if (l.levelDb > best) best = l.levelDb;
      }
    }
    return best;
  }
}
