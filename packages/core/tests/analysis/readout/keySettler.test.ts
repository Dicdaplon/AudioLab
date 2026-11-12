import { describe, expect, it } from "vitest";

import type { KeyMode, KeyScore } from "../../../src/analysis/keyDetection";
import { KeySettler } from "../../../src/analysis/readout/keySettler";

function ranking(tonic: number, mode: KeyMode): KeyScore[] {
  return [{ tonic, mode, name: "", shortName: "", correlation: 0.9, probability: 0.6 }];
}

/** Push `seconds` of 10 Hz frames voting for one key; returns the last reading. */
function run(s: KeySettler, t0: number, seconds: number, tonic: number, mode: KeyMode, db = -20) {
  let r = s.push(ranking(tonic, mode), db, t0);
  for (let i = 1; i <= Math.round(seconds * 10); i++) {
    r = s.push(ranking(tonic, mode), db, t0 + i / 10);
  }
  return r;
}

describe("KeySettler", () => {
  it("listens, hesitates, then settles once and fires the event once", () => {
    const s = new KeySettler();
    expect(s.push([], -20, 0)).toMatchObject({ phase: "listening", key: null, stability: 0 });
    const early = run(s, 0.1, 1, 4, "min");
    expect(early.phase).toBe("hesitant");
    expect(early.key).toEqual({ tonic: 4, mode: "min" });

    const events: string[] = [];
    let r = early;
    for (let i = 12; i <= 80; i++) {
      r = s.push(ranking(4, "min"), -20, i / 10);
      if (r.event) events.push(r.event);
    }
    expect(r.phase).toBe("settled");
    expect(r.stability).toBeGreaterThan(0.9);
    expect(events).toEqual(["settled"]);
  });

  it("names a runner-up while hesitating between two keys", () => {
    const s = new KeySettler();
    let r = s.push([], -20, 0);
    for (let i = 1; i <= 30; i++) {
      r = s.push(i % 3 === 0 ? ranking(7, "maj") : ranking(4, "min"), -20, i / 10);
    }
    expect(r.phase).toBe("hesitant");
    expect(r.key).toEqual({ tonic: 4, mode: "min" });
    expect(r.runnerUp).toEqual({ tonic: 7, mode: "maj" });
  });

  it("ignores quiet frames instead of losing the key", () => {
    const s = new KeySettler();
    run(s, 0, 8, 9, "min");
    const r = run(s, 8.1, 20, 0, "maj", -95);
    expect(r).toMatchObject({ phase: "settled", key: { tonic: 9, mode: "min" } });
  });

  it("modulates only after the new key has led long enough", () => {
    const s = new KeySettler();
    run(s, 0, 8, 7, "maj");
    const shortly = run(s, 8.1, 4, 2, "maj");
    expect(shortly.key).toEqual({ tonic: 7, mode: "maj" });
    let event: string | null = null;
    let r = shortly;
    for (let i = 122; i <= 200; i++) {
      r = s.push(ranking(2, "maj"), -20, i / 10);
      event ??= r.event;
    }
    expect(r).toMatchObject({ phase: "settled", key: { tonic: 2, mode: "maj" } });
    expect(event).toBe("modulated");
  });

  it("goes back to hesitant, then listening, when the votes scatter", () => {
    const s = new KeySettler({ stabilitySeconds: 0.5 });
    run(s, 0, 6, 0, "maj");
    let r = s.push(ranking(1, "maj"), -20, 6.1);
    const phases = new Set<string>();
    for (let i = 0; i < 80; i++) {
      r = s.push(ranking(i % 12, i % 2 ? "min" : "maj"), -20, 6.2 + i / 10);
      phases.add(r.phase);
    }
    expect(phases.has("hesitant")).toBe(true);
    expect(r.phase).toBe("listening");
    expect(r.key).toBeNull();
  });

  it("reset() starts over", () => {
    const s = new KeySettler();
    run(s, 0, 8, 7, "maj");
    s.reset();
    expect(s.push([], -20, 9)).toMatchObject({ phase: "listening", key: null });
  });
});
