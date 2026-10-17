// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  OnsetEvidence,
  TimingScorer,
  classifyDelta,
  createTimingScorerState,
  fitPattern,
  scoreTimings,
  stepTimingScorer,
  timingStats,
  toleranceFromUncertainty,
  type ExpectedNote,
} from "../../src/rhythm";

const TOL = { onTimeMs: 50, windowMs: 150 };

/** Notes every `period` s from `start`. */
function grid(count: number, period = 0.5, start = 1, label?: string): ExpectedNote[] {
  return Array.from({ length: count }, (_, i) => ({ id: i, time: start + i * period, label }));
}

describe("tolerance", () => {
  it("grades a signed offset", () => {
    expect(classifyDelta(0, TOL)).toBe("onTime");
    expect(classifyDelta(-50, TOL)).toBe("onTime");
    expect(classifyDelta(-80, TOL)).toBe("early");
    expect(classifyDelta(120, TOL)).toBe("late");
    expect(classifyDelta(200, TOL)).toBe("missed");
  });

  it("never grades finer than the measurement chain", () => {
    expect(toleranceFromUncertainty(10)).toEqual({ onTimeMs: 50, windowMs: 150 });
    const wide = toleranceFromUncertainty(60); // Bluetooth-like
    expect(wide.onTimeMs).toBe(120);
    expect(wide.windowMs).toBe(180);
  });
});

describe("TimingScorer", () => {
  it("grades on time, early, late and missed notes and counts extras", () => {
    const notes = grid(5);
    const state = scoreTimings(
      notes,
      [
        { id: 0, time: 1.01 }, // on time
        { id: 1, time: 1.42 }, // 80 ms early
        { id: 2, time: 2.12 }, // 120 ms late
        // note 3 (2.5) missed
        { id: 3, time: 2.75 }, // between notes 3 and 4: extra
        { id: 4, time: 2.98 }, // on time
      ],
      { tolerance: TOL },
    );
    expect(state.results.map((r) => r.tier)).toEqual([
      "onTime",
      "early",
      "late",
      "missed",
      "onTime",
    ]);
    expect(state.results[1].deltaMs).toBeCloseTo(-80, 6);
    expect(state.extras.map((e) => e.id)).toEqual([3]);
  });

  it("narrows windows between close notes so they never overlap", () => {
    const s = createTimingScorerState([
      { id: "a", time: 1 },
      { id: "b", time: 1.1 },
    ]);
    expect(s.windows[0]).toBeCloseTo(0.05, 9);
    expect(s.windows[1]).toBeCloseTo(0.05, 9);
  });

  it("keeps the nearest onset of a note; the other becomes an extra", () => {
    const scorer = new TimingScorer(grid(1), { tolerance: TOL });
    scorer.onset({ id: 1, time: 1.12 });
    scorer.onset({ id: 2, time: 1.07 });
    scorer.finish();
    expect(scorer.results[0].onsetId).toBe(2);
    expect(scorer.results[0].tier).toBe("late");
    expect(scorer.state.extras.map((e) => e.id)).toEqual([1]);
  });

  it("resolves at once when on time, otherwise when the window has passed", () => {
    const scorer = new TimingScorer(grid(2), { tolerance: TOL });
    expect(scorer.onset({ id: 0, time: 1.02 })).toHaveLength(1);
    expect(scorer.onset({ id: 1, time: 1.6 })).toHaveLength(0); // 100 ms late: wait
    expect(scorer.advance(1.6)).toHaveLength(0);
    const changed = scorer.advance(1.66);
    expect(changed.map((r) => r.tier)).toEqual(["late"]);
  });

  it("subtracts the latency offset", () => {
    const state = scoreTimings(
      grid(3),
      grid(3).map((n, i) => ({ id: i, time: n.time + 0.09 })),
      {
        tolerance: TOL,
        offsetMs: 90,
      },
    );
    expect(state.results.every((r) => r.tier === "onTime")).toBe(true);
  });

  it("learns a constant unknown latency with adaptiveBias", () => {
    const notes = grid(12);
    const onsets = notes.map((n, i) => ({ id: i, time: n.time + 0.11 + (i % 2 ? 0.01 : -0.01) }));
    const fixed = scoreTimings(notes, onsets, { tolerance: TOL });
    expect(fixed.results.filter((r) => r.tier === "onTime")).toHaveLength(0);
    const adaptive = scoreTimings(notes, onsets, { tolerance: TOL, adaptiveBias: true });
    expect(adaptive.biasMs).toBeGreaterThan(95);
    expect(adaptive.biasMs).toBeLessThan(125);
    // The first notes teach the bias; the rest are on time.
    expect(adaptive.results.slice(5).every((r) => r.tier === "onTime")).toBe(true);
  });

  it("grades the label independently of the timing", () => {
    const notes = grid(2, 0.5, 1, "E");
    let state = createTimingScorerState(notes);
    state = stepTimingScorer(state, { type: "onset", onset: { id: 7, time: 1.0 } }).state;
    state = stepTimingScorer(state, { type: "onset", onset: { id: 8, time: 1.62 } }).state;
    const a = stepTimingScorer(state, { type: "label", onsetId: 7, label: "E" });
    const b = stepTimingScorer(a.state, { type: "label", onsetId: 8, label: "A" });
    const c = stepTimingScorer(b.state, { type: "advance", time: 3 });
    expect(c.state.results.map((r) => [r.tier, r.label])).toEqual([
      ["onTime", "correct"],
      ["late", "wrong"],
    ]);
    expect(stepTimingScorer(c.state, { type: "label", onsetId: 99, label: "E" }).changed).toEqual(
      [],
    );
  });
});

