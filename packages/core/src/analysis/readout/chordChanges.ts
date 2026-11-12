/**
 * Chord changes: turns the per-frame chord ranking into discrete chord
 * changes and a short history, for a display.
 *
 * A new top-ranked chord counts as a change once it has stayed on top for
 * `holdSeconds`, leads the runner-up by `minMargin` (the scores are a
 * softmax, not probabilities), and comes at least `minGapSeconds` after the
 * previous change (so events never exceed 1 / minGapSeconds Hz). Sustained
 * silence marks the reading as silent without emitting a change; the last
 * chord is kept, so the display can dim it.
 */

import type { ChordQuality, ChordScore } from "../chordDetection";

export interface ChordChangeOptions {
  /** Seconds a new chord must stay on top. Default 0.25. */
  holdSeconds?: number;
  /** Minimum score lead over the runner-up. Default 0.04. */
  minMargin?: number;
  /** Minimum time between two changes, in seconds. Default 0.4. */
  minGapSeconds?: number;
  /**
   * Below this level the signal counts as silence, on the scale of
   * `TonalityFrame.signalLevelDb` (−100 is digital silence). Default −90.
   */
  silenceDb?: number;
  /** Seconds of silence before the reading turns silent. Default 0.6. */
  silenceSeconds?: number;
  /** Segments kept in `history` (the current one included). Default 12. */
  historyLength?: number;
  /** A runner-up is reported when its score is at least this share of the top one. Default 0.85. */
  runnerUpRatio?: number;
}

export const CHORD_CHANGE_DEFAULTS: Required<ChordChangeOptions> = {
  holdSeconds: 0.25,
  minMargin: 0.04,
  minGapSeconds: 0.4,
  silenceDb: -90,
  silenceSeconds: 0.6,
  historyLength: 12,
  runnerUpRatio: 0.85,
};

export interface ChordLabel {
  root: number;
  quality: ChordQuality;
  /** The detector's name, e.g. "Am7". */
  name: string;
}

export interface ChordSegment {
  chord: ChordLabel;
  /** Start time, in seconds. */
  start: number;
  /** End time; the current segment's end follows the latest frame. */
  end: number;
}

export interface ChordReading {
  /** Chord on display, null before the first change. */
  current: ChordLabel | null;
  /** Close second candidate (score ratio above `runnerUpRatio`), or null. */
  runnerUp: ChordLabel | null;
  /** Top score minus runner-up score of this frame. */
  margin: number;
  silent: boolean;
  /** True on the frame where `current` changed. */
  changed: boolean;
  /** Oldest first; the last entry is the current chord. */
  history: readonly ChordSegment[];
}

function labelOf(c: ChordScore): ChordLabel {
  return { root: c.root, quality: c.quality, name: c.name };
}

function same(a: ChordLabel | null, b: ChordScore | ChordLabel | undefined): boolean {
  return !!a && !!b && a.root === b.root && a.quality === b.quality;
}

export class ChordChangeTracker {
  private o: Required<ChordChangeOptions>;
  private current: ChordLabel | null = null;
  private pending: ChordLabel | null = null;
  private pendingSince = 0;
  private lastChange = -Infinity;
  private quietSince: number | null = null;
  private segments: ChordSegment[] = [];

  constructor(options: ChordChangeOptions = {}) {
    this.o = { ...CHORD_CHANGE_DEFAULTS, ...options };
  }

  /** Feed one frame: ranked chords (best first), the level, the time in seconds. */
  push(chords: readonly ChordScore[], levelDb: number, timeSeconds: number): ChordReading {
    const o = this.o;
    const [top, second] = chords;
    const margin = top ? top.probability - (second?.probability ?? 0) : 0;
    let changed = false;

    if (levelDb < o.silenceDb) {
      this.quietSince ??= timeSeconds;
      this.pending = null;
    } else {
      this.quietSince = null;
      if (!top || same(this.current, top)) {
        this.pending = null;
      } else {
        if (!same(this.pending, top)) {
          this.pending = labelOf(top);
          this.pendingSince = timeSeconds;
        }
        if (
          timeSeconds - this.pendingSince >= o.holdSeconds &&
          margin >= o.minMargin &&
          timeSeconds - this.lastChange >= o.minGapSeconds
        ) {
          this.current = this.pending;
          this.pending = null;
          this.lastChange = timeSeconds;
          changed = true;
          this.segments.push({ chord: this.current!, start: timeSeconds, end: timeSeconds });
          if (this.segments.length > o.historyLength) this.segments.shift();
        }
      }
    }

    const last = this.segments[this.segments.length - 1];
    if (last) last.end = timeSeconds;
    const silent = this.quietSince !== null && timeSeconds - this.quietSince >= o.silenceSeconds;
    const runnerUp =
      top && second && !silent && second.probability >= o.runnerUpRatio * top.probability
        ? labelOf(same(this.current, top) || !this.current ? second : top)
        : null;

    return { current: this.current, runnerUp, margin, silent, changed, history: this.segments };
  }

  /** Change the thresholds; the current chord and the history are kept. */
  configure(options: ChordChangeOptions): void {
    this.o = { ...this.o, ...options };
  }

  /** Forget the current chord and the history. */
  reset(): void {
    this.current = null;
    this.pending = null;
    this.lastChange = -Infinity;
    this.quietSince = null;
    this.segments = [];
  }
}
