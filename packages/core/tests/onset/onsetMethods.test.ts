// @vitest-environment node
import { describe, expect, it } from "vitest";

import { SuperFluxComplexOdf } from "../../src/analysis/onset/complexFlux";
import { OnsetDetector, type OnsetEvent } from "../../src/analysis/onset/onsetDetector";
import {
  DEFAULT_ONSET_METHOD,
  ONSET_METHODS,
  ONSET_METHOD_DEFAULTS,
  onsetMethodPreset,
  type OnsetMethod,
} from "../../src/analysis/onset/onsetMethods";
import { OnsetPipeline } from "../../src/analysis/onset/onsetPipeline";
import { PEAK_PICKER_DEFAULTS } from "../../src/analysis/onset/peakPicker";
import { SuperFluxOdf } from "../../src/analysis/onset/superFlux";
import { melody, performance, pushChunks, strums, type NoteHit } from "../helpers/onsets";

const SR = 48000;

function detect(signal: Float32Array, method?: OnsetMethod, sizes?: number[]): OnsetEvent[] {
  const det = new OnsetDetector({ sampleRate: SR, method });
  return pushChunks(signal, (c, f) => det.push(c, f), sizes);
}

/** Greedy nearest match within ±50 ms; F-measure and absolute errors (ms). */
function score(onsets: readonly OnsetEvent[], truth: readonly number[]) {
  const used = new Set<number>();
  const errors: number[] = [];
  for (const t of truth) {
    let best = -1;
    for (let i = 0; i < onsets.length; i++) {
      if (used.has(i)) continue;
      if (best < 0 || Math.abs(onsets[i].frame - t) < Math.abs(onsets[best].frame - t)) best = i;
    }
    if (best >= 0 && Math.abs(onsets[best].frame - t) <= 0.05 * SR) {
      used.add(best);
      errors.push((Math.abs(onsets[best].frame - t) / SR) * 1000);
    }
  }
  const p = onsets.length ? errors.length / onsets.length : 0;
  const r = errors.length / truth.length;
  errors.sort((a, b) => a - b);
  return {
    precision: p,
    recall: r,
    f: p + r ? (2 * p * r) / (p + r) : 0,
    medianMs: errors[errors.length >> 1] ?? NaN,
  };
}

describe("onset methods: presets", () => {
  it("lists three methods, classic by default", () => {
    expect(ONSET_METHODS).toEqual(["classic", "sensitive", "superflux-complex"]);
    expect(DEFAULT_ONSET_METHOD).toBe("classic");
    expect(onsetMethodPreset("classic", SR)).toEqual({ odf: {}, peaks: {} });
    expect(onsetMethodPreset("sensitive", SR).peaks.delta).toBe(0.01);
  });

  it("superflux-complex: about 46 ms windows every 10 ms, at any rate", () => {
    expect(onsetMethodPreset("superflux-complex", 44100).odf).toMatchObject({
      frameSize: 2048,
      hopSize: 441,
    });
    expect(onsetMethodPreset("superflux-complex", 48000).odf).toMatchObject({
      frameSize: 2048,
      hopSize: 480,
    });
    expect(onsetMethodPreset("superflux-complex", 96000).odf.frameSize).toBe(4096);
    expect(ONSET_METHOD_DEFAULTS["superflux-complex"].peaks.delta).toBe(0.2);
  });

  it("explicit odf / peaks options win over the method's preset", () => {
    const det = new OnsetDetector({
      sampleRate: SR,
      method: "superflux-complex",
      odf: { hopSize: 256, normSeconds: 4 },
      peaks: { delta: 0.3, threshold: undefined },
    });
    expect(det.odf.config.hopSize).toBe(256);
    expect(det.odf.config.frameSize).toBe(2048);
    expect((det.odf as SuperFluxComplexOdf).complexConfig.normSeconds).toBe(4);
    expect(det.picker.config.delta).toBe(0.3);
    expect(det.picker.config.threshold).toBe(PEAK_PICKER_DEFAULTS.threshold);
  });

  it("rejects an unknown method", () => {
    expect(
      () => new OnsetDetector({ sampleRate: SR, method: "fancy" as unknown as OnsetMethod }),
    ).toThrow(/unknown onset method/);
  });
});

