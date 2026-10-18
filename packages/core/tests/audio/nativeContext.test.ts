import { afterEach, describe, expect, it, vi } from "vitest";

import { nativeAudioContext } from "../../src/audio/nativeContext";
import { installFakeAudioWorkletNode, makeFakeAudioContextClass } from "../helpers/fakeWebAudio";

describe("nativeAudioContext", () => {
  it("unwraps a standardized-audio-context wrapper, or returns the context as is", () => {
    const native = { currentTime: 1, sampleRate: 48000 } as unknown as AudioContext;
    const wrapper = { _nativeAudioContext: native, currentTime: 1 } as unknown as AudioContext;
    expect(nativeAudioContext(wrapper)).toBe(native);
    expect(nativeAudioContext(native)).toBe(native);
    const odd = { _nativeAudioContext: 42 } as unknown as AudioContext;
    expect(nativeAudioContext(odd)).toBe(odd);
  });
});

describe("worklet fallback warning", () => {
  afterEach(() => vi.restoreAllMocks());

  it("warns once per page when the worklet path fails", async () => {
    vi.resetModules();
    const { startSampleCapture } = await import("../../src/audio/sampleCapture");
    const worklet = installFakeAudioWorkletNode();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { FakeAudioContext } = makeFakeAudioContextClass();
    const source = { connect: vi.fn(), disconnect: vi.fn() } as unknown as AudioNode;
    for (let i = 0; i < 2; i++) {
      const ctx = new FakeAudioContext();
      ctx.audioWorklet!.addModule.mockRejectedValueOnce(new Error("wrapped context"));
      const capture = await startSampleCapture(ctx as unknown as AudioContext, source, vi.fn());
      expect(capture.method).toBe("analyser");
      capture.stop();
    }
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/nativeAudioContext/);
    worklet.restore();
  });
});
