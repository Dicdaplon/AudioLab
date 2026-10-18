"use client";

/**
 * A scrolling play-along lane on a canvas: targets travel to a hit line,
 * the band around the line is the tolerance, beat and bar lines follow the
 * grid, and every detected onset is a red dot at the moment it was played
 * (click echoes in grey), so the player sees whether it came before or
 * after its target.
 *
 * Drawn on every animation frame from `now()` (the AudioContext time, e.g.
 * `() => analysis.clock.perfMsToContextTime(performance.now())`) and
 * `onsets()` (read each frame, e.g. `() => session.onsets`), so nothing
 * re-renders per frame. Targets are a prop: re-render when verdicts change.
 */

import { useEffect, useRef } from "react";

import type { BeatGrid } from "@audiolab/core";
import type { TimingTolerance } from "@audiolab/core/rhythm";
import {
  LANE_GEOMETRY_DEFAULTS,
  drawLane,
  startLaneLoop,
  type LaneGeometry,
  type LaneOnset,
  type LaneTarget,
} from "../ui/laneDraw";
import { useVizTheme } from "../ui/vizTheme";

export interface PlayAlongLaneProps {
  /** Current AudioContext time in s, or null while unknown. */
  now: () => number | null;
  targets: readonly LaneTarget[];
  /** Detected onsets, read every frame. Default none. */
  onsets?: () => readonly LaneOnset[];
  /** Tolerance drawn around the hit line. */
  tolerance?: TimingTolerance | null;
  /** Beat grid for beat and bar lines. */
  grid?: BeatGrid | null;
  geometry?: Partial<LaneGeometry>;
  className?: string;
  /** Accessible description; the lane itself is decorative. */
  label?: string;
}

const NO_ONSETS = () => [] as const;

export function PlayAlongLane({
  now,
  targets,
  onsets = NO_ONSETS,
  tolerance = null,
  grid = null,
  geometry,
  className,
  label,
}: PlayAlongLaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useVizTheme();
  const props = useRef({ now, targets, onsets, tolerance, grid, geometry });
  props.current = { now, targets, onsets, tolerance, grid, geometry };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLaneLoop(
      canvas,
      () => props.current.now(),
      (ctx, width, height, t) => {
        const p = props.current;
        drawLane(
          ctx,
          width,
          height,
          { now: t, tolerance: p.tolerance, grid: p.grid, targets: p.targets, onsets: p.onsets() },
          theme,
          { ...LANE_GEOMETRY_DEFAULTS, ...p.geometry },
        );
      },
    );
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={className ? `al-lane ${className}` : "al-lane"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
