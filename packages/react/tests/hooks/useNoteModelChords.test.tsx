/**
 * useNoteModelChords on the Web Audio fakes, with a fake note model: the
 * real capture feeds `NoteModelChords`, and the hook runs the model on its
 * own timer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { openMicrophone, type MicSource, type NoteModelRunner } from "@audiolab/core";
import {
  useNoteModelChords,
  type UseNoteModelChordsOptions,
} from "../../src/hooks/useNoteModelChords";
import { C_OR_AM, fakeNoteModel } from "../../../core/tests/helpers/fakeNoteModel";
import {
  installFakeAudioWorkletNode,
  installWebAudioFakes,
  type InstalledFakes,
  type InstalledWorkletNode,
} from "../../../core/tests/helpers/fakeWebAudio";

const SR = 48_000;

describe("useNoteModelChords", () => {
  let fakes: InstalledFakes;
  let worklet: InstalledWorkletNode;
  let mic: MicSource;
  let frame = 0;

  beforeEach(async () => {
    vi.useFakeTimers();
    fakes = installWebAudioFakes({ sampleRate: SR });
    worklet = installFakeAudioWorkletNode();
    mic = await openMicrophone();
    frame = 0;
  });

  afterEach(async () => {
    await mic.dispose();
    worklet.restore();
    fakes.restore();
    vi.useRealTimers();
  });

  /** Posts `seconds` of a constant as 2048-sample worklet batches. */
  function play(value: number, seconds: number) {
    const batch = 2048;
    const total = Math.round(seconds * SR);
    for (let n = 0; n + batch <= total; n += batch) {
      worklet.nodes[0].emit({ samples: new Float32Array(batch).fill(value), startFrame: frame });
      frame += batch;
    }
  }

  async function advance(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  function setup(options: UseNoteModelChordsOptions, initialMic: MicSource | null = mic) {
    let props = { mic: initialMic, options };
    const hook = renderHook((p: typeof props) => useNoteModelChords(p.mic, p.options), {
      initialProps: props,
    });
    const rerender = (patch: Partial<typeof props>) => {
      props = { ...props, ...patch };
      hook.rerender(props);
    };
    return { hook, rerender };
  }

  it("stays idle without a microphone or a runner", async () => {
    const a = setup({ runner: fakeNoteModel(C_OR_AM) }, null);
    const b = setup({ runner: null });
    await act(async () => {});
    for (const h of [a.hook, b.hook]) {
      expect(h.result.current.ready).toBe(false);
      expect(h.result.current.captureMethod).toBeNull();
      expect(h.result.current.chords).toEqual([]);
    }
  });

  it("runs the model on the captured audio and publishes the chord", async () => {
    const model = fakeNoteModel(C_OR_AM);
    const { hook } = setup({ runner: model, bassRange: [40, 54] });
    await act(async () => {});
    expect(hook.result.current.captureMethod).toBe("worklet");
    expect(hook.result.current.ready).toBe(false);

    await advance(250); // nothing captured yet: the model is not called
    expect(model.calls.length).toBe(0);

    for (let i = 0; i < 8; i++) {
      play(0.5, 0.25);
      await advance(250);
    }
    const s = hook.result.current;
    expect(s.ready).toBe(true);
    expect(s.error).toBeNull();
    expect(s.chord?.name).toBe("C");
    expect(s.chords).toHaveLength(24);
    expect(s.notes).toEqual([48, 60, 64, 67]);
    expect(s.result?.streamTime).toBeGreaterThan(1.6); // whole 2048-sample batches only
    expect(s.inferenceMs).toBeGreaterThanOrEqual(0);
    expect(model.calls.length).toBe(8);

    // No new audio: no model run and the same state object.
    await advance(1000);
    expect(model.calls.length).toBe(8);
    expect(hook.result.current).toBe(s);
  });

  it("never runs the model twice at once", async () => {
    const calls: Float32Array[] = [];
    const slow: NoteModelRunner = {
      run: (w) => {
        calls.push(w);
        return new Promise(() => {}); // never settles
      },
    };
    setup({ runner: slow, intervalMs: 100 });
    await act(async () => {});
    play(0.5, 1);
    await advance(1000);
    expect(calls.length).toBe(1);
  });

  it("reports a failing runner and stops calling it", async () => {
    let calls = 0;
    const broken: NoteModelRunner = {
      run: () => {
        calls++;
        return Promise.reject(new Error("model failed"));
      },
    };
    const { hook } = setup({ runner: broken });
    await act(async () => {});
    play(0.5, 1);
    await advance(250);
    expect(hook.result.current.error?.message).toBe("model failed");
    play(0.5, 1);
    await advance(1000);
    expect(calls).toBe(1);
  });

  it("wraps a non-Error rejection", async () => {
    const broken: NoteModelRunner = { run: () => Promise.reject("nope") };
    const { hook } = setup({ runner: broken });
    await act(async () => {});
    play(0.5, 0.5);
    await advance(250);
    expect(hook.result.current.error).toBeInstanceOf(Error);
    expect(hook.result.current.error?.message).toBe("nope");
  });

  it("goes idle when disabled and ignores a result that lands after", async () => {
    let resolve: (() => void) | null = null;
    const inner = fakeNoteModel(C_OR_AM);
    const deferred: NoteModelRunner = {
      run: (w) =>
        new Promise((r) => {
          resolve = () => void inner.run(w).then(r);
        }),
    };
    const { hook, rerender } = setup({ runner: deferred });
    await act(async () => {});
    play(0.5, 1);
    await advance(250);
    expect(resolve).not.toBeNull();
    rerender({ options: { runner: deferred, enabled: false } });
    await act(async () => {
      resolve!();
    });
    expect(hook.result.current.ready).toBe(false);
    expect(hook.result.current.captureMethod).toBeNull();
  });

  it("ignores a failure that lands after unmount", async () => {
    let reject: (() => void) | null = null;
    const deferred: NoteModelRunner = {
      run: () =>
        new Promise((_, r) => {
          reject = () => r(new Error("late"));
        }),
    };
    const { hook } = setup({ runner: deferred });
    await act(async () => {});
    play(0.5, 1);
    await advance(250);
    const before = hook.result.current;
    hook.unmount();
    await act(async () => {
      reject!();
    });
    expect(before.error).toBeNull();
    expect(hook.result.current.error).toBeNull();
  });

  it("stops a capture that starts after unmount", async () => {
    const { hook } = setup({ runner: fakeNoteModel(C_OR_AM) });
    hook.unmount();
    await act(async () => {});
    expect(worklet.nodes.length).toBeLessThanOrEqual(1);
  });
});
