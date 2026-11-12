"use client";

/**
 * The played note's waveform, as a thick ribbon or as a phase portrait.
 *
 * - "ribbon": a triggered oscilloscope. The window starts on a rising zero
 *   crossing and spans three periods of the detected note, so a steady note
 *   stands still instead of scrolling; its colour is the note's pitch class.
 *   The shape is the timbre: a sine is round, a sawtooth leans, a pick
 *   attack bristles with harmonics.
 * - "lissajous": x = s[n], y = s[n + quarter period]. A pure tone draws a
 *   circle, a note rich in harmonics a rosette, a chord a tangle: the
 *   timbre seen at a glance. 512 points in 8 segments of stepped alpha, a
 *   comet tail without a gradient.
 *
 * The trace is rasterised into whole cells (a square brush, no
 * anti-aliasing) with a two-step hard halo, so it stays crisp under stream
 * compression. Gain follows a smoothed peak (at most ×64); on silence the
 * line flattens and greys out.
 */

import { useRef, type RefObject } from "react";

import type { SignalTap } from "@audiolab/core";

import { approach } from "../draw";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export type OscilloscopeMode = "ribbon" | "lissajous";

export interface OscilloscopeProps {
  signals: RefObject<StageSignals | null>;
  /** CSS size. The spec sizes: ribbon 1728×96, lissajous 320×320. */
  width: number;
  height: number;
  /** Default "ribbon". */
  mode?: OscilloscopeMode;
  /** Which tap to read: the played notes (default) or the harmony mix. */
  source?: "notes" | "harmony";
  /** Cell size. Default 4. */
  pixel?: number;
  theme?: StageTheme;
}

/** Below this RMS (−60 dBFS) the tap is silent. */
const SILENT_RMS = 0.001;
/** Spec says ×8; taps run quiet (peaks ≈ 0.02 on the demo and on line inputs), so allow more (the silence gate keeps noise from being blown up). */
const MAX_GAIN = 64;
const LISSAJOUS_POINTS = 512;
const SEGMENTS = 8;
/** Colour changes at most this often (s): a fast lead must not strobe. */
const COLOUR_HOLD = 0.4;

/** Alpha coverage of one layer, one byte per cell; the max of overlapping stamps wins. */
class CellRaster {
  readonly alpha: Uint8Array;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.alpha = new Uint8Array(w * h);
  }

  clear(): void {
    this.alpha.fill(0);
  }

  /** Square brush of `size` cells centred on (x, y). */
  stamp(x: number, y: number, size: number, a: number): void {
    const x0 = Math.round(x - size / 2);
    const y0 = Math.round(y - size / 2);
    for (let j = Math.max(0, y0); j < Math.min(this.h, y0 + size); j++) {
      for (let i = Math.max(0, x0); i < Math.min(this.w, x0 + size); i++) {
        const k = j * this.w + i;
        if (this.alpha[k] < a) this.alpha[k] = a;
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, size: number, a: number): void {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      this.stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, size, a);
    }
  }

  /** Paint the coverage in one colour into `img` (same size). */
  paint(img: ImageData, rgb: readonly number[]): void {
    const d = img.data;
    for (let k = 0, p = 0; k < this.alpha.length; k++, p += 4) {
      d[p] = rgb[0];
      d[p + 1] = rgb[1];
      d[p + 2] = rgb[2];
      d[p + 3] = this.alpha[k];
    }
  }
}

function rgbOf(hex: string): number[] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface ScopeState {
  samples: Float32Array<ArrayBuffer> | null;
  raster: CellRaster | null;
  layer: HTMLCanvasElement | null;
  layerCtx: CanvasRenderingContext2D | null;
  img: ImageData | null;
  /** Smoothed peak (auto-gain) and the 0…1 silence envelope. */
  peak: number;
  live: number;
  colour: string;
  colourAt: number;
  /** Smoothed lag (samples) of the phase portrait. */
  lag: number;
  /** Ribbon points (cells). */
  ys: Float32Array | null;
}

/** First rising zero crossing at or after `from`, or `from`. */
function trigger(s: Float32Array, from: number, until: number): number {
  for (let i = Math.max(1, from); i < until; i++) if (s[i - 1] < 0 && s[i] >= 0) return i;
  return from;
}

/**
 * Reference level of a window for the auto-gain: its peak, but no more than
 * 2.5 × its RMS, so a pick or kick transient clips instead of shrinking
 * the body of the wave.
 */
