/**
 * The wolf on the spectrum city: where it stands, where it walks, where it
 * hides, when a hit knocks it off, and the climb / fall physics.
 */
import { describe, expect, it } from "vitest";

import {
  bandBalance,
  chooseDestination,
  chooseHide,
  createRoam,
  hideX,
  hideY,
  shouldFall,
  standY,
  stepRoam,
  type RoamMusic,
  type RoamState,
  type RoamWorld,
} from "../../src/stage/wolf";

/** A city 100 cells wide, ground at 100, roofs given by column. */
function world(roof: (x: number) => number = () => 80, bands: number[] = []): RoamWorld {
  return {
    width: 100,
    ground: 100,
    roofAt: (x) => roof(Math.max(0, Math.min(99, Math.floor(x)))),
    bands,
  };
}

const calm: RoamMusic = { playing: true, level: 0.4, knock: null, free: true };

/** A seeded generator, for repeatable walks. */
function seeded(seed = 1): () => number {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function run(
  s: RoamState,
  w: RoamWorld,
  seconds: number,
  music: RoamMusic | ((t: number) => RoamMusic) = calm,
  from = 0,
  random = seeded(),
): { state: RoamState; trace: RoamState[] } {
  const trace: RoamState[] = [];
  const dt = 1 / 60;
  for (let t = from; t < from + seconds; t += dt) {
    s = stepRoam(s, w, typeof music === "function" ? music(t) : music, t, dt, random);
    trace.push(s);
  }
  return { state: s, trace };
}

describe("standY / hide places", () => {
  it("stands its paws on the highest roof under them", () => {
    const w = world((x) => (x < 50 ? 80 : 60));
    expect(standY(w, 10)).toBe(64);
    expect(standY(w, 40)).toBe(44); // paws reach column 52
    expect(standY(w, 60)).toBe(44);
  });

  it("hides with its back out of the area and only `peek` rows above the end roof", () => {
    const w = world((x) => (x < 8 ? 90 : 70));
    expect(hideX(w, "low")).toBe(-5);
    expect(hideX(w, "high")).toBe(89);
    expect(hideY(w, "low", 5)).toBe(85);
    expect(hideY(w, "high", 8)).toBe(62);
  });
});

describe("choices", () => {
  it("balances the lowest and highest thirds of the bands", () => {
    expect(bandBalance([1, 1, 0, 0, 0, 0.5])).toEqual({ bass: 1, treble: 0.25 });
    expect(bandBalance([])).toEqual({ bass: 0, treble: 0 });
  });

  it("runs away from the bass, from the treble, to the nearest end when very loud", () => {
    const r = () => 0.9;
    expect(chooseHide(world(undefined, [0.9, 0.8, 0.2, 0.1, 0.1, 0.1]), calm, 50, r)).toBe("high");
    expect(chooseHide(world(undefined, [0.1, 0.1, 0.2, 0.1, 0.7, 0.9]), calm, 50, r)).toBe("low");
    const loud = { playing: true, level: 0.95 };
    expect(chooseHide(world(undefined, [0.5, 0.5, 0.5]), loud, 10, r)).toBe("low");
    expect(chooseHide(world(undefined, [0.5, 0.5, 0.5]), loud, 80, r)).toBe("high");
    expect(chooseHide(world(undefined, [0.5, 0.5, 0.5]), calm, 50, r)).toBeNull();
    expect(chooseHide(world(undefined, [0.6, 0.5, 0.5]), calm, 50, () => 0.1)).toBe("high");
    // In a silence, sometimes, to peek out.
    expect(chooseHide(world(), { playing: false, level: 0 }, 50, () => 0.05)).toBe("low");
    expect(chooseHide(world(), { playing: false, level: 0 }, 50, () => 0.9)).toBeNull();
  });

  it("walks a calm distance, inside the area, away from a near edge", () => {
    const w = world();
    const random = seeded(7);
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(random() * 85);
      const d = chooseDestination(w, x, random);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(84);
    }
    expect(chooseDestination(w, 0, () => 0.1)).toBeGreaterThan(8);
    expect(chooseDestination(w, 84, () => 0.9)).toBeLessThan(76);
  });

  it("is knocked off a roof by a big attack, not on the ground, a jump at most every few seconds", () => {
    const w = world();
    const s = createRoam(w, 0);
    expect(shouldFall(s, w, { knock: null }, 1)).toBe(false);
    expect(shouldFall(s, w, { knock: "jump" }, 1)).toBe(true);
    const up = { ...s, safeUntil: 10, graceUntil: 4 };
    expect(shouldFall(up, w, { knock: "jump" }, 3)).toBe(false);
    expect(shouldFall(up, w, { knock: "tumble" }, 3)).toBe(false);
    expect(shouldFall(up, w, { knock: "tumble" }, 5)).toBe(true);
    expect(shouldFall(up, w, { knock: "jump" }, 10)).toBe(true);
    expect(shouldFall({ ...s, mode: "climb", recovering: true }, w, { knock: "tumble" }, 30)).toBe(
      false,
    );
    expect(shouldFall({ ...s, mode: "climb" }, w, { knock: "tumble" }, 30)).toBe(true);
    expect(shouldFall({ ...s, y: 84 }, w, { knock: "tumble" }, 30)).toBe(false);
    expect(shouldFall({ ...s, mode: "dazed" }, w, { knock: "tumble" }, 30)).toBe(false);
  });
});

