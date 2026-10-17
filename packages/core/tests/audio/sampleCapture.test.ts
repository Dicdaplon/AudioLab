import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

import { SampleBatcher } from "../../src/audio/sampleBatcher";
import {
  installFakeAudioWorkletNode,
  makeFakeAudioContextClass,
  type FakeWorkletNode,
  type InstalledWorkletNode,
} from "../helpers/fakeWebAudio";

import { SAMPLE_CAPTURE_PROCESSOR, startSampleCapture } from "../../src/audio/sampleCapture";

describe("SampleBatcher", () => {
  it("emits fresh batches of exactly batchSize samples", () => {
    const emitted: Float32Array[] = [];
    const b = new SampleBatcher(4, (batch) => emitted.push(batch));
    b.push([1, 2, 3]);
    expect(emitted).toHaveLength(0);
    b.push([4, 5, 6, 7, 8, 9]);
    expect(emitted.map((e) => Array.from(e))).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]);
    expect(emitted[0]).not.toBe(emitted[1]);
    b.flush();
    expect(Array.from(emitted[2])).toEqual([9]);
    b.flush(); // nothing pending
    expect(emitted).toHaveLength(3);
  });

  it("copies the input so a reused block cannot alter an emitted batch", () => {
    const emitted: Float32Array[] = [];
    const b = new SampleBatcher(2, (batch) => emitted.push(batch));
    const block = new Float32Array([1, 2]);
    b.push(block);
    block[0] = 99;
    expect(Array.from(emitted[0])).toEqual([1, 2]);
  });

  it("rejects an invalid batch size", () => {
    expect(() => new SampleBatcher(0, () => undefined)).toThrow();
  });

  it("reports the stream frame of each batch and flushes on a discontinuity", () => {
    const emitted: [number[], number][] = [];
    const b = new SampleBatcher(4, (batch, start) => emitted.push([Array.from(batch), start]));
    b.push([1, 2], 100);
    b.push([3, 4, 5], 102);
    // 105 expected next: 200 is a gap, so [5] goes out alone first.
    b.push([6, 7, 8, 9], 200);
    expect(emitted).toEqual([
      [[1, 2, 3, 4], 100],
      [[5], 104],
      [[6, 7, 8, 9], 200],
    ]);
  });

  it("counts frames from the first push when none are given", () => {
    const starts: number[] = [];
    const b = new SampleBatcher(3, (_batch, start) => starts.push(start));
    b.push([1, 2, 3, 4, 5, 6, 7]);
    expect(starts).toEqual([0, 3]);
  });
});

describe("sample capture worklet processor", () => {
  const g = globalThis as unknown as Record<string, unknown>;
  let registered: { name: string; ctor: new () => unknown } | null = null;
  let postMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    postMessage = vi.fn();
    g.AudioWorkletProcessor = class {
      port = { postMessage };
    };
    g.registerProcessor = vi.fn((name: string, ctor: new () => unknown) => {
      registered = { name, ctor };
    });
    vi.resetModules();
  });

  afterEach(() => {
    delete g.currentFrame;
    delete g.AudioWorkletProcessor;
    delete g.registerProcessor;
    registered = null;
  });

  it("registers its versioned name and posts transferable, frame-tagged 2048-sample batches", async () => {
    g.currentFrame = 4096;
    await import("../../src/audio/sampleCapture.worklet");
    expect(registered?.name).toBe(SAMPLE_CAPTURE_PROCESSOR);
    const processor = new registered!.ctor() as {
      process(inputs: Float32Array[][]): boolean;
    };

    const block = new Float32Array(128).fill(0.25);
    for (let i = 0; i < 15; i++) {
      expect(processor.process([[block]])).toBe(true);
      g.currentFrame = (g.currentFrame as number) + 128;
    }
    expect(postMessage).not.toHaveBeenCalled();
    block.fill(0.5);
    processor.process([[block]]); // 16 × 128 = 2048
    expect(postMessage).toHaveBeenCalledTimes(1);
    const [message, transfer] = postMessage.mock.calls[0] as [
      { samples: Float32Array; startFrame: number },
      ArrayBuffer[],
    ];
    const batch = message.samples;
    expect(message.startFrame).toBe(4096);
    expect(batch).toBeInstanceOf(Float32Array);
    expect(batch).toHaveLength(2048);
    expect(batch[0]).toBe(0.25);
    expect(batch[2047]).toBe(0.5);
    expect(transfer).toEqual([batch.buffer]);
  });

  it("takes its batch size from the processor options", async () => {
    await import("../../src/audio/sampleCapture.worklet");
    const processor = new (registered!.ctor as new (o: unknown) => unknown)({
      processorOptions: { batchSize: 256 },
    }) as { process(inputs: Float32Array[][]): boolean };
    const block = new Float32Array(128);
    processor.process([[block]]);
    processor.process([[block]]);
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect((postMessage.mock.calls[0][0] as { samples: Float32Array }).samples).toHaveLength(256);
  });

  it("ignores empty inputs and stays alive", async () => {
    await import("../../src/audio/sampleCapture.worklet");
    const processor = new registered!.ctor() as {
      process(inputs: Float32Array[][]): boolean;
    };
    expect(processor.process([])).toBe(true);
    expect(processor.process([[]])).toBe(true);
    expect(postMessage).not.toHaveBeenCalled();
  });
});

