import { describe, expect, it } from "vitest";

import { AdaptiveLevel, GATED_SILENCE_DB } from "../../../src/analysis/readout/adaptiveLevel";

function feed(a: AdaptiveLevel, from: number, seconds: number, db: (t: number) => number) {
  let r = a.push(db(from), from);
  for (let t = from + 0.1; t <= from + seconds + 1e-9; t += 0.1) r = a.push(db(t), t);
  return r;
}

describe("AdaptiveLevel", () => {
  it("learns a digital-silence floor and opens on quiet music", () => {
    const a = new AdaptiveLevel();
    const quiet = feed(a, 0, 8, () => -100);
    expect(quiet.open).toBe(false);
    expect(quiet.gatedDb).toBe(GATED_SILENCE_DB);
    expect(quiet.level).toBe(0);
    const music = feed(a, 8.1, 2, (t) => -86 + 3 * Math.sin(t * 7));
    expect(music.open).toBe(true);
    expect(music.level).toBeGreaterThan(0);
    expect(music.gatedDb).toBeGreaterThan(-90);
  });

  it("scales the level to the input: the loudest recent peak reads near 1", () => {
    const a = new AdaptiveLevel();
    feed(a, 0, 6, () => -95);
    const loud = feed(a, 6.1, 1, () => -60);
    expect(loud.level).toBeGreaterThan(0.95);
    const softer = feed(a, 7.2, 1, () => -75);
    expect(softer.level).toBeGreaterThan(0.3);
    expect(softer.level).toBeLessThan(0.8);
    // The ceiling sinks slowly towards the new playing level.
    const later = feed(a, 8.3, 40, (t) => (Math.floor(t * 4) % 2 ? -75 : -90));
    expect(later.ceilingDb).toBeLessThan(softer.ceilingDb - 5);
  });

  it("follows a noisy floor, and resets", () => {
    const a = new AdaptiveLevel();
    const hiss = feed(a, 0, 20, () => -70);
    expect(hiss.floorDb).toBeGreaterThan(-75);
    expect(feed(a, 20.1, 1, () => -71).open).toBe(false);
    expect(a.push(-Infinity, 22).floorDb).toBeLessThanOrEqual(hiss.floorDb);
    a.reset();
    expect(a.push(-100, 0).ceilingDb).toBeGreaterThanOrEqual(a.push(-100, 0.1).floorDb);
  });
});

describe("AdaptiveLevel.configure", () => {
  it("a stricter gate needs a louder signal to open", () => {
    const a = new AdaptiveLevel();
    feed(a, 0, 6, () => -95);
    a.configure({ openMarginDb: 20, closeMarginDb: 10 });
    expect(feed(a, 6.1, 1, (t) => -86 + Math.sin(t * 9)).open).toBe(false);
    a.configure({ openMarginDb: 3, closeMarginDb: 1.5 });
    expect(feed(a, 7.2, 1, (t) => -86 + Math.sin(t * 9)).open).toBe(true);
  });
});
