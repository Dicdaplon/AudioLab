// @vitest-environment node
import { describe, expect, it } from "vitest";

import { OnsetDetector, type OnsetEvent } from "../../src/analysis/onset/onsetDetector";
import { OnlinePeakPicker } from "../../src/analysis/onset/peakPicker";
import { AttackEnvelope } from "../../src/analysis/onset/attackEnvelope";
import { SuperFluxOdf, diffFramesFor, logFilterbank } from "../../src/analysis/onset/superFlux";
import { performance, pushChunks, type NoteHit } from "../helpers/onsets";
import { mulberry32 } from "../helpers/synth";

const SR = 48000;

function detect(signal: Float32Array, sizes?: number[], firstFrame = 0): OnsetEvent[] {
  const det = new OnsetDetector({ sampleRate: SR });
  return pushChunks(signal, (c, f) => det.push(c, f), sizes, firstFrame);
}

/** Nearest onset to each true start within ±50 ms; precision / recall like MIREX. */
function evaluate(onsets: readonly OnsetEvent[], truth: readonly number[], toleranceMs = 50) {
  const used = new Set<number>();
  const errorsMs: number[] = [];
  for (const t of truth) {
    let best = -1;
    let bestD = Infinity;
    onsets.forEach((o, i) => {
      const d = Math.abs(o.frame - t);
      if (!used.has(i) && d < bestD) {
        best = i;
        bestD = d;
      }
    });
    if (best >= 0 && (bestD / SR) * 1000 <= toleranceMs) {
      used.add(best);
      errorsMs.push(((onsets[best].frame - t) / SR) * 1000);
    }
  }
  const tp = errorsMs.length;
  const precision = onsets.length === 0 ? 0 : tp / onsets.length;
  const recall = tp / truth.length;
  const f = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const abs = errorsMs.map(Math.abs).sort((a, b) => a - b);
  return { precision, recall, f, errorsMs, medianAbsMs: abs[Math.floor(abs.length / 2)] ?? NaN };
}

/** Single notes across the neck at varied loudness, 370 ms apart. */
function melody(count = 16): NoteHit[] {
  const notes = [40, 45, 50, 55, 59, 64, 52, 57];
  const rand = mulberry32(5);
  return Array.from({ length: count }, (_, i) => ({
    time: 0.4 + i * 0.37,
    midi: notes[i % notes.length],
    amplitude: 0.08 + 0.25 * rand(),
  }));
}

describe("SuperFlux building blocks", () => {
  it("builds normalised, increasing log-spaced filters", () => {
    const fb = logFilterbank(1024, SR, 12, 30, 16000);
    expect(fb.weights.length).toBeGreaterThan(40);
    for (const w of fb.weights) expect(w.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 5);
    for (let i = 1; i < fb.centres.length; i++)
      expect(fb.centres[i]).toBeGreaterThan(fb.centres[i - 1]);
  });

  it("compares with the frame whose Hann window overlaps by half", () => {
    // Half height of a Hann window is N/4 from its centre: 256 samples = 2 hops of 128.
    expect(diffFramesFor(1024, 128)).toBe(2);
    expect(diffFramesFor(2048, 441)).toBe(1);
  });

  it("gives one value per hop once the window is full, whatever the chunking", () => {
    const signal = performance(melody(4), { seconds: 2 }).signal;
    const a = new SuperFluxOdf({ sampleRate: SR });
    const b = new SuperFluxOdf({ sampleRate: SR });
    const va = pushChunks(signal, (c, f) => a.push(c, f), [128]);
    const vb = pushChunks(signal, (c, f) => b.push(c, f), [77, 3001, 512]);
    expect(va.length).toBe(Math.floor((signal.length - 1024) / 128) + 1);
    expect(vb.map((v) => v.endFrame)).toEqual(va.map((v) => v.endFrame));
    vb.forEach((v, i) => expect(v.value).toBeCloseTo(va[i].value, 9));
  });

  it("peak picker: one decision per peak, none inside the combine window", () => {
    const picker = new OnlinePeakPicker({
      frameRate: 100,
      lookAheadFrames: 1,
      combineSeconds: 0.05,
    });
    const odf = [0, 0, 0.5, 1, 0.4, 0.9, 0.2, 0, 0, 0, 0, 0, 0.8, 0.1, 0];
    const peaks = odf.map((v) => picker.push(v)).filter((p) => p !== null);
    // 1.0 at index 3, 0.9 at index 5 is within 50 ms, 0.8 at index 12 is not.
    expect(peaks.map((p) => p!.index)).toEqual([3, 12]);
  });

  it("attack envelope finds the start of a level rise within one block", () => {
    const env = new AttackEnvelope({ sampleRate: SR });
    const signal = new Float32Array(SR / 5).fill(0);
    const rand = mulberry32(2);
    for (let i = 0; i < signal.length; i++) signal[i] = (rand() - 0.5) * 0.002;
    for (let i = 4800; i < signal.length; i++) signal[i] += 0.3 * Math.sin(i * 0.2);
    env.push(signal, 0);
    const found = env.locate(4800 + 1200, 3000);
    expect(found).not.toBeNull();
    expect(Math.abs(found!.frame - 4800)).toBeLessThanOrEqual(32);
    expect(found!.peakDb - found!.baselineDb).toBeGreaterThan(30);
  });
});

