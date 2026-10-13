import { useEffect, useRef } from "react";

import { spectrumSlopeDbPerHz } from "../analysis/spectrumSlope";
import { A_MINOR_PENTATONIC_PITCH_CLASSES, pitchClassFrequencies } from "../utils/notes";

interface SpectrumPlotProps {
  spectrumDb: Float32Array;
  /** Bin spacing in Hz of `spectrumDb`. */
  binHz: number;
  noiseFloorDb: number;
  title?: string;
  height?: number;
  /** Overlay the frequency slope of the spectrum (dB/Hz), centred mid-plot. */
  showSlope?: boolean;
  /** Overlay the A minor pentatonic notes as vertical reference lines. */
  showScaleNotes?: boolean;
  minFreqHz?: number;
  maxFreqHz?: number;
}

/**
 * Canvas plot of a dB spectrum over [minFreqHz, maxFreqHz], with a noise
 * floor line and optional slope / reference-note overlays. Every overlay
 * uses the same bin → x mapping as the spectrum itself.
 */
export function SpectrumPlot({
  spectrumDb,
  binHz,
  noiseFloorDb,
  title,
  height = 300,
  showSlope = false,
  showScaleNotes = false,
  minFreqHz = 0,
  maxFreqHz = Infinity,
}: SpectrumPlotProps) {
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

    if (spectrumDb.length === 0 || !(binHz > 0)) {
      ctx.fillStyle = "gray";
      ctx.font = "14px sans-serif";
      ctx.fillText("No data", 10, height / 2);
      return;
    }

    const padding = 40;
    const plotWidth = Math.max(1, width - 2 * padding);
    const plotHeight = Math.max(1, height - 2 * padding);
    const bottom = height - padding;

    // Displayed bin range (shared by every curve and overlay).
    const maxFreq = (spectrumDb.length - 1) * binHz;
    const displayMaxFreq = Math.min(maxFreqHz, maxFreq);
    const minBinIdx = Math.max(0, Math.floor(minFreqHz / binHz));
    const maxBinIdx = Math.min(spectrumDb.length - 1, Math.floor(displayMaxFreq / binHz));
    const numBinsDisplay = Math.max(1, maxBinIdx - minBinIdx);
    const xOfBin = (bin: number) => padding + ((bin - minBinIdx) / numBinsDisplay) * plotWidth;

    // dB range over the displayed bins.
    let minDb = -100;
    let maxDb = 0;
    for (let k = minBinIdx; k <= maxBinIdx; k++) {
      const db = spectrumDb[k];
      if (Number.isFinite(db)) {
        minDb = Math.min(minDb, db);
        maxDb = Math.max(maxDb, db);
      }
    }
    if (maxDb <= minDb) maxDb = minDb + 20;
    const yOfDb = (db: number) => bottom - ((db - minDb) / (maxDb - minDb)) * plotHeight;

    // Axes.
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, bottom);
    ctx.lineTo(width - padding, bottom);
    ctx.stroke();

    // dB grid.
    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    for (let db = Math.ceil(minDb / 10) * 10; db <= maxDb; db += 10) {
      const y = yOfDb(db);
      ctx.strokeStyle = db === 0 ? "black" : "#ddd";
      ctx.lineWidth = db === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.fillText(`${db}`, padding - 10, y + 4);
    }

    // Frequency labels.
    ctx.textAlign = "center";
    const freqSpan = displayMaxFreq - minFreqHz;
    const freqStep =
      freqSpan > 10000
        ? 1000
        : freqSpan > 5000
          ? 500
          : freqSpan > 500
            ? 100
            : freqSpan > 100
              ? 25
              : 10;
    const formatFreq = (f: number) => (displayMaxFreq >= 1000 ? `${f / 1000}k` : `${f}`);
    for (
      let freq = Math.ceil(minFreqHz / freqStep) * freqStep;
      freq <= displayMaxFreq;
      freq += freqStep
    ) {
      const bin = freq / binHz;
      if (bin < minBinIdx || bin > maxBinIdx) continue;
      ctx.fillText(formatFreq(freq), xOfBin(bin), bottom + 20);
    }

    // Reference notes (A minor pentatonic).
    if (showScaleNotes) {
      ctx.strokeStyle = "rgba(100, 200, 100, 0.4)";
      ctx.lineWidth = 1;
      for (const freq of pitchClassFrequencies(
        A_MINOR_PENTATONIC_PITCH_CLASSES,
        minFreqHz,
        displayMaxFreq,
      )) {
        const bin = freq / binHz;
        if (bin < minBinIdx || bin > maxBinIdx) continue;
        const x = xOfBin(bin);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
    }

    // Spectrum.
    ctx.strokeStyle = "rgb(70, 130, 180)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = minBinIdx; k <= maxBinIdx; k++) {
      const db = spectrumDb[k];
      const y = Number.isFinite(db) ? yOfDb(db) : bottom;
      if (k === minBinIdx) ctx.moveTo(xOfBin(k), y);
      else ctx.lineTo(xOfBin(k), y);
    }
    ctx.stroke();

    // Slope overlay (dB/Hz), same bin range, centred on the plot's mid-height.
    if (showSlope) {
      const slope = spectrumSlopeDbPerHz(spectrumDb, binHz);
      let slopeMax = 0;
      for (let k = minBinIdx; k <= maxBinIdx; k++) {
        slopeMax = Math.max(slopeMax, Math.abs(slope[k]));
      }
      const scale = slopeMax > 0 ? plotHeight / (2 * slopeMax) : 0;
      const midY = bottom - plotHeight / 2;

      ctx.strokeStyle = "rgba(200, 100, 100, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = minBinIdx; k <= maxBinIdx; k++) {
        const y = midY - slope[k] * scale;
        if (k === minBinIdx) ctx.moveTo(xOfBin(k), y);
        else ctx.lineTo(xOfBin(k), y);
      }
      ctx.stroke();
    }

    // Noise floor.
    if (Number.isFinite(noiseFloorDb)) {
      const y = yOfDb(noiseFloorDb);
      ctx.strokeStyle = "red";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.setLineDash([]);
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
    ctx.fillText("Frequency (Hz) →", width / 2, height - 5);
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Magnitude (dB) →", 0, 0);
    ctx.restore();
  }, [
    spectrumDb,
    binHz,
    noiseFloorDb,
    height,
    title,
    showSlope,
    showScaleNotes,
    minFreqHz,
    maxFreqHz,
  ]);

  return (
    <div className="spectrum-plot">
      <canvas ref={canvasRef} role="img" aria-label={title ?? "Spectrum plot"} />
    </div>
  );
}