function levelIn(s: Float32Array, from: number, to: number): number {
  let peak = 0;
  let sum = 0;
  const a = Math.max(0, from);
  const b = Math.min(s.length, to);
  for (let i = a; i < b; i++) {
    const v = s[i] < 0 ? -s[i] : s[i];
    if (v > peak) peak = v;
    sum += v * v;
  }
  const rms = b > a ? Math.sqrt(sum / (b - a)) : 0;
  return Math.max(Math.min(peak, 2.5 * rms), 0.5 * peak);
}

function clampUnit(v: number): number {
  return v < -1 ? -1 : v > 1 ? 1 : v;
}

function sampleAt(s: Float32Array, x: number): number {
  const i = Math.floor(x);
  const t = x - i;
  return s[i] + (s[Math.min(s.length - 1, i + 1)] - s[i]) * t;
}

export function Oscilloscope({
  signals,
  width,
  height,
  mode = "ribbon",
  source = "notes",
  pixel = 4,
  theme = STAGE_THEME,
}: OscilloscopeProps) {
  const state = useRef<ScopeState>({
    samples: null,
    raster: null,
    layer: null,
    layerCtx: null,
    img: null,
    peak: 0.05,
    live: 0,
    colour: theme.signal,
    colourAt: -Infinity,
    lag: 0,
    ys: null,
  });

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    const lissajous = mode === "lissajous";
    if (lissajous) drawPlate(ctx, f, theme);

    // Cell layer, sized lazily (the canvas is client-only, as is this draw).
    if (!st.raster || st.raster.w !== f.width || st.raster.h !== f.height) {
      st.raster = new CellRaster(f.width, f.height);
      st.layer = document.createElement("canvas");
      st.layer.width = f.width;
      st.layer.height = f.height;
      st.layerCtx = st.layer.getContext("2d");
      st.img = st.layerCtx?.createImageData(f.width, f.height) ?? null;
    }
    const raster = st.raster;
    const tap: SignalTap | null = source === "harmony" ? s.harmonyTap : s.notesTap;
    if (tap && (!st.samples || st.samples.length !== tap.size))
      st.samples = new Float32Array(tap.size);
    const buf = st.samples;

    // Level: the tap's own RMS and peak (levelDb is the harmony session's).
    let rms = 0;
    if (tap && buf) {
      tap.readTimeDomain(buf);
      for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / buf.length);
    }
    const silent = !tap || !buf || rms < SILENT_RMS;
    st.live += ((silent ? 0 : 1) - st.live) * approach(f.dt, silent ? 0.3 : 0.05);

    // Colour of the note (or the chord root on the mix), held at least COLOUR_HOLD.
    const note = s.note;
    let want = theme.signal;
    if (source === "notes" && note && note.clarity > 0.6) want = theme.pitchBright[note.pitchClass];
    else if (source === "harmony" && s.chord.current && !s.chord.silent)
      want = theme.pitchBright[s.chord.current.root];
    if (want !== st.colour && f.now - st.colourAt > COLOUR_HOLD) {
      st.colour = want;
      st.colourAt = f.now;
    }
    const colour = st.live < 0.5 ? theme.plateBorder : st.colour;

    // Auto-gain on the drawn window's level: attack fast, release over ~60 ms, so a decaying pluck keeps its full shape.
    const follow = (peak: number): number => {
      st.peak = peak > st.peak ? peak : st.peak + (peak - st.peak) * approach(f.dt, 0.06);
      return Math.min(MAX_GAIN, 1 / Math.max(st.peak, 1e-4)) * st.live;
    };
    const sr = tap?.sampleRate ?? 48000;
    const period = note && note.clarity > 0.6 && note.frequency > 0 ? sr / note.frequency : 0;
    const core = Math.max(1, Math.round(6 / f.pixel));
    raster.clear();

    if (!lissajous) {
      const mid = f.height / 2;
      const amp = Math.max(1, mid - core / 2 - 2);
      const n = Math.max(2, Math.round((f.width * f.pixel) / 8));
      if (!st.ys || st.ys.length !== n) st.ys = new Float32Array(n);
      const ys = st.ys;
      ys.fill(Math.round(mid));
      if (buf && st.live > 0.01) {
        const len = Math.min(period > 0 ? Math.round(period * 3) : 1024, buf.length - 260);
        const start = trigger(buf, 256, buf.length - len);
        const gain = follow(levelIn(buf, start, start + len));
        for (let k = 0; k < n; k++) {
          const v = sampleAt(buf, start + (k / (n - 1)) * (len - 1)) * gain;
          ys[k] = Math.round(mid - clampUnit(v) * amp);
        }
      }
      // Two hard halo steps (25 %, 12 %), then the core.
      for (let pass = 0; pass < 3; pass++) {
        const size = core + (2 - pass) * 2;
        const a = pass === 2 ? 255 : pass === 1 ? 64 : 31;
        for (let k = 1; k < n; k++) {
          const xa = ((k - 1) / (n - 1)) * (f.width - 1);
          const xb = (k / (n - 1)) * (f.width - 1);
          raster.line(xa, ys[k - 1], xb, ys[k], size, a);
        }
      }
    } else {
      // Quarter period lag (a default A3 without a clear note), eased so the figure morphs.
      const lagTarget = period > 0 ? period / 4 : sr / 220 / 4;
      st.lag = st.lag > 0 ? st.lag + (lagTarget - st.lag) * approach(f.dt, 0.08) : lagTarget;
      const lag = Math.round(st.lag);
      const cx = f.width / 2;
      const cy = f.height / 2;
      const amp = Math.max(1, Math.min(cx, cy) * 0.72);
      if (buf && st.live > 0.01) {
        const count = Math.min(LISSAJOUS_POINTS, buf.length - lag - 1);
        const start = buf.length - lag - 1 - count;
        const per = count / SEGMENTS;
        const gain = follow(levelIn(buf, start, start + count + lag));
        // Oldest segment first so the newest (opaque) one lands on top.
        for (let pass = 0; pass < 2; pass++) {
          let px = 0;
          let py = 0;
          for (let k = 0; k < count; k++) {
            const seg = Math.min(SEGMENTS - 1, Math.floor(k / per));
            const fade = 0.2 + (0.8 * seg) / (SEGMENTS - 1);
            const x = cx + clampUnit(buf[start + k] * gain) * amp;
            const y = cy - clampUnit(buf[start + k + lag] * gain) * amp;
            if (k > 0) {
              if (pass === 0) raster.line(px, py, x, y, core + 2, Math.round(64 * fade));
              else raster.line(px, py, x, y, core, Math.round(255 * fade));
            }
            px = x;
            py = y;
          }
        }
      } else {
        raster.stamp(cx, cy, core + 2, 64);
        raster.stamp(cx, cy, core, 255);
      }
    }

    if (st.layerCtx && st.layer && st.img) {
      raster.paint(st.img, rgbOf(colour));
      st.layerCtx.putImageData(st.img, 0, 0);
      ctx.drawImage(st.layer, 0, 0);
    }
  };

  return (
    <StageCanvas
      width={width}
      height={height}
      pixel={pixel}
      draw={draw}
      label={
        mode === "lissajous" ? "Phase portrait of the played note" : "Waveform of the played note"
      }
    />
  );
}

