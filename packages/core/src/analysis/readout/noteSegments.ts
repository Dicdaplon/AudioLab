/**
 * Note segmenter: turns the stream of pitch estimates of a monophonic
 * instrument into notes with a start, an end and a pitch, for a timeline.
 *
 * A note starts when a clear estimate (clarity ≥ `minClarity`) appears or
 * the pitch jumps, and lasts while the pitch stays with it. Gaps shorter
 * than `bridgeSeconds` (a missed frame, a pick noise) do not end it; a new
 * attack does (`onset`). Notes shorter than `minSeconds` are dropped as
 * glitches when they end. Time comes from the caller, in seconds.
 *
 * Pitch is followed as a continuous value (`midi + cents / 100`), which
 * tells a bend from a new note:
 *
 *   - a hammer-on, a pull-off or a new picked note *jumps*: consecutive
 *     estimates differ by more than `maxStepCents` → a new note;
 *   - a bend *glides*: consecutive estimates stay close while the pitch
 *     travels away from the note, up to `maxBendSemitones` → the same note,
 *     bent. Beyond that range a glide is a slide, and starts a new note.
 *
 * A bend is reported when the pitch has moved at least `minBendCents` away
 * from where the note started, up or down, *without going back* (a step of
 * more than `backtrackCents` the other way restarts the move): up for a
 * bend, down for a release from a pre-bent note or a dip. That separates it
 * from a vibrato, which keeps coming back; and while the pitch is
 * oscillating (two reversals of more than 25 cents within 0.4 s) no bend
 * is reported at all, so even a wide, fast vibrato never reads as one.
 * Coming back near the start after a bend marks it `released`.
 *
 * Each note also carries its vibrato (`VibratoDetector` over the note's
 * cents): while it sounds, the latest reading; once a vibrato has been
 * found, the widest one, so a note keeps its vibrato after it ends.
 */

import type { PitchEstimate } from "../pitch";
import { NO_VIBRATO, VibratoDetector, type VibratoOptions, type VibratoReading } from "./vibrato";

export interface NoteSegmenterOptions {
  /** Estimates below this clarity are ignored. Default 0.6. */
  minClarity?: number;
  /** Gaps up to this long keep the note going, in seconds. Default 0.09. */
  bridgeSeconds?: number;
  /** Notes shorter than this are dropped when they end, in seconds. Default 0.06. */
  minSeconds?: number;
  /** Notes kept in `notes` (the current one included). Default 64. */
  historyLength?: number;
  /** Vibrato thresholds (see `VIBRATO_DEFAULTS`). */
  vibrato?: VibratoOptions;
  /**
   * Largest pitch change between two estimates of one note, in cents. Default
   * 90: a violent vibrato (±50 cents at 7 Hz) moves ~55 cents per 25 ms step,
   * a hammer-on a full semitone at once.
   */
  maxStepCents?: number;
  /** Largest bend, in semitones; a longer glide is a slide (a new note). Default 3. */
  maxBendSemitones?: number;
  /** Smallest climb above the note's start reported as a bend, in cents. Default 70. */
  minBendCents?: number;
  /** A drop larger than this during a climb restarts it, in cents. Default 15. */
  backtrackCents?: number;
}

export const NOTE_SEGMENTER_DEFAULTS: Required<NoteSegmenterOptions> = {
  minClarity: 0.6,
  bridgeSeconds: 0.09,
  minSeconds: 0.06,
  historyLength: 64,
  vibrato: {},
  maxStepCents: 90,
  maxBendSemitones: 3,
  minBendCents: 70,
  backtrackCents: 15,
};

export interface BendReading {
  /** Up (a bend) or down (a release from a pre-bent note, a dip). */
  direction: "up" | "down";
  /** Furthest point of the bend from where the note started, in cents (100 = a semitone). */
  cents: number;
  /** How far the pitch is now from the start in the bend's direction, in cents (0 when back). */
  current: number;
  /** True once the pitch has come back down near the start after the bend. */
  released: boolean;
}

export interface NoteSegment {
  /** MIDI note number (A4 = 69): the note as fretted, before any bend. */
  midi: number;
  /** Mean deviation from `midi` over the unbent part of the note, in cents. */
  cents: number;
  start: number;
  /** End time; the sounding note's end follows the latest estimate. */
  end: number;
  /** True while the note is still sounding. */
  open: boolean;
  /** The note's vibrato (see the class comment). */
  vibrato: VibratoReading;
  /** The note's bend, or null when it was not bent. */
  bend: BendReading | null;
}

/** Released after a bend once the pitch is back within this of the start, in cents. */
const RELEASE_CENTS = 30;
/** A reversal of the pitch's direction counts above this, in cents. */
const REVERSAL_CENTS = 25;
/** Two reversals within this window mean the pitch oscillates (a vibrato), in seconds. */
const OSCILLATION_SECONDS = 0.4;

export class NoteSegmenter {
  private o: Required<NoteSegmenterOptions>;
  private readonly vibrato: VibratoDetector;
  private segments: NoteSegment[] = [];
  private current: NoteSegment | null = null;
  private centsSum = 0;
  private centsCount = 0;
  private lastSeen = -Infinity;
  /** Continuous pitch (semitones) of the last estimate of the current note. */
  private lastPitch = 0;
  /** Cents above `midi` where the note started, and the climb in progress. */
  private baseline = 0;
  private climbLow = 0;
  private climbHigh = 0;
  private fallLow = 0;
  private fallHigh = 0;
  /** Direction tracking for the oscillation guard. */
  private rising = true;
  private extreme = 0;
  private reversals: number[] = [];

