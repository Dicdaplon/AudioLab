import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import * as core from "@audiolab/core";
import type { MicSource } from "@audiolab/core";
import { useTonality } from "../../src/hooks/useTonality";
import {
  dbSpectrumForNotes,
  installWebAudioFakes,
  type FakeAudioContextInstance,
  type InstalledFakes,
} from "../../../core/tests/helpers/fakeWebAudio";

const C_MAJOR = dbSpectrumForNotes([60, 64, 67]); // C4 E4 G4 at 48 kHz, 16384-point FFT

describe("useTonality", () => {
  let fakes: InstalledFakes;
  let mic: MicSource;
  let context: FakeAudioContextInstance;

  beforeEach(async () => {
    vi.useFakeTimers();
    fakes = installWebAudioFakes({
      spectrumSource: (buf) => buf.set(C_MAJOR.subarray(0, buf.length)),
    });
    mic = await core.openMicrophone();
    context = fakes.instances[0];
  });

  afterEach(async () => {
    await mic.dispose();
    fakes.restore();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("stays idle without a microphone", () => {
    const { result } = renderHook(() => useTonality(null));
    expect(result.current.chords).toEqual([]);
    expect(result.current.fft.spectrumDb).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("creates one analyser with the requested FFT size and polls at the frame rate", () => {
    renderHook(() => useTonality(mic, { fftSize: 16384, framesPerSecond: 10 }));
    expect(context.createAnalyser).toHaveBeenCalledTimes(1);
    const analyser = context.analysers[0];
    expect(analyser.fftSize).toBe(16384);
    expect(analyser.smoothingTimeConstant).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(analyser.getFloatFrequencyData).toHaveBeenCalledTimes(10);
  });

  it("detects the chord and key from the analyser spectrum", () => {
    const { result } = renderHook(() =>
      useTonality(mic, { framesPerSecond: 10, liveAcquisitionSeconds: 1 }),
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.chords[0].name).toBe("C");
    expect(result.current.liveKeys).toHaveLength(24);
    expect(result.current.signalLevelDb).toBeGreaterThan(-100);
  });

  it("does not copy the spectrum nor estimate the noise floor unless fftEnabled", () => {
    const spy = vi.spyOn(core, "estimateNoiseFloor");
    const { result, rerender } = renderHook(
      ({ enabled }) => useTonality(mic, { framesPerSecond: 10, fftEnabled: enabled }),
      { initialProps: { enabled: false } },
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.fft.spectrumDb).toHaveLength(0);

    rerender({ enabled: true });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.current.fft.spectrumDb).toHaveLength(8192);
    expect(result.current.fft.binHz).toBeCloseTo(48000 / 16384, 6);
    // The copy is independent of the analyser's reused buffer.
    expect(result.current.fft.spectrumDb).not.toBe(context.analysers[0]);
    // Noise floor over the displayed band only (0–4 kHz → 1366 bins).
    expect(spy.mock.calls[0][2]).toEqual({ toBin: Math.ceil(4000 / (48000 / 16384)) });
  });

  it("stops polling and disconnects the analyser when the mic goes away", () => {
    const { result, rerender } = renderHook(({ m }) => useTonality(m, { framesPerSecond: 10 }), {
      initialProps: { m: mic as MicSource | null },
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.chords.length).toBeGreaterThan(0);
    rerender({ m: null });
    expect(vi.getTimerCount()).toBe(0);
    expect(context.analysers[0].disconnect).toHaveBeenCalledTimes(1);
    // The source → analyser link is cut too (the source stays the mic's).
    expect(mic.source.disconnect).toHaveBeenCalledWith(context.analysers[0]);
    expect(context.close).not.toHaveBeenCalled();
    expect(result.current.chords).toEqual([]);
  });

  it("clears timers on unmount", () => {
    const { unmount } = renderHook(() => useTonality(mic));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reset() wipes the frame while the session keeps running", () => {
    const { result } = renderHook(() => useTonality(mic, { framesPerSecond: 10 }));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.chords.length).toBeGreaterThan(0);
    act(() => result.current.reset());
    expect(result.current.chords).toEqual([]);
    expect(Array.from(result.current.chordChroma)).toEqual(new Array(12).fill(0));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.chords[0].name).toBe("C");
  });

  it("reconfigures the window lengths during a session", () => {
    const { result, rerender } = renderHook(
      ({ live }) => useTonality(mic, { framesPerSecond: 10, liveAcquisitionSeconds: live }),
      { initialProps: { live: 2 } },
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // Switch the spectrum to A minor and shrink the live window to 0.5 s:
    // after 0.5 s the live key must follow the new content only.
    context.spectrumSource = (buf) =>
      buf.set(dbSpectrumForNotes([57, 60, 64]).subarray(0, buf.length));
    rerender({ live: 0.5 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.liveAcquisitionChroma[9]).toBeGreaterThan(0.2); // A present
    // G only survives as the 3rd harmonic of C4 (784 Hz = G5), far below
    // the 50 % it had while the window still held the C major frames.
    expect(result.current.liveAcquisitionChroma[7]).toBeLessThan(0.05);
  });
});
