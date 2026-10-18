/**
 * Shared canvas plumbing for the plots: DPR-scaled context, the plot frame
 * geometry derived from the padding tokens, and the bed / axes / empty
 * state every plot draws the same way.
 *
 * Pixel mode (opt-in, `--al-viz-pixel` >= 2, see vizTheme.ts): the backing
 * store holds one pixel per cell and the browser scales it up without
 * smoothing. Every helper below takes the cell size `c` (1 = off) and, at
 * c = 1, does exactly what it did before pixel mode existed.
 */

import { tickFont, type VizTheme } from "./vizTheme";

export interface PlotFrame {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  plotWidth: number;
  plotHeight: number;
}

/** Cell size in CSS px of a theme: 1 when pixel mode is off. */
export function cellOf(theme: VizTheme): number {
  const p = theme.pixel ?? 0;
  return p > 1 ? p : 1;
}

/**
 * A cell rounded to a whole number of device pixels, so every cell has the
 * same size on screen. Returned in CSS px.
 */
export function deviceCell(cell: number, dpr: number): number {
  return Math.max(1, Math.round(cell * dpr)) / dpr;
}

/**
 * Size the canvas for the device pixel ratio and return a scaled context.
 *
 * With `cell` > 1 (pixel mode) the backing store holds one pixel per cell,
 * rounded UP (ceil) so it always covers the whole CSS box: the canvas keeps
 * its CSS size (no layout shift) and the surplus, under one cell over the
 * whole width, is absorbed by the upscale. `image-rendering: pixelated`
 * keeps the cells hard-edged. Drawing code still works in CSS px.
 */
export function prepareCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  cell = 1,
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  if (cell > 1) {
    const css = deviceCell(cell, dpr);
    canvas.width = Math.max(1, Math.ceil(width / css));
    canvas.height = Math.max(1, Math.ceil(height / css));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.imageRendering = "pixelated";
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(1 / css, 1 / css);
    return ctx;
  }
  // A canvas that was in pixel mode goes back to smooth scaling.
  if (canvas.style.imageRendering) canvas.style.imageRendering = "";
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  return ctx;
}

export function plotFrame(width: number, height: number, theme: VizTheme): PlotFrame {
  const left = theme.pad.left;
  const right = Math.max(left + 1, width - theme.pad.right);
  const top = theme.pad.top;
  const bottom = Math.max(top + 1, height - theme.pad.bottom);
  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    plotWidth: right - left,
    plotHeight: bottom - top,
  };
}

/**
 * Snap a coordinate to the pixel centre so 1 px lines stay crisp; in pixel
 * mode (c > 1), to the centre of its cell.
 */
export const crisp = (v: number, c = 1): number =>
  c === 1 ? Math.round(v) + 0.5 : (Math.floor(v / c) + 0.5) * c;

/** Snap a coordinate down to a cell edge (identity when c = 1). */
export const snap = (v: number, c = 1): number => (c === 1 ? v : Math.floor(v / c) * c);

/** Stroke colour and width; in pixel mode the width is a whole number of cells. */
export function stroke(ctx: CanvasRenderingContext2D, colour: string, width: number, c = 1): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = c === 1 ? width : Math.max(1, Math.round(width / c)) * c;
}

/** Line dash; in pixel mode every dash and gap is a whole number of cells. */
export function dash(ctx: CanvasRenderingContext2D, pattern: number[], c = 1): void {
  ctx.setLineDash(c === 1 ? pattern : pattern.map((v) => Math.max(1, Math.round(v / c)) * c));
}

export function drawBed(ctx: CanvasRenderingContext2D, frame: PlotFrame, theme: VizTheme): void {
  ctx.fillStyle = theme.bed;
  ctx.fillRect(0, 0, frame.width, frame.height);
}

/** Left and bottom axis strokes. */
export function drawAxes(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  theme: VizTheme,
  c = 1,
): void {
  stroke(ctx, theme.axis, 1, c);
  ctx.beginPath();
  ctx.moveTo(crisp(frame.left, c), frame.top);
  ctx.lineTo(crisp(frame.left, c), crisp(frame.bottom, c));
  ctx.lineTo(frame.right, crisp(frame.bottom, c));
  ctx.stroke();
}

