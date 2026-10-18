/**
 * usePitch on the Web Audio fakes: the real `startSampleCapture` delivers
 * batches from a fake AudioWorkletNode into the `PitchTracker`, and the
 * hook publishes the estimate at its own rate.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { openMicrophone, type MicSource } from "@audiolab/core";
import { usePitch, type UsePitchOptions } from "../../src/hooks/usePitch";
import {
  installFakeAudioWorkletNode,
  installWebAudioFakes,
  type InstalledFakes,
  type InstalledWorkletNode,
} from "../../../core/tests/helpers/fakeWebAudio";

const SR = 48_000;

function sine(freq: number, length: number, amplitude = 0.3, offset = 0): Float32Array {
  const out = new Float32Array(length);
  const w = (2 * Math.PI * freq) / SR;
  for (let i = 0; i < length; i++) out[i] = amplitude * Math.sin(w * (offset + i));
  return out;
}

describe("usePitch", () => {
  let fakes: InstalledFakes;
  let worklet: InstalledWorkletNode;
  let mic: MicSource;

  beforeEach(async () => {
    vi.useFakeTimers();
    fakes = installWebAudioFakes({ sampleRate: SR });
    worklet = installFakeAudioWorkletNode();
    mic = await openMicrophone();
  });

  afterEach(async () => {
    await mic.dispose();
    worklet.restore();
    fakes.restore();
    vi.useRealTimers();
  });

  /** Posts `seconds` of a continuous tone as 2048-sample worklet batches. */
  function play(freq: number, seconds: number, amplitude = 0.3) {
    const batch = 2048;
    const total = Math.round(seconds * SR);
    for (let start = 0; start + batch <= total; start += batch) {
      worklet.nodes[0].emit({ samples: sine(freq, batch, amplitude, start), startFrame: start });
    }
  }

  function setup(options: UsePitchOptions = {}, initialMic: MicSource | null = mic) {
    let props = { mic: initialMic, options };
    const hook = renderHook((p: typeof props) => usePitch(p.mic, p.options), {
      initialProps: props,
    });
    const rerender = (patch: Partial<typeof props>) => {
      props = { ...props, ...patch };
      hook.rerender(props);
    };
    return { hook, rerender };
  }

  it("stays idle without a microphone", () => {
    const { hook } = setup({}, null);
    expect(hook.result.current).toEqual({ estimate: null, captureMethod: null });
  });

  it("starts the capture and publishes the pitch of the incoming audio", async () => {
    const { hook } = setup({ updatesPerSecond: 10 });
    await act(async () => {});
    expect(hook.result.current.captureMethod).toBe("worklet");
    expect(hook.result.current.estimate).toBeNull();

    play(440, 0.2);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const estimate = hook.result.current.estimate!;
    expect(estimate.midi).toBe(69);
    expect(Math.abs(estimate.cents)).toBeLessThan(1);
    expect(estimate.clarity).toBeGreaterThan(0.99);
  });

  it("keeps the same state object while the estimate is unchanged", async () => {
    const { hook } = setup({ updatesPerSecond: 20 });
    await act(async () => {});
    const idle = hook.result.current;
    act(() => {
      vi.advanceTimersByTime(500); // ten ticks, nothing played
    });
    expect(hook.result.current).toBe(idle);

    play(440, 0.2);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    const playing = hook.result.current;
    expect(playing).not.toBe(idle);
    expect(playing.estimate?.midi).toBe(69);
    act(() => {
      vi.advanceTimersByTime(500); // no new batches: identical estimate
    });
    expect(hook.result.current).toBe(playing);
  });

  it("returns to null on silence", async () => {
    const { hook } = setup({ updatesPerSecond: 10 });
    await act(async () => {});
    play(440, 0.2);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(hook.result.current.estimate).not.toBeNull();
    play(440, 0.2, 0);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(hook.result.current.estimate).toBeNull();
  });

  it("applies a new reference A4 without restarting the capture", async () => {
    const { hook, rerender } = setup({ updatesPerSecond: 10, referenceA4: 440 });
    await act(async () => {});
    play(442, 0.2);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(hook.result.current.estimate?.cents).toBeGreaterThan(5);

    rerender({ options: { updatesPerSecond: 10, referenceA4: 442 } });
    play(442, 0.2);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(Math.abs(hook.result.current.estimate!.cents)).toBeLessThan(0.5);
    expect(worklet.nodes).toHaveLength(1);
  });

  it("stops the capture when disabled, on a new session and on unmount", async () => {
    const { hook, rerender } = setup({ enabled: true });
    await act(async () => {});
    const first = worklet.nodes[0];
    rerender({ options: { enabled: false } });
    expect(first.disconnect).toHaveBeenCalled();
    expect(hook.result.current).toEqual({ estimate: null, captureMethod: null });

    rerender({ options: { enabled: true, windowSize: 4096 } });
    await act(async () => {});
    expect(worklet.nodes).toHaveLength(2);
    hook.unmount();
    expect(worklet.nodes[1].disconnect).toHaveBeenCalled();
  });

  it("stops a capture that resolves after the hook was torn down", async () => {
    let release!: () => void;
    const context = fakes.instances[0];
    context.audioWorklet!.addModule.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const { hook } = setup();
    hook.unmount();
    release();
    await act(async () => {});
    expect(worklet.nodes).toHaveLength(1);
    expect(worklet.nodes[0].disconnect).toHaveBeenCalled();
  });

  it("stays idle when the capture cannot start", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined); // the expected fallback warning
    const context = fakes.instances[0];
    context.audioWorklet!.addModule.mockRejectedValue(new Error("no worklet"));
    context.createAnalyser.mockImplementation(() => {
      throw new Error("closed");
    });
    const { hook } = setup();
    await act(async () => {});
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(hook.result.current).toEqual({ estimate: null, captureMethod: null });
  });
});
