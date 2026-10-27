/**
 * Streaming pYIN on synthetic tones: notes of known frequency (harmonic
 * tones, plucked-string-like tones), silence, noise and note changes.
 */
import { describe, expect, it } from "vitest";

import { PyinTracker, pyinThresholdPrior } from "../src/analysis/pyin";
import { concat, midiToHz, notes, pluckedTone, whiteNoise } from "./helpers/synth";

const centsBetween = (f: number, ref: number) => 1200 * Math.log2(f / ref);

/** Feeds `signal` in 512-sample batches; returns the estimate after each batch. */
function run(tracker: PyinTracker, signal: Float32Array) {
  const out = [];
  for (let i = 0; i + 512 <= signal.length; i += 512) {
    tracker.push(signal.subarray(i, i + 512));
    out.push(tracker.estimate);
  }
  return out;
}

/** Phase-continuous tone (3 harmonics) through the given frequencies, `seconds` each. */
function steps(sr: number, freqs: number[], seconds: number): Float32Array {
  const n = Math.round(seconds * sr);
  const out = new Float32Array(n * freqs.length);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    phase += (2 * Math.PI * freqs[Math.floor(i / n)]) / sr;
    out[i] = 0.2 * (Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.3 * Math.sin(3 * phase));
  }
  return out;
}

describe("pyinThresholdPrior", () => {
  it("spreads the Beta prior over 100 thresholds with its mean at a / (a + b)", () => {
    const p = pyinThresholdPrior(2, 18);
    expect(p).toHaveLength(100);
    const total = p.reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(1, 9);
    const mean = p.reduce((s, v, i) => s + v * ((i + 0.5) / 100), 0);
    expect(mean).toBeCloseTo(0.1, 2);
  });
});

