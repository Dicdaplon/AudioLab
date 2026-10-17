/**
 * Live timing scorer: matches played onsets to expected notes and grades
 * each note on two independent axes, timing (on time / early / late /
 * missed) and label (right note or chord, when the caller checks it).
 * Pure reducer, no clock of its own: the caller pushes onsets as they are
 * detected and advances the time as the audio is analysed.
 *
 * Times are seconds in ONE clock shared by notes and onsets (for live
 * audio: the AudioContext clock; convert the game's rAF time once per
 * frame with `AudioClockSync.perfMsToContextTime`).
 *
 * Matching. Each note k at Tₖ accepts onsets within ±wₖ, where
 *   wₖ = min(tolerance.windowMs, windowRatio · gap to the nearest note)
 * so neighbouring windows never overlap. An onset goes to the nearest open
 * note whose window contains it; a note keeps its nearest onset and any
 * other one is an extra. Onset times are first corrected:
 *   t' = t − (offsetMs + bias) / 1000
 * with `offsetMs` from the timing budget (input + display latency).
 *
 * Resolution. A note resolves as soon as an onset lands within the
 * on-time window (nothing closer would change the verdict), otherwise
 * when the analysed time passes Tₖ + wₖ: then it is early, late or
 * missed. Pass to `advance` the time up to which onsets are known (end of
 * the analysed audio minus the detector's decision latency), or a note
 * could be declared missed while its onset is still being decided.
 *
 * Adaptive bias (optional). Without a loopback measurement the true
 * latency is only estimated; a constant error (a Bluetooth headset, a TV)
 * would make every note "late". With `adaptiveBias`, the median offset of
 * the last `biasWindow` matched notes (bounded by ±`maxBiasMs`) is
 * subtracted from later onsets. It also absorbs a player's steady
 * tendency to rush or drag, so use it for "play with the scrolling notes"
 * games, not to measure that tendency.
 *
 * `stepTimingScorer` is the pure transition; `TimingScorer` holds the state.
 * `scoreTimings` runs a whole performance offline with the same logic.
 */

import { resolveConfig } from "../utils/resolveConfig";
import { medianOf } from "./timingStats";
import {
  TIMING_TOLERANCE_DEFAULTS,
  classifyDelta,
  type TimingTier,
  type TimingTolerance,
} from "./tolerance";

export interface ExpectedNote {
  /** Caller's identifier (unique within the exercise). */
  id: string | number;
  /** Target time, in seconds. */
  time: number;
  /** What should be played (a pitch class, a chord key…); omit to check timing only. */
  label?: string;
}

export interface PlayedOnset {
  /** Detector id (`OnsetEvent.id`), used to attach a label later. */
  id: number;
  /** Onset time, in seconds, same clock as the notes. */
  time: number;
}

export type LabelStatus = "none" | "pending" | "correct" | "wrong" | "unheard";

export interface NoteResult {
  noteId: string | number;
  expectedTime: number;
  resolved: boolean;
  /** Timing verdict, null while unresolved. */
  tier: TimingTier | null;
  onsetId: number | null;
  /** Corrected offset of the matched onset, in ms (positive = late), null if none. */
  deltaMs: number | null;
  /** Label verdict: "none" when the note has no expected label. */
  label: LabelStatus;
  /** Label reported for the matched onset, if any. */
  heardLabel: string | null;
}

export interface TimingScorerConfig {
  tolerance: TimingTolerance;
  /** Latency subtracted from onset times, in ms (`TimingBudget.offsetMs`). Default 0. */
  offsetMs: number;
  /** Window = min(windowMs, windowRatio · gap to the nearest note), ratio capped at 0.5. Default 0.5. */
  windowRatio: number;
  /** Learn and subtract a constant offset. Default false. */
  adaptiveBias: boolean;
  /** Matched notes in the bias median. Default 8. */
  biasWindow: number;
  /** Matched notes before the bias applies. Default 4. */
  minBiasSamples: number;
  /** Bound of the learnt bias, in ms. Default 250. */
  maxBiasMs: number;
  /** Label comparison. Default strict equality. */
  labelMatches: (expected: string, heard: string) => boolean;
}

export const TIMING_SCORER_DEFAULTS: TimingScorerConfig = {
  tolerance: TIMING_TOLERANCE_DEFAULTS,
  offsetMs: 0,
  windowRatio: 0.5,
  adaptiveBias: false,
  biasWindow: 8,
  minBiasSamples: 4,
  maxBiasMs: 250,
  labelMatches: (expected, heard) => expected === heard,
};

