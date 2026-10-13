// @vitest-environment node
import { describe, it, expect } from "vitest";

import { TEMPO_ANALYZER_DEFAULTS, TempoAnalyzer } from "../../src/analysis/engine/tempoAnalyzer";

/**
 * Synthetic "drum" track: short decaying 200 Hz bursts every beat, with a
 * seeded low-level noise floor, at `sampleRate` for `seconds`.
 */
function clickTrack(
  bpm: number,
  seconds: number,
  { sampleRate = 48000, amplitude = 0.5, noise = 0.002, seed = 1 } = {},
): Float32Array {
  const n = Math.round(seconds * sampleRate);
  const out = new Float32Array(n);
  const period = (60 / bpm) * sampleRate;
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff - 0.5;
  };
  for (let i = 0; i < n; i++) {
    const sinceBeat = i % period;
    const env = sinceBeat < 0.05 * sampleRate ? Math.exp(-sinceBeat / (0.012 * sampleRate)) : 0;
    out[i] = amplitude * env * Math.sin((2 * Math.PI * 200 * i) / sampleRate) + noise * rand();
  }
  return out;
}

/** Push a signal in chunks of varying length (as a worklet would deliver it). */
function pushChunked(
  analyzer: TempoAnalyzer,
  signal: Float32Array,
  sizes = [128, 1000, 333, 2048],
) {
  let i = 0;
  let s = 0;
  while (i < signal.length) {
    const len = Math.min(sizes[s++ % sizes.length], signal.length - i);
    analyzer.pushSamples(signal.subarray(i, i + len));
    i += len;
  }
}

