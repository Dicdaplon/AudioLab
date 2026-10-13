/** Adapters from analysis scores to what the readouts and ranked lists show. */

import { type ChordScore, type KeyScore } from "@audiolab/core";
import type { RankRow } from "../components/RankList";

export function chordRows(chords: ChordScore[], topN: number): RankRow[] {
  return chords.slice(0, topN).map((c) => ({
    key: `${c.root}-${c.quality}`,
    name: c.name,
    mode: c.quality,
    probability: c.probability,
    stat: `cos=${c.similarity.toFixed(2)}`,
  }));
}

export function keyRows(keys: KeyScore[], topN: number): RankRow[] {
  return keys.slice(0, topN).map((k) => ({
    key: `${k.tonic}-${k.mode}`,
    name: k.name,
    mode: k.mode,
    probability: k.probability,
    stat: `r=${k.correlation.toFixed(2)}`,
  }));
}

/** "F# minor" → tonic "F#" and the mode word "minor". */
export function splitKeyName(name: string): { tonic: string; mode: string } {
  const space = name.indexOf(" ");
  if (space < 0) return { tonic: name, mode: "" };
  return { tonic: name.slice(0, space), mode: name.slice(space + 1) };
}
