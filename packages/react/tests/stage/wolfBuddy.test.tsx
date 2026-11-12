/**
 * WolfBuddy: a bare canvas on the server; in the browser the brain runs on
 * its timer, the sprite draws in every pose (jump, tumble, howl, sleep,
 * dance) without throwing, and a speech bubble appears as DOM text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import type { StageSignals } from "../../src/stage";
import { WolfBuddy } from "../../src/stage/wolf";
import { installCanvasStub, type CanvasRecorder } from "../helpers/canvasStub";

function signals(): StageSignals {
  const open = { open: true, level: 0.6, floorDb: -98, ceilingDb: -70, gatedDb: -75 };
  const seg = (midi: number, start: number) => ({
    midi,
    cents: 1,
    start,
    end: start + 0.3,
    open: false,
    vibrato: { active: false, rateHz: 0, extentCents: 0 },
    bend: null,
  });
  return {
    levelDb: -75,
    harmonyLevel: open,
    notesLevel: open,
    key: { phase: "listening", key: null, runnerUp: null, stability: 0, event: null },
    chord: { current: null, runnerUp: null, margin: 0, silent: true, changed: false, history: [] },
    chordChangedAt: null,
    keyEventAt: null,
    note: null,
    notes: [seg(69, 0), seg(73, 0.4), seg(75, 0.8), seg(78, 1.2)],
    chroma: {
      instant: new Float32Array(12),
      chord: new Float32Array(12),
      live: new Float32Array(12),
    },
    tempo: { bpm: 96, confidence: 0.9 },
    beatAt: (t) => ({
      phase: (t * 1.6) % 1,
      beat: Math.floor(t * 1.6),
      beatInBar: Math.floor(t * 1.6) % 4,
      period: 0.625,
    }),
    onsets: [],
    onsetCount: 0,
    harmonyTap: null,
    notesTap: null,
  };
}

describe("WolfBuddy", () => {
  it("renders a bare canvas on the server", () => {
    const html = renderToString(
      createElement(WolfBuddy, { signals: { current: signals() }, width: 320, height: 176 }),
    );
    expect(html).toContain("<canvas");
    expect(html).not.toContain('role="status"');
  });

  describe("in the browser", () => {
    let canvas: CanvasRecorder;
    let frames: FrameRequestCallback[];
    let clock: number;

    beforeEach(() => {
      canvas = installCanvasStub();
      frames = [];
      clock = 1000;
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
      vi.spyOn(performance, "now").mockImplementation(() => clock);
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        frames.push(cb);
        return frames.length;
      });
      vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    });

    afterEach(() => {
      canvas.restore();
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    /** Advance by `n` steps of 50 ms: animation frames, and the brain every 200 ms. */
    function run(n: number, events: (i: number, t: number) => void = () => {}) {
      for (let i = 0; i < n; i++) {
        clock += 50;
        const t = clock / 1000;
        events(i, t);
        const pending = frames.splice(0);
        act(() => {
          pending.forEach((cb) => cb(clock));
          vi.advanceTimersByTime(50);
        });
      }
    }

    it("draws every pose and shows a bubble", () => {
      const s = signals();
      const { unmount } = render(
        createElement(WolfBuddy, {
          signals: { current: s },
          side: "right",
          brain: { warmupSeconds: 0, minGapSeconds: 1, kindCooldownSeconds: 0, random: () => 0 },
        }),
      );
      run(4);
      // The key settles: a howl, and the wolf names it.
      run(1, (_, t) => {
        s.key = {
          phase: "settled",
          key: { tonic: 9, mode: "min" },
          runnerUp: null,
          stability: 1,
          event: "settled",
        };
        s.keyEventAt = t;
      });
      run(8);
      expect(screen.getByRole("status").textContent).toBe("A minor, classy.");
      // Attacks: a jump, then a tumble when very loud.
      run(10, (i, t) => {
        if (i === 0 || i === 6) {
          s.onsets.push({ time: t, strength: 2, pitchClass: 9 });
          s.onsetCount += 1;
        }
        if (i === 6) s.harmonyLevel = { ...s.harmonyLevel, level: 0.95 };
      });
      // A long silence: sleep.
      s.harmonyLevel = { ...s.harmonyLevel, open: false, level: 0 };
      s.notesLevel = s.harmonyLevel;
      run(440);
      expect(canvas.of("fillRect").length).toBeGreaterThan(1000);
      expect(screen.getByRole("status").textContent).toMatch(/sleep|Nap/);
      unmount();
    });

    it("dances on a steady beat", () => {
      const s = signals();
      const { unmount } = render(createElement(WolfBuddy, { signals: { current: s } }));
      run(120, (i, t) => {
        if (i % 12 === 0) {
          s.onsets.push({ time: t, strength: 1, pitchClass: 9 });
          s.onsetCount += 1;
        }
      });
      expect(canvas.of("fillRect").length).toBeGreaterThan(0);
      unmount();
    });
  });
});
