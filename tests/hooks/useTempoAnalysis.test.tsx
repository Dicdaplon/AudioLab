import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import type { SampleCapture, SampleListener } from "../../src/audio/sampleCapture";
import { openMicrophone, type MicSource } from "../../src/audio/micStream";
import { useTempoAnalysis } from "../../src/hooks/useTempoAnalysis";
import { installWebAudioFakes, type InstalledFakes } from "../helpers/fakeWebAudio";

// Capture is mocked: tests feed samples straight into the listener.
const captures: { listener: SampleListener; stop: ReturnType<typeof vi.fn> }[] = [];
vi.mock("../../src/audio/sampleCapture", () => ({
  startSampleCapture: vi.fn(
    async (_ctx: unknown, _src: unknown, listener: SampleListener): Promise<SampleCapture> => {
      const stop = vi.fn();
      captures.push({ listener, stop });
      return { method: "worklet", stop };
    },
  ),
}));

/** 10 s click track at `bpm`, 48 kHz. */
function clickTrack(bpm: number, seconds = 10, sampleRate = 48000): Float32Array {
  const n = seconds * sampleRate;
  const out = new Float32Array(n);
  const period = (60 / bpm) * sampleRate;
  for (let i = 0; i < n; i++) {
    const t = i % period;
    out[i] = t < 0.05 * sampleRate ? 0.5 * Math.exp(-t / (0.012 * sampleRate)) : 0;
  }
  return out;
}

describe("useTempoAnalysis", () => {
  let fakes: InstalledFakes;
  let mic: MicSource;

  beforeEach(async () => {
    captures.length = 0;
    fakes = installWebAudioFakes();
    mic = await openMicrophone();
  });

  afterEach(async () => {
    await mic.dispose();
    fakes.restore();
    vi.useRealTimers();
  });

  it("is idle without a microphone or when disabled", () => {
    const { result, rerender } = renderHook(({ m, enabled }) => useTempoAnalysis(m, { enabled }), {
      initialProps: { m: null as MicSource | null, enabled: true },
    });
    expect(result.current.frame).toBeNull();
    rerender({ m: mic, enabled: false });
    expect(result.current.frame).toBeNull();
    expect(captures).toHaveLength(0);
  });

  it("starts the capture, feeds the analyser and estimates the tempo", async () => {
    const { result } = renderHook(() => useTempoAnalysis(mic, { updatesPerSecond: 10 }));
    await waitFor(() => expect(captures).toHaveLength(1));
    await waitFor(() => expect(result.current.captureMethod).toBe("worklet"));

    act(() => captures[0].listener(clickTrack(120)));
    await waitFor(() => expect(result.current.frame?.estimate).not.toBeNull());
    expect(Math.abs(result.current.frame!.estimate!.bpm - 120)).toBeLessThan(3);
    expect(result.current.frame!.envelopeRate).toBe(93.75);
    expect(result.current.frame!.onsetEnvelope).toHaveLength(750);
  });

  it("stops the capture on unmount and when the mic goes away", async () => {
    const { result, rerender, unmount } = renderHook(({ m }) => useTempoAnalysis(m), {
      initialProps: { m: mic as MicSource | null },
    });
    await waitFor(() => expect(captures).toHaveLength(1));
    rerender({ m: null });
    expect(captures[0].stop).toHaveBeenCalledTimes(1);
    expect(result.current.frame).toBeNull();

    rerender({ m: mic });
    await waitFor(() => expect(captures).toHaveLength(2));
    unmount();
    expect(captures[1].stop).toHaveBeenCalledTimes(1);
  });

  it("applies a new lowpass cutoff without restarting the capture", async () => {
    const { rerender } = renderHook(({ fc }) => useTempoAnalysis(mic, { lowpassCutoffHz: fc }), {
      initialProps: { fc: 8 },
    });
    await waitFor(() => expect(captures).toHaveLength(1));
    rerender({ fc: 3 });
    expect(captures).toHaveLength(1);
    expect(captures[0].stop).not.toHaveBeenCalled();
  });
});
