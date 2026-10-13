/**
 * Scale matching: which scales contain the notes that were played?
 *
 * The input is a 12-bin presence vector (pitch-class weights such as the
 * presence histogram of `TonalityEngine`, or plain 0/1 flags). Every scale
 * of the list is tried on the 12 tonics and the candidates are ranked by
 * inclusion:
 *
 *   1. fewest played notes outside the scale (a scale that holds every
 *      played note comes first);
 *   2. fewest scale notes that were not played;
 *   3. highest weighted coverage: the share of the played weight that
 *      falls inside the scale;
 *   4. the order of the scale list, then the tonic (0..11), so ties are
 *      deterministic (C major pentatonic and A minor pentatonic share
 *      their notes and tie on everything else).
 *
 * `score` is a summary in [0, 1] for display (played weight inside the
 * scale × fraction of the scale that was played); the ranking is the
 * lexicographic order above, not a sort on `score`.
 *
 * Scales are identified by stable ids and interval lists; no display name
 * lives in the engine. `SCALE_NAMES_EN` is a separate map for a UI that
 * wants English labels.
 */

import { CHROMA_SIZE } from "./chroma";

export interface ScaleDefinition {
  /** Stable id, e.g. "major", "minor-pentatonic". */
  id: string;
  /** Semitones above the tonic, ascending, starting with 0. */
  intervals: readonly number[];
}

/**
 * Built-in scales. Ionian is `major` and aeolian is `minor` (the natural
 * minor), so each pitch-class set appears once.
 */
export const SCALES: readonly ScaleDefinition[] = [
  { id: "major", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "minor", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "harmonic-minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: "melodic-minor", intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: "dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: "phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: "lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: "mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: "locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: "major-pentatonic", intervals: [0, 2, 4, 7, 9] },
  { id: "minor-pentatonic", intervals: [0, 3, 5, 7, 10] },
  { id: "blues", intervals: [0, 3, 5, 6, 7, 10] },
];

/** English labels for the built-in scale ids, for UIs that want them. */
export const SCALE_NAMES_EN: Readonly<Record<string, string>> = {
  major: "major",
  minor: "natural minor",
  "harmonic-minor": "harmonic minor",
  "melodic-minor": "melodic minor",
  dorian: "dorian",
  phrygian: "phrygian",
  lydian: "lydian",
  mixolydian: "mixolydian",
  locrian: "locrian",
  "major-pentatonic": "major pentatonic",
  "minor-pentatonic": "minor pentatonic",
  blues: "blues",
};

export interface ScaleMatch {
  scaleId: string;
  /** Tonic pitch class (0 = C, ..., 11 = B). */
  tonic: number;
  /** Pitch classes of the scale, ascending from the tonic. */
  pitchClasses: number[];
  /** Summary in [0, 1]; see the module notes. */
  score: number;
  /** Scale notes that were not played. */
  missing: number[];
  /** Played notes that are not in the scale. */
  outside: number[];
}

export interface MatchScalesOptions {
  /** A pitch class counts as played when its weight is strictly above this. Default 0. */
  threshold?: number;
  /** Keep the first `topN` matches. Default: all. */
  topN?: number;
}

/** Pitch classes of a scale rotated to `tonic`, ascending from the tonic. */
export function scalePitchClasses(scale: ScaleDefinition, tonic: number): number[] {
  return scale.intervals.map((i) => (((tonic + i) % CHROMA_SIZE) + CHROMA_SIZE) % CHROMA_SIZE);
}

/**
 * Rank `scales` on every tonic against a 12-bin presence vector. Returns an
 * empty list when no pitch class is above the threshold.
 */
export function matchScales(
  presence: ArrayLike<number>,
  scales: readonly ScaleDefinition[] = SCALES,
  options: MatchScalesOptions = {},
): ScaleMatch[] {
  if (presence.length !== CHROMA_SIZE) {
    throw new Error(`expected a presence vector of length ${CHROMA_SIZE}, got ${presence.length}`);
  }
  const threshold = options.threshold ?? 0;

  const played: number[] = [];
  let totalWeight = 0;
  for (let pc = 0; pc < CHROMA_SIZE; pc++) {
    if (presence[pc] > threshold) {
      played.push(pc);
      totalWeight += presence[pc];
    }
  }
  if (played.length === 0) return [];

  interface Candidate extends ScaleMatch {
    order: number;
    insideWeight: number;
  }
  const candidates: Candidate[] = [];
  scales.forEach((scale, order) => {
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      const pitchClasses = scalePitchClasses(scale, tonic);
      const inScale = new Set(pitchClasses);
      const outside = played.filter((pc) => !inScale.has(pc));
      const missing = pitchClasses.filter((pc) => !(presence[pc] > threshold));
      let insideWeight = 0;
      for (const pc of pitchClasses) if (presence[pc] > threshold) insideWeight += presence[pc];
      const inside = insideWeight / totalWeight;
      const coverage = (pitchClasses.length - missing.length) / pitchClasses.length;
      candidates.push({
        scaleId: scale.id,
        tonic,
        pitchClasses,
        score: inside * coverage,
        missing,
        outside,
        order,
        insideWeight: inside,
      });
    }
  });

  candidates.sort(
    (a, b) =>
      a.outside.length - b.outside.length ||
      a.missing.length - b.missing.length ||
      b.insideWeight - a.insideWeight ||
      a.order - b.order ||
      a.tonic - b.tonic,
  );

  const kept = options.topN === undefined ? candidates : candidates.slice(0, options.topN);
  return kept.map(({ scaleId, tonic, pitchClasses, score, missing, outside }) => ({
    scaleId,
    tonic,
    pitchClasses,
    score,
    missing,
    outside,
  }));
}
