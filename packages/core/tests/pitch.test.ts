/**
 * Pitch detection on synthetic signals. No recorded single-string fixture
 * exists in the repository, so every assertion here is against generated
 * tones whose frequency is known exactly: pure sines, plucked-string-like
 * tones (decaying partials, random phases, optional stiffness) and
 * spectra with a weak or missing fundamental.
 */
import { describe, expect, it } from "vitest";

import {
  PITCH_DEFAULTS,
  PitchTracker,
  detectPitch,
  frequencyToPitch,
  interpolatePeak,
  normalizedSquareDifference,
} from "../src/analysis/pitch";
import { mulberry32, pluckedTone, whiteNoise } from "./helpers/synth";

const SAMPLE_RATES = [44100, 48000];
const WINDOW = 2048;

const centsBetween = (f: number, ref: number) => 1200 * Math.log2(f / ref);

function sine(freq: number, sampleRate: number, length = WINDOW, amplitude = 0.3): Float32Array {
  const out = new Float32Array(length);
  const w = (2 * Math.PI * freq) / sampleRate;
  for (let i = 0; i < length; i++) out[i] = amplitude * Math.sin(w * i + 0.7);
  return out;
}

/** Partials `from`..`to` with 1/k amplitudes, the fundamental scaled by `f0Gain`. */
function partials(
  freq: number,
  sampleRate: number,
  from: number,
  to: number,
  f0Gain = 1,
  length = WINDOW,
): Float32Array {
  const out = new Float32Array(length);
  for (let k = from; k <= to; k++) {
    const a = (k === 1 ? f0Gain : 1) / k;
    const w = (2 * Math.PI * k * freq) / sampleRate;
    for (let i = 0; i < length; i++) out[i] += a * Math.sin(w * i + k);
  }
  return out;
}

/** 70 Hz → 1.4 kHz, geometric steps with a random detuning of ±15 cents. */
function sweep(points = 30): number[] {
  const rand = mulberry32(3);
  return Array.from({ length: points + 1 }, (_, i) => {
    const detune = ((rand() - 0.5) * 30) / 1200;
    return 70 * Math.pow(1400 / 70, i / points) * Math.pow(2, detune);
  });
}

function worstError(sampleRate: number, make: (f: number) => Float32Array): number {
  let worst = 0;
  for (const f of sweep()) {
    const estimate = detectPitch(make(f), sampleRate);
    expect(estimate, `${f.toFixed(1)} Hz at ${sampleRate} Hz`).not.toBeNull();
    worst = Math.max(worst, Math.abs(centsBetween(estimate!.frequency, f)));
  }
  return worst;
}

describe("normalizedSquareDifference", () => {
  it("is 1 at lag 0 and at the period, −1 at half the period", () => {
    const sampleRate = 48000;
    const period = 100; // 480 Hz
    const nsdf = normalizedSquareDifference(sine(sampleRate / period, sampleRate), 300);
    expect(nsdf[0]).toBeCloseTo(1, 6);
    expect(nsdf[period]).toBeCloseTo(1, 3);
    expect(nsdf[2 * period]).toBeCloseTo(1, 3);
    expect(nsdf[period / 2]).toBeCloseTo(-1, 2);
    expect(nsdf).toHaveLength(301);
  });

  it("ignores a DC offset and clamps the lag range to the window", () => {
    const sampleRate = 48000;
    const offset = sine(480, sampleRate).map((x) => x + 0.5);
    const nsdf = normalizedSquareDifference(offset, 10_000);
    expect(nsdf).toHaveLength(WINDOW);
    expect(nsdf[100]).toBeCloseTo(1, 3);
    expect(normalizedSquareDifference(new Float32Array(16), 4)).toEqual(new Float64Array(5));
  });
});

