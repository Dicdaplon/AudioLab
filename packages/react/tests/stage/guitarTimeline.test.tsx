/**
 * Guitar timeline: the staff helpers (spelling in the key, place on the
 * guitar staff, ledger lines, octave marks, bend labels) in Node, and both
 * views drawing bent and vibrato notes in the browser without throwing.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { createElement } from "react";

import type { NoteSegment, SignalTap } from "@audiolab/core";

import { bendAmount } from "../../src/stage/names";
import { GuitarTimeline, type StageSignals } from "../../src/stage";
import {
  ledgerCount,
  spelledName,
  spellNote,
  staffNote,
  usesFlats,
} from "../../src/stage/visuals/timelineStaff";
import { installCanvasStub, type CanvasRecorder } from "../helpers/canvasStub";

describe("staff helpers", () => {
  it("reads flat keys with flats, the others and no key with sharps", () => {
    for (const tonic of [5, 10, 3, 8, 1, 6]) expect(usesFlats({ tonic, mode: "maj" })).toBe(true);
    for (const tonic of [2, 7, 0, 5, 10, 3]) expect(usesFlats({ tonic, mode: "min" })).toBe(true);
    for (const tonic of [0, 7, 2, 9, 4, 11]) expect(usesFlats({ tonic, mode: "maj" })).toBe(false);
    for (const tonic of [9, 4, 11, 6]) expect(usesFlats({ tonic, mode: "min" })).toBe(false);
    expect(usesFlats(null)).toBe(false);
  });

  it("spells a black key as a sharp or a flat, with its diatonic step", () => {
    expect(spellNote(61, false)).toEqual({ letter: 0, accidental: 1, step: 28 }); // C♯4
    expect(spellNote(61, true)).toEqual({ letter: 1, accidental: -1, step: 29 }); // D♭4
    expect(spellNote(60, true)).toEqual({ letter: 0, accidental: 0, step: 28 }); // C4
    expect(spelledName(spellNote(70, true), "en")).toBe("B♭");
    expect(spelledName(spellNote(66, false), "fr")).toBe("Fa♯");
  });

  it("counts ledger lines above and below the staff", () => {
    expect(ledgerCount(0)).toBe(0); // bottom line
    expect(ledgerCount(-1)).toBe(0); // the space under it
    expect(ledgerCount(-2)).toBe(-1);
    expect(ledgerCount(-5)).toBe(-2);
    expect(ledgerCount(9)).toBe(0); // the space above the top line
    expect(ledgerCount(10)).toBe(1);
    expect(ledgerCount(13)).toBe(2);
    expect(ledgerCount(14)).toBe(3);
  });

  it("writes guitar an octave up and folds far notes back with an octave mark", () => {
    // Sounding E3 is written E4: the bottom line.
    expect(staffNote(52, false)).toMatchObject({ pos: 0, shift: 0 });
    // The open low E (E2) is written E3, three ledger lines down: drawn on E4, 8vb.
    expect(staffNote(40, false)).toMatchObject({ pos: 0, shift: 1 });
    // G2 (written G3) still fits with two ledger lines.
    expect(staffNote(43, false)).toMatchObject({ pos: -5, shift: 0 });
    // E5 (written E6) is folded down an octave, 8va.
    expect(staffNote(76, false)).toMatchObject({ pos: 7, shift: -1 });
  });

  it("labels bends to the nearest half tone", () => {
    expect(bendAmount(70)).toBe("½");
    expect(bendAmount(100)).toBe("½");
    expect(bendAmount(180)).toBe("1");
    expect(bendAmount(210)).toBe("1");
    expect(bendAmount(290)).toBe("1½");
    expect(bendAmount(400)).toBe("2");
  });
});

function fakeTap(): SignalTap {
  return {
    binHz: 48000 / 2048,
    size: 2048,
    bins: 1024,
    sampleRate: 48000,
    readTimeDomain(out) {
      out.fill(0);
    },
    readFrequencyDb(out) {
      out.fill(-60);
    },
    stop() {},
  };
}

function note(midi: number, start: number, end: number, extra: Partial<NoteSegment> = {}) {
  const n: NoteSegment = {
    midi,
    cents: 0,
    start,
    end,
    open: false,
    vibrato: { active: false, rateHz: 0, extentCents: 0 },
    bend: null,
  };
  return { ...n, ...extra };
}

function signals(): StageSignals {
  const chroma = new Float32Array(12);
  const level = { open: true, level: 0.6, floorDb: -98, ceilingDb: -70, gatedDb: -75 };
  return {
    levelDb: -75,
    harmonyLevel: level,
    notesLevel: level,
    key: {
      phase: "settled",
      key: { tonic: 5, mode: "maj" },
      runnerUp: null,
      stability: 0.8,
      event: null,
    },
    chord: {
      current: { root: 5, quality: "maj", name: "F" },
      runnerUp: null,
      margin: 0.3,
      silent: false,
      changed: false,
      history: [{ chord: { root: 5, quality: "maj", name: "F" }, start: 0, end: 1 }],
    },
    chordChangedAt: null,
    keyEventAt: null,
    note: null,
    notes: [
      note(40, 0, 0.3), // low E: 8vb
      note(70, 0.35, 0.8, { bend: { cents: 200, current: 0, released: true } }),
      note(66, 0.85, 1.2), // out of key
      note(88, 1.25, 1.6), // far up: 8va
      note(69, 1.65, 2, {
        open: true,
        vibrato: { active: true, rateHz: 6, extentCents: 25 },
        bend: { cents: 110, current: 105, released: false },
      }),
    ],
    chroma: { instant: chroma, chord: chroma, live: chroma },
    tempo: { bpm: 96, confidence: 0.9 },
    beatAt: (t) => ({
      phase: (t * 1.6) % 1,
      beat: Math.floor(t * 1.6),
      beatInBar: Math.floor(t * 1.6) % 4,
      period: 0.625,
    }),
    onsets: [{ time: 0.1, strength: 2, pitchClass: null }],
    onsetCount: 1,
    harmonyTap: fakeTap(),
    notesTap: fakeTap(),
  };
}

describe("GuitarTimeline in the browser", () => {
  let canvas: CanvasRecorder;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    canvas = installCanvasStub();
    // The shared stub answers every call with undefined; the timeline measures text.
    const record = HTMLCanvasElement.prototype.getContext;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof record>
    ) {
      const ctx = record.apply(this, args) as unknown as Record<string, unknown>;
      return new Proxy(ctx, {
        get(target, prop) {
          if (prop === "measureText") return (t: string) => ({ width: t.length * 8 });
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
  });

  afterEach(() => {
    canvas.restore();
    vi.restoreAllMocks();
  });

  it.each([
    ["tab", "frets", 1344, 212],
    ["tab", "names", 1104, 192],
    ["staff", "frets", 1344, 212],
    ["staff", "names", 1104, 192],
  ] as const)("%s view with %s draws bends and vibratos", (view, labels, width, height) => {
    const ref = { current: signals() };
    const { unmount } = render(
      createElement(GuitarTimeline, { signals: ref, width, height, view, labels }),
    );
    const s = ref.current;
    for (let i = 0; i < 30; i++) {
      const t = 2 + i * 0.05;
      const last = s.notes[s.notes.length - 1];
      const bend = i >= 15 ? { cents: 210, current: 10, released: true } : last.bend; // comes back down
      s.notes = [...s.notes.slice(0, -1), { ...last, end: t, bend }];
      if (i === 15) s.key = { ...s.key, key: { tonic: 4, mode: "min" } }; // a key with sharps
      const pending = frames.splice(0);
      act(() => pending.forEach((cb) => cb(t * 1000)));
    }
    expect(canvas.of("fillRect").length).toBeGreaterThan(0);
    const texts = canvas.of("fillText").map((c) => c.args[0]);
    expect(texts).toContain("1");
    if (view === "staff") {
      expect(texts).toContain("𝄞");
      expect(texts).toContain("8vb");
      expect(texts).toContain("8va");
      expect(texts).toContain("♭");
    }
    unmount();
  });
});
