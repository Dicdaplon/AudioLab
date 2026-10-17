/**
 * Chord detection via template matching on chroma.
 *
 * For each candidate chord we define a 12-D binary template (1 on the chord
 * tones, 0 elsewhere), then score it against the observed chroma with cosine
 * similarity. Scores are converted to probabilities by softmax.
 *
 * By default only the 24 major and minor triads are candidates. Callers can
 * enable the other qualities (sevenths, suspended, sixths, diminished) with
 * `detectChord(chroma, { qualities })`. Two refinements keep the extended
 * set usable:
 *
 *   - Each quality carries a bias subtracted from its similarity before
 *     ranking (`CHORD_QUALITY_BIAS`, overridable per call). It is the knob
 *     for a triad with a faint extra pitch class (a guitar string puts some
 *     energy in the minor-seventh bin: its 7th harmonic is 31 cents flat of
 *     it) that should stay a triad.
 *   - Some chords share their pitch classes (C6 = Am7, Cm6 = Am7b5, and
 *     every sus2 is the sus4 of the note a fifth up: Asus2 = Esus4, Dsus2 =
 *     Asus4). Only one reading of a pitch set is scored, so the probability
 *     is not split between two names for the same notes: the one whose root
 *     is the strongest pitch class (a guitar bass and its octaves weigh on
 *     the root), then the quality listed first in `qualities`.
 *
 * Reference:
 *   Fujishima, T. (1999). Realtime chord recognition of musical sound:
 *   A system using common Lisp music. ICMC.
 */

import { CHROMA_SIZE } from "./chroma";
import { softmax } from "./math";
import { NOTE_NAMES } from "../utils/notes";

export type ChordQuality =
  "maj" | "min" | "dom7" | "maj7" | "min7" | "sus2" | "sus4" | "maj6" | "min6" | "dim" | "min7b5";

/** Every quality, in the default order (which also breaks pitch-set ties). */
export const CHORD_QUALITIES: readonly ChordQuality[] = [
  "maj",
  "min",
  "dom7",
  "maj7",
  "min7",
  "sus2",
  "sus4",
  "maj6",
  "min6",
  "dim",
  "min7b5",
];

/** The default candidate set: major and minor triads. */
export const TRIAD_QUALITIES: readonly ChordQuality[] = ["maj", "min"];

/** Semitone offsets from the root for each quality. */
export const CHORD_QUALITY_INTERVALS: Readonly<Record<ChordQuality, readonly number[]>> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj6: [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
  dim: [0, 3, 6],
  min7b5: [0, 3, 6, 10],
};

/**
 * Similarity penalty per quality, subtracted before ranking. Zero for the
 * major and minor triads, so the default output is unchanged. The other
 * values come from the synthetic guitar sweep (`npm run measure:chords`):
 * on open voicings a penalty on the four-note chords only lost sevenths
 * (no triad was ever read as a seventh), while one on the diminished
 * chords stopped A7 and D7 from reading as C#dim and F#dim. Raise the
 * four-note values if real recordings show triads turning into sevenths.
 */
export const CHORD_QUALITY_BIAS: Readonly<Record<ChordQuality, number>> = {
  maj: 0,
  min: 0,
  dom7: 0,
  maj7: 0,
  min7: 0,
  sus2: 0,
  sus4: 0,
  maj6: 0,
  min6: 0,
  dim: 0.03,
  min7b5: 0.03,
};

const QUALITY_SUFFIX: Readonly<Record<ChordQuality, string>> = {
  maj: "",
  min: "m",
  dom7: "7",
  maj7: "maj7",
  min7: "m7",
  sus2: "sus2",
  sus4: "sus4",
  maj6: "6",
  min6: "m6",
  dim: "dim",
  min7b5: "m7b5",
};

/** The three-note chord a quality is built on. */
export type BaseTriad = "maj" | "min" | "dim" | "sus2" | "sus4";

const BASE_TRIAD: Readonly<Record<ChordQuality, BaseTriad>> = {
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
};

/** E7 → maj, Am7 → min, Bm7b5 → dim; a triad is its own base. */
export function baseTriad(quality: ChordQuality): BaseTriad {
  return BASE_TRIAD[quality];
}

export function isChordQuality(value: string): value is ChordQuality {
  return Object.prototype.hasOwnProperty.call(CHORD_QUALITY_INTERVALS, value);
}

/** Sorted pitch classes of a chord: C7 → [0, 4, 7, 10]. */
export function chordPitchClasses(root: number, quality: ChordQuality): number[] {
  return CHORD_QUALITY_INTERVALS[quality]
    .map((i) => (root + i) % CHROMA_SIZE)
    .sort((a, b) => a - b);
}

export interface ChordTemplate {
  /** Root pitch class (0 = C, ..., 11 = B). */
  root: number;
  /** Chord quality. */
  quality: ChordQuality;
  /** Display name, e.g. "C", "F#m", "E7". */
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
  /**
   * Softmax (τ = 0.1 by default) of the biased similarities of the enabled
   * candidates: a ranking score summing to 1. More candidates spread it
   * thinner, so a threshold tuned for the 24 triads is too high for the
   * extended set.
   */
  probability: number;
}