describe("detectPitch: pure tones", () => {
  for (const sampleRate of SAMPLE_RATES) {
    it(`is within 1 cent from 70 Hz to 1.4 kHz at ${sampleRate} Hz`, () => {
      expect(worstError(sampleRate, (f) => sine(f, sampleRate))).toBeLessThan(1);
    });
  }

  it("reports the nearest note, its pitch class, the cents and a clarity near 1", () => {
    const e = detectPitch(sine(445, 48000), 48000)!;
    expect(e.midi).toBe(69);
    expect(e.pitchClass).toBe(9);
    expect(e.cents).toBeCloseTo(centsBetween(445, 440), 1);
    expect(e.clarity).toBeGreaterThan(0.99);

    const low = detectPitch(sine(130, 48000), 48000)!; // C3 is 130.81 Hz
    expect(low.midi).toBe(48);
    expect(low.pitchClass).toBe(0);
    expect(low.cents).toBeLessThan(0);
  });

  it("measures cents against the configured reference", () => {
    const at442 = detectPitch(sine(442, 48000), 48000, { referenceA4: 442 })!;
    expect(at442.midi).toBe(69);
    expect(Math.abs(at442.cents)).toBeLessThan(0.05);
    const at440 = detectPitch(sine(440, 48000), 48000, { referenceA4: 442 })!;
    expect(at440.cents).toBeCloseTo(centsBetween(440, 442), 1);
  });
});

describe("detectPitch: plucked-string-like tones", () => {
  const pluck = (f: number, sampleRate: number, startSeconds: number, inharmonicity = 0) => {
    const tone = pluckedTone(f, {
      sampleRate,
      seconds: startSeconds + 0.06,
      inharmonicity,
      seed: Math.round(f),
    });
    const start = Math.round(startSeconds * sampleRate);
    return tone.subarray(start, start + WINDOW);
  };

  for (const sampleRate of SAMPLE_RATES) {
    it(`is within 1 cent on the attack at ${sampleRate} Hz`, () => {
      expect(worstError(sampleRate, (f) => pluck(f, sampleRate, 0))).toBeLessThan(1);
    });

    it(`is within 1 cent 600 ms into the decay at ${sampleRate} Hz`, () => {
      expect(worstError(sampleRate, (f) => pluck(f, sampleRate, 0.6))).toBeLessThan(1);
    });

    it(`is within 1 cent with a small inharmonicity (B = 1e-5) at ${sampleRate} Hz`, () => {
      // Stiff strings stretch the partials sharp; the detector follows the
      // period they agree on, which sits slightly above f0 (as the ear does).
      expect(worstError(sampleRate, (f) => pluck(f, sampleRate, 0, 1e-5))).toBeLessThan(1);
    });
  }

  it("keeps a high clarity on a decaying tone", () => {
    const e = detectPitch(pluck(110, 48000, 0.3), 48000)!;
    expect(e.clarity).toBeGreaterThan(0.95);
    expect(e.midi).toBe(45);
  });
});

describe("detectPitch: octave robustness", () => {
  for (const sampleRate of SAMPLE_RATES) {
    it(`finds the fundamental when only partials 2..6 are present at ${sampleRate} Hz`, () => {
      const e = detectPitch(partials(196, sampleRate, 2, 6), sampleRate)!;
      expect(Math.abs(centsBetween(e.frequency, 196))).toBeLessThan(1);
      expect(e.midi).toBe(55);
    });

    it(`finds the fundamental when it is 30 dB below the partials at ${sampleRate} Hz`, () => {
      const e = detectPitch(partials(196, sampleRate, 1, 6, 0.03), sampleRate)!;
      expect(Math.abs(centsBetween(e.frequency, 196))).toBeLessThan(1);
    });
  }

  it("does not halve a tone whose even partials dominate", () => {
    const e = detectPitch(partials(220, 48000, 1, 8), 48000)!;
    expect(e.midi).toBe(57);
  });
});

