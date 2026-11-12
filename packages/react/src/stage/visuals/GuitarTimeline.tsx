"use client";

/**
 * Guitar timeline: the notes played, scrolling right to left past a "now"
 * line, as a tablature (`view="tab"`, default) or on a staff
 * (`view="staff"`). A chord strip above shares the time axis, so the line
 * reads against its harmony, and a faint line marks each chord change.
 *
 * Tab: six strings (high E on top), each note a pill on the string and fret
 * a guitarist would most likely use (`FretPlacer`: the hand stays in a
 * position, the song starts in the key's pentatonic box).
 *
 * Staff: a five-line treble staff in guitar notation, written an octave
 * above where it sounds (the clef carries a small "8" under it). Each note
 * is a head at its diatonic place, with ledger lines and its own ♯ / ♭
 * spelled from the song's key (flat keys read with flats, the others and
 * "no key yet" with sharps); there is no key signature, so a note reads on
 * its own. A note needing more than two ledger lines is drawn an octave
 * nearer, marked 8va (sounds higher) or 8vb (lower). With `labels="names"`
 * the head is a pill holding the note's name, still at its staff position:
 * the line's shape reads like notation, the names read without it. Spelling
 * and positions are in `timelineStaff.ts`.
 *
 * In both views the note says what it is in the music: filled for a chord
 * tone, outlined for a scale note, with a coral cut corner when outside the
 * key; a held note trails a bar. A vibrato makes the bar a stepped wave at
 * its rate; a bend makes it climb (a stepped curve) and come back down when
 * released, with the tab label of the bend at the top ("½", "1" = full,
 * "1½"…). Attacks without a clear pitch (a strummed chord) draw a strum mark,
 * which shows the picking hand's rhythm. Beat ticks follow the detected
 * tempo; with no reliable tempo the lane scrolls at a fixed speed without
 * ticks.
 */

import { useRef, type RefObject } from "react";

import {
  CHORD_QUALITY_INTERVALS,
  chordDegree,
  FretPlacer,
  scaleDegree,
  type ChordSegment,
  type FretPosition,
  type KeyRef,
  type NoteSegment,
} from "@audiolab/core";

import { bendAmount, chordName, noteName, type Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";
import {
  ledgerCount,
  spelledName,
  staffNote,
  TOP_LINE_POS,
  usesFlats,
  type StaffNote,
} from "./timelineStaff";

export interface GuitarTimelineProps {
  signals: RefObject<StageSignals | null>;
  width: number;
  height: number;
  /** Tablature ("tab", default) or treble staff in guitar notation ("staff"). */
  view?: "tab" | "staff";
  /**
   * Tab pills show the fret ("frets", default) or the note name ("names");
   * on the staff, "names" prints the name after each head.
   */
  labels?: "frets" | "names";
  /** Chord strip above the lane. Default true. */
  chords?: boolean;
  /** The tempo (smoothed BPM and beat pips) above the staff, past the now line. Default true. */
  tempo?: boolean;
  notation?: Notation;
  theme?: StageTheme;
}

const STRIP = 40;
const STRING_GAP = 26;
const PILL_H = 24;
const LEFT = 48;
const NOW_FROM_RIGHT = 160;
/** Scroll: one beat = 128 px (64 px above 140 BPM); 160 px/s without a tempo. */
const BEAT_PX = 128;
const FREE_PX_PER_S = 160;
/**
 * An attack owns a note that starts up to this long after it (the pitch
 * tracker needs a few frames) or a little before; otherwise it is a strum.
 */
const OWN_BEFORE = 0.05;
const OWN_AFTER = 0.3;
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];
/** A sounding note is placed (and drawn) after this long: shorter blips may be glitches. */
const MIN_PLACE_SECONDS = 0.07;
/** Bend on a held bar: rise per semitone and its cap, ramp length, curve step, in px. */
const BEND_PX_PER_SEMITONE = 10;
const BEND_MAX_PX = 30;
const BEND_RAMP_PX = 32;
const CURVE_STEP = 4;
/** Staff line gap bounds, in px (the gap follows the height). */
const STAFF_GAP_MIN = 10;
const STAFF_GAP_MAX = 14;
/** Note role flags: filled head or pill for a chord tone, coral corner outside the key. */
const CHORD_TONE = 2;
const IN_KEY = 1;
const CLEF_FONT = '"Segoe UI Symbol", "Noto Music", "Bravura Text", serif';

