import { memo, useEffect, useRef } from "react";

import type { TempoEstimate } from "../analysis/engine/tempoAnalyzer";

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

/**
 * Canvas plot of the onset-envelope spectrum on a BPM axis, normalised to
 * its maximum, with the estimated tempo marked by a vertical line.
 */
export const TempoPlot = memo(function TempoPlot({
  spectrum,
  bpmAxis,
  estimate,
  title,
  height = 220,
}: TempoPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 600;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    if (spectrum.length < 2 || bpmAxis.length !== spectrum.length) {
      ctx.fillStyle = "gray";
      ctx.font = "14px sans-serif";
      ctx.fillText("No data", 10, height / 2);
      return;
    }

    const padding = 40;
    const plotWidth = Math.max(1, width - 2 * padding);
    const plotHeight = Math.max(1, height - 2 * padding);
    const bottom = height - padding;
    const minBpm = bpmAxis[0];
    const maxBpm = bpmAxis[bpmAxis.length - 1];
    const xOfBpm = (bpm: number) => padding + ((bpm - minBpm) / (maxBpm - minBpm)) * plotWidth;

    let peak = 0;
    for (let i = 0; i < spectrum.length; i++) peak = Math.max(peak, spectrum[i]);
    const yOf = (v: number) => bottom - (peak > 0 ? v / peak : 0) * plotHeight;

    // Axes.
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, bottom);
    ctx.lineTo(width - padding, bottom);
    ctx.stroke();

    // BPM ticks every 20 BPM.
    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    const tickStep = 20;
    for (let bpm = Math.ceil(minBpm / tickStep) * tickStep; bpm <= maxBpm; bpm += tickStep) {
      const x = xOfBpm(bpm);
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.fillText(`${bpm}`, x, bottom + 20);
    }

    // Spectrum.
    ctx.strokeStyle = "rgb(70, 130, 180)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < spectrum.length; i++) {
      const x = xOfBpm(bpmAxis[i]);
      const y = yOf(spectrum[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Estimate marker.
    if (estimate && estimate.bpm >= minBpm && estimate.bpm <= maxBpm) {
      const x = xOfBpm(estimate.bpm);
      ctx.strokeStyle = "rgba(220, 60, 60, 0.9)";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgb(220, 60, 60)";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = x > width / 2 ? "right" : "left";
      ctx.fillText(`${estimate.bpm.toFixed(1)} BPM`, x + (x > width / 2 ? -6 : 6), padding + 14);
    }

    if (title) {
      ctx.fillStyle = "black";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title, width / 2, padding - 10);
    }

    ctx.fillStyle = "black";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Beat rate (BPM) →", width / 2, height - 5);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Relative magnitude →", 0, 0);
    ctx.restore();
  }, [spectrum, bpmAxis, estimate, title, height]);

  return (
    <div className="tempo-plot">
      <canvas ref={canvasRef} role="img" aria-label={title ?? "Beat spectrum plot"} />
    </div>
  );
});