describe("detectPitch: nothing to report", () => {
  it("returns null on silence, on near-silence and on white noise", () => {
    expect(detectPitch(new Float32Array(WINDOW), 48000)).toBeNull();
    expect(detectPitch(sine(440, 48000, WINDOW, 0.0005), 48000)).toBeNull();
    expect(detectPitch(whiteNoise(WINDOW, 0.3), 48000)).toBeNull();
    expect(detectPitch(whiteNoise(WINDOW, 0.3, 5), 44100)).toBeNull();
  });

  it("returns null outside the frequency range and on tiny or invalid input", () => {
    // 40 Hz: the window holds fewer than two periods, no peak within W/2.
    expect(detectPitch(sine(40, 48000), 48000)).toBeNull();
    // 3 kHz with the default 2 kHz ceiling: the first peak is below the
    // minimum lag; it must not be reported as a subharmonic.
    expect(detectPitch(sine(3000, 48000), 48000)).toBeNull();
    expect(detectPitch(sine(3000, 48000), 48000, { maxFrequency: 4000 })?.midi).toBe(102); // F#7
    expect(detectPitch(new Float32Array(3).fill(0.5), 48000)).toBeNull();
    expect(detectPitch(sine(440, 48000), 0)).toBeNull();
    // A constant (after mean removal, nothing left to correlate).
    expect(detectPitch(new Float32Array(WINDOW).fill(0.5), 48000)).toBeNull();
  });

  it("does not report a tone just below minFrequency at the boundary lag", () => {
    // minFrequency 100 Hz → lags up to 480 samples. A lobe still rising at
    // the last lag is not a peak, so 99 Hz is null rather than "100 Hz".
    expect(detectPitch(sine(99, 48000), 48000, { minFrequency: 100 })).toBeNull();
    expect(detectPitch(sine(100, 48000), 48000, { minFrequency: 100 })).toBeNull();
    const e = detectPitch(sine(101, 48000), 48000, { minFrequency: 100 })!;
    expect(Math.abs(centsBetween(e.frequency, 101))).toBeLessThan(1);
  });

  it("falls back to the highest peak when the threshold is above 1", () => {
    const e = detectPitch(sine(440, 48000), 48000, { peakThreshold: 5 })!;
    expect(e.midi).toBe(69);
  });

  it("drops estimates whose clarity is below the threshold", () => {
    const noisy = sine(440, 48000).map((x, i) => x + whiteNoise(WINDOW, 0.6)[i]);
    const lax = detectPitch(noisy, 48000, { clarityThreshold: 0 });
    expect(lax).not.toBeNull();
    expect(detectPitch(noisy, 48000, { clarityThreshold: 0.999 })).toBeNull();
  });

  it("keeps its defaults for options passed as undefined", () => {
    const e = detectPitch(sine(440, 48000), 48000, {
      minFrequency: undefined,
      silenceRms: undefined,
    });
    expect(e?.midi).toBe(69);
    const tracker = new PitchTracker({
      sampleRate: 48000,
      hopSize: undefined,
      maxFrequency: undefined,
    });
    for (let i = 0; i < 4; i++) tracker.push(sine(440, 48000, 2048));
    expect(tracker.estimate?.midi).toBe(69);
  });

  it("exposes its defaults", () => {
    expect(PITCH_DEFAULTS.referenceA4).toBe(440);
    expect(PITCH_DEFAULTS.peakThreshold).toBeGreaterThan(0.5);
  });
});

describe("interpolatePeak", () => {
  it("finds the vertex of the parabola through three points", () => {
    // y = 1 − (x − 0.25)² sampled at 0, 1, 2 around the integer peak 0... use lag 1.
    const y = [0, 1, 2].map((x) => 1 - (x - 1.25) ** 2);
    const peak = interpolatePeak(y, 1);
    expect(peak.lag).toBeCloseTo(1.25, 9);
    expect(peak.value).toBeCloseTo(1, 9);
  });

  it("returns the integer peak at the edges and on a flat top", () => {
    expect(interpolatePeak([0.5, 0.9, 0.8], 0)).toEqual({ lag: 0, value: 0.5 });
    expect(interpolatePeak([0.5, 0.9, 0.8], 2)).toEqual({ lag: 2, value: 0.8 });
    expect(interpolatePeak([0.9, 0.9, 0.9], 1)).toEqual({ lag: 1, value: 0.9 });
  });
});

describe("frequencyToPitch", () => {
  it("wraps pitch classes and keeps cents in [−50, 50]", () => {
    expect(frequencyToPitch(440, 1)).toMatchObject({ midi: 69, pitchClass: 9, cents: 0 });
    expect(frequencyToPitch(261.63, 1).pitchClass).toBe(0);
    const sharp = frequencyToPitch(440 * Math.pow(2, 0.49 / 12), 1);
    expect(sharp.midi).toBe(69);
    expect(sharp.cents).toBeCloseTo(49, 3);
    const flat = frequencyToPitch(440 * Math.pow(2, 0.51 / 12), 1);
    expect(flat.midi).toBe(70);
    expect(flat.cents).toBeCloseTo(-49, 3);
  });
});

