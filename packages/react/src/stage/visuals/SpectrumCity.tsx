"use client";

/**
 * Spectrum city: the guitar's spectrum as a pixel skyline at night. Each
 * building is one log-spaced band from 70 Hz to 6 kHz (the guitar and its
 * first harmonics); its lit floors follow the band's loudness, its windows
 * take the colour of the note nearest the band's centre, so a chord lights
 * the same hues as the mandala. A white row marks each band's recent peak
 * and falls back slowly. The buildings themselves remember the last few
 * seconds (unlit floors stay standing), so the city exists in silence and
 * only its windows react.
 *
 * Above the city, the moon takes the song's tonic colour: full in a major
 * key, a crescent in a minor one (the third coding of the mode, after the
 * colour and the word). A wolf sits on the tallest roof and howls at the
 * moon when the harmony moves to another chord (at most once every 2 s).
 */

import { useRef, type MutableRefObject, type RefObject } from "react";

import { approach, clamp01 } from "../draw";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

/** Height of the city's roofs, for things that walk on them (see `PawTrail`'s `ground`). */
export interface Roofline {
  /** Top of the roof under `x`, both in CSS px from the city's top-left corner. */
  roofAt(x: number): number;
}

export interface SpectrumCityProps {
  signals: RefObject<StageSignals | null>;
  /** CSS size. */
  width: number;
  height: number;
  /** Cell size. Default 4. */
  pixel?: number;
  /** Number of buildings (bands). Default 48. */
  columns?: number;
  /**
   * Band level (tap dB) of an empty and of a full building. Default: adaptive,
   * a full building at the loudest band of the last seconds and an empty one
   * 50 dB below, so the city fills whatever the input's gain.
   */
  rangeDb?: readonly [number, number];
  /** Filled with the live roofline on every frame. */
  roofline?: MutableRefObject<Roofline | null>;
  theme?: StageTheme;
}

const LOW_HZ = 70;
const HIGH_HZ = 6000;
/** Cells per floor (16 CSS px at the default cell). */
const FLOOR = 4;
const WOLF = 16;
const RELEASE = 0.05;
const PEAK_HOLD = 0.6;
const PEAK_DROP = 0.08;
const BODY_HOLD = 4;
const BODY_DROP = 0.35;
const HOWL_GAP = 2;
const WOLF_MOVE_GAP = 3;
const HOP = 0.36;
const UNLIT = "#1b211e";

const ROOF_FLAT = 0;
const ROOF_GABLE = 1;
const ROOF_ANTENNA = 2;

/**
 * Sitting wolf, facing right (towards the moon), 16 × 16 cells: sitting, head
 * tilting up, howling. `o` is the eye.
 */
const WOLF_BODY = [
  "........####....",
  ".......#####....",
  "......######....",
  ".....#######....",
  "....########....",
  "....#########...",
  "...##########...",
  "...#####.###....",
  "##.#####.###....",
  "#######..###....",
  ".######.####....",
];
const WOLF_FRAMES: readonly (readonly string[])[] = [
  [
    "........#.#.....",
    "........####....",
    ".......#####....",
    ".......##o######",
    ".......#########",
    ...WOLF_BODY,
  ],
  [
    ".............##.",
    "........#.#.###.",
    "........######..",
    ".......##o###...",
    ".......#####....",
    ...WOLF_BODY,
  ],
  [
    "...........##...",
    "..........###...",
    ".......#.####...",
    ".......#o###....",
    ".......#####....",
    ...WOLF_BODY,
  ],
];
/** Muzzle tip of the howling frame, where the sound waves start. */
const MUZZLE = { x: 12, y: 0 };

interface Layout {
  w: number;
  h: number;
  n: number;
  floors: number;
  x: Int16Array;
  width: Int16Array;
  roof: Uint8Array;
  rest: Uint8Array;
  pc: Uint8Array;
  /** Building index under each cell column. */
  under: Int16Array;
  /** Band bin bounds (inclusive), for `binHz`. */
  lo: Int16Array;
  hi: Int16Array;
  binHz: number;
}

