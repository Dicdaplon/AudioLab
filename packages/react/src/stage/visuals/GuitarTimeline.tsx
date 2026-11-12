"use client";

/**
 * Guitar timeline: the notes played, as a scrolling tablature. Six strings
 * (high E on top), each note a pill on the string and fret a guitarist would
 * most likely use (`FretPlacer`: the hand stays in a position, the song
 * starts in the key's pentatonic box), scrolling right to left past a "now"
 * line. A chord strip above shares the time axis, so the line reads against
 * its harmony, and a faint line marks each chord change across the strings.
 *
 * Pills say what the note is in the music: filled for a chord tone,
 * outlined for a scale note, outlined with a coral cut corner when outside
 * the key; a held note trails a bar. Attacks without a clear pitch (a
 * strummed chord) draw a strum mark across the strings, which shows the
 * picking hand's rhythm. Beat ticks follow the detected tempo; with no
 * reliable tempo the lane scrolls at a fixed speed without ticks.
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
} from "@audiolab/core";

import { chordName, noteName, type Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface GuitarTimelineProps {
  signals: RefObject<StageSignals | null>;
  width: number;
  height: number;
  /** Pills show the fret ("frets", default) or the note name ("names"). */
  labels?: "frets" | "names";
  /** Chord strip above the strings. Default true. */
  chords?: boolean;
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

