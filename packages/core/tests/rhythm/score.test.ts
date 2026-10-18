// @vitest-environment node
import { describe, expect, it } from "vitest";

import { StreamHistory } from "../../src/analysis/onset/afterOnset";
import {
  PlayAlongSession,
  SCORE_PASS,
  TimingScorer,
  fitPattern,
  scoreSigmaFor,
  scoreTimings,
  scorerSigmaMs,
  sigmaForScore,
  timingScore,
} from "../../src/rhythm";

const TOL = { onTimeMs: 100, windowMs: 300 };

describe("timingScore", () => {
  it("is a Gaussian of the offset, 1 dead on", () => {
    expect(timingScore(0, 150)).toBe(1);
    expect(timingScore(150, 150)).toBeCloseTo(Math.exp(-0.5), 12);
    expect(timingScore(-150, 150)).toBeCloseTo(timingScore(150, 150), 12);
    expect(timingScore(450, 150)).toBeCloseTo(Math.exp(-4.5), 12);
    expect(timingScore(Number.NaN, 150)).toBe(0);
    expect(timingScore(10, 0)).toBe(0);
  });

  it("derives σ from the tolerance so that the on-time edge scores 0.8", () => {
    expect(SCORE_PASS).toBe(0.8);
    const sigma = scoreSigmaFor(TOL);
    expect(sigma).toBeCloseTo(149.7, 1);
    expect(timingScore(100, sigma)).toBeCloseTo(0.8, 12);
    expect(sigmaForScore(80, 0.8)).toBeCloseTo(119.75, 1);
    expect(timingScore(-80, sigmaForScore(80, 0.8))).toBeCloseTo(0.8, 12);
    expect(() => sigmaForScore(80, 1)).toThrow();
    expect(() => sigmaForScore(80, 0)).toThrow();
  });
});

describe("NoteResult.score", () => {
  const notes = [1, 1.5, 2].map((time, id) => ({ id, time }));

  it("is null until the note resolves, then the Gaussian of the corrected offset, 0 when missed", () => {
    const scorer = new TimingScorer(notes, { tolerance: TOL, offsetMs: 30 });
    expect(scorer.results.every((r) => r.score === null)).toBe(true);
    scorer.onset({ id: 0, time: 1.03 }); // on time once the 30 ms are removed: resolves at once
    scorer.onset({ id: 1, time: 1.68 }); // 150 ms late: waits for its window
    expect(scorer.results[0].score).toBe(1);
    expect(scorer.results[1].score).toBeNull();
    scorer.finish();
    const sigma = scorerSigmaMs(scorer.config);
    expect(scorer.results[1].score).toBeCloseTo(timingScore(150, sigma), 9);
    expect(scorer.results[1].score!).toBeLessThan(SCORE_PASS);
    expect(scorer.results[1].tier).toBe("late"); // tiers unchanged
    expect(scorer.results[2]).toMatchObject({ tier: "missed", score: 0 });
  });

  it("takes an explicit σ and reaches scoreTimings and PlayAlongSession", () => {
    const state = scoreTimings(notes, [{ id: 0, time: 1.08 }], {
      tolerance: TOL,
      scoreSigmaMs: 80,
    });
    expect(state.results[0].score).toBeCloseTo(Math.exp(-0.5), 9);
    expect(state.results[2].score).toBe(0);

    const session = new PlayAlongSession(notes, { sampleRate: 48000, tolerance: TOL });
    const h = new StreamHistory(48000 * 3);
    h.push(new Float32Array(48000 * 3), 0);
    session.onset({ id: 0, time: 1.05, frame: 50400 });
    session.update(h, 2.5);
    expect(session.results[0].score).toBeCloseTo(timingScore(50, scoreSigmaFor(TOL)), 9);
    expect(session.results[1].score).toBe(0);
  });
});

describe("fitPattern scores", () => {
  it("scores each note on its residual at the player's own tempo", () => {
    const beats = [0, 1, 2, 3, 4, 5];
    const onsets = beats.map((b, i) => 1 + b * 0.6 + (i === 3 ? 0.09 : 0));
    const fit = fitPattern(beats, onsets, { tolerance: TOL })!;
    const sigma = scoreSigmaFor(TOL);
    fit.notes.forEach((n) => expect(n.score).toBeCloseTo(timingScore(n.residualMs!, sigma), 9));
    expect(fit.notes[3].score).toBeLessThan(fit.notes[0].score);
    const missed = fitPattern(
      beats,
      onsets.filter((_, i) => i !== 4),
      { tolerance: TOL, scoreSigmaMs: 50 },
    )!;
    expect(missed.notes[4]).toMatchObject({ tier: "missed", score: 0 });
  });
});
