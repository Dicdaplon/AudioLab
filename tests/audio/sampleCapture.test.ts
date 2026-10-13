import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

import { SampleBatcher } from "../../src/audio/sampleBatcher";
import { makeFakeAudioContextClass } from "../helpers/fakeWebAudio";

vi.mock("../../src/audio/sampleCaptureWorkletUrl", () => ({ default: "mock-worklet-url.js" }));

import { startSampleCapture } from "../../src/audio/sampleCapture";

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
    delete g.AudioWorkletProcessor;
    delete g.registerProcessor;
    registered = null;
  });

  it("registers 'sample-capture' and posts transferable 2048-sample batches", async () => {
    await import("../../src/audio/sampleCapture.worklet");
    expect(registered?.name).toBe("sample-capture");
    const processor = new registered!.ctor() as {
      process(inputs: Float32Array[][]): boolean;
    };

    const block = new Float32Array(128).fill(0.25);
    for (let i = 0; i < 15; i++) expect(processor.process([[block]])).toBe(true);
    expect(postMessage).not.toHaveBeenCalled();
    block.fill(0.5);
    processor.process([[block]]); // 16 × 128 = 2048
    expect(postMessage).toHaveBeenCalledTimes(1);
    const [batch, transfer] = postMessage.mock.calls[0] as [Float32Array, ArrayBuffer[]];
    expect(batch).toBeInstanceOf(Float32Array);
    expect(batch).toHaveLength(2048);
    expect(batch[0]).toBe(0.25);
    expect(batch[2047]).toBe(0.5);
    expect(transfer).toEqual([batch.buffer]);
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
  const g = globalThis as unknown as Record<string, unknown>;
  const source = { connect: vi.fn(), disconnect: vi.fn() } as unknown as AudioNode;

  interface FakeNode {
    port: { onmessage: ((e: MessageEvent) => void) | null };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    name: string;
  }
  let nodes: FakeNode[] = [];

  beforeEach(() => {
    nodes = [];
    g.AudioWorkletNode = class {
      port = { onmessage: null };
      connect = vi.fn();
      disconnect = vi.fn();
      constructor(
        _ctx: unknown,
        public name: string,
      ) {
        nodes.push(this as unknown as FakeNode);
      }
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    delete g.AudioWorkletNode;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("uses the worklet, forwards its messages and disconnects on stop", async () => {
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const ctx = new FakeAudioContext() as unknown as AudioContext;
    const onSamples = vi.fn();
    const capture = await startSampleCapture(ctx, source, onSamples);

    expect(capture.method).toBe("worklet");
    expect(ctx.audioWorklet.addModule).toHaveBeenCalledWith("mock-worklet-url.js");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe("sample-capture");
    expect(source.connect).toHaveBeenCalledWith(nodes[0]);
    expect(nodes[0].connect).toHaveBeenCalledWith(ctx.destination);

    const batch = new Float32Array([1, 2, 3]);
    nodes[0].port.onmessage!({ data: batch } as MessageEvent);
    nodes[0].port.onmessage!({ data: "not samples" } as MessageEvent);
    expect(onSamples).toHaveBeenCalledTimes(1);
    expect(onSamples).toHaveBeenCalledWith(batch);

    capture.stop();
    capture.stop();
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(nodes[0].port.onmessage).toBeNull();
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
