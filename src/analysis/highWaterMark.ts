/**
 * Adaptive "high water mark" threshold filter for chroma vectors.
 *
 * At each call, we track the **peak value** of the input vector and keep a
 * rolling memory of the last N peaks. The threshold is then
 *
 *     threshold = tolerancy × mean(last N peaks)
 *
 * Any chroma bin below the threshold is set to 0 in the output. This zeroes
 * out the "noise floor" of the chroma while keeping the actually-played notes,
 * adapting automatically to the overall signal level over time.
 *
 * Configuration:
 *   - `tolerancy` ∈ [0, 1]   default 0.5
 *       Fraction of the recent peak average used as threshold. 0 disables the
 *       filter (passes everything through); 1 only keeps bins ≥ current peak.
 *   - `memory`    ∈ [2, 15]  default 5
 *       Number of recent peaks averaged.
 *   - `mode`      "mean" | "median"  default "mean"
 *       How the peaks are aggregated. Median is more robust to occasional
 *       transients (a single big strum doesn't blow the threshold up).
 */

export type HighWaterMarkMode = "mean" | "median";

/**
 * Defaults tuned by `npm run sweep` against the project's samples
 * (clean + FL Studio noisy mix). See scripts/parameterSweep.ts.
 */
export const HIGH_WATER_MARK_DEFAULTS = {
  tolerancy: 0.35,
  memory: 3,
  mode: "mean" as HighWaterMarkMode,
};

export const HIGH_WATER_MARK_MEMORY_MIN = 2;
export const HIGH_WATER_MARK_MEMORY_MAX = 15;

export interface HighWaterMarkOptions {
  tolerancy?: number;
  memory?: number;
  mode?: HighWaterMarkMode;
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function clampMemory(n: number): number {
  return Math.round(clamp(n, HIGH_WATER_MARK_MEMORY_MIN, HIGH_WATER_MARK_MEMORY_MAX));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) * 0.5
    : sorted[mid];
}

function mean(values: number[]): number {
  let sum = 0;
  for (const v of values) sum += v;
  return values.length > 0 ? sum / values.length : 0;
}

export class HighWaterMarkFilter {
  private tolerancy: number;
  private memory: number;
  private mode: HighWaterMarkMode;
  private peakHistory: number[] = [];

  constructor(opts: HighWaterMarkOptions = {}) {
    this.tolerancy = clamp(opts.tolerancy ?? HIGH_WATER_MARK_DEFAULTS.tolerancy, 0, 1);
    this.memory = clampMemory(opts.memory ?? HIGH_WATER_MARK_DEFAULTS.memory);
    this.mode = opts.mode ?? HIGH_WATER_MARK_DEFAULTS.mode;
  }

  setTolerancy(t: number): void {
    this.tolerancy = clamp(t, 0, 1);
  }

  setMemory(n: number): void {
    this.memory = clampMemory(n);
    while (this.peakHistory.length > this.memory) {
      this.peakHistory.shift();
    }
  }

  setMode(mode: HighWaterMarkMode): void {
    this.mode = mode;
  }

  reset(): void {
    this.peakHistory = [];
  }

  getTolerancy(): number {
    return this.tolerancy;
  }
  getMemory(): number {
    return this.memory;
  }
  getMode(): HighWaterMarkMode {
    return this.mode;
  }

  /** Current threshold value (last computed). 0 when no peak has been seen yet. */
  get currentThreshold(): number {
    if (this.peakHistory.length === 0) return 0;
    const agg = this.mode === "median" ? median(this.peakHistory) : mean(this.peakHistory);
    return this.tolerancy * agg;
  }

  /** Last peak observed, or 0. */
  get lastPeak(): number {
    return this.peakHistory[this.peakHistory.length - 1] ?? 0;
  }

  /**
   * Filter a chroma (or any equally-shaped) vector.
   *
   * @returns a NEW Float32Array, same length as input, with values below the
   *          adaptive threshold zeroed out.
   */
  filter(input: ArrayLike<number>): Float32Array {
    let peak = 0;
    for (let i = 0; i < input.length; i++) {
      const v = input[i];
      if (v > peak) peak = v;
    }

    // Update the rolling peak memory BEFORE computing the threshold, so the
    // threshold tracks current signal level (including this frame).
    this.peakHistory.push(peak);
    if (this.peakHistory.length > this.memory) this.peakHistory.shift();

    const agg =
      this.mode === "median" ? median(this.peakHistory) : mean(this.peakHistory);
    const threshold = this.tolerancy * agg;

    const out = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const v = input[i];
      out[i] = v >= threshold ? v : 0;
    }
    return out;
  }

  /**
   * Same as `filter` but returns a binary 0/1 indicator: 1 where the value
   * passes the threshold, 0 otherwise. Useful as the input to the presence
   * accumulator.
   */
  filterToIndicator(input: ArrayLike<number>): Float32Array {
    const filtered = this.filter(input);
    const out = new Float32Array(filtered.length);
    for (let i = 0; i < filtered.length; i++) out[i] = filtered[i] > 0 ? 1 : 0;
    return out;
  }
}
