import { describe, it, expect } from "vitest";

import {
  detectKey,
  detectMajorKey,
  pearsonAgainstRotatedProfile,
  relativeMajorTonic,
  softmax,
  KRUMHANSL_MAJOR_PROFILE,
  KRUMHANSL_MINOR_PROFILE,
} from "../src/analysis/keyDetection";
import { CHROMA_SIZE } from "../src/analysis/chroma";

/** Build a chroma vector containing only the scale degrees of `tonic` major. */
function majorScaleChroma(tonic: number): Float32Array {
  // Major scale intervals in semitones from tonic: 0 2 4 5 7 9 11
  const degrees = [0, 2, 4, 5, 7, 9, 11];
  const v = new Float32Array(CHROMA_SIZE);
  for (const d of degrees) {
    v[(tonic + d) % CHROMA_SIZE] = 1 / degrees.length;
  }
  return v;
}

/** Build a chroma vector containing only the scale degrees of `tonic` natural minor. */
function minorScaleChroma(tonic: number): Float32Array {
  // Natural minor intervals from tonic: 0 2 3 5 7 8 10
  const degrees = [0, 2, 3, 5, 7, 8, 10];
  const v = new Float32Array(CHROMA_SIZE);
  for (const d of degrees) {
    v[(tonic + d) % CHROMA_SIZE] = 1 / degrees.length;
  }
  return v;
}

/** Build a chroma vector that matches a rotated profile (sums to 1). */
function profileChroma(tonic: number, profile: readonly number[]): Float32Array {
  const v = new Float32Array(CHROMA_SIZE);
  let sum = 0;
  for (let i = 0; i < CHROMA_SIZE; i++) {
    const profileIdx = (i - tonic + CHROMA_SIZE) % CHROMA_SIZE;
    v[i] = profile[profileIdx];
    sum += v[i];
  }
  for (let i = 0; i < CHROMA_SIZE; i++) v[i] /= sum;
  return v;
}

describe("pearsonAgainstRotatedProfile", () => {
  it("returns 1 when chroma exactly matches the rotated major profile", () => {
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      const chroma = profileChroma(tonic, KRUMHANSL_MAJOR_PROFILE);
      expect(pearsonAgainstRotatedProfile(chroma, tonic, "maj")).toBeCloseTo(1, 6);
    }
  });

  it("returns 1 when chroma exactly matches the rotated minor profile", () => {
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      const chroma = profileChroma(tonic, KRUMHANSL_MINOR_PROFILE);
      expect(pearsonAgainstRotatedProfile(chroma, tonic, "min")).toBeCloseTo(1, 6);
    }
  });

  it("returns 0 for a flat (uniform) chroma", () => {
    const flat = new Float32Array(CHROMA_SIZE).fill(1 / CHROMA_SIZE);
    expect(pearsonAgainstRotatedProfile(flat, 0, "maj")).toBeCloseTo(0, 6);
    expect(pearsonAgainstRotatedProfile(flat, 0, "min")).toBeCloseTo(0, 6);
  });
});

