/**
 * Written-rhythm check at a free tempo: did the player play this rhythm,
 * whatever the speed? Pure.
 *
 * The exercise gives note positions in beats (0, 1, 1.5, 2, 3…); the
 * player plays without a click. The performance is modelled as
 *
 *   t = a + b · beat        (a: start time in s, b: seconds per beat)
 *
 * fitted to the onsets, and each note is graded on its residual: how far
 * it lands from where the player's OWN steady tempo puts it. Any constant
 * latency moves `a` and nothing else, so no calibration is needed, and a
 * consistently slow or fast player is not penalised — only an uneven
 * rhythm is.
 *
 * Fitting: an initial (a, b) from a tempo hint, or from the first two
 * onsets, or from the whole span; then a few rounds of
 *   match each note to the nearest onset within its window
 *   → least-squares fit of the matched pairs
 *   → refit without pairs whose residual exceeds 3 × the median residual
 * The candidate start that matches the most notes (then the smallest
 * residual) wins. With fewer than `minMatched` matched notes the fit is
 * flagged unreliable: grade nothing before 3–4 notes.
 */

import {
  classifyDelta,
  TIMING_TOLERANCE_DEFAULTS,
  type TimingTier,
  type TimingTolerance,
} from "./tolerance";
import { scoreSigmaFor, timingScore } from "./score";
import { timingStats, type TimingStats } from "./timingStats";

export interface PatternFitOptions {
  /** Expected tempo in BPM, if the exercise suggests one (a starting point only). */
  tempoHintBpm?: number;
  tolerance?: TimingTolerance;
  /** Window = min(windowMs, windowRatio · gap to the nearest note). Default 0.45. */
  windowRatio?: number;
  /** Matched notes below which the fit is unreliable. Default 3. */
  minMatched?: number;
  /** σ of the per-note score, in ms. Default: the tolerance's on-time edge scores 0.8. */
  scoreSigmaMs?: number;
  /** Accepted tempo range, in BPM. Defaults 30–300. */
  minBpm?: number;
  maxBpm?: number;
}

export interface FittedNote {
  beat: number;
  /** Where the fitted tempo puts the note, in s. */
  expectedTime: number;
  onsetTime: number | null;
  /** Signed residual, in ms (positive = late), null if missed. */
  residualMs: number | null;
  /** Same residual in beats. */
  residualBeats: number | null;
  tier: TimingTier;
  /** Continuous score of the residual in [0, 1] (`timingScore`); 0 if missed. */
  score: number;
}

export interface PatternFit {
  tempoBpm: number;
  /** Fitted time of beat 0, in s. */
  startTime: number;
  notes: FittedNote[];
  /** Onsets that matched no note. */
  extras: number[];
  matched: number;
  reliable: boolean;
  stats: TimingStats;
}

interface Line {
  a: number;
  b: number;
}

function windowsFor(beats: readonly number[], ratio: number): number[] {
  return beats.map((beat, i) => {
    const prev = i > 0 ? beat - beats[i - 1] : Infinity;
    const next = i < beats.length - 1 ? beats[i + 1] - beat : Infinity;
    return ratio * Math.min(prev, next);
  });
}

/** One-to-one nearest matching; returns the onset index of each note or −1. */
function match(
  beats: readonly number[],
  onsets: readonly number[],
  line: Line,
  windowsBeats: readonly number[],
  windowMs: number,
): number[] {
  const pick = new Array<number>(beats.length).fill(-1);
  const dist = new Array<number>(beats.length).fill(Infinity);
  onsets.forEach((t, j) => {
    let best = -1;
    let bestD = Infinity;
    beats.forEach((beat, k) => {
      const w = Math.min(windowMs / 1000, windowsBeats[k] * line.b);
      const d = Math.abs(t - (line.a + line.b * beat));
      if (d <= w && d < bestD) {
        best = k;
        bestD = d;
      }
    });
    if (best >= 0 && bestD < dist[best]) {
      pick[best] = j;
      dist[best] = bestD;
    }
  });
  return pick;
}

function leastSquares(xs: readonly number[], ys: readonly number[]): Line | null {
  const n = xs.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) * (xs[i] - mx);
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (sxx === 0) return null;
  const b = sxy / sxx;
  return { a: my - b * mx, b };
}

