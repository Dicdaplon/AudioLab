// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TonalityEngine } from "../../src/analysis/engine/tonalityEngine";
import { startLiveAnalysis } from "../../src/audio/liveAnalysis";
import {
  dbSpectrumForNotes,
  makeFakeAudioContextClass,
  type FakeAudioContextInstance,
} from "../helpers/fakeWebAudio";
import { notes } from "../helpers/synth";

const C_MAJOR = dbSpectrumForNotes([60, 64, 67]);

describe("startLiveAnalysis", () => {
  let context: FakeAudioContextInstance;
  let source: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    const { FakeAudioContext } = makeFakeAudioContextClass({
      spectrumSource: (buf) => buf.set(C_MAJOR.subarray(0, buf.length)),
    });
    context = new FakeAudioContext();
    source = { connect: vi.fn(), disconnect: vi.fn() };
  });

  afterEach(() => vi.useRealTimers());

  const start = (options: Partial<Parameters<typeof startLiveAnalysis>[0]> = {}) =>
    startLiveAnalysis({
      context: context as unknown as AudioContext,
      source: source as unknown as AudioNode,
      ...options,
    });

  it("polls at the frame rate and keeps the last frame", () => {
    const live = start({ framesPerSecond: 20 });
    expect(source.connect).toHaveBeenCalledWith(context.analysers[0]);
    expect(context.analysers[0].fftSize).toBe(16384);
    expect(live.latest()).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(context.analysers[0].getFloatFrequencyData).toHaveBeenCalledTimes(20);
    expect(live.latest()?.chords[0].name).toBe("C");
    expect(live.engine.config.framesPerSecond).toBe(20);
    live.stop();
  });

  it("calls subscribers on every frame until they unsubscribe", () => {
    const live = start();
    const listener = vi.fn();
    const unsubscribe = live.subscribe(listener);
    vi.advanceTimersByTime(300);
    expect(listener).toHaveBeenCalledTimes(3);
    const [frame, spectrum] = listener.mock.calls[0];
    expect(frame.signalLevelDb).toBeGreaterThan(-100);
    expect(spectrum).toMatchObject({ sampleRate: 48000 });
    expect(spectrum.db).toHaveLength(8192);
    unsubscribe();
    vi.advanceTimersByTime(300);
    expect(listener).toHaveBeenCalledTimes(3);
    live.stop();
  });

  it("drives an injected engine with its configuration", () => {
    const engine = new TonalityEngine({ framesPerSecond: 5, chordQualities: ["maj", "dom7"] });
    const live = start({ engine, fftSize: 4096 });
    expect(live.engine).toBe(engine);
    expect(context.analysers[0].fftSize).toBe(4096);
    vi.advanceTimersByTime(1000);
    expect(context.analysers[0].getFloatFrequencyData).toHaveBeenCalledTimes(5);
    live.stop();

    const other = start({ engine: new TonalityEngine(), framesPerSecond: 2 });
    expect(other.engine.config.framesPerSecond).toBe(2);
    other.stop();
  });

  it("stop detaches the analyser, never touches the context, and is idempotent", () => {
    const live = start();
    const listener = vi.fn();
    live.subscribe(listener);
    live.stop();
    live.stop();
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(source.disconnect).toHaveBeenCalledWith(context.analysers[0]);
    expect(context.analysers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(context.close).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(listener).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("tolerates a source that is already disconnected", () => {
    source.disconnect.mockImplementation(() => {
      throw new DOMException("not connected", "InvalidAccessError");
    });
    const live = start();
    expect(() => live.stop()).not.toThrow();
    expect(context.analysers[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it("adds a 32768-sample time analyser for the cqt chroma, and detaches it", () => {
    context.timeDomainSource = (buf) =>
      buf.set(notes([48, 52, 55], { sampleRate: 48000, seconds: buf.length / 48000 }));
    const live = start({ engine: new TonalityEngine({ chromaMethod: "cqt" }) });
    vi.advanceTimersByTime(300);
    const time = context.analysers[1];
    expect(time.fftSize).toBe(32768);
    expect(source.connect).toHaveBeenCalledWith(time);
    expect(time.getFloatTimeDomainData).toHaveBeenCalledTimes(3);
    expect(live.latest()?.chords[0].name).toBe("C");
    expect(live.latest()?.signalLevelDb).toBeGreaterThan(-100);
    live.stop();
    expect(source.disconnect).toHaveBeenCalledWith(time);
  });

  it("stops the cqt path even when the time analyser is already detached", () => {
    const live = start({ engine: new TonalityEngine({ chromaMethod: "cqt" }) });
    vi.advanceTimersByTime(100);
    source.disconnect.mockImplementation((node) => {
      if (node === context.analysers[1])
        throw new DOMException("not connected", "InvalidAccessError");
    });
    expect(() => live.stop()).not.toThrow();
  });
});
