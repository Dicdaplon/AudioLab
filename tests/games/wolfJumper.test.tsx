import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_HP } from "../../src/features/games/wolf-jumper/constants";
import { WolfJumper } from "../../src/features/games/wolf-jumper/WolfJumper";

describe("WolfJumper", () => {
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

  function animateFor(ms: number, start = 0) {
    for (let t = start; t <= start + ms; t += 100) {
      const pending = [...frameCallbacks.values()];
      frameCallbacks.clear();
      act(() => pending.forEach((cb) => cb(t)));
    }
  }

  function renderGame(running = true) {
    return render(
      <WolfJumper
        instantaneousChroma={new Float32Array(12)}
        chords={[]}
        running={running}
        signalLevelDb={-30}
        onStart={() => {}}
      />,
    );
  }

  it("shows full health and the mic prompt while stopped", () => {
    const view = renderGame(false);
    expect(view.container.querySelectorAll(".heart.full")).toHaveLength(MAX_HP);
    expect(view.container.querySelector(".game-mic-prompt")).not.toBeNull();
    expect(view.container.querySelector(".jumper-enemy")).toBeNull();
    expect(frameCallbacks.size).toBe(0);
  });

  it("spawns and moves enemies while running", () => {
    const view = renderGame();
    animateFor(200);
    const enemy = view.container.querySelector<HTMLElement>(".jumper-enemy");
    expect(enemy).not.toBeNull();
    const left = parseFloat(enemy!.style.left);
    animateFor(500, 300);
    expect(parseFloat(enemy!.style.left)).toBeLessThan(left);
  });

  it("ends the game when enemies get through, then restarts", () => {
    const view = renderGame();
    animateFor(60_000);
    expect(view.container.querySelectorAll(".heart.full")).toHaveLength(0);
    const overlay = view.container.querySelector(".jumper-overlay");
    expect(overlay).not.toBeNull();
    expect(frameCallbacks.size).toBe(0);

    fireEvent.click(overlay!.querySelector("button")!);
    expect(view.container.querySelector(".jumper-overlay")).toBeNull();
    expect(view.container.querySelectorAll(".heart.full")).toHaveLength(MAX_HP);
    expect(frameCallbacks.size).toBe(1);
  });

  it("moves the noise gate threshold with the slider", () => {
    const view = renderGame();
    fireEvent.change(view.getByRole("slider"), { target: { value: "-25" } });
    expect(view.container.querySelector(".jumper-noisegate-value")?.textContent).toBe("-25 dB");
    expect(view.container.querySelector(".jumper-noisegate-threshold.closed")).not.toBeNull();
  });
});
