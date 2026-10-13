import { describe, it, expect } from "vitest";

import { detectChord, cosineSimilarity, CHORD_TEMPLATES } from "../src/analysis/chordDetection";
import { CHROMA_SIZE } from "../src/analysis/chroma";

/** Build a chroma vector where the listed pitch classes are equally active. */
function chordChroma(pitchClasses: number[]): Float32Array {
  const v = new Float32Array(CHROMA_SIZE);
  for (const pc of pitchClasses) v[pc] = 1 / pitchClasses.length;
  return v;
}

describe("cosineSimilarity", () => {
  it("returns 1 for identical non-zero vectors", () => {
    const a = new Float32Array([1, 0, 0, 1, 0]);
    const b = new Float32Array([1, 0, 0, 1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
  });

  it("returns 0 for orthogonal vectors", () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([0, 1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 10);
  });

  it("returns 0 when either vector is zero", () => {
    const a = new Float32Array([0, 0, 0]);
    const b = new Float32Array([1, 2, 3]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("is scale-invariant", () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([2, 4, 6]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
  });

  it("throws on length mismatch", () => {
    expect(() => cosineSimilarity(new Float32Array(3), new Float32Array(4))).toThrow();
  });
});

describe("CHORD_TEMPLATES", () => {
  it("contains exactly 24 templates (12 major + 12 minor)", () => {
    expect(CHORD_TEMPLATES).toHaveLength(24);
    const majors = CHORD_TEMPLATES.filter((c) => c.quality === "maj");
    const minors = CHORD_TEMPLATES.filter((c) => c.quality === "min");
    expect(majors).toHaveLength(12);
    expect(minors).toHaveLength(12);
  });

  it("each template has exactly 3 active pitch classes", () => {
    for (const c of CHORD_TEMPLATES) {
      const count = c.template.reduce((acc, x) => acc + (x > 0 ? 1 : 0), 0);
      expect(count).toBe(3);
    }
  });

  it("C major template = pitch classes {0, 4, 7}", () => {
    const cmaj = CHORD_TEMPLATES.find((c) => c.name === "C");
    expect(cmaj).toBeDefined();
    expect(Array.from(cmaj!.template)).toEqual([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]);
  });

  it("A minor template = pitch classes {9, 0, 4}", () => {
    const am = CHORD_TEMPLATES.find((c) => c.name === "Am");
    expect(am).toBeDefined();
    expect(Array.from(am!.template)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0]);
  });

  it("display names match expectations", () => {
    const names = CHORD_TEMPLATES.map((c) => c.name);
    expect(names).toContain("C");
    expect(names).toContain("F#");
    expect(names).toContain("Bm");
    expect(names).toContain("C#m");
  });
});

describe("detectChord", () => {
  it("identifies C major from {C, E, G}", () => {
    const scores = detectChord(chordChroma([0, 4, 7]));
    expect(scores[0].name).toBe("C");
    expect(scores[0].quality).toBe("maj");
  });

  it("identifies A minor from {A, C, E}", () => {
    const scores = detectChord(chordChroma([9, 0, 4]));
    expect(scores[0].name).toBe("Am");
    expect(scores[0].quality).toBe("min");
  });

  it("identifies every major chord by transposition", () => {
    for (let root = 0; root < CHROMA_SIZE; root++) {
      const chroma = chordChroma([root, (root + 4) % 12, (root + 7) % 12]);
      const scores = detectChord(chroma);
      expect(scores[0].root).toBe(root);
      expect(scores[0].quality).toBe("maj");
    }
  });

  it("identifies every minor chord by transposition", () => {
    for (let root = 0; root < CHROMA_SIZE; root++) {
      const chroma = chordChroma([root, (root + 3) % 12, (root + 7) % 12]);
      const scores = detectChord(chroma);
      expect(scores[0].root).toBe(root);
      expect(scores[0].quality).toBe("min");
    }
  });

  it("returns 24 ranked entries that sum to 1 in probability", () => {
    const scores = detectChord(chordChroma([0, 4, 7]));
    expect(scores).toHaveLength(24);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1].probability).toBeGreaterThanOrEqual(scores[i].probability);
    }
    const sum = scores.reduce((a, s) => a + s.probability, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("top minor for a C-major chord chroma shares 2 of 3 notes with {C,E,G}", () => {
    // C major triad chroma = {C, E, G}. Three minor triads share exactly two
    // notes with it: Cm{C, Eb, G}, Em{E, G, B}, Am{A, C, E}. Their cosine
    // similarities are equal, so the top minor among them is determined by
    // template ordering (C minor wins because root C comes first). We only
    // assert that the top minor is one of these three two-overlap candidates.
    const cmajChroma = chordChroma([0, 4, 7]);
    const scores = detectChord(cmajChroma);
    const topMinor = scores.find((s) => s.quality === "min");
    expect(topMinor).toBeDefined();
    expect(["Cm", "Em", "Am"]).toContain(topMinor!.name);
  });

  it("rejects chromas with wrong length", () => {
    expect(() => detectChord(new Float32Array(11))).toThrow();
  });

  it("a flat chroma is near-uniform", () => {
    const flat = new Float32Array(CHROMA_SIZE).fill(1 / CHROMA_SIZE);
    const scores = detectChord(flat);
    for (const s of scores) {
      expect(s.probability).toBeCloseTo(1 / 24, 3);
    }
  });
});
