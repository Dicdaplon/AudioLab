import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WOLF_JUMPER_DEFAULTS } from "@audiolab/core/games";
import { WolfJumper } from "../../src/games/wolf-jumper/WolfJumper";

const MAX_HP = WOLF_JUMPER_DEFAULTS.maxHp;

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
    expect(
      view.container.querySelectorAll(".al-segments--hp .al-segments__seg[data-filled]"),
    ).toHaveLength(MAX_HP);
    expect(view.container.querySelector(".al-notice--mic")).not.toBeNull();
    expect(view.container.querySelector(".al-scene__note")).toBeNull();
    expect(frameCallbacks.size).toBe(0);
  });

  it("spawns and moves enemies while running", () => {
    const view = renderGame();
    animateFor(200);
    const enemy = view.container.querySelector<HTMLElement>(".al-scene__note");
    expect(enemy).not.toBeNull();
    const left = parseFloat(enemy!.style.left);
    animateFor(500, 300);
    expect(parseFloat(enemy!.style.left)).toBeLessThan(left);
  });

  it("ends the game when enemies get through, then restarts", () => {
    const view = renderGame();
    animateFor(60_000);
    expect(
      view.container.querySelectorAll(".al-segments--hp .al-segments__seg[data-filled]"),
    ).toHaveLength(0);
    const overlay = view.container.querySelector(".al-overlay");
    expect(overlay).not.toBeNull();
    expect(frameCallbacks.size).toBe(0);

    fireEvent.click(overlay!.querySelector("button")!);
    expect(view.container.querySelector(".al-overlay")).toBeNull();
    expect(
      view.container.querySelectorAll(".al-segments--hp .al-segments__seg[data-filled]"),
    ).toHaveLength(MAX_HP);
    expect(frameCallbacks.size).toBe(1);
  });

  it("gates automatically, with no slider until the player asks for one", () => {
    const view = renderGame();
    expect(view.container.querySelector(".al-gate__value")?.textContent).toBe("Auto");
    expect(view.queryByRole("slider")).toBeNull();
    expect(view.getByText("Adjusts to your room by itself.")).toBeTruthy();
  });

  it("moves the noise gate threshold with the slider", () => {
    const view = renderGame();
    fireEvent.click(view.getByRole("switch", { name: "Set it myself" }));
    fireEvent.change(view.getByRole("slider"), { target: { value: "-25" } });
    expect(view.container.querySelector(".al-gate__value")?.textContent).toBe("-25 dB");
    expect(view.container.querySelector(".al-meter__gate:not([data-open])")).not.toBeNull();
  });
});