function buildTemplate(root: number, quality: ChordQuality): Float32Array {
  const t = new Float32Array(CHROMA_SIZE);
  for (const interval of CHORD_QUALITY_INTERVALS[quality]) {
    t[(root + interval) % CHROMA_SIZE] = 1;
  }
  return t;
}

/** Chord symbol with English note names: "C", "F#m", "E7", "Bm7b5". */
export function chordName(root: number, quality: ChordQuality): string {
  return `${NOTE_NAMES[root]}${QUALITY_SUFFIX[quality]}`;
}

function templatesFor(qualities: readonly ChordQuality[]): ChordTemplate[] {
  const templates: ChordTemplate[] = [];
  for (const quality of qualities) {
    for (let root = 0; root < CHROMA_SIZE; root++) {
      templates.push({
        root,
        quality,
        name: chordName(root, quality),
        template: buildTemplate(root, quality),
      });
    }
  }
  return templates;
}

/** The 24 chord templates: 12 majors followed by 12 minors. */
export const CHORD_TEMPLATES: readonly ChordTemplate[] = templatesFor(TRIAD_QUALITIES);

interface CandidateSet {
  templates: readonly ChordTemplate[];
  /** Indices into `templates`, one group per distinct pitch set, in listing order. */
  groups: readonly (readonly number[])[];
}

function candidateSet(templates: readonly ChordTemplate[]): CandidateSet {
  const byPitchSet = new Map<string, number[]>();
  templates.forEach((t, i) => {
    const pitchSet = chordPitchClasses(t.root, t.quality).join(",");
    const group = byPitchSet.get(pitchSet);
    if (group) group.push(i);
    else byPitchSet.set(pitchSet, [i]);
  });
  return { templates, groups: [...byPitchSet.values()] };
}

const candidateCache = new Map<string, CandidateSet>([
  [TRIAD_QUALITIES.join(","), candidateSet(CHORD_TEMPLATES)],
]);

function candidatesFor(qualities: readonly ChordQuality[]): CandidateSet {
  const id = qualities.join(",");
  let set = candidateCache.get(id);
  if (!set) {
    if (qualities.length === 0) throw new Error("chord qualities: the list is empty");
    for (const q of qualities) {
      if (!isChordQuality(q)) throw new Error(`chord qualities: unknown quality "${q}"`);
    }
    set = candidateSet(templatesFor(qualities));
    candidateCache.set(id, set);
  }
  return set;
}

/**
 * Templates for the given qualities: roots 0..11 for each quality, in the
 * order given, including the chords that share a pitch set (`detectChord`
 * scores one reading of each). Throws on an empty list or an unknown
 * quality.
 */
export function chordTemplates(qualities: readonly ChordQuality[]): readonly ChordTemplate[] {
  return candidatesFor(qualities).templates;
}

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

export interface DetectChordOptions {
  /** Candidate qualities, in tie-break order. Default `TRIAD_QUALITIES` (maj, min). */
  qualities?: readonly ChordQuality[];
  /** Softmax temperature on the biased similarities. Default 0.1. */
  temperature?: number;
  /** Overrides of `CHORD_QUALITY_BIAS`, per quality. */
  qualityBias?: Partial<Record<ChordQuality, number>>;
}

/**
 * Score the candidate chord templates against a chroma vector.
 *
 * @param chroma   12-D pitch-class vector (need not be normalized).
 * @param options  Candidate qualities, temperature and bias. A number is
 *                 the temperature (the original signature).
 * @returns        Sorted (descending) array of ChordScore.
 */
export function detectChord(
  chroma: ArrayLike<number>,
  options: number | DetectChordOptions = {},
): ChordScore[] {
  if (chroma.length !== CHROMA_SIZE) {
    throw new Error(`expected chroma of length ${CHROMA_SIZE}, got ${chroma.length}`);
  }
  const opts: DetectChordOptions = typeof options === "number" ? { temperature: options } : options;
  const temperature = opts.temperature ?? 0.1;
  const { templates: all, groups } = candidatesFor(opts.qualities ?? TRIAD_QUALITIES);
  // One reading per pitch set: the strongest root, then the first listed.
  const templates = groups.map((group) => {
    let best = all[group[0]];
    for (const i of group) if (chroma[all[i].root] > chroma[best.root]) best = all[i];
    return best;
  });
  const bias = (q: ChordQuality) => opts.qualityBias?.[q] ?? CHORD_QUALITY_BIAS[q];

  const similarities = templates.map((c) => cosineSimilarity(chroma, c.template));
  const probs = softmax(
    similarities.map((s, i) => s - bias(templates[i].quality)),
    temperature,
  );

  const results: ChordScore[] = templates.map((c, i) => ({
    root: c.root,
    quality: c.quality,
    name: c.name,
    similarity: similarities[i],
    probability: probs[i],
  }));
  results.sort((a, b) => b.probability - a.probability);
  return results;
}
