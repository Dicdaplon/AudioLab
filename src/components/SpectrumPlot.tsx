import { useEffect, useRef } from "react";

interface SpectrumPlotProps {
  spectrumDb: Float32Array;
  binHz: number;
  noiseFloorDb: number;
  title?: string;
  height?: number;
}

/**
 * Canvas-based FFT spectrum visualization (Section 1).
 * Displays magnitude spectrum in dB with noise floor overlay.
 */
export function SpectrumPlot({
  spectrumDb,
  binHz,
  noiseFloorDb,
  title,
  height = 300,
}: SpectrumPlotProps) {
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

    if (spectrumDb.length === 0) {
      ctx.fillStyle = "gray";
      ctx.font = "14px sans-serif";
      ctx.fillText("No data", 10, height / 2);
      return;
    }

    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Find dB range.
    let minDb = -100;
    let maxDb = 0;
    for (let k = 0; k < spectrumDb.length; k++) {
      const db = spectrumDb[k];
      if (Number.isFinite(db)) {
        minDb = Math.min(minDb, db);
        maxDb = Math.max(maxDb, db);
      }
    }
    if (maxDb <= minDb) maxDb = minDb + 20;

    // Draw axes.
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid lines and labels.
    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";

    // Y-axis: dB values.
    for (let db = Math.ceil(minDb / 10) * 10; db <= maxDb; db += 10) {
      const y = height - padding - ((db - minDb) / (maxDb - minDb)) * plotHeight;
      ctx.strokeStyle = db === 0 ? "black" : "#ddd";
      ctx.lineWidth = db === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.fillText(`${db}`, padding - 10, y + 4);
    }

    // X-axis: frequency labels.
    ctx.textAlign = "center";
    const maxFreq = spectrumDb.length * binHz;
    const freqStep = maxFreq > 10000 ? 1000 : maxFreq > 5000 ? 500 : 100;
    for (let freq = freqStep; freq <= maxFreq; freq += freqStep) {
      const binIdx = freq / binHz;
      if (binIdx >= spectrumDb.length) break;
      const x = padding + (binIdx / spectrumDb.length) * plotWidth;
      ctx.fillText(`${freq / 1000}k`, x, height - padding + 20);
    }

    // Draw spectrum.
    ctx.strokeStyle = "rgb(70, 130, 180)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < spectrumDb.length; k++) {
      const db = spectrumDb[k];
      const dbNorm = Number.isFinite(db)
        ? (db - minDb) / (maxDb - minDb)
        : 0;
      const x = padding + (k / spectrumDb.length) * plotWidth;
      const y = height - padding - dbNorm * plotHeight;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw noise floor line.
    if (Number.isFinite(noiseFloorDb)) {
      const nfNorm = (noiseFloorDb - minDb) / (maxDb - minDb);
      const nfY = height - padding - nfNorm * plotHeight;
      ctx.strokeStyle = "red";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, nfY);
      ctx.lineTo(width - padding, nfY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw labels.
    ctx.fillStyle = "black";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Frequency (Hz) →", width / 2, height - 5);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Magnitude (dB) →", 0, 0);
    ctx.restore();
  }, [spectrumDb, binHz, noiseFloorDb, height]);

  return (
    <div className="spectrum-plot">
      {title && <h4>{title}</h4>}
      <canvas ref={canvasRef} style={{ border: "1px solid #ccc", width: "100%", height }} />
    </div>
  );
}
