import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useDisplayFramePeriod } from "../../src/hooks/useDisplayFramePeriod";

describe("useDisplayFramePeriod", () => {
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 1;

  function stubFrames() {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      callbacks.set(next, cb);
      return next++;
    });
    vi.stubGlobal("cancelAnimationFrame", (h: number) => callbacks.delete(h));
  }

  function runFrames(count: number, periodMs: number, start = 0, gapAt = -1) {
    let t = start;
    act(() => {
      for (let k = 0; k < count; k++) {
        t += k === gapAt ? 500 : periodMs;
        const pending = [...callbacks.values()];
        callbacks.clear();
        pending.forEach((cb) => cb(t));
      }
    });
    return t;
  }

  afterEach(() => {
    callbacks.clear();
    vi.unstubAllGlobals();
  });

  it("measures the median frame period, ignoring hidden-tab gaps", () => {
    stubFrames();
    const { result } = renderHook(() => useDisplayFramePeriod());
    expect(result.current).toBeNull();
    const t = runFrames(70, 1000 / 60, 0, 30);
    expect(result.current).toBeCloseTo(16.67, 1);
    // A change below 0.2 ms keeps the same value; a new rate replaces it.
    runFrames(70, 1000 / 60 + 0.05, t);
    expect(result.current).toBeCloseTo(16.67, 1);
    runFrames(70, 1000 / 144, t + 2000);
    expect(result.current).toBeCloseTo(6.94, 1);
  });

  it("does nothing while disabled or without requestAnimationFrame", () => {
    stubFrames();
    const { result, unmount } = renderHook(() => useDisplayFramePeriod(false));
    expect(callbacks.size).toBe(0);
    expect(result.current).toBeNull();
    unmount();
    vi.stubGlobal("requestAnimationFrame", undefined);
    expect(renderHook(() => useDisplayFramePeriod()).result.current).toBeNull();
  });
});