describe("PyinTracker", () => {
  it.each([44100, 48000])("finds the note and its cents on harmonic tones at %i Hz", (sr) => {
    for (const [midi, cents] of [
      [40, 0], // low E
      [45, 12],
      [57, -20],
      [64, 7],
      [76, -3],
      [88, 0],
    ]) {
      const tracker = new PyinTracker({ sampleRate: sr });
      run(tracker, notes([midi], { sampleRate: sr, seconds: 0.5, cents }));
      const e = tracker.estimate!;
      expect(e, `midi ${midi}`).not.toBeNull();
      expect(e.midi).toBe(midi);
      expect(Math.abs(e.cents - cents)).toBeLessThan(3);
      expect(Math.abs(centsBetween(e.frequency, midiToHz(midi, cents)))).toBeLessThan(3);
      expect(e.clarity).toBeGreaterThan(0.9);
      expect(e.clarity).toBeLessThanOrEqual(1);
    }
  });

  it("tracks plucked-string tones with a weak fundamental without octave errors", () => {
    const sr = 48000;
    for (const f0 of [82.41, 110, 146.83, 196, 246.94, 329.63]) {
      const tone = pluckedTone(f0, {
        sampleRate: sr,
        seconds: 0.6,
        amplitude: (k) => (k === 1 ? 0.3 : 1 / k),
        inharmonicity: 1e-4,
      });
      const tracker = new PyinTracker({ sampleRate: sr });
      run(tracker, tone);
      expect(Math.abs(centsBetween(tracker.estimate!.frequency, f0)), `${f0} Hz`).toBeLessThan(15);
    }
  });

  it("decides a frame lagFrames hops after it was heard", () => {
    const sr = 48000;
    const hop = 480;
    const tone = notes([57], { sampleRate: sr, seconds: 0.5 });
    const signal = concat([new Float32Array(sr / 2), tone]);
    const firstVoiced = (lagFrames: number) => {
      const tracker = new PyinTracker({ sampleRate: sr, hopSize: hop, lagFrames });
      let pushed = 0;
      for (let i = 0; i < signal.length; i += hop) {
        tracker.push(signal.subarray(i, i + hop));
        pushed += hop;
        if (tracker.estimate) return pushed;
      }
      return Infinity;
    };
    const causal = firstVoiced(0);
    const lagged = firstVoiced(5);
    expect(causal).toBeLessThan(Infinity);
    // The look-ahead may also date the onset one or two frames earlier.
    expect(lagged - causal).toBeGreaterThanOrEqual(3 * hop);
    expect(lagged - causal).toBeLessThanOrEqual(5 * hop);
    expect(new PyinTracker({ sampleRate: sr }).latencySeconds).toBeCloseTo(0.05 + 1024 / sr, 6);
  });

  it("is null on silence, on noise, and returns to null after a note", () => {
    const sr = 44100;
    const silent = new PyinTracker({ sampleRate: sr });
    run(silent, new Float32Array(sr / 2));
    expect(silent.estimate).toBeNull();

    const noisy = new PyinTracker({ sampleRate: sr });
    const voiced = run(noisy, whiteNoise(sr, 0.3, 3)).filter((e) => e !== null).length;
    expect(voiced).toBeLessThan(5);

    const tracker = new PyinTracker({ sampleRate: sr });
    run(tracker, notes([60], { sampleRate: sr, seconds: 0.4 }));
    expect(tracker.estimate?.midi).toBe(60);
    run(tracker, new Float32Array(sr / 4));
    expect(tracker.estimate).toBeNull();
  });

  it("follows a note change and keeps the held name within the hysteresis", () => {
    const sr = 48000;
    const tracker = new PyinTracker({ sampleRate: sr });
    const a = notes([57], { sampleRate: sr, seconds: 0.4 });
    const b = notes([64], { sampleRate: sr, seconds: 0.4 });
    const est = run(tracker, concat([a, b]));
    expect(est[30]?.midi).toBe(57);
    expect(est[est.length - 1]?.midi).toBe(64);

    // 57 + 55 cents: the held A3 stays A3 (cents beyond 50), a fresh tracker says A#3.
    const held = new PyinTracker({ sampleRate: sr });
    run(held, steps(sr, [midiToHz(57, 40), midiToHz(57, 55)], 0.4));
    expect(held.estimate?.midi).toBe(57);
    expect(held.estimate!.cents).toBeGreaterThan(50);
  });

  it("applies a new reference A4 and forgets everything on reset", () => {
    const sr = 48000;
    const tracker = new PyinTracker({ sampleRate: sr, referenceA4: 440 });
    const tone = notes([69], { sampleRate: sr, seconds: 0.4, cents: centsBetween(442, 440) });
    run(tracker, tone);
    expect(tracker.estimate!.cents).toBeGreaterThan(5);
    tracker.setReferenceA4(442);
    run(tracker, tone);
    expect(Math.abs(tracker.estimate!.cents)).toBeLessThan(2);
    tracker.reset();
    expect(tracker.estimate).toBeNull();
    run(tracker, tone.subarray(0, 2048));
    expect(tracker.estimate).toBeNull(); // still inside the look-ahead
  });

  it("lists candidates whose probabilities sum to the voicing probability", () => {
    const sr = 48000;
    const tracker = new PyinTracker({ sampleRate: sr });
    const tone = notes([52], { sampleRate: sr, seconds: 0.1 });
    const cands = tracker.candidatesOf(tone.subarray(0, 2048));
    const total = cands.reduce((s, c) => s + c.probability, 0);
    expect(total).toBeGreaterThan(0.9);
    expect(total).toBeLessThanOrEqual(1 + 1e-9);
    const best = cands.reduce((a, c) => (c.probability > a.probability ? c : a));
    expect(Math.abs(centsBetween(best.frequency, midiToHz(52)))).toBeLessThan(3);
    expect(tracker.candidatesOf(new Float32Array(2048))).toEqual([]);
  });

  it("rejects a missing sample rate", () => {
    expect(() => new PyinTracker({ sampleRate: 0 })).toThrow();
  });
});