/** Cut-corner night plate with a 1-cell border and an axis cross. */
function drawPlate(ctx: CanvasRenderingContext2D, f: StageFrame, theme: StageTheme): void {
  const w = f.width;
  const h = f.height;
  const cut = Math.max(1, Math.round(6 / f.pixel) + 1);
  octagon(ctx, 0, 0, w, h, cut);
  ctx.fillStyle = theme.plateBorder;
  ctx.fill();
  // Punch the inside out (the plate is translucent), then fill it: the border is the outer ring of cells.
  octagon(ctx, 1, 1, w - 1, h - 1, cut - 1);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = theme.plate;
  ctx.fill();
  const axis = Math.max(1, Math.round(4 / f.pixel));
  ctx.fillStyle = theme.shadeLine;
  ctx.fillRect(Math.floor(w / 2 - axis / 2), 2, axis, h - 4);
  ctx.fillRect(2, Math.floor(h / 2 - axis / 2), w - 4, axis);
}

function octagon(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cut: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x0 + cut, y0);
  ctx.lineTo(x1 - cut, y0);
  ctx.lineTo(x1, y0 + cut);
  ctx.lineTo(x1, y1 - cut);
  ctx.lineTo(x1 - cut, y1);
  ctx.lineTo(x0 + cut, y1);
  ctx.lineTo(x0, y1 - cut);
  ctx.lineTo(x0, y0 + cut);
  ctx.closePath();
}
