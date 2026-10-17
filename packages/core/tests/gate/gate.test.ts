// @vitest-environment node
import { describe, expect, it } from "vitest";

import { BandLevelMeter } from "../../src/analysis/gate/bandLevelMeter";
import {
  INITIAL_LEVEL_FLOOR_STATE,
  LevelFloorTracker,
  levelFloorOf,
  stepLevelFloor,
} from "../../src/analysis/gate/levelFloorTracker";
import {
  AdaptiveNoiseGate,
  NOISE_GATE_DEFAULTS,
  initialNoiseGateState,
  stepNoiseGate,
  type NoiseGateState,
} from "../../src/analysis/gate/noiseGate";
import { OnsetPipeline } from "../../src/analysis/onset/onsetPipeline";
import { performance, pushChunks } from "../helpers/onsets";
import { mulberry32 } from "../helpers/synth";

const SR = 48000;

function sine(freq: number, amplitude: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.round(seconds * SR));
  for (let i = 0; i < out.length; i++) out[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / SR);
  return out;
}

function feed(gate: AdaptiveNoiseGate, levelDb: number, ms: number, tonal = false): NoiseGateState {
  let s = gate.state;
  for (let t = 0; t < ms; t += 10) s = gate.push({ levelDb, dtMs: 10, tonal });
  return s;
}

describe("BandLevelMeter", () => {
  it("measures a full-scale sine at −3 dBFS in 10 ms blocks", () => {
    const meter = new BandLevelMeter({ sampleRate: SR });
    const blocks = meter.push(sine(440, 1, 0.5));
    expect(blocks).toHaveLength(50);
    expect(blocks[49].levelDb).toBeCloseTo(-3.01, 1);
    expect(blocks[49].endFrame).toBe(24000);
  });

  it("attenuates the hum fundamental more than a low E (2nd order: −8 vs −3 dB)", () => {
    const meter = () => new BandLevelMeter({ sampleRate: SR });
    const hum = meter()
      .push(sine(50, 0.1, 1))
      .at(-1)!.levelDb;
    const lowE = meter()
      .push(sine(82.4, 0.1, 1))
      .at(-1)!.levelDb;
    expect(lowE - hum).toBeGreaterThan(4.5);
    expect(lowE).toBeGreaterThan(-23 - 4); // ≤ 4 dB of loss at 82 Hz
  });
});

describe("LevelFloorTracker", () => {
  it("falls at once and rises only after a whole window", () => {
    const tracker = new LevelFloorTracker({ windowMs: 6000, subWindows: 6 });
    for (let t = 0; t < 3000; t += 10) tracker.push(-60, 10);
    expect(tracker.floorDb).toBe(-60);
    tracker.push(-70, 10);
    expect(tracker.floorDb).toBe(-70);
    // A fan switches on: −40 dB from now on. The floor waits for the window.
    let t = 0;
    while (tracker.floorDb! < -40 && t < 10000) {
      tracker.push(-40, 10);
      t += 10;
    }
    expect(t).toBeGreaterThan(5000);
    expect(t).toBeLessThanOrEqual(7000);
  });

  it("is null before any level and ignores non-finite levels", () => {
    expect(levelFloorOf(INITIAL_LEVEL_FLOOR_STATE)).toBeNull();
    const s = stepLevelFloor(INITIAL_LEVEL_FLOOR_STATE, -Infinity, 10);
    expect(levelFloorOf(s)).toBeNull();
  });
});

