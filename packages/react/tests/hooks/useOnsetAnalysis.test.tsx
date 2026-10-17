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
});