  constructor(options: NoteSegmenterOptions = {}) {
    this.o = { ...NOTE_SEGMENTER_DEFAULTS, ...options };
    this.vibrato = new VibratoDetector(this.o.vibrato);
  }

  /** Change the thresholds; the notes are kept. */
  configure(options: NoteSegmenterOptions): void {
    this.o = { ...this.o, ...options };
    if (options.vibrato) this.vibrato.configure(options.vibrato);
  }

  /** The notes, oldest first; the last one may still be open. */
  get notes(): readonly NoteSegment[] {
    return this.segments;
  }

  /** Feed the latest estimate (null on silence or noise) at a time in seconds. */
  push(estimate: PitchEstimate | null, timeSeconds: number): readonly NoteSegment[] {
    const clear = estimate && estimate.clarity >= this.o.minClarity ? estimate : null;
    const cur = this.current;
    if (clear && cur && this.continues(cur, clear)) {
      this.extend(cur, clear, timeSeconds);
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

  /** Same note: same semitone, or a glide (a bend) within range. */
  private continues(cur: NoteSegment, e: PitchEstimate): boolean {
    const pitch = e.midi + e.cents / 100;
    const step = Math.abs(pitch - this.lastPitch) * 100;
    if (step > this.o.maxStepCents) return false;
    return e.midi === cur.midi || Math.abs(pitch - cur.midi) <= this.o.maxBendSemitones;
  }

  private extend(cur: NoteSegment, e: PitchEstimate, t: number): void {
    const pitch = e.midi + e.cents / 100;
    const rel = (pitch - cur.midi) * 100; // cents above the fretted note
    cur.end = t;
    this.lastSeen = t;
    this.lastPitch = pitch;
    if (Math.abs(rel) < 50) {
      this.centsSum += rel;
      this.centsCount += 1;
      cur.cents = this.centsSum / this.centsCount;
    }
    this.followBend(cur, rel, t);
    const v = this.vibrato.push(rel, t);
    if (
      v.active
        ? !cur.vibrato.active || v.extentCents >= cur.vibrato.extentCents
        : !cur.vibrato.active
    ) {
      cur.vibrato = v;
    }
  }

  private followBend(cur: NoteSegment, rel: number, t: number): void {
    const o = this.o;
    // Oscillation guard: count direction reversals larger than REVERSAL_CENTS.
    if (this.rising ? rel < this.extreme - REVERSAL_CENTS : rel > this.extreme + REVERSAL_CENTS) {
      this.rising = !this.rising;
      this.extreme = rel;
      this.reversals.push(t);
    } else if (this.rising ? rel > this.extreme : rel < this.extreme) {
      this.extreme = rel;
    }
    while (this.reversals.length > 0 && t - this.reversals[0] > OSCILLATION_SECONDS) {
      this.reversals.shift();
    }
    const oscillating = this.reversals.length >= 2;

    // A move runs while the pitch does not step back by more than backtrackCents.
    if (rel < this.climbHigh - o.backtrackCents) {
      this.climbLow = rel;
      this.climbHigh = rel;
    } else {
      this.climbHigh = Math.max(this.climbHigh, rel);
      this.climbLow = Math.min(this.climbLow, rel);
    }
    if (rel > this.fallLow + o.backtrackCents) {
      this.fallLow = rel;
      this.fallHigh = rel;
    } else {
      this.fallLow = Math.min(this.fallLow, rel);
      this.fallHigh = Math.max(this.fallHigh, rel);
    }

    if (!cur.bend && !oscillating) {
      const up =
        this.climbHigh - this.climbLow >= o.minBendCents &&
        this.climbHigh - this.baseline >= o.minBendCents;
      const down =
        this.fallHigh - this.fallLow >= o.minBendCents &&
        this.baseline - this.fallLow >= o.minBendCents;
      if (up || down) {
        cur.bend = { direction: up ? "up" : "down", cents: 0, current: 0, released: false };
      }
    }
    if (cur.bend) {
      const sign = cur.bend.direction === "up" ? 1 : -1;
      const away = sign * (rel - this.baseline);
      const furthest =
        cur.bend.direction === "up" ? this.climbHigh - this.baseline : this.baseline - this.fallLow;
      cur.bend.cents = Math.max(cur.bend.cents, Math.round(furthest));
      cur.bend.current = Math.max(0, Math.round(away));
      if (away < RELEASE_CENTS) cur.bend.released = true;
      else if (cur.bend.released && away >= o.minBendCents) cur.bend.released = false;
    }
  }

  private begin(e: PitchEstimate, t: number): void {
    this.current = {
      midi: e.midi,
      cents: e.cents,
      start: t,
      end: t,
      open: true,
      vibrato: NO_VIBRATO,
      bend: null,
    };
    this.vibrato.reset();
    this.vibrato.push(e.cents, t);
    this.centsSum = e.cents;
    this.centsCount = 1;
    this.lastSeen = t;
    this.lastPitch = e.midi + e.cents / 100;
    this.baseline = e.cents;
    this.climbLow = e.cents;
    this.climbHigh = e.cents;
    this.fallLow = e.cents;
    this.fallHigh = e.cents;
    this.rising = true;
    this.extreme = e.cents;
    this.reversals = [];
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
