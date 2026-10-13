/**
 * Offline pipeline (src/analysis/offline) on generated audio: the same code
 * the sample suite and the CLI scripts run, exercised here without fixtures.
 */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CHROMA_SIZE } from "../../src/analysis/chroma";
import { TonalityEngine } from "../../src/analysis/engine/tonalityEngine";
import { decodeAudioFile } from "../../src/offline/decodeAudio";
import {
  aggregateChromas,
  analyzeOverall,
  computeChromaSequence,
  runPresenceTonality,
  slidingChordHistogram,
} from "../../src/offline/offlinePipeline";
import { concat, notes } from "../helpers/synth";

const SR = 11_025;
const FRAME = { fftSize: 2048, hopSize: 512 }; // 5.4 Hz bins, 21.5 fps

function onehot(pc: number): Float32Array {
  const v = new Float32Array(CHROMA_SIZE);
  v[pc] = 1;
  return v;
}

function triadChroma(...pcs: number[]): Float32Array {
  const v = new Float32Array(CHROMA_SIZE);
  for (const pc of pcs) v[pc] = 1 / pcs.length;
  return v;
}

describe("computeChromaSequence", () => {
  it("emits one chroma per full hop-spaced frame", () => {
    const samples = new Float32Array(10_000);
    const chromas = computeChromaSequence({ samples, sampleRate: SR, durationSeconds: 1 }, FRAME);
    expect(chromas).toHaveLength(Math.floor((10_000 - 2048) / 512) + 1);
    // Silence gives all-zero chromas, not NaN.
    expect(Array.from(chromas[0])).toEqual(new Array(12).fill(0));
  });

  it("maps a 440 Hz tone to pitch class A and leaves the input untouched", () => {
    const samples = notes([69], { sampleRate: SR, seconds: 1, harmonics: 1 });
    const copy = samples.slice();
    const chromas = computeChromaSequence({ samples, sampleRate: SR, durationSeconds: 1 }, FRAME);
    for (const c of chromas) expect(c[9]).toBeGreaterThan(0.95);
    expect(samples).toEqual(copy);
  });

  it("returns nothing for a signal shorter than one frame", () => {
    const audio = { samples: new Float32Array(100), sampleRate: SR, durationSeconds: 0.01 };
    expect(computeChromaSequence(audio, FRAME)).toEqual([]);
  });
});

describe("aggregateChromas / analyzeOverall", () => {
  it("averages a range and L1-normalises it", () => {
    const chromas = [onehot(0), onehot(0), onehot(7), onehot(4)];
    const all = aggregateChromas(chromas);
    expect(all[0]).toBeCloseTo(0.5, 6);
    expect(all[7]).toBeCloseTo(0.25, 6);
    const tail = aggregateChromas(chromas, 2, 4);
    expect(tail[7]).toBeCloseTo(0.5, 6);
    expect(tail[0]).toBe(0);
    expect(Array.from(aggregateChromas(chromas, 2, 2))).toEqual(new Array(12).fill(0));
  });

  it("trims the head and the tail before ranking", () => {
    // 10 % of the frames at each end are C#; the body is a C major triad.
    const chromas = [
      ...Array.from({ length: 10 }, () => onehot(1)),
      ...Array.from({ length: 80 }, () => triadChroma(0, 4, 7)),
      ...Array.from({ length: 10 }, () => onehot(1)),
    ];
    const trimmed = analyzeOverall(chromas, 0.1);
    expect(trimmed.chroma[1]).toBe(0);
    expect(trimmed.chords[0].name).toBe("C");
    expect(trimmed.keys).toHaveLength(24);
    expect(analyzeOverall(chromas, 0).chroma[1]).toBeCloseTo(0.2, 6);
  });
});

describe("slidingChordHistogram", () => {
  it("rejects non-positive window or stride", () => {
    expect(() => slidingChordHistogram([], 0, 1)).toThrow();
    expect(() => slidingChordHistogram([], 1, 0)).toThrow();
  });

  it("tallies the top-1 chord per window and skips silent windows", () => {
    const C = triadChroma(0, 4, 7);
    const Am = triadChroma(9, 0, 4);
    const silent = new Float32Array(CHROMA_SIZE);
    const chromas = [C, C, C, C, Am, Am, silent, silent];
    const hist = slidingChordHistogram(chromas, 2, 2);
    // Windows: [C,C] [C,C] [Am,Am] [silent,silent] → the silent one is skipped.
    expect(hist.totalWindows).toBe(3);
    expect(hist.entries.map((e) => [e.name, e.count])).toEqual([
      ["C", 2],
      ["Am", 1],
    ]);
    expect(hist.entries[0].fraction).toBeCloseTo(2 / 3, 10);
    expect(hist.entries[0].meanSimilarity).toBeCloseTo(1, 6);
  });
});

