/**
 * Small canvas helpers shared by the stage visuals: shapes, easing, angle
 * smoothing and peak-normalised chroma. Pure functions of their arguments;
 * nothing here allocates per call beyond what the canvas API does.
 */

export const TAU = Math.PI * 2;

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** cubic-bezier(0.2, 0, 0, 1)-like ease-out (Loupe's --al-ease-out), as a cubic. */
export function easeOut(t: number): number {
  const u = 1 - clamp01(t);
  return 1 - u * u * u;
}

export function easeIn(t: number): number {
  const u = clamp01(t);
  return u * u * u;
}

/** Exponential approach factor for a time constant `tau` over `dt` seconds. */
export function approach(dt: number, tau: number): number {
  return tau <= 0 ? 1 : 1 - Math.exp(-dt / tau);
}

/** Wrap an angle to [-π, π). */
export function wrapAngle(a: number): number {
  let x = (a + Math.PI) % TAU;
  if (x < 0) x += TAU;
  return x - Math.PI;
}

/** Move `from` towards `to` along the shortest arc, with time constant `tau`. */
export function approachAngle(from: number, to: number, dt: number, tau: number): number {
  return from + wrapAngle(to - from) * approach(dt, tau);
}

/** Quantise `x` to steps of `step`. */
export function snap(x: number, step: number): number {
  return Math.round(x / step) * step;
}

/** Largest entry of a chroma (or 0). */
export function peakOf(values: ArrayLike<number>): number {
  let m = 0;
  for (let i = 0; i < values.length; i++) if (values[i] > m) m = values[i];
  return m;
}

/** Annular sector path between angles a0 and a1 (radians). */
export function sectorPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r1, a0, a1);
  ctx.arc(cx, cy, r0, a1, a0, true);
  ctx.closePath();
}

/** Regular polygon path (8 sides = the Loupe octagon), first vertex at `rotation`. */
export function polygonPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  sides: number,
  rotation = Math.PI / sides,
): void {
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = rotation + (i * TAU) / sides;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Text with a hard outline and a pixel drop shadow, readable over any
 * background (no blur: blur bands under stream compression).
 */
export function outlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  font: string,
  fill: string,
  outline = "#090c0b",
): void {
  ctx.font = `${size}px ${font}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, Math.round(size * 0.12));
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  const shadow = Math.max(2, Math.round(size / 16));
  ctx.fillText(text, x + shadow, y + shadow);
  ctx.strokeStyle = outline;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}