describe("OnsetDetector", () => {
  it("finds plucked notes with millisecond accuracy (synthetic baseline)", () => {
    const hits = melody();
    for (const noiseRms of [0, 0.001, 0.003]) {
      const { signal, startFrames } = performance(hits, { seconds: 7, noiseRms });
      const result = evaluate(detect(signal), startFrames);
      expect(result.f).toBeGreaterThanOrEqual(0.9);
      expect(result.medianAbsMs).toBeLessThanOrEqual(2);
      // 90 % of the found notes within ±10 ms.
      const within = result.errorsMs.filter((e) => Math.abs(e) <= 10).length;
      expect(within / result.errorsMs.length).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("reports a strum as one onset at its first string", () => {
    const { signal, startFrames } = performance(
      [
        { time: 0.5, midi: [40, 47, 52, 56, 59, 64], strumMs: 15 },
        { time: 1.5, midi: [45, 52, 57, 61, 64], strumMs: 8 },
      ],
      { seconds: 2.5, noiseRms: 0.001 },
    );
    const onsets = detect(signal);
    expect(onsets).toHaveLength(2);
    onsets.forEach((o, i) => expect(Math.abs(o.frame - startFrames[i]) / SR).toBeLessThan(0.006));
  });

  it("detects the same note played again over its own ringing", () => {
    const hits = [0.5, 0.9, 1.3, 1.7].map((time) => ({ time, midi: 52, amplitude: 0.25 }));
    const { signal, startFrames } = performance(hits, { seconds: 2.4, noiseRms: 0.001 });
    expect(evaluate(detect(signal), startFrames).f).toBe(1);
  });

  it("stays silent on noise, mains hum and a sustained note with vibrato", () => {
    const n = 3 * SR;
    const rand = mulberry32(9);
    const noise = new Float32Array(n).map(() => (rand() - 0.5) * 0.01);
    expect(detect(noise)).toHaveLength(0);

    const hum = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      for (let h = 1; h <= 5; h++) hum[i] += (0.05 / h) * Math.sin((2 * Math.PI * 50 * h * i) / SR);
    }
    expect(detect(hum)).toHaveLength(0);

    // A bowed-like note: smooth 100 ms fade in, then ±40 cents of vibrato at 6 Hz.
    const vib = new Float32Array(n);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const f = 330 * Math.pow(2, (0.4 * Math.sin((2 * Math.PI * 6 * i) / SR)) / 12);
      phase += (2 * Math.PI * f) / SR;
      const env = Math.min(1, i / (0.1 * SR));
      for (let h = 1; h <= 6; h++) vib[i] += ((0.2 * env) / h) * Math.sin(h * phase);
    }
    expect(detect(vib).length).toBeLessThanOrEqual(1);
  });

  it("gives the same onsets for any chunking, in the given stream clock", () => {
    const { signal } = performance(melody(8), { seconds: 3.5, noiseRms: 0.001 });
    const a = detect(signal, [128]);
    const b = detect(signal, [2048, 99, 512, 4000]);
    expect(b.map((o) => o.frame)).toEqual(a.map((o) => o.frame));
    const shifted = detect(signal, [512], 1_000_000);
    expect(shifted.map((o) => o.frame - 1_000_000)).toEqual(a.map((o) => o.frame));
    expect(shifted[0].time).toBeCloseTo(shifted[0].frame / SR, 9);
    expect(a.map((o) => o.id)).toEqual(a.map((_, i) => i));
  });

  it("decides each onset after it happened, within the documented latency", () => {
    const det = new OnsetDetector({ sampleRate: SR });
    const { signal } = performance(melody(8), { seconds: 3.5, noiseRms: 0.001 });
    const onsets = pushChunks(signal, (c, f) => det.push(c, f));
    const maxLatency = det.decisionLatencySeconds * SR * 2;
    for (const o of onsets) {
      expect(o.decidedAtFrame).toBeGreaterThan(o.frame);
      expect(o.decidedAtFrame - o.frame).toBeLessThan(maxLatency);
    }
  });

  it("restarts cleanly after a gap in the stream", () => {
    const det = new OnsetDetector({ sampleRate: SR });
    const { signal, startFrames } = performance([{ time: 0.3, midi: 52 }], { seconds: 0.8 });
    det.push(signal.subarray(0, 4800), 0);
    // 1 s of frames missing, then the rest of the take placed after the gap.
    const out = det.push(signal.subarray(4800), 4800 + SR);
    expect(out).toHaveLength(1);
    expect(Math.abs(out[0].frame - (startFrames[0] + SR))).toBeLessThan(0.005 * SR);
  });
});
