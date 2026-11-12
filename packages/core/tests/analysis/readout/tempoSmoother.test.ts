import { describe, expect, it } from "vitest";

import { TempoSmoother } from "../../../src/analysis/readout/tempoSmoother";

describe("TempoSmoother", () => {
  it("holds a steady tempo through one-off wrong readings", () => {
    const s = new TempoSmoother();
    let r = null;
    for (let i = 0; i < 25; i++)
      r = s.push({ bpm: 96 + (i % 2 ? 0.4 : -0.4), confidence: 0.8 }, i * 0.2);
    expect(r!.bpm).toBeCloseTo(96, 0);
    // A wild reading does not move it; half and double tempo fold onto it.
    r = s.push({ bpm: 131, confidence: 0.9 }, 5.2);
    expect(r!.bpm).toBeCloseTo(96, 0);
    expect(r!.confidence).toBeGreaterThan(0.7);
  });

  it("follows a real tempo change within a few seconds", () => {
    const s = new TempoSmoother();
    for (let i = 0; i < 30; i++) s.push({ bpm: 90, confidence: 0.8 }, i * 0.2);
    let r = null;
    for (let i = 0; i < 40; i++) r = s.push({ bpm: 120, confidence: 0.8 }, 6 + i * 0.2);
    expect(r!.bpm).toBeCloseTo(120, 0);
  });

  it("ignores unconfident or out-of-range readings, and resets", () => {
    const s = new TempoSmoother();
    expect(s.push(null, 0)).toBeNull();
    expect(s.push({ bpm: 100, confidence: 0.1 }, 0.2)).toBeNull();
    expect(s.push({ bpm: 0, confidence: 0.9 }, 0.4)).toBeNull();
    expect(s.push({ bpm: 100, confidence: 0.5 }, 0.6)!.bpm).toBe(100);
    s.reset();
    expect(s.push(null, 1)).toBeNull();
  });

  it("folds half and double tempo into 60–150 BPM, so octave errors agree", () => {
    const s = new TempoSmoother();
    let r = null;
    const readings = [96, 192, 48, 96, 192, 96, 48];
    readings.forEach((bpm, i) => (r = s.push({ bpm, confidence: 0.8 }, i * 0.2)));
    expect(r!.bpm).toBe(96);
    expect(r!.confidence).toBeGreaterThan(0.95);
    expect(new TempoSmoother().push({ bpm: 170, confidence: 0.8 }, 0)!.bpm).toBe(85);
    expect(new TempoSmoother().push({ bpm: 40, confidence: 0.8 }, 0)!.bpm).toBe(80);
    expect(new TempoSmoother().push({ bpm: 400, confidence: 0.8 }, 0)!.bpm).toBe(100);
  });
});
