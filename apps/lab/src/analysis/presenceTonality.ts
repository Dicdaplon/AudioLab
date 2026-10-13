/**
 * Presence-based tonality detection — alternative to the energy-based one in
 * `keyDetection.ts`.
 *
 * The idea: instead of accumulating raw chroma energies, we accumulate
 * **binary presence indicators** of which pitch classes are "really there"
 * at each frame (after a high-water-mark threshold filter). Over a 30 s
 * window, the per-PC presence frequency builds a histogram of how often
 * each note was significant. That histogram is then fed to the standard
 * Krumhansl-Schmuckler detector.
 *
 * Why bother?
 *   - Within a frame, the strong pitch classes count fully and the weak
 *     ones not at all: the ranking depends on which notes are present, not
 *     on how much louder one note is than another. (Across frames the
 *     chroma is already level-normalised, so loud and quiet passages weigh
 *     the same in both paths.)
 *   - Less sensitive to harmonics and noise: the threshold zeroes the weak
 *     bins where most upper-harmonic leakage and hiss end up.
 *   - Closer to how musicians describe a key: "the notes you hear in the
 *     piece" rather than "the energy distribution".
 *
 * Pipeline (per frame, run by `TonalityEngine`):
 *
 *   liveChromaWindow.aggregate()                       # 8s averaged chroma
 *      → highWaterMarkFilter.filter(...) > 0           # binary 12-D indicator
 *      → presenceWindow.push(indicator)                # 30s accumulator
 *      → presenceWindow.aggregateRaw()                 # mean presence ∈ [0,1]^12
 *      → detectKeyFromPresence(...)                    # KK on presence
 */

import { detectKey, type KeyScore } from "./keyDetection";

/**
 * Compute tonality scores from a presence histogram.
 *
 * @param presence 12-D vector of presence frequencies (each entry in [0, 1]
 *                 after the 30 s mean). Need not be normalized — KK Pearson
 *                 correlation is scale-invariant.
 */
export function detectKeyFromPresence(presence: ArrayLike<number>, temperature = 0.1): KeyScore[] {
  return detectKey(presence, temperature);
}
