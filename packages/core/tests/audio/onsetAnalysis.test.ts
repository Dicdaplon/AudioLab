import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startOnsetAnalysis, timingInputFromMic } from "../../src/audio/onsetAnalysis";
import {
  installFakeAudioWorkletNode,
  makeFakeAudioContextClass,
  makeFakeStream,
  type InstalledWorkletNode,
} from "../helpers/fakeWebAudio";
import { performance as perform } from "../helpers/onsets";

const SR = 48000;

describe("startOnsetAnalysis", () => {
  const source = { connect: vi.fn(), disconnect: vi.fn() } as unknown as AudioNode;
  let worklet: InstalledWorkletNode;

  beforeEach(() => {
    worklet = installFakeAudioWorkletNode();
  });

  afterEach(() => {
    worklet.restore();
    vi.restoreAllMocks();
  });

  it("timestamps onsets on both clocks and shares the capture", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const ctx = new FakeAudioContext() as unknown as AudioContext;
    const extra = vi.fn();
    const analysis = await startOnsetAnalysis(ctx, source, { onSamples: extra });
    expect(analysis.method).toBe("worklet");
    expect(worklet.nodes[0].options?.processorOptions).toEqual({ batchSize: 512 });

    const heard: number[] = [];
    const unsubscribe = analysis.subscribe((o) => heard.push(o.time));

    // The context started 100 000 frames ago; each batch arrives 5 ms after
    // it was rendered, on a page clock 1000 ms ahead of the audio clock.
    const { signal, startFrames } = perform(
      [
        { time: 0.6, midi: 52 },
        { time: 1.1, midi: 57 },
      ],
      { seconds: 1.6, noiseRms: 0.001 },
    );
    const origin = 100_000;
    let now = 0;
    vi.spyOn(globalThis.performance, "now").mockImplementation(() => now);
    for (let i = 0; i < signal.length; i += 512) {
      const startFrame = origin + i;
      now = 1000 + ((startFrame + 512) / SR) * 1000 + 5;
      worklet.nodes[0].emit({ samples: signal.slice(i, i + 512), startFrame });
    }

    expect(heard).toHaveLength(2);
    heard.forEach((t, k) =>
      expect(Math.abs(t - (origin + startFrames[k]) / SR)).toBeLessThan(0.005),
    );
    const snap = analysis.latest();
    expect(snap.recentOnsets).toHaveLength(2);
    expect(snap.exactTiming).toBe(true);
    expect(snap.clock.offsetMs).toBeCloseTo(1005, 6);
    const first = snap.recentOnsets[0];
    expect(first.perfTimeMs).toBeCloseTo(first.time * 1000 + 1005, 6);
    expect(snap.analysedTime).toBeCloseTo(
      (origin + signal.length) / SR - analysis.pipeline.detector.maxDecisionLatencySeconds,
      2,
    );
    expect(snap.counts.accepted).toBe(2);
    expect(extra).toHaveBeenCalled();
    expect(extra.mock.calls[0][1]).toMatchObject({ startFrame: origin, exact: true });

    unsubscribe();
    analysis.stop();
    analysis.stop();
    expect(worklet.nodes[0].port.onmessage).toBeNull();
  });

  it("reads the reported latency and the device label from the microphone", () => {
    const stream = makeFakeStream();
    (stream.getAudioTracks()[0] as unknown as { label: string }).label = "AirPods (Bluetooth)";
    const input = timingInputFromMic({
      trackSettings: { latency: 0.02 } as MediaTrackSettings,
      stream,
    });
    expect(input).toEqual({
      reportedInputLatencySeconds: 0.02,
      deviceLabel: "AirPods (Bluetooth)",
    });
    expect(
      timingInputFromMic({ trackSettings: {}, stream: makeFakeStream() })
        .reportedInputLatencySeconds,
    ).toBeUndefined();
  });

  it("keeps a sample history and calls batch listeners after the onsets", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const ctx = new FakeAudioContext() as unknown as AudioContext;
    const analysis = await startOnsetAnalysis(ctx, source, { historySeconds: 2 });
    expect(analysis.sampleRate).toBe(SR);
    expect(analysis.history?.capacity).toBe(2 * SR);
    const order: string[] = [];
    analysis.subscribe(() => order.push("onset"));
    const off = analysis.subscribeBatch((history, t) => {
      order.push("batch");
      expect(history).toBe(analysis.history);
      expect(Number.isFinite(t)).toBe(true);
    });
    const { signal } = perform([{ time: 0.2, midi: 52 }], { seconds: 0.5, noiseRms: 0.001 });
    for (let i = 0; i < signal.length; i += 512) {
      worklet.nodes[0].emit({ samples: signal.slice(i, i + 512), startFrame: i });
    }
    expect(order.indexOf("onset")).toBeGreaterThan(-1);
    expect(order[order.indexOf("onset") + 1]).toBe("batch"); // same batch, after its onset
    expect(analysis.history!.range.to).toBe(signal.length);
    off();
    analysis.stop();
    const none = await startOnsetAnalysis(ctx, source);
    expect(none.history).toBeNull();
    none.stop();
  });
});
