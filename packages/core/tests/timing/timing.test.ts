// @vitest-environment node
import { describe, expect, it } from "vitest";

import { AudioClockSync } from "../../src/timing/clockSync";
import {
  ASSUMED_INPUT_LATENCY_MS,
  BLUETOOTH_INPUT_LATENCY_MS,
  combineTimingComponents,
  estimateTimingBudget,
  looksLikeBluetooth,
} from "../../src/timing/timingBudget";
import { mulberry32 } from "../helpers/synth";

const SR = 48000;

/**
 * Batches of `batch` samples rendered on an audio clock that starts at
 * `startPerfMs` and runs `ppm` fast, each delivered after a random delay
 * of 0–`jitterMs` (plus rare long stalls).
 */
function simulate(
  sync: AudioClockSync,
  { seconds = 10, batch = 512, startPerfMs = 1234.5, ppm = 0, jitterMs = 8, seed = 1 } = {},
) {
  const rand = mulberry32(seed);
  const batches = Math.floor((seconds * SR) / batch);
  for (let i = 0; i < batches; i++) {
    const endFrame = (i + 1) * batch;
    const renderedAtMs = startPerfMs + ((endFrame / SR) * 1000) / (1 + ppm * 1e-6);
    const stall = rand() < 0.02 ? 40 : 0;
    sync.observeBatch({
      startFrame: i * batch,
      length: batch,
      sampleRate: SR,
      receivedAtMs: renderedAtMs + rand() * jitterMs + stall,
    });
  }
}

describe("AudioClockSync", () => {
  it("recovers the clock offset under delivery jitter", () => {
    const sync = new AudioClockSync();
    simulate(sync);
    const stats = sync.stats();
    expect(stats.offsetMs).not.toBeNull();
    expect(Math.abs(stats.offsetMs! - 1234.5)).toBeLessThan(0.5);
    expect(sync.contextTimeToPerfMs(2)).toBeCloseTo(3234.5, 0);
    expect(sync.perfMsToContextTime(3234.5)).toBeCloseTo(2, 3);
    expect(stats.medianDelayMs).toBeGreaterThan(2);
    expect(stats.medianDelayMs).toBeLessThan(6);
    expect(stats.maxDelayMs).toBeGreaterThan(30);
    expect(stats.batchMs).toBeCloseTo((512 / SR) * 1000, 6);
  });

  it("follows a drifting audio clock", () => {
    const sync = new AudioClockSync({ windowMs: 3000 });
    simulate(sync, { seconds: 60, ppm: 100, jitterMs: 2 });
    // After 60 s at 100 ppm the offset moved by −6 ms: the window tracks it.
    const offset = sync.stats().offsetMs!;
    expect(Math.abs(offset - (1234.5 - 6))).toBeLessThan(1);
  });

  it("measures startup, first signal and gaps", () => {
    const sync = new AudioClockSync();
    sync.markStart(1000);
    sync.observeBatch({
      startFrame: 0,
      length: 512,
      sampleRate: SR,
      receivedAtMs: 1180,
      hasSignal: false,
    });
    sync.observeBatch({
      startFrame: 512,
      length: 512,
      sampleRate: SR,
      receivedAtMs: 1190,
      hasSignal: true,
    });
    sync.observeBatch({ startFrame: 2048, length: 512, sampleRate: SR, receivedAtMs: 1230 });
    const s = sync.stats();
    expect(s.startupMs).toBe(180);
    expect(s.firstSignalMs).toBe(190);
    expect(s.gaps).toBe(1);
    expect(s.missingFrames).toBe(1024);
    expect(s.batches).toBe(3);
  });

  it("knows nothing before the first batch", () => {
    const sync = new AudioClockSync();
    expect(sync.offsetMs).toBeNull();
    expect(sync.contextTimeToPerfMs(1)).toBeNull();
    expect(sync.stats().startupMs).toBeNull();
  });
});

describe("timing budget", () => {
  it("adds offsets and combines uncertainties in quadrature", () => {
    const b = combineTimingComponents([
      { id: "a", offsetMs: 10, uncertaintyMs: 3, source: "measured" },
      { id: "b", offsetMs: 5, uncertaintyMs: 4, source: "reported" },
    ]);
    expect(b.offsetMs).toBe(15);
    expect(b.uncertaintyMs).toBe(5);
    expect(b.minToleranceMs).toBe(10);
    expect(b.calibrated).toBe(true);
  });

  it("assumes a wired microphone and a 60 Hz display by default", () => {
    const b = estimateTimingBudget();
    const input = b.components.find((c) => c.id === "input")!;
    const display = b.components.find((c) => c.id === "display")!;
    expect(input.offsetMs).toBe(ASSUMED_INPUT_LATENCY_MS);
    expect(input.source).toBe("assumed");
    expect(display.offsetMs).toBeCloseTo(25, 0);
    expect(b.calibrated).toBe(false);
    expect(b.uncertaintyMs).toBeGreaterThan(15);
    expect(b.uncertaintyMs).toBeLessThan(25);
  });

  it("uses a plausible reported latency and ignores absurd ones", () => {
    const reported = estimateTimingBudget({ reportedInputLatencySeconds: 0.03 });
    expect(reported.components[0]).toMatchObject({ id: "input", offsetMs: 30, source: "reported" });
    const absurd = estimateTimingBudget({ reportedInputLatencySeconds: 3 });
    expect(absurd.components[0].source).toBe("assumed");
  });

  it("widens everything for a Bluetooth headset", () => {
    expect(looksLikeBluetooth("AirPods Pro (Bluetooth)")).toBe(true);
    expect(looksLikeBluetooth("Microphone (Realtek High Definition Audio)")).toBe(false);
    const b = estimateTimingBudget({ deviceLabel: "Galaxy Buds2 Hands-Free" });
    expect(b.components[0].offsetMs).toBe(BLUETOOTH_INPUT_LATENCY_MS);
    expect(b.minToleranceMs).toBeGreaterThan(100);
  });

  it("replaces input + display by a calibration and adds the strum for chords", () => {
    const b = estimateTimingBudget({
      calibratedOffsetMs: 42,
      calibrationSpreadMs: 6,
      strummed: true,
    });
    expect(b.components.map((c) => c.id)).toEqual(["calibration", "clock", "detector", "strum"]);
    expect(b.offsetMs).toBe(42);
    expect(b.calibrated).toBe(true);
  });
});
