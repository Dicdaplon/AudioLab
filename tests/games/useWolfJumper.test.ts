import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChordScore } from "../../src/analysis/chordDetection";
import { MAX_HP } from "../../src/features/games/wolf-jumper/constants";
import { dominantNote, pushChromaFrame } from "../../src/features/games/wolf-jumper/noteDetection";
import {
  useWolfJumper,
  type WolfJumperInputs,
} from "../../src/features/games/wolf-jumper/useWolfJumper";

function chroma(pc: number, energy = 0.8): Float32Array {
  const c = new Float32Array(12).fill(0.02);
  c[pc] = energy;
  return c;
}

describe("noteDetection", () => {
  it("keeps the last N well-formed frames", () => {
    let h: readonly Float32Array[] = [];
    const frames = [chroma(0), chroma(2), chroma(4), chroma(5)];
    for (const f of frames) h = pushChromaFrame(h, f, 3);
    expect(h).toEqual(frames.slice(1));
    expect(pushChromaFrame(h, new Float32Array(0), 3)).toBe(h);
  });

  it("returns the strongest pitch class of the averaged frames", () => {
    const n = dominantNote([chroma(0, 0.9), chroma(7, 0.5), chroma(7, 0.5)]);
    expect(n?.pc).toBe(7);
    expect(n?.energy).toBeCloseTo((0.5 + 0.5 + 0.02) / 3);
  });

  it("returns null without frames or on silence", () => {
    expect(dominantNote([])).toBeNull();
    expect(dominantNote([new Float32Array(12)])).toBeNull();
  });
});

describe("useWolfJumper", () => {
  let frameCallbacks: Map<number, FrameRequestCallback>;
  let nextHandle: number;

  beforeEach(() => {
    frameCallbacks = new Map();
    nextHandle = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frameCallbacks.set(nextHandle, cb);
      return nextHandle++;
    });
    vi.stubGlobal("cancelAnimationFrame", (handle: number) => frameCallbacks.delete(handle));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /** Runs the pending animation frame callbacks at `timestamp`. */
  function animate(timestamp: number) {
    const pending = [...frameCallbacks.values()];
    frameCallbacks.clear();
    act(() => pending.forEach((cb) => cb(timestamp)));
  }

  const chord = (name: string, probability = 0.6): ChordScore[] => [
    { root: 0, quality: "maj", name, similarity: 0.9, probability },
  ];

  function setup(initial: Partial<WolfJumperInputs> = {}) {
    let props: WolfJumperInputs = {
      instantaneousChroma: new Float32Array(12),
      chords: [],
      running: true,
      signalLevelDb: -30,
      ...initial,
    };
    const hook = renderHook((p: WolfJumperInputs) => useWolfJumper(p), { initialProps: props });
    const update = (patch: Partial<WolfJumperInputs>) => {
      props = { ...props, ...patch };
      hook.rerender(props);
    };
    const state = () => hook.result.current.store.getState();
    return { hook, update, state };
  }

  it("does not animate while the mic is stopped", () => {
    const { update, state } = setup({ running: false });
    expect(frameCallbacks.size).toBe(0);

    update({ running: true });
    expect(frameCallbacks.size).toBe(1);
    animate(1000);
    animate(1016);
    expect(state().time).toBe(16);
    expect(state().enemies).toHaveLength(1);

    update({ running: false });
    expect(frameCallbacks.size).toBe(0);
  });

  it("does not simulate the time spent paused", () => {
    const { update, state } = setup();
    animate(0);
    animate(50);
    update({ running: false });
    update({ running: true });
    animate(10_000);
    animate(10_020);
    expect(state().time).toBe(70);
  });

  it("stops animating on game over", () => {
    const { hook, state } = setup();
    act(() => {
      const { store } = hook.result.current;
      for (let i = 0; i < MAX_HP; i++) store.dispatch({ type: "spawnEnemy", pc: 0 });
    });
    animate(0);
    for (let t = 100; !state().gameOver && t < 60_000; t += 100) animate(t);
    expect(state().gameOver).toBe(true);
    expect(hook.result.current.gameOver).toBe(true);
    expect(frameCallbacks.size).toBe(0);
  });

  it("kills enemies of a note held for two frames", () => {
    const { hook, update, state } = setup();
    act(() => hook.result.current.store.dispatch({ type: "spawnEnemy", pc: 0 }));

    update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(0);
    update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(1);
    expect(hook.result.current.note?.pc).toBe(0);
  });

  it("ignores notes while the noise gate is closed", () => {
    const { hook, update, state } = setup({ signalLevelDb: -80 });
    act(() => hook.result.current.store.dispatch({ type: "spawnEnemy", pc: 0 }));
    expect(hook.result.current.gateOpen).toBe(false);
    for (let i = 0; i < 4; i++) update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(0);

    act(() => hook.result.current.setNoiseGateDb(-90));
    update({ instantaneousChroma: chroma(0) });
    update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(1);
  });

  it("collects a bonus when its chord is held for three frames", () => {
    const { hook, update, state } = setup();
    act(() =>
      hook.result.current.store.dispatch({
        type: "spawnBonus",
        bonusType: "shield",
        chordName: "G",
      }),
    );
    update({ chords: chord("G") });
    update({ chords: chord("G") });
    expect(state().bonuses[0].status).toBe("alive");
    update({ chords: chord("G") });
    expect(state().bonuses[0].status).toBe("collected");
    expect(state().effects.shieldUntil).toBeGreaterThan(0);
  });

  it("reset starts a new game", () => {
    const { hook, update, state } = setup();
    act(() => hook.result.current.store.dispatch({ type: "spawnEnemy", pc: 0 }));
    update({ instantaneousChroma: chroma(0) });
    update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(1);
    act(() => hook.result.current.reset());
    expect(state()).toMatchObject({ score: 0, hp: MAX_HP, enemies: [] });
  });
});
