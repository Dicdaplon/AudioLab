"use client";

/**
 * The canvas every stage visual draws in: a fixed-size, transparent canvas
 * with its own requestAnimationFrame loop.
 *
 * With `pixel` > 1 the visual draws on a low-resolution buffer (one unit per
 * pixel-art cell) that is scaled up with nearest-neighbour sampling: bold
 * cells survive stream compression where thin lines and smooth gradients
 * band, and there are `pixel²` times fewer pixels to fill. The device pixel
 * ratio is ignored on purpose (OBS renders a browser source at its exact
 * size). Nothing is drawn on the server; the loop starts in an effect.
 */

import { useEffect, useRef, type CSSProperties } from "react";

export interface StageFrame {
  /** Seconds on the performance clock (same clock as `StageSignals`). */
  now: number;
  /** Seconds since the previous frame (0 on the first one, capped at 0.1). */
  dt: number;
  /** Drawing width, in cells when `pixel` > 1. */
  width: number;
  height: number;
  /** Cell size in CSS px (1 = smooth). */
  pixel: number;
}

export type StageDraw = (ctx: CanvasRenderingContext2D, frame: StageFrame) => void;

export interface StageCanvasProps {
  /** CSS size of the canvas. */
  width: number;
  height: number;
  /** Pixel-art cell size; 1 draws at full resolution. Default 1. */
  pixel?: number;
  /** Called on every animation frame after the buffer is cleared. Read through a ref: may change freely. */
  draw: StageDraw;
  className?: string;
  style?: CSSProperties;
  /** Accessible description; the canvas is decorative (aria-hidden) without it. */
  label?: string;
}

export function StageCanvas({
  width,
  height,
  pixel = 1,
  draw,
  className,
  style,
  label,
}: StageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof requestAnimationFrame !== "function") return;
    const out = canvas.getContext("2d");
    if (!out) return;
    const cell = Math.max(1, Math.round(pixel));
    const w = Math.ceil(width / cell);
    const h = Math.ceil(height / cell);
    canvas.width = width;
    canvas.height = height;

    let ctx = out;
    let buffer: HTMLCanvasElement | null = null;
    if (cell > 1) {
      buffer = document.createElement("canvas");
      buffer.width = w;
      buffer.height = h;
      ctx = buffer.getContext("2d") ?? out;
    }

    let handle = 0;
    let last: number | null = null;
    const tick = (ms: number) => {
      const now = ms / 1000;
      const dt = last === null ? 0 : Math.min(0.1, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);
      drawRef.current(ctx, { now, dt, width: w, height: h, pixel: cell });
      if (buffer) {
        out.clearRect(0, 0, width, height);
        out.imageSmoothingEnabled = false;
        out.drawImage(buffer, 0, 0, w * cell, h * cell);
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [width, height, pixel]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: "block", width, height, ...style }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
