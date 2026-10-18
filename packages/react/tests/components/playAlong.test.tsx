import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, renderHook } from "@testing-library/react";

import { BeatLights } from "../../src/components/BeatLights";
import { PlayAlongLane } from "../../src/components/PlayAlongLane";
import { useMetronome } from "../../src/hooks/useMetronome";
import { laneTarget, targetState } from "../../src/ui/laneDraw";
import { installCanvasStub, type CanvasRecorder } from "../helpers/canvasStub";

describe("play-along components", () => {
  let canvas: CanvasRecorder;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    canvas = installCanvasStub(600);
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
  });

  afterEach(() => {
    cleanup();
    canvas.restore();
    vi.unstubAllGlobals();
  });

  const runFrame = () => act(() => frames.splice(0).forEach((cb) => cb(0)));

  it("draws the tolerance band, beat lines, targets and onset dots every frame", () => {
    const grid = { startTime: 10, bpm: 120, beatsPerBar: 4 };
    render(
      <PlayAlongLane
        now={() => 10}
        grid={grid}
        tolerance={{ onTimeMs: 50, windowMs: 150 }}
        targets={[
          { time: 10.2, state: "pending" },
          { time: 10.5, label: "Em", state: "onTime", wrongLabel: true },
          { time: 30, state: "missed" }, // off screen
        ]}
        onsets={() => [{ time: 10.21 }, { time: 10.4, echo: true }]}
        label="lane"
      />,
    );
    runFrame();
    // Band (window + on time), bed, tap bar: fillRect; label: fillText; circle, wrong-label ring and dots: arc.
    expect(canvas.of("fillRect").length).toBeGreaterThanOrEqual(4);
    expect(canvas.of("fillText").map((c) => c.args[0])).toEqual(["Em"]);
    expect(canvas.of("arc")).toHaveLength(4);
    expect(canvas.of("stroke").length).toBeGreaterThan(2);
  });

  it("draws nothing while the clock is unknown", () => {
    const { container } = render(<PlayAlongLane now={() => null} targets={[]} />);
    runFrame();
    expect(canvas.of("fillRect")).toHaveLength(0);
    expect(container.querySelector("canvas")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("maps a scored note to its lane state", () => {
    expect(targetState({ resolved: false, tier: null })).toBe("pending");
    expect(targetState({ resolved: true, tier: "late" })).toBe("late");
    expect(
      laneTarget({ resolved: true, tier: "onTime", label: "wrong", expectedTime: 3 }, "E"),
    ).toEqual({
      time: 3,
      label: "E",
      state: "onTime",
      wrongLabel: true,
    });
  });

  it("lights the current beat, in count-in colours before beat 0", () => {
    let t = 9.6; // beat -1 of a grid starting at 10 s, 120 BPM
    const grid = { startTime: 10, bpm: 120, beatsPerBar: 4 };
    const { container } = render(<BeatLights grid={grid} now={() => t} />);
    const list = container.querySelector("ol")!;
    runFrame();
    expect(list.hasAttribute("data-count-in")).toBe(true);
    expect(list.children[3].hasAttribute("data-on")).toBe(true);
    t = 10.6; // beat 1
    runFrame();
    expect(list.hasAttribute("data-count-in")).toBe(false);
    expect(list.children[1].hasAttribute("data-on")).toBe(true);
    expect(list.children[3].hasAttribute("data-on")).toBe(false);
  });

  it("shows four lights without a grid", () => {
    const { container } = render(<BeatLights grid={null} now={() => null} />);
    runFrame();
    expect(container.querySelectorAll("li")).toHaveLength(4);
  });
});

describe("useMetronome", () => {
  function fakeContext() {
    const param = () => ({
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    });
    return {
      currentTime: 0,
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

  afterEach(() => vi.useRealTimers());

  it("starts one metronome at a time and stops it on unmount", () => {
    vi.useFakeTimers();
    const ctx = fakeContext();
    const { result, unmount } = renderHook(() => useMetronome(ctx));
    expect(result.current.metronome).toBeNull();
    let first: ReturnType<typeof result.current.start> = null;
    act(() => {
      first = result.current.start({ bpm: 90 });
    });
    expect(result.current.metronome).toBe(first);
    expect(result.current.metronome?.grid.bpm).toBe(90);
    act(() => {
      result.current.start({ bpm: 60, sound: false });
    });
    expect(result.current.metronome?.grid.bpm).toBe(60);
    expect(result.current.sound).toBe(false);
    act(() => result.current.setSound(true));
    expect(result.current.sound).toBe(true);
    expect(result.current.metronome?.sound).toBe(true);
    act(() => result.current.stop());
    expect(result.current.metronome).toBeNull();
    act(() => {
      result.current.start({ bpm: 60 });
    });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does nothing without a context", () => {
    const { result } = renderHook(() => useMetronome(null));
    let started: unknown = "x";
    act(() => {
      started = result.current.start({ bpm: 80 });
    });
    expect(started).toBeNull();
    expect(result.current.metronome).toBeNull();
  });
});