interface TimelineState {
  placer: FretPlacer;
  /** Placement of each note, by its start time: assigned once, never moved. */
  placed: Map<number, FretPosition | null>;
  /** Staff place and spelling of each note, by its start time, in the key it was played in. */
  staffed: Map<number, StaffNote>;
  keyId: string;
  quietSince: number | null;
  pxPerSecond: number;
}

function keyId(key: KeyRef | null): string {
  return key ? `${key.tonic}${key.mode}` : "";
}

/** The chord sounding at time t, from the history. */
function chordAt(history: readonly ChordSegment[], t: number): ChordSegment | null {
  for (let i = history.length - 1; i >= 0; i--) if (history[i].start <= t) return history[i];
  return null;
}

/** Plate outline with cut corners. */
function platePath(ctx: CanvasRenderingContext2D, w: number, h: number, cut: number): void {
  ctx.beginPath();
  ctx.moveTo(cut, 0);
  ctx.lineTo(w - cut, 0);
  ctx.lineTo(w, cut);
  ctx.lineTo(w, h - cut);
  ctx.lineTo(w - cut, h);
  ctx.lineTo(cut, h);
  ctx.lineTo(0, h - cut);
  ctx.lineTo(0, cut);
  ctx.closePath();
}

/** Coral cut corner at the top right of a box: the note is outside the key. */
function cutCorner(ctx: CanvasRenderingContext2D, right: number, top: number, theme: StageTheme) {
  ctx.fillStyle = theme.bad;
  ctx.beginPath();
  ctx.moveTo(right - 8, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, top + 8);
  ctx.closePath();
  ctx.fill();
}

/** Pixel oval (a notehead), centred vertically on y. */
function pixelOval(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const top = y - h / 2;
  ctx.fillRect(x + 4, top, w - 8, h);
  ctx.fillRect(x + 2, top + 2, w - 4, h - 4);
  ctx.fillRect(x, top + 4, w, h - 8);
}

/** Smoothstep, for the bend curve. */
function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * A held note's bar from x0 to x1 on y: flat, a stepped wave with a vibrato,
 * a stepped climb (and its label) with a bend, back down when released.
 * The fill style is the caller's.
 */
