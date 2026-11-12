/**
 * Note segmenter: turns the stream of pitch estimates of a monophonic
 * instrument into notes with a start, an end and a pitch, for a timeline.
 *
 * A note starts when a clear estimate (clarity ≥ `minClarity`) appears or
 * moves to another semitone, and lasts while the same semitone keeps coming
 * back. Gaps shorter than `bridgeSeconds` (a missed frame, a pick noise) do
 * not end it; a new attack on the same pitch does (`onset`). Notes shorter
 * than `minSeconds` are dropped as glitches when they end. Time comes from
 * the caller, in seconds.
 */

import type { PitchEstimate } from "../pitch";

export interface NoteSegmenterOptions {
  /** Estimates below this clarity are ignored. Default 0.6. */
  minClarity?: number;
  /** Gaps up to this long keep the note going, in seconds. Default 0.09. */
  bridgeSeconds?: number;
  /** Notes shorter than this are dropped when they end, in seconds. Default 0.06. */
  minSeconds?: number;
  /** Notes kept in `notes` (the current one included). Default 64. */
  historyLength?: number;
}

export const NOTE_SEGMENTER_DEFAULTS: Required<NoteSegmenterOptions> = {
  minClarity: 0.6,
  bridgeSeconds: 0.09,
  minSeconds: 0.06,
  historyLength: 64,
};

export interface NoteSegment {
  /** MIDI note number (A4 = 69). */
  midi: number;
  /** Mean deviation from `midi` over the note, in cents. */
  cents: number;
  start: number;
  /** End time; the sounding note's end follows the latest estimate. */
  end: number;
  /** True while the note is still sounding. */
  open: boolean;
}

export class NoteSegmenter {
  private readonly o: Required<NoteSegmenterOptions>;
  private segments: NoteSegment[] = [];
  private current: NoteSegment | null = null;
  private centsSum = 0;
  private centsCount = 0;
  private lastSeen = -Infinity;

  constructor(options: NoteSegmenterOptions = {}) {
    this.o = { ...NOTE_SEGMENTER_DEFAULTS, ...options };
  }

  /** The notes, oldest first; the last one may still be open. */
  get notes(): readonly NoteSegment[] {
    return this.segments;
  }

  /** Feed the latest estimate (null on silence or noise) at a time in seconds. */
  push(estimate: PitchEstimate | null, timeSeconds: number): readonly NoteSegment[] {
    const clear = estimate && estimate.clarity >= this.o.minClarity ? estimate : null;
    const cur = this.current;
    if (clear && cur && clear.midi === cur.midi) {
      cur.end = timeSeconds;
      this.centsSum += clear.cents;
      this.centsCount += 1;
      cur.cents = this.centsSum / this.centsCount;
      this.lastSeen = timeSeconds;
    } else if (clear) {
      this.close(timeSeconds);
      this.begin(clear, timeSeconds);
    } else if (cur && timeSeconds - this.lastSeen > this.o.bridgeSeconds) {
      this.close(this.lastSeen);
    }
    return this.segments;
  }

  /** A new attack: the next estimate starts a note even on the same pitch. */
  onset(timeSeconds: number): void {
    if (this.current) this.close(timeSeconds);
  }

  reset(): void {
    this.segments = [];
    this.current = null;
    this.lastSeen = -Infinity;
  }

  private begin(e: PitchEstimate, t: number): void {
    this.current = { midi: e.midi, cents: e.cents, start: t, end: t, open: true };
    this.centsSum = e.cents;
    this.centsCount = 1;
    this.lastSeen = t;
    this.segments.push(this.current);
    if (this.segments.length > this.o.historyLength) this.segments.shift();
  }

  private close(t: number): void {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    cur.end = Math.max(cur.end, Math.min(t, cur.end + this.o.bridgeSeconds));
    cur.open = false;
    if (cur.end - cur.start < this.o.minSeconds) {
      const i = this.segments.lastIndexOf(cur);
      if (i >= 0) this.segments.splice(i, 1);
    }
  }
}
