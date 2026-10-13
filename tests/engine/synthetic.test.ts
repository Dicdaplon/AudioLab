/**
 * End-to-end TonalityEngine tests on generated audio (no fixtures).
 *
 * Signals are additive harmonic tones (4 partials, 1/n amplitudes) run
 * through the live-path rig: an AnalyserNode emulation (Blackman window,
 * 1/N scaling, dB output) polled at 10 fps, fed to `processDbSpectrum`.
 * Key detection on cadences lives in syntheticKeys.test.ts.
 */
import { describe, expect, it } from "vitest";

import { SILENCE_LEVEL_DB } from "../../src/analysis/engine/tonalityEngine";
import { NOTE_NAMES } from "../../src/utils/notes";
import { A_MINOR, SR, chordSignal, runLive as run, triad } from "../helpers/liveRig";
import { addNoise, scale, whiteNoise } from "../helpers/synth";

describe("synthetic chords", () => {
  it.each(
    NOTE_NAMES.flatMap((name, pc) => [
      { name, root: 48 + pc, minor: false },
      { name: `${name}m`, root: 48 + pc, minor: true },
    ]),
  )("$name triad is detected top-1 with probability > 0.8", ({ name, root, minor }) => {
    const frame = run(chordSignal(triad(root, minor)));
    expect(frame.chords[0].name).toBe(name);
    // Measured 0.87–0.89 across the 24 triads.
    expect(frame.chords[0].probability).toBeGreaterThan(0.8);
  });

  it("is octave invariant (A minor voiced from A2 to A5)", () => {
    for (const shift of [-12, 0, 12, 24]) {
      const frame = run(chordSignal(A_MINOR.map((m) => m + shift)));
      expect(frame.chords[0].name, `shift ${shift}`).toBe("Am");
    }
  });

  it.each([-30, -15, 15, 30])("A minor survives a %i cent tuning offset", (cents) => {
    // Rounding to the nearest semitone gives a hard limit of ±50 cents;
    // chords hold to about ±35 in practice.
    expect(run(chordSignal(A_MINOR, { cents })).chords[0].name).toBe("Am");
  });
});

describe("silence and noise", () => {
  it("digital silence: zero chroma, silence level, uniform finite rankings", () => {
    const frame = run(new Float32Array(SR * 2));
    expect(frame.signalLevelDb).toBe(SILENCE_LEVEL_DB);
    expect(Array.from(frame.chordChroma)).toEqual(new Array(12).fill(0));
    expect(Array.from(frame.presenceHistogram)).toEqual(new Array(12).fill(0));
    expect(frame.filterThreshold).toBe(0);
    for (const ranking of [frame.chords, frame.liveKeys, frame.presenceKeys]) {
      expect(ranking).toHaveLength(24);
      for (const s of ranking) expect(s.probability).toBeCloseTo(1 / 24, 10);
    }
  });

  it("white noise: near-flat chroma, no confident chord or key, presence passes all", () => {
    const frame = run(whiteNoise(SR * 4, 0.3, 7));
    const chroma = Array.from(frame.liveAcquisitionChroma);
    // Measured max/min ≈ 1.9 (low-frequency semitones span few bins).
    expect(Math.max(...chroma) / Math.min(...chroma)).toBeLessThan(2.5);
    expect(frame.chords[0].probability).toBeLessThan(0.15); // measured 0.07, triad ≥ 0.87
    expect(frame.liveKeys[0].probability).toBeLessThan(0.3); // measured 0.18
    // A flat chroma clears the high-water mark on every pitch class.
    expect(Array.from(frame.presenceHistogram)).toEqual(new Array(12).fill(1));
    expect(frame.signalLevelDb).toBeGreaterThan(SILENCE_LEVEL_DB);
  });

  it("an A minor triad survives white noise down to 0 dB SNR", () => {
    for (const snr of [20, 10, 0]) {
      const frame = run(addNoise(chordSignal(A_MINOR), snr, 3));
      expect(frame.chords[0].name, `SNR ${snr} dB`).toBe("Am");
    }
  });
});

describe("level", () => {
  it("chroma is level-invariant over 40 dB above the −90 dB gate", () => {
    const base = chordSignal(A_MINOR);
    const reference = run(base).chordChroma;
    for (const gain of [0.1, 0.01]) {
      const frame = run(scale(base, gain));
      expect(frame.chords[0].name).toBe("Am");
      for (let pc = 0; pc < 12; pc++) {
        expect(frame.chordChroma[pc], `gain ${gain}, pc ${pc}`).toBeCloseTo(reference[pc], 3);
      }
    }
  });

  it("the signal level follows the gain (20 dB per decade)", () => {
    const base = chordSignal(A_MINOR);
    const l1 = run(base).signalLevelDb;
    const l01 = run(scale(base, 0.1)).signalLevelDb;
    expect(l1 - l01).toBeCloseTo(20, 0);
  });

  it("a very quiet chord is still detected once the gate trims its partials", () => {
    // Peaks ≈ −80 dB: the upper partials fall under the −90 dB gate.
    expect(run(scale(chordSignal(A_MINOR), 0.001)).chords[0].name).toBe("Am");
  });

  it("a signal entirely under the −90 dB gate reads as silence", () => {
    const frame = run(scale(chordSignal(A_MINOR), 1e-4));
    expect(Array.from(frame.chordChroma)).toEqual(new Array(12).fill(0));
    expect(frame.signalLevelDb).toBe(SILENCE_LEVEL_DB);
  });
});
