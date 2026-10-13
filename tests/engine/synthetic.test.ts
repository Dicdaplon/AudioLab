/**
 * End-to-end TonalityEngine tests on generated audio (no fixtures).
 *
 * Signals are additive harmonic tones (4 partials, 1/n amplitudes) framed
 * like the live hook does it: an AnalyserNode emulation (Blackman window,
 * 1/N scaling, dB output) polled at 10 fps, fed through
 * `processDbSpectrum`, i.e. including the dB → magnitude gate. At 12 kHz
 * with a 4096-point FFT the bin spacing (2.93 Hz) equals the live
 * 16384-point FFT at 48 kHz.
 */
import { describe, expect, it } from "vitest";

import {
  SILENCE_LEVEL_DB,
  TonalityEngine,
  type TonalityEngineConfig,
  type TonalityFrame,
} from "../../src/analysis/engine/tonalityEngine";
import { NOTE_NAMES } from "../../src/utils/notes";
import { addNoise, analyserFrames, concat, notes, scale, whiteNoise } from "../helpers/synth";

const SR = 12_000;
const FFT_SIZE = 4096;
const FPS = 10;
const HOP = SR / FPS;

function run(signal: Float32Array, cfg: Partial<TonalityEngineConfig> = {}): TonalityFrame {
  const engine = new TonalityEngine({ framesPerSecond: FPS, ...cfg });
  let frame = engine.snapshot();
  for (const db of analyserFrames(signal, FFT_SIZE, HOP)) frame = engine.processDbSpectrum(db, SR);
  return frame;
}

/** 1.4 s: one analyser window (0.34 s) plus a full 1 s chord window. */
const CHORD_SECONDS = 1.4;

function triad(root: number, minor: boolean): number[] {
  return [root, root + (minor ? 3 : 4), root + 7];
}

function chordSignal(midiNotes: number[], opts: { cents?: number } = {}): Float32Array {
  return notes(midiNotes, { sampleRate: SR, seconds: CHORD_SECONDS, ...opts });
}

/** I–IV–V–I (major) or i–iv–V–i (harmonic minor), one second per chord. */
function cadence(tonic: number, minor: boolean, cents = 0): Float32Array {
  const I = triad(tonic, minor);
  const IV = triad(tonic + 5, minor);
  const V = triad(tonic + 7, false); // raised leading tone in minor
  return concat([I, IV, V, I].map((c) => notes(c, { sampleRate: SR, seconds: 1, cents })));
}

const A_MINOR = [57, 60, 64]; // A3 C4 E4

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
});

describe("synthetic keys (cadences)", () => {
  it.each(NOTE_NAMES.map((name, pc) => ({ name, tonic: 48 + pc })))(
    "I–IV–V–I in $name major: every key path ranks $name first",
    ({ name, tonic }) => {
      const frame = run(cadence(tonic, false));
      expect(frame.liveKeys[0].shortName).toBe(name);
      expect(frame.tonalityKeys[0].shortName).toBe(name);
      expect(frame.presenceKeys[0].shortName).toBe(name);
    },
  );

  it.each(NOTE_NAMES.map((name, pc) => ({ name: `${name}m`, tonic: 48 + pc })))(
    "i–iv–V–i in $name: every key path ranks $name first",
    ({ name, tonic }) => {
      const frame = run(cadence(tonic, true));
      expect(frame.liveKeys[0].shortName).toBe(name);
      expect(frame.tonalityKeys[0].shortName).toBe(name);
      expect(frame.presenceKeys[0].shortName).toBe(name);
    },
  );
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

describe("level and tuning", () => {
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

  it.each([-30, -15, 15, 30])("tolerates a %i cent tuning offset", (cents) => {
    // Pitch classes are assigned by rounding to the nearest semitone, so the
    // hard limit is ±50 cents; chords hold to about ±35 in practice.
    expect(run(chordSignal(A_MINOR, { cents })).chords[0].name).toBe("Am");
    const frame = run(cadence(50, false, cents)); // D major
    expect(frame.tonalityKeys[0].shortName).toBe("D");
    expect(frame.presenceKeys[0].shortName).toBe("D");
  });
});
