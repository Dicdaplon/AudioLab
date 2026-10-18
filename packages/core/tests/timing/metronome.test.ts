import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StreamHistory, clickBandShare } from "../../src/analysis/onset/afterOnset";
import { ACCENT_CLICK_HZ, CLICK_HZ, startMetronome } from "../../src/audio/metronome";
import { beatAt, beatTime, beatsBetween, isDownbeat } from "../../src/timing/beatGrid";
import { ClickEchoFilter } from "../../src/timing/clickEcho";
import { estimateTimingBudget } from "../../src/timing/timingBudget";
import { performance } from "../helpers/onsets";

const SR = 48000;

describe("beat grid", () => {
  const grid = { startTime: 10, bpm: 120, beatsPerBar: 4 };

  it("places beats, count-in included", () => {
    expect(beatTime(grid, 0)).toBe(10);
    expect(beatTime(grid, 2.5)).toBe(11.25);
    expect(beatTime(grid, -4)).toBe(8);
    expect(beatAt(grid, 11.25)).toBe(2.5);
    expect(isDownbeat(grid, 4)).toBe(true);
    expect(isDownbeat(grid, -4)).toBe(true);
    expect(isDownbeat(grid, 3)).toBe(false);
    expect(beatsBetween(grid, 9.9, 11.1)).toEqual([0, 1, 2]);
  });
});

/** A context whose clock the test moves, with spy nodes. */
function fakeContext() {
  const oscillators: {
    frequency: { value: number };
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }[] = [];
  const param = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const ctx = {
    currentTime: 5,
    destination: {},
    createOscillator: vi.fn(() => {
      const osc = { frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => ({ gain: param(), connect: vi.fn() })),
  };
  return { ctx, oscillators };
}

describe("startMetronome", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts in one bar, then clicks every beat, accenting the downbeat", () => {
    const { ctx, oscillators } = fakeContext();
    const m = startMetronome(ctx as unknown as BaseAudioContext, { bpm: 120 });
    expect(m.grid.startTime).toBe(7); // one 4/4 bar at 120 BPM after t = 5
    for (let t = 5; t < 9.05; t += 0.025) {
      ctx.currentTime = t;
      vi.advanceTimersByTime(25);
    }
    // Count-in at 5, 5.5, 6, 6.5, then 7 ... 9.
    expect(m.clickTimes.slice(0, 6)).toEqual([5, 5.5, 6, 6.5, 7, 7.5]);
    expect(oscillators[0].frequency.value).toBe(ACCENT_CLICK_HZ);
    expect(oscillators[1].frequency.value).toBe(CLICK_HZ);
    expect(oscillators[4].frequency.value).toBe(ACCENT_CLICK_HZ);
    expect(oscillators[0].start).toHaveBeenCalledWith(5);
    m.stop();
    m.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps the grid without sound, and can turn the sound on", () => {
    const { ctx, oscillators } = fakeContext();
    const m = startMetronome(ctx as unknown as BaseAudioContext, {
      bpm: 60,
      sound: false,
      startTime: 6,
    });
    vi.advanceTimersByTime(100);
    expect(oscillators).toHaveLength(0);
    expect(m.sound).toBe(false);
    m.setSound(true);
    ctx.currentTime = 6.95;
    vi.advanceTimersByTime(25);
    expect(m.clickTimes).toEqual([7]);
    m.stop();
    expect(() => startMetronome(ctx as unknown as BaseAudioContext, { bpm: 0 })).toThrow();
    expect(() =>
      startMetronome(ctx as unknown as BaseAudioContext, { bpm: 60, beatsPerBar: 0 }),
    ).toThrow();
    const safe = startMetronome(ctx as unknown as BaseAudioContext, { bpm: 60, volume: NaN });
    expect(Object.isFrozen(safe.grid)).toBe(true);
    safe.stop();
  });
});

describe("click echoes", () => {
  /** The metronome click as the microphone hears it, over a ringing guitar. */
  function clickOver(signal: Float32Array, at: number, freq = CLICK_HZ) {
    const start = Math.round(at * SR);
    for (let i = 0; i < 0.03 * SR; i++) {
      signal[start + i] +=
        0.2 * Math.exp(-i / (0.006 * SR)) * Math.sin((2 * Math.PI * freq * i) / SR);
    }
  }

  it("tells a click from a guitar attack, even over a ringing note", () => {
    const { signal } = performance(
      [
        { time: 0.2, midi: 45 },
        { time: 1.0, midi: 52 },
      ],
      { seconds: 1.5, noiseRms: 0.001 },
    );
    clickOver(signal, 0.6); // the A string still rings
    const h = new StreamHistory(signal.length);
    h.push(signal, 0);
    expect(clickBandShare(h, 0.6 * SR, SR)!).toBeGreaterThan(0.8);
    expect(clickBandShare(h, 1.0 * SR, SR)!).toBeLessThan(0.4);
    expect(clickBandShare(h, 10, SR)).toBeNull();
  });

  it("drops echoes and measures the round trip; notes stay notes", () => {
    const filter = new ClickEchoFilter();
    const clicks = [1, 1.5, 2, 2.5];
    expect(filter.roundTripMs).toBeNull();
    expect(filter.check(1.062, 0.9, clicks)).toEqual({
      echo: true,
      delayMs: expect.closeTo(62, 6),
    });
    expect(filter.check(1.565, 0.92, clicks).echo).toBe(true);
    expect(filter.check(2.06, 0.2, clicks).echo).toBe(false); // a strum on the beat
    expect(filter.check(0.5, 0.95, clicks)).toEqual({ echo: false, delayMs: null }); // before any click
    expect(filter.roundTripMs).toBeCloseTo(65, 6);
    expect(filter.spreadMs).toBeCloseTo(1.5, 6);
    expect(filter.echoes).toBe(2);
    filter.reset();
    expect(filter.echoes).toBe(0);
  });

  it("attributes an echo to the click that matches the known round trip", () => {
    // Bluetooth-like 300 ms round trip at 240 BPM (a click every 250 ms).
    const filter = new ClickEchoFilter();
    const clicks = [1, 1.25, 1.5, 1.75, 2];
    filter.check(1.3, 0.9, [1]); // first echo, only one click known: 300 ms
    expect(filter.roundTripMs).toBeCloseTo(300, 6);
    // The echo of 1.25 lands at 1.55, after the click at 1.5.
    const v = filter.check(1.55, 0.9, clicks);
    expect(v.echo).toBe(true);
    expect(v.delayMs).toBeCloseTo(300, 6);
  });

  it("uses output + input for an audible click, and the measured round trip when known", () => {
    const heard = estimateTimingBudget({ reference: "audio", reportedOutputLatencySeconds: 0.04 });
    expect(heard.components.map((c) => c.id)).toEqual(["input", "output", "clock", "detector"]);
    expect(heard.components[1]).toMatchObject({ offsetMs: 40, source: "reported" });
    const assumed = estimateTimingBudget({ reference: "audio" });
    expect(assumed.components[1].source).toBe("assumed");
    const measured = estimateTimingBudget({
      reference: "audio",
      measuredRoundTripMs: 74,
      roundTripSpreadMs: 2,
    });
    expect(measured.components[0]).toMatchObject({
      id: "roundTrip",
      offsetMs: 74,
      source: "measured",
    });
    expect(measured.calibrated).toBe(true);
    // A measured round trip wins over a (visual) calibration for an audible click.
    const both = estimateTimingBudget({
      reference: "audio",
      measuredRoundTripMs: 74,
      calibratedOffsetMs: 30,
    });
    expect(both.components[0].id).toBe("roundTrip");
  });
});
