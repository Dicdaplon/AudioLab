import { describe, expect, it } from "vitest";

import {
  estimateTimingBudget,
  LATENCY_TEST,
  latencyTestClicks,
  measureTapLatency,
} from "../../src";

const grid = { startTime: 3, bpm: LATENCY_TEST.bpm, beatsPerBar: LATENCY_TEST.countIn };
const clicks = latencyTestClicks(grid);

describe("latency by ear", () => {
  it("places the clicks after the count-in, 750 ms apart", () => {
    expect(clicks).toHaveLength(8);
    expect(clicks[0]).toBe(3);
    expect(clicks[1] - clicks[0]).toBeCloseTo(0.75, 9);
  });

  it("finds a Bluetooth delay longer than half the gap between clicks", () => {
    // 420 ms late, ±15 ms of hand jitter: nearest-click matching would call it −330 ms.
    const jitter = [5, -12, 15, 0, -6, 9, -15, 3];
    const taps = clicks.map((t, i) => t + (420 + jitter[i]) / 1000);
    const r = measureTapLatency(clicks, taps)!;
    expect(r.offsetMs).toBeCloseTo(421.5, 6);
    expect(r.taps).toBe(8);
    expect(r.reliable).toBe(true);
  });

  it("drops a stray note and a double hit, and keeps the first note of a click", () => {
    const taps = clicks.map((t) => t + 0.25);
    taps.push(clicks[2] + 0.32); // a second hit on click 2
    taps.push(clicks[5] - 0.4); // a stray note between clicks 4 and 5
    const r = measureTapLatency(clicks, taps)!;
    expect(r.offsetMs).toBeCloseTo(250, 6);
    expect(r.taps).toBe(8);
  });

  it("is unreliable with too few notes or too uneven ones", () => {
    const few = measureTapLatency(
      clicks,
      clicks.slice(0, 3).map((t) => t + 0.2),
    )!;
    expect(few.reliable).toBe(false);
    const uneven = measureTapLatency(
      clicks,
      clicks.map((t, i) => t + (200 + (i % 2 ? 70 : -70)) / 1000),
    )!;
    expect(uneven.reliable).toBe(false);
    expect(measureTapLatency(clicks, [])).toBeNull();
  });
});

describe("the click heard late", () => {
  it("applies an audio calibration to the audible click only", () => {
    const audio = estimateTimingBudget({
      reference: "audio",
      calibratedOffsetMs: 300,
      calibrationSpreadMs: 12,
      calibrationReference: "audio",
    });
    expect(audio.components[0]).toMatchObject({ id: "calibration", offsetMs: 300 });
    expect(audio.calibrated).toBe(true);
    // 300 ms heard, minus the 10 ms assumed for the microphone.
    expect(audio.outputDelayMs).toBe(290);
    expect(audio.visualDelayMs).toBeCloseTo(290 - 25, 6);

    const visual = estimateTimingBudget({
      reference: "visual",
      calibratedOffsetMs: 300,
      calibrationReference: "audio",
    });
    expect(visual.components.map((c) => c.id)).toContain("display");
    expect(visual.visualDelayMs).toBe(0);
  });

  it("barely moves the screen on a wired setup", () => {
    const wired = estimateTimingBudget({ reference: "audio", reportedOutputLatencySeconds: 0.02 });
    expect(wired.outputDelayMs).toBe(20);
    expect(wired.visualDelayMs).toBe(0);
    const echo = estimateTimingBudget({ reference: "audio", measuredRoundTripMs: 45 });
    expect(echo.visualDelayMs).toBeCloseTo(10, 6);
  });
});
