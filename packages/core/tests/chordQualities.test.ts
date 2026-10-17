import { describe, expect, it } from "vitest";

import {
  CHORD_QUALITIES,
  CHORD_QUALITY_INTERVALS,
  CHORD_TEMPLATES,
  baseTriad,
  chordName,
  chordPitchClasses,
  chordTemplates,
  cosineSimilarity,
  detectChord,
  isChordQuality,
  type ChordQuality,
} from "../src/analysis/chordDetection";
import { CHROMA_SIZE } from "../src/analysis/chroma";
import { softmax } from "../src/analysis/math";
import { mulberry32 } from "./helpers/synth";

function chroma(pitchClasses: readonly number[], weights?: readonly number[]): Float32Array {
  const v = new Float32Array(CHROMA_SIZE);
  pitchClasses.forEach((pc, i) => (v[pc] += weights?.[i] ?? 1));
  return v;
}

/** The detector as it was before the extended qualities (24 triads, plain softmax). */
function legacyDetectChord(c: ArrayLike<number>, temperature = 0.1) {
  const sims = CHORD_TEMPLATES.map((t) => cosineSimilarity(c, t.template));
  const probs = softmax(sims, temperature);
  return CHORD_TEMPLATES.map((t, i) => ({
    root: t.root,
    quality: t.quality,
    name: t.name,
    similarity: sims[i],
    probability: probs[i],
  })).sort((a, b) => b.probability - a.probability);
}

describe("default output", () => {
  it("is identical to the triad-only detector, whatever the call form", () => {
    const rand = mulberry32(7);
    for (let n = 0; n < 200; n++) {
      const c = new Float32Array(CHROMA_SIZE).map(() => rand());
      const legacy = legacyDetectChord(c);
      expect(detectChord(c)).toEqual(legacy);
      expect(detectChord(c, 0.1)).toEqual(legacy);
      expect(detectChord(c, {})).toEqual(legacy);
      expect(detectChord(c, { qualities: ["maj", "min"] })).toEqual(legacy);
    }
    const c = chroma([0, 4, 7]);
    expect(detectChord(c, 0.3)).toEqual(legacyDetectChord(c, 0.3));
    expect(detectChord(c, { temperature: 0.3 })).toEqual(legacyDetectChord(c, 0.3));
  });
});

describe("extended qualities", () => {
  it("identifies every quality on every root from a clean chroma", () => {
    for (const quality of CHORD_QUALITIES) {
      for (let root = 0; root < 12; root++) {
        const [top] = detectChord(chroma(chordPitchClasses(root, quality)), {
          qualities: [quality, ...CHORD_QUALITIES.filter((q) => q !== quality)],
        });
        expect({ root: top.root, quality: top.quality }).toEqual({ root, quality });
      }
    }
  });

  it("scores one reading per pitch set, the quality listed first", () => {
    const c6 = chroma(chordPitchClasses(0, "maj6"));
    const sixFirst = detectChord(c6, { qualities: ["maj6", "min7"] });
    expect(sixFirst).toHaveLength(12);
    expect(sixFirst[0]).toMatchObject({ root: 0, quality: "maj6", name: "C6" });
    const sevenFirst = detectChord(c6, { qualities: ["min7", "maj6"] });
    expect(sevenFirst[0]).toMatchObject({ root: 9, quality: "min7", name: "Am7" });

    const all = chordTemplates(CHORD_QUALITIES);
    const sets = new Set(all.map((t) => chordPitchClasses(t.root, t.quality).join(",")));
    expect(sets.size).toBe(all.length);
    // 132 chords minus the three collision families (6/m7, m6/m7b5, sus2/sus4).
    expect(all).toHaveLength(132 - 36);
  });

  it("keeps a triad with a faint seventh a triad, and names a real seventh", () => {
    const qualities = ["maj", "min", "dom7"] as const;
    const faint = detectChord(chroma([4, 8, 11, 2], [1, 1, 1, 0.3]), { qualities });
    expect(faint[0]).toMatchObject({ name: "E" });
    const strong = detectChord(chroma([4, 8, 11, 2], [1, 1, 1, 0.8]), { qualities });
    expect(strong[0]).toMatchObject({ name: "E7" });
  });

  it("lets the caller override the bias", () => {
    const c = chroma([4, 8, 11, 2], [1, 1, 1, 0.8]);
    const top = detectChord(c, { qualities: ["maj", "dom7"], qualityBias: { dom7: 0.5 } })[0];
    expect(top.name).toBe("E");
    expect(top.similarity).toBeCloseTo(cosineSimilarity(c, chroma([4, 8, 11])), 6);
  });

  it("rejects an empty or unknown quality list", () => {
    expect(() => detectChord(chroma([0, 4, 7]), { qualities: [] })).toThrow(/empty/);
    expect(() =>
      detectChord(chroma([0, 4, 7]), { qualities: ["maj", "aug" as ChordQuality] }),
    ).toThrow(/unknown quality "aug"/);
  });

  it("probabilities sum to 1 over the enabled candidates", () => {
    const scores = detectChord(chroma([2, 6, 9, 0]), { qualities: CHORD_QUALITIES });
    expect(scores.reduce((s, c) => s + c.probability, 0)).toBeCloseTo(1, 6);
  });
});

describe("quality helpers", () => {
  it("names every quality", () => {
    const names = CHORD_QUALITIES.map((q) => chordName(4, q));
    expect(names).toEqual([
      "E",
      "Em",
      "E7",
      "Emaj7",
      "Em7",
      "Esus2",
      "Esus4",
      "E6",
      "Em6",
      "Edim",
      "Em7b5",
    ]);
  });

  it("maps each quality to its base triad", () => {
    const bases = Object.fromEntries(CHORD_QUALITIES.map((q) => [q, baseTriad(q)]));
    expect(bases).toEqual({
      maj: "maj",
      min: "min",
      dom7: "maj",
      maj7: "maj",
      min7: "min",
      sus2: "sus2",
      sus4: "sus4",
      maj6: "maj",
      min6: "min",
      dim: "dim",
      min7b5: "dim",
    });
    for (const q of CHORD_QUALITIES) {
      const triad = CHORD_QUALITY_INTERVALS[baseTriad(q)];
      expect(CHORD_QUALITY_INTERVALS[q].slice(0, 3)).toEqual(triad);
    }
  });

  it("lists sorted pitch classes and recognises quality ids", () => {
    expect(chordPitchClasses(9, "dom7")).toEqual([1, 4, 7, 9]);
    expect(isChordQuality("min7b5")).toBe(true);
    expect(isChordQuality("toString")).toBe(false);
  });
});
