// @vitest-environment node
import { describe, expect, it } from "vitest";

import { StreamHistory } from "../../src/analysis/onset/afterOnset";
import { ClickEchoFilter } from "../../src/timing/clickEcho";
import {
  PlayAlongStoppedError,
  attachPlayAlong,
  type PlayAlongEvent,
  type PlayAlongOnset,
  type PlayAlongSource,
} from "../../src/rhythm";

const SR = 48000;
const TOL = { onTimeMs: 100, windowMs: 300 };

/** A fake onset analysis: push onsets and batches by hand. */
function fakeSource(history: StreamHistory | null = silence(4)) {
  const onsets = new Set<(o: PlayAlongOnset) => void>();
  const batches = new Set<(h: StreamHistory | null, t: number) => void>();
  const source: PlayAlongSource = {
    sampleRate: SR,
    history,
    subscribe: (l) => (onsets.add(l), () => onsets.delete(l)),
    subscribeBatch: (l) => (batches.add(l), () => batches.delete(l)),
  };
  return {
    source,
    onset: (id: number, time: number) =>
      onsets.forEach((l) => l({ id, time, frame: Math.round(time * SR) })),
    batch: (t: number) => batches.forEach((l) => l(history, t)),
    listeners: () => onsets.size + batches.size,
  };
}

function silence(seconds: number): StreamHistory {
  const h = new StreamHistory(seconds * SR);
  h.push(new Float32Array(seconds * SR), 0);
  return h;
}

const notes = [1, 1.5].map((time, id) => ({ id, time }));

describe("attachPlayAlong", () => {
  it("runs to the end on the source's batches, then detaches", async () => {
    const feed = fakeSource();
    const run = attachPlayAlong(feed.source, notes, { tolerance: TOL, endTime: 2 });
    const events: PlayAlongEvent["type"][] = [];
    run.subscribe((e) => events.push(e.type));
    expect(run.state).toBe("running");
    feed.onset(0, 1.02);
    feed.batch(1.2);
    expect(run.results[0].tier).toBe("onTime");
    expect(run.onsets).toHaveLength(1);
    feed.batch(2.1);
    expect(run.state).toBe("done");
    expect(events).toEqual(["results", "results", "done"]);
    const results = await run.finished;
    expect(results.map((r) => r.tier)).toEqual(["onTime", "missed"]);
    expect(feed.listeners()).toBe(0);
    expect(run.finish()).toBe(results); // already over: no-op
  });

  it("finish() grades what is left; stop() cancels and rejects", async () => {
    const a = fakeSource();
    const run = attachPlayAlong(a.source, notes, { tolerance: TOL, endTime: 2 });
    const finished = run.finish();
    expect(finished.every((r) => r.tier === "missed")).toBe(true);
    await expect(run.finished).resolves.toHaveLength(2);

    const b = fakeSource();
    const cancelled = attachPlayAlong(b.source, notes, { tolerance: TOL, endTime: 2 });
    cancelled.stop();
    cancelled.stop();
    expect(cancelled.state).toBe("stopped");
    await expect(cancelled.finished).rejects.toBeInstanceOf(PlayAlongStoppedError);
    expect(b.listeners()).toBe(0);
    b.onset(0, 1);
    expect(cancelled.onsets).toHaveLength(0);
  });

  it("reports the measured round trip and needs a history for clicks or labels", () => {
    const signal = new Float32Array(3 * SR);
    // The click scheduled at 0.9 s heard 70 ms later.
    const start = Math.round(0.97 * SR);
    for (let i = 0; i < 0.03 * SR; i++) {
      signal[start + i] =
        0.2 * Math.exp(-i / (0.006 * SR)) * Math.sin((2 * Math.PI * 2640 * i) / SR);
    }
    const history = new StreamHistory(signal.length);
    history.push(signal, 0);
    const feed = fakeSource(history);
    const filter = new ClickEchoFilter();
    const run = attachPlayAlong(feed.source, notes, {
      tolerance: TOL,
      endTime: 2,
      clicks: { times: () => [0.9], filter },
    });
    let reported: number | null = null;
    run.subscribe((e) => {
      if (e.type === "roundTrip") reported = e.ms;
    });
    feed.onset(9, 0.97);
    feed.batch(1.2);
    expect(reported).toBeCloseTo(70, 0);
    expect(run.roundTripMs).toBeCloseTo(70, 0);
    expect(run.biasMs).toBe(0);

    expect(() =>
      attachPlayAlong(fakeSource(null).source, notes, {
        endTime: 2,
        clicks: { times: () => [] },
      }),
    ).toThrow(/historySeconds/);
  });

  it("isolates a failing listener", () => {
    const feed = fakeSource();
    const run = attachPlayAlong(feed.source, notes, { tolerance: TOL, endTime: 2 });
    const seen: string[] = [];
    run.subscribe(() => {
      throw new Error("boom");
    });
    run.subscribe((e) => seen.push(e.type));
    const error = console.error;
    console.error = () => undefined;
    try {
      feed.onset(0, 1);
      feed.batch(1.2);
    } finally {
      console.error = error;
    }
    expect(seen).toEqual(["results"]);
  });
});
