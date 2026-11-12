// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { startSignalTap } from "../../src/audio/signalTap";
import { makeFakeAudioContextClass } from "../helpers/fakeWebAudio";

function setup() {
  const { FakeAudioContext } = makeFakeAudioContextClass({
    sampleRate: 48000,
    timeDomainSource: (buf) => buf.fill(0.5),
    spectrumSource: (buf) => buf.fill(-30),
  });
  const context = new FakeAudioContext();
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  return { context, source };
}

describe("startSignalTap", () => {
  it("puts a small smoothed analyser of its own on the source", () => {
    const { context, source } = setup();
    const tap = startSignalTap(context as unknown as AudioContext, source as unknown as AudioNode);
    const analyser = context.analysers[0];
    expect(source.connect).toHaveBeenCalledWith(analyser);
    expect(analyser.fftSize).toBe(2048);
    expect(analyser.smoothingTimeConstant).toBe(0.8);
    expect(tap.size).toBe(2048);
    expect(tap.bins).toBe(1024);
    expect(tap.binHz).toBeCloseTo(48000 / 2048);
    expect(tap.sampleRate).toBe(48000);
  });

  it("reads time-domain samples and the dB spectrum into the caller's buffers", () => {
    const { context, source } = setup();
    const tap = startSignalTap(context as unknown as AudioContext, source as unknown as AudioNode, {
      fftSize: 512,
      smoothingTimeConstant: 0.5,
    });
    const samples = new Float32Array(tap.size);
    const db = new Float32Array(tap.bins);
    tap.readTimeDomain(samples);
    tap.readFrequencyDb(db);
    expect(samples[100]).toBe(0.5);
    expect(db[10]).toBe(-30);
    expect(context.analysers[0].smoothingTimeConstant).toBe(0.5);
  });

  it("disconnects once, and survives a source that is already gone", () => {
    const { context, source } = setup();
    const tap = startSignalTap(context as unknown as AudioContext, source as unknown as AudioNode);
    tap.stop();
    tap.stop();
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(source.disconnect).toHaveBeenCalledWith(context.analysers[0]);

    const other = setup();
    other.source.disconnect.mockImplementation(() => {
      throw new Error("InvalidAccessError");
    });
    const tap2 = startSignalTap(
      other.context as unknown as AudioContext,
      other.source as unknown as AudioNode,
    );
    expect(() => tap2.stop()).not.toThrow();
  });
});
