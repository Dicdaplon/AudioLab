/**
 * Latency by ear: the player plays along a few clicks, and the delay from
 * each scheduled click to the note played on it is the whole chain they
 * live with: output buffers, Bluetooth, the ear and the hand, the
 * microphone, the input buffers. Pure.
 *
 * No web API measures a Bluetooth headset's delay, and the click never
 * reaches the microphone through headphones, so there is no echo to time.
 * The player's own playing is the only loopback left. It includes their
 * habit of playing slightly ahead of a click, which is what they will do
 * in the exercise too.
 *
 * Each click owns the notes in [click + minDelayMs, click + maxDelayMs);
 * the clicks are further apart than that window (`LATENCY_TEST`: 750 ms
 * against 750 ms), so a note belongs to one click only, even with 400 ms of
 * Bluetooth. A click keeps its first note. The median delay is the offset;
 * notes further than `outlierMs` from it are dropped and the median taken
 * again, and the spread is the interquartile range / 1.349.
 */

import { beatTime, type BeatGrid } from "./beatGrid";

/** The test: a 4-click count-in, then 8 clicks to play on, 750 ms apart. */
export const LATENCY_TEST = { bpm: 80, countIn: 4, clicks: 8 } as const;

export interface TapLatencyConfig {
  /** Earliest note accepted for a click, in ms (players anticipate). Default −150. */
  minDelayMs: number;
  /** Latest note accepted for a click, in ms. Default 600. */
  maxDelayMs: number;
  /** Notes further than this from the median are dropped, in ms. Default 80. */
  outlierMs: number;
  /** Fewest notes kept for a reliable result. Default 5. */
  minTaps: number;
  /** Largest spread for a reliable result, in ms. Default 40. */
  maxSpreadMs: number;
}

export const TAP_LATENCY_DEFAULTS: Readonly<TapLatencyConfig> = {
  minDelayMs: -150,
  maxDelayMs: 600,
  outlierMs: 80,
  minTaps: 5,
  maxSpreadMs: 40,
};

export interface TapLatency {
  /** Click → note delay to subtract from detected onsets, in ms. */
  offsetMs: number;
  /** Spread of the kept delays (one σ), in ms. */
  spreadMs: number;
  /** Notes kept. */
  taps: number;
  /** Clicks played. */
  clicks: number;
  /** Enough steady notes to trust the offset. */
  reliable: boolean;
  /** Every kept delay, in ms, in click order. */
  delaysMs: readonly number[];
}

/** Times (s) of the clicks to play on, after the count-in of `grid`. */
export function latencyTestClicks(
  grid: Readonly<BeatGrid>,
  clicks: number = LATENCY_TEST.clicks,
): number[] {
  return Array.from({ length: clicks }, (_, i) => beatTime(grid, i));
}

function quantile(sorted: readonly number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * The delay between clicks (s, ascending) and the notes played on them (s),
 * or null when no note fell near any click.
 */
export function measureTapLatency(
  clickTimes: readonly number[],
  tapTimes: readonly number[],
  config: Partial<TapLatencyConfig> = {},
): TapLatency | null {
  const c = { ...TAP_LATENCY_DEFAULTS, ...config };
  const taps = [...tapTimes].sort((a, b) => a - b);
  const delays: number[] = [];
  let next = 0;
  for (const click of clickTimes) {
    while (next < taps.length && (taps[next] - click) * 1000 < c.minDelayMs) next++;
    if (next >= taps.length) break;
    const d = (taps[next] - click) * 1000;
    if (d < c.maxDelayMs) {
      delays.push(d);
      next++;
    }
  }
  if (delays.length === 0) return null;

  const median = quantile(
    [...delays].sort((a, b) => a - b),
    0.5,
  );
  const kept = delays.filter((d) => Math.abs(d - median) <= c.outlierMs);
  const sorted = [...kept].sort((a, b) => a - b);
  const offsetMs = quantile(sorted, 0.5);
  const spreadMs = (quantile(sorted, 0.75) - quantile(sorted, 0.25)) / 1.349;
  return {
    offsetMs,
    spreadMs,
    taps: kept.length,
    clicks: clickTimes.length,
    reliable: kept.length >= c.minTaps && spreadMs <= c.maxSpreadMs,
    delaysMs: kept,
  };
}
