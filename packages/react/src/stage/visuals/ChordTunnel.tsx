"use client";

/**
 * Chord tunnel: the harmony as a corridor you travel down, one frame per
 * beat.
 *
 * On every beat a frame appears at the vanishing point and grows outward
 * (exponentially, so the spacing reads as perspective) until it leaves the
 * box about two bars later: the tunnel is the last two bars of the song.
 * - colour: the chord's root (bright pitch colour);
 * - shape: an octagon for a major-sounding chord, a diamond for a minor one
 *   (the same shape code as the chord shock wave), with dashed edges for
 *   sevenths and other four-note chords;
 * - downbeats are drawn thicker, so the bars are counted by eye;
 * - bend: the vanishing point leans towards the chord's root on the circle
 *   of fifths, tonic straight ahead (dominant to the right, subdominant to
 *   the left, as on the FifthsMandala), so a cadence visibly swings the
 *   corridor away and back home.
 * The chord name sits at the vanishing point. Without a confident tempo the
 * frames follow the attacks (at most 2.5 per second).
 *
 * Frames are rasterised into whole cells (square brush, no anti-aliasing);
 * they fade in four steps as they near the edge. Outlines only: the beat
 * never fills the screen.
 */

import { useRef, type RefObject } from "react";

import { CHORD_QUALITY_INTERVALS, fifthsIndex, type ChordQuality } from "@audiolab/core";

