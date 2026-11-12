/**
 * The wolf's ears: turns the live `StageSignals` into the compact
 * `WolfSnapshot` its brain reads, remembering what it needs between two
 * looks (the last attack seen, the start of the silence, the last key).
 * No React, no DOM: testable in Node.
 */

import { scaleDegree, type KeyRef } from "@audiolab/core";

import { modeName, noteName, type Notation } from "../names";
import type { StageSignals } from "../useStageSignals";
import type { WolfSnapshot } from "./brain";

/** Attacks compared with the strongest of this many seconds. */
const STRENGTH_WINDOW = 10;
/** Onset rate measured over this many seconds. */
const RATE_WINDOW = 4;
/** Notes looked at for the key. */
const RECENT_NOTES = 10;
/** Shortest note counted (shorter ones are glitches). */
const MIN_NOTE = 0.08;
/** A note ended this long ago is still "the latest note". */
const NOTE_MEMORY = 1;
const IN_TUNE_CENTS = 5;

/** "A minor", or "La mineur" in French. */
export function wolfKeyName(key: KeyRef, notation: Notation = "en"): string {
  return `${noteName(key.tonic, notation)} ${modeName(key.mode, notation)}`;
}

export class WolfSensor {
  private seenCount: number | null = null;
  private silentSince: number | null = null;
  private keyEventAt: number | null = null;
  private lastKey: KeyRef | null = null;

  constructor(private notation: Notation = "en") {}

  setNotation(notation: Notation): void {
    this.notation = notation;
  }

  reset(): void {
    this.seenCount = null;
    this.silentSince = null;
    this.keyEventAt = null;
    this.lastKey = null;
  }

  /** A snapshot of `s` at `now` (seconds, the signals' performance clock). */
  read(s: StageSignals, now: number): WolfSnapshot {
    const playing = s.harmonyLevel.open || s.notesLevel.open;
    const level = Math.max(
      s.harmonyLevel.open ? s.harmonyLevel.level : 0,
      s.notesLevel.open ? s.notesLevel.level : 0,
    );
    if (playing) this.silentSince = null;
    else this.silentSince ??= now;
    const silenceSeconds = this.silentSince === null ? 0 : now - this.silentSince;

    // New attacks, relative to the strongest of the last seconds.
    const onsets = s.onsets;
    const first = this.seenCount === null;
    const fresh =
      this.seenCount === null ? 0 : Math.min(onsets.length, s.onsetCount - this.seenCount);
    this.seenCount = s.onsetCount;
    let strongest = 0;
    let rateCount = 0;
    for (const o of onsets) {
      if (now - o.time <= STRENGTH_WINDOW && o.strength > strongest) strongest = o.strength;
      if (now - o.time <= RATE_WINDOW) rateCount++;
    }
    const attacks: number[] = [];
    for (let i = onsets.length - Math.max(0, fresh); i < onsets.length; i++) {
      const o = onsets[i];
      attacks.push(strongest > 0 ? Math.min(1, o.strength / strongest) : 1);
    }

    // Key events (a new `keyEventAt`), compared with the last key announced.
    // The first look adopts the current key silently.
    let keyEvent: WolfSnapshot["keyEvent"] = null;
    const settled = s.key.phase === "settled" ? s.key.key : null;
    if (s.keyEventAt !== this.keyEventAt && settled) {
      const last = this.lastKey;
      if (first) {
        keyEvent = null;
      } else if (last === null) {
        keyEvent = "settled";
      } else if (last.tonic !== settled.tonic || last.mode !== settled.mode) {
        keyEvent = "modulated";
      }
      this.lastKey = settled;
    }
    if (s.key.phase === "listening") this.lastKey = null;
    this.keyEventAt = s.keyEventAt;

    // The last notes against the key.
    let recentInKey = 0;
    let recentOutOfKey = 0;
    let inKeyStreak = 0;
    let streakOpen = true;
    let counted = 0;
    const notes = s.notes;
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      if (!n.open && n.end - n.start < MIN_NOTE) continue;
      if (!settled) break;
      const inKey = scaleDegree(n.midi % 12, settled.tonic, settled.mode) !== null;
      if (counted < RECENT_NOTES) {
        if (inKey) recentInKey++;
        else recentOutOfKey++;
      }
      counted++;
      if (inKey && streakOpen) inKeyStreak++;
      else streakOpen = false;
      if (!streakOpen && counted >= RECENT_NOTES) break;
    }

    // The latest note.
    const last = notes[notes.length - 1];
    const note: WolfSnapshot["note"] =
      last && (last.open || now - last.end <= NOTE_MEMORY)
        ? {
            id: last.start,
            vibrato: last.vibrato.active,
            bendCents: last.bend?.cents ?? 0,
            inTuneSeconds:
              last.open && last.bend === null && Math.abs(last.cents) <= IN_TUNE_CENTS
                ? last.end - last.start
                : 0,
          }
        : null;

    return {
      playing,
      level,
      silenceSeconds,
      attacks,
      onsetRate: rateCount / RATE_WINDOW,
      keyEvent,
      keyName: settled ? wolfKeyName(settled, this.notation) : null,
      recentInKey,
      recentOutOfKey,
      inKeyStreak,
      note,
      tempoConfidence: s.tempo?.confidence ?? 0,
    };
  }
}