describe("TempoAnalyzer", () => {
  it("derives its rates from the configuration", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000 });
    expect(a.blockRate).toBe(375);
    expect(a.envelopeRate).toBe(93.75);
    expect(a.windowLength).toBe(750); // 8 s × 93.75 Hz
    expect(a.config.lowpassCutoffHz).toBe(TEMPO_ANALYZER_DEFAULTS.lowpassCutoffHz);
    const b = new TempoAnalyzer({ sampleRate: 44100 });
    expect(b.envelopeRate).toBeCloseTo(86.13, 2);
  });

  it("rejects invalid configuration", () => {
    expect(() => new TempoAnalyzer({ sampleRate: 0 })).toThrow();
    expect(() => new TempoAnalyzer({ sampleRate: 48000, windowSeconds: 0 })).toThrow();
    expect(() => new TempoAnalyzer({ sampleRate: 48000, minBpm: 100, maxBpm: 50 })).toThrow();
    expect(() => new TempoAnalyzer({ sampleRate: 48000, blockSize: 0 })).toThrow();
  });

  it("reports no estimate for silence and a flat envelope", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000 });
    const frame = a.analyze();
    expect(frame.estimate).toBeNull();
    expect(frame.onsetEnvelope).toHaveLength(750);
    expect(frame.filledSeconds).toBe(0);
    a.pushSamples(new Float32Array(48000 * 2));
    expect(a.analyze().estimate).toBeNull();
    expect(a.analyze().filledSeconds).toBeCloseTo(2, 3);
  });

  // 60 BPM is covered by the octave-ambiguity test below: a pulse train has
  // equal-strength envelope harmonics at 60, 120 and 180 BPM, and the
  // log-Gaussian prior centred on 120 picks the double tempo.
  it.each([90, 120, 150, 180])("estimates a %s BPM click track within 3 BPM", (bpm) => {
    const a = new TempoAnalyzer({ sampleRate: 48000 });
    pushChunked(a, clickTrack(bpm, 10));
    const frame = a.analyze();
    expect(frame.estimate).not.toBeNull();
    expect(Math.abs(frame.estimate!.bpm - bpm)).toBeLessThan(3);
    expect(frame.estimate!.confidence).toBeGreaterThan(0.5);
    expect(frame.filledSeconds).toBe(8);
  });

  it("estimates at 44.1 kHz too", () => {
    const a = new TempoAnalyzer({ sampleRate: 44100 });
    pushChunked(a, clickTrack(100, 10, { sampleRate: 44100 }));
    expect(Math.abs(a.analyze().estimate!.bpm - 100)).toBeLessThan(3);
  });

  it("is gapless: chunking never changes the envelope", () => {
    const signal = clickTrack(120, 9);
    const whole = new TempoAnalyzer({ sampleRate: 48000 });
    whole.pushSamples(signal);
    const chunked = new TempoAnalyzer({ sampleRate: 48000 });
    pushChunked(chunked, signal, [1, 127, 129, 5000, 7]);
    expect(Array.from(chunked.analyze().onsetEnvelope)).toEqual(
      Array.from(whole.analyze().onsetEnvelope),
    );
  });

  it("is insensitive to the input gain (log compression above the knee)", () => {
    const loud = new TempoAnalyzer({ sampleRate: 48000 });
    const quiet = new TempoAnalyzer({ sampleRate: 48000 });
    loud.pushSamples(clickTrack(110, 10, { amplitude: 0.9 }));
    quiet.pushSamples(clickTrack(110, 10, { amplitude: 0.09 }));
    const bpmLoud = loud.analyze().estimate!.bpm;
    const bpmQuiet = quiet.analyze().estimate!.bpm;
    expect(Math.abs(bpmLoud - 110)).toBeLessThan(3);
    expect(Math.abs(bpmQuiet - bpmLoud)).toBeLessThan(1);
  });

  it("exposes a BPM axis covering the configured range with the prior", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000, minBpm: 40, maxBpm: 240 });
    const frame = a.analyze();
    expect(frame.bpmAxis[0]).toBeGreaterThanOrEqual(40);
    expect(frame.bpmAxis[frame.bpmAxis.length - 1]).toBeLessThanOrEqual(240);
    expect(frame.spectrum).toHaveLength(frame.bpmAxis.length);
    // Bin spacing: envelopeRate / fftSize = 93.75 / 4096 Hz → 1.37 BPM.
    expect(frame.bpmAxis[1] - frame.bpmAxis[0]).toBeCloseTo((60 * 93.75) / 4096, 6);
    // Prior peaks at 120 BPM and is symmetric in octaves.
    expect(a.priorWeight(120)).toBe(1);
    expect(a.priorWeight(60)).toBeCloseTo(a.priorWeight(240), 12);
    expect(a.priorWeight(60)).toBeLessThan(1);
    expect(Math.max(...Array.from(frame.priorWeight))).toBeLessThanOrEqual(1);
  });

  it("prefers the musically likely octave for an ambiguous click train", () => {
    // Beats at 240 BPM also have energy at 120 and 60 BPM in the envelope
    // spectrum (sub-harmonics are absent for a pure pulse train, but the
    // prior must still pick 240 over nothing); for 60 BPM the second
    // harmonic (120) competes and the prior must not override a clear
    // fundamental by more than the Ellis weighting allows.
    const a = new TempoAnalyzer({ sampleRate: 48000 });
    pushChunked(a, clickTrack(60, 10));
    const bpm = a.analyze().estimate!.bpm;
    expect([60, 120].some((t) => Math.abs(bpm - t) < 3)).toBe(true);
  });

  it("setLowpassCutoff attenuates fast beat rates and keeps streaming", () => {
    const wide = new TempoAnalyzer({ sampleRate: 48000, lowpassCutoffHz: 10 });
    const narrow = new TempoAnalyzer({ sampleRate: 48000, lowpassCutoffHz: 10 });
    narrow.setLowpassCutoff(1);
    expect(narrow.config.lowpassCutoffHz).toBe(1);
    const signal = clickTrack(180, 10); // 3 Hz
    wide.pushSamples(signal);
    narrow.pushSamples(signal);
    const peakAt = (f: ReturnType<TempoAnalyzer["analyze"]>, bpm: number) => {
      let best = 0;
      for (let i = 0; i < f.bpmAxis.length; i++) {
        if (Math.abs(f.bpmAxis[i] - bpm) < 2) best = Math.max(best, f.spectrum[i]);
      }
      return best;
    };
    // 4th-order Butterworth at fc = 1 Hz: 3 Hz is attenuated by ~38 dB.
    const ratio = peakAt(narrow.analyze(), 180) / peakAt(wide.analyze(), 180);
    expect(ratio).toBeLessThan(0.05);
  });

  it("reset() clears the window and the block accumulator", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000 });
    a.pushSamples(clickTrack(120, 5));
    a.pushSamples(new Float32Array(50)); // partial block pending
    a.reset();
    const frame = a.analyze();
    expect(frame.estimate).toBeNull();
    expect(frame.filledSeconds).toBe(0);
    expect(Array.from(frame.onsetEnvelope).every((v) => v === 0)).toBe(true);
  });
});