function heldBar(
  ctx: CanvasRenderingContext2D,
  n: NoteSegment,
  x0: number,
  x1: number,
  y: number,
  thick: number,
  pps: number,
  theme: StageTheme,
): void {
  const len = x1 - x0;
  if (len <= 0) return;
  const bend = n.bend;
  const px = (cents: number) =>
    Math.min(BEND_MAX_PX, (Math.max(0, cents) / 100) * BEND_PX_PER_SEMITONE);
  const peak = bend ? px(bend.cents) : 0;
  const end = bend && !bend.released ? Math.min(peak, px(bend.current)) : 0;
  const ramp = bend ? Math.min(BEND_RAMP_PX, Math.floor(len / 3)) : 0;
  const fall = bend && peak - end > CURVE_STEP ? ramp : 0;
  const half = thick / 2;
  // A downward bend (a pre-bend released, a dip) mirrors the curve.
  const dir = bend?.direction === "down" ? -1 : 1;

  // Climb, then the fall at the far end (a released bend comes back down).
  for (let bx = 0; bx < ramp; bx += CURVE_STEP) {
    const rise = Math.round(peak * ease((bx + CURVE_STEP) / ramp));
    ctx.fillRect(x0 + bx, y - dir * rise - half, Math.min(CURVE_STEP, ramp - bx), thick);
  }
  for (let bx = 0; bx < fall; bx += CURVE_STEP) {
    const rise = Math.round(peak - (peak - end) * ease((bx + CURVE_STEP) / fall));
    ctx.fillRect(x1 - fall + bx, y - dir * rise - half, Math.min(CURVE_STEP, fall - bx), thick);
  }

  // The held part, at the bend's top.
  const h0 = x0 + ramp;
  const h1 = x1 - fall;
  const hy = y - dir * peak;
  if (h1 > h0) {
    if (n.vibrato.active) {
      const halfCycle = Math.max(8, Math.round(pps / (2 * n.vibrato.rateHz)));
      const amp = Math.round(half);
      for (let bx = h0, k = 0; bx < h1; bx += halfCycle, k++) {
        ctx.fillRect(bx, hy - half + (k % 2 ? amp : -amp), Math.min(halfCycle, h1 - bx), thick);
      }
    } else {
      ctx.fillRect(h0, hy - half, h1 - h0, thick);
    }
  }

  // The bend's label sits on the bar at the top of the climb (above it, it
  // would run into the chord strip).
  if (bend) {
    const fill = ctx.fillStyle;
    const label = (dir < 0 ? "↓" : "") + bendAmount(bend.cents);
    ctx.font = `24px ${theme.fonts.hero}`;
    ctx.textAlign = "center";
    const w = Math.round(ctx.measureText(label).width) + 10;
    const lx = Math.min(x0 + ramp, x1 - w);
    ctx.fillStyle = theme.night;
    ctx.fillRect(lx, hy - 11, w, 22);
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2;
    ctx.strokeRect(lx + 1, hy - 10, w - 2, 20);
    ctx.fillStyle = theme.ink;
    ctx.fillText(label, lx + w / 2, hy + 1);
    ctx.fillStyle = fill;
  }
}

