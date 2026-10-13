import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { SpectrumPlot } from "../../src/components/SpectrumPlot";
import { A_MINOR_PENTATONIC_PITCH_CLASSES, pitchClassFrequencies } from "../../src/utils/notes";
import { installCanvasStub, type CanvasRecorder, type CanvasCall } from "../helpers/canvasStub";

/** Split the recorded calls into paths: each beginPath starts a new group. */
function paths(calls: CanvasCall[]): CanvasCall[][] {
  const out: CanvasCall[][] = [];
  let current: CanvasCall[] | null = null;
  for (const c of calls) {
    if (c.method === "beginPath") {
      current = [];
      out.push(current);
    } else if (current && (c.method === "moveTo" || c.method === "lineTo")) {
      current.push(c);
    }
  }
  return out;
}

describe("SpectrumPlot", () => {
  let canvas: CanvasRecorder;

  beforeEach(() => {
    canvas = installCanvasStub(600);
  });

  afterEach(() => {
    cleanup();
    canvas.restore();
  });

  it("draws 'No data' for an empty spectrum or a zero bin width", () => {
    render(<SpectrumPlot spectrumDb={new Float32Array(0)} binHz={2.93} noiseFloorDb={-80} />);
    render(<SpectrumPlot spectrumDb={new Float32Array(10)} binHz={0} noiseFloorDb={-80} />);
    const texts = canvas.of("fillText").filter((c) => c.args[0] === "No data");
    expect(texts).toHaveLength(2);
  });

  it("draws the slope overlay on the same x range as the spectrum", () => {
    // 8192 bins at 2.93 Hz (0–24 kHz) displayed over 0–4 kHz: the overlay
    // used to be drawn over all 8192 bins squeezed into the plot width.
    const binHz = 2.93;
    const spectrum = new Float32Array(8192).map((_, k) => -80 + 40 * Math.sin(k / 50));
    render(
      <SpectrumPlot
        spectrumDb={spectrum}
        binHz={binHz}
        noiseFloorDb={-70}
        showSlope
        minFreqHz={0}
        maxFreqHz={4000}
      />,
    );
    const maxBin = Math.floor(4000 / binHz);
    // The two longest paths are the spectrum and the slope overlay.
    const longPaths = paths(canvas.calls)
      .filter((p) => p.length >= maxBin)
      .sort((a, b) => b.length - a.length);
    expect(longPaths).toHaveLength(2);
    const [a, b] = longPaths;
    expect(a).toHaveLength(b.length);
    const firstX = (p: CanvasCall[]) => p[0].args[0] as number;
    const lastX = (p: CanvasCall[]) => p[p.length - 1].args[0] as number;
    expect(firstX(a)).toBeCloseTo(firstX(b), 6);
    expect(lastX(a)).toBeCloseTo(lastX(b), 6);
    // The overlay spans the whole plot width (padding 40 on a 600 px canvas).
    expect(firstX(a)).toBeCloseTo(40, 6);
    expect(lastX(a)).toBeCloseTo(560, 6);
  });

  it("draws one reference line per pentatonic note inside the displayed band", () => {
    const binHz = 2.93;
    render(
      <SpectrumPlot
        spectrumDb={new Float32Array(8192).fill(-60)}
        binHz={binHz}
        noiseFloorDb={-70}
        showScaleNotes
        minFreqHz={0}
        maxFreqHz={500}
      />,
    );
    // Two-point vertical lines: moveTo(x, top) + lineTo(x, bottom).
    const verticals = paths(canvas.calls).filter(
      (p) => p.length === 2 && p[0].args[0] === p[1].args[0],
    );
    // A, C, D, E, G from MIDI 0 (8.2 Hz) up to 500 Hz: 6 octaves × 5 = 30.
    const expected = pitchClassFrequencies(A_MINOR_PENTATONIC_PITCH_CLASSES, 0, 500).length;
    expect(expected).toBe(30);
    expect(verticals.length).toBe(expected);
  });
});
