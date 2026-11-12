"use client";

/**
 * Chord shockwave: every chord change sends one wave out of the centre, in
 * the colour of the new root, and the chord's name rides the wave front
 * upwards for a moment, so the viewer sees the new chord "burst".
 *
 * The wave's shape doubles the colour: an octagon for a major-sounding
 * chord, a diamond (four sides, like the minor plate's bevel) for a
 * minor-sounding one, dashed for sevenths. Coming home to the tonic chord
 * adds a second, wider, pale wave 120 ms later: the feeling of resolution.
 *
 * Changes are already debounced upstream (≤ 2.5 per second); at most two
 * waves live at once. An optional `clip` rectangle (the webcam) is never
 * drawn into.
 */

import { useRef, type RefObject } from "react";

import type { ChordQuality } from "@audiolab/core";

import { clamp01, easeOut, lerp, outlinedText, polygonPath } from "../draw";
import { chordName, isMinorQuality, type Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface ShockwaveClip {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChordShockwaveProps {
  signals: RefObject<StageSignals | null>;
  /** Canvas size in CSS px; the waves start at its centre. */
  width: number;
  height: number;
  /** Final radius in CSS px. Default: 90 % of the half short side. */
  maxRadius?: number;
  notation?: Notation;
  /** Rectangle (CSS px, canvas coordinates) the waves never cover, e.g. the webcam. */
  clip?: ShockwaveClip;
  /** Cell size of the waves. Default 4. */
  pixel?: number;
  theme?: StageTheme;
}

const MAX_WAVES = 2;
const DURATION = 0.6;
const START_RADIUS = 40;
const LABEL_RIDE = 0.3;
const LABEL_FADE = 0.25;
const ECHO_DELAY = 0.12;

interface Wave {
  alive: boolean;
  t0: number;
  root: number;
  quality: ChordQuality;
  /** The pale "back home" echo. */
  echo: boolean;
}

interface WaveState {
  waves: Wave[];
  /** `chordChangedAt` already handled; undefined before the first frame. */
  seen: number | null | undefined;
}

function isSeventh(q: ChordQuality): boolean {
  return q === "dom7" || q === "maj7" || q === "min7" || q === "min7b5";
}

function spawn(
  st: WaveState,
  t0: number,
  root: number,
  quality: ChordQuality,
  echo: boolean,
): void {
  let slot = st.waves[0];
  for (const w of st.waves) {
    if (!w.alive) {
      slot = w;
      break;
    }
    if (w.t0 < slot.t0) slot = w;
  }
  slot.alive = true;
  slot.t0 = t0;
  slot.root = root;
  slot.quality = quality;
  slot.echo = echo;
}

/** Clip out `clip` (scaled to the buffer) with an even-odd path. */
function clipOut(
  ctx: CanvasRenderingContext2D,
  f: StageFrame,
  clip: ShockwaveClip | undefined,
  scale: number,
): void {
  if (!clip) return;
  ctx.beginPath();
  ctx.rect(0, 0, f.width, f.height);
  ctx.rect(clip.x / scale, clip.y / scale, clip.w / scale, clip.h / scale);
  ctx.clip("evenodd");
}

export function ChordShockwave({
  signals,
  width,
  height,
  maxRadius,
  notation = "en",
  clip,
  pixel = 4,
  theme = STAGE_THEME,
}: ChordShockwaveProps) {
  const state = useRef<WaveState>({
    waves: Array.from({ length: MAX_WAVES }, () => ({
      alive: false,
      t0: 0,
      root: 0,
      quality: "maj",
      echo: false,
    })),
    seen: undefined,
  });
  const rMax = maxRadius ?? 0.9 * (Math.min(width, height) / 2);

  // Detection lives in the wave layer, which runs first (it is mounted first).
  const drawWaves = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    if (st.seen === undefined) {
      st.seen = s.chordChangedAt; // no wave for a change that happened before mounting
    } else if (s.chordChangedAt !== st.seen) {
      st.seen = s.chordChangedAt;
      const c = s.chord.current;
      if (c && s.chordChangedAt !== null) {
        spawn(st, f.now, c.root, c.quality, false);
        const key = s.key.key;
        if (key && c.root === key.tonic) spawn(st, f.now + ECHO_DELAY, c.root, c.quality, true);
      }
    }

    const p = f.pixel;
    const cx = f.width / 2;
    const cy = f.height / 2;
    ctx.save();
    clipOut(ctx, f, clip, p);
    ctx.lineJoin = "miter";
    for (const w of st.waves) {
      if (!w.alive) continue;
      const u = (f.now - w.t0) / DURATION;
      if (u >= 1) {
        w.alive = false;
        continue;
      }
      if (u < 0) continue;
      const e = easeOut(u);
      const r = lerp(START_RADIUS, rMax * (w.echo ? 1.25 : 1), e) / p;
      const minor = isMinorQuality(w.quality);
      // Diamond: vertex up. Octagon: flat top, like the Loupe plates.
      polygonPath(ctx, cx, cy, r, minor ? 4 : 8, minor ? -Math.PI / 2 : Math.PI / 8);
      ctx.lineWidth = Math.max(1, Math.round(lerp(16, 4, e) / p));
      const dash = isSeventh(w.quality) && !w.echo ? Math.round(16 / p) : 0;
      ctx.setLineDash(dash ? [dash, dash] : []);
      const alpha = Math.round((w.echo ? 0.4 : 0.7) * (1 - u) * 20) / 20;
      ctx.strokeStyle = withAlpha(w.echo ? theme.ink : theme.pitchBright[w.root], alpha);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  };

  // The chord name, full resolution, riding the top of the main wave.
  const drawLabel = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const st = state.current;
    ctx.save();
    clipOut(ctx, f, clip, 1);
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (const w of st.waves) {
      if (!w.alive || w.echo) continue;
      const t = f.now - w.t0;
      if (t < 0 || t > LABEL_RIDE + LABEL_FADE) continue;
      const ride = Math.min(t, LABEL_RIDE) / DURATION;
      const r = lerp(START_RADIUS, rMax, easeOut(ride));
      const minor = isMinorQuality(w.quality);
      // Top of the shape: the diamond's vertex, or the octagon's flat side.
      const top = minor ? r : r * Math.cos(Math.PI / 8);
      ctx.globalAlpha = 1 - clamp01((t - LABEL_RIDE) / LABEL_FADE);
      outlinedText(
        ctx,
        chordName(w.root, w.quality, notation),
        f.width / 2,
        f.height / 2 - top - 12,
        64,
        theme.fonts.hero,
        theme.pitchBright[w.root],
        theme.night,
      );
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  return (
    <div style={{ position: "relative", width, height }}>
      <StageCanvas width={width} height={height} pixel={pixel} draw={drawWaves} />
      <StageCanvas
        width={width}
        height={height}
        draw={drawLabel}
        style={{ position: "absolute", inset: 0 }}
      />
    </div>
  );
}
