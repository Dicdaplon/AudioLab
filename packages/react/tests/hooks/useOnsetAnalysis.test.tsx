import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { type MicSource, openMicrophone } from "@audiolab/core";
import { useOnsetAnalysis } from "../../src/hooks/useOnsetAnalysis";
import {
  installFakeAudioWorkletNode,
  installWebAudioFakes,
  type InstalledFakes,
  type InstalledWorkletNode,
} from "../../../core/tests/helpers/fakeWebAudio";
import { performance as perform } from "../../../core/tests/helpers/onsets";

describe("useOnsetAnalysis", () => {
  let fakes: InstalledFakes;
  let worklet: InstalledWorkletNode;
  let mic: MicSource;

  beforeEach(async () => {
    fakes = installWebAudioFakes();
    worklet = installFakeAudioWorkletNode();
    mic = await openMicrophone();
  });

  afterEach(async () => {
    await mic.dispose();
    worklet.restore();
    fakes.restore();
  });

  it("is idle without a microphone or when disabled", () => {
    const { result, rerender } = renderHook(({ m, enabled }) => useOnsetAnalysis(m, { enabled }), {
      initialProps: { m: null as MicSource | null, enabled: true },
    });
    expect(result.current.snapshot).toBeNull();
    rerender({ m: mic, enabled: false });
    expect(result.current.analysis).toBeNull();
    expect(worklet.nodes).toHaveLength(0);
  });

  it("delivers onsets with their samples, the analysed time and a timing budget", async () => {
    const onOnset = vi.fn();
    const onBatch = vi.fn();
    const { result, unmount } = renderHook(() =>
      useOnsetAnalysis(mic, { onOnset, onBatch, updatesPerSecond: 50 }),
    );
    await waitFor(() => expect(result.current.captureMethod).toBe("worklet"));
    expect(result.current.budget?.components.map((c) => c.id)).toContain("input");

    const { signal } = perform(
      [
        { time: 0.4, midi: 52 },
        { time: 0.9, midi: 57 },
      ],
      { seconds: 1.4, noiseRms: 0.001 },
    );
    act(() => {
      for (let i = 0; i < signal.length; i += 512) {
        worklet.nodes[0].emit({ samples: signal.slice(i, i + 512), startFrame: i });
      }
    });

    expect(onOnset).toHaveBeenCalledTimes(2);
    const [onset, history] = onOnset.mock.calls[0];
    expect(onset.time).toBeCloseTo(0.4, 2);
    expect(history.range.to).toBe(signal.length);
    const lastBatch = onBatch.mock.calls.at(-1)!;
    expect(lastBatch[1]).toBeLessThan(signal.length / 48000);
    expect(lastBatch[1]).toBeGreaterThan(signal.length / 48000 - 0.1);
    await waitFor(() => expect(result.current.snapshot?.recentOnsets).toHaveLength(2));

    unmount();
    expect(worklet.nodes[0].port.onmessage).toBeNull();
  });

  it("stops a capture that finishes starting after unmount", async () => {
    const { unmount } = renderHook(() => useOnsetAnalysis(mic));
    unmount();
    await waitFor(() => expect(worklet.nodes).toHaveLength(1));
    await waitFor(() => expect(worklet.nodes[0].port.onmessage).toBeNull());
  });

  it("builds the budget from the measured frame period and clock spread", async () => {
    let frame = 0;
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    const { result } = renderHook(() =>
      useOnsetAnalysis(mic, { updatesPerSecond: 50, strummed: true }),
    );
    act(() => {
      // 70 frames at 120 Hz.
      for (let k = 0; k < 70; k++) callbacks.shift()?.((frame += 1000 / 120));
    });
    await waitFor(() => expect(result.current.captureMethod).toBe("worklet"));
    act(() => {
      for (let i = 0; i < 8; i++) {
        worklet.nodes[0].emit({ samples: new Float32Array(512), startFrame: i * 512 });
      }
    });
    await waitFor(() => {
      const ids = result.current.budget?.components.map((c) => c.id);
      expect(ids).toContain("strum");
      const display = result.current.budget!.components.find((c) => c.id === "display")!;
      expect(display.offsetMs).toBeCloseTo(12.5, 1);
      const clock = result.current.budget!.components.find((c) => c.id === "clock")!;
      expect(clock.source).toBe("measured");
    });
    vi.unstubAllGlobals();
  });

  it("applies a calibration to the reference it was measured with", async () => {
    const { result, rerender } = renderHook(
      ({ reference, calibration }) =>
        useOnsetAnalysis(mic, { updatesPerSecond: 50, reference, calibration }),
      {
        initialProps: {
          reference: "audio" as "audio" | "visual",
          calibration: { offsetMs: 300, spreadMs: 12 } as {
            offsetMs: number;
            spreadMs: number;
            reference?: "audio" | "visual";
          } | null,
        },
      },
    );
    // Set by ear with the click (the default): it replaces input + output.
    await waitFor(() => expect(result.current.budget?.components[0].id).toBe("calibration"));
    expect(result.current.budget!.offsetMs).toBe(300);
    expect(result.current.budget!.visualDelayMs).toBeGreaterThan(200);
    // Measured against the screen: not used while the click sounds.
    rerender({
      reference: "audio",
      calibration: { offsetMs: 40, spreadMs: 5, reference: "visual" },
    });
    await waitFor(() => expect(result.current.budget?.components[0].id).toBe("input"));
    rerender({ reference: "audio", calibration: null });
    await waitFor(() => expect(result.current.budget?.components[1].id).toBe("output"));
  });
});
