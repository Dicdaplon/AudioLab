/**
 * The click learnt during the count-in: a noisy clave (band-pass noise, as
 * MusicalBook's), a phone-like 520 ms round trip, and guitar strums landing
 * at the same delay. The band rule misses many clave echoes; the learnt
 * shape does not, and keeps the strums.
 */

import { describe, expect, it } from "vitest";

import { ClickEchoFilter, spectralRise, StreamHistory } from "../../src";
import { PlayAlongSession } from "../../src/rhythm";
import { strum, voicingNotes } from "../helpers/guitar";

const SR = 48000;
const N = SR;
const AT = 24000;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return (s / 2147483648) * 2 - 1;
  };
}

/** RBJ band-pass (or high-pass) biquad. */
function biquad(x: Float32Array, f0: number, q: number, highpass = false): Float32Array {
  const w = (2 * Math.PI * f0) / SR;
  const a = Math.sin(w) / (2 * q);
  const c = Math.cos(w);
  const [b0, b1, b2] = highpass ? [(1 + c) / 2, -(1 + c), (1 + c) / 2] : [a, 0, -a];
  const [a0, a1, a2] = [1 + a, -2 * c, 1 - a];
  const y = new Float32Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
}

/** A clave through a phone speaker: band-pass noise at 2.4 kHz, clipped, no bass. */
function clave(seed: number, gain = 5): Float32Array {
  const r = rng(seed);
  const x = new Float32Array(N);
  for (let i = AT; i < AT + 0.07 * SR; i++) x[i] = r();
  const y = biquad(x, 2400, 2.4);
  for (let i = AT; i < N; i++)
    y[i] = Math.max(-1, Math.min(1, y[i] * gain * Math.exp(-(i - AT) / SR / 0.02)));
  return biquad(y, 350, 0.7, true);
}

function strumAt(seed: number, gain = 0.3): Float32Array {
  const shapes = ["x32010", "320003", "022000", "x02220", "133211", "xx0232"];
  const s = strum(voicingNotes(shapes[seed % shapes.length]), {
    sampleRate: SR,
    seconds: (N - AT) / SR,
    seed,
  });
  const y = new Float32Array(N);
  for (let i = 0; i < s.length; i++) y[AT + i] = gain * s[i];
  return y;
}

function riseOf(...parts: Float32Array[]) {
  const r = rng(99);
  const y = new Float32Array(N);
  for (let i = 0; i < N; i++) y[i] = 0.002 * r();
  for (const p of parts) for (let i = 0; i < N; i++) y[i] += p[i];
  const h = new StreamHistory(N);
  h.push(y, 0);
  return spectralRise(h, AT, SR, { band: [1700, 3400] })!;
}

// Clicks every 750 ms; an onset 520 ms after click k sits at k·0.75 + 0.52.
const clicks = Array.from({ length: 12 }, (_, k) => k * 0.75);
const heardAt = (k: number) => clicks[k] + 0.52;

describe("the click learnt during the count-in", () => {
  it("is missed by its band alone", () => {
    // With the attack found a few ms early or late, one echo in four to two
    // in five falls under the band rule; even placed exactly, some do.
    const filter = new ClickEchoFilter({ maxDelayMs: 800 });
    let missed = 0;
    for (let k = 0; k < 12; k++) {
      if (!filter.check(heardAt(k), riseOf(clave(k + 1)).bandShare, clicks).echo) missed++;
    }
    expect(missed).toBeGreaterThanOrEqual(1);
  });

  it("then recognises every echo at any loudness, beyond 400 ms, and keeps the strums", () => {
    const filter = new ClickEchoFilter();
    for (let k = 0; k < 4; k++) {
      expect(filter.learn(heardAt(k), riseOf(clave(100 + k, 1)), clicks)).toBe(true);
    }
    expect(filter.learntClick?.echoes).toBe(4);
    expect(filter.learntClick!.delayMs).toBeCloseTo(520, 6);
    expect(filter.roundTripMs).toBeCloseTo(520, 6);

    for (let k = 4; k < 12; k++) {
      // From 6 dB quieter to 14 dB louder (clipped): the volume changed.
      for (const gain of [0.5, 1, 2, 5]) {
        expect(filter.check(heardAt(k), riseOf(clave(200 + k, gain)), clicks).echo).toBe(true);
      }
      // A strum heard exactly where the echo would be is a note.
      expect(filter.check(heardAt(k), riseOf(strumAt(k)), clicks).echo).toBe(false);
      // A strum merged with the echo (same instant) shows only when the guitar
      // is much louder than the echo (here about 18 dB): a quieter one stays
      // hidden in it. A note before the echo, or 15–45 ms after, is found.
      expect(filter.check(heardAt(k), riseOf(clave(400 + k, 1), strumAt(k, 8)), clicks).echo).toBe(
        false,
      );
    }
    // A clave far from the learnt delay is not this click's echo.
    expect(filter.check(clicks[6] + 0.2, riseOf(clave(7)), clicks).echo).toBe(false);
  });

  it("ignores a note played during the count-in", () => {
    const filter = new ClickEchoFilter();
    filter.learn(heardAt(0), riseOf(clave(1)), clicks);
    filter.learn(clicks[1] + 0.1, riseOf(strumAt(1)), clicks); // a strum, 100 ms after a click
    expect(filter.learntClick).toBeNull(); // two delays that disagree
    filter.learn(heardAt(2), riseOf(clave(3)), clicks);
    expect(filter.learntClick?.echoes).toBe(2);
    expect(filter.check(heardAt(5), riseOf(clave(6)), clicks).echo).toBe(true);
    filter.reset();
    expect(filter.learntClick).toBeNull();
    expect(filter.roundTripMs).toBeNull();
  });
});

describe("a play-along session with a noisy click", () => {
  it("learns the click from the count-in, never grades it, and keeps the notes", () => {
    // 4 count-in clicks, then 4 notes on the next clicks; 520 ms round trip.
    const T = 7;
    const n = T * SR;
    const signal = new Float32Array(n);
    const r = rng(5);
    for (let i = 0; i < n; i++) signal[i] = 0.002 * r();
    const times = Array.from({ length: 8 }, (_, k) => 0.5 + k * 0.75);
    const mix = (part: Float32Array, at: number) => {
      const start = Math.round(at * SR);
      for (let i = AT; i < N && start + i - AT < n; i++) signal[start + i - AT] += part[i];
    };
    times.forEach((t, k) => mix(clave(10 + k, 1), t + 0.52));
    // The player plays on clicks 4, 5 and 7, 100 ms ahead of the echo, as loud as it.
    // (Much louder, the echo drowns in the ringing strings and is left ungraded:
    // it falls in the window of the note just played.)
    for (const k of [4, 5, 7]) mix(strumAt(k, 1), times[k] + 0.42);
    const history = new StreamHistory(n);
    history.push(signal, 0);

    const notes = times.slice(4).map((time, id) => ({ id, time }));
    const session = new PlayAlongSession(notes, {
      sampleRate: SR,
      offsetMs: 420,
      clicks: { times: () => times },
    });
    let id = 0;
    const onset = (t: number) => session.onset({ id: id++, time: t, frame: Math.round(t * SR) });
    times.forEach((t, k) => {
      if (k >= 4 && k !== 6) onset(t + 0.42);
      onset(t + 0.52);
    });
    session.update(history, T);
    session.finish();

    expect(session.learntClick?.echoes).toBe(4);
    expect(session.onsets.filter((o) => o.echo)).toHaveLength(8);
    expect(session.results.map((r) => r.tier)).toEqual(["onTime", "onTime", "missed", "onTime"]);
  });
});
