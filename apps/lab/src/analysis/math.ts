/**
 * Small numeric helpers shared across the analysis modules.
 */

/** Clamp `x` into [lo, hi]. */
export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** Index of the largest value (first one on ties); -1 for an empty input. */
export function argmax(values: ArrayLike<number>): number {
  let best = -1;
  let bestValue = -Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > bestValue) {
      bestValue = values[i];
      best = i;
    }
  }
  return best;
}

/** Arithmetic mean; 0 for an empty input. */
export function mean(values: ArrayLike<number>): number {
  const n = values.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += values[i];
  return sum / n;
}

/** Median (average of the two middle values for even lengths); 0 if empty. */
export function median(values: ArrayLike<number>): number {
  const n = values.length;
  if (n === 0) return 0;
  const sorted = Array.from(values as ArrayLike<number>).sort((a, b) => a - b);
  const mid = n >> 1;
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) * 0.5 : sorted[mid];
}

/**
 * Numerically stable softmax with temperature.
 *
 * `temperature` ≤ 0 falls back to 1. The output is a ranking score that
 * sums to 1, not a calibrated probability: with τ = 0.1 a difference of
 * 0.1 between two inputs becomes a factor e between their outputs.
 */
export function softmax(values: number[], temperature: number): number[] {
  const t = temperature > 0 ? temperature : 1;
  const scaled = values.map((v) => v / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  if (sum === 0) return values.map(() => 1 / values.length);
  return exps.map((e) => e / sum);
}
