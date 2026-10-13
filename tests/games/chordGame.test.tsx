import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChordScore } from "../../src/analysis/chordDetection";
import { ChordGame } from "../../src/features/games/chord-game/ChordGame";
import { CHORD_POOLS, pickChord } from "../../src/features/games/chord-game/pools";
import { INITIAL_STATS, chordGameReducer } from "../../src/features/games/chord-game/scoring";

describe("pickChord", () => {
  it("returns an empty string for an empty pool", () => {
    expect(pickChord([])).toBe("");
  });

  it("returns the only chord of a single-chord pool, even if excluded", () => {
    expect(pickChord(["C"], "C")).toBe("C");
  });

  it("never returns the excluded chord when there is a choice", () => {
    const pool = ["C", "G", "D"];
    for (const r of [0, 0.34, 0.67, 0.999]) {
      expect(pickChord(pool, "G", () => r)).not.toBe("G");
    }
  });

  it("maps the rng output onto the pool", () => {
    expect(pickChord(["C", "G", "D"], undefined, () => 0)).toBe("C");
    expect(pickChord(["C", "G", "D"], undefined, () => 0.999)).toBe("D");
  });

  it("builds the 12-chord pools from the templates", () => {
    expect(CHORD_POOLS["all-major"].chords).toHaveLength(12);
    expect(CHORD_POOLS["all-minor"].chords).toHaveLength(12);
    expect(CHORD_POOLS.all.chords).toHaveLength(24);
  });
});

describe("chordGameReducer", () => {
  it("increments score, streak and best streak on a hit", () => {
    const s = chordGameReducer(chordGameReducer(INITIAL_STATS, { type: "hit" }), { type: "hit" });
    expect(s).toEqual({ score: 2, streak: 2, bestStreak: 2, skipped: 0 });
  });

  it("breaks the streak on a skip but keeps the best streak", () => {
    let s = chordGameReducer(INITIAL_STATS, { type: "hit" });
    s = chordGameReducer(s, { type: "skip" });
    s = chordGameReducer(s, { type: "hit" });
    expect(s).toEqual({ score: 2, streak: 1, bestStreak: 1, skipped: 1 });
  });

  it("resets everything", () => {
    const s = chordGameReducer(
      { score: 3, streak: 1, bestStreak: 2, skipped: 4 },
      { type: "reset" },
    );
    expect(s).toEqual(INITIAL_STATS);
  });
});

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

  const chord = (name: string, probability = 0.5): ChordScore[] => [
    { root: 0, quality: "maj", name, similarity: 0.9, probability },
  ];

  function setup(running = true) {
    const view = render(<ChordGame chords={[]} running={running} />);
    const play = (frame: ChordScore[]) => view.rerender(<ChordGame chords={frame} running />);
    const text = (selector: string) => view.container.querySelector(selector)?.textContent;
    const stats = () =>
      Array.from(view.container.querySelectorAll(".game-stat-value")).map((n) => n.textContent);
    return { view, play, text, stats };
  }

  it("scores after the target is top-1 for three frames and draws a new target", () => {
    const { play, text, stats } = setup();
    expect(text(".game-target-name")).toBe("C");

    play(chord("C"));
    play(chord("C"));
    expect(stats()).toEqual(["0", "0", "0", "0"]);
    play(chord("C"));

    expect(stats()).toEqual(["1", "1", "1", "0"]);
    expect(text(".game-target-name")).toBe("G");
  });

  it("restarts the confirmation when another chord interrupts", () => {
    const { play, text, stats } = setup();
    play(chord("C"));
    play(chord("C"));
    play(chord("Am"));
    play(chord("C"));
    expect(text(".game-progress-text")).toMatch(/^1\/3/);
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
    expect(text(".game-target-name")).toBe("C");
  });

  it("redraws the target when the pool no longer contains it", () => {
    const { view, text } = setup();
    fireEvent.change(view.getByRole("combobox"), { target: { value: "open-minor" } });
    expect(text(".game-target-name")).toBe("Am");
  });

  it("flashes the target briefly on a hit", () => {
    vi.useFakeTimers();
    const { view, play } = setup();
    play(chord("C"));
    play(chord("C"));
    play(chord("C"));
    const target = view.container.querySelector(".game-target");
    expect(target?.classList.contains("hit")).toBe(true);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(target?.classList.contains("hit")).toBe(false);
  });

  it("shows the mic prompt and calls onStart while stopped", () => {
    const onStart = vi.fn();
    const view = render(<ChordGame chords={[]} running={false} onStart={onStart} />);
    const prompt = view.container.querySelector(".notice--mic");
    expect(prompt).not.toBeNull();
    fireEvent.click(prompt!.querySelector("button")!);
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
