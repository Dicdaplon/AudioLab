/**
 * Chord detection via template matching on chroma.
 *
 * For each candidate chord we define a 12-D binary template (1 on the chord
 * tones, 0 elsewhere), then score it against the observed chroma with cosine
 * similarity. Scores are converted to probabilities by softmax.
 *
 * Reference:
 *   Fujishima, T. (1999). Realtime chord recognition of musical sound:
 *   A system using common Lisp music. ICMC.
 */

import { CHROMA_SIZE } from "./chroma";
import { softmax } from "./math";
import { NOTE_NAMES } from "../utils/notes";

export type ChordQuality = "maj" | "min";

export interface ChordTemplate {
  /** Root pitch class (0 = C, ..., 11 = B). */
  root: number;
  /** Chord quality. */
  quality: ChordQuality;
  /** Display name, e.g. "C", "F#m". */
  name: string;
  /** 12-D binary template. */
  template: Float32Array;
}

export interface ChordScore {
  root: number;
  quality: ChordQuality;
  name: string;
  /** Cosine similarity, in [0, 1] for a non-negative chroma and binary templates. */
  similarity: number;
  /** Softmax (τ = 0.1) of the 24 similarities: a ranking score summing to 1. */
  probability: number;
}

/** Semitone offsets from the root for each quality. */
const QUALITY_INTERVALS: Record<ChordQuality, readonly number[]> = {
  maj: [0, 4, 7], // root, major third, perfect fifth
  min: [0, 3, 7], // root, minor third, perfect fifth
};

function buildTemplate(root: number, quality: ChordQuality): Float32Array {
  const t = new Float32Array(CHROMA_SIZE);
  for (const interval of QUALITY_INTERVALS[quality]) {
    t[(root + interval) % CHROMA_SIZE] = 1;
  }
  return t;
}

function displayName(root: number, quality: ChordQuality): string {
  return quality === "maj" ? NOTE_NAMES[root] : `${NOTE_NAMES[root]}m`;
}

/** The 24 chord templates: 12 majors followed by 12 minors. */
export const CHORD_TEMPLATES: readonly ChordTemplate[] = (() => {
  const templates: ChordTemplate[] = [];
  for (const quality of ["maj", "min"] as const) {
    for (let root = 0; root < CHROMA_SIZE; root++) {
      templates.push({
        root,
        quality,
        name: displayName(root, quality),
        template: buildTemplate(root, quality),
      });
    }
  }
  return templates;
})();

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) {
    throw new Error(`length mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const den = Math.sqrt(normA) * Math.sqrt(normB);
  if (den === 0) return 0;
  return dot / den;
}

/**
 * Score the 24 chord templates against a chroma vector.
 *
 * @param chroma       12-D pitch-class vector (need not be normalized).
 * @param temperature  Softmax temperature on similarities. Default 0.1.
 * @returns            Sorted (descending) array of ChordScore.
 */
export function detectChord(chroma: ArrayLike<number>, temperature = 0.1): ChordScore[] {
  if (chroma.length !== CHROMA_SIZE) {
    throw new Error(`expected chroma of length ${CHROMA_SIZE}, got ${chroma.length}`);
  }

  const similarities = CHORD_TEMPLATES.map((c) => cosineSimilarity(chroma, c.template));
  const probs = softmax(similarities, temperature);

  const results: ChordScore[] = CHORD_TEMPLATES.map((c, i) => ({
    root: c.root,
    quality: c.quality,
    name: c.name,
    similarity: similarities[i],
    probability: probs[i],
  }));
  results.sort((a, b) => b.probability - a.probability);
  return results;
}
