// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChordScore } from "@audiolab/core";
import { WOLF_JUMPER_DEFAULTS } from "@audiolab/core/games";
import { useWolfJumper, type WolfJumperInputs } from "../../src/games/wolf-jumper/useWolfJumper";

const MAX_HP = WOLF_JUMPER_DEFAULTS.maxHp;

function chroma(pc: number, energy = 0.8): Float32Array {
  const c = new Float32Array(12).fill(0.02);
  c[pc] = energy;
  return c;
}

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
    { root: 7, quality: "maj", name, similarity: 0.9, probability },
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

  it("ignores notes while the manual noise gate is closed", () => {
    const { hook, update, state } = setup({ signalLevelDb: -80, gate: "manual" });
    act(() => hook.result.current.store.dispatch({ type: "spawnEnemy", pc: 0 }));
    expect(hook.result.current.gateOpen).toBe(false);
    for (let i = 0; i < 4; i++) update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(0);

    act(() => hook.result.current.setNoiseGateDb(-90));
    update({ instantaneousChroma: chroma(0) });
    update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(1);
  });

  it("gates automatically by default and switches to manual on a threshold", () => {
    const { hook, update, state } = setup({ signalLevelDb: -70 });
    expect(hook.result.current.gateMode).toBe("auto");
    // Room noise: the gate learns it, then closes.
    for (let i = 0; i < 60; i++) update({ instantaneousChroma: chroma(5, 0.3 + i * 0.001) });
    expect(hook.result.current.gate?.floorDb).toBeCloseTo(-70, 0);
    expect(hook.result.current.gateOpen).toBe(false);
    // A game is strict: 6 dB above the room is not enough, 12 dB gets through.
    act(() => hook.result.current.store.dispatch({ type: "spawnEnemy", pc: 0 }));
    update({ instantaneousChroma: chroma(0, 0.7), signalLevelDb: -64 });
    expect(hook.result.current.gateOpen).toBe(false);
    update({ instantaneousChroma: chroma(0), signalLevelDb: -58 });
    update({ instantaneousChroma: chroma(0, 0.81), signalLevelDb: -58 });
    expect(state().score).toBe(1);

    act(() => hook.result.current.setNoiseGateDb(-40));
    expect(hook.result.current.gateMode).toBe("manual");
    expect(hook.result.current.gate).toBeNull();
    expect(hook.result.current.gateOpen).toBe(false);
  });

  it("collects a bonus when its chord is held for three frames", () => {
    const { hook, update, state } = setup();
    act(() =>
      hook.result.current.store.dispatch({
        type: "spawnBonus",
        bonusType: "shield",
        chord: { root: 7, quality: "maj" },
      }),
    );
    update({ chords: chord("G") });
    update({ chords: chord("G") });
    expect(state().bonuses[0].status).toBe("alive");
    update({ chords: chord("G") });
    expect(state().bonuses[0].status).toBe("collected");
    expect(state().effects.shieldUntil).toBeGreaterThan(0);
  });

  it("ignores notes outside a restricted note pool and applies detection settings", () => {
    const { hook, update, state } = setup({
      config: { notePool: [9, 0, 2, 4, 7], maxHp: 2 },
      detection: { noteConfirmations: 3 },
    });
    expect(state().hp).toBe(2);
    act(() => {
      hook.result.current.store.dispatch({ type: "spawnEnemy", pc: 11 });
      hook.result.current.store.dispatch({ type: "spawnEnemy", pc: 0 });
    });
    for (let i = 0; i < 4; i++) update({ instantaneousChroma: chroma(11) });
    expect(state().score).toBe(0);
    // One frame for the 3-frame smoothing to flip to C, then three confirmations.
    for (let i = 0; i < 3; i++) update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(0);
    update({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(1);
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
