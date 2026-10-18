/**
 * @audiolab/core/rhythm — rhythm and timing assessment.
 *
 * Pure logic, no Web Audio and no display strings: expected notes and
 * played onsets are plain `{ time }` objects in seconds, in one clock
 * chosen by the caller (for live audio, the AudioContext clock). Feed it
 * from `OnsetPipeline` / `startOnsetAnalysis` in the main entry, or from
 * any other onset source.
 *
 *   tolerance       on-time / matching windows, widened to the chain's σ
 *   timingScorer    live matching of onsets to notes (timing × label)
 *   patternFit      written rhythm at a free tempo (latency cancels)
 *   timingStats     bias, jitter, drift
 *   onsetEvidence   which note / chord was played at each onset
 *   notation        rhythms as durations, figures, beams, staff steps
 *   playAlongRun    attachPlayAlong: a run on a live onset analysis, no React
 *   playAlong       a whole play-along exercise: queue, click echoes,
 *                   scoring, labels, onsets to display
 *
 * It uses a few pure modules of the core tree (click echo filter, sample
 * history); the main entry never imports this subpath.
 */

export {
  TIMING_TOLERANCE_DEFAULTS,
  classifyDelta,
  toleranceFromUncertainty,
  type TimingTier,
  type TimingTolerance,
} from "./tolerance";
export {
  TIMING_SCORER_DEFAULTS,
  TimingScorer,
  createTimingScorerState,
  scoreTimings,
  stepTimingScorer,
  type ExpectedNote,
  type LabelStatus,
  type NoteResult,
  type PlayedOnset,
  type TimingScorerAction,
  type TimingScorerConfig,
  type TimingScorerState,
  type TimingScorerStep,
} from "./timingScorer";
export { fitPattern, type FittedNote, type PatternFit, type PatternFitOptions } from "./patternFit";
export { medianOf, timingStats, type TimingSample, type TimingStats } from "./timingStats";
export {
  PlayAlongSession,
  type OnsetLabeler,
  type PlayAlongClicks,
  type PlayAlongOnset,
  type PlayAlongOptions,
  type PlayedOnsetView,
} from "./playAlong";
export {
  PlayAlongStoppedError,
  attachPlayAlong,
  type PlayAlongEvent,
  type PlayAlongRun,
  type PlayAlongRunOptions,
  type PlayAlongRunState,
  type PlayAlongSource,
} from "./playAlongRun";
export { chordLabeler, noteLabel, noteLabeler } from "./labelers";
export {
  beamGroups,
  eventsFromDurations,
  figureOf,
  playedBeats,
  rhythmLength,
  staffStep,
  type FigureBase,
  type FigureId,
  type NoteFigure,
  type RhythmEvent,
} from "./notation";
export {
  OnsetEvidence,
  type LabelObservation,
  type OnsetEvidenceOptions,
  type OnsetLabel,
} from "./onsetEvidence";
