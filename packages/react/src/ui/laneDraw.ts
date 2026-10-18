/**
 * Drawing of a scrolling play-along lane (`PlayAlongLane`). Targets travel right to left and reach the hit line at their
 * time; the band around the line is the measured tolerance (darker: on
 * time, lighter: still counted as early / late); every detected onset is a
 * red dot placed at the moment it was played (latency removed), so it sits
 * before or after its target as it scrolls by.
 */

import { beatsBetween, beatTime, isDownbeat, type BeatGrid } from "@audiolab/core";
import type { NoteResult, TimingTier, TimingTolerance } from "@audiolab/core/rhythm";
import type { VizTheme } from "./vizTheme";

export interface LaneGeometry {
  /** x of the hit line, in CSS px. */
  hitX: number;
  /** Scroll speed, in CSS px per second. */
  pxPerSecond: number;
  /** Radius of a labelled target, in CSS px (widen it for long chord names). */
  targetRadius: number;
}

export const LANE_GEOMETRY_DEFAULTS: LaneGeometry = {
  hitX: 72,
  pxPerSecond: 150,
  targetRadius: 18,
};

/** "pending" while ahead, then the timing verdict. */
export type LaneTargetState = "pending" | TimingTier;

export interface LaneTarget {
  time: number;
  /** Text inside the target (note or chord name); none for a rhythm tap. */
  label?: string;
  state: LaneTargetState;
  /** The note or chord played was not the expected one (drawn with a ring). */
  wrongLabel?: boolean;
}

export interface LaneOnset {
  /** Played time, latency removed (AudioContext s). */
  time: number;
  /** A metronome click picked up by the microphone, not a note. */
  echo?: boolean;
}

export interface LaneScene {
  now: number;
  tolerance: TimingTolerance | null;
  grid?: BeatGrid | null;
  targets: readonly LaneTarget[];
  onsets: readonly LaneOnset[];
}

export function drawLane(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: LaneScene,
  theme: VizTheme,
  geometry: LaneGeometry = LANE_GEOMETRY_DEFAULTS,
): void {
  const { now } = scene;
  const { hitX, pxPerSecond, targetRadius } = geometry;
  const xOf = (time: number, at: number) => hitX + (time - at) * pxPerSecond;
  ctx.fillStyle = theme.bed;
  ctx.fillRect(0, 0, width, height);

  // Beat and bar lines.
  if (scene.grid) {
    const from = now - hitX / pxPerSecond;
    const to = now + (width - hitX) / pxPerSecond;
    for (const b of beatsBetween(scene.grid, from, to)) {
      const x = Math.round(xOf(beatTime(scene.grid, b), now)) + 0.5;
      const bar = isDownbeat(scene.grid, b);
      ctx.strokeStyle = bar ? theme.gridStrong : theme.grid;
      ctx.lineWidth = bar ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  // Tolerance band around the hit line.
  if (scene.tolerance) {
    const w = (scene.tolerance.windowMs / 1000) * pxPerSecond;
    const o = (scene.tolerance.onTimeMs / 1000) * pxPerSecond;
    ctx.fillStyle = theme.marker;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(hitX - w, 0, 2 * w, height);
    ctx.globalAlpha = 1;
    ctx.fillRect(hitX - o, 0, 2 * o, height);
  }
  ctx.strokeStyle = theme.signalStrong;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hitX, 0);
  ctx.lineTo(hitX, height);
  ctx.stroke();

  // Targets.
  const mid = height / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 13px ${theme.fontUi}`;
  for (const t of scene.targets) {
    const x = xOf(t.time, now);
    if (x < -30 || x > width + 30) continue;
    ctx.globalAlpha = t.state === "pending" ? 1 : 0.6;
    ctx.fillStyle = TARGET_COLOURS[t.state](theme);
    if (t.label) {
      ctx.beginPath();
      ctx.arc(x, mid, targetRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (t.wrongLabel) {
        ctx.strokeStyle = theme.danger;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, mid, targetRadius + 3, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.fillStyle = theme.bed;
      ctx.fillText(t.label, x, mid);
    } else {
      // A tap: a tall bar centred on its time.
      ctx.fillRect(x - 4, mid - 22, 8, 44);
    }
    ctx.globalAlpha = 1;
  }

  // Detected onsets: red where a note was heard, grey for click echoes.
  for (const o of scene.onsets) {
    const x = xOf(o.time, now);
    if (x < -10 || x > width + 10) continue;
    ctx.fillStyle = o.echo ? theme.axis : theme.onset;
    ctx.beginPath();
    ctx.arc(x, o.echo ? height - 10 : mid + 30, o.echo ? 3 : 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/** Run `draw(now)` on every animation frame, sized for the device pixel ratio. */
export function startLaneLoop(
  canvas: HTMLCanvasElement,
  nowOf: () => number | null,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, now: number) => void,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx || typeof requestAnimationFrame !== "function") return () => undefined;
  let handle = 0;
  const frame = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
    if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const now = nowOf();
    if (now !== null) draw(ctx, width, height, now);
    handle = requestAnimationFrame(frame);
  };
  handle = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(handle);
}

const TARGET_COLOURS: Record<LaneTargetState, (theme: VizTheme) => string> = {
  pending: (t) => t.signal,
  onTime: (t) => t.modeMajor,
  early: (t) => t.threshold,
  late: (t) => t.trace2,
  missed: (t) => t.danger,
};

/** Lane state of a scored note: its timing verdict, or "pending". */
export function targetState(result: Pick<NoteResult, "resolved" | "tier">): LaneTargetState {
  return result.resolved && result.tier !== null ? result.tier : "pending";
}

/** A lane target for a scored note, with an optional name to draw in it. */
export function laneTarget(
  result: Pick<NoteResult, "resolved" | "tier" | "label" | "expectedTime">,
  label?: string,
): LaneTarget {
  return {
    time: result.expectedTime,
    label,
    state: targetState(result),
    wrongLabel: result.label === "wrong",
  };
}