/**
 * Horizontal grid lines at the given y positions, in one path. In pixel
 * mode a grid line is a row of dots: one cell on, one off.
 */
export function drawHorizontalGrid(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  ys: readonly number[],
  colour: string,
  c = 1,
): void {
  if (ys.length === 0) return;
  stroke(ctx, colour, 1, c);
  if (c > 1) dash(ctx, [c, c], c);
  ctx.beginPath();
  for (const y of ys) {
    ctx.moveTo(frame.left, crisp(y, c));
    ctx.lineTo(frame.right, crisp(y, c));
  }
  ctx.stroke();
  if (c > 1) ctx.setLineDash([]);
}

/** Vertical grid lines at the given x positions, in one path (dotted in pixel mode). */
export function drawVerticalGrid(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  xs: readonly number[],
  colour: string,
  c = 1,
): void {
  if (xs.length === 0) return;
  stroke(ctx, colour, 1, c);
  if (c > 1) dash(ctx, [c, c], c);
  ctx.beginPath();
  for (const x of xs) {
    ctx.moveTo(crisp(x, c), frame.top);
    ctx.lineTo(crisp(x, c), frame.bottom);
  }
  ctx.stroke();
  if (c > 1) ctx.setLineDash([]);
}

export function setTickFont(ctx: CanvasRenderingContext2D, theme: VizTheme): void {
  ctx.fillStyle = theme.axisLabel;
  ctx.font = tickFont(theme);
}

/** Tick label to the left of the y axis. */
export function labelY(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  y: number,
  text: string,
): void {
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(text, frame.left - 8, y);
}

/** Tick label under the x axis. */
export function labelX(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  x: number,
  text: string,
): void {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, frame.bottom + 6);
}

