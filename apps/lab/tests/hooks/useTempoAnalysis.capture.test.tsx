/**
 * useTempoAnalysis wired to the real startSampleCapture, on the Web Audio
 * fakes: worklet path (messages from a fake AudioWorkletNode) and analyser
 * fallback (time-domain polling against the context clock).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { openMicrophone, type MicSource } from "@audiolab/core";
import { useTempoAnalysis } from "../../src/hooks/useTempoAnalysis";
import {
  installFakeAudioWorkletNode,
  installWebAudioFakes,
  type FakeAudioContextInstance,
  type InstalledFakes,
  type InstalledWorkletNode,
} from "../../../../packages/core/tests/helpers/fakeWebAudio";

const SR = 48_000;

/** Sample `i` of a click track (decaying 50 ms bursts) at `bpm`. */
function click(i: number, bpm: number): number {
  const t = i % ((60 / bpm) * SR);
  return t < 0.05 * SR ? 0.5 * Math.exp(-t / (0.012 * SR)) : 0;
}

describe("useTempoAnalysis with the real sample capture", () => {
  let fakes: InstalledFakes;
  let worklet: InstalledWorkletNode;
  let mic: MicSource;
  let context: FakeAudioContextInstance;

  async function setup(withoutWorklet: boolean) {
    vi.useFakeTimers();
    fakes = installWebAudioFakes({ sampleRate: SR, withoutWorklet });
    worklet = installFakeAudioWorkletNode();
    mic = await openMicrophone();
    context = fakes.instances[0];
  }

  afterEach(async () => {
    await mic.dispose();
    worklet.restore();
    fakes.restore();
    vi.useRealTimers();
  });

  it("estimates 120 BPM from batches posted by the worklet", async () => {
    await setup(false);
    const { result } = renderHook(() => useTempoAnalysis(mic, { updatesPerSecond: 5 }));
    await act(async () => {});
    expect(result.current.captureMethod).toBe("worklet");
    expect(worklet.nodes).toHaveLength(1);

    // 10 s of audio in 2048-sample batches, as the processor posts them.
    const batch = 2048;
    for (let start = 0; start + batch <= 10 * SR; start += batch) {
      const data = new Float32Array(batch);
      for (let i = 0; i < batch; i++) data[i] = click(start + i, 120);
      worklet.nodes[0].emit(data);
    }
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const estimate = result.current.frame?.estimate;
    expect(estimate).not.toBeNull();
    expect(Math.abs(estimate!.bpm - 120)).toBeLessThan(3);
  });

  it("estimates 120 BPM through the analyser fallback without a worklet", async () => {
    await setup(true);
    // The fake analyser returns the last fftSize samples of the click track
    // ending at the context's current time.
    context.timeDomainSource = (buf) => {
      const end = Math.round(context.currentTime * SR);
      for (let i = 0; i < buf.length; i++) buf[i] = click(end - buf.length + i, 120);
    };
    const { result } = renderHook(() => useTempoAnalysis(mic, { updatesPerSecond: 5 }));
    await act(async () => {});
    expect(result.current.captureMethod).toBe("analyser");

    // 10 s of audio clock in 20 ms polls; render the hook once at the end.
    act(() => {
      for (let k = 0; k < 500; k++) {
        context.currentTime += 0.02;
        vi.advanceTimersByTime(20);
      }
    });
    const estimate = result.current.frame?.estimate;
    expect(estimate).not.toBeNull();
    expect(Math.abs(estimate!.bpm - 120)).toBeLessThan(3);
  });
});
