import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  StreamHistory,
  estimateTimingBudget,
  initialNoiseGateState,
  type MicSource,
  type OnsetAnalysis,
  type OnsetAnalysisSnapshot,
  type TimedOnset,
} from "@audiolab/core";
import type { OnsetAnalysisState, UseOnsetAnalysisOptions } from "@audiolab/react";
import {
  installCanvasStub,
  type CanvasRecorder,
} from "../../../packages/react/tests/helpers/canvasStub";

const SR = 48000;

/** What the mocked hook returns, and the options the tab passed to it. */
const hook: { state: OnsetAnalysisState; options: UseOnsetAnalysisOptions | null } = {
  state: { snapshot: null, captureMethod: null, budget: null, analysis: null, history: null },
  options: null,
};

vi.mock("@audiolab/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@audiolab/react")>();
  return {
    ...actual,
    useOnsetAnalysis: (_mic: unknown, options: UseOnsetAnalysisOptions) => {
      hook.options = options;
      return hook.state;
    },
  };
});

import { RhythmTab } from "../src/components/rhythm/RhythmTab";

/** Audio clock = page clock / 1000 (offset 0), so tests speak in seconds. */
const analysis = {
  method: "worklet",
  clock: { perfMsToContextTime: (ms: number) => ms / 1000 },
} as unknown as OnsetAnalysis;

function snapshot(patch: Partial<OnsetAnalysisSnapshot> = {}): OnsetAnalysisSnapshot {
  return {
    gate: { ...initialNoiseGateState(), open: false, warmingUp: false, levelDb: -40, floorDb: -70 },
    recentOnsets: [],
    clock: {
      batches: 40,
      offsetMs: 0,
      offsetSpreadMs: 0.5,
      lastDelayMs: 2,
      medianDelayMs: 3,
      p95DelayMs: 9,
      maxDelayMs: 20,
      batchMs: 10.7,
      startupMs: 180,
      firstSignalMs: 240,
      gaps: 0,
      missingFrames: 0,
    },
    analysedTime: 0,
    decisionLatencyMs: 24,
    exactTiming: true,
    counts: { accepted: 0, rejected: 0 },
    ...patch,
  };
}

function onset(id: number, time: number): TimedOnset {
  return {
    id,
    frame: Math.round(time * SR),
    time,
    decidedAtFrame: Math.round(time * SR) + 1200,
    strength: 0.2,
    levelDb: -20,
    baselineDb: -60,
    localized: true,
    perfTimeMs: time * 1000,
  };
}

const mic = { context: { sampleRate: SR } } as unknown as MicSource;
const panel = (title: string) =>
  screen.getByRole("heading", { name: title }).closest("section") as HTMLElement;

describe("RhythmTab", () => {
  let canvas: CanvasRecorder;
  let now: number;

  beforeEach(() => {
    canvas = installCanvasStub(900);
    now = 10_000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    hook.state = {
      snapshot: snapshot(),
      captureMethod: "worklet",
      budget: estimateTimingBudget(),
      analysis,
      history: new StreamHistory(SR),
    };
  });

  afterEach(() => {
    cleanup();
    canvas.restore();
    vi.restoreAllMocks();
  });

  it("shows the latency budget and the gate in the diagnostics", () => {
    render(<RhythmTab mic={mic} running />);
    expect(panel("Timing").textContent).toMatch(/180 ms/);
    expect(panel("Timing").textContent).toMatch(/Microphone → audio thread/);
    expect(panel("Timing").textContent).toMatch(/estimated/);
    expect(panel("Listening").textContent).toMatch(/Quiet. Play a note./);
  });

  it("tells a noisy room, a warming gate and an open one apart", () => {
    const base = snapshot();
    const view = render(<RhythmTab mic={mic} running />);
    const cases: [Partial<typeof base.gate>, RegExp][] = [
      [{ warmingUp: true }, /Listening to the room/],
      [{ noisy: true }, /This room is noisy/],
      [{ open: true }, /Hearing you/],
    ];
    for (const [gate, text] of cases) {
      hook.state = { ...hook.state, snapshot: { ...base, gate: { ...base.gate, ...gate } } };
      view.rerender(<RhythmTab mic={mic} running />);
      expect(panel("Listening").textContent).toMatch(text);
    }
  });

  it("grades a written rhythm played at a free tempo", () => {
    render(<RhythmTab mic={mic} running />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    const beats = [0, 1, 2, 2.5, 3, 4, 5, 6, 6.5, 7]; // "Two eighths on beat 3"
    act(() => {
      beats.forEach((b, i) => hook.options!.onOnset!(onset(i, 20 + b * 0.7), hook.state.history!));
    });
    expect(panel("Play in time").textContent).toMatch(/Listening… 10 of 10 notes/);
    // Silence after the last note ends the take.
    act(() => hook.options!.onBatch!(hook.state.history!, 20 + 7 * 0.7 + 3));
    expect(panel("Play in time").textContent).toMatch(
      /10 of 10 notes in time, at about 86 BPM. Steady./,
    );
    expect(document.querySelectorAll('.rhythm__note[data-tier="onTime"]')).toHaveLength(10);
    expect(screen.getByRole("button", { name: "Again" })).toBeTruthy();
  });

  it("stops a take on demand and changes rhythm", () => {
    render(<RhythmTab mic={mic} running />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(panel("Play in time").textContent).toMatch(/Not enough notes heard/);
    fireEvent.change(screen.getByLabelText("Rhythm", { selector: "select" }), {
      target: { value: "quarters" },
    });
    expect(screen.getByRole("button", { name: "Start" })).toBeTruthy();
  });

  it("grades scrolling notes on timing and on the note played", () => {
    render(<RhythmTab mic={mic} running />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    // Start at t = 10 s, first note at 13 s, 66 BPM. The budget offset is
    // subtracted, so play each note that much late; the first is on time.
    const offset = hook.state.budget!.offsetMs / 1000;
    act(() => hook.options!.onOnset!(onset(0, 13 + offset), hook.state.history!));
    // No sound in the history: the note is "unclear" once its label is due.
    act(() => hook.options!.onBatch!(hook.state.history!, 13.2));
    expect(panel("Play in time").textContent).toMatch(/On time/);
    // The rest is never played: once the analysed time passes, all missed.
    act(() => hook.options!.onBatch!(hook.state.history!, 60));
    expect(panel("Play in time").textContent).toMatch(/1 of 12 on time, 0 right notes./);
  });

  it("asks for the microphone before a scrolling exercise", () => {
    render(<RhythmTab mic={null} running={false} onStart={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "chords" } });
    expect(panel("Play in time").textContent).toMatch(/Start the microphone first/);
  });
});