export interface TimingScorerState {
  notes: readonly ExpectedNote[];
  /** Half window of each note, in seconds. */
  windows: readonly number[];
  results: readonly NoteResult[];
  /** Matched onset time (corrected, s) per unresolved note, or null. */
  candidates: readonly (number | null)[];
  /** Offset of each note's matched onset before the bias, in ms (feeds the bias). */
  rawDeltasMs: readonly (number | null)[];
  /** Onsets that matched no note. */
  extras: readonly PlayedOnset[];
  /** Learnt bias, in ms. */
  biasMs: number;
  /** Raw offsets feeding the bias. */
  biasSamples: readonly number[];
  /** Index of the first unresolved note. */
  firstOpen: number;
}

export type TimingScorerAction =
  | { type: "onset"; onset: PlayedOnset }
  | { type: "label"; onsetId: number; label: string | null }
  | { type: "advance"; time: number };

export interface TimingScorerStep {
  state: TimingScorerState;
  /** Results that changed in this step (resolved, or labelled). */
  changed: NoteResult[];
}

export function createTimingScorerState(
  notes: readonly ExpectedNote[],
  config: TimingScorerConfig = TIMING_SCORER_DEFAULTS,
): TimingScorerState {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const windows = sorted.map((n, i) => {
    const prev = i > 0 ? n.time - sorted[i - 1].time : Infinity;
    const next = i < sorted.length - 1 ? sorted[i + 1].time - n.time : Infinity;
    const gap = Math.min(prev, next);
    // Capped at half the gap: neighbouring windows never overlap.
    return Math.min(config.tolerance.windowMs / 1000, Math.min(0.5, config.windowRatio) * gap);
  });
  return {
    notes: sorted,
    windows,
    results: sorted.map((n) => ({
      noteId: n.id,
      expectedTime: n.time,
      resolved: false,
      tier: null,
      onsetId: null,
      deltaMs: null,
      label: n.label === undefined ? "none" : "pending",
      heardLabel: null,
    })),
    candidates: sorted.map(() => null),
    rawDeltasMs: sorted.map(() => null),
    extras: [],
    biasMs: 0,
    biasSamples: [],
    firstOpen: 0,
  };
}

export function stepTimingScorer(
  state: TimingScorerState,
  action: TimingScorerAction,
  config: TimingScorerConfig = TIMING_SCORER_DEFAULTS,
): TimingScorerStep {
  switch (action.type) {
    case "onset":
      return onOnset(state, action.onset, config);
    case "label":
      return onLabel(state, action.onsetId, action.label, config);
    case "advance":
      return onAdvance(state, action.time, config);
  }
}

function correctedTime(state: TimingScorerState, t: number, config: TimingScorerConfig): number {
  return t - (config.offsetMs + state.biasMs) / 1000;
}

function onOnset(
  state: TimingScorerState,
  onset: PlayedOnset,
  config: TimingScorerConfig,
): TimingScorerStep {
  const t = correctedTime(state, onset.time, config);
  let best = -1;
  let bestDist = Infinity;
  for (let k = state.firstOpen; k < state.notes.length; k++) {
    const dt = t - state.notes[k].time;
    if (dt < -state.windows[k]) break; // notes are sorted: the rest are later
    if (state.results[k].resolved) continue;
    if (Math.abs(dt) <= state.windows[k] && Math.abs(dt) < bestDist) {
      best = k;
      bestDist = Math.abs(dt);
    }
  }
  if (best < 0) return { state: { ...state, extras: [...state.extras, onset] }, changed: [] };

  const previous = state.candidates[best];
  const previousDist = previous === null ? Infinity : Math.abs(previous - state.notes[best].time);
  if (previousDist <= bestDist) {
    return { state: { ...state, extras: [...state.extras, onset] }, changed: [] };
  }

  const extras = [...state.extras];
  if (previous !== null && state.results[best].onsetId !== null) {
    extras.push({ id: state.results[best].onsetId!, time: previous });
  }
  const candidates = [...state.candidates];
  candidates[best] = t;
  const results = [...state.results];
  const deltaMs = (t - state.notes[best].time) * 1000;
  // A new onset carries no label yet, whatever the replaced one had.
  const expectsLabel = state.notes[best].label !== undefined;
  results[best] = {
    ...results[best],
    onsetId: onset.id,
    deltaMs,
    label: expectsLabel ? "pending" : "none",
    heardLabel: null,
  };
  const rawDeltasMs = [...state.rawDeltasMs];
  rawDeltasMs[best] = deltaMs + state.biasMs;
  let next: TimingScorerState = { ...state, candidates, rawDeltasMs, results, extras };
  const changed: NoteResult[] = [];
  if (Math.abs(deltaMs) <= config.tolerance.onTimeMs) {
    next = resolve(next, best, config);
    changed.push(next.results[best]);
  }
  return { state: next, changed };
}

