import { describe, expect, it } from "vitest";

import { GATE_STRICTNESS, gateTuning, NOISE_GATE_DEFAULTS, OnsetPipeline } from "../../src";
import { ChordTargetMatcher, WOLF_DETECTOR_DEFAULTS } from "../../src/games";
import type { ChordScore } from "../../src";

describe("gate strictness", () => {
  it("gives the defaults at 0.5, a margin from 3 to 12 dB, a hold from ~400 to ~150 ms", () => {
    expect(gateTuning(0.5)).toEqual({
      openMarginDb: NOISE_GATE_DEFAULTS.openMarginDb,
      closeMarginDb: NOISE_GATE_DEFAULTS.closeMarginDb,
      holdMs: NOISE_GATE_DEFAULTS.holdMs,
      onsetMarginDb: 6,
    });
    expect(gateTuning(0).openMarginDb).toBeCloseTo(3, 9);
    expect(gateTuning(1).openMarginDb).toBeCloseTo(12, 9);
    expect(gateTuning(0).holdMs).toBeCloseTo(406, 0);
    expect(gateTuning(1).holdMs).toBeCloseTo(154, 0);
    expect(gateTuning(-3)).toEqual(gateTuning(0));
    expect(gateTuning(Number.NaN)).toEqual(gateTuning(0.5));
    // Gentler for single notes, stricter for games.
    expect(GATE_STRICTNESS.notes).toBeLessThan(GATE_STRICTNESS.rhythm);
    expect(GATE_STRICTNESS.game).toBeGreaterThan(GATE_STRICTNESS.rhythm);
  });

  it("retunes an onset pipeline live and keeps the learnt background", () => {
    const p = new OnsetPipeline({ sampleRate: 48000 });
    expect(p.strictness).toBe(0.5);
    expect(p.onsetMarginDb).toBe(6);
    p.push(new Float32Array(48000).map(() => 0.001 * (Math.random() - 0.5)));
    const floor = p.gate.state.floorDb;
    p.strictness = 1;
    expect(p.onsetMarginDb).toBeCloseTo(12, 9);
    expect(p.gate.config.openMarginDb).toBeCloseTo(12, 9);
    expect(p.gate.state.floorDb).toBe(floor);
    expect(p.onsetThresholdDb).toBeCloseTo(floor + 12, 9);
    expect(new OnsetPipeline({ sampleRate: 48000, strictness: 0 }).onsetMarginDb).toBeCloseTo(3, 9);
    expect(new OnsetPipeline({ sampleRate: 48000, onsetMarginDb: 9 }).onsetMarginDb).toBe(9);
  });

  it("is on by default in the games", () => {
    expect(WOLF_DETECTOR_DEFAULTS.gate).toBe("adaptive");
    expect(WOLF_DETECTOR_DEFAULTS.gateStrictness).toBe(GATE_STRICTNESS.game);

    const m = new ChordTargetMatcher({ confirmations: 1 });
    const chords: ChordScore[] = [
      { root: 0, quality: "maj", name: "C", similarity: 0.9, probability: 0.6 },
    ];
    const C = { root: 0, quality: "maj" as const };
    // Four seconds of a quiet room at −70 dBFS: the background is learnt.
    for (let i = 0; i < 40; i++) m.push({ chords, signalLevelDb: -70 }, null);
    expect(m.gate.floorDb).toBeCloseTo(-70, 0);
    // A chord the detector hallucinates in the room's noise does not count.
    expect(m.push({ chords, signalLevelDb: -69 }, C).matched).toBe(false);
    // A strum does.
    expect(m.push({ chords, signalLevelDb: -40 }, C).matched).toBe(true);
    // Without a level, the gate stays out of the way.
    expect(m.push({ chords }, C).matched).toBe(true);
  });
});
