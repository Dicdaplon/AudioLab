/**
 * Key blend: one key ranking from several detectors, and the relative key.
 *
 * A major key and its relative minor (C major / A minor) use the same seven
 * notes, so every note-based detector hesitates between them. The blend
 * averages the ranking scores of the energy profile (Krumhansl) and of the
 * presence histogram, which fail differently, then lets the chords decide
 * the mode: time spent on the tonic triad (C major vs A minor chord) is the
 * clearest sign of which of the two is home. A display can then show the
 * winner with its relative, which is always right even when the mode is not.
 */

import type { ChordQuality } from "../chordDetection";
import type { KeyMode, KeyScore } from "../keyDetection";
import type { ChordSegment } from "./chordChanges";

export interface KeyBlendOptions {
  /** Weight of the energy-profile ranking. Default 0.5. */
  energyWeight?: number;
  /** Weight of the presence ranking. Default 0.5. */
  presenceWeight?: number;
  /**
   * Weight of the tonic-chord evidence, shared between a key and its
   * relative: at 0.3, a song that sits on Am all the time moves 0.3 of score
   * from C major to A minor. Default 0.3.
   */
  chordWeight?: number;
}

export const KEY_BLEND_DEFAULTS: Required<KeyBlendOptions> = {
  energyWeight: 0.5,
  presenceWeight: 0.5,
  chordWeight: 0.3,
};

const MINORISH: ReadonlySet<ChordQuality> = new Set(["min", "min7", "min6", "dim", "min7b5"]);
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

function index(tonic: number, mode: KeyMode): number {
  return (mode === "min" ? 12 : 0) + mod12(tonic);
}

/** The relative key: A minor for C major, C major for A minor. */
export function relativeKey(tonic: number, mode: KeyMode): { tonic: number; mode: KeyMode } {
  return mode === "maj"
    ? { tonic: mod12(tonic + 9), mode: "min" }
    : { tonic: mod12(tonic + 3), mode: "maj" };
}

/**
 * One ranking from the energy and presence rankings (each sorted or not,
 * either may be empty), with the tonic-chord evidence from a chord history.
 * Scores are the weighted ranking scores (`probability`), renormalised to sum
 * to 1; `correlation` is the energy ranking's, when it has the key.
 */
export function combineKeyRankings(
  energy: readonly KeyScore[],
  presence: readonly KeyScore[],
  chords: readonly ChordSegment[] = [],
  options: KeyBlendOptions = {},
): KeyScore[] {
  const o = { ...KEY_BLEND_DEFAULTS, ...options };
  const score = new Float64Array(24);
  const correlation = new Float64Array(24);
  for (const k of energy) {
    const i = index(k.tonic, k.mode);
    score[i] += o.energyWeight * k.probability;
    correlation[i] = k.correlation;
  }
  for (const k of presence) score[index(k.tonic, k.mode)] += o.presenceWeight * k.probability;

  // Tonic-chord time: move score between each key and its relative, in
  // proportion to how long each one's tonic triad sounded.
  const time = new Float64Array(24);
  for (const seg of chords) {
    const mode: KeyMode = MINORISH.has(seg.chord.quality) ? "min" : "maj";
    time[index(seg.chord.root, mode)] += Math.max(0, seg.end - seg.start);
  }
  if (o.chordWeight > 0) {
    for (let tonic = 0; tonic < 12; tonic++) {
      const major = index(tonic, "maj");
      const minor = index(mod12(tonic + 9), "min");
      const total = time[major] + time[minor];
      if (total <= 0) continue;
      const pair = score[major] + score[minor];
      const shift = o.chordWeight * pair * ((time[minor] - time[major]) / total);
      score[major] = Math.max(0, score[major] - shift / 2);
      score[minor] = Math.max(0, score[minor] + shift / 2);
    }
  }

  const sum = score.reduce((a, b) => a + b, 0) || 1;
  const out: KeyScore[] = [];
  for (let i = 0; i < 24; i++) {
    const tonic = i % 12;
    const mode: KeyMode = i >= 12 ? "min" : "maj";
    out.push({
      tonic,
      mode,
      name: `${NAMES[tonic]} ${mode === "min" ? "minor" : "major"}`,
      shortName: `${NAMES[tonic]}${mode === "min" ? "m" : ""}`,
      correlation: correlation[i],
      probability: score[i] / sum,
    });
  }
  return out.sort((a, b) => b.probability - a.probability);
}