function refine(
  beats: readonly number[],
  onsets: readonly number[],
  start: Line,
  windowsBeats: readonly number[],
  windowMs: number,
  bRange: [number, number],
): { line: Line; pick: number[] } {
  let line = start;
  let pick = match(beats, onsets, line, windowsBeats, windowMs);
  for (let round = 0; round < 6; round++) {
    const xs: number[] = [];
    const ys: number[] = [];
    pick.forEach((j, k) => {
      if (j >= 0) {
        xs.push(beats[k]);
        ys.push(onsets[j]);
      }
    });
    let fit = leastSquares(xs, ys);
    if (fit && xs.length >= 4) {
      // Drop outliers (an extra strum matched by chance) and refit.
      const res = xs.map((x, i) => Math.abs(ys[i] - (fit!.a + fit!.b * x)));
      const med = [...res].sort((p, q) => p - q)[Math.floor(res.length / 2)];
      const keep = res.map((r) => r <= Math.max(3 * med, 0.005));
      const refit = leastSquares(
        xs.filter((_, i) => keep[i]),
        ys.filter((_, i) => keep[i]),
      );
      if (refit) fit = refit;
    }
    if (!fit || !(fit.b >= bRange[0] && fit.b <= bRange[1])) break;
    const nextPick = match(beats, onsets, fit, windowsBeats, windowMs);
    line = fit;
    const same = nextPick.every((j, k) => j === pick[k]);
    pick = nextPick;
    if (same) break;
  }
  return { line, pick };
}

export function fitPattern(
  beats: readonly number[],
  onsets: readonly number[],
  options: PatternFitOptions = {},
): PatternFit | null {
  const tolerance = options.tolerance ?? TIMING_TOLERANCE_DEFAULTS;
  const ratio = options.windowRatio ?? 0.45;
  const minMatched = options.minMatched ?? 3;
  const bRange: [number, number] = [60 / (options.maxBpm ?? 300), 60 / (options.minBpm ?? 30)];
  const sortedBeats = [...beats].sort((p, q) => p - q);
  const sortedOnsets = [...onsets].sort((p, q) => p - q);
  if (sortedBeats.length < 2 || sortedOnsets.length < 2) return null;
  const windowsBeats = windowsFor(sortedBeats, ratio);
  const b0 = sortedBeats[0];
  const o0 = sortedOnsets[0];

  const starts: Line[] = [];
  if (options.tempoHintBpm && options.tempoHintBpm > 0) {
    const b = 60 / options.tempoHintBpm;
    starts.push({ a: o0 - b * b0, b });
  }
  const firstGap = sortedBeats[1] - b0;
  if (firstGap > 0) {
    const b = (sortedOnsets[1] - o0) / firstGap;
    starts.push({ a: o0 - b * b0, b });
  }
  const span = sortedBeats[sortedBeats.length - 1] - b0;
  if (span > 0) {
    const b = (sortedOnsets[sortedOnsets.length - 1] - o0) / span;
    starts.push({ a: o0 - b * b0, b });
  }

  let best: { line: Line; pick: number[]; matched: number; cost: number } | null = null;
  for (const s of starts) {
    if (!(s.b >= bRange[0] && s.b <= bRange[1])) continue;
    const { line, pick } = refine(
      sortedBeats,
      sortedOnsets,
      s,
      windowsBeats,
      tolerance.windowMs,
      bRange,
    );
    let matched = 0;
    let cost = 0;
    pick.forEach((j, k) => {
      if (j >= 0) {
        matched++;
        cost += Math.abs(sortedOnsets[j] - (line.a + line.b * sortedBeats[k]));
      }
    });
    if (!best || matched > best.matched || (matched === best.matched && cost < best.cost)) {
      best = { line, pick, matched, cost };
    }
  }
  if (!best) return null;

  const { line, pick } = best;
  const used = new Set(pick.filter((j) => j >= 0));
  const sigma = options.scoreSigmaMs ?? scoreSigmaFor(tolerance);
  const notes: FittedNote[] = sortedBeats.map((beat, k) => {
    const expectedTime = line.a + line.b * beat;
    const j = pick[k];
    if (j < 0) {
      return {
        beat,
        expectedTime,
        onsetTime: null,
        residualMs: null,
        residualBeats: null,
        tier: "missed",
        score: 0,
      };
    }
    const residual = sortedOnsets[j] - expectedTime;
    return {
      beat,
      expectedTime,
      onsetTime: sortedOnsets[j],
      residualMs: residual * 1000,
      residualBeats: residual / line.b,
      tier: classifyDelta(residual * 1000, tolerance),
      score: timingScore(residual * 1000, sigma),
    };
  });
  return {
    tempoBpm: 60 / line.b,
    startTime: line.a,
    notes,
    extras: sortedOnsets.filter((_, j) => !used.has(j)),
    matched: best.matched,
    reliable: best.matched >= minMatched,
    stats: timingStats(
      notes
        .filter((n) => n.residualMs !== null)
        .map((n) => ({ time: n.expectedTime, deltaMs: n.residualMs! })),
    ),
  };
}
