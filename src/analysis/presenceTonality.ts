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
 *   - More robust to dynamics (loud vs quiet passages). A note played softly
 *     but consistently shows up in the histogram just as much as one played
 *     loudly.
 *   - Less sensitive to harmonics. The filter zeroes out the noise floor
 *     where most upper-harmonic leakage lives.
 *   - Closer to how musicians describe a key: "the notes you hear in the
 *     piece" rather than "the energy distribution".
 *
 * Pipeline (per frame, run by `useTonality`):
 *
 *   liveChromaWindow.aggregate()                       # 8s averaged chroma
 *      → highWaterMarkFilter.filterToIndicator(...)    # binary 12-D vector
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
