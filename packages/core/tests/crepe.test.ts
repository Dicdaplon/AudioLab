/**
 * CREPE tiny on the converted model shipped with the lab
 * (apps/lab/public/models/crepe-tiny/crepe-tiny.bin): loading, the FFT and
 * direct convolutions against each other, pitch and confidence on
 * synthetic tones, and the streaming tracker.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  CREPE_BINS,
  CREPE_FRAME,
  CrepePitch,
  CrepeTracker,
  crepeActivations,
  decodeCrepeActivations,
  loadCrepeModel,
  parseCrepeModel,
  type CrepeModel,
} from "../src/analysis/crepe";
import { refineFrequencyNear, smoothPitchHistory } from "../src/analysis/pitch";
import { midiToHz, notes, pluckedTone, whiteNoise } from "./helpers/synth";

const MODEL_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/lab/public/models/crepe-tiny/crepe-tiny.bin",
);

function modelBytes(): ArrayBuffer {
  const b = readFileSync(MODEL_FILE);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

const centsBetween = (f: number, ref: number) => 1200 * Math.log2(f / ref);

function sine(freq: number, sr: number, length: number, amplitude = 0.3): Float32Array {
  return Float32Array.from(
    { length },
    (_, i) => amplitude * Math.sin((2 * Math.PI * freq * i) / sr),
  );
}

let model: CrepeModel;
beforeAll(async () => {
  model = await loadCrepeModel(modelBytes());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadCrepeModel", () => {
  it("parses the converted tiny model", () => {
    expect(model.parameters).toBeGreaterThan(480_000);
    expect(model.parameters).toBeLessThan(500_000);
  });

  it("fetches a model from a URL", async () => {
    const fetchMock = vi.fn(async () => new Response(modelBytes()));
    vi.stubGlobal("fetch", fetchMock);
    const fetched = await loadCrepeModel("/models/crepe-tiny/crepe-tiny.bin");
    expect(fetchMock).toHaveBeenCalledWith("/models/crepe-tiny/crepe-tiny.bin");
    expect(fetched.parameters).toBe(model.parameters);
  });

  it("reports an HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );
    await expect(loadCrepeModel("/missing.bin")).rejects.toThrow(/404/);
  });

  it("rejects files that are not a converted model", () => {
    expect(() => parseCrepeModel(new ArrayBuffer(4))).toThrow(/magic/);
    const bytes = new Uint8Array(modelBytes());
    expect(() => parseCrepeModel(bytes.slice(0, 64).buffer)).toThrow(/Truncated/);
    expect(() => parseCrepeModel(bytes.slice(0, 20_000).buffer)).toThrow(/Truncated CREPE tensor/);
    const header = (json: object) => {
      const text = new TextEncoder().encode(JSON.stringify(json));
      const out = new Uint8Array(8 + text.length);
      out.set(new TextEncoder().encode("CREP"));
      new DataView(out.buffer).setUint32(4, text.length, true);
      out.set(text, 8);
      return out.buffer;
    };
    expect(() => parseCrepeModel(header({ format: "audiolab-crepe", version: 2 }))).toThrow(
      /Unsupported/,
    );
    expect(() =>
      parseCrepeModel(
        header({ format: "audiolab-crepe", version: 1, dtype: "float32", tensors: [] }),
      ),
    ).toThrow(/missing/);
  });
});

describe("crepeActivations", () => {
  it("reads float32 files as well as float16 ones", () => {
    // Re-encode the shipped float16 file as float32.
    const bytes = new Uint8Array(modelBytes());
    const view = new DataView(bytes.buffer);
    const headerLength = view.getUint32(4, true);
    const header = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + headerLength)));
    const dataStart = Math.ceil((8 + headerLength) / 4) * 4;
    const count = (bytes.length - dataStart) / 2;
    const half = (h: number) => {
      const e = (h >> 10) & 0x1f;
      const f = h & 0x3ff;
      const v = e === 0 ? f * 2 ** -24 : (1 + f / 1024) * 2 ** (e - 15);
      return h & 0x8000 ? -v : v;
    };
    const text = new TextEncoder().encode(JSON.stringify({ ...header, dtype: "float32" }));
    const start = Math.ceil((8 + text.length) / 4) * 4;
    const out = new Uint8Array(start + 4 * count);
    const outView = new DataView(out.buffer);
    out.set(bytes.subarray(0, 4));
    outView.setUint32(4, text.length, true);
    out.set(text, 8);
    for (let i = 0; i < count; i++) {
      outView.setFloat32(start + 4 * i, half(view.getUint16(dataStart + 2 * i, true)), true);
    }
    const f32 = parseCrepeModel(out.buffer);
    const frame = Float32Array.from({ length: CREPE_FRAME }, (_, i) => Math.sin(i * 0.09));
    const a = crepeActivations(model, frame);
    const b = crepeActivations(f32, frame);
    for (let i = 0; i < CREPE_BINS; i++) expect(Math.abs(a[i] - b[i])).toBeLessThan(1e-6);
  });

  it("gives the same activations through FFTs and directly", () => {
    const direct = parseCrepeModel(modelBytes(), { directConvolution: true });
    const frame = Float32Array.from(
      { length: CREPE_FRAME },
      (_, i) => Math.sin(i * 0.11) + 0.4 * Math.sin(i * 0.37 + 1) + 0.1 * Math.sin(i * 1.9),
    );
    const a = crepeActivations(model, frame);
    const b = crepeActivations(direct, frame);
    expect(a).toHaveLength(CREPE_BINS);
    for (let i = 0; i < CREPE_BINS; i++) expect(Math.abs(a[i] - b[i])).toBeLessThan(1e-5);
    expect(() => crepeActivations(model, new Float32Array(512))).toThrow();
  });

  it("decodes the weighted average around the strongest bin", () => {
    const act = new Float32Array(CREPE_BINS);
    act[100] = 0.9;
    const { frequency, confidence } = decodeCrepeActivations(act);
    expect(confidence).toBeCloseTo(0.9, 6);
    expect(1200 * Math.log2(frequency / 10)).toBeCloseTo(1997.3794 + (7180 * 100) / 359, 3);
    expect(decodeCrepeActivations(new Float32Array(CREPE_BINS)).frequency).toBeGreaterThan(30);
  });
});

describe("CrepePitch", () => {
  it.each([16000, 44100, 48000])("finds a 220 Hz sine at %i Hz with high confidence", (sr) => {
    const pitch = new CrepePitch(model, { sampleRate: sr });
    const r = pitch.analyze(sine(220, sr, Math.max(pitch.inputLength, 2048)));
    expect(Math.abs(centsBetween(r.frequency, 220))).toBeLessThan(1);
    expect(r.confidence).toBeGreaterThan(0.8);
    expect(pitch.lastActivations).toHaveLength(CREPE_BINS);
  });

  it("names guitar notes across the neck, refined to a few cents", () => {
    const sr = 48000;
    const pitch = new CrepePitch(model, { sampleRate: sr });
    for (const [midi, cents] of [
      [40, 0],
      [45, 15],
      [50, -10],
      [55, 0],
      [59, 22],
      [64, -5],
      [76, 0],
    ]) {
      const tone = pluckedTone(midiToHz(midi, cents), { sampleRate: sr, seconds: 0.2 });
      const r = pitch.analyze(Array.from(tone.subarray(0, pitch.inputLength)));
      expect(
        Math.abs(centsBetween(r.frequency, midiToHz(midi, cents))),
        `midi ${midi}`,
      ).toBeLessThan(3);
      expect(r.confidence).toBeGreaterThan(0.6);
    }
  });

  it("returns CREPE's own estimate when the refinement is off or finds no peak", () => {
    const sr = 16000;
    const raw = new CrepePitch(model, { sampleRate: sr, refineWindow: 0 });
    const r = raw.analyze(sine(220, sr, CREPE_FRAME));
    expect(Math.abs(centsBetween(r.frequency, 220))).toBeLessThan(25);
    // A window shorter than the CREPE frame is zero-padded.
    const short = new CrepePitch(model, { sampleRate: sr }).analyze(sine(440, sr, 800));
    expect(Math.abs(centsBetween(short.frequency, 440))).toBeLessThan(25);
    const short48 = new CrepePitch(model, { sampleRate: 48000 }).analyze(sine(330, 48000, 2048));
    expect(Math.abs(centsBetween(short48.frequency, 330))).toBeLessThan(1);
    const noisy = new CrepePitch(model, { sampleRate: 44100 }).analyze(whiteNoise(4096, 0.3, 5));
    expect(noisy.confidence).toBeLessThan(0.6);
    expect(() => new CrepePitch(model, { sampleRate: 0 })).toThrow();
  });
});

describe("CrepeTracker", () => {
  it("publishes the note ten times a second, null on silence and noise", () => {
    const sr = 48000;
    const tracker = new CrepeTracker(model, { sampleRate: sr });
    tracker.push(new Float32Array(sr / 2));
    expect(tracker.estimate).toBeNull();
    expect(tracker.lastCrepe).toBeNull();

    tracker.push(notes([57], { sampleRate: sr, seconds: 0.5, cents: 8 }));
    const e = tracker.estimate!;
    expect(e.midi).toBe(57);
    expect(Math.abs(e.cents - 8)).toBeLessThan(2);
    expect(e.clarity).toBeGreaterThan(0.6);
    expect(tracker.lastCrepe!.confidence).toBe(e.clarity);

    tracker.push(whiteNoise(sr / 2, 0.3, 9));
    expect(tracker.estimate).toBeNull();

    tracker.push(notes([64], { sampleRate: sr, seconds: 0.3 }));
    expect(tracker.estimate?.midi).toBe(64);
    tracker.setReferenceA4(432);
    tracker.push(notes([64], { sampleRate: sr, seconds: 0.2 }));
    expect(tracker.estimate!.cents).toBeGreaterThan(25);
    tracker.reset();
    expect(tracker.estimate).toBeNull();
  });

  it("drops estimates outside the frequency range", () => {
    const sr = 44100;
    const tracker = new CrepeTracker(model, { sampleRate: sr, maxFrequency: 200 });
    tracker.push(notes([69], { sampleRate: sr, seconds: 0.4 }));
    expect(tracker.lastCrepe!.confidence).toBeGreaterThan(0.6);
    expect(tracker.estimate).toBeNull();
  });
});

describe("pitch helpers shared by the trackers", () => {
  it("refineFrequencyNear finds the NSDF peak near a guide, 0 when there is none", () => {
    const sr = 48000;
    const x = sine(196.5, sr, 2048);
    expect(Math.abs(centsBetween(refineFrequencyNear(x, sr, 200), 196.5))).toBeLessThan(0.5);
    expect(refineFrequencyNear(x, sr, 40)).toBe(0); // lag beyond half the window
    expect(refineFrequencyNear(whiteNoise(2048, 0.3), sr, 300)).toBe(0);
  });

  it("smoothPitchHistory needs at least one valid estimate", () => {
    const opts = { medianFrames: 1, hysteresisCents: 10, referenceA4: 440 };
    expect(smoothPitchHistory([null], null, opts)).toBeNull();
    expect(smoothPitchHistory([], null, { ...opts, medianFrames: 0 })).toBeNull();
  });
});
