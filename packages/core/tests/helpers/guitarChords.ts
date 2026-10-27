/**
 * Chord confusion on the synthetic guitar: each voicing is strummed with
 * several seeds and noise levels, run through the live path (AnalyserNode
 * emulation → TonalityEngine) and scored on the last frame, i.e. after a
 * full chord window.
 */
import {
  CHORD_QUALITIES,
  TRIAD_QUALITIES,
  type ChordQuality,
} from "../../src/analysis/chordDetection";
import { matchesTarget, type ChordRef } from "../../src/analysis/chordRef";
import { Confusion } from "./confusion";
import { strum, voicingNotes } from "./guitar";
import { CHORD_SECONDS, runLive, SR } from "./liveRig";

export interface Voicing {
  name: string;
  chord: ChordRef;
  shape: string;
}

const v = (name: string, root: number, quality: ChordQuality, shape: string): Voicing => ({
  name,
  chord: { root, quality },
  shape,
});

/** Open-position voicings: the neighbours the MusicalBook lessons mix up, and a few more. */
export const GUITAR_VOICINGS: readonly Voicing[] = [
  v("E", 4, "maj", "022100"),
  v("E7", 4, "dom7", "020100"),
  v("Em", 4, "min", "022000"),
  v("Esus4", 4, "sus4", "022200"),
  v("A", 9, "maj", "x02220"),
  v("A7", 9, "dom7", "x02020"),
  v("Am", 9, "min", "x02210"),
  v("Am7", 9, "min7", "x02010"),
  v("Asus2", 9, "sus2", "x02200"),
  v("Asus4", 9, "sus4", "x02230"),
  v("C", 0, "maj", "x32010"),
  v("Cmaj7", 0, "maj7", "x32000"),
  v("C6", 0, "maj6", "x32213"),
  v("D", 2, "maj", "xx0232"),
  v("D7", 2, "dom7", "xx0212"),
  v("Dm", 2, "min", "xx0231"),
  v("Dsus2", 2, "sus2", "xx0230"),
  v("Dsus4", 2, "sus4", "xx0233"),
  v("G", 7, "maj", "320003"),
  v("B7", 11, "dom7", "x21202"),
];

/** The candidate sets the measurements compare. */
export const QUALITY_SETS: Readonly<Record<string, readonly ChordQuality[]>> = {
  triads: TRIAD_QUALITIES,
  sevenths: ["maj", "min", "dom7", "maj7", "min7"],
  all: CHORD_QUALITIES,
};

export interface ChordMeasureOptions {
  qualities: readonly ChordQuality[];
  qualityBias?: Partial<Record<ChordQuality, number>>;
  seeds?: readonly number[];
  snrDb?: readonly number[];
}

export interface ChordMeasurement {
  confusion: Confusion;
  /** Top-1 probability of every take. */
  topProbabilities: number[];
}

/** Outcome counters: `exact` and `triad` are the two `matchesTarget` policies. */
export function guitarChordConfusion(
  voicings: readonly Voicing[],
  { qualities, qualityBias, seeds = [1, 2, 3, 4], snrDb = [30, 20] }: ChordMeasureOptions,
): ChordMeasurement {
  const confusion = new Confusion();
  const topProbabilities: number[] = [];
  for (const voicing of voicings) {
    for (const seed of seeds) {
      for (const snr of snrDb) {
        const signal = strum(voicingNotes(voicing.shape), {
          sampleRate: SR,
          seconds: CHORD_SECONDS,
          seed,
          snrDb: snr,
        });
        const frame = runLive(signal, { chordQualities: qualities, chordQualityBias: qualityBias });
        const top = frame.chords[0];
        confusion.add(voicing.name, top.name, {
          exact: matchesTarget(top, voicing.chord),
          triad: matchesTarget(top, voicing.chord, { accept: "triad" }),
        });
        topProbabilities.push(top.probability);
      }
    }
  }
  return { confusion, topProbabilities };
}