describe("AdaptiveNoiseGate", () => {
  it("starts open, learns the floor, closes after the hold", () => {
    const gate = new AdaptiveNoiseGate();
    expect(gate.open).toBe(true);
    let s = feed(gate, -65, 400);
    expect(s.warmingUp).toBe(true);
    expect(s.open).toBe(true);
    s = feed(gate, -65, 200);
    expect(s.warmingUp).toBe(false);
    // The floor climbs from −90 at 6 dB/s: still learning, still open.
    expect(s.floorDb).toBeCloseTo(-86.4, 0);
    expect(s.open).toBe(true);
    s = feed(gate, -65, 4400);
    expect(s.floorDb).toBeCloseTo(-65, 0);
    s = feed(gate, -65, NOISE_GATE_DEFAULTS.holdMs + 20);
    expect(s.open).toBe(false);
    expect(s.openThresholdDb).toBeCloseTo(-59, 0);
  });

  it("opens instantly 6 dB above the floor and holds through a decay", () => {
    const gate = new AdaptiveNoiseGate();
    feed(gate, -65, 5000);
    expect(gate.open).toBe(false);
    expect(gate.push({ levelDb: -58, dtMs: 10 }).open).toBe(true);
    // Between the thresholds (−62..−59): stays open however long.
    expect(feed(gate, -61, 2000).open).toBe(true);
    // Below the close threshold, but shorter than the hold: still open.
    expect(feed(gate, -64, 200).open).toBe(true);
    expect(feed(gate, -64, 100).open).toBe(false);
  });

  it("lets a tonal cue open it whatever the level", () => {
    const gate = new AdaptiveNoiseGate();
    feed(gate, -65, 5000);
    expect(gate.open).toBe(false);
    expect(gate.push({ levelDb: -64, dtMs: 10, tonal: true }).open).toBe(true);
  });

  it("follows a louder room and flags it noisy, without blocking", () => {
    const gate = new AdaptiveNoiseGate();
    feed(gate, -70, 1000);
    const s = feed(gate, -38, 14000);
    expect(s.floorDb).toBeCloseTo(-38, 0);
    expect(s.noisy).toBe(true);
    expect(gate.push({ levelDb: -30, dtMs: 10 }).open).toBe(true);
  });

  it("does not learn a player who starts at once at a steady level", () => {
    const gate = new AdaptiveNoiseGate();
    // Strumming from the first second: −30 dB with ±1 dB, no pause, for 5 s.
    let s = gate.state;
    for (let t = 0; t < 5000; t += 10) s = gate.push({ levelDb: -30 + Math.sin(t / 50), dtMs: 10 });
    expect(s.open).toBe(true);
    expect(s.floorDb).toBeLessThan(-55);
  });

  it("clamps the floor and survives silence and NaN", () => {
    let s = initialNoiseGateState();
    for (let i = 0; i < 200; i++) s = stepNoiseGate(s, { levelDb: -Infinity, dtMs: 10 });
    expect(s.floorDb).toBe(NOISE_GATE_DEFAULTS.minFloorDb);
    s = stepNoiseGate(s, { levelDb: Number.NaN, dtMs: 10 });
    expect(Number.isFinite(s.floorDb)).toBe(true);
  });

  it("keeps the floor when reconfigured, forgets it on reset", () => {
    const gate = new AdaptiveNoiseGate();
    feed(gate, -50, 7000);
    gate.configure({ openMarginDb: 10 });
    expect(gate.state.floorDb).toBeCloseTo(-50, 0);
    expect(gate.config.openMarginDb).toBe(10);
    gate.reset();
    expect(gate.state.warmingUp).toBe(true);
  });
});

describe("OnsetPipeline", () => {
  it("keeps every plucked note over a noise floor", () => {
    const hits = Array.from({ length: 10 }, (_, i) => ({
      time: 1 + i * 0.4,
      midi: 50 + (i % 5),
      amplitude: 0.05 + 0.02 * (i % 3),
    }));
    const { signal } = performance(hits, { seconds: 5.5, noiseRms: 0.003 });
    const pipeline = new OnsetPipeline({ sampleRate: SR });
    const onsets = pushChunks(signal, (c, f) => pipeline.push(c, f).onsets);
    expect(onsets).toHaveLength(10);
    expect(pipeline.counts.accepted).toBe(10);
  });

  it("ignores bursts of room noise and learns their level", () => {
    // Noise with bursts 3 dB louder, for 12 s: no onset, floor learnt.
    const rand = mulberry32(4);
    const n = 12 * SR;
    const signal = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const burst = Math.floor(i / 2400) % 7 === 3 ? 1.4 : 1;
      signal[i] = (rand() - 0.5) * 0.02 * burst;
    }
    const pipeline = new OnsetPipeline({ sampleRate: SR });
    const onsets = pushChunks(signal, (c, f) => pipeline.push(c, f).onsets);
    expect(onsets).toHaveLength(0);
    expect(pipeline.gate.state.floorDb).toBeCloseTo(-45, 0);
    // −45 dBFS of background is a loud room: flagged, yet nothing is blocked.
    expect(pipeline.gate.state.noisy).toBe(true);
  });

  it("rejects candidates whose attack stays under floor + margin", () => {
    const hits = Array.from({ length: 6 }, (_, i) => ({
      time: 9 + i * 0.5,
      midi: 64,
      amplitude: 0.04,
    }));
    const { signal } = performance(hits, { seconds: 12.5, noiseRms: 0.006 });
    const run = (onsetMarginDb: number) => {
      const pipeline = new OnsetPipeline({ sampleRate: SR, onsetMarginDb });
      pushChunks(signal, (c, f) => pipeline.push(c, f).onsets);
      return pipeline.counts;
    };
    expect(run(6)).toEqual({ accepted: 6, rejected: 0 });
    expect(run(25)).toEqual({ accepted: 0, rejected: 6 });
  });
});