export function GuitarTimeline({
  signals,
  width,
  height,
  view = "tab",
  labels = "frets",
  chords = true,
  tempo: showTempo = true,
  notation = "fr",
  theme = STAGE_THEME,
}: GuitarTimelineProps) {
  const state = useRef<TimelineState | null>(null);

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    state.current ??= {
      placer: new FretPlacer(),
      placed: new Map(),
      staffed: new Map(),
      keyId: "",
      quietSince: null,
      pxPerSecond: FREE_PX_PER_S,
    };
    const st = state.current;
    const now = f.now;
    const W = f.width;
    const H = f.height;
    const key = s.key.key;
    const staff = view === "staff";

    // A new key: start the reading in its pentatonic box (old pills keep their place).
    const id = keyId(key);
    if (id !== st.keyId) {
      st.keyId = id;
      if (key) st.placer.startInKey(key.tonic);
    }

    // Silence dims the lane: strings at 50 % after 2 s, everything at 35 % after 10 s.
    if (s.notesLevel.open || s.harmonyLevel.open) st.quietSince = null;
    else st.quietSince ??= now;
    const quiet = st.quietSince === null ? 0 : now - st.quietSince;
    const laneAlpha = quiet > 10 ? 0.35 : 1;
    const stringAlpha = quiet > 2 ? 0.5 : 1;

    // Scroll speed follows the tempo (eased, so a tempo change does not jerk).
    const beat = s.beatAt(now);
    const bpm = beat ? 60 / beat.period : null;
    const target = bpm ? ((bpm > 140 ? BEAT_PX / 2 : BEAT_PX) * bpm) / 60 : FREE_PX_PER_S;
    st.pxPerSecond += (target - st.pxPerSecond) * Math.min(1, f.dt * 2);
    const pps = st.pxPerSecond;
    const nowX = W - NOW_FROM_RIGHT;
    const xAt = (t: number) => Math.round(nowX - (now - t) * pps);
    const oldest = now - (nowX - LEFT) / pps;

    // Vertical layout. Tab: six strings. Staff: room for two ledger lines
    // above and below, the gap fitted to the height.
    const stripH = chords ? STRIP : 0;
    const top = stripH + 14;
    const rowY = (string: number) => top + (5 - string) * STRING_GAP;
    const gap = Math.max(
      STAFF_GAP_MIN,
      Math.min(STAFF_GAP_MAX, Math.floor((H - stripH - 24) / 10)),
    );
    const topLine = stripH + 6 + 3 * gap;
    const bottomLine = topLine + 4 * gap;
    const posY = (pos: number) => Math.round(bottomLine - (pos * gap) / 2);
    /** Lowest drawn line (bottom string or staff line) and the lane's top and bottom marks. */
    const bottom = staff ? bottomLine : rowY(0);
    const laneTop = staff ? topLine - 10 : rowY(5) - 10;
    const tickY = staff ? bottomLine + 3 * gap : bottom + 10;

    ctx.save();
    ctx.globalAlpha = laneAlpha;

    // Plate.
    platePath(ctx, W, H, 8);
    ctx.fillStyle = theme.plate;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.plateBorder;
    ctx.stroke();

    // Staff lines run under the clef, so they are drawn before the clip.
    if (staff) {
      ctx.fillStyle = withAlpha(theme.inkFaint, stringAlpha);
      for (let line = 0; line < 5; line++) ctx.fillRect(8, topLine + line * gap - 1, W - 12, 2);
    }

    // Clip the scrolling content to the lane.
    ctx.save();
    ctx.beginPath();
    ctx.rect(LEFT, 4, W - LEFT - 4, H - 8);
    ctx.clip();

    // Chord strip and change lines.
    const history = s.chord.history;
    if (chords) {
      ctx.font = `24px ${theme.fonts.hero}`;
      ctx.textBaseline = "middle";
      for (const seg of history) {
        const end = seg === history[history.length - 1] ? now : seg.end;
        if (end < oldest) continue;
        const x0 = xAt(seg.start);
        const x1 = Math.max(x0 + 8, xAt(end) - 4);
        ctx.fillStyle = theme.pitch[seg.chord.root];
        ctx.fillRect(x0, 8, x1 - x0, STRIP - 12);
        const name = chordName(seg.chord.root, seg.chord.quality, notation);
        if (x1 - Math.max(x0, LEFT) >= name.length * 12 + 12) {
          ctx.fillStyle = theme.pitchOn;
          // A block that started off the left edge keeps its name visible.
          ctx.fillText(name, Math.max(x0, LEFT) + 6, 8 + (STRIP - 12) / 2);
          if (key) {
            const deg = chordDegree(seg.chord.root, seg.chord.quality, key.tonic, key.mode);
            const w = ctx.measureText(deg.numeral).width;
            if (x1 - x0 >= name.length * 12 + w + 24)
              ctx.fillText(deg.numeral, x1 - w - 6, 8 + (STRIP - 12) / 2);
          }
        }
        ctx.fillStyle = withAlpha(theme.pitchBright[seg.chord.root], 0.3);
        ctx.fillRect(x0, stripH, 4, bottom - stripH + 12);
      }
    }

    // Strings.
    if (!staff) {
      ctx.fillStyle = withAlpha(theme.plateBorder, stringAlpha);
      for (let string = 0; string < 6; string++) ctx.fillRect(LEFT, rowY(string) - 2, W - LEFT, 4);
    }

    // Beat ticks under the lane.
    if (beat) {
      const firstBeat = now - beat.phase * beat.period;
      for (let k = 0, t = firstBeat; t >= oldest; k++, t = firstBeat - k * beat.period) {
        const downbeat = (((beat.beatInBar - k) % 4) + 4) % 4 === 0;
        ctx.fillStyle = downbeat ? theme.inkMuted : theme.plateBorder;
        ctx.fillRect(xAt(t) - 2, tickY, 4, downbeat ? 12 : 8);
      }
    }

    // Strum marks: attacks with no note starting with them.
    const notes = s.notes;
    for (const o of s.onsets) {
      if (o.time < oldest) continue;
      const owned = notes.some(
        (n) => n.start > o.time - OWN_BEFORE && n.start < o.time + OWN_AFTER,
      );
      if (owned || now - o.time < OWN_AFTER) continue;
      ctx.fillStyle = withAlpha(theme.ink, 0.45);
      ctx.fillRect(xAt(o.time) - 4, laneTop, 8, bottom - laneTop + 10);
    }

    // Place new notes oldest first, so the hand position follows the line in
    // playing order. A note is placed once it has lasted long enough not to
    // be a glitch the segmenter may still drop.
    const flats = usesFlats(key);
    for (const n of notes) {
      if (st.placed.has(n.start)) continue;
      if (n.open && now - n.start < MIN_PLACE_SECONDS) break;
      st.placed.set(n.start, st.placer.place(n.midi));
      st.staffed.set(n.start, staffNote(n.midi, flats));
    }

    /** How the note reads in the music: CHORD_TONE and IN_KEY flags. */
    const role = (n: NoteSegment) => {
      const pc = n.midi % 12;
      const chord = chordAt(history, n.start)?.chord ?? null;
      const chordTone =
        chord !== null &&
        CHORD_QUALITY_INTERVALS[chord.quality].some((iv) => (chord.root + iv) % 12 === pc);
      const inKey = key ? scaleDegree(pc, key.tonic, key.mode) !== null : true;
      return (chordTone ? CHORD_TONE : 0) | (inKey ? IN_KEY : 0);
    };

    // Draw newest first, so an older note that would sit under a newer one
    // shrinks (tab: to a tick on its string; staff: its bar stops short).
    ctx.textBaseline = "middle";
    if (!staff) {
      const nextOnString = new Array<number>(6).fill(Infinity);
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        const end = n.open ? now : n.end;
        if (end < oldest) break;
        const pos = st.placed.get(n.start);
        if (!pos) continue;
        const pc = n.midi % 12;
        const y = rowY(pos.string);
        const x0 = xAt(n.start);
        const x1 = xAt(end);
        const label = labels === "names" ? noteName(pc, notation) : String(pos.fret);
        ctx.font = `28px ${theme.fonts.hero}`;
        const pillW = Math.max(28, Math.round(ctx.measureText(label).width) + 12);
        const r = role(n);

        if (x1 > x0 + pillW) {
          ctx.fillStyle = withAlpha(theme.pitchBright[pc], 0.6);
          heldBar(ctx, n, x0 + pillW, Math.min(x1, nextOnString[pos.string]), y, 8, pps, theme);
        }
        if (x0 + pillW > nextOnString[pos.string]) {
          ctx.fillStyle = theme.pitchBright[pc];
          ctx.fillRect(x0, y - PILL_H / 2, 8, PILL_H);
        } else {
          const py = y - PILL_H / 2;
          if (r & CHORD_TONE) {
            ctx.fillStyle = theme.pitch[pc];
            ctx.fillRect(x0, py, pillW, PILL_H);
          } else {
            ctx.fillStyle = theme.night;
            ctx.fillRect(x0, py, pillW, PILL_H);
            ctx.strokeStyle = theme.pitchBright[pc];
            ctx.lineWidth = 4;
            ctx.strokeRect(x0 + 2, py + 2, pillW - 4, PILL_H - 4);
          }
          if (!(r & IN_KEY)) cutCorner(ctx, x0 + pillW, py, theme);
          ctx.textAlign = "center";
          ctx.fillStyle = r & CHORD_TONE ? theme.pitchOn : theme.ink;
          ctx.fillText(label, x0 + pillW / 2, y + 1);
        }
        nextOnString[pos.string] = x0;
      }
    } else {
      const headW = Math.round(gap * 1.5);
      const headH = Math.max(12, gap);
      const lineColour = withAlpha(theme.inkFaint, stringAlpha);
      let next = Infinity;
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        const end = n.open ? now : n.end;
        if (end < oldest) break;
        const sn = st.staffed.get(n.start);
        if (!sn) continue;
        const pc = n.midi % 12;
        const y = posY(sn.pos);
        const x0 = xAt(n.start);
        const x1 = xAt(end);
        const r = role(n);

        // Ledger lines, out from the staff.
        const ledgers = ledgerCount(sn.pos);
        ctx.fillStyle = lineColour;
        for (let k = 1; k <= Math.abs(ledgers); k++) {
          const ly = ledgers > 0 ? posY(TOP_LINE_POS + 2 * k) : posY(-2 * k);
          ctx.fillRect(x0 - 5, ly - 1, headW + 10, 2);
        }

        // With labels="names" the head is a pill holding the spelled name
        // (accidental included), at the note's staff position.
        const named = labels === "names";
        let nameW = 0;
        let name = "";
        if (named) {
          name = spelledName(sn, notation);
          ctx.font = `22px ${theme.fonts.hero}`;
          nameW = Math.max(headW + 8, Math.round(ctx.measureText(name).width) + 12);
        }
        const barStart = x0 + (named ? nameW : headW) + 2;
        if (x1 > barStart) {
          ctx.fillStyle = withAlpha(theme.pitchBright[pc], 0.6);
          heldBar(ctx, n, barStart, Math.min(x1, next - 2), y, 6, pps, theme);
        }
        if (named) {
          const pillH = Math.max(20, Math.round(gap * 1.6));
          const py = y - pillH / 2;
          if (r & CHORD_TONE) {
            ctx.fillStyle = theme.pitch[pc];
            ctx.fillRect(x0, py, nameW, pillH);
          } else {
            ctx.fillStyle = theme.night;
            ctx.fillRect(x0, py, nameW, pillH);
            ctx.strokeStyle = theme.pitchBright[pc];
            ctx.lineWidth = 3;
            ctx.strokeRect(x0 + 1.5, py + 1.5, nameW - 3, pillH - 3);
          }
          if (!(r & IN_KEY)) cutCorner(ctx, x0 + nameW, py, theme);
          ctx.textAlign = "center";
          ctx.fillStyle = r & CHORD_TONE ? theme.pitchOn : theme.ink;
          ctx.fillText(name, x0 + nameW / 2, y + 1);
          if (sn.shift !== 0) {
            ctx.font = `16px ${theme.fonts.hero}`;
            ctx.textAlign = "left";
            ctx.fillStyle = theme.inkMuted;
            ctx.fillText(sn.shift < 0 ? "8va" : "8vb", x0, sn.shift < 0 ? py - 8 : py + pillH + 8);
          }
          next = x0;
          continue;
        }

        // Head: filled chord tone, outlined scale note, cut corner out of key.
        ctx.fillStyle = r & CHORD_TONE ? theme.pitch[pc] : theme.pitchBright[pc];
        pixelOval(ctx, x0, y, headW, headH);
        if (!(r & CHORD_TONE)) {
          ctx.fillStyle = theme.night;
          pixelOval(ctx, x0 + 3, y, headW - 6, headH - 6);
        }
        if (!(r & IN_KEY)) cutCorner(ctx, x0 + headW, y - headH / 2, theme);

        // Accidental before the head, octave mark above or below it.
        if (sn.accidental !== 0) {
          ctx.font = `${Math.round(gap * 1.7)}px ${CLEF_FONT}`;
          ctx.textAlign = "right";
          ctx.fillStyle = theme.pitchBright[pc];
          ctx.fillText(sn.accidental > 0 ? "♯" : "♭", x0 - 2, y + 1);
        }
        if (sn.shift !== 0) {
          ctx.font = `18px ${theme.fonts.hero}`;
          ctx.textAlign = "left";
          ctx.fillStyle = theme.inkMuted;
          const my = sn.shift < 0 ? y - headH / 2 - 8 : y + headH / 2 + 8;
          ctx.fillText(sn.shift < 0 ? "8va" : "8vb", x0, my);
        }
        next = x0;
      }
    }
    ctx.restore();

    // Clef or string names, the "now" line and the last note's name.
    ctx.textBaseline = "middle";
    if (staff) {
      ctx.fillStyle = withAlpha(theme.ink, stringAlpha);
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `${Math.round(gap * 5.2)}px ${CLEF_FONT}`;
      ctx.fillText("𝄞", 28, bottomLine + Math.round(gap * 1.1));
      ctx.textBaseline = "middle";
      ctx.font = `22px ${theme.fonts.hero}`;
      ctx.fillText("8", 28, bottomLine + Math.round(gap * 3.1));
    } else {
      ctx.textAlign = "left";
      ctx.font = `16px ${theme.fonts.label}`;
      ctx.fillStyle = withAlpha(theme.inkMuted, stringAlpha);
      for (let string = 0; string < 6; string++) {
        ctx.fillText(STRING_NAMES[string], 16, rowY(string) + 1);
      }
    }
    ctx.textAlign = "left";
    ctx.fillStyle = theme.ink;
    ctx.fillRect(nowX - 2, stripH + 4, 4, tickY - stripH + 12);

    // Tempo, discreet, just above the staff (or the strings) past the now
    // line: the smoothed BPM and four pips beating the bar.
    if (showTempo && s.tempo && s.tempo.confidence >= 0.3) {
      const ty = (staff ? posY(TOP_LINE_POS) : rowY(5)) - 16;
      ctx.font = `18px ${theme.fonts.mono}`;
      ctx.fillStyle = theme.inkMuted;
      ctx.fillText(`♩ ${Math.round(s.tempo.bpm)}`, nowX + 16, ty);
      const pipX =
        nowX + 16 + Math.round(ctx.measureText(`♩ ${Math.round(s.tempo.bpm)}`).width) + 10;
      for (let b = 0; b < 4; b++) {
        const on = beat !== null && beat.beatInBar === b && beat.phase < 0.35;
        ctx.fillStyle = on ? (b === 0 ? theme.major : theme.ink) : theme.shadeLine;
        ctx.fillRect(pipX + b * 12, ty - 4, 8, 8);
      }
    }

    const last = notes[notes.length - 1];
    if (last && (last.open || now - last.end < 1.5)) {
      const pc = last.midi % 12;
      const octave = Math.floor(last.midi / 12) - 1;
      const sn = staff ? st.staffed.get(last.start) : undefined;
      const name = sn ? spelledName(sn, notation) : noteName(pc, notation);
      ctx.font = `32px ${theme.fonts.hero}`;
      ctx.fillStyle = theme.pitchBright[pc];
      ctx.globalAlpha = laneAlpha * (last.open ? 1 : 0.5);
      ctx.fillText(`${name}${octave}`, nowX + 16, staff ? posY(5) : rowY(3));
      const pos = st.placed.get(last.start);
      const bend = last.bend;
      ctx.font = `16px ${theme.fonts.label}`;
      if (bend) {
        ctx.fillStyle = theme.ink;
        ctx.fillText(`BEND ${bendAmount(bend.cents)}`, nowX + 16, staff ? posY(1) : rowY(1));
      } else if (pos && labels === "frets" && !staff) {
        ctx.fillStyle = theme.major;
        ctx.fillText(`${notation === "fr" ? "CASE" : "FRET"} ${pos.fret}`, nowX + 16, rowY(1));
      }
    }
    ctx.restore();

    // Forget placements that scrolled out.
    if (st.placed.size > 128) {
      for (const start of st.placed.keys()) {
        if (start < oldest - 5) {
          st.placed.delete(start);
          st.staffed.delete(start);
        }
      }
    }
  };

  return <StageCanvas width={width} height={height} draw={draw} label="Guitar timeline" />;
}
