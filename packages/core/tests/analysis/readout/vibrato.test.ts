import { describe, expect, it } from "vitest";

import { NO_VIBRATO, VibratoDetector } from "../../../src/analysis/readout/vibrato";

/** Feed `cents(t)` at `rate` estimates per second for `seconds`; return the last reading. */
function feed(d: VibratoDetector, seconds: number, cents: (t: number) => number, rate = 40) {
  let r = NO_VIBRATO;
  for (let i = 0; i <= seconds * rate; i++) r = d.push(cents(i / rate), i / rate);
  return r;
}

describe("VibratoDetector", () => {
  it("reads a 6 Hz, ±25 cents vibrato", () => {
    const r = feed(new VibratoDetector(), 1, (t) => 25 * Math.sin(2 * Math.PI * 6 * t));
    expect(r.active).toBe(true);
    expect(r.rateHz).toBeCloseTo(6, 0);
    expect(r.extentCents).toBeGreaterThan(22);
    expect(r.extentCents).toBeLessThan(30);
  });

  it("follows a vibrato riding a slow bend (the drift is removed)", () => {
    const r = feed(
      new VibratoDetector(),
      1,
      (t) => 60 * t + 20 * Math.sin(2 * Math.PI * 5 * t + 0.3),
    );
    expect(r.active).toBe(true);
    expect(r.rateHz).toBeCloseTo(5, 0);
  });

  it("stays quiet on a steady note, a too-narrow wobble, or a too-slow sway", () => {
    expect(feed(new VibratoDetector(), 1, () => 3).active).toBe(false);
    expect(feed(new VibratoDetector(), 1, (t) => 5 * Math.sin(2 * Math.PI * 6 * t)).active).toBe(
      false,
    );
    const slow = feed(new VibratoDetector(), 1.5, (t) => 30 * Math.sin(2 * Math.PI * 1.5 * t));
    expect(slow.active).toBe(false);
  });

  it("ignores irregular jitter", () => {
    // Deterministic pseudo-random jumps of ±30 cents.
    const jitter = (t: number) => 30 * Math.sin(t * 977.3) * Math.cos(t * 311.7);
    expect(feed(new VibratoDetector(), 1, jitter).active).toBe(false);
  });

  it("needs a cycle before reporting, can be re-tuned, and resets", () => {
    const d = new VibratoDetector();
    expect(d.push(0, 0)).toEqual(NO_VIBRATO);
    const r = feed(d, 1, (t) => 10 * Math.sin(2 * Math.PI * 6 * t));
    expect(r.active).toBe(false); // ±10 < 12 cents
    d.configure({ minExtentCents: 8 });
    expect(d.push(10 * Math.sin(2 * Math.PI * 6 * 1.025), 1.025).active).toBe(true);
    d.reset();
    expect(d.push(0, 2)).toEqual(NO_VIBRATO);
  });
});
