"use client";

/**
 * Attacks as wolf tracks. In "paws" mode an invisible wolf walks left to
 * right: every attack is one step, a paw print placed 40 px further on,
 * alternately a little higher and lower (left foot, right foot), on a ground
 * line or on the city's roofs. A harder attack leaves a bigger print; its
 * colour is the note sounding at the attack. Prints stay 1.5 s then fade in
 * four hard steps, so the rhythm of the playing reads as a trail.
 *
 * In "fireflies" mode each attack releases three to six fireflies above the
 * loudest part of the spectrum; they rise, drift, blink once and go out.
 */

import { useRef, type RefObject } from "react";

import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface PawTrailProps {
  signals: RefObject<StageSignals | null>;
  /** CSS size. */
  width: number;
  height: number;
  mode?: "paws" | "fireflies";
  /**
   * Ground under `x` (CSS px from the left), as a y in CSS px from the top:
   * e.g. a `SpectrumCity` roofline. Default: a line 8 px above the bottom.
   */
  ground?: (x: number) => number;
  /** Cell size. Default 4. */
  pixel?: number;
  theme?: StageTheme;
}

/** Distance between two steps, in cells (52 px at the default cell, so the largest prints do not overlap). */
const STRIDE = 13;
const PAW_POOL = 48;
const PAW_SOLID = 1.5;
const PAW_STEP = 0.25;
const MERGE = 0.06;
const FLY_POOL = 96;
const FLY_LIFE = 3;
const LOW_HZ = 70;
const HIGH_HZ = 6000;

interface PawState {
  // Paws (structure of arrays, fixed pool, ring order).
  pawX: Int16Array;
  pawY: Int16Array;
  pawSize: Uint8Array;
  pawPc: Int8Array;
  pawAt: Float64Array;
  pawStrength: Float32Array;
  pawNext: number;
  stepX: number;
  stepUp: boolean;
  // Fireflies.
  flyX: Float32Array;
  flyY: Float32Array;
  flySpeed: Float32Array;
  flyPhase: Float32Array;
  flyPeriod: Float32Array;
  flyBlink: Float32Array;
  flyPc: Int8Array;
  flyAt: Float64Array;
  flyNext: number;
  lastCount: number;
  /** Recent strongest attack: strengths are read relative to it (the ODF has no fixed scale). */
  strongest: number;
  spectrum: Float32Array<ArrayBuffer> | null;
  /** Pre-tinted paw sprites: 12 pitch classes + 1 neutral, × 3 sizes. */
  sprites: HTMLCanvasElement[] | null;
  spriteCell: number;
  seed: number;
}

/** Paw prints, toes to the right (the walking direction): small, medium, large. */
const PAWS: readonly (readonly string[])[] = [
  ["....##..", "....##..", ".##.....", "####..##", "####..##", ".##.....", "....##..", "....##.."],
  [
    ".....##...",
    ".....##...",
    ".###....##",
    "#####...##",
    "######....",
    "######....",
    "#####...##",
    ".###....##",
    ".....##...",
    ".....##...",
  ],
  [
    "......###...",
    "......###...",
    "............",
    ".####....###",
    "######...###",
    "#######.....",
    "#######.....",
    "######...###",
    ".####....###",
    "............",
    "......###...",
    "......###...",
  ],
];

/** One paw sprite: the print in `fill`, with a one-cell outline in `outline`. */
function pawSprite(paw: readonly string[], fill: string, outline: string): HTMLCanvasElement {
  const n = paw.length;
  const canvas = document.createElement("canvas");
  canvas.width = n + 2;
  canvas.height = n + 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = outline;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) if (paw[y][x] === "#") ctx.fillRect(x, y, 3, 3);
  }
  ctx.fillStyle = fill;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) if (paw[y][x] === "#") ctx.fillRect(x + 1, y + 1, 1, 1);
  }
  return canvas;
}

function nextRandom(st: PawState): number {
  st.seed = (st.seed * 1664525 + 1013904223) >>> 0;
  return st.seed / 4294967296;
}