describe("startSampleCapture", () => {
  const source = { connect: vi.fn(), disconnect: vi.fn() } as unknown as AudioNode;
  let worklet: InstalledWorkletNode;
  let nodes: FakeWorkletNode[];

  beforeEach(() => {
    worklet = installFakeAudioWorkletNode();
    nodes = worklet.nodes;
    vi.useFakeTimers();
  });

  afterEach(() => {
    worklet.restore();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("uses the worklet, forwards its messages and disconnects on stop", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const ctx = new FakeAudioContext() as unknown as AudioContext;
    const onSamples = vi.fn();
    const capture = await startSampleCapture(ctx, source, onSamples);

    expect(capture.method).toBe("worklet");
    expect(ctx.audioWorklet.addModule).toHaveBeenCalledWith(expect.stringMatching(/^blob:/));
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe(SAMPLE_CAPTURE_PROCESSOR);
    expect(source.connect).toHaveBeenCalledWith(nodes[0]);
    expect(nodes[0].connect).toHaveBeenCalledWith(ctx.destination);

    expect(nodes[0].options).toMatchObject({ channelCount: 1, channelCountMode: "explicit" });

    const batch = new Float32Array([1, 2, 3]);
    nodes[0].emit({ samples: batch, startFrame: 960 });
    nodes[0].emit("not samples");
    expect(onSamples).toHaveBeenCalledTimes(1);
    expect(onSamples).toHaveBeenCalledWith(
      batch,
      expect.objectContaining({ startFrame: 960, sampleRate: ctx.sampleRate, exact: true }),
    );

    capture.stop();
    capture.stop();
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(nodes[0].disconnect).toHaveBeenCalledTimes(1);
    expect(nodes[0].port.onmessage).toBeNull();
    nodes[0].emit(batch);
    expect(onSamples).toHaveBeenCalledTimes(1);
  });

  it("adds the module once per context and passes the batch size", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const ctx = new FakeAudioContext() as unknown as AudioContext;
    const a = await startSampleCapture(ctx, source, vi.fn(), { batchSize: 512 });
    const b = await startSampleCapture(ctx, source, vi.fn());
    expect(ctx.audioWorklet.addModule).toHaveBeenCalledTimes(1);
    expect(nodes[0].options?.processorOptions).toEqual({ batchSize: 512 });
    expect(nodes[1].options?.processorOptions).toEqual({});
    a.stop();
    b.stop();
  });

  it("ignores messages that are not frame-tagged batches", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const ctx = new FakeAudioContext() as unknown as AudioContext;
    const onSamples = vi.fn();
    const capture = await startSampleCapture(ctx, source, onSamples);
    nodes[0].emit(new Float32Array(4));
    nodes[0].emit({ samples: [1, 2], startFrame: 0 });
    expect(onSamples).not.toHaveBeenCalled();
    capture.stop();
  });

  it("retries the module load after a failure", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const ctx = new FakeAudioContext();
    ctx.audioWorklet!.addModule.mockRejectedValueOnce(new Error("network"));
    const first = await startSampleCapture(ctx as unknown as AudioContext, source, vi.fn());
    expect(first.method).toBe("analyser");
    first.stop();
    const second = await startSampleCapture(ctx as unknown as AudioContext, source, vi.fn());
    expect(second.method).toBe("worklet");
    expect(ctx.audioWorklet!.addModule).toHaveBeenCalledTimes(2);
    second.stop();
  });

  it("stop() tolerates a graph that is already torn down (closed context)", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const throwing = {
      connect: vi.fn(),
      disconnect: vi.fn(() => {
        throw new Error("InvalidAccessError");
      }),
    } as unknown as AudioNode;
    const viaWorklet = await startSampleCapture(
      new FakeAudioContext() as unknown as AudioContext,
      throwing,
      vi.fn(),
    );
    expect(() => viaWorklet.stop()).not.toThrow();

    const viaAnalyser = await startSampleCapture(
      new FakeAudioContext() as unknown as AudioContext,
      throwing,
      vi.fn(),
      { preferWorklet: false },
    );
    expect(viaAnalyser.method).toBe("analyser");
    expect(() => viaAnalyser.stop()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("falls back to the analyser when the worklet module fails to load", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const ctx = new FakeAudioContext();
    ctx.audioWorklet!.addModule.mockRejectedValueOnce(new Error("404"));
    const capture = await startSampleCapture(ctx as unknown as AudioContext, source, vi.fn());
    expect(capture.method).toBe("analyser");
    expect(ctx.createAnalyser).toHaveBeenCalledTimes(1);
    capture.stop();
  });

  it("falls back when the context has no audioWorklet", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass({ withoutWorklet: true });
    const ctx = new FakeAudioContext();
    const capture = await startSampleCapture(ctx as unknown as AudioContext, source, vi.fn());
    expect(capture.method).toBe("analyser");
    capture.stop();
  });

  it("analyser fallback delivers exactly the samples the clock advanced by", async () => {
    // The analyser window is a ramp whose last value is the current time
    // in samples, so delivered chunks can be checked for continuity.
    const { FakeAudioContext } = makeFakeAudioContextClass({ withoutWorklet: true });
    const ctx = new FakeAudioContext();
    ctx.timeDomainSource = (buf) => {
      const end = Math.round(ctx.currentTime * ctx.sampleRate);
      for (let i = 0; i < buf.length; i++) buf[i] = end - buf.length + i + 1;
    };
    const received: number[] = [];
    const capture = await startSampleCapture(
      ctx as unknown as AudioContext,
      source,
      (s) => received.push(...Array.from(s)),
      { pollIntervalMs: 20, analyserFftSize: 4096 },
    );

    // Irregular ticks (jitter): 20 ms, 35 ms, 7 ms of audio per poll.
    for (const dt of [0.02, 0.035, 0.007]) {
      ctx.currentTime += dt;
      vi.advanceTimersByTime(20);
    }
    const expectedTotal = Math.round(0.062 * 48000);
    expect(received).toHaveLength(expectedTotal);
    for (let i = 1; i < received.length; i++) {
      expect(received[i] - received[i - 1]).toBe(1);
    }
    expect(received[received.length - 1]).toBe(expectedTotal);

    // A throttled gap longer than the window is zero-filled, not compressed.
    received.length = 0;
    ctx.currentTime += 0.5; // 24000 samples > 4096
    vi.advanceTimersByTime(20);
    expect(received).toHaveLength(24000);
    expect(received.slice(0, 24000 - 4096).every((v) => v === 0)).toBe(true);

    capture.stop();
    ctx.currentTime += 0.02;
    vi.advanceTimersByTime(40);
    expect(received).toHaveLength(24000); // nothing after stop
    expect(vi.getTimerCount()).toBe(0);
  });
});
