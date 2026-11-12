/**
 * Every stage visual: server markup is a bare canvas (nothing drawn on the
 * server), and in the browser each one draws a few frames from live-looking
 * signals without throwing, including the frames after a chord change, a key
 * change and attacks.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { createElement, createRef, type ReactElement, type RefObject } from "react";
import { renderToString } from "react-dom/server";

import type { SignalTap } from "@audiolab/core";

import * as stage from "../../src/stage";
import type { StageSignals } from "../../src/stage";
import { installCanvasStub, type CanvasRecorder } from "../helpers/canvasStub";

function fakeTap(): SignalTap {
  return {
    binHz: 48000 / 2048,
    size: 2048,
    bins: 1024,
    sampleRate: 48000,
    readTimeDomain(out) {
      for (let i = 0; i < out.length; i++) out[i] = 0.5 * Math.sin((2 * Math.PI * 440 * i) / 48000);
    },
    readFrequencyDb(out) {
      for (let i = 0; i < out.length; i++) out[i] = -40 - (i % 50);
    },
    stop() {},
  };
}

function signals(): StageSignals {
  const chroma = new Float32Array(12);
  chroma[9] = 0.4;
  chroma[0] = 0.3;
  chroma[4] = 0.3;
  return {
    levelDb: -75,
    key: {
      phase: "settled",
      key: { tonic: 9, mode: "min" },
      runnerUp: null,
      stability: 0.8,
      event: null,
    },
    chord: {
      current: { root: 9, quality: "min", name: "Am" },
      runnerUp: null,
      margin: 0.3,
      silent: false,
      changed: false,
      history: [{ chord: { root: 9, quality: "min", name: "Am" }, start: 0, end: 1 }],
    },
    chordChangedAt: null,
    keyEventAt: null,
    note: { frequency: 440, midi: 69, pitchClass: 9, cents: 3, clarity: 0.95 },
    chroma: { instant: chroma, chord: chroma, live: chroma },
    tempo: { bpm: 96, confidence: 0.9 },
    beatAt: (t) => ({
      phase: (t * 1.6) % 1,
      beat: Math.floor(t * 1.6),
      beatInBar: Math.floor(t * 1.6) % 4,
      period: 0.625,
    }),
    onsets: [],
    onsetCount: 0,
    harmonyTap: fakeTap(),
    notesTap: fakeTap(),
  };
}

type Ref = RefObject<StageSignals | null>;

const VISUALS: [string, (s: Ref) => ReactElement][] = [
  ["FifthsMandala", (s) => createElement(stage.FifthsMandala, { signals: s, size: 320 })],
  ["NoteConstellation", (s) => createElement(stage.NoteConstellation, { signals: s, size: 320 })],
  ["FifthsSky", (s) => createElement(stage.FifthsSky, { signals: s, width: 640, height: 360 })],
  ["HarmonyWell", (s) => createElement(stage.HarmonyWell, { signals: s, size: 400 })],
  [
    "SpectrumCity",
    (s) => createElement(stage.SpectrumCity, { signals: s, width: 640, height: 160 }),
  ],
  ["PawTrail", (s) => createElement(stage.PawTrail, { signals: s, width: 640, height: 160 })],
  [
    "PawTrail fireflies",
    (s) =>
      createElement(stage.PawTrail, { signals: s, width: 640, height: 160, mode: "fireflies" }),
  ],
  [
    "Oscilloscope",
    (s) => createElement(stage.Oscilloscope, { signals: s, width: 640, height: 96 }),
  ],
  [
    "Oscilloscope lissajous",
    (s) =>
      createElement(stage.Oscilloscope, { signals: s, width: 320, height: 320, mode: "lissajous" }),
  ],
  [
    "HarmonicAurora",
    (s) => createElement(stage.HarmonicAurora, { signals: s, width: 640, height: 160 }),
  ],
  [
    "BeatRings",
    (s) => createElement(stage.BeatRings, { signals: s, width: 400, height: 400, radius: 120 }),
  ],
  [
    "ChordShockwave",
    (s) => createElement(stage.ChordShockwave, { signals: s, width: 400, height: 400 }),
  ],
  ["ChordTunnel", (s) => createElement(stage.ChordTunnel, { signals: s, size: 400 })],
  ["NoteLane", (s) => createElement(stage.NoteLane, { signals: s, width: 640, height: 200 })],
  ["LevelCapsule", (s) => createElement(stage.LevelCapsule, { signals: s })],
];

describe("stage visuals on the server", () => {
  it.each(VISUALS)("%s renders a canvas and draws nothing", (_, make) => {
    const ref = createRef<StageSignals | null>() as { current: StageSignals | null };
    ref.current = signals();
    const html = renderToString(make(ref));
    expect(html).toContain("<canvas");
  });
});

describe("stage visuals in the browser", () => {
  let canvas: CanvasRecorder;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    canvas = installCanvasStub();
    // The shared stub answers every call with undefined; the visuals also
    // measure text and write pixels.
    const record = HTMLCanvasElement.prototype.getContext;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof record>
    ) {
      const ctx = record.apply(this, args) as unknown as Record<string, unknown>;
      return new Proxy(ctx, {
        get(target, prop) {
          if (prop === "measureText") return (t: string) => ({ width: t.length * 8 });
          if (prop === "createImageData" || prop === "getImageData") {
            return (w: number | { width: number; height: number }, h?: number) => {
              const width = typeof w === "number" ? w : w.width;
              const height = typeof w === "number" ? (h ?? 1) : w.height;
              return { width, height, data: new Uint8ClampedArray(width * height * 4) };
            };
          }
          return target[prop as string];
        },
      }) as unknown as RenderingContext;
    });
    frames = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    // The stub has no ImageData; the aurora writes pixels.
    vi.stubGlobal(
      "ImageData",
      class {
        data: Uint8ClampedArray;
        constructor(
          public width: number,
          public height: number,
        ) {
          this.data = new Uint8ClampedArray(width * height * 4);
        }
      },
    );
  });

  afterEach(() => {
    canvas.restore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function run(n: number, from: number, s: StageSignals, events: (i: number, t: number) => void) {
    for (let i = 0; i < n; i++) {
      const t = from + i * 0.05;
      events(i, t);
      const pending = frames.splice(0);
      act(() => pending.forEach((cb) => cb(t * 1000)));
    }
    return s;
  }

  it.each(VISUALS)("%s draws through chord, key and onset events", (_, make) => {
    const ref = { current: signals() };
    const { unmount } = render(make(ref));
    const s = ref.current;
    run(40, 1, s, (i, t) => {
      if (i === 5) {
        s.chord = { ...s.chord, current: { root: 4, quality: "dom7", name: "E7" }, changed: true };
        s.chordChangedAt = t;
      }
      if (i % 4 === 0) {
        s.onsets.push({ time: t, strength: 1 + (i % 3), pitchClass: 9 });
        s.onsetCount += 1;
      }
      if (i === 20) {
        s.key = { ...s.key, key: { tonic: 0, mode: "maj" }, event: "modulated" };
        s.keyEventAt = t;
        s.note = null;
        s.levelDb = -100;
      }
    });
    expect(canvas.calls.length).toBeGreaterThan(0);
    unmount();
  });
});
