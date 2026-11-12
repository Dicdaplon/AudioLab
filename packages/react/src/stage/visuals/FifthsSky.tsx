"use client";

/**
 * Sky of fifths: the night above the wolf's city, read as harmony.
 *
 * Twelve bright anchor stars form an arch in circle-of-fifths order, the
 * song's tonic at the top (the arch turns when the key changes, like the
 * mandala). The chord sounding is drawn as a constellation joining its
 * notes' stars: a major triad and a minor triad are mirror shapes, a seventh
 * chord adds a fourth star, and a cadence V → I visibly slides one step
 * along the arch. Notes outside the key are dim stars.
 *
 * Behind, a field of small stars, each belonging to a pitch class, glows in
 * that note's colour as it builds up over the last 8 s: the sky slowly takes
 * the colours of the song. An attack makes a few stars of the note played
 * flare; a change to another chord sends a shooting star in the new root's
 * colour (at most once every 2 s).
 */

import { useRef, type RefObject } from "react";

import { CHORD_QUALITY_INTERVALS, fifthsIndex, keyPitchClasses } from "@audiolab/core";

import { approach, outlinedText, peakOf } from "../draw";
import { noteName, type Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface FifthsSkyProps {
  signals: RefObject<StageSignals | null>;
  /** CSS size. */
  width: number;
  height: number;
  /** Cell size. Default 4. */
  pixel?: number;
  /** Note names under the anchor stars. Default true. */
  labels?: boolean;
  notation?: Notation;
  theme?: StageTheme;
}

/** Angle between two neighbours on the arch. */
const STEP = (14 * Math.PI) / 180;
const FLARE = 0.4;
const SHOOT = 0.7;
const SHOOT_GAP = 2;
const SHOOT_SPEED = 110;

interface SkyState {
  w: number;
  h: number;
  starX: Int16Array;
  starY: Int16Array;
  starPc: Uint8Array;
  flareAt: Float64Array;
  /** Star indices grouped by pitch class (for flares). */
  byPc: number[][];
  flareCursor: Uint8Array;
  /** Slot of each pitch class on the arch (0 = top, ±1 = a fifth away). */
  slot: Float32Array;
  /** Arch rotation, in fifths: glides to the tonic's fifths index the short way round. */
  rotation: number;
  anchorX: Float32Array;
  anchorY: Float32Array;
  /** Tonic the arch follows: the settled key (the first hesitant one until then). */
  tonic: number | null;
  lastCount: number;
  lastChange: number | null;
  lastRoot: number | null;
  shootAt: number;
  shootX: number;
  shootY: number;
  shootPc: number;
  seed: number;
}

function random(st: SkyState): number {
  st.seed = (st.seed * 1664525 + 1013904223) >>> 0;
  return st.seed / 4294967296;
}

/** Wrap to [-6, 6). */
function wrap12(x: number): number {
  const d = (((x + 6) % 12) + 12) % 12;
  return d - 6;
}

/** Dotted pixel line: one cell every other cell (8/8 px dashes at the default cell). */
function dotted(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i += 2) {
    const t = n === 0 ? 0 : i / n;
    ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1);
  }
}

/** Pixel star: a 2 × 2 core and arms of `arm` cells (one cell thick). */
function star(ctx: CanvasRenderingContext2D, x: number, y: number, arm: number): void {
  ctx.fillRect(x, y, 2, 2);
  if (arm > 0) {
    ctx.fillRect(x - arm, y, arm, 2);
    ctx.fillRect(x + 2, y, arm, 2);
    ctx.fillRect(x, y - arm, 2, arm);
    ctx.fillRect(x, y + 2, 2, arm);
  }
}

