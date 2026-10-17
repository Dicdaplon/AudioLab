/**
 * Online peak picking of an onset detection function. Pure TypeScript.
 *
 * Frame n is an onset when, at the moment it is decided:
 *
 *   1. odf[n] = max(odf[n − preMax … n + lookAhead])         local maximum
 *   2. odf[n] ≥ mean(odf[n − preAvg … n]) + delta             above the
 *      odf[n] ≥ threshold                                     moving average
 *   3. n − lastOnset ≥ combine                                not a re-trigger
 *
 * With `lookAheadFrames = 0` this is the purely causal variant evaluated by
 * Böck et al.: a rising ODF is decided on its first frame that clears the
 * threshold, so the decision comes during the attack rather than after its
 * peak. One or two frames of look-ahead (2.7 ms each at 48 kHz / 128)
 * confirm the local maximum at negligible cost. Windows are expressed in
 * seconds and converted with the ODF frame rate.
 *
 * Reference: S. Böck, F. Krebs and M. Schedl, "Evaluating the online
 * capabilities of onset detection methods", Proc. ISMIR 2012.
 */

import { resolveConfig } from "../../utils/resolveConfig";

export interface PeakPickerConfig {
  /** ODF values per second. */
  frameRate: number;
  /** Local-maximum window before the frame, in seconds. Default 0.03. */
  preMaxSeconds: number;
  /** Moving-average window before the frame, in seconds. Default 0.1. */
  preAvgSeconds: number;
  /** Frames of look-ahead for the local maximum. Default 1. */
  lookAheadFrames: number;
  /** Margin above the moving average. Default 0.03 (band-averaged SuperFlux). */
  delta: number;
  /** Absolute minimum ODF value. Default 0.01. */
  threshold: number;
  /** Minimum time between two onsets, in seconds. Default 0.05 (merges a strum). */
  combineSeconds: number;
}

export type PeakPickerOptions = Partial<PeakPickerConfig> & { frameRate: number };

export const PEAK_PICKER_DEFAULTS: Omit<PeakPickerConfig, "frameRate"> = {
  preMaxSeconds: 0.03,
  preAvgSeconds: 0.1,
  lookAheadFrames: 1,
  delta: 0.03,
  threshold: 0.01,
  combineSeconds: 0.05,
};

/** A picked peak: the ODF frame index (counted from the first push) and its value. */
export interface PickedPeak {
  index: number;
  value: number;
}

export class OnlinePeakPicker {
  readonly config: Readonly<PeakPickerConfig>;
  private readonly preMax: number;
  private readonly preAvg: number;
  private readonly combine: number;
  /** Ring of the last values, long enough for every window. */
  private readonly ring: Float64Array;
  private count = 0;
  private lastOnset = -Infinity;

  constructor(options: PeakPickerOptions) {
    if (!(options.frameRate > 0)) throw new Error("frameRate must be > 0");
    const cfg: PeakPickerConfig = resolveConfig(
      { ...PEAK_PICKER_DEFAULTS, frameRate: options.frameRate },
      options,
    );
    if (!(cfg.lookAheadFrames >= 0)) throw new Error("lookAheadFrames must be ≥ 0");
    this.config = cfg;
    this.preMax = Math.max(0, Math.round(cfg.preMaxSeconds * cfg.frameRate));
    this.preAvg = Math.max(1, Math.round(cfg.preAvgSeconds * cfg.frameRate));
    this.combine = Math.max(1, Math.round(cfg.combineSeconds * cfg.frameRate));
    const span = Math.max(this.preMax, this.preAvg) + cfg.lookAheadFrames + 2;
    this.ring = new Float64Array(span);
  }

  /** Frames between a value's arrival and its decision (the look-ahead). */
  get delayFrames(): number {
    return this.config.lookAheadFrames;
  }

  reset(): void {
    this.ring.fill(0);
    this.count = 0;
    this.lastOnset = -Infinity;
  }

  /**
   * Push the next ODF value. Returns the peak decided by this value (which
   * is `lookAheadFrames` frames old), or null.
   */
  push(value: number): PickedPeak | null {
    const ring = this.ring;
    ring[this.count % ring.length] = value;
    this.count++;
    const n = this.count - 1 - this.config.lookAheadFrames;
    if (n < 0) return null;
    const at = (i: number) => ring[i % ring.length];
    const v = at(n);
    const { delta, threshold } = this.config;
    if (v < threshold || n - this.lastOnset < this.combine) return null;

    for (let i = Math.max(0, n - this.preMax); i < this.count; i++) {
      if (i !== n && at(i) > v) return null;
      // A plateau is decided on its last frame, once.
      if (i > n && at(i) === v) return null;
    }
    const from = Math.max(0, n - this.preAvg);
    let sum = 0;
    for (let i = from; i <= n; i++) sum += at(i);
    const avg = sum / (n - from + 1);
    if (v < avg + delta) return null;

    this.lastOnset = n;
    return { index: n, value: v };
  }
}