describe("onset methods: classic is unchanged", () => {
  it("builds the same detector with or without method: 'classic'", () => {
    const a = new OnsetDetector({ sampleRate: SR });
    const b = new OnsetDetector({ sampleRate: SR, method: "classic" });
    expect(a.method).toBe("classic");
    expect(a.odf).not.toBeInstanceOf(SuperFluxComplexOdf);
    expect(a.odf).toBeInstanceOf(SuperFluxOdf);
    expect(b.odf.config).toEqual(a.odf.config);
    expect(a.picker.config).toEqual({ ...PEAK_PICKER_DEFAULTS, frameRate: SR / 128 });
    expect(b.picker.config).toEqual(a.picker.config);
  });

  it("reports exactly the same onsets", () => {
    const { signal } = performance(melody(14, 0.3, 4), { seconds: 5, noiseRms: 0.002 });
    const plain = detect(signal);
    expect(plain.length).toBeGreaterThan(10);
    expect(detect(signal, "classic")).toEqual(plain);
  });
});

// The synthetic plucks stop dead 1.2 s after their start; a short decay keeps
// that cut inaudible, so every detection is a real attack.
const DECAY = { decaySeconds: 0.3 };

describe.each(ONSET_METHODS)("onset method %s", (method) => {
  it("finds plucked notes across the neck, loud and soft, in noise", () => {
    const hits = melody(16, 0.37, 5);
    for (const noiseRms of [0, 0.002]) {
      const { signal, startFrames } = performance(hits, { seconds: 7, noiseRms, ...DECAY });
      const r = score(detect(signal, method), startFrames);
      // "classic" misses the softest notes; the opt-in methods find them all.
      expect(r.recall).toBeGreaterThanOrEqual(method === "classic" ? 0.75 : 0.95);
      expect(r.precision).toBeGreaterThanOrEqual(0.9);
      expect(r.medianMs).toBeLessThanOrEqual(3);
    }
  });

  it("finds every strum, and the same note replayed over its ringing", () => {
    const strummed = performance(strums(6, 9), { seconds: 5, noiseRms: 0.001 });
    const r = score(detect(strummed.signal, method), strummed.startFrames);
    expect(r.recall).toBe(1);
    // "sensitive" also fires on the beating of a ringing chord (its trade-off).
    if (method !== "sensitive") expect(r.precision).toBeGreaterThanOrEqual(0.9);

    const replayed: NoteHit[] = [0.5, 0.9, 1.3, 1.7].map((time) => ({
      time,
      midi: 52,
      amplitude: 0.25,
    }));
    const again = performance(replayed, { seconds: 2.4, noiseRms: 0.001, ...DECAY });
    expect(score(detect(again.signal, method), again.startFrames).f).toBe(1);
  });

  it("does not depend on the chunking", () => {
    const { signal } = performance(melody(6, 0.4, 2), { seconds: 3, noiseRms: 0.001 });
    const a = detect(signal, method, [128]);
    const b = detect(signal, method, [77, 3001, 512]);
    expect(b.map((o) => o.frame)).toEqual(a.map((o) => o.frame));
  });

  it("accepts nothing in a quiet room with no note (pipeline)", () => {
    const { signal } = performance([], { seconds: 4, noiseRms: 0.003 });
    const pipe = new OnsetPipeline({ sampleRate: SR, method });
    const onsets = pushChunks(signal, (c, f) => pipe.push(c, f).onsets);
    expect(onsets).toHaveLength(0);
  });
});

describe("SuperFluxComplexOdf", () => {
  it("stays in [0, 2] and peaks at the attacks", () => {
    const { signal, startFrames } = performance(melody(5, 0.5, 3), { seconds: 3.2 });
    const odf = new SuperFluxComplexOdf({ sampleRate: SR, frameSize: 2048, hopSize: 480 });
    const frames = odf.push(signal, 0);
    for (const f of frames) {
      expect(f.value).toBeGreaterThanOrEqual(0);
      expect(f.value).toBeLessThanOrEqual(2 + 1e-9);
    }
    // The largest value near each attack (frame end within a window after it)
    // beats the largest value in the steady part between attacks.
    for (let i = 0; i < startFrames.length - 1; i++) {
      const s = startFrames[i];
      const near = frames.filter((f) => f.endFrame > s && f.endFrame <= s + 2048 + 960);
      const steady = frames.filter(
        (f) => f.endFrame > s + 2048 + 4800 && f.endFrame <= startFrames[i + 1],
      );
      const max = (xs: typeof frames) => Math.max(...xs.map((f) => f.value));
      expect(max(near)).toBeGreaterThan(2 * max(steady));
    }
  });

  it("gives nothing on silence and restarts cleanly after reset", () => {
    const odf = new SuperFluxComplexOdf({ sampleRate: SR });
    expect(odf.push(new Float32Array(SR / 2), 0).every((f) => f.value === 0)).toBe(true);
    const { signal } = performance(melody(3, 0.4, 1), { seconds: 1.5 });
    const first = odf.push(signal, 10 * SR).map((f) => f.value); // gap → reset
    odf.reset();
    const again = odf.push(signal, 0).map((f) => f.value);
    expect(again).toEqual(first);
  });
});