describe("PitchTracker", () => {
  const sampleRate = 48000;

  /** Pushes `seconds` of a tone in 512-sample batches (any size works). */
  function feed(tracker: PitchTracker, freq: number, seconds: number, amplitude = 0.3) {
    const samples = sine(freq, sampleRate, Math.round(seconds * sampleRate), amplitude);
    for (let i = 0; i < samples.length; i += 512) tracker.push(samples.subarray(i, i + 512));
  }

  it("stays null until a window is full, then reports the pitch within 1 cent", () => {
    const tracker = new PitchTracker({ sampleRate });
    tracker.push(sine(440, sampleRate, 1024));
    expect(tracker.estimate).toBeNull();
    feed(tracker, 440, 0.1);
    const e = tracker.estimate!;
    expect(e.midi).toBe(69);
    expect(Math.abs(e.cents)).toBeLessThan(1);
    expect(e.clarity).toBeGreaterThan(0.99);
  });

  it("returns to null on silence and starts over after reset()", () => {
    const tracker = new PitchTracker({ sampleRate });
    feed(tracker, 440, 0.1);
    expect(tracker.estimate).not.toBeNull();
    feed(tracker, 440, 0.1, 0); // silence
    expect(tracker.estimate).toBeNull();

    feed(tracker, 440, 0.1);
    expect(tracker.estimate).not.toBeNull();
    tracker.reset();
    expect(tracker.estimate).toBeNull();
    tracker.push(sine(440, sampleRate, 1024));
    expect(tracker.estimate).toBeNull(); // the window was emptied
  });

  it("ignores a single wrong frame (median)", () => {
    // One analysis per 2048-sample push: the raw history is exactly one
    // estimate per window.
    const tracker = new PitchTracker({ sampleRate, hopSize: 2048 });
    for (let i = 0; i < 4; i++) tracker.push(sine(440, sampleRate, 2048));
    tracker.push(sine(880, sampleRate, 2048)); // one window an octave up
    expect(tracker.estimate?.midi).toBe(69);
    tracker.push(sine(880, sampleRate, 2048)); // two of three: the median follows
    expect(tracker.estimate?.midi).toBe(81);
  });

  it("keeps the note name inside the hysteresis band and switches beyond it", () => {
    const tracker = new PitchTracker({ sampleRate, hysteresisCents: 10 });
    const hz = (cents: number) => 440 * Math.pow(2, cents / 1200);

    feed(tracker, hz(40), 0.1);
    expect(tracker.estimate).toMatchObject({ midi: 69 });
    feed(tracker, hz(57), 0.1); // A# −43 by rounding, but held as A +57
    expect(tracker.estimate?.midi).toBe(69);
    expect(tracker.estimate?.cents).toBeCloseTo(57, 0);
    feed(tracker, hz(65), 0.1); // beyond 50 + 10: A# −35
    expect(tracker.estimate?.midi).toBe(70);
    expect(tracker.estimate?.cents).toBeCloseTo(-35, 0);
    feed(tracker, hz(45), 0.1); // back below the boundary, still held as A# −55
    expect(tracker.estimate?.midi).toBe(70);
    feed(tracker, hz(-300), 0.1); // a different note: immediate switch
    expect(tracker.estimate?.midi).toBe(66);
  });

  it("applies a new reference A4 to the next estimate", () => {
    const tracker = new PitchTracker({ sampleRate });
    feed(tracker, 442, 0.1);
    expect(tracker.estimate?.cents).toBeCloseTo(centsBetween(442, 440), 0);
    tracker.setReferenceA4(442);
    feed(tracker, 442, 0.1);
    expect(Math.abs(tracker.estimate!.cents)).toBeLessThan(0.5);
  });

  it("accepts a custom window and an even median length", () => {
    const tracker = new PitchTracker({ sampleRate, windowSize: 4096, medianFrames: 2 });
    feed(tracker, 110, 0.2);
    expect(tracker.estimate?.midi).toBe(45);
  });
});
