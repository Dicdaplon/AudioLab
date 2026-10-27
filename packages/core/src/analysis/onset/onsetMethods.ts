/**
 * Onset detection methods: which detection function and which peak-picking
 * settings `OnsetDetector` (and so `OnsetPipeline`) runs. Opt-in; the
 * default stays "classic". Every method keeps the streaming push API, the
 * attack localisation, the gate and the `OnsetEvent` shape: only the
 * candidates change.
 *
 * - "classic": SuperFlux with the peak picker's defaults (delta 0.03). Very
 *   precise, but it misses the second hit of a strum and soft notes.
 * - "sensitive": the same pipeline with delta 0.01. Recall up from about 49
 *   to 75 % on GuitarSet at the cost of some precision (95 → 85 %); 0.015
 *   and 0.007 were tried and were not better overall.
 * - "superflux-complex": SuperFlux plus a rectified complex-domain function
 *   on the same STFT frames, each scaled by a causal running maximum
 *   (complexFlux.ts), with a relative threshold. Best on GuitarSet,
 *   especially over a loud background. Its longer, sparser frames (46 ms
 *   every 10 ms) cost less than "classic" per second of audio, but an onset
 *   is decided about 25 ms later (≈ 51 ms instead of 26 at 48 kHz; the
 *   timestamps are unaffected).
 *
 * Explicit `odf` and `peaks` options win over the method's presets.
 * Measurements: packages/core/poc/notes/onsets.md.
 */

import type { SuperFluxComplexOptions } from "./complexFlux";
import type { PeakPickerOptions } from "./peakPicker";

export const ONSET_METHODS = ["classic", "sensitive", "superflux-complex"] as const;

export type OnsetMethod = (typeof ONSET_METHODS)[number];

export interface OnsetMethodPreset {
  /** ODF settings applied before the caller's `odf` options. */
  odf: Omit<SuperFluxComplexOptions, "sampleRate">;
  /** Peak-picking settings applied before the caller's `peaks` options. */
  peaks: Omit<PeakPickerOptions, "frameRate">;
}

export const DEFAULT_ONSET_METHOD: OnsetMethod = "classic";

/** A method's settings: STFT window and hop in seconds, other ODF settings, peaks. */
export type OnsetMethodDefaults = { peaks: Omit<PeakPickerOptions, "frameRate"> } & Partial<
  Omit<SuperFluxComplexOptions, "sampleRate" | "frameSize" | "hopSize"> & {
    windowSeconds: number;
    hopSeconds: number;
  }
>;

/**
 * What each method changes, in sample-rate independent units. "classic"
 * changes nothing. "superflux-complex" runs on its own STFT: a window of
 * about 46 ms (the power of two nearest to `windowSeconds`: 2048 at 44.1 and
 * 48 kHz), one frame every 10 ms, 24 bands per octave, μ = 2 frames for the
 * flux and 1 for the complex domain. Its `delta` applies to the sum of two
 * functions scaled to about 1, so it is not comparable with the classic one;
 * 0.2 was chosen on the tuning players (00–02) for a causal running maximum,
 * which leaves more frames near 1 than a whole-file maximum (the POC's 0.07).
 */
export const ONSET_METHOD_DEFAULTS = {
  classic: { peaks: {} },
  sensitive: { peaks: { delta: 0.01 } },
  "superflux-complex": {
    windowSeconds: 0.0464,
    hopSeconds: 0.01,
    bandsPerOctave: 24,
    diffFrames: 2,
    complexDiffFrames: 1,
    normSeconds: 10,
    peaks: { delta: 0.2, combineSeconds: 0.05 },
  },
} as const satisfies Record<OnsetMethod, OnsetMethodDefaults>;

/** The ODF and peak-picker settings of a method at a sample rate. */
export function onsetMethodPreset(method: OnsetMethod, sampleRate: number): OnsetMethodPreset {
  if (method !== "superflux-complex")
    return { odf: {}, peaks: { ...ONSET_METHOD_DEFAULTS[method].peaks } };
  const { windowSeconds, hopSeconds, peaks, ...rest } = ONSET_METHOD_DEFAULTS[method];
  return {
    odf: {
      ...rest,
      frameSize: Math.pow(2, Math.max(4, Math.round(Math.log2(sampleRate * windowSeconds)))),
      hopSize: Math.max(1, Math.round(sampleRate * hopSeconds)),
    },
    peaks: { ...peaks },
  };
}

export function isOnsetMethod(value: unknown): value is OnsetMethod {
  return (ONSET_METHODS as readonly unknown[]).includes(value);
}
