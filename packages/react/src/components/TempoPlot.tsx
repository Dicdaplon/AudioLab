"use client";

import { memo, useEffect, useRef } from "react";

import type { TempoEstimate } from "@audiolab/core";
import {
  crisp,
  drawAxes,
  drawBed,
  drawEmpty,
  drawVerticalGrid,
  haloText,
  labelX,
  labelY,
  plotFrame,
  prepareCanvas,
  setTickFont,
} from "../ui/canvasPlot";
import { usePlotWidth } from "../ui/usePlotWidth";
import { useVizTheme } from "../ui/vizTheme";
import { PlotFigure, type LegendItem } from "./Plot";

interface TempoPlotProps {
  /** Envelope spectrum magnitude, one value per `bpmAxis` entry. */
  spectrum: Float32Array;
  /** BPM of each spectrum entry (ascending). */
  bpmAxis: Float32Array;
  /** Highlighted estimate, if any. */
  estimate: TempoEstimate | null;
  title?: string;
  height?: number;
}

const LEGEND: LegendItem[] = [
  { label: "envelope spectrum", kind: "line", colour: "var(--viz-signal)" },
  { label: "estimate", kind: "dash", colour: "var(--viz-threshold)" },
];

/**
 * Canvas plot of the onset-envelope spectrum on a BPM axis, normalised to
 * its maximum, with the estimated tempo marked by a vertical line.
 */
export const TempoPlot = memo(function TempoPlot({
  spectrum,
  bpmAxis,
  estimate,
  title = "Beat spectrum",
  height = 180,
}: TempoPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameRef, width] = usePlotWidth();
  const t = useVizTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, width, height);
    if (!ctx) return;
    const frame = plotFrame(width, height, t);

    if (spectrum.length < 2 || bpmAxis.length !== spectrum.length) {
      drawEmpty(ctx, frame, t);
      return;
    }

    drawBed(ctx, frame, t);

    const minBpm = bpmAxis[0];
    const maxBpm = bpmAxis[bpmAxis.length - 1];
    const xOfBpm = (bpm: number) =>
      frame.left + ((bpm - minBpm) / (maxBpm - minBpm)) * frame.plotWidth;

    let peak = 0;
    for (let i = 0; i < spectrum.length; i++) peak = Math.max(peak, spectrum[i]);
    const yOf = (v: number) => frame.bottom - (peak > 0 ? v / peak : 0) * frame.plotHeight;

    // BPM grid every 20 BPM.
    const tickStep = 20;
    const bpmTicks: number[] = [];
    for (let bpm = Math.ceil(minBpm / tickStep) * tickStep; bpm <= maxBpm; bpm += tickStep) {
      bpmTicks.push(bpm);
    }
    drawVerticalGrid(ctx, frame, bpmTicks.map(xOfBpm), t.grid);

    drawAxes(ctx, frame, t);

    setTickFont(ctx, t);
    for (const bpm of bpmTicks) labelX(ctx, frame, xOfBpm(bpm), `${bpm}`);
    for (const v of [0, 0.5, 1]) labelY(ctx, frame, yOf(v * peak), v.toFixed(1));

    // Area, then the trace.
    ctx.fillStyle = t.signalFill;
    ctx.beginPath();
    ctx.moveTo(xOfBpm(bpmAxis[0]), frame.bottom);
    for (let i = 0; i < spectrum.length; i++) ctx.lineTo(xOfBpm(bpmAxis[i]), yOf(spectrum[i]));
    ctx.lineTo(xOfBpm(bpmAxis[spectrum.length - 1]), frame.bottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = t.signal;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < spectrum.length; i++) {
      const x = xOfBpm(bpmAxis[i]);
      const y = yOf(spectrum[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Estimate marker: what we concluded, in the accent.
    if (estimate && estimate.bpm >= minBpm && estimate.bpm <= maxBpm) {
      const x = crisp(xOfBpm(estimate.bpm));
      ctx.strokeStyle = t.threshold;
      ctx.setLineDash([6, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, frame.top);
      ctx.lineTo(x, frame.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      setTickFont(ctx, t);
      const onRight = x > frame.width / 2;
      ctx.textAlign = onRight ? "right" : "left";
      ctx.textBaseline = "top";
      haloText(
        ctx,
        t,
        `${estimate.bpm.toFixed(1)} BPM`,
        x + (onRight ? -6 : 6),
        frame.top + 4,
        t.threshold,
      );
    }
  }, [spectrum, bpmAxis, estimate, width, height, t]);

  return (
    <PlotFigure
      title={title}
      legend={LEGEND}
      xLabel="Beat rate (BPM)"
      yLabel="Relative magnitude"
      frameRef={frameRef}
    >
      <canvas ref={canvasRef} role="img" aria-label={title} />
    </PlotFigure>
  );
});