describe("stepRoam", () => {
  it("sits a few seconds, then walks calmly along the roofs, then pauses", () => {
    const w = world();
    const { trace } = run(createRoam(w, 0), w, 30);
    const firstWalk = trace.findIndex((s) => s.mode === "walk");
    expect(firstWalk / 60).toBeGreaterThanOrEqual(2.9);
    let fastest = 0;
    for (let i = 1; i < trace.length; i++)
      if (!trace[i].hide) fastest = Math.max(fastest, Math.abs(trace[i].x - trace[i - 1].x) * 60);
    expect(fastest).toBeLessThanOrEqual(5.01);
    // Feet on the roof the whole time (flat city).
    expect(trace.every((s) => s.mode === "hide" || s.y === 64)).toBe(true);
    expect(trace.some((s, i) => i > firstWalk && (s.mode === "sit" || s.mode === "hide"))).toBe(
      true,
    );
  });

  it("climbs a higher roof step by step and hops down a lower one", () => {
    // A tower in the middle.
    const w = world((x) => (x >= 60 && x < 70 ? 40 : 80));
    let s: RoamState = { ...createRoam(w, 0), x: 30, y: 64, mode: "walk", target: 65 };
    const { state, trace } = run(s, w, 20, { ...calm, free: false });
    const climbing = trace.filter((t) => t.mode === "climb");
    expect(climbing.length).toBeGreaterThan(30); // 40 cells at 14 cells/s
    for (let i = 1; i < trace.length; i++)
      if (trace[i].mode === "climb") expect(trace[i - 1].y - trace[i].y).toBeLessThan(0.25);
    expect(state.mode).toBe("sit");
    expect(state.y).toBe(24);
    // Then back down.
    s = { ...state, mode: "walk", target: 20 };
    const down = run(s, w, 20, { ...calm, free: false }, 20);
    expect(down.trace.some((t) => t.mode === "hop")).toBe(true);
    expect(down.state.y).toBe(64);
  });

  it("follows a roof that rises, hops when it sinks", () => {
    let h = 80;
    const w = world(() => h);
    let s = createRoam(w, 0);
    h = 70;
    s = stepRoam(s, w, { ...calm, free: false }, 0.1, 1 / 60);
    expect(s.y).toBe(54);
    h = 90;
    s = stepRoam(s, w, { ...calm, free: false }, 0.2, 1 / 60);
    expect(s.mode).toBe("hop");
    s = run(s, w, 2, { ...calm, free: false }, 0.3).state;
    expect(s.mode).toBe("sit");
    expect(s.y).toBe(74);
  });

  it("falls when knocked, bounces once, lands on the ground, sits dazed, climbs back", () => {
    const w = world((x) => (x < 50 ? 40 : 80));
    let s: RoamState = { ...createRoam(w, 0), x: 20, y: 24, facing: 1 };
    s = stepRoam(s, w, { ...calm, knock: "tumble" }, 1, 1 / 60);
    expect(s.mode).toBe("fall");
    expect(s.vy).toBeLessThan(0);
    const { trace } = run(s, w, 10, { ...calm, free: false }, 1.02);
    const landed = trace.findIndex((t) => t.mode === "dazed");
    expect(landed).toBeGreaterThan(0);
    expect(trace[landed].y).toBe(84);
    // One bounce before.
    expect(trace.slice(0, landed).some((t, i) => i > 0 && t.vy < 0 && trace[i - 1].vy > 0)).toBe(
      true,
    );
    // Gravity: it speeds up while falling.
    const falling = trace.slice(0, landed).filter((t) => t.vy > 0);
    expect(falling[falling.length - 1].vy).toBeGreaterThan(falling[0].vy);
    const climb = trace.findIndex((t) => t.mode === "climb");
    expect((climb - landed) / 60).toBeGreaterThan(1.5);
    const back = trace[trace.length - 1];
    expect(back.mode).toBe("sit");
    expect(back.y).toBe(standY(w, back.x));
    expect(back.y).toBeLessThan(84);
    // Safe for a while once back up.
    expect(shouldFall(back, w, { knock: "jump" }, 11)).toBe(false);
  });

  it("goes to hide when the bass is heavy, peeks out in the quiet, comes back", () => {
    const w = world((x) => (x >= 92 ? 70 : 80), [0.9, 0.9, 0.3, 0.2, 0.1, 0.1]);
    const s: RoamState = { ...createRoam(w, 0), nextMoveAt: 0 };
    const loud: RoamMusic = { playing: true, level: 0.8, knock: null, free: true };
    const { trace } = run(
      s,
      w,
      40,
      (t) => (t < 25 ? loud : { ...loud, level: 0.1 }),
      0,
      () => 0.1,
    );
    const hidden = trace.filter((t) => t.mode === "hide");
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden.every((t) => t.hide === "high" && t.x === 89 && t.facing === -1)).toBe(true);
    // Only ears and eyes while it is loud.
    expect(hidden.some((t) => Math.abs(t.peek - 6) < 0.01 && t.y === 64)).toBe(true);
    const out = trace.findIndex(
      (t, i) => i > 0 && trace[i - 1].mode === "hide" && t.mode !== "hide",
    );
    expect(out).toBeGreaterThan(0);
  });

  it("ducks when hit while hidden instead of falling", () => {
    const w = world();
    let s: RoamState = { ...createRoam(w, 0), mode: "hide", hide: "low", peek: 8, hideUntil: 10 };
    s = stepRoam(s, w, { ...calm, knock: "tumble" }, 1, 1 / 60);
    expect(s.mode).toBe("hide");
    expect(s.peek).toBeLessThanOrEqual(5.2);
  });
});
