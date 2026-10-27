/**
 * The benchmark's own pieces: metrics checked on hand-computed cases, the
 * noise conditions (deterministic, at the SNR they claim), and the
 * style-balanced aggregation.
 */
import { describe, expect, it } from "vitest";

import { CONDITIONS, applyCondition, butterworth4, mixAtSnr, pinkNoise } from "../../bench/augment";
import {
  keyMerged,
  keyMirex,
  keyStrict,
  matchOnsets,
  onsetScore,
  tempoAcc1,
  tempoAcc2,
  tempoOctaveError,
} from "../../bench/metrics";
import { aggregate, clusterLayout, resamples, type Rec } from "../../bench/stats";
import { fftMagnitude } from "../../src/analysis/fft";

describe("onset metrics (mir_eval conventions, ±50 ms)", () => {
  it("matches one to one within the window", () => {
    expect(matchOnsets([1, 2, 3], [1.04, 2.06, 2.98, 3.01])).toEqual([
      [1, 1.04],
      [3, 2.98],
    ]);
  });

  it("reaches the maximum matching when two references compete", () => {
    // A greedy nearest match would give 1.0 ↔ 1.03 and leave 1.06 unmatched.
    expect(matchOnsets([1.0, 1.06], [0.97, 1.03])).toHaveLength(2);
  });

  it("scores F, precision and recall", () => {
    const s = onsetScore([1, 2, 3, 4], [1.01, 2.02, 5]);
    expect(s.precision).toBeCloseTo(2 / 3);
    expect(s.recall).toBeCloseTo(0.5);
    expect(s.f).toBeCloseTo((2 * (2 / 3) * 0.5) / (2 / 3 + 0.5));
  });
});

describe("tempo metrics (Gouyon et al. 2006)", () => {
  it("accepts 4 %, and octaves only in Acc2", () => {
    expect(tempoAcc1(124, 120)).toBe(true);
    expect(tempoAcc1(125, 120)).toBe(false);
    expect(tempoAcc2(240, 120)).toBe(true);
    expect(tempoAcc2(180, 60)).toBe(true);
    expect(tempoOctaveError(60, 120)).toBe(true);
    expect(tempoOctaveError(180, 60)).toBe(false);
  });
});

describe("key metrics", () => {
  const C = { tonic: 0, mode: "maj" as const };
  const Am = { tonic: 9, mode: "min" as const };
  it("strict separates relatives, merged joins them", () => {
    expect(keyStrict(Am, C)).toBe(false);
    expect(keyMerged(Am, C)).toBe(true);
    expect(keyMerged(C, Am)).toBe(true);
    expect(keyMerged({ tonic: 4, mode: "min" }, C)).toBe(false);
  });
  it("scores MIREX: fifth 0.5, relative 0.3, parallel 0.2", () => {
    expect(keyMirex({ tonic: 7, mode: "maj" }, C)).toBe(0.5);
    expect(keyMirex({ tonic: 5, mode: "maj" }, C)).toBe(0.5);
    expect(keyMirex(Am, C)).toBe(0.3);
    expect(keyMirex({ tonic: 0, mode: "min" }, C)).toBe(0.2);
    expect(keyMirex({ tonic: 2, mode: "maj" }, C)).toBe(0);
  });
});

describe("noise conditions", () => {
  const sr = 12_000;
  const tone = new Float32Array(sr * 2).map((_, i) => 0.2 * Math.sin((2 * Math.PI * 440 * i) / sr));

  it("are deterministic", async () => {
    const pink = CONDITIONS.find((c) => c.id === "pink-10")!;
    const a = await applyCondition(tone, sr, pink, "item");
    const b = await applyCondition(tone, sr, pink, "item");
    expect(a!.signal).toEqual(b!.signal);
    const other = await applyCondition(tone, sr, pink, "other item");
    expect(other!.signal).not.toEqual(a!.signal);
  });

  it("mix at the SNR they claim, in the analysis band", () => {
    const noise = pinkNoise(tone.length, 5);
    const mixed = mixAtSnr(tone, noise, 10, sr);
    const added = mixed.map((x, i) => x - tone[i]);
    const band = (x: Float32Array) => {
      const y = Float32Array.from(x);
      butterworth4(y, sr, "highpass", 50);
      butterworth4(y, sr, "lowpass", 5400);
      return Math.sqrt(y.reduce((s, v) => s + v * v, 0) / y.length);
    };
    expect(20 * Math.log10(band(tone) / band(added))).toBeCloseTo(10, 1);
  });

  it("make pink noise fall about 3 dB per octave", () => {
    const n = 1 << 16;
    const mag = fftMagnitude(pinkNoise(n, 9));
    const bandPower = (lo: number, hi: number) => {
      let s = 0;
      for (let k = Math.round((lo * n) / 44_100); k < Math.round((hi * n) / 44_100); k++)
        s += mag[k] * mag[k];
      return s / Math.round(((hi - lo) * n) / 44_100);
    };
    const slope = (10 * Math.log10(bandPower(1600, 3200) / bandPower(200, 400))) / 3;
    expect(slope).toBeGreaterThan(-3.6);
    expect(slope).toBeLessThan(-2.4);
  });

  it("clip about 0.5 % of the samples through the bad microphone", async () => {
    const bad = CONDITIONS.find((c) => c.id === "bad-mic")!;
    const out = await applyCondition(tone, sr, bad, "item");
    expect(out!.meta.clippedShare).toBeGreaterThan(0.001);
    expect(out!.meta.clippedShare).toBeLessThan(0.01);
  });
});

describe("aggregation", () => {
  const r = (
    stratum: string,
    cluster: string,
    x: number,
    m: number,
    split: "real" | "synthetic" = "real",
  ): Rec => ({
    task: "chords",
    metric: "accuracy",
    method: "m",
    condition: "clean",
    split,
    source: split === "real" ? "guitarset" : "synthetic",
    stratum,
    cluster,
    item: `${stratum}-${cluster}`,
    x,
    m,
  });
  const recs = [
    r("Rock", "a", 0.8, 300),
    r("Rock", "b", 0.6, 100),
    r("Jazz", "c", 0.4, 100),
    r("steady", "s1", 0.9, 10, "synthetic"),
    r("fast", "s2", 0.5, 10, "synthetic"),
  ];

  it("weighs every style the same in the headline, by volume next to it", () => {
    const a = aggregate(recs);
    // Rock = (0.8·300 + 0.6·100) / 400 = 0.75; Jazz = 0.4.
    expect(a.real).toBeCloseTo((0.75 + 0.4) / 2);
    expect(a.realVolume).toBeCloseTo((0.8 * 300 + 0.6 * 100 + 0.4 * 100) / 500);
    expect(a.synthetic).toBeCloseTo(0.7);
    expect(a.pooled).toBeCloseTo((0.7 + 0.575) / 2);
  });

  it("resamples clusters inside each style only", () => {
    const layout = clusterLayout(recs);
    for (const s of resamples(layout, 50)) {
      expect(s.get("real|guitarset|Jazz")).toEqual(["c"]);
      for (const c of s.get("real|guitarset|Rock")!) expect(["a", "b"]).toContain(c);
    }
  });
});