export function FifthsSky({
  signals,
  width,
  height,
  pixel = 4,
  labels = true,
  notation = "fr",
  theme = STAGE_THEME,
}: FifthsSkyProps) {
  const state = useRef<SkyState | null>(null);

  const ensure = (w: number, h: number): SkyState => {
    const old = state.current;
    if (old && old.w === w && old.h === h) return old;
    const count = Math.min(180, Math.round((w * h) / 260));
    const st: SkyState = {
      w,
      h,
      starX: new Int16Array(count),
      starY: new Int16Array(count),
      starPc: new Uint8Array(count),
      flareAt: new Float64Array(count).fill(-Infinity),
      byPc: Array.from({ length: 12 }, () => []),
      flareCursor: new Uint8Array(12),
      slot: new Float32Array(12),
      rotation: 0,
      anchorX: new Float32Array(12),
      anchorY: new Float32Array(12),
      tonic: null,
      lastCount: -1,
      lastChange: null,
      lastRoot: null,
      shootAt: -Infinity,
      shootX: 0,
      shootY: 0,
      shootPc: 0,
      seed: 0x5ca1ab1e,
    };
    for (let i = 0; i < count; i++) {
      st.starX[i] = 2 + Math.floor(random(st) * (w - 4));
      st.starY[i] = 2 + Math.floor(random(st) * (h - 4));
      st.starPc[i] = Math.floor(random(st) * 12);
      st.byPc[st.starPc[i]].push(i);
    }
    state.current = st;
    return st;
  };

  const drawSky = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const W = f.width;
    const H = f.height;
    const st = ensure(W, H);
    const now = f.now;
    const key = s.key.key;
    // The arch turns only for a settled key, so a hesitant reading does not swing it.
    if (key && (s.key.phase === "settled" || st.tonic === null)) st.tonic = key.tonic;
    const inKey = key ? keyPitchClasses(key.tonic, key.mode) : null;

    // Arch: the rotation glides to the key; a note crossing the far end jumps across.
    const cx = W / 2;
    const cy = H * 0.98;
    const rx = W * 0.42;
    const ry = H * 0.8;
    const k = approach(f.dt, 0.5);
    st.rotation += wrap12(fifthsIndex(st.tonic ?? 0) - st.rotation) * k;
    for (let pc = 0; pc < 12; pc++) {
      st.slot[pc] = -wrap12(st.rotation - fifthsIndex(pc));
      const a = -Math.PI / 2 + st.slot[pc] * STEP;
      st.anchorX[pc] = Math.round(cx + rx * Math.cos(a)) - 1;
      st.anchorY[pc] = Math.round(cy + ry * Math.sin(a)) - 1;
    }

    // Attacks: up to three stars of the note played flare.
    if (st.lastCount < 0) st.lastCount = s.onsetCount;
    const fresh = Math.min(s.onsetCount - st.lastCount, s.onsets.length);
    for (let j = s.onsets.length - fresh; j < s.onsets.length; j++) {
      const pc = s.onsets[j].pitchClass;
      if (pc === null) continue;
      const list = st.byPc[pc];
      for (let n = 0; n < Math.min(3, list.length); n++) {
        st.flareAt[list[st.flareCursor[pc] % list.length]] = now;
        st.flareCursor[pc] = (st.flareCursor[pc] + 1) % 251;
      }
    }
    st.lastCount = s.onsetCount;

    // Chord change to another root: a shooting star.
    const chord = s.chord.current && !s.chord.silent ? s.chord.current : null;
    if (s.chordChangedAt !== st.lastChange) {
      st.lastChange = s.chordChangedAt;
      if (chord && chord.root !== st.lastRoot && now - st.shootAt >= SHOOT_GAP) {
        st.shootAt = now;
        st.shootX = Math.floor(W * (0.08 + random(st) * 0.5));
        st.shootY = Math.floor(H * (0.04 + random(st) * 0.2));
        st.shootPc = chord.root;
      }
      st.lastRoot = chord?.root ?? st.lastRoot;
    }

    // Background stars: brightness from the 8 s chroma, in 4 hard steps.
    const live = s.chroma.live;
    const livePeak = peakOf(live) || 1;
    for (let i = 0; i < st.starX.length; i++) {
      const pc = st.starPc[i];
      const level = Math.min(3, Math.floor((live[pc] / livePeak) * 4));
      const flare = now - st.flareAt[i];
      const flaring = flare >= 0 && flare < FLARE;
      ctx.fillStyle = level >= 2 || flaring ? theme.pitchBright[pc] : theme.ink;
      ctx.globalAlpha = flaring ? 1 : [0.16, 0.3, 0.55, 0.85][level];
      star(ctx, st.starX[i], st.starY[i], flaring ? (flare < FLARE / 2 ? 2 : 1) : 0);
    }
    ctx.globalAlpha = 1;

    // Shooting star: a head and a stepped trail, along a shallow diagonal.
    const shoot = now - st.shootAt;
    if (shoot >= 0 && shoot < SHOOT) {
      const d = (shoot * SHOOT_SPEED) / pixel;
      ctx.fillStyle = theme.pitchBright[st.shootPc];
      for (let t = 0; t < 4; t++) {
        const back = d - t * 3;
        if (back < 0) break;
        ctx.globalAlpha = (t === 0 ? 1 : 0.6 - t * 0.15) * (shoot > SHOOT - 0.15 ? 0.5 : 1);
        ctx.fillRect(
          Math.round(st.shootX + back),
          Math.round(st.shootY + back * 0.4),
          t === 0 ? 2 : 3,
          t === 0 ? 2 : 1,
        );
      }
      ctx.globalAlpha = 1;
    }

    // Constellation of the chord, its notes joined in fifths order.
    let tones: number[] = [];
    if (chord) {
      tones = CHORD_QUALITY_INTERVALS[chord.quality].map((i) => (chord.root + i) % 12);
      tones.sort((a, b) => st.slot[a] - st.slot[b]);
      ctx.fillStyle = withAlpha(theme.pitchBright[chord.root], 0.8);
      for (let i = 0; i < tones.length; i++) {
        const a = tones[i];
        const b = tones[(i + 1) % tones.length];
        dotted(ctx, st.anchorX[a] + 1, st.anchorY[a] + 1, st.anchorX[b] + 1, st.anchorY[b] + 1);
      }
    }

    // Anchor stars: arms grow with the 1 s chroma; chord notes get a halo.
    const now1 = s.chroma.chord;
    const peak1 = peakOf(now1) || 1;
    for (let pc = 0; pc < 12; pc++) {
      const x = st.anchorX[pc];
      const y = st.anchorY[pc];
      const colour = theme.pitchBright[pc];
      if (tones.includes(pc)) {
        ctx.fillStyle = withAlpha(colour, 0.12);
        ctx.fillRect(x - 4, y - 4, 10, 10);
        ctx.fillStyle = withAlpha(colour, 0.25);
        ctx.fillRect(x - 2, y - 2, 6, 6);
      }
      const arm = 1 + Math.min(2, Math.floor((now1[pc] / peak1) * 3));
      ctx.globalAlpha = !inKey || inKey.includes(pc) ? 1 : 0.4;
      ctx.fillStyle = theme.night;
      star(ctx, x - 1, y - 1, arm);
      star(ctx, x + 1, y + 1, arm);
      ctx.fillStyle = colour;
      star(ctx, x, y, arm);
      ctx.globalAlpha = 1;
    }
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    const st = state.current;
    if (!s || !st) return;
    const key = s.key.key;
    const inKey = key ? keyPitchClasses(key.tonic, key.mode) : null;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let pc = 0; pc < 12; pc++) {
      const x = (st.anchorX[pc] + 1) * pixel;
      const y = (st.anchorY[pc] + 6) * pixel;
      if (y + 16 > f.height) continue;
      const fill =
        key && pc === key.tonic
          ? theme.pitchBright[pc]
          : !inKey || inKey.includes(pc)
            ? theme.ink
            : theme.inkFaint;
      outlinedText(ctx, noteName(pc, notation), x, y, 16, theme.fonts.label, fill);
    }
  };

  return (
    <div style={{ position: "relative", width, height }}>
      <StageCanvas width={width} height={height} pixel={pixel} draw={drawSky} />
      {labels && (
        <StageCanvas
          width={width}
          height={height}
          draw={drawLabels}
          style={{ position: "absolute", inset: 0 }}
        />
      )}
    </div>
  );
}