/** Text with a bed-coloured halo so it stays legible over a trace. */
export function haloText(
  ctx: CanvasRenderingContext2D,
  theme: VizTheme,
  text: string,
  x: number,
  y: number,
  colour: string,
): void {
  ctx.lineWidth = theme.plotFont ? 4 : 3;
  ctx.strokeStyle = theme.bed;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

export const EMPTY_TEXT = "Waiting for signal…";

/** The instrument is on but there is nothing to show yet. */
export function drawEmpty(ctx: CanvasRenderingContext2D, frame: PlotFrame, theme: VizTheme): void {
  drawBed(ctx, frame, theme);
  ctx.fillStyle = theme.emptyText;
  ctx.font = theme.plotFont
    ? `400 ${theme.tickPx}px ${theme.plotFont}, ${theme.fontMono}`
    : `400 13px ${theme.fontUi}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(EMPTY_TEXT, frame.width / 2, frame.height / 2);
}

/** 250 → "250", 1000 → "1k", 2500 → "2.5k". */
export function formatHz(f: number): string {
  if (f >= 1000) {
    const k = f / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `${f}`;
}

/** −60 → "−60" with a proper minus sign. */
export function formatSigned(v: number, digits = 0): string {
  const s = Math.abs(v).toFixed(digits);
  return v < 0 ? `−${s}` : s;
}

// --- Pixel mode ------------------------------------------------------------

/** One stepped column: its left edge and the y of its top, in CSS px. */
export interface StepColumn {
  x: number;
  y: number;
}

/**
 * Reduce a curve to equaliser columns of `width` cells, `gap` cells apart,
 * across the plot frame. A column takes the highest sample that falls in it
 * (a peak is never lost); a column between two samples interpolates them.
 * `xOf` must be ascending.
 */
export function stepColumns(
  count: number,
  xOf: (i: number) => number,
  yOf: (i: number) => number,
  frame: PlotFrame,
  c: number,
  width = 2,
  gap = 1,
): StepColumn[] {
  const out: StepColumn[] = [];
  if (count < 1) return out;
  const colW = width * c;
  const step = (width + gap) * c;
  let i = 0;
  for (let x = snap(frame.left, c) + c; x + colW <= frame.right + 0.001; x += step) {
    const x1 = x + colW;
    while (i < count && xOf(i) < x) i++;
    let top = Infinity;
    let j = i;
    for (; j < count && xOf(j) < x1; j++) top = Math.min(top, yOf(j));
    if (top === Infinity) {
      const mid = x + colW / 2;
      const b = Math.min(count - 1, j);
      const a = Math.max(0, b - 1);
      const xa = xOf(a);
      const xb = xOf(b);
      const t = xb > xa ? Math.min(1, Math.max(0, (mid - xa) / (xb - xa))) : 0;
      top = yOf(a) + (yOf(b) - yOf(a)) * t;
    }
    out.push({ x, y: top });
  }
  return out;
}

export interface SteppedStyle {
  /** Body of a column. */
  body: string;
  /** The top cell, brighter: the cap of an 8-bit equaliser. */
  cap: string;
  /** Opacity of the body (the cap stays opaque). Default 1. */
  bodyAlpha?: number;
  /** Cells per block: the body is cut into blocks one cell apart. 0 = solid. */
  segment?: number;
}

/**
 * Equaliser columns drawn with fillRect: heights snapped to whole cells
 * from the frame bottom, the top cell in the cap colour.
 */
export function drawStepped(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  columns: readonly StepColumn[],
  c: number,
  style: SteppedStyle,
  width = 2,
): void {
  const bottom = snap(frame.bottom, c);
  const colW = width * c;
  const seg = style.segment ?? 0;
  const tops = columns.map((col) => {
    const y = Number.isFinite(col.y) ? Math.max(frame.top, col.y) : bottom;
    return bottom - Math.max(0, Math.round((bottom - y) / c)) * c;
  });
  ctx.save();
  ctx.globalAlpha = style.bodyAlpha ?? 1;
  ctx.fillStyle = style.body;
  columns.forEach((col, k) => {
    const top = tops[k] + c; // the cap takes the first cell
    if (top >= bottom) return;
    if (seg > 0) {
      for (let y = bottom; y > top; y -= (seg + 1) * c) {
        const h = Math.min(seg * c, y - top);
        ctx.fillRect(col.x, y - h, colW, h);
      }
    } else {
      ctx.fillRect(col.x, top, colW, bottom - top);
    }
  });
  ctx.restore();
  ctx.fillStyle = style.cap;
  columns.forEach((col, k) => {
    if (tops[k] < bottom) ctx.fillRect(col.x, tops[k], colW, c);
  });
}

/**
 * A curve as a line of cells: one cell per column, the vertical run to the
 * next column filled so the line stays connected. `yAt(x)` gives the y of
 * the curve at a CSS x; a non-finite y breaks the line.
 */
export function drawPixelTrace(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  yAt: (x: number) => number,
  colour: string,
  c: number,
): void {
  ctx.fillStyle = colour;
  const top = snap(frame.top, c);
  const last = snap(frame.bottom, c) - c;
  let prev: number | null = null;
  for (let x = snap(frame.left, c) + c; x + c <= frame.right + 0.001; x += c) {
    const raw = yAt(x + c / 2);
    if (!Number.isFinite(raw)) {
      prev = null;
      continue;
    }
    const y = Math.min(last, Math.max(top, snap(raw, c)));
    // From the cell next to the previous one, so neighbours do not overlap.
    const from = prev === null || Math.abs(prev - y) <= c ? y : prev + (prev < y ? c : -c);
    ctx.fillRect(x, Math.min(from, y), c, Math.abs(y - from) + c);
    prev = y;
  }
}

/** A filled disc made of whole cells: the pixel-art circle. */
export function pixelDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  c: number,
): void {
  const rows = Math.max(1, Math.round(r / c));
  const x0 = snap(cx, c);
  const y0 = snap(cy, c);
  for (let k = -rows; k < rows; k++) {
    const dy = (k + 0.5) / rows;
    const half = Math.round(Math.sqrt(Math.max(0, 1 - dy * dy)) * rows);
    if (half > 0) ctx.fillRect(x0 - half * c, y0 + k * c, 2 * half * c, c);
  }
}
