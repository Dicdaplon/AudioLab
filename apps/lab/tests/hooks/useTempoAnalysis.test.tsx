import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import {
  type MicSource,
  openMicrophone,
  type SampleCapture,
  type SampleListener,
} from "@audiolab/core";
import { useTempoAnalysis } from "../../src/hooks/useTempoAnalysis";
import {
  installWebAudioFakes,
  type InstalledFakes,
} from "../../../../packages/core/tests/helpers/fakeWebAudio";

// Capture is mocked: tests feed samples straight into the listener.
const captures: { listener: SampleListener; stop: ReturnType<typeof vi.fn> }[] = [];
/** When set, the next capture start waits on this promise (or its rejection). */
let gate: Promise<void> | null = null;
vi.mock("@audiolab/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@audiolab/core")>()),
  startSampleCapture: vi.fn(
    async (_ctx: unknown, _src: unknown, listener: SampleListener): Promise<SampleCapture> => {
      const stop = vi.fn();
      captures.push({ listener, stop });
      if (gate) await gate;
      return { method: "worklet", stop };
    },
  ),
}));

function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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
    gate = null;
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

  it("stops a capture that finishes starting after the hook unmounted", async () => {
    const pending = deferred();
    gate = pending.promise;
    const { result, unmount } = renderHook(() => useTempoAnalysis(mic));
    expect(captures).toHaveLength(1);
    unmount();
    expect(captures[0].stop).not.toHaveBeenCalled();
    await act(async () => pending.resolve());
    expect(captures[0].stop).toHaveBeenCalledTimes(1);
    expect(result.current.frame).toBeNull();
  });

  it("stays idle when the capture cannot start", async () => {
    const pending = deferred();
    gate = pending.promise;
    vi.useFakeTimers();
    const { result } = renderHook(() => useTempoAnalysis(mic, { updatesPerSecond: 10 }));
    await act(async () => pending.reject(new Error("context closed")));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toEqual({ frame: null, captureMethod: null });
  });

  it("publishes a frame at updatesPerSecond, only once the capture runs", async () => {
    const pending = deferred();
    gate = pending.promise;
    vi.useFakeTimers();
    const frames = new Set<unknown>();
    const { result, rerender } = renderHook(
      ({ ups }) => {
        const state = useTempoAnalysis(mic, { updatesPerSecond: ups });
        if (state.frame) frames.add(state.frame);
        return state;
      },
      { initialProps: { ups: 4 } },
    );
    // One act() per 10 ms step so React does not batch successive ticks.
    const runFor = (ms: number) => {
      for (let t = 0; t < ms; t += 10) {
        act(() => {
          vi.advanceTimersByTime(10);
        });
      }
    };
    runFor(1000);
    expect(frames.size).toBe(0); // capture still starting: no ticks published

    await act(async () => pending.resolve());
    expect(frames.size).toBe(1); // first frame as soon as the capture starts
    runFor(1000);
    expect(frames.size).toBe(5); // + 4 ticks in one second
    expect(result.current.captureMethod).toBe("worklet");

    // A new rate restarts the capture with its own interval.
    gate = null;
    rerender({ ups: 10 });
    expect(captures[0].stop).toHaveBeenCalledTimes(1);
    await act(async () => {});
    expect(captures).toHaveLength(2);
    frames.clear();
    runFor(1000);
    expect(frames.size).toBe(10);
    expect(vi.getTimerCount()).toBe(1);
  });
});