import { approach, outlinedText, TAU } from "../draw";
import { chordName, isMinorQuality, type Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface ChordTunnelProps {
  signals: RefObject<StageSignals | null>;
  /** Width and height in CSS px. */
  size: number;
  /** Cell size. Default 4. */
  pixel?: number;
  /** Chord name at the vanishing point. Default true. */
  label?: boolean;
  notation?: Notation;
  theme?: StageTheme;
}

const MAX_FRAMES = 16;
/** Growth per beat: each frame is this much larger than the next newer one. */
const GROWTH = 1.32;
/** Index of the "no chord" colour in the palette (after the 12 pitch classes). */
const NO_CHORD = 12;
const MIN_ONSET_GAP = 0.4;
const SEC = TAU / 12;

interface Frame {
  alive: boolean;
  born: number;
  /** Beat period at birth (s): growth is counted in beats. */
  period: number;
  colour: number;
  sides: 4 | 8;
  dashed: boolean;
  downbeat: boolean;
  /** Vanishing-point offset at birth, in cells. */
  vx: number;
  vy: number;
}

interface TunnelState {
  frames: Frame[];
  lastBeat: number | null;
  lastSpawn: number;
  seenOnsets: number;
  /** Eased vanishing point offset (cells) and the home rotation (tonic at the top). */
  vx: number;
  vy: number;
  alpha: Uint8Array;
  colour: Uint8Array;
  img: ImageData | null;
  palette: Uint8Array;
  paletteTheme: StageTheme | null;
  layer: HTMLCanvasElement | null;
  layerCtx: CanvasRenderingContext2D | null;
}

function sidesOf(quality: ChordQuality): 4 | 8 {
  return isMinorQuality(quality) ? 4 : 8;
}

export function ChordTunnel({
  signals,
  size,
  pixel = 4,
  label = true,
  notation = "en",
  theme = STAGE_THEME,
}: ChordTunnelProps) {
  const state = useRef<TunnelState>({
    frames: Array.from({ length: MAX_FRAMES }, () => ({
      alive: false,
      born: 0,
      period: 0.6,
      colour: NO_CHORD,
      sides: 8 as const,
      dashed: false,
      downbeat: false,
      vx: 0,
      vy: 0,
    })),
    lastBeat: null,
    lastSpawn: -Infinity,
    seenOnsets: 0,
    vx: 0,
    vy: 0,
    alpha: new Uint8Array(0),
    colour: new Uint8Array(0),
    img: null,
    palette: new Uint8Array(13 * 3),
    paletteTheme: null,
    layer: null,
    layerCtx: null,
  });

  const spawn = (s: StageSignals, now: number, period: number, downbeat: boolean) => {
    const st = state.current;
    let slot = st.frames.findIndex((x) => !x.alive);
    if (slot < 0) {
      slot = 0;
      for (let i = 1; i < MAX_FRAMES; i++) if (st.frames[i].born < st.frames[slot].born) slot = i;
    }
    const chord = s.chord.silent ? null : s.chord.current;
    const fr = st.frames[slot];
    fr.alive = true;
    fr.born = now;
    fr.period = period;
    fr.colour = chord ? chord.root : NO_CHORD;
    fr.sides = chord ? sidesOf(chord.quality) : 8;
    fr.dashed = chord ? CHORD_QUALITY_INTERVALS[chord.quality].length > 3 : false;
    fr.downbeat = downbeat;
    fr.vx = st.vx;
    fr.vy = st.vy;
    st.lastSpawn = now;
  };

  /** Cell rasteriser: square brush, the most opaque stamp wins a cell. */
  const stamp = (W: number, H: number, x: number, y: number, b: number, a: number, c: number) => {
    const st = state.current;
    const x0 = Math.round(x - b / 2);
    const y0 = Math.round(y - b / 2);
    for (let j = Math.max(0, y0); j < Math.min(H, y0 + b); j++) {
      for (let i = Math.max(0, x0); i < Math.min(W, x0 + b); i++) {
        const k = j * W + i;
        if (st.alpha[k] < a) {
          st.alpha[k] = a;
          st.colour[k] = c;
        }
      }
    }
  };

  const drawFrames = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    const W = f.width;
    const H = f.height;
    if (!st.img || st.img.width !== W || st.img.height !== H) {
      st.img = ctx.createImageData(W, H);
      st.alpha = new Uint8Array(W * H);
      st.colour = new Uint8Array(W * H);
      st.layer = document.createElement("canvas");
      st.layer.width = W;
      st.layer.height = H;
      st.layerCtx = st.layer.getContext("2d");
    }
    if (st.paletteTheme !== theme) {
      st.paletteTheme = theme;
      [...theme.pitchBright, theme.inkFaint].forEach((hex, i) => {
        const n = parseInt(hex.slice(1, 7), 16);
        st.palette[i * 3] = (n >> 16) & 255;
        st.palette[i * 3 + 1] = (n >> 8) & 255;
        st.palette[i * 3 + 2] = n & 255;
      });
    }

    const cx = W / 2;
    const cy = H / 2;
    const Rmax = Math.min(W, H) / 2 - 1;
    const Rmin = Math.max(3, Math.round(Rmax * 0.08));

    // Vanishing point: leans towards the chord root's fifths direction, tonic straight ahead.
    const chord = s.chord.silent ? null : s.chord.current;
    const key = s.key.key;
    let tx = 0;
    let ty = 0;
    if (chord && key && chord.root !== key.tonic) {
      const a = -Math.PI / 2 + (fifthsIndex(chord.root) - fifthsIndex(key.tonic)) * SEC;
      tx = Math.cos(a) * Rmax * 0.3;
      ty = Math.sin(a) * Rmax * 0.3;
    }
    st.vx += (tx - st.vx) * approach(f.dt, 0.35);
    st.vy += (ty - st.vy) * approach(f.dt, 0.35);

    // One frame per beat (every other beat above 150 BPM); attacks without a tempo.
    const beat = s.beatAt(f.now);
    if (beat) {
      if (st.lastBeat !== null && beat.beat !== st.lastBeat) {
        const half = beat.period < 0.4;
        if (!half || beat.beat % 2 === 0)
          spawn(s, f.now, half ? beat.period * 2 : beat.period, beat.beatInBar === 0);
      }
      st.lastBeat = beat.beat;
      st.seenOnsets = s.onsetCount;
    } else {
      st.lastBeat = null;
      if (s.onsetCount !== st.seenOnsets) {
        st.seenOnsets = s.onsetCount;
        if (f.now - st.lastSpawn >= MIN_ONSET_GAP) spawn(s, f.now, 0.6, false);
      }
    }

    st.alpha.fill(0);
    const lifeBeats = Math.log(Rmax / Rmin) / Math.log(GROWTH);
    for (const fr of st.frames) {
      if (!fr.alive) continue;
      const beats = (f.now - fr.born) / fr.period;
      if (beats > lifeBeats) {
        fr.alive = false;
        continue;
      }
      const r = Rmin * Math.pow(GROWTH, beats);
      const depth = (r - Rmin) / (Rmax - Rmin);
      // Thicker as it comes closer (perspective), and on downbeats; never under one cell.
      const brush = 1 + (depth > 0.35 ? 1 : 0) + (depth > 0.7 ? 1 : 0) + (fr.downbeat ? 1 : 0);
      const alpha = depth < 0.55 ? 255 : depth < 0.75 ? 191 : depth < 0.9 ? 128 : 64;
      // Frames drift back to the axis as they near the viewer: the corridor bends.
      const ox = cx + fr.vx * (1 - depth);
      const oy = cy + fr.vy * (1 - depth);
      const rot = fr.sides === 8 ? Math.PI / 8 : 0;
      for (let e = 0; e < fr.sides; e++) {
        const a0 = rot + (e * TAU) / fr.sides;
        const a1 = rot + ((e + 1) * TAU) / fr.sides;
        const x0 = ox + r * Math.cos(a0);
        const y0 = oy + r * Math.sin(a0);
        const x1 = ox + r * Math.cos(a1);
        const y1 = oy + r * Math.sin(a1);
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
        const dash = Math.max(2, brush * 2);
        for (let k = 0; k <= steps; k++) {
          if (fr.dashed && Math.floor(k / dash) % 2 === 1) continue;
          stamp(
            W,
            H,
            x0 + ((x1 - x0) * k) / steps,
            y0 + ((y1 - y0) * k) / steps,
            brush,
            alpha,
            fr.colour,
          );
        }
      }
    }

    if (st.layerCtx && st.layer) {
      const d = st.img.data;
      const pal = st.palette;
      for (let k = 0, p = 0; k < st.alpha.length; k++, p += 4) {
        const c = st.colour[k] * 3;
        d[p] = pal[c];
        d[p + 1] = pal[c + 1];
        d[p + 2] = pal[c + 2];
        d[p + 3] = st.alpha[k];
      }
      st.layerCtx.putImageData(st.img, 0, 0);
      ctx.drawImage(st.layer, 0, 0);
    }
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const chord = s.chord.silent ? null : s.chord.current;
    const st = state.current;
    const x = f.width / 2 + st.vx * pixel;
    const y = f.height / 2 + st.vy * pixel;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = chord ? chordName(chord.root, chord.quality, notation) : "—";
    const fill = chord ? theme.pitchBright[chord.root] : theme.inkFaint;
    outlinedText(
      ctx,
      text,
      Math.round(x),
      Math.round(y),
      Math.round(size / 6),
      theme.fonts.hero,
      fill,
    );
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <StageCanvas width={size} height={size} pixel={pixel} draw={drawFrames} />
      {label && (
        <StageCanvas
          width={size}
          height={size}
          draw={drawLabel}
          style={{ position: "absolute", inset: 0 }}
        />
      )}
    </div>
  );
}