interface CityState {
  /** Adaptive ceiling (tap dB): jumps to the loudest band, sinks 4 dB/s. */
  ceilingDb: number;
  layout: Layout | null;
  spectrum: Float32Array<ArrayBuffer> | null;
  level: Float32Array;
  levelAt: Float32Array;
  peak: Float32Array;
  peakAt: Float32Array;
  body: Float32Array;
  bodyAt: Float32Array;
  moon: Float32Array;
  /** 0 = full moon, 1 = crescent. */
  phase: number;
  wolf: number;
  wolfMovedAt: number;
  hopFromX: number;
  hopFromY: number;
  hopAt: number;
  howlAt: number;
  lastChange: number | null;
  lastRoot: number | null;
  roofline: Roofline | null;
}

/** Small deterministic generator, so the skyline is the same on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexRgb(hex: string, out: Float32Array, offset = 0): void {
  const n = parseInt(hex.slice(1, 7), 16);
  out[offset] = (n >> 16) & 255;
  out[offset + 1] = (n >> 8) & 255;
  out[offset + 2] = n & 255;
}

function roofHeight(kind: number): number {
  return kind === ROOF_GABLE ? 2 : kind === ROOF_FLAT ? 1 : 0;
}

function buildLayout(w: number, h: number, n: number): Layout {
  const rand = mulberry32(0x10_10_7e_c4 + n);
  const base = w / n;
  const width = new Int16Array(n);
  let total = 0;
  for (let k = 0; k < n; k++) {
    width[k] = Math.max(6, Math.round(base + [-2, 0, 2][Math.floor(rand() * 3)]));
    total += width[k];
  }
  // Spread the rounding error so the skyline covers the width exactly.
  for (let i = 0; total !== w && i < 10_000; i++) {
    const k = Math.floor(rand() * n);
    const step = total < w ? 1 : -1;
    if (width[k] + step < 6 || width[k] + step > base + 3) continue;
    width[k] += step;
    total += step;
  }
  const x = new Int16Array(n);
  const under = new Int16Array(w);
  for (let k = 0, at = 0; k < n; k++) {
    x[k] = at;
    for (let c = at; c < Math.min(w, at + width[k]); c++) under[c] = k;
    at += width[k];
  }
  const floors = Math.max(2, Math.floor((h - WOLF - 3) / FLOOR));
  const roof = new Uint8Array(n);
  const rest = new Uint8Array(n);
  const pc = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    const r = rand();
    roof[k] = r < 0.5 ? ROOF_FLAT : r < 0.8 ? ROOF_GABLE : ROOF_ANTENNA;
    rest[k] = 1 + Math.floor(rand() * Math.min(3, floors - 1));
    const f0 = LOW_HZ * Math.pow(HIGH_HZ / LOW_HZ, k / n);
    const f1 = LOW_HZ * Math.pow(HIGH_HZ / LOW_HZ, (k + 1) / n);
    const centre = Math.sqrt(f0 * f1);
    pc[k] = (((Math.round(12 * Math.log2(centre / 440) + 9) % 12) + 12) % 12) as number;
  }
  return {
    w,
    h,
    n,
    floors,
    x,
    width,
    roof,
    rest,
    pc,
    under,
    lo: new Int16Array(n),
    hi: new Int16Array(n),
    binHz: 0,
  };
}

function setBins(layout: Layout, binHz: number, bins: number): void {
  layout.binHz = binHz;
  for (let k = 0; k < layout.n; k++) {
    const f0 = LOW_HZ * Math.pow(HIGH_HZ / LOW_HZ, k / layout.n);
    const f1 = LOW_HZ * Math.pow(HIGH_HZ / LOW_HZ, (k + 1) / layout.n);
    const lo = Math.min(bins - 1, Math.round(f0 / binHz));
    layout.lo[k] = lo;
    layout.hi[k] = Math.min(bins - 1, Math.max(lo, Math.round(f1 / binHz) - 1));
  }
}

/** Filled pixel disc of radius `r` cells, row by row (crisp at any scale). */
function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  for (let y = -Math.ceil(r); y < Math.ceil(r); y++) {
    const yc = y + 0.5;
    if (yc * yc > r * r) continue;
    const half = Math.round(Math.sqrt(r * r - yc * yc));
    ctx.fillRect(cx - half, cy + y, half * 2, 1);
  }
}

