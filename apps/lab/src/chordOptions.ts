/**
 * The lab's chord vocabulary: which qualities the detector ranks, and the
 * chord sets the games offer for each. The extended sets showcase the
 * opt-in qualities of `detectChord`; the SDK only ships the triad pools.
 */
import { CHORD_QUALITIES, TRIAD_QUALITIES, type ChordQuality } from "@audiolab/core";
import type { ChordRef } from "@audiolab/core/games";
import { DEFAULT_CHORD_GAME_POOLS, type ChordGamePool } from "@audiolab/react";

export type Vocabulary = "triads" | "sevenths" | "all";

export const VOCABULARIES: Readonly<
  Record<Vocabulary, { label: string; qualities: readonly ChordQuality[] }>
> = {
  triads: { label: "Major and minor triads", qualities: TRIAD_QUALITIES },
  sevenths: {
    label: "Triads and sevenths (7, maj7, m7)",
    qualities: ["maj", "min", "dom7", "maj7", "min7"],
  },
  all: { label: "Every quality (7ths, 6ths, sus, dim)", qualities: CHORD_QUALITIES },
};

/**
 * More candidates spread the chord scores: with the extended sets the
 * synthetic guitar has 10 % of its takes under 0.15 (README, "Extended
 * chord qualities"), so the games accept a lower top-1 score.
 */
export function minChordProbability(vocabulary: Vocabulary): number {
  return vocabulary === "triads" ? 0.18 : 0.12;
}

const c = (root: number, quality: ChordQuality): ChordRef => ({ root, quality });

const EXTENDED_POOLS: readonly ChordGamePool[] = [
  {
    id: "open-sevenths",
    label: "Open dominant sevenths (guitar)",
    chords: [c(4, "dom7"), c(9, "dom7"), c(2, "dom7"), c(11, "dom7"), c(7, "dom7"), c(0, "dom7")],
  },
  {
    id: "sevenths-mix",
    label: "Sevenths mix: 7, maj7, m7",
    chords: [c(0, "maj7"), c(5, "maj7"), c(9, "min7"), c(4, "min7"), c(2, "min7"), c(7, "dom7")],
  },
  {
    id: "neighbours",
    label: "Triads and their sevenths (E / E7, A / A7…)",
    chords: [c(4, "maj"), c(4, "dom7"), c(9, "maj"), c(9, "dom7"), c(9, "min"), c(9, "min7")],
  },
  {
    id: "suspended",
    label: "Suspended: sus2 and sus4",
    chords: [c(9, "sus2"), c(9, "sus4"), c(2, "sus2"), c(2, "sus4"), c(4, "sus4")],
  },
];

/** The built-in pools, then the extended ones the vocabulary can detect. */
export function chordGamePools(vocabulary: Vocabulary): readonly ChordGamePool[] {
  const enabled = new Set(VOCABULARIES[vocabulary].qualities);
  const extended = EXTENDED_POOLS.filter((pool) =>
    pool.chords.every((chord) => enabled.has(chord.quality)),
  );
  return [...DEFAULT_CHORD_GAME_POOLS, ...extended];
}

/** Wolf Jumper bonus chords: the default ones, plus open sevenths when detectable. */
export function wolfBonusChords(vocabulary: Vocabulary): readonly ChordRef[] | undefined {
  if (vocabulary === "triads") return undefined;
  return [
    c(0, "maj"),
    c(7, "maj"),
    c(2, "maj"),
    c(9, "min"),
    c(4, "min"),
    c(4, "dom7"),
    c(9, "dom7"),
  ];
}
