// @vitest-environment node
import { describe, it, expect } from "vitest";

import {
  TEMPO_ANALYZER_DEFAULTS,
  TempoAnalyzer,
  type TempoAnalyzerMethod,
} from "../../src/analysis/engine/tempoAnalyzer";
import { pluck, pushChunks } from "../helpers/onsets";
import { mulberry32 } from "../helpers/synth";

const SHAPES = [
  [40, 47, 52, 55, 59, 64], // E
  [45, 52, 57, 60, 64], // Am
  [43, 47, 50, 55, 59, 67], // G
  [50, 57, 62, 66], // D
];

/** One unit pluck per (note, rate), synthesised once: the tests mix scaled copies. */
const plucks = new Map<string, Float32Array>();
function unitPluck(midi: number, sampleRate: number): Float32Array {
  const key = `${midi}@${sampleRate}`;
  let p = plucks.get(key);
  if (!p) {
    p = pluck(midi, 1, { sampleRate, decaySeconds: 2.5, seconds: 1.5, seed: midi });
    plucks.set(key, p);
  }
  return p;
}

/**
 * Strummed comping at `bpm`: a down-strum on every beat and a softer
 * up-strum on the off-beat, one chord per bar, long sustain (the strings
 * ring through, so the loudness barely moves between strums).
 */
function comping(bpm: number, seconds: number, seed = 5, sampleRate = 48000): Float32Array {
  const rand = mulberry32(seed);
  const beat = 60 / bpm;
  const out = new Float32Array(Math.round(seconds * sampleRate));
  const strum = (time: number, midi: readonly number[], amplitude: number, strumMs: number) => {
    midi.forEach((m, s) => {
      const tone = unitPluck(m, sampleRate);
      const at = Math.round((time + (s * strumMs) / 1000) * sampleRate);
      const g = amplitude / Math.sqrt(midi.length);
      for (let i = 0; i < tone.length && at + i < out.length; i++) out[at + i] += g * tone[i];
    });
  };
  for (let b = 0; 0.2 + b * beat < seconds; b++) {
    const shape = SHAPES[Math.floor(b / 4) % SHAPES.length];
    const t = 0.2 + b * beat;
    strum(t, shape, 0.25 + 0.1 * rand(), 8 + 8 * rand());
    strum(t + beat / 2, [...shape].reverse().slice(0, 3), 0.12 + 0.06 * rand(), 6 + 6 * rand());
  }
  return out;
}

const COMPING_TEMPI = [80, 100, 120, 150];
const compingAt = new Map<number, Float32Array>();
const compingFor = (bpm: number) => {
  let x = compingAt.get(bpm);
  if (!x) compingAt.set(bpm, (x = comping(bpm, 20, bpm)));
  return x;
};

/** Short decaying 200 Hz bursts every beat over a faint noise floor. */
function clickTrack(bpm: number, seconds: number, sampleRate = 48000): Float32Array {
  const out = new Float32Array(Math.round(seconds * sampleRate));
  const period = (60 / bpm) * sampleRate;
  const rand = mulberry32(1);
  for (let i = 0; i < out.length; i++) {
    const since = i % period;
    const env = since < 0.05 * sampleRate ? Math.exp(-since / (0.012 * sampleRate)) : 0;
    out[i] = 0.5 * env * Math.sin((2 * Math.PI * 200 * i) / sampleRate) + 0.002 * (rand() - 0.5);
  }
  return out;
}

/** Readings once a second from 8 s on, as a live display would take them. */
function readings(method: TempoAnalyzerMethod, signal: Float32Array, sampleRate = 48000) {
  const a = new TempoAnalyzer({ sampleRate, method });
  const reads: number[] = [];
  let next = 8;
  pushChunks(signal, (chunk, start) => {
    a.pushSamples(chunk);
    if ((start + chunk.length) / sampleRate >= next) {
      reads.push(a.analyze().estimate?.bpm ?? NaN);
      next++;
    }
  });
  return reads;
}

const within = (bpm: number, ref: number, tol = 0.04) => Math.abs(bpm / ref - 1) <= tol;
const share = (reads: number[], ref: number) =>
  reads.filter((b) => within(b, ref)).length / reads.length;

