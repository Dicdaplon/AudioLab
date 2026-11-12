import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import * as core from "@audiolab/core";
import type { MicSource } from "@audiolab/core";
import { useStageSignals } from "../../src/stage/useStageSignals";
import {
  dbSpectrumForNotes,
  installWebAudioFakes,
  type InstalledFakes,
} from "../../../core/tests/helpers/fakeWebAudio";

const A_MINOR_CHORD = dbSpectrumForNotes([57, 60, 64]);

describe("useStageSignals", () => {
  let fakes: InstalledFakes;
  let mic: MicSource;

  beforeEach(async () => {
    vi.useFakeTimers();
    fakes = installWebAudioFakes({
      spectrumSource: (buf) => buf.set(A_MINOR_CHORD.subarray(0, buf.length)),
      withoutWorklet: true,
    });
    mic = await core.openMicrophone();
  });

  afterEach(async () => {
    await mic.dispose();
    fakes.restore();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("listens with no chord and empty signals without sessions", () => {
    const { result } = renderHook(() => useStageSignals(null, null));
    expect(result.current.key).toMatchObject({ phase: "listening", key: null });
    expect(result.current.chord.current).toBeNull();
    expect(result.current.note).toBeNull();
    const s = result.current.signals.current!;
    expect(s.onsets).toEqual([]);
    expect(s.harmonyTap).toBeNull();
    expect(s.beatAt(1)).toBeNull();
  });

  it("follows the chords and settles the key of a session, then resets", () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const { result } = renderHook(() =>
      useStageSignals(mic, mic, { pitch: false, tempo: false, onsets: false }),
    );
    for (let i = 0; i < 80; i++) {
      now += 100;
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }
    expect(result.current.chord.current).toMatchObject({ root: 9, quality: "min" });
    expect(result.current.key.key).not.toBeNull();
    const s = result.current.signals.current!;
    expect(s.chordChangedAt).not.toBeNull();
    expect(s.harmonyTap).not.toBeNull();
    expect(s.chroma.chord[9]).toBeGreaterThan(0);

    act(() => result.current.reset());
    expect(result.current.key.phase).toBe("listening");
    expect(result.current.chord.history).toEqual([]);
    expect(s.chordChangedAt).toBeNull();
  });

  it("starts the song over after a long silence", () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const { result } = renderHook(() =>
      useStageSignals(mic, mic, {
        pitch: false,
        tempo: false,
        onsets: false,
        settings: { songBreakSeconds: 2 },
      }),
    );
    const tick = (n: number) => {
      for (let i = 0; i < n; i++) {
        now += 100;
        act(() => {
          vi.advanceTimersByTime(100);
        });
      }
    };
    tick(60);
    expect(result.current.chord.history.length).toBeGreaterThan(0);
    fakes.instances[0].spectrumSource = (buf) => buf.fill(-Infinity);
    tick(30);
    expect(result.current.key.phase).toBe("listening");
    expect(result.current.chord.history).toEqual([]);
  });

  it("re-tunes on new settings without restarting, and reads chords from the notes session", async () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const second = await core.openMicrophone();
    const { result, rerender } = renderHook(
      ({ settings }) =>
        useStageSignals(mic, second, { pitch: false, tempo: false, onsets: false, settings }),
      { initialProps: { settings: { chordSource: "notes" as const, chordHoldSeconds: 0.1 } } },
    );
    for (let i = 0; i < 40; i++) {
      now += 100;
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }
    // Both sessions hear the same fake spectrum: the notes session finds A minor too.
    expect(result.current.chord.current).toMatchObject({ root: 9, quality: "min" });
    const firstMic = result.current.signals.current!.harmonyTap;
    rerender({ settings: { chordSource: "notes" as const, chordHoldSeconds: 0.9 } });
    expect(result.current.signals.current!.harmonyTap).toBe(firstMic);
    await second.dispose();
  });
});