interface TimelineState {
  placer: FretPlacer;
  /** Placement of each note, by its start time: assigned once, never moved. */
  placed: Map<number, FretPosition | null>;
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

export function GuitarTimeline({
  signals,
  width,
  height,
  labels = "frets",
  chords = true,
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
      keyId: "",
      quietSince: null,
      pxPerSecond: FREE_PX_PER_S,
    };
    const st = state.current;
    const now = f.now;
    const W = f.width;
    const H = f.height;
    const key = s.key.key;

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

    const stripH = chords ? STRIP : 0;
    const top = stripH + 14;
    const rowY = (string: number) => top + (5 - string) * STRING_GAP;
    const bottom = rowY(0);

    ctx.save();
    ctx.globalAlpha = laneAlpha;

    // Plate.
    platePath(ctx, W, H, 8);
    ctx.fillStyle = theme.plate;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.plateBorder;
    ctx.stroke();

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

    // Strings and their names.
    ctx.fillStyle = withAlpha(theme.plateBorder, stringAlpha);
    for (let string = 0; string < 6; string++) ctx.fillRect(LEFT, rowY(string) - 2, W - LEFT, 4);

    // Beat ticks under the strings.
    if (beat) {
      const firstBeat = now - beat.phase * beat.period;
      for (let k = 0, t = firstBeat; t >= oldest; k++, t = firstBeat - k * beat.period) {
        const downbeat = (((beat.beatInBar - k) % 4) + 4) % 4 === 0;
        ctx.fillStyle = downbeat ? theme.inkMuted : theme.plateBorder;
        ctx.fillRect(xAt(t) - 2, bottom + 10, 4, downbeat ? 12 : 8);
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
      ctx.fillRect(xAt(o.time) - 4, rowY(5) - 10, 8, bottom - rowY(5) + 20);
    }

    // Notes, newest first, so an older pill that would sit under a newer one
    // on the same string shrinks to a tick.
    const nextOnString = new Array<number>(6).fill(Infinity);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `28px ${theme.fonts.hero}`;
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      const end = n.open ? now : n.end;
      if (end < oldest) break;
      if (!st.placed.has(n.start)) st.placed.set(n.start, st.placer.place(n.midi));
      const pos = st.placed.get(n.start);
      if (!pos) continue;
      const pc = n.midi % 12;
      const y = rowY(pos.string);
      const x0 = xAt(n.start);
      const x1 = xAt(end);
      const label = labels === "names" ? noteName(pc, notation) : String(pos.fret);
      const pillW = label.length > 1 ? 40 : 28;
      const chord = chordAt(history, n.start)?.chord ?? null;
      const chordTone =
        chord !== null &&
        CHORD_QUALITY_INTERVALS[chord.quality].some((iv) => (chord.root + iv) % 12 === pc);
      const inKey = key ? scaleDegree(pc, key.tonic, key.mode) !== null : true;

      // Held note: a bar from the pill to the end; with a vibrato, a stepped
      // wave at the vibrato's rate (blocks alternating ±4 px).
      if (x1 > x0 + pillW) {
        const barEnd = Math.min(x1, nextOnString[pos.string]);
        ctx.fillStyle = withAlpha(theme.pitchBright[pc], 0.6);
        if (n.vibrato.active) {
          const halfCycle = Math.max(8, Math.round(pps / (2 * n.vibrato.rateHz)));
          for (let bx = x0 + pillW, k = 0; bx < barEnd; bx += halfCycle, k++) {
            ctx.fillRect(bx, y - 4 + (k % 2 ? 4 : -4), Math.min(halfCycle, barEnd - bx), 8);
          }
        } else {
          ctx.fillRect(x0 + pillW, y - 4, barEnd - x0 - pillW, 8);
        }
      }
      if (x0 + pillW > nextOnString[pos.string]) {
        ctx.fillStyle = theme.pitchBright[pc];
        ctx.fillRect(x0, y - PILL_H / 2, 8, PILL_H);
      } else {
        const px = x0;
        const py = y - PILL_H / 2;
        if (chordTone) {
          ctx.fillStyle = theme.pitch[pc];
          ctx.fillRect(px, py, pillW, PILL_H);
        } else {
          ctx.fillStyle = theme.night;
          ctx.fillRect(px, py, pillW, PILL_H);
          ctx.strokeStyle = theme.pitchBright[pc];
          ctx.lineWidth = 4;
          ctx.strokeRect(px + 2, py + 2, pillW - 4, PILL_H - 4);
        }
        if (!inKey) {
          ctx.fillStyle = theme.bad;
          ctx.beginPath();
          ctx.moveTo(px + pillW - 8, py);
          ctx.lineTo(px + pillW, py);
          ctx.lineTo(px + pillW, py + 8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = chordTone ? theme.pitchOn : theme.ink;
        ctx.fillText(label, px + pillW / 2, y + 1);
      }
      nextOnString[pos.string] = x0;
    }
    ctx.restore();

    // String names, the "now" line and the last note's name.
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `16px ${theme.fonts.label}`;
    for (let string = 0; string < 6; string++) {
      ctx.fillStyle = withAlpha(theme.inkMuted, stringAlpha);
      ctx.fillText(STRING_NAMES[string], 16, rowY(string) + 1);
    }
    ctx.fillStyle = theme.ink;
    ctx.fillRect(nowX - 2, stripH + 4, 4, bottom - stripH + 16);
    const last = notes[notes.length - 1];
    if (last && (last.open || now - last.end < 1.5)) {
      const pc = last.midi % 12;
      const octave = Math.floor(last.midi / 12) - 1;
      ctx.font = `32px ${theme.fonts.hero}`;
      ctx.fillStyle = theme.pitchBright[pc];
      ctx.globalAlpha = laneAlpha * (last.open ? 1 : 0.5);
      ctx.fillText(`${noteName(pc, notation)}${octave}`, nowX + 16, rowY(3));
      const pos = st.placed.get(last.start);
      if (pos && labels === "frets") {
        ctx.font = `16px ${theme.fonts.label}`;
        ctx.fillStyle = theme.major;
        ctx.fillText(`${notation === "fr" ? "CASE" : "FRET"} ${pos.fret}`, nowX + 16, rowY(1));
      }
    }
    ctx.restore();

    // Forget placements that scrolled out.
    if (st.placed.size > 128) {
      for (const start of st.placed.keys()) if (start < oldest - 5) st.placed.delete(start);
    }
  };

  return <StageCanvas width={width} height={height} draw={draw} label="Guitar timeline" />;
}
