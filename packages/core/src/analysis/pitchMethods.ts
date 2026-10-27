/**
 * Pitch estimators for a live tuner, as a registry and a factory free of
 * any framework: `createPitchTracker` builds the tracker of a method behind
 * one interface, `loadCrepeModelCached` fetches the CREPE model once per URL.
 *
 * - "mpm" (default): `PitchTracker`, the McLeod Pitch Method with a median
 *   over 3 frames and note hysteresis.
 * - "pyin": `PyinTracker`, probabilistic YIN with a 50 ms look-ahead
 *   Viterbi: steadier in noise, fewer octave errors.
 * - "crepe": `CrepeTracker`, the CREPE tiny network deciding the note, MPM
 *   giving the cents. It needs a loaded model; without one, "mpm" runs.
 */

import { CrepeTracker, loadCrepeModel, type CrepeModel } from "./crepe";
import { PitchTracker, type PitchEstimate, type PitchTrackerOptions } from "./pitch";
import { PyinTracker } from "./pyin";

export const PITCH_METHODS = ["mpm", "pyin", "crepe"] as const;

export type PitchMethod = (typeof PITCH_METHODS)[number];

export const DEFAULT_PITCH_METHOD: PitchMethod = "mpm";

export function isPitchMethod(value: unknown): value is PitchMethod {
  return (PITCH_METHODS as readonly unknown[]).includes(value);
}

/** What `PitchTracker`, `PyinTracker` and `CrepeTracker` share: push samples, read `estimate`. */
export interface LivePitchTracker {
  /** Latest smoothed estimate, or `null` while idle, on silence or on noise. */
  readonly estimate: PitchEstimate | null;
  push(samples: ArrayLike<number>): void;
  /** Forget every sample and estimate. */
  reset(): void;
  /** Change the tuning reference; the next analysis uses it. */
  setReferenceA4(hz: number): void;
}

/**
 * The tracker of a method. `peakThreshold`, `clarityThreshold` and
 * `medianFrames` only apply to "mpm"; `windowSize` to "mpm" and "pyin";
 * `hopSize` to all three ("pyin" defaults to 10 ms; "crepe" never runs more
 * often than every 100 ms, a shorter hop is raised to it). "crepe" without
 * `crepeModel` returns the "mpm" tracker.
 */
export function createPitchTracker(
  method: PitchMethod,
  options: PitchTrackerOptions,
  crepeModel?: CrepeModel,
): LivePitchTracker {
  const {
    sampleRate,
    referenceA4,
    windowSize,
    hopSize,
    medianFrames,
    hysteresisCents,
    minFrequency,
    maxFrequency,
    peakThreshold,
    clarityThreshold,
    silenceRms,
  } = options;
  const common = { sampleRate, hysteresisCents, minFrequency, maxFrequency, silenceRms };
  if (method === "crepe" && crepeModel) {
    return new CrepeTracker(crepeModel, {
      ...common,
      referenceA4,
      hopSize: Math.max(hopSize ?? 0, Math.round(sampleRate / 10)),
    });
  }
  if (method === "pyin") return new PyinTracker({ ...common, referenceA4, windowSize, hopSize });
  return new PitchTracker({
    ...common,
    referenceA4,
    windowSize,
    hopSize,
    medianFrames,
    peakThreshold,
    clarityThreshold,
  });
}

/** One fetch per model URL for the page's lifetime; a failed load is evicted and retried next time. */
const crepeModels = new Map<string, Promise<CrepeModel>>();

/** `loadCrepeModel(url)`, cached per URL. */
export function loadCrepeModelCached(url: string): Promise<CrepeModel> {
  const cached = crepeModels.get(url);
  if (cached) return cached;
  const model = loadCrepeModel(url);
  crepeModels.set(url, model);
  model.catch(() => crepeModels.delete(url));
  return model;
}
