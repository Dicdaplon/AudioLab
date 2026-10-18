import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  StreamHistory,
  estimateTimingBudget,
  initialNoiseGateState,
  type Metronome,
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

const metronomes: Metronome[] = [];

vi.mock("@audiolab/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@audiolab/react")>();
  const actualReact = await import("react");
  return {
    ...actual,
    useOnsetAnalysis: (_mic: unknown, options: UseOnsetAnalysisOptions) => {
      hook.options = options;
      return hook.state;
    },
    useMetronome: () => {
      const [metronome, setMetronome] = actualReact.useState<Metronome | null>(null);
      const [sound, setSound] = actualReact.useState(true);
      return {
        metronome,
        sound,
        setSound,
        start: (o: { bpm: number; sound?: boolean }) => {
          // Beat 0 one bar after "now" (10 s on the mocked clock).
          const m = {
            grid: { startTime: 10 + (4 * 60) / o.bpm, bpm: o.bpm, beatsPerBar: 4 },
            clickTimes: [] as number[],
            sound: o.sound ?? true,
            setSound: vi.fn(),
            stop: vi.fn(),
          } as unknown as Metronome;
          metronomes.push(m);
          setMetronome(m);
          return m;
        },
        stop: () => setMetronome(null),
      };
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

/** Silent samples: the echo check and the labels need audio after each onset. */
function silentHistory(seconds: number): StreamHistory {
  const h = new StreamHistory(seconds * SR);
  h.push(new Float32Array(seconds * SR), 0);
  return h;
}
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
      history: silentHistory(40),
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

  /** Turn the click off (no echo check: onsets go straight to the scorer). */
  const silence = () => fireEvent.click(screen.getByRole("switch", { name: "Click sound" }));
  const offset = () => hook.state.budget!.offsetMs / 1000;
  const batch = (time: number) => act(() => hook.options!.onBatch!(hook.state.history!, time));

  it("runs the rhythm lane on the metronome and grades each mark", () => {
    render(<RhythmTab mic={mic} running />);
    silence();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    const m = metronomes.at(-1)!;
    expect(m.grid.bpm).toBe(70);
    expect(panel("Play in time").textContent).toMatch(/Listen to the count-in/);
    // "Two eighths on beat 3", played twice: 20 marks, all on time.
    const beats = [0, 1, 2, 2.5, 3, 4, 5, 6, 6.5, 7];
    const all = [...beats, ...beats.map((b) => b + 8)];
    act(() => {
      all.forEach((b, i) =>
        hook.options!.onOnset!(
          onset(i, m.grid.startTime + (b * 60) / 70 + offset()),
          hook.state.history!,
        ),
      );
    });
    batch(m.grid.startTime + (17 * 60) / 70);
    expect(panel("Play in time").textContent).toMatch(/Score 100\/100: 20 of 20 on time./);
    // The rhythm is written above the lane, as on a score.
    expect(panel("Play in time").querySelectorAll(".al-staff__note")).toHaveLength(20);
    expect(screen.getByRole("button", { name: "Again" })).toBeTruthy();
  });

  it("stops a lane run on demand and changes rhythm", () => {
    render(<RhythmTab mic={mic} running />);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.change(screen.getByLabelText("Rhythm", { selector: "select" }), {
      target: { value: "rests" },
    });
    expect(screen.getByRole("button", { name: "Again" })).toBeTruthy();
  });

  it("keeps the click's echoes out of the grade", () => {
    // A history long enough for the echo check, all silence: onsets are notes.
    hook.state = {
      ...hook.state,
      history: (() => {
        const h = new StreamHistory(SR * 20);
        h.push(new Float32Array(SR * 20), 0);
        return h;
      })(),
    };
    render(<RhythmTab mic={mic} running />);
    expect(screen.getByText(/the page tells the click from your playing/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    const m = metronomes.at(-1)!;
    act(() => hook.options!.onOnset!(onset(0, m.grid.startTime + offset()), hook.state.history!));
    batch(m.grid.startTime + 0.5);
    expect(panel("Play in time").textContent).toMatch(/On time./);
  });

  it("grades a written rhythm on the metronome, with a dot per note heard", () => {
    render(<RhythmTab mic={mic} running />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "written" } });
    silence();
    expect(screen.getAllByText("&", { selector: ".al-staff__count" })).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    const m = metronomes.at(-1)!;
    const beats = [0, 1, 2, 2.5, 3, 4, 5, 6, 6.5, 7];
    act(() => {
      beats.forEach((b, i) =>
        hook.options!.onOnset!(
          onset(i, m.grid.startTime + (b * 60) / 70 + offset()),
          hook.state.history!,
        ),
      );
    });
    batch(m.grid.startTime + (9 * 60) / 70);
    expect(panel("Play in time").textContent).toMatch(/10 of 10 notes in time./);
    expect(document.querySelectorAll('.al-staff__note[data-state="onTime"]')).toHaveLength(10);
  });

  it("grades a written rhythm at my own pace", () => {
    render(<RhythmTab mic={mic} running />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "written" } });
    fireEvent.click(screen.getByRole("switch", { name: /My own pace/ }));
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    const beats = [0, 1, 2, 2.5, 3, 4, 5, 6, 6.5, 7];
    act(() => {
      beats.forEach((b, i) => hook.options!.onOnset!(onset(i, 20 + b * 0.7), hook.state.history!));
    });
    expect(panel("Play in time").textContent).toMatch(/Listening… 10 of 10 notes/);
    batch(20 + 7 * 0.7 + 3);
    expect(panel("Play in time").textContent).toMatch(
      /10 of 10 notes in time, at about 86 BPM. Steady./,
    );
    fireEvent.click(screen.getByRole("button", { name: "Again" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(panel("Play in time").textContent).toMatch(/Not enough notes heard/);
  });

  it("grades scrolling notes on timing and on the note played", () => {
    // Silent samples: the note played is "unclear" once its audio is in.
    const h = new StreamHistory(SR * 40);
    h.push(new Float32Array(SR * 40), 0);
    hook.state = { ...hook.state, history: h };
    render(<RhythmTab mic={mic} running />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "notes" } });
    silence();
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    const m = metronomes.at(-1)!;
    act(() => hook.options!.onOnset!(onset(0, m.grid.startTime + offset()), hook.state.history!));
    batch(m.grid.startTime + 0.3);
    expect(panel("Play in time").textContent).toMatch(/On time, note unclear/);
    batch(m.grid.startTime + 30);
    expect(panel("Play in time").textContent).toMatch(/1 of 12 on time, 0 right notes./);
    // Open strings on a five-line treble staff.
    expect(panel("Play in time").querySelectorAll(".al-staff__line")).toHaveLength(5);
  });

  it("asks for the microphone first", () => {
    render(<RhythmTab mic={null} running={false} onStart={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "chords" } });
    expect(panel("Play in time").textContent).toMatch(/Start the microphone first/);
  });
});
