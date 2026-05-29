import { useEffect, useRef } from "react";

interface TimeSignalPlotProps {
  signal: Float32Array;
  sampleRate: number;
  title?: string;
  height?: number;
}

/**
 * Canvas-based time-domain signal visualization.
 * Shows the raw waveform of the input audio.
 */
export function TimeSignalPlot({
  signal,
  sampleRate,
  title,
  height = 200,
}: TimeSignalPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth ?? 600;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    // Clear canvas.
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    if (signal.length === 0) {
      ctx.fillStyle = "gray";
      ctx.font = "14px sans-serif";
      ctx.fillText("No signal", 10, height / 2);
      return;
    }

    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    const centerY = height / 2;

    // Draw axes.
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Find signal range.
    let maxAmp = 1e-6;
    for (const s of signal) {
      maxAmp = Math.max(maxAmp, Math.abs(s));
    }

    // Draw center line.
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(width - padding, centerY);
    ctx.stroke();

    // Draw waveform.
    ctx.strokeStyle = "rgb(70, 130, 180)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const downsample = Math.ceil(signal.length / plotWidth);
    for (let i = 0; i < signal.length; i += downsample) {
      const sample = signal[i];
      const x = padding + (i / signal.length) * plotWidth;
      const yNorm = sample / maxAmp; // Normalize to [-1, 1].
      const y = centerY - yNorm * (plotHeight / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw time axis labels.
    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    const durationSec = signal.length / sampleRate;
    const timeStep = durationSec > 1 ? 0.1 : 0.01;
    for (let t = 0; t <= durationSec; t += timeStep) {
      const idx = Math.round(t * sampleRate);
      if (idx >= signal.length) break;
      const x = padding + (idx / signal.length) * plotWidth;
      ctx.fillText(`${t.toFixed(2)}s`, x, height - padding + 15);
    }

    // Draw labels.
    ctx.fillStyle = "black";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Time →", width / 2, height - 5);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Amplitude →", 0, 0);
    ctx.restore();
  }, [signal, sampleRate, height]);

  return (
    <div className="time-signal-plot">
      {title && <h4>{title}</h4>}
      <canvas ref={canvasRef} style={{ border: "1px solid #ccc", width: "100%", height }} />
    </div>
  );
}
