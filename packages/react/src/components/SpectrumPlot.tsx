"use client";

import { useEffect, useRef } from "react";

import {
  A_MINOR_PENTATONIC_PITCH_CLASSES,
  pitchClassFrequencies,
  spectrumSlopeDbPerHz,
} from "@audiolab/core";
import {
  crisp,
  drawAxes,
  drawBed,
  drawEmpty,
  drawHorizontalGrid,
  drawVerticalGrid,
  formatHz,
  formatSigned,
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

interface SpectrumPlotProps {
  spectrumDb: Float32Array;
  /** Bin spacing in Hz of `spectrumDb`. */
  binHz: number;
  noiseFloorDb: number;
  title?: string;
  /** Extra mono annotation after the frequency range, e.g. the noise floor. */
  meta?: string;
  height?: number;
  /** Overlay the frequency slope of the spectrum (dB/Hz), centred mid-plot. */
  showSlope?: boolean;
  /** Overlay the A minor pentatonic notes as vertical reference lines. */
  showScaleNotes?: boolean;
  minFreqHz?: number;
  maxFreqHz?: number;
}

const LEGEND: Record<"signal" | "floor" | "slope" | "notes", LegendItem> = {
  signal: { label: "magnitude", kind: "line", colour: "var(--al-viz-signal)" },
  floor: { label: "noise floor", kind: "dash", colour: "var(--al-viz-noise-floor)" },
  slope: { label: "slope", kind: "line", colour: "var(--al-viz-trace-2)" },
  notes: { label: "A minor pentatonic", kind: "line", colour: "var(--al-viz-marker)" },
};

/**
 * Canvas plot of a dB spectrum over [minFreqHz, maxFreqHz], with a noise
 * floor line and optional slope / reference-note overlays. Every overlay
 * uses the same bin → x mapping as the spectrum itself.
 */
export function SpectrumPlot({
  spectrumDb,
  binHz,
  noiseFloorDb,
  title = "Magnitude spectrum",
  meta,
  height = 280,
  showSlope = false,
  showScaleNotes = false,
  minFreqHz = 0,
  maxFreqHz = Infinity,
}: SpectrumPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameRef, width] = usePlotWidth();
  const t = useVizTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = prepareCanvas(canvas, width, height);
    if (!ctx) return;
    const frame = plotFrame(width, height, t);

    if (spectrumDb.length === 0 || !(binHz > 0)) {
      drawEmpty(ctx, frame, t);
      return;
    }

    drawBed(ctx, frame, t);

    // Displayed bin range (shared by every curve and overlay).
    const maxFreq = (spectrumDb.length - 1) * binHz;
    const displayMaxFreq = Math.min(maxFreqHz, maxFreq);
    const minBinIdx = Math.max(0, Math.floor(minFreqHz / binHz));
    const maxBinIdx = Math.min(spectrumDb.length - 1, Math.floor(displayMaxFreq / binHz));
    const numBinsDisplay = Math.max(1, maxBinIdx - minBinIdx);
    const xOfBin = (bin: number) =>
      frame.left + ((bin - minBinIdx) / numBinsDisplay) * frame.plotWidth;

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
    const yOfDb = (db: number) =>
      frame.bottom - ((db - minDb) / (maxDb - minDb)) * frame.plotHeight;

    // dB grid: minor lines every 10 dB, the 0 dB line stronger.
    const dbTicks: number[] = [];
    for (let db = Math.ceil(minDb / 10) * 10; db <= maxDb; db += 10) dbTicks.push(db);
    drawHorizontalGrid(ctx, frame, dbTicks.filter((db) => db !== 0).map(yOfDb), t.grid);
    if (dbTicks.includes(0)) drawHorizontalGrid(ctx, frame, [yOfDb(0)], t.gridStrong);

    // Frequency grid.
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
    const freqTicks: number[] = [];
    for (
      let freq = Math.ceil(minFreqHz / freqStep) * freqStep;
      freq <= displayMaxFreq;
      freq += freqStep
    ) {
      const bin = freq / binHz;
      if (bin >= minBinIdx && bin <= maxBinIdx) freqTicks.push(freq);
    }
    // Label every tick, but keep the grid sparse enough to read.
    const labelEvery = Math.max(1, Math.ceil(freqTicks.length / 10));
    drawVerticalGrid(
      ctx,
      frame,
      freqTicks.filter((_, i) => i % labelEvery === 0).map((f) => xOfBin(f / binHz)),
      t.grid,
    );

    drawAxes(ctx, frame, t);

    setTickFont(ctx, t);
    for (const db of dbTicks) labelY(ctx, frame, yOfDb(db), formatSigned(db));
    freqTicks.forEach((f, i) => {
      if (i % labelEvery === 0) labelX(ctx, frame, xOfBin(f / binHz), formatHz(f));
    });

    // Reference notes (A minor pentatonic), behind the trace.
    if (showScaleNotes) {
      ctx.strokeStyle = t.marker;
      ctx.lineWidth = 1;
      for (const freq of pitchClassFrequencies(
        A_MINOR_PENTATONIC_PITCH_CLASSES,
        minFreqHz,
        displayMaxFreq,
      )) {
        const bin = freq / binHz;
        if (bin < minBinIdx || bin > maxBinIdx) continue;
        const x = crisp(xOfBin(bin));
        ctx.beginPath();
        ctx.moveTo(x, frame.top);
        ctx.lineTo(x, frame.bottom);
        ctx.stroke();
      }
    }

    // Area under the spectrum, then the trace.
    const yOfBinSafe = (k: number) => {
      const db = spectrumDb[k];
      return Number.isFinite(db) ? yOfDb(db) : frame.bottom;
    };
    ctx.fillStyle = t.signalFill;
    ctx.beginPath();
    ctx.moveTo(xOfBin(minBinIdx), frame.bottom);
    for (let k = minBinIdx; k <= maxBinIdx; k++) ctx.lineTo(xOfBin(k), yOfBinSafe(k));
    ctx.lineTo(xOfBin(maxBinIdx), frame.bottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = t.signal;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let k = minBinIdx; k <= maxBinIdx; k++) {
      const y = yOfBinSafe(k);
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
      const scale = slopeMax > 0 ? frame.plotHeight / (2 * slopeMax) : 0;
      const midY = frame.bottom - frame.plotHeight / 2;

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = t.trace2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = minBinIdx; k <= maxBinIdx; k++) {
        const y = midY - slope[k] * scale;
        if (k === minBinIdx) ctx.moveTo(xOfBin(k), y);
        else ctx.lineTo(xOfBin(k), y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Noise floor: dashed, labelled at its right end.
    if (Number.isFinite(noiseFloorDb)) {
      const y = crisp(yOfDb(noiseFloorDb));
      ctx.strokeStyle = t.noiseFloor;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(frame.left, y);
      ctx.lineTo(frame.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      setTickFont(ctx, t);
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      haloText(
        ctx,
        t,
        `floor ${formatSigned(noiseFloorDb, 1)} dB`,
        frame.right - 4,
        y - 3,
        t.axisLabel,
      );
    }
  }, [
    spectrumDb,
    binHz,
    noiseFloorDb,
    width,
    height,
    showSlope,
    showScaleNotes,
    minFreqHz,
    maxFreqHz,
    t,
  ]);

  const legend = [LEGEND.signal, LEGEND.floor];
  if (showSlope) legend.push(LEGEND.slope);
  if (showScaleNotes) legend.push(LEGEND.notes);
  const maxShown = Number.isFinite(maxFreqHz) ? maxFreqHz : (spectrumDb.length - 1) * binHz;

  return (
    <PlotFigure
      title={title}
      meta={`${formatHz(minFreqHz)}–${formatHz(maxShown)} Hz${meta ? ` · ${meta}` : ""}`}
      legend={legend}
      xLabel="Frequency (Hz)"
      yLabel="Magnitude (dB)"
      frameRef={frameRef}
    >
      <canvas ref={canvasRef} role="img" aria-label={title} />
    </PlotFigure>
  );
}