describe("runPresenceTonality", () => {
  const cadence = (tonic: number) =>
    concat(
      [
        [tonic, tonic + 3, tonic + 7],
        [tonic + 5, tonic + 8, tonic + 12],
        [tonic + 7, tonic + 11, tonic + 14],
        [tonic, tonic + 3, tonic + 7],
      ].map((c) => notes(c, { sampleRate: SR, seconds: 1 })),
    );

  it("replays the chromas through a TonalityEngine with the same settings", () => {
    const chromas = computeChromaSequence(
      { samples: cadence(57), sampleRate: SR, durationSeconds: 4 },
      FRAME,
    );
    const fps = SR / FRAME.hopSize;
    const opts = {
      liveAcquisitionSeconds: 2,
      tonalityAcquisitionSeconds: 4,
      framesPerSecond: fps,
      filter: { tolerancy: 0.5, memory: 4, mode: "median" as const },
    };
    const result = runPresenceTonality(chromas, opts);

    const engine = new TonalityEngine({
      framesPerSecond: fps,
      liveAcquisitionSeconds: 2,
      tonalityAcquisitionSeconds: 4,
      filterTolerancy: 0.5,
      filterMemory: 4,
      filterMode: "median",
    });
    for (const c of chromas) engine.pushChroma(c);
    expect(result.frame).toEqual(engine.snapshot());
    expect(result.presence).toBe(result.frame.presenceHistogram);
    expect(result.keys[0].shortName).toBe("Am");
    // Energy path on the same audio agrees.
    expect(analyzeOverall(chromas, 0).keys[0].shortName).toBe("Am");
  });

  it("falls back to the engine's filter defaults", () => {
    const chromas = Array.from({ length: 30 }, () => triadChroma(0, 4, 7));
    const result = runPresenceTonality(chromas, {
      liveAcquisitionSeconds: 1,
      tonalityAcquisitionSeconds: 2,
      framesPerSecond: 10,
    });
    const engine = new TonalityEngine({
      framesPerSecond: 10,
      liveAcquisitionSeconds: 1,
      tonalityAcquisitionSeconds: 2,
    });
    for (const c of chromas) engine.pushChroma(c);
    expect(result.frame).toEqual(engine.snapshot());
  });
});

/** 16-bit PCM WAV with the given channels (equal length). */
function wavBytes(channels: Float32Array[], sampleRate: number): Uint8Array {
  const n = channels[0].length;
  const nc = channels.length;
  const data = n * nc * 2;
  const buf = new DataView(new ArrayBuffer(44 + data));
  const str = (o: number, s: string) =>
    [...s].forEach((ch, i) => buf.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF");
  buf.setUint32(4, 36 + data, true);
  str(8, "WAVE");
  str(12, "fmt ");
  buf.setUint32(16, 16, true);
  buf.setUint16(20, 1, true); // PCM
  buf.setUint16(22, nc, true);
  buf.setUint32(24, sampleRate, true);
  buf.setUint32(28, sampleRate * nc * 2, true);
  buf.setUint16(32, nc * 2, true);
  buf.setUint16(34, 16, true);
  str(36, "data");
  buf.setUint32(40, data, true);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nc; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      buf.setInt16(44 + (i * nc + c) * 2, Math.round(v * 32767), true);
    }
  }
  return new Uint8Array(buf.buffer);
}

describe("decodeAudioFile", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "audiolab-decode-"));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("decodes a stereo WAV to mono by averaging the channels", async () => {
    const n = 8000;
    const left = new Float32Array(n).fill(0.5);
    const right = new Float32Array(n).fill(-0.25);
    const file = path.join(dir, "stereo.wav");
    await writeFile(file, wavBytes([left, right], 8000));

    const audio = await decodeAudioFile(file);
    expect(audio.sampleRate).toBe(8000);
    expect(audio.samples).toHaveLength(n);
    expect(audio.durationSeconds).toBeCloseTo(1, 10);
    expect(audio.samples[0]).toBeCloseTo(0.125, 3);
    expect(audio.samples[n - 1]).toBeCloseTo(0.125, 3);
  });

  it("rejects a missing file", async () => {
    await expect(decodeAudioFile(path.join(dir, "missing.wav"))).rejects.toThrow();
  });
});
