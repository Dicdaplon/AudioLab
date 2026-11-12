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
 * A bend is reported when the pitch has climbed at least `minBendCents`
 * above where the note started *without going back* (a step down of more
 * than `backtrackCents` restarts the climb). That separates it from a
 * vibrato, which oscillates around the note: a wide vibrato climbs as much
 * on each cycle but keeps coming back, and never gets far above the start.
 * Coming back down near the start after a bend marks it `released`.
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
  /** Largest pitch change between two estimates of one note, in cents. Default 60. */
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
  maxStepCents: 60,
  maxBendSemitones: 3,
  minBendCents: 70,
  backtrackCents: 15,
};

export interface BendReading {
  /** Highest point of the bend above where the note started, in cents (100 = a semitone). */
  cents: number;
  /** Where the pitch is now, above the start, in cents (0 when back down). */
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
    this.followBend(cur, rel);
    const v = this.vibrato.push(rel, t);
    if (
      v.active
        ? !cur.vibrato.active || v.extentCents >= cur.vibrato.extentCents
        : !cur.vibrato.active
    ) {
      cur.vibrato = v;
    }
  }

  private followBend(cur: NoteSegment, rel: number): void {
    const o = this.o;
    // A climb runs while the pitch does not step back by more than backtrackCents.
    if (rel < this.climbHigh - o.backtrackCents) {
      this.climbLow = rel;
      this.climbHigh = rel;
    } else {
      this.climbHigh = Math.max(this.climbHigh, rel);
      this.climbLow = Math.min(this.climbLow, rel);
    }
    const above = rel - this.baseline;
    const climbed = this.climbHigh - this.climbLow >= o.minBendCents;
    if (!cur.bend && climbed && this.climbHigh - this.baseline >= o.minBendCents) {
      cur.bend = { cents: 0, current: 0, released: false };
    }
    if (cur.bend) {
      cur.bend.cents = Math.max(cur.bend.cents, Math.round(this.climbHigh - this.baseline));
      cur.bend.current = Math.max(0, Math.round(above));
      if (above < RELEASE_CENTS) cur.bend.released = true;
      else if (cur.bend.released && above >= o.minBendCents) cur.bend.released = false;
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
