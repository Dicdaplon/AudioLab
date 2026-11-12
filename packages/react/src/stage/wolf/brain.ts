/**
 * The mascot's mood: a small rule engine fed with a compact snapshot of the
 * music a few times per second (`WolfSensor` builds it from the stage
 * signals). It decides the wolf's pose (sit, listen, jump on a big attack,
 * tumble on a huge one, dance on a steady beat, howl when the key settles,
 * sleep after a long silence) and, rarely, a phrase for the speech bubble.
 *
 * Talking is rationed: one phrase at most every `minGapSeconds`, a cooldown
 * per kind, never the same line twice in a row, never while the bubble is
 * still shown, and the most important situation wins (too loud, then out
 * of key, then the compliments). Pure and deterministic given `random`: no
 * React, no DOM, testable in Node.
 */

import {
  WOLF_PHRASE_PRIORITY,
  WOLF_PHRASES,
  type WolfPhraseKind,
  type WolfPhrases,
} from "./phrases";

export type WolfPose = "sit" | "listen" | "jump" | "tumble" | "sleep" | "howl" | "dance";

/** What the wolf perceives, a few times per second. */
export interface WolfSnapshot {
  /** True while either input plays (adaptive gates). */
  playing: boolean;
  /** Loudness 0 … 1 between the learnt floor and the recent peaks (0 when silent). */
  level: number;
  /** Seconds since both inputs went silent (0 while playing). */
  silenceSeconds: number;
  /** Attacks since the previous snapshot, as strengths relative to the recent strongest (1 = as strong). */
  attacks: readonly number[];
  /** Attacks per second over the last seconds. */
  onsetRate: number;
  /** The key just settled, or changed (since the previous snapshot). */
  keyEvent: "settled" | "modulated" | null;
  /** Name of the settled key ("A minor"), or null. */
  keyName: string | null;
  /** Of the last notes (about 10), how many are in / out of the settled key (0 / 0 without one). */
  recentInKey: number;
  recentOutOfKey: number;
  /** Consecutive in-key notes, latest first. */
  inKeyStreak: number;
  /** The latest note (sounding or just ended), or null. */
  note: {
    /** Changes with every new note (its start time). */
    id: number;
    vibrato: boolean;
    /** Height of its bend in cents (0 when not bent). */
    bendCents: number;
    /** Seconds it has been held within ±5 cents (0 when not in tune or ended). */
    inTuneSeconds: number;
  } | null;
  /** Tempo confidence 0 … 1 (0 without a tempo). */
  tempoConfidence: number;
}

export interface WolfPhrase {
  text: string;
  kind: WolfPhraseKind;
  /** Time it started (the brain's clock). */
  at: number;
}

export interface WolfMood {
  pose: WolfPose;
  /** Time the pose started, for its animation. */
  poseAt: number;
  /** A phrase that starts with this step, else null. */
  phrase: WolfPhrase | null;
  /** The phrase shown now (until `bubbleSeconds` after it started), else null. */
  bubble: WolfPhrase | null;
}

export interface WolfBrainOptions {
  /** Shortest time between two phrases, in seconds. Default 25. */
  minGapSeconds?: number;
  /** Shortest time before the same kind of phrase comes back. Default 90. */
  kindCooldownSeconds?: number;
  /** How long a bubble stays. Default 3.5. */
  bubbleSeconds?: number;
  /** No phrase in the first seconds after the first step. Default 6. */
  warmupSeconds?: number;
  /** Silence before "Hello?". Default 10. */
  silenceSeconds?: number;
  /** Silence before the wolf falls asleep. Default 20. */
  sleepAfterSeconds?: number;
  /** Relative attack strength for a jump. Default 0.9. */
  jumpStrength?: number;
  /** Shortest time between two jumps. Default 1.5. */
  jumpGapSeconds?: number;
  /** Level (0 … 1) above which a record attack makes the wolf tumble. Default 0.9. */
  tumbleLevel?: number;
  /** Relative attack strength for a tumble. Default 1 (the strongest of the last seconds). */
  tumbleStrength?: number;
  /** Shortest time between two tumbles. Default 20. */
  tumbleGapSeconds?: number;
  /** Phrases to use instead of `WOLF_PHRASES` (missing kinds stay silent). */
  phrases?: Partial<WolfPhrases>;
  /** Random source in [0, 1) for picking a line. Default Math.random. */
  random?: () => number;
}

export const WOLF_BRAIN_DEFAULTS: Required<Omit<WolfBrainOptions, "phrases" | "random">> = {
  minGapSeconds: 25,
  kindCooldownSeconds: 90,
  bubbleSeconds: 3.5,
  warmupSeconds: 6,
  silenceSeconds: 10,
  sleepAfterSeconds: 20,
  jumpStrength: 0.9,
  jumpGapSeconds: 1.5,
  tumbleLevel: 0.9,
  tumbleStrength: 1,
  tumbleGapSeconds: 20,
};

