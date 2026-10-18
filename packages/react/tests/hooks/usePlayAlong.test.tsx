import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { StreamHistory } from "@audiolab/core";
import { usePlayAlong } from "../../src/hooks/usePlayAlong";

const SR = 48000;
const TOL = { onTimeMs: 50, windowMs: 150 };

function silence(seconds: number): StreamHistory {
  const h = new StreamHistory(seconds * SR);
  h.push(new Float32Array(seconds * SR), 0);
  return h;
}

describe("usePlayAlong", () => {
  it("runs a session: onsets in, results as state, end detected", () => {
    const { result } = renderHook(() => usePlayAlong());
    expect(result.current.results).toBeNull();
    expect(result.current.onsets()).toEqual([]);
    // Ignored before a run starts.
    act(() => result.current.onOnset({ id: 9, time: 1, frame: SR }));
    act(() =>
      result.current.start(
        [1, 1.5].map((time, id) => ({ id, time })),
        { sampleRate: SR, tolerance: TOL },
        1.8,
      ),
    );
    expect(result.current.active).toBe(true);
    const h = silence(3);
    act(() => {
      result.current.onOnset({ id: 0, time: 1.01, frame: Math.round(1.01 * SR) });
      result.current.onBatch(h, 1.2);
    });
    expect(result.current.results![0].tier).toBe("onTime");
    expect(result.current.onsets()).toHaveLength(1);
    act(() => result.current.onBatch(h, 2));
    expect(result.current.done).toBe(true);
    expect(result.current.active).toBe(false);
    expect(result.current.results![1].tier).toBe("missed");
    expect(result.current.roundTripMs).toBeNull();
  });

  it("stops on demand and grades what is left", () => {
    const { result } = renderHook(() => usePlayAlong());
    act(() => result.current.stop()); // nothing to stop
    act(() =>
      result.current.start([{ id: 0, time: 5 }], { sampleRate: SR, clickTimes: () => [] }, 6),
    );
    act(() => result.current.stop());
    expect(result.current.done).toBe(true);
    expect(result.current.results![0].tier).toBe("missed");
    act(() => result.current.onBatch(silence(1), 9)); // no run: ignored
  });
});
