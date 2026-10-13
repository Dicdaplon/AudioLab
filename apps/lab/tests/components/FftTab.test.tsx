import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { TempoFrame } from "../../src/analysis/engine/tempoAnalyzer";
import type { MicSource } from "../../src/audio/micStream";
import { DEFAULT_FFT_SETTINGS } from "../../src/config/settings";
import type { TempoAnalysisState } from "../../src/hooks/useTempoAnalysis";
import { installCanvasStub, type CanvasRecorder } from "../helpers/canvasStub";

const tempoState: TempoAnalysisState = { frame: null, captureMethod: null };
vi.mock("../../src/hooks/useTempoAnalysis", () => ({
  useTempoAnalysis: vi.fn(() => tempoState),
}));

import { FftTab } from "../../src/components/FftTab";
import { useTempoAnalysis } from "../../src/hooks/useTempoAnalysis";

function tempoFrame(bpm: number | null): TempoFrame {
  const n = 100;
  const bpmAxis = new Float32Array(n).map((_, i) => 40 + (i * 200) / (n - 1));
  const spectrum = new Float32Array(n).map((_, i) =>
    bpm && Math.abs(bpmAxis[i] - bpm) < 2 ? 1 : 0.1,
  );
  return {
    onsetEnvelope: new Float32Array(750),
    envelopeRate: 93.75,
    filledSeconds: 8,
    spectrum,
    bpmAxis,
    priorWeight: new Float32Array(n).fill(1),
    estimate: bpm === null ? null : { bpm, confidence: 0.8 },
  };
}

const spectrum = {
  spectrumDb: new Float32Array(8192).fill(-60),
  binHz: 48000 / 16384,
  noiseFloorDb: -70,
  noiseMethod: "median" as const,
};

describe("FftTab", () => {
  let canvas: CanvasRecorder;
  const fakeMic = { context: { sampleRate: 48000 } } as unknown as MicSource;

  beforeEach(() => {
    canvas = installCanvasStub(600);
    tempoState.frame = null;
    tempoState.captureMethod = null;
  });

  afterEach(() => {
    cleanup();
    canvas.restore();
  });

  it("asks to start the microphone when there is no session", () => {
    render(
      <FftTab
        mic={null}
        spectrum={spectrum}
        settings={DEFAULT_FFT_SETTINGS}
        onSettingsChange={() => {}}
      />,
    );
    expect(screen.getByRole("status").textContent).toMatch(/Start the microphone/);
    expect(useTempoAnalysis).toHaveBeenCalledWith(null, {
      lowpassCutoffHz: DEFAULT_FFT_SETTINGS.onsetLowpassHz,
    });
  });

  it("shows the BPM estimate, confidence and capture method", () => {
    tempoState.frame = tempoFrame(123.4);
    tempoState.captureMethod = "worklet";
    render(
      <FftTab
        mic={fakeMic}
        spectrum={spectrum}
        settings={DEFAULT_FFT_SETTINGS}
        onSettingsChange={() => {}}
      />,
    );
    const status = screen.getByRole("status").textContent ?? "";
    expect(status).toMatch(/123\.4 BPM/);
    expect(status).toMatch(/confidence 80 %/);
    expect(status).toMatch(/AudioWorklet/);
    // The estimate marker is labelled on the beat spectrum canvas.
    const labels = canvas.of("fillText").map((c) => String(c.args[0]));
    expect(labels).toContain("123.4 BPM");
  });

  it("reports the fallback capture and a missing beat honestly", () => {
    tempoState.frame = tempoFrame(null);
    tempoState.captureMethod = "analyser";
    render(
      <FftTab
        mic={fakeMic}
        spectrum={spectrum}
        settings={DEFAULT_FFT_SETTINGS}
        onSettingsChange={() => {}}
      />,
    );
    const status = screen.getByRole("status").textContent ?? "";
    expect(status).toMatch(/No beat detected/);
    expect(status).toMatch(/AnalyserNode fallback/);
  });
});
