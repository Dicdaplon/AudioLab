/**
 * The opt-in listening methods of the tonality engine: constant-Q chroma fed
 * from time samples, and the key voted by the chords found. The defaults
 * must ignore both; the methods must do what they claim on small cases.
 */
import { describe, expect, it } from "vitest";

import { ChordHmm } from "../../src/analysis/chordHmm";
import { spectrumToChroma } from "../../src/analysis/chroma";
import { CqtChroma } from "../../src/analysis/cqt";
import { TonalityEngine } from "../../src/analysis/engine/tonalityEngine";
import { FluxNovelty, normalisedAcf } from "../../src/analysis/engine/tempoFlux";
import { applyHannWindow, fftMagnitude } from "../../src/analysis/fft";
import {
  analyzeOverall,
  computeChromaSequence,
  runPresenceTonality,
} from "../../src/offline/offlinePipeline";
import { notes } from "../helpers/synth";

const SR = 22_050;
const C_MAJOR = notes([48, 52, 55], { sampleRate: SR, seconds: 1 });

const top3 = (chroma: ArrayLike<number>) =>
  Array.from(chroma, (v, i) => [v, i] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 3)
    .map(([, i]) => i)
    .sort((a, b) => a - b);

/** A triad chroma: root, third (4 = major, 3 = minor) and fifth. */
function triad(root: number, third = 4): Float32Array {
  const c = new Float32Array(12).fill(0.02);
  for (const pc of [root, root + third, root + 7]) c[pc % 12] = 1;
  return c;
}