describe("fitPattern", () => {
  // "ta ta ti-ti ta" in 4/4: beats 0, 1, 2, 2.5, 3.
  const beats = [0, 1, 2, 2.5, 3, 4, 5, 5.5, 6, 7];

  it("finds the player's tempo and grades the rhythm, whatever the latency", () => {
    const bpm = 84;
    const latency = 0.137;
    const onsets = beats.map(
      (b, i) => 2 + latency + (b * 60) / bpm + (i % 3 === 0 ? 0.012 : -0.006),
    );
    const fit = fitPattern(beats, onsets)!;
    expect(fit.tempoBpm).toBeCloseTo(84, 0);
    expect(fit.reliable).toBe(true);
    expect(fit.notes.every((n) => n.tier === "onTime")).toBe(true);
    expect(fit.stats.jitterMs).toBeLessThan(15);
  });

  it("spots a rushed eighth note and a missing note", () => {
    const bpm = 100;
    const onsets = beats
      .map((b) => 1 + (b * 60) / bpm)
      .map((t, i) => (i === 3 ? t - 0.12 : t)) // the "ti" after beat 2 rushed by 120 ms
      .filter((_, i) => i !== 6); // beat 5 not played
    const fit = fitPattern(beats, onsets, { tempoHintBpm: 90 })!;
    expect(fit.tempoBpm).toBeCloseTo(100, 0);
    expect(fit.notes[3].tier).toBe("early");
    expect(fit.notes[6].tier).toBe("missed");
    expect(fit.notes.filter((n) => n.tier === "onTime")).toHaveLength(8);
  });

  it("ignores an extra strum and flags short performances unreliable", () => {
    const onsets = beats.map((b) => 0.5 + b * 0.6);
    onsets.splice(4, 0, 0.5 + 2.75 * 0.6 + 0.07);
    const fit = fitPattern(beats, onsets)!;
    expect(fit.extras).toHaveLength(1);
    expect(fit.matched).toBe(beats.length);
    expect(fitPattern(beats, [1, 1.6])!.reliable).toBe(false);
    expect(fitPattern(beats, [1])).toBeNull();
  });
});

describe("timingStats", () => {
  it("separates bias, jitter and drift", () => {
    const samples = Array.from({ length: 20 }, (_, i) => ({
      time: i,
      deltaMs: -30 + 2 * i + (i % 2 ? 5 : -5),
    }));
    const s = timingStats(samples);
    expect(s.count).toBe(20);
    expect(s.driftMsPerSecond).toBeCloseTo(2, 0);
    expect(s.biasMs).toBeCloseTo(-11, 0);
    expect(timingStats([]).count).toBe(0);
  });
});

describe("OnsetEvidence", () => {
  it("labels each onset from the observations just after it", () => {
    const ev = new OnsetEvidence<number>();
    // Before the onset the previous note (C = 0) still rings.
    ev.observe({ time: 0.98, label: 0 });
    ev.addOnset({ id: 1, time: 1.0 });
    ev.observe({ time: 1.01, label: 0 }); // attack: ignored (< 40 ms)
    ev.observe({ time: 1.05, label: 4, weight: 0.9 });
    ev.observe({ time: 1.09, label: 4, weight: 0.95 });
    ev.observe({ time: 1.13, label: 7, weight: 0.3 });
    expect(ev.resolve(1.1)).toHaveLength(0);
    const [out] = ev.resolve(1.2);
    expect(out.label).toBe(4);
    expect(out.confidence).toBeCloseTo(1.85 / 2.15, 6);
    expect(out.observations).toBe(3);
    expect(ev.pendingCount).toBe(0);
  });

  it("returns null when nothing clear was heard", () => {
    const ev = new OnsetEvidence<string>({ fromMs: 20, toMs: 100 });
    ev.addOnset({ id: 3, time: 2 });
    ev.observe({ time: 2.05, label: null });
    expect(ev.resolve(3)[0]).toMatchObject({ onsetId: 3, label: null, confidence: 0 });
    expect(() => new OnsetEvidence({ fromMs: 50, toMs: 10 })).toThrow();
  });
});