export function PawTrail({
  signals,
  width,
  height,
  mode = "paws",
  ground,
  pixel = 4,
  theme = STAGE_THEME,
}: PawTrailProps) {
  const state = useRef<PawState | null>(null);
  state.current ??= {
    pawX: new Int16Array(PAW_POOL),
    pawY: new Int16Array(PAW_POOL),
    pawSize: new Uint8Array(PAW_POOL),
    pawPc: new Int8Array(PAW_POOL),
    pawAt: new Float64Array(PAW_POOL).fill(-Infinity),
    pawStrength: new Float32Array(PAW_POOL),
    pawNext: 0,
    stepX: 2,
    stepUp: true,
    flyX: new Float32Array(FLY_POOL),
    flyY: new Float32Array(FLY_POOL),
    flySpeed: new Float32Array(FLY_POOL),
    flyPhase: new Float32Array(FLY_POOL),
    flyPeriod: new Float32Array(FLY_POOL),
    flyBlink: new Float32Array(FLY_POOL),
    flyPc: new Int8Array(FLY_POOL),
    flyAt: new Float64Array(FLY_POOL).fill(-Infinity),
    flyNext: 0,
    lastCount: -1,
    strongest: 0,
    spectrum: null,
    sprites: null,
    spriteCell: 0,
    seed: 0x5eed,
  };

  const groundAt = (xCells: number, h: number): number =>
    ground ? Math.floor(ground(xCells * pixel) / pixel) : h - 2;

  /** Cell column above the loudest band (70 Hz–6 kHz, log scale), or the middle. */
  const loudestColumn = (s: StageSignals, w: number): number => {
    const st = state.current!;
    const tap = s.harmonyTap;
    if (!tap) return w / 2;
    if (!st.spectrum || st.spectrum.length < tap.bins) st.spectrum = new Float32Array(tap.bins);
    tap.readFrequencyDb(st.spectrum);
    const lo = Math.max(1, Math.round(LOW_HZ / tap.binHz));
    const hi = Math.min(tap.bins - 1, Math.round(HIGH_HZ / tap.binHz));
    let best = lo;
    for (let b = lo; b <= hi; b++) if (st.spectrum[b] > st.spectrum[best]) best = b;
    return (Math.log(Math.max(LOW_HZ, best * tap.binHz) / LOW_HZ) / Math.log(HIGH_HZ / LOW_HZ)) * w;
  };

  const spawnPaw = (
    st: PawState,
    strength: number,
    pc: number | null,
    now: number,
    w: number,
    h: number,
  ) => {
    // Attacks closer than 60 ms are one step: keep the stronger.
    const prev = (st.pawNext + PAW_POOL - 1) % PAW_POOL;
    if (now - st.pawAt[prev] < MERGE) {
      if (strength > st.pawStrength[prev]) {
        st.pawStrength[prev] = strength;
        st.pawSize[prev] = strength > 0.75 ? 2 : strength > 0.45 ? 1 : 0;
        st.pawPc[prev] = pc ?? -1;
      }
      return;
    }
    const size = strength > 0.75 ? 2 : strength > 0.45 ? 1 : 0;
    const n = PAWS[size].length;
    if (st.stepX + n + 2 > w) st.stepX = 2;
    const g = groundAt(st.stepX + (n >> 1), h);
    const i = st.pawNext;
    st.pawX[i] = st.stepX;
    st.pawY[i] = Math.max(0, g - n - 3 - (st.stepUp ? 2 : 0));
    st.pawSize[i] = size;
    st.pawPc[i] = pc ?? -1;
    st.pawAt[i] = now;
    st.pawStrength[i] = strength;
    st.pawNext = (i + 1) % PAW_POOL;
    st.stepX += STRIDE;
    st.stepUp = !st.stepUp;
  };

  const spawnFlies = (
    st: PawState,
    s: StageSignals,
    strength: number,
    pc: number | null,
    now: number,
    w: number,
    h: number,
  ) => {
    const count = 3 + Math.min(3, Math.floor(strength * 4));
    const cx = loudestColumn(s, w);
    for (let j = 0; j < count; j++) {
      const i = st.flyNext;
      const x = Math.min(w - 3, Math.max(1, cx + (nextRandom(st) - 0.5) * 24));
      st.flyX[i] = x;
      st.flyY[i] = Math.min(h - 4, groundAt(Math.round(x), h) - 3 - nextRandom(st) * 6);
      st.flySpeed[i] = (20 + nextRandom(st) * 20) / pixel;
      st.flyPhase[i] = nextRandom(st) * Math.PI * 2;
      st.flyPeriod[i] = 1.5 + nextRandom(st) * 1.5;
      st.flyBlink[i] = 1.4 + nextRandom(st) * 0.8;
      st.flyPc[i] = pc ?? -1;
      st.flyAt[i] = now;
      st.flyNext = (i + 1) % FLY_POOL;
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    const st = state.current!;
    if (!s) return;
    const now = f.now;
    const W = f.width;
    const H = f.height;

    // New attacks since the last frame (the memory keeps the last 64).
    if (st.lastCount < 0) st.lastCount = s.onsetCount;
    const fresh = Math.min(s.onsetCount - st.lastCount, s.onsets.length);
    for (let j = s.onsets.length - fresh; j < s.onsets.length; j++) {
      const o = s.onsets[j];
      st.strongest = Math.max(o.strength, st.strongest);
      const strength = st.strongest > 0 ? o.strength / st.strongest : 0;
      if (mode === "paws") spawnPaw(st, strength, o.pitchClass, now, W, H);
      else spawnFlies(st, s, strength, o.pitchClass, now, W, H);
    }
    st.lastCount = s.onsetCount;
    st.strongest *= 1 - f.dt / 20;

    if (mode === "paws") {
      if (!st.sprites || st.spriteCell !== pixel) {
        st.sprites = [];
        st.spriteCell = pixel;
        for (let c = 0; c <= 12; c++) {
          for (const paw of PAWS)
            st.sprites.push(
              pawSprite(paw, c < 12 ? theme.pitchBright[c] : theme.signal, theme.night),
            );
        }
      }
      for (let i = 0; i < PAW_POOL; i++) {
        const age = now - st.pawAt[i];
        if (!(age >= 0) || age >= PAW_SOLID + 3 * PAW_STEP) continue;
        // Opaque, then 0.66 and 0.33: hard steps, no smooth fade.
        const step = age < PAW_SOLID ? 0 : 1 + Math.floor((age - PAW_SOLID) / PAW_STEP);
        ctx.globalAlpha = 1 - step / 3;
        const colour = st.pawPc[i] < 0 ? 12 : st.pawPc[i];
        ctx.drawImage(st.sprites[colour * 3 + st.pawSize[i]], st.pawX[i], st.pawY[i]);
      }
      ctx.globalAlpha = 1;
      return;
    }

    for (let i = 0; i < FLY_POOL; i++) {
      const age = now - st.flyAt[i];
      if (!(age >= 0) || age >= FLY_LIFE) continue;
      // One blink: off for 150 ms, back on, then out.
      const blinkAge = age - st.flyBlink[i];
      if (blinkAge >= 0 && blinkAge < 0.15) continue;
      const x = Math.round(
        st.flyX[i] + 2 * Math.sin(st.flyPhase[i] + (age * Math.PI * 2) / st.flyPeriod[i]),
      );
      const y = Math.round(st.flyY[i] - st.flySpeed[i] * age);
      if (y < 1) continue;
      const colour = st.flyPc[i] < 0 ? theme.signal : theme.pitchBright[st.flyPc[i]];
      const fading = age > FLY_LIFE - 0.4;
      ctx.fillStyle = colour;
      ctx.globalAlpha = fading ? 0.1 : 0.2;
      ctx.fillRect(x - 1, y - 1, 4, 4);
      ctx.globalAlpha = fading ? 0.5 : 1;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  };

  return <StageCanvas width={width} height={height} pixel={pixel} draw={draw} />;
}
