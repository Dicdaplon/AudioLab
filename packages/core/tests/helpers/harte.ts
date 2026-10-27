/**
 * Chord labels in Harte's syntax ("C#:maj", "Bb:7", "A:hdim7/b3", "N"), the
 * notation of GuitarSet, Isophonics, Billboard and the MIREX evaluations,
 * mapped to AudioLab's chord references.
 *
 * Reference: Harte, Sandler, Abdallah, Gómez, "Symbolic representation of
 * musical chords: a proposed syntax for text annotations", ISMIR 2005.
 */
import type { ChordQuality } from "../../src/analysis/chordDetection";

const ROOTS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const QUALITIES: Record<string, ChordQuality> = {
  maj: "maj",
  min: "min",
  "7": "dom7",
  maj7: "maj7",
  min7: "min7",
  hdim7: "min7b5",
  dim: "dim",
  sus2: "sus2",
  sus4: "sus4",
  maj6: "maj6",
  min6: "min6",
};

export interface HarteChord {
  root: number;
  quality: ChordQuality;
}

/**
 * "C#:maj/5" → { root: 1, quality: "maj" }. The bass after "/" and the
 * extensions in parentheses are dropped; "N", "X" and qualities AudioLab has
 * no template for give null. A bare root ("C") is a major triad.
 */
export function parseHarte(label: string): HarteChord | null {
  const [head] = label.split("/");
  if (head === "N" || head === "X") return null;
  const [rootName, rawQuality = "maj"] = head.split(":");
  const base = ROOTS[rootName[0]];
  if (base === undefined) return null;
  let root = base;
  for (const accidental of rootName.slice(1)) {
    if (accidental === "#") root++;
    else if (accidental === "b") root--;
    else return null;
  }
  const quality = QUALITIES[rawQuality.replace(/\(.*\)$/, "")];
  return quality ? { root: ((root % 12) + 12) % 12, quality } : null;
}

/**
 * The MIREX "majmin" reduction: every chord whose third and fifth make a
 * major or minor triad becomes that triad (G7 → G, Am7 → Am); the rest
 * (diminished, half-diminished, suspended) is left out of the scoring.
 */
export function majMin(chord: HarteChord | null): HarteChord | null {
  if (!chord) return null;
  switch (chord.quality) {
    case "maj":
    case "dom7":
    case "maj7":
    case "maj6":
      return { root: chord.root, quality: "maj" };
    case "min":
    case "min7":
    case "min6":
      return { root: chord.root, quality: "min" };
    default:
      return null;
  }
}

/** "C#:major" → { tonic: 1, mode: "maj" } (GuitarSet's key_mode values). */
export function parseHarteKey(label: string): { tonic: number; mode: "maj" | "min" } | null {
  const [tonicName, mode] = label.split(":");
  const chord = parseHarte(tonicName);
  if (!chord || (mode !== "major" && mode !== "minor")) return null;
  return { tonic: chord.root, mode: mode === "major" ? "maj" : "min" };
}
