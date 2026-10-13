/**
 * @audiolab/core/offline — Node-only file pipeline.
 *
 * Decodes audio files (through the optional `audio-decode` peer dependency)
 * and frames them with a pure-JS FFT so recordings can be run through the
 * same `TonalityEngine` as the live hook. Used by the sample regression
 * suite and the tuning scripts; never imported by browser bundles.
 */

export { decodeAudioFile, type DecodedAudio } from "./decodeAudio";
export {
  aggregateChromas,
  analyzeOverall,
  computeChromaSequence,
  runPresenceTonality,
  slidingChordHistogram,
  type FrameOptions,
  type PresenceTonalityRunOptions,
  type PresenceTonalityRunResult,
  type SegmentScores,
  type SlidingChordHistogram,
  type SlidingChordHistogramEntry,
} from "./offlinePipeline";
