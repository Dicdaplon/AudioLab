// @vitest-environment node
import { describe, expect, it } from "vitest";

import { StreamHistory } from "../../src/analysis/onset/afterOnset";
import { PlayAlongSession } from "../../src/rhythm";
import { ClickEchoFilter } from "../../src/timing/clickEcho";

const SR = 48000;
const TOL = { onTimeMs: 50, windowMs: 150 };

/** A history of `seconds` with a click burst (2640 Hz) at each of `clicks`. */
function historyWith(seconds: number, clicks: number[]): StreamHistory {
  const signal = new Float32Array(Math.round(seconds * SR));
  for (const at of clicks) {
    const start = Math.round(at * SR);
    for (let i = 0; i < 0.03 * SR; i++) {
      signal[start + i] +=
        0.2 * Math.exp(-i / (0.006 * SR)) * Math.sin((2 * Math.PI * 2640 * i) / SR);
    }
  }
  const h = new StreamHistory(signal.length);
  h.push(signal, 0);
  return h;
}

const onsetAt = (id: number, time: number) => ({ id, time, frame: Math.round(time * SR) });

describe("PlayAlongSession", () => {
  const notes = [1, 1.5, 2].map((time, id) => ({ id, time }));

  it("grades queued onsets on update and lists them with their played time", () => {
    const s = new PlayAlongSession(notes, { sampleRate: SR, tolerance: TOL, offsetMs: 30 });
    const h = historyWith(3, []);
    s.onset(onsetAt(0, 1.03)); // on time once the 30 ms latency is removed
    s.onset(onsetAt(1, 1.63)); // 100 ms late
    expect(s.results.every((r) => !r.resolved)).toBe(true);
    const changed = s.update(h, 1.7);
    expect(changed.map((r) => r.tier)).toEqual(["onTime", "late"]);
    expect(s.onsets.map((o) => [o.id, +o.time.toFixed(3), o.echo])).toEqual([
      [0, 1, false],
      [1, 1.6, false],
    ]);
    expect(s.done).toBe(false);
    s.update(h, 2.5);
    expect(s.results[2].tier).toBe("missed");
    expect(s.done).toBe(true);
  });

  it("drops the metronome's echoes, keeps notes, and measures the round trip", () => {
    const clickTimes = [0.9, 1.4];
    // The microphone hears each click 70 ms after it is scheduled.
    const h = historyWith(
      3,
      clickTimes.map((t) => t + 0.07),
    );
    const filter = new ClickEchoFilter();
    const s = new PlayAlongSession(notes, {
      sampleRate: SR,
      tolerance: TOL,
      clicks: { times: () => clickTimes, filter },
    });
    s.onset(onsetAt(10, 0.97));
    s.onset(onsetAt(11, 1.47));
    s.update(h, 1.6);
    expect(s.onsets.every((o) => o.echo)).toBe(true);
    expect(s.results.some((r) => r.onsetId !== null)).toBe(false);
    expect(s.roundTripMs).toBeCloseTo(70, 0);
    expect(filter.echoes).toBe(2);
  });

  it("finds a note played just after the click's echo, merged into its onset", () => {
    const clickTimes = [0.9];
    const echoAt = 0.97;
    const h = historyWith(2, [echoAt]);
    // A guitar-like broadband attack 30 ms after the echo.
    const samples = new Float32Array(Math.round(2 * SR));
    h.read(0, samples.length)!.forEach((v, i) => (samples[i] = v));
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
    const start = Math.round((echoAt + 0.03) * SR);
    for (let i = 0; i < 0.3 * SR; i++) {
      samples[start + i] +=
        0.4 * Math.exp(-i / (0.08 * SR)) * (Math.sin((2 * Math.PI * 110 * i) / SR) + rand());
    }
    const mixed = new StreamHistory(samples.length);
    mixed.push(samples, 0);
    const s = new PlayAlongSession([{ id: 0, time: 1 }], {
      sampleRate: SR,
      tolerance: TOL,
      clicks: { times: () => clickTimes },
    });
    s.onset(onsetAt(5, echoAt));
    s.update(mixed, 1.5);
    expect(s.onsets.map((o) => o.echo)).toEqual([true, false]);
    expect(s.results[0].tier).toBe("onTime");
    expect(s.results[0].deltaMs).toBeCloseTo(0, 0);
    expect(s.config.tolerance).toEqual(TOL);
    expect(s.biasMs).toBe(0);
  });

  it("waits for the samples after an onset before checking it", () => {
    const s = new PlayAlongSession(notes, {
      sampleRate: SR,
      tolerance: TOL,
      clicks: { times: () => [] },
    });
    const short = new StreamHistory(SR * 3);
    short.push(new Float32Array(Math.round(1.02 * SR)), 0); // ends 20 ms after the onset
    s.onset(onsetAt(0, 1));
    expect(s.update(short, 2.5)).toEqual([]); // nothing graded, nothing advanced
    expect(s.results[0].resolved).toBe(false);
    short.push(new Float32Array(SR));
    s.update(short, 2.5);
    expect(s.results[0].tier).toBe("onTime");
  });

  it("names what was played once its audio is in", () => {
    const s = new PlayAlongSession([{ id: "a", time: 1, label: "E" }], {
      sampleRate: SR,
      tolerance: TOL,
      labeler: { readyAt: (frame) => frame + SR / 10, label: () => "A" },
    });
    const h = new StreamHistory(SR * 3);
    h.push(new Float32Array(Math.round(1.05 * SR)), 0);
    s.onset(onsetAt(0, 1));
    s.update(h, 0.9);
    expect(s.results[0]).toMatchObject({ tier: "onTime", label: "pending" });
    expect(s.done).toBe(false);
    h.push(new Float32Array(SR));
    s.update(h, 2);
    expect(s.results[0]).toMatchObject({ label: "wrong", heardLabel: "A" });
    expect(s.done).toBe(true);
    expect(s.finish()).toEqual([]);
  });
});
