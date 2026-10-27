/**
 * The opt-in alternative methods: chord HMM, Gaussian/log chroma, key
 * profiles. The defaults must stay the original pipeline; the alternatives
 * must do what they claim on small synthetic cases.
 */
import { describe, expect, it } from "vitest";

import { CHORD_QUALITY_BIAS } from "../../src/analysis/chordDetection";
import { ChordHmm, selfTransitionFor } from "../../src/analysis/chordHmm";
import { GAUSSIAN_LOG_CHROMA, spectrumToChroma } from "../../src/analysis/chroma";
import { TonalityEngine } from "../../src/analysis/engine/tonalityEngine";
import { KEY_PROFILE_SETS, detectKey } from "../../src/analysis/keyDetection";
import {
  PROG_FFT,
  PROG_FPS,
  PROG_SR,
  runEngine,
  scoreProgression,
  syntheticProgression,
} from "../helpers/progressions";
import { analyserFrames, whiteNoise } from "../helpers/synth";

const onehot = (n: number, i: number, p = 0.9) =>
  Array.from({ length: n }, (_, k) => (k === i ? p : (1 - p) / (n - 1)));

describe("ChordHmm", () => {
  it("keeps a chord through one disagreeing frame and follows a lasting change", () => {
    const hmm = new ChordHmm({ states: 4, selfTransition: 0.95, lagFrames: 0 });
    const answers = [0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2].map((s) => {
      const post = hmm.push(onehot(4, s));
      return post.indexOf(Math.max(...post));
    });
    expect(answers.slice(0, 7)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(answers.at(-1)).toBe(2);
  });

  it("answers for the frame lagFrames ago", () => {
    const hmm = new ChordHmm({ states: 3, selfTransition: 0.5, lagFrames: 2, emissionExponent: 1 });
    hmm.push(onehot(3, 0, 0.98));
    hmm.push(onehot(3, 1, 0.98));
    const post = hmm.push(onehot(3, 2, 0.98));
    expect(post.indexOf(Math.max(...post))).toBe(0);
  });

  it("derives the self-transition from the mean chord duration", () => {
    expect(selfTransitionFor(2, 10)).toBeCloseTo(0.95);
  });
});

describe("TonalityEngine alternatives", () => {
  it("default frames carry no HMM field (the original output)", () => {
    const frame = new TonalityEngine().processChroma(onehot(12, 0));
    expect(frame).not.toHaveProperty("noChordProbability");
  });

  it("hmm smoothing reads silence as no chord", () => {
    const engine = new TonalityEngine({ chordSmoothing: "hmm" });
    let frame = engine.processChroma(new Float32Array(12));
    for (let i = 0; i < 5; i++) frame = engine.processChroma(new Float32Array(12));
    expect(frame.noChordProbability).toBeGreaterThan(0.9);
  });

  it("hmm smoothing reads white noise as no chord, and a strummed chord as a chord", () => {
    const noise = whiteNoise(PROG_SR * 2, 0.3, 3);
    const engine = new TonalityEngine({ chordSmoothing: "hmm", framesPerSecond: PROG_FPS });
    let frame = engine.snapshot();
    for (const db of analyserFrames(noise, PROG_FFT, PROG_SR / PROG_FPS)) {
      frame = engine.processDbSpectrum(db, PROG_SR);
    }
    expect(frame.noChordProbability).toBeGreaterThan(0.5);

    const am = runEngine(syntheticProgression({ seed: 4, count: 1 }).signal, {
      chordSmoothing: "hmm",
    });
    expect(am.at(-1)?.answer).not.toBeNull();
  });

  it("hmm smoothing flickers less than the 1 s window on synthetic progressions", () => {
    const progs = [1, 2].map((seed) => syntheticProgression({ seed, count: 8 }));
    const total = (cfg: object) =>
      progs
        .map((p) => scoreProgression(p, runEngine(p.signal, cfg)))
        .reduce(
          (s, x) => ({
            wrong: s.wrong + x.wrongInTransition + x.wrongSteady,
            correct: s.correct + x.correct,
          }),
          {
            wrong: 0,
            correct: 0,
          },
        );
    const window = total({});
    const hmm = total({ chordSmoothing: "hmm" });
    expect(hmm.wrong).toBeLessThan(window.wrong);
    expect(hmm.correct).toBeGreaterThan(window.correct);
  }, 30_000);

  it("leaves CHORD_QUALITY_BIAS untouched", () => {
    expect(CHORD_QUALITY_BIAS.dim).toBe(0.03);
  });
});

describe("Gaussian / log chroma", () => {
  /** A one-sided magnitude spectrum with one peak at `hz`. */
  function peak(hz: number, sampleRate = 48_000, n = 8192): Float32Array {
    const s = new Float32Array(n);
    s[Math.round((hz * 2 * n) / sampleRate)] = 1;
    return s;
  }

  it("puts a tuned note on its pitch class", () => {
    const c = spectrumToChroma(peak(440), { sampleRate: 48_000, ...GAUSSIAN_LOG_CHROMA });
    expect(c.indexOf(Math.max(...c))).toBe(9);
  });

  it("splits a quarter-tone between the two neighbours", () => {
    const c = spectrumToChroma(peak(440 * 2 ** (0.5 / 12)), {
      sampleRate: 48_000,
      ...GAUSSIAN_LOG_CHROMA,
    });
    expect(c[9]).toBeGreaterThan(0.3);
    expect(c[10]).toBeGreaterThan(0.3);
  });

  it("follows a tuning offset", () => {
    const c = spectrumToChroma(peak(440 * 2 ** (-0.45 / 12)), {
      sampleRate: 48_000,
      ...GAUSSIAN_LOG_CHROMA,
      tuningCents: -45,
    });
    expect(c.indexOf(Math.max(...c))).toBe(9);
    expect(c[9]).toBeGreaterThan(0.9);
  });
});

describe("key profiles", () => {
  const cMajorScale = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];

  it("keeps the number signature and the Krumhansl default", () => {
    expect(detectKey(cMajorScale, 0.1)).toEqual(detectKey(cMajorScale));
    expect(detectKey(cMajorScale, { profile: "krumhansl" })).toEqual(detectKey(cMajorScale));
  });

  it.each(Object.keys(KEY_PROFILE_SETS) as (keyof typeof KEY_PROFILE_SETS)[])(
    "%s ranks C major or A minor first on the C major scale",
    (profile) => {
      expect(["C", "Am"]).toContain(detectKey(cMajorScale, { profile })[0].shortName);
    },
  );
});
