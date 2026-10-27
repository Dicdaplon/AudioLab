/**
 * The listening methods of `TonalityEngine`, as registries: a const array
 * per option, the type derived from it, the default and a guard (the
 * pattern of `ONSET_METHODS`). Opt-in; the defaults keep the original
 * pipeline. Measurements: docs/ALTERNATIVES.md, docs/BENCHMARKS.md.
 *
 * `CHORD_METHOD_PRESETS` names the chroma + smoothing pairs that were
 * benchmarked together, so a host can offer "the chord method" as one
 * choice and spread the preset into the engine configuration.
 */

/**
 * Chroma front-end. "nearest" (default): each FFT bin to its nearest
 * semitone. "gaussian-log": Gaussian semitone binning and log compression.
 * "cqt": a constant-Q chroma of the latest time samples.
 */
export const CHROMA_METHODS = ["nearest", "gaussian-log", "cqt"] as const;

export type ChromaMethod = (typeof CHROMA_METHODS)[number];

export const DEFAULT_CHROMA_METHOD: ChromaMethod = "nearest";

export function isChromaMethod(value: unknown): value is ChromaMethod {
  return (CHROMA_METHODS as readonly unknown[]).includes(value);
}

/** How the keys are ranked: "profile" (default) or "chords" (the chords found vote). */
export const KEY_METHODS = ["profile", "chords"] as const;

export type KeyMethod = (typeof KEY_METHODS)[number];

export const DEFAULT_KEY_METHOD: KeyMethod = "profile";

export function isKeyMethod(value: unknown): value is KeyMethod {
  return (KEY_METHODS as readonly unknown[]).includes(value);
}

/** How the chord ranking is smoothed: "window" (default, the 1 s mean) or "hmm". */
export const CHORD_SMOOTHINGS = ["window", "hmm"] as const;

export type ChordSmoothing = (typeof CHORD_SMOOTHINGS)[number];

export const DEFAULT_CHORD_SMOOTHING: ChordSmoothing = "window";

export function isChordSmoothing(value: unknown): value is ChordSmoothing {
  return (CHORD_SMOOTHINGS as readonly unknown[]).includes(value);
}

/** The engine options a chord method sets. */
export interface ChordMethodOptions {
  chordSmoothing?: ChordSmoothing;
  chromaMethod?: ChromaMethod;
}

/**
 * The chord methods of the benchmark, as `TonalityEngine` options:
 *
 * - "classic": the original (nearest-bin chroma, 1 s window mean);
 * - "follow": templates per frame, smoothed by the HMM;
 * - "sharper": Gaussian log chroma, then the HMM;
 * - "cqt": constant-Q chroma, then the HMM (feed it `pushTimeDomain`).
 */
export const CHORD_METHOD_PRESETS = {
  classic: {},
  follow: { chordSmoothing: "hmm" },
  sharper: { chordSmoothing: "hmm", chromaMethod: "gaussian-log" },
  cqt: { chordSmoothing: "hmm", chromaMethod: "cqt" },
} as const satisfies Record<string, ChordMethodOptions>;

export type ChordMethodPreset = keyof typeof CHORD_METHOD_PRESETS;

export const DEFAULT_CHORD_METHOD_PRESET: ChordMethodPreset = "classic";

export function isChordMethodPreset(value: unknown): value is ChordMethodPreset {
  return typeof value === "string" && Object.hasOwn(CHORD_METHOD_PRESETS, value);
}