export function SpectrumCity({
  signals,
  width,
  height,
  pixel = 4,
  columns = 48,
  rangeDb,
  roofline,
  theme = STAGE_THEME,
}: SpectrumCityProps) {
  const state = useRef<CityState | null>(null);
  state.current ??= {
    layout: null,
    spectrum: null,
    ceilingDb: -40,
    level: new Float32Array(0),
    levelAt: new Float32Array(0),
    peak: new Float32Array(0),
    peakAt: new Float32Array(0),
    body: new Float32Array(0),
    bodyAt: new Float32Array(0),
    moon: new Float32Array([113, 122, 115, 113, 122, 115]),
    phase: 1,
    wolf: -1,
    wolfMovedAt: -Infinity,
    hopFromX: 0,
    hopFromY: 0,
    hopAt: -Infinity,
    howlAt: -Infinity,
    lastChange: null,
    lastRoot: null,
    roofline: null,
  };

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    const st = state.current!;
    const W = f.width;
    const H = f.height;
    if (!st.layout || st.layout.w !== W || st.layout.h !== H || st.layout.n !== columns) {
      st.layout = buildLayout(W, H, columns);
      st.level = new Float32Array(columns);
      st.levelAt = new Float32Array(columns);
      st.peak = new Float32Array(columns);
      st.peakAt = new Float32Array(columns);
      st.body = new Float32Array(columns);
      st.bodyAt = new Float32Array(columns);
      st.wolf = -1;
    }
    const L = st.layout;
    const now = f.now;

    // Band levels, in whole floors: instant attack, one floor per 50 ms release.
    const tap = s?.harmonyTap ?? null;
    if (tap) {
      if (!st.spectrum || st.spectrum.length < tap.bins) st.spectrum = new Float32Array(tap.bins);
      if (L.binHz !== tap.binHz) setBins(L, tap.binHz, tap.bins);
      tap.readFrequencyDb(st.spectrum);
    }
    if (!rangeDb && tap && st.spectrum) {
      let loudest = -Infinity;
      for (let k = 0; k < L.n; k++) {
        for (let b = L.lo[k]; b <= L.hi[k]; b++)
          if (st.spectrum[b] > loudest) loudest = st.spectrum[b];
      }
      st.ceilingDb = Math.max(loudest, st.ceilingDb - 4 * f.dt, -70);
    }
    const [floorDb, ceilDb] = rangeDb ?? [st.ceilingDb - 50, st.ceilingDb];
    for (let k = 0; k < L.n; k++) {
      let target = 0;
      if (tap && st.spectrum) {
        let m = -Infinity;
        for (let b = L.lo[k]; b <= L.hi[k]; b++) if (st.spectrum[b] > m) m = st.spectrum[b];
        if (Number.isFinite(m))
          target = Math.floor(clamp01((m - floorDb) / (ceilDb - floorDb)) * L.floors);
      }
      if (target >= st.level[k]) {
        st.level[k] = target;
        st.levelAt[k] = now;
      } else if (now - st.levelAt[k] >= RELEASE) {
        st.level[k] -= 1;
        st.levelAt[k] = now;
      }
      if (st.level[k] >= st.peak[k]) {
        st.peak[k] = st.level[k];
        st.peakAt[k] = now;
      } else if (now - st.peakAt[k] >= PEAK_HOLD) {
        st.peak[k] -= 1;
        st.peakAt[k] = now - PEAK_HOLD + PEAK_DROP;
      }
      const bodyTarget = Math.max(L.rest[k], st.level[k]);
      if (bodyTarget >= st.body[k]) {
        st.body[k] = bodyTarget;
        st.bodyAt[k] = now;
      } else if (now - st.bodyAt[k] >= BODY_HOLD) {
        st.body[k] -= 1;
        st.bodyAt[k] = now - BODY_HOLD + BODY_DROP;
      }
    }

    // Moon: tonic colour (about 2 s to change), crescent in minor.
    const key = s?.key.key ?? null;
    hexRgb(key ? theme.pitchBright[key.tonic] : theme.inkFaint, st.moon, 3);
    const k2 = approach(f.dt, 0.6);
    for (let i = 0; i < 3; i++) st.moon[i] += (st.moon[i + 3] - st.moon[i]) * k2;
    st.phase += ((key?.mode === "maj" ? 0 : 1) - st.phase) * k2;
    const moonColour = `rgb(${st.moon[0] | 0}, ${st.moon[1] | 0}, ${st.moon[2] | 0})`;
    const R = 12;
    const mx = W - R - Math.round(W * 0.06);
    const my = R + 2;
    ctx.fillStyle = moonColour;
    ctx.globalAlpha = 0.12;
    disc(ctx, mx, my, R + 3);
    ctx.globalAlpha = 0.25;
    disc(ctx, mx, my, R + 1.5);
    ctx.globalAlpha = 1;
    const sx = mx - Math.round(R * (0.5 + 1.8 * (1 - st.phase)));
    const sy = my - Math.round(R * 0.25);
    const shadowR = R * 0.92;
    for (let y = -R; y < R; y++) {
      const yc = y + 0.5;
      if (yc * yc > R * R) continue;
      const half = Math.round(Math.sqrt(R * R - yc * yc));
      let run = -1;
      for (let x = -half; x <= half; x++) {
        const dx = mx + x + 0.5 - sx;
        const dy = my + yc - sy;
        const lit = x < half && dx * dx + dy * dy > shadowR * shadowR;
        if (lit && run < 0) run = x;
        if (!lit && run >= 0) {
          ctx.fillRect(mx + run, my + y, x - run, 1);
          run = -1;
        }
      }
    }
    // Two craters, visible on the full moon (hidden by the shadow in minor).
    if (st.phase < 0.5) {
      ctx.fillStyle = key ? theme.pitch[key.tonic] : theme.shadeLine;
      ctx.fillRect(mx + 2, my - 5, 3, 3);
      ctx.fillRect(mx - 5, my + 3, 2, 2);
      ctx.fillRect(mx + 4, my + 4, 2, 2);
    }

    // Buildings.
    for (let k = 0; k < L.n; k++) {
      const x0 = L.x[k];
      const bw = L.width[k];
      const body = st.body[k];
      const top = H - body * FLOOR;
      ctx.fillStyle = theme.shade;
      ctx.fillRect(x0, top, bw, H - top);
      const kind = k === st.wolf ? ROOF_FLAT : L.roof[k];
      if (kind === ROOF_FLAT) {
        ctx.fillRect(x0, top - 1, bw, 1);
      } else if (kind === ROOF_GABLE) {
        ctx.fillRect(x0 + 1, top - 1, bw - 2, 1);
        ctx.fillRect(x0 + 3, top - 2, bw - 6, 1);
      } else {
        ctx.fillRect(x0 + (bw >> 1), top - 4, 1, 4);
        ctx.fillStyle = st.level[k] > 0 ? theme.pitchBright[L.pc[k]] : theme.shadeLine;
        ctx.fillRect(x0 + (bw >> 1), top - 6, 2, 2);
      }
      ctx.fillStyle = theme.shadeLine;
      ctx.fillRect(
        x0,
        top - (kind === ROOF_FLAT ? 1 : 0),
        1,
        H - top + (kind === ROOF_FLAT ? 1 : 0),
      );

      // Windows: 2 × 2 cells, one per 4 cells, lit up to the band's level.
      const lit = st.level[k];
      const peak = st.peak[k];
      for (let fl = 0; fl < body; fl++) {
        const wy = H - (fl + 1) * FLOOR + 1;
        if (fl === peak - 1 && peak > lit) {
          ctx.fillStyle = theme.ink;
          ctx.globalAlpha = 1;
        } else if (fl < lit) {
          ctx.fillStyle = theme.pitchBright[L.pc[k]];
          ctx.globalAlpha = 0.85;
        } else {
          ctx.fillStyle = UNLIT;
          ctx.globalAlpha = 1;
        }
        for (let wx = x0 + 2; wx + 2 <= x0 + bw - 1; wx += 4) ctx.fillRect(wx, wy, 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    // The wolf picks the tallest roof (at most every 3 s) and hops there.
    let tallest = st.wolf < 0 ? 0 : st.wolf;
    for (let k = 0; k < L.n; k++) if (st.body[k] > st.body[tallest]) tallest = k;
    const wolfX = (k: number) => L.x[k] + ((L.width[k] - WOLF) >> 1);
    const wolfY = (k: number) => H - st.body[k] * FLOOR - 1 - WOLF;
    if (st.wolf < 0) {
      st.wolf = tallest;
      st.wolfMovedAt = now;
    } else if (
      tallest !== st.wolf &&
      now - st.wolfMovedAt >= WOLF_MOVE_GAP &&
      now - st.howlAt > 1.2
    ) {
      st.hopFromX = wolfX(st.wolf);
      st.hopFromY = wolfY(st.wolf);
      st.hopAt = now;
      st.wolf = tallest;
      st.wolfMovedAt = now;
    }
    let px = wolfX(st.wolf);
    let py = wolfY(st.wolf);
    const hop = (now - st.hopAt) / HOP;
    if (hop < 1) {
      // Three steps along a small arc.
      const u = Math.ceil(hop * 3) / 3;
      px = Math.round(st.hopFromX + (px - st.hopFromX) * u);
      py = Math.round(st.hopFromY + (py - st.hopFromY) * u - 8 * Math.sin(Math.PI * u));
    }

    // Howl on a chord change to another root.
    if (s && s.chordChangedAt !== st.lastChange) {
      st.lastChange = s.chordChangedAt;
      const root = s.chord.current?.root ?? null;
      if (root !== null && root !== st.lastRoot && now - st.howlAt >= HOWL_GAP && hop >= 1)
        st.howlAt = now;
      st.lastRoot = root;
    }
    const t = now - st.howlAt;
    const frame = t < 0.12 ? 1 : t < 1.1 ? 2 : t < 1.22 ? 1 : 0;
    const sprite = WOLF_FRAMES[frame];
    for (let y = 0; y < WOLF; y++) {
      const row = sprite[y];
      for (let x = 0; x < WOLF; x++) {
        const c = row[x];
        if (c === ".") continue;
        // Rim light on the edges facing the moon (up and right).
        const rim =
          c === "#" &&
          (y === 0 || sprite[y - 1][x] === "." || x === WOLF - 1 || row[x + 1] === ".");
        ctx.fillStyle = c === "o" ? theme.major : rim ? moonColour : theme.plateBorder;
        ctx.fillRect(px + x, py + y, 1, 1);
      }
    }
    // Sound waves: three arcs leaving the muzzle, one more every 150 ms.
    if (frame === 2 && t > 0.2) {
      const ox = px + MUZZLE.x + 1;
      const oy = py + MUZZLE.y;
      ctx.fillStyle = moonColour;
      for (let i = 0; i < 3; i++) {
        const age = t - 0.2 - i * 0.15;
        if (age < 0) continue;
        const r = 3 + 3 * i + Math.min(2, Math.floor(age / 0.3));
        ctx.globalAlpha = age > 0.6 ? 0.4 : 0.85;
        for (let a = -1.35; a <= 0.25; a += 0.7 / r) {
          ctx.fillRect(Math.round(ox + r * Math.cos(a)), Math.round(oy + r * Math.sin(a)), 1, 1);
        }
      }
      ctx.globalAlpha = 1;
    }

    if (roofline) {
      st.roofline ??= {
        roofAt: (xCss: number) => {
          const lay = st.layout;
          if (!lay) return height;
          const c = Math.max(0, Math.min(lay.w - 1, Math.floor(xCss / pixel)));
          const k = lay.under[c];
          const kind = k === st.wolf ? ROOF_FLAT : lay.roof[k];
          return (lay.h - st.body[k] * FLOOR - roofHeight(kind)) * pixel;
        },
      };
      roofline.current = st.roofline;
    }
  };

  return <StageCanvas width={width} height={height} pixel={pixel} draw={draw} />;
}