describe("detectKey (24 keys)", () => {
  it("returns exactly 24 ranked entries (12 major + 12 minor)", () => {
    const scores = detectKey(majorScaleChroma(0));
    expect(scores).toHaveLength(24);
    expect(scores.filter((s) => s.mode === "maj")).toHaveLength(12);
    expect(scores.filter((s) => s.mode === "min")).toHaveLength(12);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1].probability).toBeGreaterThanOrEqual(scores[i].probability);
    }
  });

  it("probabilities sum to 1 over 24 candidates", () => {
    const scores = detectKey(majorScaleChroma(0));
    const sum = scores.reduce((a, k) => a + k.probability, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("major-scale chroma → top-1 is the matching major key", () => {
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      const scores = detectKey(majorScaleChroma(tonic));
      expect(scores[0].tonic).toBe(tonic);
      expect(scores[0].mode).toBe("maj");
    }
  });

  it("tonic-emphasized minor chroma → top-1 is the matching minor key", () => {
    // A *uniformly-weighted* minor scale chroma is mathematically ambiguous
    // with its relative major (same 7 pitch classes, KK_MAJOR's variance is
    // actually slightly larger so it can win). Real music isn't uniform: the
    // tonic, third, and fifth are sounded much more often than the other
    // scale degrees. Here we apply a triad-heavy weighting to disambiguate.
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      const chroma = minorScaleChroma(tonic);
      // Boost the tonic triad (root, minor third, fifth).
      chroma[tonic] += 0.5;
      chroma[(tonic + 3) % CHROMA_SIZE] += 0.3;
      chroma[(tonic + 7) % CHROMA_SIZE] += 0.3;
      const scores = detectKey(chroma);
      expect(scores[0].tonic, `minor scale tonic ${tonic}`).toBe(tonic);
      expect(scores[0].mode).toBe("min");
    }
  });

  it("unweighted minor scale chroma → top-1 is at least related (minor or relative major)", () => {
    // Documents the known KK ambiguity: with a fully uniform in-scale weight,
    // the relative major can win on variance grounds.
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      const scores = detectKey(minorScaleChroma(tonic));
      const relMaj = (tonic + 3) % CHROMA_SIZE;
      const top = scores[0];
      const acceptable =
        (top.mode === "min" && top.tonic === tonic) || (top.mode === "maj" && top.tonic === relMaj);
      expect(
        acceptable,
        `tonic ${tonic}: expected ${tonic}min or ${relMaj}maj, got ${top.name}`,
      ).toBe(true);
    }
  });

  it("name fields are well-formed", () => {
    const scores = detectKey(majorScaleChroma(0));
    const c = scores.find((s) => s.tonic === 0 && s.mode === "maj");
    const am = scores.find((s) => s.tonic === 9 && s.mode === "min");
    expect(c?.name).toBe("C major");
    expect(c?.shortName).toBe("C");
    expect(am?.name).toBe("A minor");
    expect(am?.shortName).toBe("Am");
  });

  it("rejects chromas with wrong length", () => {
    expect(() => detectKey(new Float32Array(11))).toThrow();
  });
});

describe("detectMajorKey (filtered + renormalized)", () => {
  it("returns 12 ranked majors", () => {
    const scores = detectMajorKey(majorScaleChroma(0));
    expect(scores).toHaveLength(12);
    expect(scores.every((s) => s.mode === "maj")).toBe(true);
  });

  it("probabilities sum to 1 over the 12 majors", () => {
    const scores = detectMajorKey(majorScaleChroma(5));
    const sum = scores.reduce((a, k) => a + k.probability, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("flat chroma → ~uniform across the 12 majors", () => {
    const flat = new Float32Array(CHROMA_SIZE).fill(1 / CHROMA_SIZE);
    const scores = detectMajorKey(flat);
    for (const k of scores) {
      expect(k.probability).toBeCloseTo(1 / 12, 2);
    }
  });

  it("recognizes the canonical pop progression I–V–vi–IV in C as C major", () => {
    // Aggregated pitch-class counts for C–G–Am–F:
    //   C(0)=3  D(2)=1  E(4)=2  F(5)=1  G(7)=2  A(9)=2  B(11)=1
    const chroma = new Float32Array(CHROMA_SIZE);
    chroma[0] = 3;
    chroma[2] = 1;
    chroma[4] = 2;
    chroma[5] = 1;
    chroma[7] = 2;
    chroma[9] = 2;
    chroma[11] = 1;
    const scores = detectMajorKey(chroma);
    expect(scores[0].tonic).toBe(0); // C major
  });
});

describe("relativeMajorTonic", () => {
  it("Am → C", () => {
    expect(relativeMajorTonic(9)).toBe(0);
  });
  it("Em → G", () => {
    expect(relativeMajorTonic(4)).toBe(7);
  });
  it("Bm → D", () => {
    expect(relativeMajorTonic(11)).toBe(2);
  });
  it("F#m → A", () => {
    expect(relativeMajorTonic(6)).toBe(9);
  });
});

describe("softmax", () => {
  it("returns a uniform distribution for all-equal inputs", () => {
    const p = softmax([0.5, 0.5, 0.5, 0.5], 1);
    for (const x of p) expect(x).toBeCloseTo(0.25, 6);
  });

  it("produces a valid distribution", () => {
    const p = softmax([0.1, 0.4, 0.2, 0.9], 0.3);
    const sum = p.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(Math.max(...p)).toBe(p[3]);
  });

  it("lower temperature peaks more sharply", () => {
    const values = [0, 0, 0, 1];
    const cold = softmax(values, 0.05);
    const warm = softmax(values, 1);
    expect(cold[3]).toBeGreaterThan(warm[3]);
  });
});
