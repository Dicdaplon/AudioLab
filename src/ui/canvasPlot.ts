/**
 * Shared canvas plumbing for the plots: DPR-scaled context, the plot frame
 * geometry derived from the padding tokens, and the bed / axes / empty
 * state every plot draws the same way.
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

/** Size the canvas for the device pixel ratio and return a scaled context. */
export function prepareCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
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

/** Snap a coordinate to the pixel centre so 1 px lines stay crisp. */
export const crisp = (v: number): number => Math.round(v) + 0.5;

export function drawBed(ctx: CanvasRenderingContext2D, frame: PlotFrame, theme: VizTheme): void {
  ctx.fillStyle = theme.bed;
  ctx.fillRect(0, 0, frame.width, frame.height);
}

/** Left and bottom axis strokes. */
export function drawAxes(ctx: CanvasRenderingContext2D, frame: PlotFrame, theme: VizTheme): void {
  ctx.strokeStyle = theme.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(crisp(frame.left), frame.top);
  ctx.lineTo(crisp(frame.left), crisp(frame.bottom));
  ctx.lineTo(frame.right, crisp(frame.bottom));
  ctx.stroke();
}

/** Horizontal grid lines at the given y positions, in one path. */
export function drawHorizontalGrid(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  ys: readonly number[],
  colour: string,
): void {
  if (ys.length === 0) return;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const y of ys) {
    ctx.moveTo(frame.left, crisp(y));
    ctx.lineTo(frame.right, crisp(y));
  }
  ctx.stroke();
}

/** Vertical grid lines at the given x positions, in one path. */
export function drawVerticalGrid(
  ctx: CanvasRenderingContext2D,
  frame: PlotFrame,
  xs: readonly number[],
  colour: string,
): void {
  if (xs.length === 0) return;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const x of xs) {
    ctx.moveTo(crisp(x), frame.top);
    ctx.lineTo(crisp(x), frame.bottom);
  }
  ctx.stroke();
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
  ctx.lineWidth = 3;
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
  ctx.font = `400 13px ${theme.fontUi}`;
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
