import { useEffect, useRef } from "react";

import {
  drawAxes,
  drawBed,
  drawEmpty,
  drawHorizontalGrid,
  drawVerticalGrid,
  labelX,
  labelY,
  plotFrame,
  prepareCanvas,
  setTickFont,
} from "../ui/canvasPlot";
import { usePlotWidth } from "../ui/usePlotWidth";
import { useVizTheme } from "../ui/vizTheme";
import { axisTicks, decimateMinMax, signalRange, valueToPixel } from "../utils/plotMath";
import { PlotFigure } from "./Plot";

interface TimeSignalPlotProps {
  /** Samples in chronological order. */
  signal: Float32Array;
  /** Rate of `signal` in Hz (used for the time axis). */
  sampleRate: number;
  title?: string;
  height?: number;
  /** Title of the vertical axis. Default "Amplitude". */
  yLabel?: string;
}

/**
 * Canvas plot of a time signal. Long signals are reduced to one min/max
 * pair per pixel column, so the drawing cost is bounded by the canvas
 * width rather than the signal length. Non-negative signals (envelopes)
 * are drawn from zero upwards; bipolar signals get a symmetric axis.
 */
export function TimeSignalPlot({
  signal,
  sampleRate,
  title = "Time signal",
  height = 160,
  yLabel = "Amplitude",
}: TimeSignalPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameRef, width] = usePlotWidth();
  const t = useVizTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, width, height);
    if (!ctx) return;
    const frame = plotFrame(width, height, t);

    if (signal.length === 0 || !(sampleRate > 0)) {
      drawEmpty(ctx, frame, t);
      return;
    }

    drawBed(ctx, frame, t);

    const range = signalRange(signal);
    const yOf = (v: number) => frame.bottom - valueToPixel(v, range, 0, frame.plotHeight);

    // Amplitude grid (integer counter: never loops on a zero range) and the zero line.
    const ticks = axisTicks(range, 5);
    drawHorizontalGrid(ctx, frame, ticks.filter((v) => v !== 0).map(yOf), t.grid);
    drawHorizontalGrid(ctx, frame, [yOf(0)], t.gridStrong);

    // Time grid.
    const durationSeconds = signal.length / sampleRate;
    const timeStep = durationSeconds > 5 ? 1 : 0.5;
    const timeTickCount = Math.floor(durationSeconds / timeStep);
    const timeTicks: number[] = [];
    for (let i = 0; i <= timeTickCount; i++) timeTicks.push(i * timeStep);
    const xOfTime = (s: number) => frame.left + (s / durationSeconds) * frame.plotWidth;
    drawVerticalGrid(ctx, frame, timeTicks.slice(1).map(xOfTime), t.grid);

    drawAxes(ctx, frame, t);

    setTickFont(ctx, t);
    for (const v of ticks) labelY(ctx, frame, yOf(v), v.toFixed(2));
    for (const s of timeTicks) labelX(ctx, frame, xOfTime(s), `${s.toFixed(1)}s`);

    // Signal: one min/max pair per pixel column.
    const columns = Math.min(signal.length, Math.floor(frame.plotWidth));
    const { min, max } = decimateMinMax(signal, columns);
    ctx.strokeStyle = t.signal;
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let c = 0; c < columns; c++) {
      const x = frame.left + (columns > 1 ? (c / (columns - 1)) * frame.plotWidth : 0);
      const yMax = yOf(max[c]);
      const yMin = yOf(min[c]);
      if (c === 0) ctx.moveTo(x, yMax);
      else ctx.lineTo(x, yMax);
      if (yMin !== yMax) ctx.lineTo(x, yMin);
    }
    ctx.stroke();
  }, [signal, sampleRate, width, height, t]);

  return (
    <PlotFigure title={title} xLabel="Time (s)" yLabel={yLabel} frameRef={frameRef}>
      <canvas ref={canvasRef} role="img" aria-label={title} />
    </PlotFigure>
  );
}
