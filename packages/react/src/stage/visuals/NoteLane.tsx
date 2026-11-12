"use client";

/**
 * Note lane, a piano roll that flows from right to left: every played note
 * is a block at the height of its semitone, as long as it was held, in the
 * colour of its pitch class. Notes enter at the playhead (85 % of the width,
 * with the current note's name) and scroll away at 120 px/s.
 *
 * The lanes teach the scale: the key's seven degrees are darker stripes, the
 * tonic's stripe is tinted with its colour, and the current chord's tones
 * get a bright marker on the left edge, so a learner sees which notes "fit"
 * before playing them. A block sits off-centre in its lane by its cents
 * (a sharp note floats up); a note outside the key is drawn hollow.
 *
 * The view spans two octaves centred on the median of the last 20 s of
 * notes, and glides (≈ 1 s) when the player moves up or down the neck.
 */

import { useRef, type RefObject } from "react";

import { CHORD_QUALITY_INTERVALS, keyPitchClasses } from "@audiolab/core";

import { approach, outlinedText } from "../draw";
import { noteName, type Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface NoteLaneProps {
  signals: RefObject<StageSignals | null>;
  /** CSS size of the lane (e.g. 1248×200 under the webcam). */
  width: number;
  height: number;
  notation?: Notation;
  theme?: StageTheme;
}

const SPEED = 120;
const PLAYHEAD = 0.85;
const SPAN = 24;
const MIN_CLARITY = 0.6;
/** A dropout shorter than this does not end the note (trackers flicker). */
const HOLD_GAP = 0.09;
const MEDIAN_SECONDS = 20;
const MAX_SEGMENTS = 96;
const BORDER = 4;

interface Segment {
  start: number;
  end: number;
  midi: number;
  /** Smoothed cents offset while held. */
  cents: number;
}

interface LaneState {
  segments: Segment[];
  /** Ring-buffer write index and count. */
  head: number;
  count: number;
  /** Index of the open (sounding) segment, or −1. */
  open: number;
  lastSeen: number;
  centre: number | null;
  sorted: Float64Array;
  keyTonic: number;
  keyMode: string;
  scaleMask: number;
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

export function NoteLane({
  signals,
  width,
  height,
  notation = "en",
  theme = STAGE_THEME,
}: NoteLaneProps) {
  const state = useRef<LaneState>({
    segments: Array.from({ length: MAX_SEGMENTS }, () => ({ start: 0, end: 0, midi: 0, cents: 0 })),
    head: 0,
    count: 0,
    open: -1,
    lastSeen: 0,
    centre: null,
    sorted: new Float64Array(MAX_SEGMENTS),
    keyTonic: -1,
    keyMode: "",
    scaleMask: 0,
  });

  const record = (s: StageSignals, now: number) => {
    const st = state.current;
    const note = s.note;
    const heard = note && note.clarity >= MIN_CLARITY && s.levelDb > -95 ? note : null;
    const open = st.open >= 0 ? st.segments[st.open] : null;
    if (heard) {
      if (open && open.midi === heard.midi) {
        open.end = now;
        open.cents += (heard.cents - open.cents) * 0.2;
      } else {
        if (open) open.end = Math.min(open.end, now);
        const seg = st.segments[st.head];
        seg.start = now;
        seg.end = now;
        seg.midi = heard.midi;
        seg.cents = heard.cents;
        st.open = st.head;
        st.head = (st.head + 1) % MAX_SEGMENTS;
        st.count = Math.min(MAX_SEGMENTS, st.count + 1);
      }
      st.lastSeen = now;
    } else if (open && now - st.lastSeen > HOLD_GAP) {
      st.open = -1; // its end stays at the last time it was heard
    }
  };

  /** Median MIDI note of the segments of the last 20 s (insertion sort into a fixed buffer). */
  const median = (now: number): number | null => {
    const st = state.current;
    let n = 0;
    for (let i = 0; i < st.count; i++) {
      const seg = st.segments[i];
      if (now - seg.end > MEDIAN_SECONDS) continue;
      let j = n++;
      while (j > 0 && st.sorted[j - 1] > seg.midi) {
        st.sorted[j] = st.sorted[j - 1];
        j--;
      }
      st.sorted[j] = seg.midi;
    }
    return n === 0 ? null : st.sorted[n >> 1];
  };

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    const now = f.now;
    record(s, now);

    const target = median(now);
    if (target !== null)
      st.centre =
        st.centre === null ? target : st.centre + (target - st.centre) * approach(f.dt, 0.35);
    const centre = st.centre ?? 60;

    const key = s.key.key;
    if (key && (key.tonic !== st.keyTonic || key.mode !== st.keyMode)) {
      st.keyTonic = key.tonic;
      st.keyMode = key.mode;
      st.scaleMask = 0;
      for (const pc of keyPitchClasses(key.tonic, key.mode)) st.scaleMask |= 1 << pc;
    }
    const scaleMask = key ? st.scaleMask : 0;
    let chordMask = 0;
    const chord = s.chord.current;
    if (chord && !s.chord.silent) {
      for (const i of CHORD_QUALITY_INTERVALS[chord.quality])
        chordMask |= 1 << mod12(chord.root + i);
    }

    const W = f.width;
    const H = f.height;
    const inner = H - 2 * BORDER;
    const laneH = inner / SPAN;
    const midY = H / 2;
    const yOf = (midi: number) => midY - (midi - centre) * laneH;
    const playX = Math.round(W * PLAYHEAD);

    // Plate.
    ctx.fillStyle = theme.plate;
    ctx.fillRect(0, 0, W, H);

    // Lanes, clipped to the plate's inside.
    ctx.save();
    ctx.beginPath();
    ctx.rect(BORDER, BORDER, W - 2 * BORDER, inner);
    ctx.clip();
    const lo = Math.floor(centre - SPAN / 2) - 1;
    const hi = Math.ceil(centre + SPAN / 2) + 1;
    const labelSize = Math.min(24, Math.floor(laneH * 0.9));
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `500 ${labelSize}px ${theme.fonts.mono}`;
    for (let m = lo; m <= hi; m++) {
      const pc = mod12(m);
      const y0 = Math.round(yOf(m) - laneH / 2);
      const y1 = Math.round(yOf(m) + laneH / 2);
      const inScale = (scaleMask >> pc) & 1;
      if (inScale) {
        ctx.fillStyle = pc === key?.tonic ? theme.pitchDark[pc] : theme.shade;
        ctx.fillRect(BORDER, y0 + 1, W - 2 * BORDER, y1 - y0 - 2);
      }
      if ((chordMask >> pc) & 1) {
        ctx.fillStyle = theme.pitchBright[pc];
        ctx.fillRect(BORDER, y0 + 1, 8, y1 - y0 - 2);
      }
    }

    // Notes.
    // Tall lanes keep a gap between neighbours; short ones give the whole lane to the block.
    const blockH = Math.max(4, Math.round(laneH >= 16 ? laneH - 4 : laneH));
    for (let i = 0; i < st.count; i++) {
      const seg = st.segments[i];
      const x1 = Math.round(playX - (now - seg.end) * SPEED);
      if (x1 < 0) continue;
      const x0 = Math.round(playX - (now - seg.start) * SPEED);
      const w = Math.max(4, x1 - x0);
      const pc = mod12(seg.midi);
      const y = Math.round(yOf(seg.midi) - (seg.cents / 100) * laneH - blockH / 2);
      const outside = key && !((scaleMask >> pc) & 1);
      if (outside && w > 8 && blockH > 8) {
        ctx.fillStyle = theme.pitchDark[pc];
        ctx.fillRect(x0, y, w, blockH);
        ctx.strokeStyle = theme.pitchBright[pc];
        ctx.lineWidth = 4;
        ctx.strokeRect(x0 + 2, y + 2, w - 4, blockH - 4);
      } else {
        ctx.fillStyle = theme.pitchBright[pc];
        ctx.fillRect(x0, y, w, blockH);
      }
    }

    // Lane names on the left for the scale (all lanes before a key is known), over the notes.
    if (labelSize >= 12) {
      for (let m = lo; m <= hi; m++) {
        const pc = mod12(m);
        if (key && !((scaleMask >> pc) & 1)) continue;
        const name = noteName(pc, notation);
        const y = Math.round(yOf(m));
        ctx.fillStyle = theme.night;
        ctx.fillRect(
          BORDER + 12,
          y - Math.round(labelSize / 2),
          Math.ceil(ctx.measureText(name).width) + 8,
          labelSize,
        );
        ctx.fillStyle = (chordMask >> pc) & 1 ? theme.ink : theme.inkFaint;
        ctx.fillText(name, BORDER + 16, y);
      }
    }
    ctx.restore();

    // Plate border, then the playhead over everything.
    ctx.strokeStyle = theme.plateBorder;
    ctx.lineWidth = BORDER;
    ctx.strokeRect(BORDER / 2, BORDER / 2, W - BORDER, H - BORDER);
    ctx.fillStyle = theme.ink;
    ctx.fillRect(playX - 2, BORDER, 4, inner);

    const sounding = st.open >= 0 ? st.segments[st.open] : null;
    if (sounding) {
      const pc = mod12(sounding.midi);
      const size = Math.round(Math.min(72, H * 0.36, (W - playX) * 0.45));
      const y = Math.min(
        H - BORDER - size * 0.5,
        Math.max(BORDER + size * 0.5, yOf(sounding.midi)),
      );
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      outlinedText(
        ctx,
        noteName(pc, notation),
        playX + 14,
        y,
        size,
        theme.fonts.hero,
        theme.pitchBright[pc],
        theme.night,
      );
    }
  };

  return <StageCanvas width={width} height={height} draw={draw} />;
}