/** Length of the one-shot poses, in seconds. */
export const WOLF_POSE_SECONDS: Readonly<Partial<Record<WolfPose, number>>> = {
  jump: 0.4,
  tumble: 0.7,
  howl: 1.6,
};

/** How long an event (a key change, a bend…) stays worth a comment. */
const EVENT_SECONDS = 5;
const LOUD_LEVEL = 0.97;
const LOUD_HOLD = 3;
const QUIET_LEVEL = 0.2;
const QUIET_HOLD = 5;
const OUT_OF_KEY_NOTES = 3;
const IN_KEY_STREAK = 10;
const BEND_CENTS = 80;
const HELD_SECONDS = 2.5;
const FAST_RATE = 6;
const GROOVE_CONFIDENCE = 0.6;
const DANCE_AFTER = 4;
const GROOVE_AFTER = 10;
/** Kinds important enough to speak after a third of the usual gap. */
const URGENT_PRIORITY = 9;

export class WolfBrain {
  private readonly o: Required<Omit<WolfBrainOptions, "phrases" | "random">>;
  private readonly phrases: Partial<WolfPhrases>;
  private readonly random: () => number;

  private startedAt: number | null = null;
  private pose: WolfPose = "sit";
  private poseAt = 0;
  private bubble: WolfPhrase | null = null;
  private lastPhraseAt = -Infinity;
  private lastText: string | null = null;
  private readonly kindAt = new Map<WolfPhraseKind, number>();
  /** Events waiting for a chance to be commented, with their expiry. */
  private readonly events = new Map<WolfPhraseKind, number>();
  private eventKeyName: string | null = null;

  private asleep = false;
  private silenceSaid = false;
  private lastJump = -Infinity;
  private lastTumble = -Infinity;
  private loudSince: number | null = null;
  private quietSince: number | null = null;
  private grooveSince: number | null = null;
  private lastVibratoNote: number | null = null;
  private lastBendNote: number | null = null;
  private lastHeldNote: number | null = null;

  constructor(options: WolfBrainOptions = {}) {
    const { phrases, random, ...rest } = options;
    this.o = { ...WOLF_BRAIN_DEFAULTS, ...rest };
    this.phrases = phrases ?? WOLF_PHRASES;
    this.random = random ?? Math.random;
  }

  /** Forget everything (a new song, a new scene). */
  reset(): void {
    this.startedAt = null;
    this.pose = "sit";
    this.poseAt = 0;
    this.bubble = null;
    this.lastPhraseAt = -Infinity;
    this.lastText = null;
    this.kindAt.clear();
    this.events.clear();
    this.asleep = false;
    this.silenceSaid = false;
    this.lastJump = this.lastTumble = -Infinity;
    this.loudSince = this.quietSince = this.grooveSince = null;
    this.lastVibratoNote = this.lastBendNote = this.lastHeldNote = null;
  }

