/**
 * User-facing settings types and their defaults. Single source of truth for
 * the hooks, the panels and App.
 */

import { HIGH_WATER_MARK_DEFAULTS, type HighWaterMarkMode } from "../analysis/highWaterMark";
import type { NoiseFloorMethod } from "../analysis/noiseFloor";

/** Settings of the key / chord detector exposed in the UI. */
export interface DetectorSettings {
  /** Live acquisition window length in seconds (chroma mean + peak filter input). */
  liveAcquisitionSeconds: number;
  /** Tonality acquisition window length in seconds (energy key + presence histogram). */
  tonalityAcquisitionSeconds: number;
  /** High-water-mark filter tolerance ∈ [0, 1]. */
  maxFilterTolerancy: number;
  /** High-water-mark filter memory (number of recent peaks). */
  maxFilterMemory: number;
  /** Aggregation of the recent peaks. */
  maxFilterMode: HighWaterMarkMode;
}

/** Defaults tuned by `npm run sweep` against the project's samples. */
export const DEFAULT_DETECTOR_SETTINGS: DetectorSettings = {
  liveAcquisitionSeconds: 8,
  tonalityAcquisitionSeconds: 30,
  maxFilterTolerancy: HIGH_WATER_MARK_DEFAULTS.tolerancy,
  maxFilterMemory: HIGH_WATER_MARK_DEFAULTS.memory,
  maxFilterMode: HIGH_WATER_MARK_DEFAULTS.mode,
};

/** Fixed analysis parameters shared by the live hook and App. */
export const ANALYSIS_DEFAULTS = {
  /** Analysis cadence (spectrum polls per second). */
  framesPerSecond: 10,
  /** AnalyserNode FFT size. */
  fftSize: 16384,
  /** Lowest frequency folded into the chroma (A1). */
  minFreq: 55,
  /** Highest frequency folded into the chroma. */
  maxFreq: 5000,
  /** Chord detection window length in seconds. */
  chordWindowSeconds: 1,
} as const;

/** Settings of the FFT tab. */
export interface FftSettings {
  noiseMethod: NoiseFloorMethod;
  /**
   * Cutoff (Hz) of the lowpass applied to the onset-strength envelope
   * before the tempo analysis. Lower values smooth the envelope and
   * attenuate fast beat rates (2 Hz = 120 BPM sits at −3 dB for fc = 2 Hz).
   */
  onsetLowpassHz: number;
  /** Overlay the frequency slope (dB/Hz) of the spectrum. */
  showSlope: boolean;
  /** Overlay the A minor pentatonic reference notes. */
  showScaleNotes: boolean;
}

export const DEFAULT_FFT_SETTINGS: FftSettings = {
  noiseMethod: "median",
  onsetLowpassHz: 8,
  showSlope: false,
  showScaleNotes: true,
};

/** Slider bounds of the onset-envelope lowpass cutoff, in Hz. */
export const ONSET_LOWPASS_RANGE = { min: 1, max: 20, step: 0.5 } as const;

/** Upper edge of the magnitude spectrum display, in Hz. */
export const FFT_DISPLAY_MAX_HZ = 4000;
