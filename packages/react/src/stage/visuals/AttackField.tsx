"use client";

/**
 * Attack field: a full-page background layer that answers the strong
 * attacks. A hit throws a sheaf of pixel embers in the colour of the note
 * (or the chord root) from the bottom edge; the harder the hit, relative to
 * the recent attacks, the more embers and the higher they fly. Hits also
 * warm the page's edges with a low, stepped glow in the root's dark tint,
 * never a flash: the glow tops out at 22 % alpha on the borders only and is
 * rate-limited, so it stays far from photosensitive thresholds and the
 * webcam rectangle (`clip`) is always left clear.
 */

import { useRef, type RefObject } from "react";

import { approach } from "../draw";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface AttackFieldProps {
  signals: RefObject<StageSignals | null>;
  width: number;
  height: number;
  /** Rectangle (CSS px, in this canvas) never drawn into, e.g. the webcam. */
  clip?: { x: number; y: number; w: number; h: number };
  /** Cell size. Default 8. */
  pixel?: number;
  theme?: StageTheme;
}

const POOL = 192;
/** An attack counts as strong above this share of the recent strongest. */
const STRONG = 0.55;
/** Edge glow: thickness in cells, peak alpha, at most one swell per this many seconds. */
const GLOW_CELLS = 6;
const GLOW_ALPHA = 0.22;
const GLOW_GAP = 0.4;

interface FieldState {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  born: Float32Array;
  life: Float32Array;
  pc: Int8Array;
  next: number;
  lastCount: number;
  /** Recent strongest attack, decaying, to judge "strong" relative to the player. */
  peak: number;
  glow: number;
  glowPc: number;
  glowAt: number;
}

function makeState(): FieldState {
  return {
    x: new Float32Array(POOL),
    y: new Float32Array(POOL),
    vx: new Float32Array(POOL),
    vy: new Float32Array(POOL),
    born: new Float32Array(POOL).fill(-1e9),
    life: new Float32Array(POOL),
    pc: new Int8Array(POOL),
    next: 0,
    lastCount: 0,
    peak: 0,
    glow: 0,
    glowPc: 0,
    glowAt: -1e9,
  };
}

/** Deterministic hash noise in [0, 1). */
function rand(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function AttackField({
  signals,
  width,
  height,
  clip,
  pixel = 8,
  theme = STAGE_THEME,
}: AttackFieldProps) {
  const state = useRef<FieldState | null>(null);

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    state.current ??= makeState();
    const st = state.current;
    const W = f.width;
    const H = f.height;
    st.peak *= 1 - approach(f.dt, 8);

    // New attacks since the last frame.
    if (s.onsetCount !== st.lastCount) {
      const fresh = Math.min(s.onsetCount - st.lastCount, s.onsets.length);
      st.lastCount = s.onsetCount;
      for (let i = s.onsets.length - fresh; i < s.onsets.length; i++) {
        const o = s.onsets[i];
        st.peak = Math.max(st.peak, o.strength);
        const force = st.peak > 0 ? o.strength / st.peak : 0;
        if (force < STRONG || !s.notesLevel.open) continue;
        const pc = o.pitchClass ?? s.chord.current?.root ?? s.key.key?.tonic ?? 0;
        const count = Math.round(10 + 30 * force);
        const seed = o.time * 1000;
        const originX = W * (0.1 + 0.8 * rand(seed));
        for (let k = 0; k < count; k++) {
          const j = st.next;
          st.next = (st.next + 1) % POOL;
          const a = -Math.PI / 2 + (rand(seed + k * 7.1) - 0.5) * 1.6;
          const speed = H * (0.35 + 0.65 * force) * (0.4 + 0.6 * rand(seed + k * 3.3));
          st.x[j] = originX + (rand(seed + k) - 0.5) * W * 0.08;
          st.y[j] = H - 1;
          st.vx[j] = Math.cos(a) * speed;
          st.vy[j] = Math.sin(a) * speed;
          st.born[j] = f.now;
          st.life[j] = 1.2 + 1.2 * rand(seed + k * 5.7);
          st.pc[j] = pc;
        }
        if (f.now - st.glowAt >= GLOW_GAP) {
          st.glow = Math.max(st.glow, force);
          st.glowPc = pc;
          st.glowAt = f.now;
        }
      }
    }

    // Edge glow, in three hard steps from the border inwards.
    st.glow *= 1 - approach(f.dt, 0.45);
    if (st.glow > 0.02) {
      const tint = theme.pitchBright[st.glowPc];
      for (let step = 0; step < 3; step++) {
        const alpha = GLOW_ALPHA * st.glow * (1 - step / 3);
        const inset = step * (GLOW_CELLS / 3);
        const t = GLOW_CELLS / 3;
        ctx.fillStyle = withAlpha(tint, Math.round(alpha * 20) / 20);
        ctx.fillRect(inset, inset, W - 2 * inset, t);
        ctx.fillRect(inset, H - inset - t, W - 2 * inset, t);
        ctx.fillRect(inset, inset + t, t, H - 2 * inset - 2 * t);
        ctx.fillRect(W - inset - t, inset + t, t, H - 2 * inset - 2 * t);
      }
    }

    // Embers: rise, slow down, fade in four steps.
    const drag = 1 - approach(f.dt, 1.1);
    for (let j = 0; j < POOL; j++) {
      const age = f.now - st.born[j];
      if (age < 0 || age > st.life[j]) continue;
      st.vx[j] *= drag;
      st.vy[j] = st.vy[j] * drag + H * 0.08 * f.dt;
      st.x[j] += st.vx[j] * f.dt;
      st.y[j] += st.vy[j] * f.dt;
      const u = age / st.life[j];
      const alpha = u < 0.5 ? 1 : u < 0.7 ? 0.66 : u < 0.85 ? 0.33 : 0.15;
      const size = age < 0.15 ? 2 : 1;
      ctx.fillStyle = withAlpha(theme.pitchBright[st.pc[j]], alpha);
      ctx.fillRect(Math.round(st.x[j]), Math.round(st.y[j]), size, size);
    }

    // Keep the webcam clear.
    if (clip) {
      const c = f.pixel;
      ctx.clearRect(
        Math.floor(clip.x / c),
        Math.floor(clip.y / c),
        Math.ceil(clip.w / c),
        Math.ceil(clip.h / c),
      );
    }
  };

  return <StageCanvas width={width} height={height} pixel={pixel} draw={draw} />;
}
