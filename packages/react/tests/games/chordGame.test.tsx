import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChordScore } from "@audiolab/core";
import { ChordGame } from "../../src/games/chord-game/ChordGame";

describe("ChordGame", () => {
  beforeEach(() => {
    // Deterministic draws: always the first candidate ("C" in the default pool).
    vi.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const ROOTS: Record<string, [number, "maj" | "min"]> = {
    C: [0, "maj"],
    G: [7, "maj"],
    Am: [9, "min"],
  };
  const chord = (name: string, probability = 0.5): ChordScore[] => [
    { root: ROOTS[name][0], quality: ROOTS[name][1], name, similarity: 0.9, probability },
  ];

  function setup(running = true) {
    const view = render(<ChordGame chords={[]} running={running} />);
    const play = (frame: ChordScore[]) => view.rerender(<ChordGame chords={frame} running />);
    const text = (selector: string) => view.container.querySelector(selector)?.textContent;
    const stats = () =>
      Array.from(view.container.querySelectorAll(".al-stat__value")).map((n) => n.textContent);
    return { view, play, text, stats };
  }

  it("scores after the target is top-1 for three frames and draws a new target", () => {
    const { play, text, stats } = setup();
    expect(text(".al-readout--target .al-readout__value")).toBe("C");

    play(chord("C"));
    play(chord("C"));
    expect(stats()).toEqual(["0", "0", "0", "0"]);
    play(chord("C"));

    expect(stats()).toEqual(["1", "1", "1", "0"]);
    expect(text(".al-readout--target .al-readout__value")).toBe("G");
  });

  it("restarts the confirmation when another chord interrupts", () => {
    const { view, play, text, stats } = setup();
    play(chord("C"));
    play(chord("C"));
    play(chord("Am"));
    play(chord("C"));
    // One segment of three: the run restarted on the last C.
    expect(view.container.querySelectorAll(".al-game__progress [data-filled]")).toHaveLength(1);
    expect(text(".al-game__progress-text")).toBe("Hold the chord…");
    expect(stats()[0]).toBe("0");
  });

  it("ignores frames below the minimum probability", () => {
    const { play, stats } = setup();
    play(chord("C", 0.17));
    play(chord("C", 0.17));
    play(chord("C", 0.17));
    expect(stats()[0]).toBe("0");
  });

  it("skip counts a skipped chord, breaks the streak and draws a new target", () => {
    const { view, play, text, stats } = setup();
    play(chord("C"));
    play(chord("C"));
    play(chord("C"));
    fireEvent.click(view.getAllByRole("button")[0]);
    expect(stats()).toEqual(["1", "0", "1", "1"]);
    expect(text(".al-readout--target .al-readout__value")).toBe("C");
  });

  it("redraws the target when the pool no longer contains it", () => {
    const { view, text } = setup();
    fireEvent.change(view.getByRole("combobox"), { target: { value: "open-minor" } });
    expect(text(".al-readout--target .al-readout__value")).toBe("Am");
  });

  it("flashes the target briefly on a hit", () => {
    vi.useFakeTimers();
    const { view, play } = setup();
    play(chord("C"));
    play(chord("C"));
    play(chord("C"));
    const target = view.container.querySelector(".al-readout--target");
    expect(target?.hasAttribute("data-hit")).toBe(true);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(target?.hasAttribute("data-hit")).toBe(false);
  });

  it("honours custom confirmation settings", () => {
    const view = render(<ChordGame chords={[]} running confirmations={2} minProbability={0.5} />);
    const play = (frame: ChordScore[]) =>
      view.rerender(<ChordGame chords={frame} running confirmations={2} minProbability={0.5} />);
    play(chord("C", 0.4));
    play(chord("C", 0.4));
    expect(view.container.querySelector(".al-stat__value")?.textContent).toBe("0");
    play(chord("C", 0.6));
    play(chord("C", 0.6));
    expect(view.container.querySelector(".al-stat__value")?.textContent).toBe("1");
    expect(view.container.querySelectorAll(".al-game__progress .al-segments__seg")).toHaveLength(2);
    expect(view.container.querySelector(".al-game__progress-text")?.textContent).toBe(
      "Play the chord",
    );
  });

  it("shows the mic prompt and calls onStart while stopped", () => {
    const onStart = vi.fn();
    const view = render(<ChordGame chords={[]} running={false} onStart={onStart} />);
    const prompt = view.container.querySelector(".al-notice--mic");
    expect(prompt).not.toBeNull();
    fireEvent.click(prompt!.querySelector("button")!);
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe("ChordGame pools and accept policy", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const E7 = { root: 4, quality: "dom7" } as const;
  const frame = (quality: "maj" | "dom7"): ChordScore[] => [
    { root: 4, quality, name: quality === "maj" ? "E" : "E7", similarity: 0.9, probability: 0.5 },
  ];

  it("offers the given pools and scores a triad under the triad policy", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const pools = [
      { id: "sevenths", label: "Sevenths", chords: [E7, { root: 9, quality: "dom7" } as const] },
    ];
    const view = render(<ChordGame chords={[]} running pools={pools} accept="triad" />);
    const options = Array.from(view.container.querySelectorAll("option"), (o) => o.textContent);
    expect(options).toEqual(["Sevenths (2)"]);
    expect(view.container.querySelector(".al-readout__value")?.textContent).toBe("E7");
    for (const q of ["maj", "dom7", "maj"] as const) {
      view.rerender(<ChordGame chords={frame(q)} running pools={pools} accept="triad" />);
    }
    expect(view.container.querySelector(".al-stat__value")?.textContent).toBe("1");
  });

  it("does not score the triad under the exact policy", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const pools = [{ id: "sevenths", label: "Sevenths", chords: [E7] }];
    const view = render(<ChordGame chords={[]} running pools={pools} />);
    for (let i = 0; i < 3; i++) {
      view.rerender(<ChordGame chords={frame("maj")} running pools={pools} />);
    }
    expect(view.container.querySelector(".al-stat__value")?.textContent).toBe("0");
  });
});
