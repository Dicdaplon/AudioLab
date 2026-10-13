import { useEffect, useRef } from "react";
import { midiToFreq } from "../utils/notes";

interface SpectrumPlotProps {
  spectrumDb: Float32Array;
  binHz: number;
  noiseFloorDb: number;
  title?: string;
  height?: number;
  showDerivative?: boolean;
  showScaleNotes?: boolean;
  minFreqHz?: number;
  maxFreqHz?: number;
}

/**
 * Compute spatial (frequency-domain) derivative of spectrum.
 * dB/Hz approximation using centered finite difference.
 */
function spatialDerivative(spectrumDb: Float32Array): Float32Array {
  const n = spectrumDb.length;
  const deriv = new Float32Array(n);
  for (let k = 1; k < n - 1; k++) {
    deriv[k] = (spectrumDb[k + 1] - spectrumDb[k - 1]) / 2;
  }
  // Handle edges with forward/backward difference.
  if (n > 0) deriv[0] = spectrumDb[1] - spectrumDb[0];
  if (n > 1) deriv[n - 1] = spectrumDb[n - 1] - spectrumDb[n - 2];
  return deriv;
}

// Major scale pitch classes: A, C, D, E, G
const MAJOR_SCALE_PITCH_CLASSES = [9, 0, 2, 4, 7]; // MIDI pitch classes

/**
 * Generate frequencies for major scale notes in a given range.
 */
function getMajorScaleFrequencies(minFreq: number, maxFreq: number): number[] {
  const freqs: number[] = [];
  // Iterate through octaves and pitch classes.
  for (let octave = -1; octave <= 8; octave++) {
    for (const pc of MAJOR_SCALE_PITCH_CLASSES) {
      const midi = octave * 12 + pc;
      const freq = midiToFreq(midi);
      if (freq >= minFreq && freq <= maxFreq) {
        freqs.push(freq);
      }
    }
  }
  return freqs.sort((a, b) => a - b);
}

/**
 * Canvas-based FFT spectrum visualization (Section 1).
 * Displays magnitude spectrum in dB with noise floor, optional derivative, and scale notes.
 */
export function SpectrumPlot({
  spectrumDb,
  binHz,
  noiseFloorDb,
  title,
  height = 300,
  showDerivative = false,
  showScaleNotes = false,
  minFreqHz = 0,
  maxFreqHz = Infinity,
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

    // Compute derivative if needed.
    const derivative = showDerivative ? spatialDerivative(spectrumDb) : null;

    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Calculate frequency range for display.
    const maxFreq = spectrumDb.length * binHz;
    const displayMaxFreq = Math.min(maxFreqHz, maxFreq);
    const minBinIdx = Math.floor(minFreqHz / binHz);
    const maxBinIdx = Math.floor(displayMaxFreq / binHz);
    const numBinsDisplay = maxBinIdx - minBinIdx;

    // Find dB range (only in display range).
    let minDb = -100;
    let maxDb = 0;
    for (let k = minBinIdx; k <= maxBinIdx && k < spectrumDb.length; k++) {
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

    // X-axis: frequency labels. Choose a sensible step and Hz/kHz formatting
    // for the active range (low-Hz modulation ranges as well as kHz ranges).
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
      const binIdx = freq / binHz;
      if (binIdx < minBinIdx || binIdx > maxBinIdx) continue;
      const x = padding + ((binIdx - minBinIdx) / numBinsDisplay) * plotWidth;
      ctx.fillText(formatFreq(freq), x, height - padding + 20);
    }

    // Draw major scale notes as vertical lines (if enabled).
    if (showScaleNotes) {
      const scaleFreqs = getMajorScaleFrequencies(minFreqHz, displayMaxFreq);
      ctx.strokeStyle = "rgba(100, 200, 100, 0.4)";
      ctx.lineWidth = 1;
      for (const freq of scaleFreqs) {
        const binIdx = freq / binHz;
        if (binIdx < minBinIdx || binIdx > maxBinIdx) continue;
        const x = padding + ((binIdx - minBinIdx) / numBinsDisplay) * plotWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }
    }

    // Draw spectrum (only in display range).
    ctx.strokeStyle = "rgb(70, 130, 180)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = minBinIdx; k <= maxBinIdx && k < spectrumDb.length; k++) {
      const db = spectrumDb[k];
      const dbNorm = Number.isFinite(db) ? (db - minDb) / (maxDb - minDb) : 0;
      const x = padding + ((k - minBinIdx) / numBinsDisplay) * plotWidth;
      const y = height - padding - dbNorm * plotHeight;
      if (k === minBinIdx) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw derivative if enabled.
    if (derivative && showDerivative) {
      // Normalize derivative for visibility.
      let derivMax = 0;
      for (let k = 0; k < derivative.length; k++) {
        derivMax = Math.max(derivMax, Math.abs(derivative[k]));
      }
      const derivScale = derivMax > 0 ? plotHeight / (2 * derivMax) : 1;

      ctx.strokeStyle = "rgba(200, 100, 100, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < derivative.length; k++) {
        const deriv = derivative[k];
        const derivNorm = Number.isFinite(deriv) ? deriv * derivScale : 0;
        const x = padding + (k / derivative.length) * plotWidth;
        const y = height - padding - derivNorm; // Centered at the baseline.
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

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

    // Draw title.
    if (title) {
      ctx.fillStyle = "black";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title, width / 2, padding - 10);
    }

    // Draw labels.
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
    showDerivative,
    showScaleNotes,
    minFreqHz,
    maxFreqHz,
  ]);

  return (
    <div className="spectrum-plot">
      <canvas ref={canvasRef} />
    </div>
  );
}
