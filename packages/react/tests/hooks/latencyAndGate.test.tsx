import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { GATE_LEVELS, StreamHistory } from "@audiolab/core";
import { useAdaptiveGate } from "../../src/hooks/useAdaptiveGate";
import { useLatencyTest } from "../../src/hooks/useLatencyTest";

const SR = 48000;

function fakeContext() {
  const param = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  return {
    currentTime: 0,
    sampleRate: SR,
    destination: {},
    createOscillator: () => ({
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createGain: () => ({ gain: param(), connect: vi.fn() }),
  } as unknown as BaseAudioContext;
}

function silence(seconds: number): StreamHistory {
  const h = new StreamHistory(seconds * SR);
  h.push(new Float32Array(seconds * SR), 0);
  return h;
}

describe("useLatencyTest", () => {
  afterEach(() => vi.useRealTimers());

  it("does nothing without a context", () => {
    const { result } = renderHook(() => useLatencyTest(null));
    act(() => result.current.start());
    expect(result.current.active).toBe(false);
    expect(result.current.grid).toBeNull();
  });

  it("measures the delay of notes played on the clicks after the count-in", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLatencyTest(fakeContext()));
    act(() => result.current.start());
    expect(result.current.active).toBe(true);
    const grid = result.current.grid!;
    // 4 clicks of count-in at 80 BPM: the first click to play on is at 3 s.
    expect(grid.startTime).toBeCloseTo(3, 9);
    const h = silence(12);
    const clicks = Array.from({ length: 8 }, (_, k) => 3 + k * 0.75);
    act(() => {
      clicks.forEach((t, id) => {
        const time = t + 0.3;
        result.current.onOnset({ id, time, frame: Math.round(time * SR) });
      });
      result.current.onBatch(h, 8);
    });
    expect(result.current.taps).toBe(8);
    act(() => result.current.onBatch(h, 11));
    expect(result.current.active).toBe(false);
    expect(result.current.taps).toBe(0);
    expect(result.current.result?.offsetMs).toBeCloseTo(300, 6);
    expect(result.current.result?.reliable).toBe(true);
  });

  it("fails a test where nothing was heard, and keeps the result when cancelled", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLatencyTest(fakeContext()));
    const h = silence(12);
    act(() => result.current.start());
    act(() => result.current.onBatch(h, 11));
    expect(result.current.result).toMatchObject({ taps: 0, reliable: false, clicks: 8 });
    const failed = result.current.result;
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(result.current.active).toBe(false);
    expect(result.current.result).toBe(failed);
  });
});

describe("useAdaptiveGate", () => {
  it("learns the room, opens on playing, steps once per frame", () => {
    const { result, rerender } = renderHook(
      ({ level, frame, strictness, enabled }) =>
        useAdaptiveGate(level, frame, { strictness, enabled }),
      {
        initialProps: {
          level: undefined as number | undefined,
          frame: {} as object,
          strictness: GATE_LEVELS.normal,
          enabled: true,
        },
      },
    );
    expect(result.current).toBeNull();
    for (let i = 0; i < 40; i++) {
      rerender({ level: -70, frame: {}, strictness: GATE_LEVELS.normal, enabled: true });
    }
    expect(result.current?.floorDb).toBeCloseTo(-70, 0);
    expect(result.current?.open).toBe(false);
    // The same frame again does not step: the gate stays as it was.
    const frame = {};
    rerender({ level: -40, frame, strictness: GATE_LEVELS.normal, enabled: true });
    expect(result.current?.open).toBe(true);
    const state = result.current;
    rerender({ level: -40, frame, strictness: GATE_LEVELS.strict, enabled: true });
    expect(result.current).toBe(state);
    // Disabled: nothing moves.
    rerender({ level: -90, frame: {}, strictness: GATE_LEVELS.strict, enabled: false });
    expect(result.current).toBe(state);
    // Strict: 6 dB above the room is no longer enough.
    rerender({ level: -64, frame: {}, strictness: GATE_LEVELS.strict, enabled: true });
    expect(result.current?.openThresholdDb).toBeCloseTo(-70 + 8.49, 1);
  });
});
