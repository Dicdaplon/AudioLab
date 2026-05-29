import { describe, it, expect } from "vitest";

import {
  spectrumToChroma,
  averageChromas,
  dbSpectrumToMagnitude,
  l1Normalize,
  CHROMA_SIZE,
} from "../src/analysis/chroma";

/**
 * Build a magnitude spectrum where one bin is a pure peak at the bin closest
 * to `targetFreq`. The spectrum mimics what AnalyserNode would deliver:
 * length N = fftSize / 2, frequencies f_k = k * sampleRate / (2N).
 */
function singleToneSpectrum(
  targetFreq: number,
  sampleRate: number,
  n = 8192,
): Float32Array {
  const binHz = sampleRate / (2 * n);
  const k = Math.max(1, Math.round(targetFreq / binHz));
  const spectrum = new Float32Array(n);
  spectrum[k] = 1;
  return spectrum;
}

describe("spectrumToChroma", () => {
  const sampleRate = 48000;

  it("returns zero vector for an empty spectrum", () => {
    const chroma = spectrumToChroma(new Float32Array(8192), { sampleRate });
    expect(Array.from(chroma)).toEqual(new Array(12).fill(0));
  });

  it("L1-normalizes the output to 1 when there is energy", () => {
    const spectrum = singleToneSpectrum(440, sampleRate);
    const chroma = spectrumToChroma(spectrum, { sampleRate });
    const sum = chroma.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("pure A4 tone puts all energy on pitch class 9 (A)", () => {
    const spectrum = singleToneSpectrum(440, sampleRate);
    const chroma = spectrumToChroma(spectrum, { sampleRate });
    expect(chroma[9]).toBeCloseTo(1, 6);
    for (let i = 0; i < CHROMA_SIZE; i++) {
      if (i !== 9) expect(chroma[i]).toBe(0);
    }
  });

  it("pure C4 tone puts all energy on pitch class 0 (C)", () => {
    const spectrum = singleToneSpectrum(261.626, sampleRate);
    const chroma = spectrumToChroma(spectrum, { sampleRate });
    expect(chroma[0]).toBeCloseTo(1, 6);
  });

  it("ignores frequencies outside [minFreq, maxFreq]", () => {
    // 20 Hz peak — below default minFreq of 55 Hz
    const spectrum = singleToneSpectrum(20, sampleRate);
    const chroma = spectrumToChroma(spectrum, { sampleRate });
    const sum = chroma.reduce((a, b) => a + b, 0);
    expect(sum).toBe(0);
  });

  it("two octaves of A combine on the same pitch class", () => {
    const spectrum = new Float32Array(8192);
    const binHz = sampleRate / (2 * spectrum.length);
    spectrum[Math.round(440 / binHz)] = 1; // A4
    spectrum[Math.round(880 / binHz)] = 1; // A5
    const chroma = spectrumToChroma(spectrum, { sampleRate });
    expect(chroma[9]).toBeCloseTo(1, 6);
  });
});

describe("averageChromas", () => {
  it("returns the zero vector for an empty list", () => {
    const avg = averageChromas([]);
    expect(Array.from(avg)).toEqual(new Array(12).fill(0));
  });

  it("computes the element-wise mean", () => {
    const a = new Float32Array(12);
    const b = new Float32Array(12);
    a[0] = 1;
    b[6] = 1;
    const avg = averageChromas([a, b]);
    expect(avg[0]).toBeCloseTo(0.5);
    expect(avg[6]).toBeCloseTo(0.5);
  });
});

describe("dbSpectrumToMagnitude", () => {
  it("0 dB maps to magnitude 1", () => {
    const out = dbSpectrumToMagnitude(new Float32Array([0]));
    expect(out[0]).toBeCloseTo(1);
  });

  it("clamps values at or below the floor to 0", () => {
    const out = dbSpectrumToMagnitude(new Float32Array([-120, -90, -Infinity]), -90);
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(0);
    expect(out[2]).toBe(0);
  });

  it("-20 dB maps to magnitude 0.1", () => {
    const out = dbSpectrumToMagnitude(new Float32Array([-20]));
    expect(out[0]).toBeCloseTo(0.1, 6);
  });
});

describe("l1Normalize", () => {
  it("leaves a zero vector at zero", () => {
    const v = new Float32Array(12);
    l1Normalize(v);
    expect(v.every((x) => x === 0)).toBe(true);
  });

  it("normalizes a positive vector to sum to 1", () => {
    const v = new Float32Array([1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    l1Normalize(v);
    const sum = v.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });
});
