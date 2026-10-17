/**
 * Live onset detector: when does a note start? Pure TypeScript, no Web
 * Audio. Samples in, timestamped onsets out.
 *
 *   samples ─┬─► SuperFluxOdf ──► OnlinePeakPicker ──► candidate (ODF frame)
 *            └─► AttackEnvelope ─────────────────────► locate() → attack frame
 *
 * A candidate is held for `refineSeconds` (default 10 ms) so that the fine
 * envelope contains the top of the attack, then the onset is reported at
 * the start of the level rise. Without a usable rise (legato, a note over a
 * louder ringing one) it falls back to the middle of the ODF window, which
 * is where a transient sits on average when the flux peaks; such onsets
 * are flagged `localized: false` and are less precise.
 *
 * Time is counted in stream frames: pass the AudioContext frame of each
 * batch's first sample (`startFrame`) and every onset comes back in that
 * clock, independent of when the batch reached the main thread. Without
 * `startFrame` the frames count from the first pushed sample.
 *
 * The detector never gates the signal (a gate that cuts the input creates
 * its own onsets when it opens): it reports every candidate with its level
 * and leaves acceptance to the caller (see `OnsetPipeline`).
 *
 * Decision latency (when the onset is known, not when it happened): about
 * half a window for the flux, `lookAheadFrames` hops and `refineSeconds`:
 * ≈ 24 ms at 48 kHz with the defaults. It does not affect the timestamps.
 */

import { AttackEnvelope, type AttackEnvelopeOptions } from "./attackEnvelope";
import { OnlinePeakPicker, type PeakPickerOptions } from "./peakPicker";
import { SuperFluxOdf, type SuperFluxOptions } from "./superFlux";

export interface OnsetDetectorOptions {
  sampleRate: number;
  /** SuperFlux settings (window, hop, bands). */
  odf?: Omit<SuperFluxOptions, "sampleRate">;
  /** Peak-picking settings (thresholds, minimum interval). */
  peaks?: Omit<PeakPickerOptions, "frameRate">;
  /** Attack localisation settings. */
  attack?: Omit<AttackEnvelopeOptions, "sampleRate">;
  /** Wait after a candidate before localising its attack, in seconds. Default 0.01. */
  refineSeconds?: number;
}

export interface OnsetEvent {
  /** Monotonic number since the detector was created (React keys, dedup). */
  id: number;
  /** Stream frame of the attack start. */
  frame: number;
  /** `frame / sampleRate`: seconds in the stream clock (the AudioContext's for live capture). */
  time: number;
  /** Stream frame at which the onset was decided (frame + decision latency). */
  decidedAtFrame: number;
  /** ODF peak value: how sharp the attack is (band-averaged log flux). */
  strength: number;
  /** Loudest envelope level around the attack, in dBFS. */
  levelDb: number;
  /** Level just before the attack, in dBFS. */
  baselineDb: number;
  /** True when the attack start was found on the level envelope. */
  localized: boolean;
}

const NO_ONSETS: readonly OnsetEvent[] = Object.freeze([]);

interface Pending {
  odfEndFrame: number;
  strength: number;
  resolveAt: number;
}

export class OnsetDetector {
  readonly sampleRate: number;
  readonly odf: SuperFluxOdf;
  readonly picker: OnlinePeakPicker;
  readonly envelope: AttackEnvelope;
  private readonly refineFrames: number;
  private readonly pending: Pending[] = [];
  private nextFrame: number | null = null;
  private nextId = 0;

  constructor(options: OnsetDetectorOptions) {
    this.sampleRate = options.sampleRate;
    this.odf = new SuperFluxOdf({ ...options.odf, sampleRate: options.sampleRate });
    this.picker = new OnlinePeakPicker({
      ...options.peaks,
      frameRate: options.sampleRate / this.odf.config.hopSize,
    });
    this.envelope = new AttackEnvelope({ ...options.attack, sampleRate: options.sampleRate });
    this.refineFrames = Math.round((options.refineSeconds ?? 0.01) * options.sampleRate);
  }

  /** Typical delay between an attack and its report, in seconds. */
  get decisionLatencySeconds(): number {
    const { hopSize, frameSize } = this.odf.config;
    return (
      (frameSize / 2 + hopSize * (1 + this.picker.delayFrames) + this.refineFrames) /
      this.sampleRate
    );
  }

  /** Time resolution of a localised onset, in seconds (one envelope block). */
  get resolutionSeconds(): number {
    return this.envelope.config.blockSize / this.sampleRate;
  }

  reset(): void {
    this.odf.reset();
    this.picker.reset();
    this.envelope.reset();
    this.pending.length = 0;
    this.nextFrame = null;
  }

  /**
   * Feed samples; returns the onsets decided by them, in order (a shared
   * empty array when there is none). See the file comment for `startFrame`.
   */
  push(samples: ArrayLike<number>, startFrame?: number): readonly OnsetEvent[] {
    if (startFrame !== undefined && this.nextFrame !== null && startFrame !== this.nextFrame) {
      // Gap: candidates across it can no longer be localised.
      this.picker.reset();
      this.pending.length = 0;
    }
    const start = startFrame ?? this.nextFrame ?? 0;
    this.nextFrame = start + samples.length;

    let out: OnsetEvent[] | null = null;
    // Feed in hop-sized slices so pending candidates resolve as soon as the
    // envelope has the samples they wait for.
    const { hopSize } = this.odf.config;
    for (let offset = 0; offset < samples.length; offset += hopSize) {
      const end = Math.min(samples.length, offset + hopSize);
      const slice = sliceOf(samples, offset, end);
      this.envelope.push(slice, start + offset);
      for (const frame of this.odf.push(slice, start + offset)) {
        const peak = this.picker.push(frame.value);
        if (peak !== null) {
          // The decided frame is `delayFrames` hops older than this one.
          this.pending.push({
            odfEndFrame: frame.endFrame - this.picker.delayFrames * hopSize,
            strength: peak.value,
            resolveAt: frame.endFrame + this.refineFrames,
          });
        }
      }
      const now = start + end;
      if (this.pending.length > 0 && this.pending[0].resolveAt <= now) {
        out ??= [];
        this.resolvePending(now, out);
      }
    }
    return out ?? NO_ONSETS;
  }

  private resolvePending(now: number, out: OnsetEvent[]): void {
    const { frameSize } = this.odf.config;
    while (this.pending.length > 0 && this.pending[0].resolveAt <= now) {
      const p = this.pending.shift()!;
      const search = frameSize + (p.resolveAt - p.odfEndFrame);
      const located = this.envelope.locate(p.resolveAt, search);
      const frame = located ? located.frame : p.odfEndFrame - frameSize / 2;
      out.push({
        id: this.nextId++,
        frame,
        time: frame / this.sampleRate,
        decidedAtFrame: now,
        strength: p.strength,
        levelDb: located ? located.peakDb : this.envelope.levelDb,
        baselineDb: located ? located.baselineDb : this.envelope.levelDb,
        localized: located !== null,
      });
    }
  }
}

function sliceOf(samples: ArrayLike<number>, from: number, to: number): ArrayLike<number> {
  if (samples instanceof Float32Array || samples instanceof Float64Array) {
    return samples.subarray(from, to);
  }
  return Array.prototype.slice.call(samples, from, to) as number[];
}
