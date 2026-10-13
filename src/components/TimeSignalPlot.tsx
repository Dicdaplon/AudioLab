import { useEffect, useRef } from "react";

interface TimeSignalPlotProps {
  signal: Float32Array;
  sampleRate: number;
  title?: string;
  height?: number;
}

export function TimeSignalPlot({ signal, sampleRate, title, height = 200 }: TimeSignalPlotProps) {
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
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    if (signal.length === 0) {
      ctx.fillStyle = "gray";
      ctx.font = "14px sans-serif";
      ctx.fillText("No data", 10, height / 2);
      return;
    }

    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    let minAmp = 0,
      maxAmp = 0;
    for (let i = 0; i < signal.length; i++) {
      if (Number.isFinite(signal[i])) {
        minAmp = Math.min(minAmp, signal[i]);
        maxAmp = Math.max(maxAmp, signal[i]);
      }
    }
    const ampRange = Math.max(Math.abs(minAmp), Math.abs(maxAmp));
    const scaledMin = -ampRange;
    const scaledMax = ampRange;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const zeroY = height - padding - ((0 - scaledMin) / (scaledMax - scaledMin)) * plotHeight;
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    const durationSeconds = signal.length / sampleRate;
    const timeStep = durationSeconds > 5 ? 1 : 0.5;
    for (let t = 0; t <= durationSeconds; t += timeStep) {
      const idx = Math.round((t / durationSeconds) * signal.length);
      const x = padding + (idx / signal.length) * plotWidth;
      ctx.fillText(`${t.toFixed(1)}s`, x, height - padding + 20);
    }

    ctx.textAlign = "right";
    for (let amp = -ampRange; amp <= ampRange; amp += ampRange / 2) {
      const y = height - padding - ((amp - scaledMin) / (scaledMax - scaledMin)) * plotHeight;
      ctx.fillText(amp.toFixed(2), padding - 10, y + 4);
    }

    ctx.strokeStyle = "rgb(70, 130, 180)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < signal.length; i++) {
      const ampNorm = Number.isFinite(signal[i])
        ? (signal[i] - scaledMin) / (scaledMax - scaledMin)
        : 0.5;
      const x = padding + (i / signal.length) * plotWidth;
      const y = height - padding - ampNorm * plotHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
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
    ctx.fillText("Amplitude →", 0, 0);
    ctx.restore();
  }, [signal, sampleRate, height]);

  return (
    <div className="time-signal-plot">
      <canvas ref={canvasRef} />
    </div>
  );
}
