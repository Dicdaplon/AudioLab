/**
 * Robust statistics of timing offsets: is the player systematically early
 * or late (bias), how regular (jitter), speeding up or slowing down
 * (drift)? Robust estimators, so one wild note does not decide.
 *
 *   bias    median of Δ                                       (ms)
 *   jitter  interquartile range / 1.349                       (ms; equals σ
 *           for normally distributed offsets)
 *   drift   Theil–Sen slope of Δ against time: the median of the pairwise
 *           slopes (ms per second; > 0 = falling behind)
 *
 * Reference for the slope: P. K. Sen, "Estimates of the regression
 * coefficient based on Kendall's tau", JASA 63, 1968.
 */

export interface TimingSample {
  /** When the note was expected, in seconds. */
  time: number;
  /** Signed offset, in ms (positive = late). */
  deltaMs: number;
}

export interface TimingStats {
  count: number;
  biasMs: number;
  jitterMs: number;
  /** ms per second; 0 with fewer than 3 samples. */
  driftMsPerSecond: number;
  /** Mean absolute offset, in ms. */
  meanAbsMs: number;
}

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function timingStats(samples: readonly TimingSample[]): TimingStats {
  const n = samples.length;
  if (n === 0) return { count: 0, biasMs: 0, jitterMs: 0, driftMsPerSecond: 0, meanAbsMs: 0 };
  const deltas = samples.map((s) => s.deltaMs).sort((a, b) => a - b);
  const slopes: number[] = [];
  if (n >= 3) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dt = samples[j].time - samples[i].time;
        if (dt !== 0) slopes.push((samples[j].deltaMs - samples[i].deltaMs) / dt);
      }
    }
    slopes.sort((a, b) => a - b);
  }
  return {
    count: n,
    biasMs: quantile(deltas, 0.5),
    jitterMs: (quantile(deltas, 0.75) - quantile(deltas, 0.25)) / 1.349,
    driftMsPerSecond: slopes.length > 0 ? quantile(slopes, 0.5) : 0,
    meanAbsMs: deltas.reduce((s, d) => s + Math.abs(d), 0) / n,
  };
}

/** Median of a list (0 when empty). */
export function medianOf(values: readonly number[]): number {
  return quantile(
    [...values].sort((a, b) => a - b),
    0.5,
  );
}