function resolve(
  state: TimingScorerState,
  k: number,
  config: TimingScorerConfig,
): TimingScorerState {
  const results = [...state.results];
  const r = results[k];
  const tier = r.deltaMs === null ? "missed" : classifyDelta(r.deltaMs, config.tolerance);
  results[k] = { ...r, resolved: true, tier };
  let { biasMs, biasSamples } = state;
  const raw = state.rawDeltasMs[k];
  if (config.adaptiveBias && raw !== null) {
    // The offset before the bias, as measured when the onset was matched.
    biasSamples = [...biasSamples, raw].slice(-config.biasWindow);
    if (biasSamples.length >= config.minBiasSamples) {
      const m = medianOf(biasSamples);
      biasMs = Math.max(-config.maxBiasMs, Math.min(config.maxBiasMs, m));
    }
  }
  let firstOpen = state.firstOpen;
  while (firstOpen < results.length && results[firstOpen].resolved) firstOpen++;
  return { ...state, results, biasMs, biasSamples, firstOpen };
}

function onAdvance(
  state: TimingScorerState,
  time: number,
  config: TimingScorerConfig,
): TimingScorerStep {
  const now = correctedTime(state, time, config);
  let next = state;
  const changed: NoteResult[] = [];
  for (let k = state.firstOpen; k < state.notes.length; k++) {
    if (state.notes[k].time + state.windows[k] >= now) break;
    if (next.results[k].resolved) continue;
    next = resolve(next, k, config);
    changed.push(next.results[k]);
  }
  return { state: next, changed };
}

function onLabel(
  state: TimingScorerState,
  onsetId: number,
  label: string | null,
  config: TimingScorerConfig,
): TimingScorerStep {
  const k = state.results.findIndex((r) => r.onsetId === onsetId);
  if (k < 0) return { state, changed: [] };
  const expected = state.notes[k].label;
  const results = [...state.results];
  let status: LabelStatus = "none";
  if (expected !== undefined) {
    status =
      label === null ? "unheard" : config.labelMatches(expected, label) ? "correct" : "wrong";
  }
  results[k] = { ...results[k], label: status, heardLabel: label };
  return { state: { ...state, results }, changed: [results[k]] };
}

/** Object wrapper of `stepTimingScorer`. */
export class TimingScorer {
  readonly config: TimingScorerConfig;
  private current: TimingScorerState;

  constructor(notes: readonly ExpectedNote[], config: Partial<TimingScorerConfig> = {}) {
    this.config = resolveConfig(TIMING_SCORER_DEFAULTS, config);
    this.current = createTimingScorerState(notes, this.config);
  }

  get state(): TimingScorerState {
    return this.current;
  }

  get results(): readonly NoteResult[] {
    return this.current.results;
  }

  private apply(action: TimingScorerAction): NoteResult[] {
    const step = stepTimingScorer(this.current, action, this.config);
    this.current = step.state;
    return step.changed;
  }

  onset(onset: PlayedOnset): NoteResult[] {
    return this.apply({ type: "onset", onset });
  }

  label(onsetId: number, label: string | null): NoteResult[] {
    return this.apply({ type: "label", onsetId, label });
  }

  advance(time: number): NoteResult[] {
    return this.apply({ type: "advance", time });
  }

  /** Resolve every remaining note (end of the exercise). */
  finish(): NoteResult[] {
    return this.advance(Infinity);
  }
}

/** Score a whole performance at once (same matching as the live scorer). */
export function scoreTimings(
  notes: readonly ExpectedNote[],
  onsets: readonly PlayedOnset[],
  config: Partial<TimingScorerConfig> = {},
): TimingScorerState {
  const scorer = new TimingScorer(notes, config);
  for (const o of [...onsets].sort((a, b) => a.time - b.time)) {
    scorer.advance(o.time);
    scorer.onset(o);
  }
  scorer.finish();
  return scorer.state;
}
