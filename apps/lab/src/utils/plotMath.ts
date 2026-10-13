/**
 * Pure helpers shared by the canvas plots (axis ranges, ticks, decimation).
 * Kept free of DOM so they can be unit-tested.
 */

export interface AxisRange {
  min: number;
  max: number;
}

/**
 * Vertical range for a time signal.
 *
 * - Bipolar signals get a symmetric range [−a, a] with a = max |x|.
 * - Non-negative signals (envelopes) get [0, max].
 * - An all-zero or non-finite signal gets a fixed, non-degenerate range so
 *   the axis can still be drawn (this used to hang the plot: a zero range
 *   made the tick loop step by 0).
 */
export function signalRange(signal: ArrayLike<number>): AxisRange {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < signal.length; i++) {
    const v = signal[i];
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: -1, max: 1 };
  if (min >= 0) {
    return { min: 0, max: max > 0 ? max : 1 };
  }
  const a = Math.max(Math.abs(min), Math.abs(max));
  return { min: -a, max: a };
}

/**
 * `count` evenly spaced tick values from `range.min` to `range.max`
 * (inclusive), computed with an integer counter so a degenerate range can
 * never loop forever.
 */
export function axisTicks(range: AxisRange, count = 5): number[] {
  const n = Math.max(2, Math.floor(count));
  const span = range.max - range.min;
  const ticks: number[] = [];
  for (let i = 0; i < n; i++) ticks.push(range.min + (span * i) / (n - 1));
  return ticks;
}

/**
 * Map a value to a pixel coordinate along an axis of `length` pixels that
 * starts at `origin` and runs from `range.min` to `range.max`. A degenerate
 * range maps everything to the origin.
 */
export function valueToPixel(
  value: number,
  range: AxisRange,
  origin: number,
  length: number,
): number {
  const span = range.max - range.min;
  if (!(span > 0)) return origin;
  return origin + ((value - range.min) / span) * length;
}

export interface MinMaxColumns {
  min: Float32Array;
  max: Float32Array;
}

/**
 * Reduce a long signal to one (min, max) pair per pixel column so the plot
 * draws 2·columns points instead of one per sample, without hiding peaks.
 * When the signal has fewer samples than columns the columns map 1:1 to
 * samples and both arrays hold the sample value.
 */
export function decimateMinMax(signal: ArrayLike<number>, columns: number): MinMaxColumns {
  const n = signal.length;
  const cols = Math.max(0, Math.min(Math.floor(columns), n));
  const min = new Float32Array(cols);
  const max = new Float32Array(cols);
  if (cols === 0) return { min, max };
  for (let c = 0; c < cols; c++) {
    const from = Math.floor((c * n) / cols);
    const to = Math.max(from + 1, Math.floor(((c + 1) * n) / cols));
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = from; i < to; i++) {
      const v = signal[i];
      if (!Number.isFinite(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    min[c] = Number.isFinite(lo) ? lo : 0;
    max[c] = Number.isFinite(hi) ? hi : 0;
  }
  return { min, max };
}
