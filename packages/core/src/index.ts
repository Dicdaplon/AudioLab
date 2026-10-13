/**
 * @audiolab/core — public API.
 *
 * Everything exported here is browser-safe and framework-free. The Node-only
 * file pipeline lives behind `@audiolab/core/offline`. Modules that are not
 * re-exported from this file are internal and may change without notice.
 */

// --- DSP -------------------------------------------------------------------

export {
  CHROMA_SIZE,
  averageChromas,
  dbSpectrumToMagnitude,
  l1Normalize,
  spectrumToChroma,
  type ChromaOptions,
} from "./analysis/chroma";
export { ChromaWindow, type ChromaWindowOptions } from "./analysis/windowing";
export {
  KEY_PROFILES,
  KRUMHANSL_MAJOR_PROFILE,
  KRUMHANSL_MINOR_PROFILE,
  detectKey,
  detectMajorKey,
  keyName,
  keyShortName,
  relativeMajorTonic,
  type KeyMode,
  type KeyScore,
} from "./analysis/keyDetection";
export {
  CHORD_TEMPLATES,
  cosineSimilarity,
  detectChord,
  type ChordQuality,
  type ChordScore,
  type ChordTemplate,
} from "./analysis/chordDetection";
export {
  HIGH_WATER_MARK_DEFAULTS,
  HIGH_WATER_MARK_MEMORY_MAX,
  HIGH_WATER_MARK_MEMORY_MIN,
  HighWaterMarkFilter,
  type HighWaterMarkMode,
  type HighWaterMarkOptions,
} from "./analysis/highWaterMark";
export { detectKeyFromPresence } from "./analysis/presenceTonality";
export { applyHannWindow, fftInPlace, fftMagnitude } from "./analysis/fft";
export {
  computeFftDb,
  nextPow2,
  periodicHannWindow,
  type FftDbOptions,
  type FftDbResult,
  type FftWindow,
} from "./analysis/timeFft";
export {
  BUTTERWORTH_ORDER,
  LowpassFilter,
  butterworthPoleAngles,
  designButterworthBiquad,
  type BiquadCoeffs,
  type BiquadState,
} from "./analysis/lowpass";
export {
  NOISE_FLOOR_METHODS,
  NOISE_FLOOR_SILENCE_DB,
  estimateNoiseFloor,
  isNoiseFloorMethod,
  type NoiseFloorMethod,
  type NoiseFloorOptions,
  type NoiseFloorResult,
} from "./analysis/noiseFloor";
export { spectrumSlopeDbPerHz } from "./analysis/spectrumSlope";
export { TimeRingBuffer } from "./analysis/timeBuffer";
export { argmax, clamp, mean, median, softmax } from "./analysis/math";

// --- Engines ---------------------------------------------------------------

export {
  SILENCE_LEVEL_DB,
  TONALITY_ENGINE_DEFAULTS,
  TonalityEngine,
  emptyTonalityFrame,
  type TonalityEngineConfig,
  type TonalityFrame,
} from "./analysis/engine/tonalityEngine";
export {
  TEMPO_ANALYZER_DEFAULTS,
  TempoAnalyzer,
  type TempoAnalyzerConfig,
  type TempoEstimate,
  type TempoFrame,
} from "./analysis/engine/tempoAnalyzer";

// --- Web Audio adapters ----------------------------------------------------

export { MIC_CONSTRAINTS, openMicrophone, type MicSource } from "./audio/micStream";
export {
  MicrophoneError,
  checkMicrophoneSupport,
  toMicError,
  type MicEnvironment,
  type MicErrorCode,
  type MicErrorInfo,
} from "./audio/errors";
export {
  createAnalyser,
  readSpectrumDb,
  type AnalyserOptions,
  type AnalyserSetup,
} from "./audio/analyser";
export {
  startSampleCapture,
  type CaptureMethod,
  type SampleCapture,
  type SampleCaptureOptions,
  type SampleListener,
} from "./audio/sampleCapture";
export { SampleBatcher } from "./audio/sampleBatcher";

// --- Settings and note maths ----------------------------------------------

export {
  ANALYSIS_DEFAULTS,
  DEFAULT_DETECTOR_SETTINGS,
  DEFAULT_FFT_SETTINGS,
  FFT_DISPLAY_MAX_HZ,
  ONSET_LOWPASS_RANGE,
  type DetectorSettings,
  type FftSettings,
} from "./config/settings";
export {
  A4_FREQ,
  A4_MIDI,
  A_MINOR_PENTATONIC_PITCH_CLASSES,
  NOTE_NAMES,
  freqToMidi,
  freqToPitchClass,
  midiToFreq,
  pitchClassFrequencies,
  pitchClassName,
} from "./utils/notes";