describe("CqtChroma", () => {
  it("rejects a missing sample rate or buffer", () => {
    expect(() => new CqtChroma({ sampleRate: 0, maxLength: 1024 })).toThrow(/must be > 0/);
    expect(() => new CqtChroma({ sampleRate: SR, maxLength: 0 })).toThrow(/must be > 0/);
  });

  it("finds the three notes of a C major chord", () => {
    const cqt = new CqtChroma({ sampleRate: SR, maxLength: 16384 });
    const { chroma, levelDb } = cqt.analyse(C_MAJOR);
    expect(top3(chroma)).toEqual([0, 4, 7]);
    expect(chroma.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(levelDb).toBeGreaterThan(-100);
    expect(cqt.cost).toBeGreaterThan(0);
  });

  it("returns a zero chroma on silence and skips windows longer than the samples", () => {
    const cqt = new CqtChroma({ sampleRate: SR, maxLength: 16384 });
    const silent = cqt.analyse(new Float32Array(16384));
    expect(silent.chroma.every((v) => v === 0)).toBe(true);
    expect(silent.levelDb).toBe(-200);
    // 512 samples: shorter than every window (the shortest, D7, is ~640), nothing read.
    expect(cqt.analyse(C_MAJOR.subarray(0, 512)).chroma.every((v) => v === 0)).toBe(true);
    // 4096 samples: the high notes' windows fit, the low ones are skipped.
    const part = cqt.analyse(C_MAJOR.subarray(-4096)).chroma;
    expect(part.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("stops below the Nyquist frequency", () => {
    const low = new CqtChroma({ sampleRate: 4000, maxLength: 4096 });
    const full = new CqtChroma({ sampleRate: SR, maxLength: 4096 });
    expect(low.cost).toBeLessThan(full.cost);
  });
});

describe("TonalityEngine, cqt chroma", () => {
  it("names the chord from time samples, with the level passed through", () => {
    const engine = new TonalityEngine({ chromaMethod: "cqt" });
    const frame = engine.processTimeDomain(C_MAJOR.subarray(-16384), SR, -20);
    expect(frame.chords[0].name).toBe("C");
    expect(frame.signalLevelDb).toBe(-20);
    // A new buffer length rebuilds the kernels.
    expect(engine.processTimeDomain(C_MAJOR.subarray(-8192), SR).chords[0].name).toBe("C");
  });

  it("is ignored by the other chroma methods", () => {
    const engine = new TonalityEngine();
    expect(engine.processTimeDomain(C_MAJOR.subarray(-16384), SR).chords).toEqual([]);
  });

  it("reads spectra with the gaussian-log chroma", () => {
    const frame = C_MAJOR.slice(-8192);
    applyHannWindow(frame);
    const engine = new TonalityEngine({ chromaMethod: "cqt" });
    expect(engine.processSpectrum(fftMagnitude(frame), SR).chords[0].name).toBe("C");
  });
});

describe("TonalityEngine, key from the chords", () => {
  /** I–IV–V–I in C, one chord a second, at 10 frames a second, with silences. */
  const progression = () => {
    const frames: Float32Array[] = [];
    for (let round = 0; round < 3; round++) {
      for (const root of [0, 5, 7, 0]) for (let i = 0; i < 10; i++) frames.push(triad(root));
      for (let i = 0; i < 3; i++) frames.push(new Float32Array(12));
    }
    return frames;
  };

  it("ranks C major first from a I–IV–V–I", () => {
    const engine = new TonalityEngine({
      keyMethod: "chords",
      liveAcquisitionSeconds: 2,
      tonalityAcquisitionSeconds: 30,
    });
    let frame = engine.snapshot();
    for (const c of progression()) frame = engine.processChroma(c);
    expect(frame.tonalityKeys[0].name).toBe("C major");
    expect(frame.liveKeys).toHaveLength(24);
    const total = frame.tonalityKeys.reduce((s, k) => s + k.probability, 0);
    expect(total).toBeCloseTo(1);
  });

  it("follows the HMM's chords and lets silence vote for nothing", () => {
    const engine = new TonalityEngine({ keyMethod: "chords", chordSmoothing: "hmm" });
    let frame = engine.snapshot();
    for (const c of progression()) frame = engine.processChroma(c);
    expect(frame.tonalityKeys[0].name).toBe("C major");
  });

  it("gives chords that are neither major nor minor no vote", () => {
    const sus = new Float32Array(12).fill(0.02);
    for (const pc of [0, 5, 7]) sus[pc] = 1;
    const engine = new TonalityEngine({ keyMethod: "chords", chordQualities: ["sus4"] });
    let frame = engine.snapshot();
    for (let i = 0; i < 20; i++) frame = engine.processChroma(sus);
    // No chord voted: only the profile half of the score is left.
    const profileOnly = new TonalityEngine();
    for (let i = 0; i < 20; i++) profileOnly.processChroma(sus);
    expect(frame.tonalityKeys[0].tonic).toBe(profileOnly.snapshot().tonalityKeys[0].tonic);
  });

  it("keeps the vote when the windows are resized", () => {
    const engine = new TonalityEngine({ keyMethod: "chords" });
    for (const c of progression()) engine.processChroma(c);
    engine.configure({ liveAcquisitionSeconds: 1, tonalityAcquisitionSeconds: 2 });
    expect(engine.snapshot().tonalityKeys[0].name).toBe("C major");
  });
});

describe("ChordHmm guards", () => {
  it("needs two states and a self-transition inside (0, 1)", () => {
    expect(() => new ChordHmm({ states: 1, selfTransition: 0.5, lagFrames: 0 })).toThrow(
      /at least 2 states/,
    );
    expect(() => new ChordHmm({ states: 3, selfTransition: 1, lagFrames: 0 })).toThrow(
      /selfTransition/,
    );
  });

  it("reports its size and refuses a frame of the wrong size", () => {
    const hmm = new ChordHmm({ states: 3, selfTransition: 0.9, lagFrames: 0 });
    expect(hmm.states).toBe(3);
    expect(() => hmm.push([0.5, 0.5])).toThrow(/expected 3 probabilities/);
  });
});

describe("spectrumToChroma options", () => {
  const frame = C_MAJOR.slice(-8192);
  applyHannWindow(frame);
  const mag = fftMagnitude(frame);

  it("log-compresses without Gaussian binning", () => {
    const chroma = spectrumToChroma(mag, { sampleRate: SR, compression: "log" });
    expect(top3(chroma)).toEqual([0, 4, 7]);
  });

  it("shifts by the tuning and reads magnitudes instead of energies", () => {
    const tuned = spectrumToChroma(mag, { sampleRate: SR, tuningCents: 10, useEnergy: false });
    expect(top3(tuned)).toEqual([0, 4, 7]);
    const wide = spectrumToChroma(mag, {
      sampleRate: SR,
      binning: "gaussian",
      gaussianWidth: 0.5,
      compression: "log",
      logGain: 10,
    });
    expect(top3(wide)).toEqual([0, 4, 7]);
  });

  it("skips bins that are not finite or not positive", () => {
    const noisy = Float32Array.from(mag);
    noisy[100] = Number.NaN;
    noisy[101] = -1;
    const chroma = spectrumToChroma(noisy, { sampleRate: SR, compression: "log" });
    expect(chroma.every(Number.isFinite)).toBe(true);
  });
});

describe("offline options", () => {
  const audio = { samples: C_MAJOR, sampleRate: SR, durationSeconds: 1 };
  const chromas = computeChromaSequence(audio, {
    fftSize: 2048,
    hopSize: 1024,
    chroma: { binning: "gaussian", compression: "log" },
  });

  it("computes the chroma sequence with extra chroma options", () => {
    expect(top3(chromas[chromas.length - 1])).toEqual([0, 4, 7]);
  });

  it("passes the key profile through", () => {
    expect(analyzeOverall(chromas, 0, "temperley").keys).toHaveLength(24);
    const result = runPresenceTonality(chromas, {
      liveAcquisitionSeconds: 1,
      tonalityAcquisitionSeconds: 1,
      framesPerSecond: SR / 1024,
      keyProfile: "temperley",
    });
    expect(result.keys).toHaveLength(24);
  });
});

describe("small edges of the new paths", () => {
  it("uses the HMM settings and the quality bias it is given", () => {
    const engine = new TonalityEngine({
      chordSmoothing: "hmm",
      chordHmm: { noChordFlatness: 0.99 },
      chordQualityBias: { maj: 0, min: 0.05 },
    });
    let frame = engine.snapshot();
    for (let i = 0; i < 10; i++) frame = engine.processChroma(triad(0));
    expect(frame.chords[0].name).toBe("C");
  });

  it("reads silence as the silence level when the spectrum is empty or not finite", () => {
    const engine = new TonalityEngine();
    const silence = engine.signalLevelDb([], SR);
    expect(engine.signalLevelDb([0, Number.NaN, Number.NaN], SR)).toBe(silence);
  });

  it("uses a 1024-point FFT for the flux novelty below 32 kHz", () => {
    expect(new FluxNovelty(22_050).fftSize).toBe(1024);
    expect(new FluxNovelty(48_000).fftSize).toBe(2048);
  });

  it("returns an autocorrelation of zeros for an empty window", () => {
    const r = normalisedAcf(new Float32Array(0), 0);
    expect(r === null || r.every((v) => v === 0)).toBe(true);
  });
});
