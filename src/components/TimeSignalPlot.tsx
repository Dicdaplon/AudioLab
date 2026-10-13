import { useEffect, useRef } from "react";

import { axisTicks, decimateMinMax, signalRange, valueToPixel } from "../utils/plotMath";

interface TimeSignalPlotProps {
  /** Samples in chronological order. */
  signal: Float32Array;
  /** Rate of `signal` in Hz (used for the time axis). */
  sampleRate: number;
  title?: string;
  height?: number;
  /** Label of the vertical axis. Default "Amplitude". */
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
  title,
  height = 200,
  yLabel = "Amplitude",
}: TimeSignalPlotProps) {
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

    if (signal.length === 0 || !(sampleRate > 0)) {
      ctx.fillStyle = "gray";
      ctx.font = "14px sans-serif";
      ctx.fillText("No data", 10, height / 2);
      return;
    }

    const padding = 40;
    const plotWidth = Math.max(1, width - 2 * padding);
    const plotHeight = Math.max(1, height - 2 * padding);
    const bottom = height - padding;
    const range = signalRange(signal);
    const yOf = (v: number) => bottom - valueToPixel(v, range, 0, plotHeight);

    // Axes.
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, bottom);
    ctx.lineTo(width - padding, bottom);
    ctx.stroke();

    // Zero line.
    const zeroY = yOf(0);
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();

    // Time ticks.
    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    const durationSeconds = signal.length / sampleRate;
    const timeStep = durationSeconds > 5 ? 1 : 0.5;
    const timeTickCount = Math.floor(durationSeconds / timeStep);
    for (let i = 0; i <= timeTickCount; i++) {
      const t = i * timeStep;
      const x = padding + (t / durationSeconds) * plotWidth;
      ctx.fillText(`${t.toFixed(1)}s`, x, bottom + 20);
    }

    // Amplitude ticks (integer counter: never loops on a zero range).
    ctx.textAlign = "right";
    for (const v of axisTicks(range, 5)) {
      ctx.fillText(v.toFixed(2), padding - 10, yOf(v) + 4);
    }

    // Signal: one min/max pair per pixel column.
    const columns = Math.min(signal.length, Math.floor(plotWidth));
    const { min, max } = decimateMinMax(signal, columns);
    ctx.strokeStyle = "rgb(70, 130, 180)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c < columns; c++) {
      const x = padding + (columns > 1 ? (c / (columns - 1)) * plotWidth : 0);
      const yMax = yOf(max[c]);
      const yMin = yOf(min[c]);
      if (c === 0) ctx.moveTo(x, yMax);
      else ctx.lineTo(x, yMax);
      if (yMin !== yMax) ctx.lineTo(x, yMin);
    }
    ctx.stroke();

    if (title) {
      ctx.fillStyle = "black";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title, width / 2, padding - 10);
    }

    ctx.fillStyle = "black";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Time (s) →", width / 2, height - 5);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(`${yLabel} →`, 0, 0);
    ctx.restore();
  }, [signal, sampleRate, height, title, yLabel]);

  return (
    <div className="time-signal-plot">
      <canvas ref={canvasRef} role="img" aria-label={title ?? "Time signal plot"} />
    </div>
  );
}