describe("TempoAnalyzer, method flux", () => {
  it("keeps the envelope method as the default", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000 });
    expect(a.config.method).toBe("envelope");
    expect(TEMPO_ANALYZER_DEFAULTS.method).toBe("envelope");
    expect(a.config.priorSigmaOctaves).toBe(1.4);
  });

  it("uses a 100 Hz novelty, an 8 s window and the narrow prior", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000, method: "flux" });
    expect(a.envelopeRate).toBe(100);
    expect(a.windowLength).toBe(800);
    expect(a.config.priorSigmaOctaves).toBe(0.7);
    const b = new TempoAnalyzer({ sampleRate: 44100, method: "flux", priorSigmaOctaves: 1 });
    expect(b.envelopeRate).toBe(100);
    expect(b.config.priorSigmaOctaves).toBe(1);
    expect(
      () => new TempoAnalyzer({ sampleRate: 48000, method: "x" as TempoAnalyzerMethod }),
    ).toThrow();
  });

  it("returns the same frame shape, with no estimate on silence", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000, method: "flux" });
    let f = a.analyze();
    expect(f.estimate).toBeNull();
    expect(f.onsetEnvelope).toHaveLength(800);
    expect(f.filledSeconds).toBe(0);
    expect(f.spectrum).toHaveLength(f.bpmAxis.length);
    expect(f.priorWeight).toHaveLength(f.bpmAxis.length);
    expect(f.bpmAxis[0]).toBeGreaterThanOrEqual(40);
    expect(f.bpmAxis[f.bpmAxis.length - 1]).toBeLessThanOrEqual(240);
    for (let i = 1; i < f.bpmAxis.length; i++) {
      expect(f.bpmAxis[i]).toBeGreaterThan(f.bpmAxis[i - 1]);
    }
    a.pushSamples(new Float32Array(48000 * 3));
    f = a.analyze();
    expect(f.estimate).toBeNull();
    expect(f.filledSeconds).toBeCloseTo(3, 6);
  });

  it.each(COMPING_TEMPI)("reads strummed comping at %s BPM within 4 %%", (bpm) => {
    const flux = readings("flux", compingFor(bpm));
    expect(share(flux, bpm)).toBeGreaterThanOrEqual(0.9);
  });

  it("does better than the envelope method on the same comping", () => {
    const flux = COMPING_TEMPI.map((bpm) => share(readings("flux", compingFor(bpm)), bpm));
    const envelope = COMPING_TEMPI.map((bpm) => share(readings("envelope", compingFor(bpm)), bpm));
    const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
    expect(mean(envelope)).toBeLessThan(0.25);
    expect(mean(flux) - mean(envelope)).toBeGreaterThan(0.6);
  });

  it.each([90, 120, 150])("still reads a %s BPM click track", (bpm) => {
    const a = new TempoAnalyzer({ sampleRate: 48000, method: "flux" });
    a.pushSamples(clickTrack(bpm, 10));
    const e = a.analyze().estimate!;
    expect(within(e.bpm, bpm, 0.02)).toBe(true);
    expect(e.confidence).toBeGreaterThan(0.5);
    expect(e.confidence).toBeLessThanOrEqual(1);
  });

  it("reads at 44.1 kHz too", () => {
    const a = new TempoAnalyzer({ sampleRate: 44100, method: "flux" });
    a.pushSamples(comping(110, 12, 3, 44100));
    expect(within(a.analyze().estimate!.bpm, 110)).toBe(true);
  });

  it("is gapless and independent of the call rate", () => {
    const signal = comping(100, 12);
    const whole = new TempoAnalyzer({ sampleRate: 48000, method: "flux" });
    whole.pushSamples(signal);
    const chunked = new TempoAnalyzer({ sampleRate: 48000, method: "flux" });
    pushChunks(signal, (c) => chunked.pushSamples(c), [1, 127, 129, 5000, 7]);
    const fw = whole.analyze();
    const fc = chunked.analyze();
    expect(Array.from(fc.onsetEnvelope)).toEqual(Array.from(fw.onsetEnvelope));
    expect(fc.estimate!.bpm).toBe(fw.estimate!.bpm);
    // A second call without new audio changes nothing.
    expect(whole.analyze().estimate).toEqual(fw.estimate);
  });

  it("weights the spectrum by the prior and peaks at the estimate", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000, method: "flux" });
    a.pushSamples(clickTrack(120, 10));
    const f = a.analyze();
    let best = 0;
    for (let i = 1; i < f.spectrum.length; i++) if (f.spectrum[i] > f.spectrum[best]) best = i;
    expect(Math.abs(f.bpmAxis[best] - f.estimate!.bpm)).toBeLessThan(5);
    expect(Math.max(...Array.from(f.priorWeight))).toBeLessThanOrEqual(1);
    expect(a.priorWeight(60)).toBeCloseTo(Math.exp(-0.5 * (1 / 0.7) ** 2), 12);
  });

  it("reset() clears the window and the smoothing; setLowpassCutoff is harmless", () => {
    const a = new TempoAnalyzer({ sampleRate: 48000, method: "flux" });
    a.pushSamples(comping(100, 10));
    a.setLowpassCutoff(2);
    expect(a.config.lowpassCutoffHz).toBe(2);
    expect(within(a.analyze().estimate!.bpm, 100)).toBe(true);
    a.reset();
    const f = a.analyze();
    expect(f.estimate).toBeNull();
    expect(f.filledSeconds).toBe(0);
    expect(Array.from(f.onsetEnvelope).every((v) => v === 0)).toBe(true);
    // A new tempo after reset is read without the old one lingering.
    a.pushSamples(clickTrack(150, 10));
    expect(within(a.analyze().estimate!.bpm, 150, 0.02)).toBe(true);
  });
});