  /** One look at the music; `time` in seconds on any steady clock. */
  step(s: WolfSnapshot, time: number): WolfMood {
    this.startedAt ??= time;
    const o = this.o;

    // One-shot poses run out.
    const length = WOLF_POSE_SECONDS[this.pose];
    if (length !== undefined && time - this.poseAt >= length) this.setPose("sit", time);

    // Silence, sleep and waking up.
    if (s.playing) {
      if (this.asleep) this.event("wake", time);
      this.asleep = false;
      this.silenceSaid = false;
    } else {
      if (!this.asleep && s.silenceSeconds >= o.sleepAfterSeconds) {
        this.asleep = true;
        this.event("sleep", time);
      } else if (!this.asleep && !this.silenceSaid && s.silenceSeconds >= o.silenceSeconds) {
        this.silenceSaid = true;
        this.event("silence", time);
      }
    }

    // Attacks: a jump, or a tumble when it is very loud and the attack the strongest.
    for (const a of s.attacks) {
      if (
        a >= o.tumbleStrength &&
        s.level >= o.tumbleLevel &&
        time - this.lastTumble >= o.tumbleGapSeconds
      ) {
        this.lastTumble = time;
        this.setPose("tumble", time);
        this.event("loud", time);
      } else if (
        a >= o.jumpStrength &&
        time - this.lastJump >= o.jumpGapSeconds &&
        this.pose !== "tumble"
      ) {
        this.lastJump = time;
        this.setPose("jump", time);
      }
    }

    // Key events: a howl.
    if (s.keyEvent) {
      if (this.pose !== "tumble") this.setPose("howl", time);
      this.eventKeyName = s.keyName;
      this.events.delete(s.keyEvent === "settled" ? "modulation" : "key");
      this.event(s.keyEvent === "settled" ? "key" : "modulation", time);
    }

    // The latest note: vibrato, bend, held in tune (once per note).
    const note = s.note;
    if (note) {
      if (note.vibrato && note.id !== this.lastVibratoNote) {
        this.lastVibratoNote = note.id;
        this.event("vibrato", time);
      }
      if (note.bendCents >= BEND_CENTS && note.id !== this.lastBendNote) {
        this.lastBendNote = note.id;
        this.event("bend", time);
      }
      if (note.inTuneSeconds >= HELD_SECONDS && note.id !== this.lastHeldNote) {
        this.lastHeldNote = note.id;
        this.event("held", time);
      }
    }

    // Lasting states.
    this.loudSince = s.playing && s.level >= LOUD_LEVEL ? (this.loudSince ?? time) : null;
    this.quietSince = s.playing && s.level < QUIET_LEVEL ? (this.quietSince ?? time) : null;
    const steady =
      s.playing &&
      s.tempoConfidence >= GROOVE_CONFIDENCE &&
      s.onsetRate >= 1 &&
      s.onsetRate < FAST_RATE;
    this.grooveSince = steady ? (this.grooveSince ?? time) : null;

    const states: WolfPhraseKind[] = [];
    if (this.loudSince !== null && time - this.loudSince >= LOUD_HOLD) states.push("loud");
    if (this.quietSince !== null && time - this.quietSince >= QUIET_HOLD) states.push("quiet");
    if (s.playing && s.recentOutOfKey >= OUT_OF_KEY_NOTES) states.push("outOfKey");
    if (s.playing && s.inKeyStreak >= IN_KEY_STREAK) states.push("inKey");
    if (s.playing && s.onsetRate >= FAST_RATE) states.push("fast");
    if (this.grooveSince !== null && time - this.grooveSince >= GROOVE_AFTER) states.push("groove");

    // Base pose, under the one-shots.
    const dancing = this.grooveSince !== null && time - this.grooveSince >= DANCE_AFTER;
    const base: WolfPose = this.asleep ? "sleep" : dancing ? "dance" : s.playing ? "listen" : "sit";
    if (WOLF_POSE_SECONDS[this.pose] === undefined && this.pose !== base) this.setPose(base, time);

    // The bubble runs out; maybe a new phrase.
    if (this.bubble && time - this.bubble.at >= o.bubbleSeconds) this.bubble = null;
    for (const [kind, until] of this.events) if (time > until) this.events.delete(kind);
    const phrase = this.bubble ? null : this.speak([...this.events.keys(), ...states], s, time);
    if (phrase) this.bubble = phrase;

    return { pose: this.pose, poseAt: this.poseAt, phrase, bubble: this.bubble };
  }

  private setPose(pose: WolfPose, time: number): void {
    if (pose === this.pose && WOLF_POSE_SECONDS[pose] === undefined) return;
    this.pose = pose;
    this.poseAt = time;
  }

  private event(kind: WolfPhraseKind, time: number): void {
    this.events.set(kind, time + EVENT_SECONDS);
  }

  private speak(kinds: WolfPhraseKind[], s: WolfSnapshot, time: number): WolfPhrase | null {
    const o = this.o;
    if (time - this.startedAt! < o.warmupSeconds) return null;
    const sinceLast = time - this.lastPhraseAt;
    const ranked = [...new Set(kinds)].sort(
      (a, b) => WOLF_PHRASE_PRIORITY[b] - WOLF_PHRASE_PRIORITY[a],
    );
    for (const kind of ranked) {
      const urgent = WOLF_PHRASE_PRIORITY[kind] >= URGENT_PRIORITY;
      if (sinceLast < (urgent ? o.minGapSeconds / 3 : o.minGapSeconds)) continue;
      if (time - (this.kindAt.get(kind) ?? -Infinity) < o.kindCooldownSeconds) continue;
      const keyName = kind === "key" || kind === "modulation" ? this.eventKeyName : s.keyName;
      const text = this.pick(kind, keyName);
      if (text === null) continue;
      this.lastPhraseAt = time;
      this.lastText = text;
      this.kindAt.set(kind, time);
      this.events.delete(kind);
      return { text, kind, at: time };
    }
    return null;
  }

  private pick(kind: WolfPhraseKind, keyName: string | null): string | null {
    const lines = (this.phrases[kind] ?? [])
      .filter((line) => keyName !== null || !line.includes("{key}"))
      .map((line) => (keyName === null ? line : line.split("{key}").join(keyName)))
      .filter((line) => line !== this.lastText);
    if (lines.length === 0) return null;
    return lines[Math.min(lines.length - 1, Math.floor(this.random() * lines.length))];
  }
}
