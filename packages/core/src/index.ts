/**
 * @audiolab/core — public API.
 *
 * Everything exported here is browser-safe and framework-free. The Node-only
 * file pipeline lives behind `@audiolab/core/offline`. Modules that are not
 * re-exported from this file are internal and may change without notice.
 */

export { BUILD_INFO, type BuildInfo } from "./buildInfo";

// --- DSP -------------------------------------------------------------------

export {
  CHROMA_SIZE,
  GAUSSIAN_LOG_CHROMA,
  averageChromas,
  dbSpectrumToMagnitude,
  l1Normalize,
  spectrumToChroma,
  type ChromaOptions,
} from "./analysis/chroma";
export { ChromaWindow, type ChromaWindowOptions } from "./analysis/windowing";
export {
  KEY_PROFILES,
  KEY_PROFILE_SETS,
  KRUMHANSL_MAJOR_PROFILE,
  KRUMHANSL_MINOR_PROFILE,
  detectKey,
  detectMajorKey,
  keyName,
  keyShortName,
  relativeMajorTonic,
  type DetectKeyOptions,
  type KeyMode,
  type KeyProfileName,
  type KeyScore,
} from "./analysis/keyDetection";
export {
  CHORD_QUALITIES,
  CHORD_QUALITY_BIAS,
  CHORD_QUALITY_INTERVALS,
  CHORD_TEMPLATES,
  TRIAD_QUALITIES,
  baseTriad,
  chordName,
  chordPitchClasses,
  chordTemplates,
  cosineSimilarity,
  detectChord,
  isChordQuality,
  type BaseTriad,
  type ChordQuality,
  type ChordScore,
  type ChordTemplate,
  type DetectChordOptions,
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
export {
  SCALES,
  SCALE_NAMES_EN,
  matchScales,
  scalePitchClasses,
  type MatchScalesOptions,
  type ScaleDefinition,
  type ScaleMatch,
} from "./analysis/scales";
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
export {
  PITCH_DEFAULTS,
  PitchTracker,
  detectPitch,
  frequencyToPitch,
  normalizedSquareDifference,
  type PitchEstimate,
  type PitchOptions,
  type PitchTrackerOptions,
} from "./analysis/pitch";
export { TimeRingBuffer } from "./analysis/timeBuffer";

// --- Onsets and adaptive gate ------------------------------------------------

export {
  SUPER_FLUX_DEFAULTS,
  SuperFluxOdf,
  defaultFrameSize,
  diffFramesFor,
  logFilterbank,
  type Filterbank,
  type OdfFrame,
  type SuperFluxConfig,
  type SuperFluxOptions,
} from "./analysis/onset/superFlux";
export {
  OnlinePeakPicker,
  PEAK_PICKER_DEFAULTS,
  type PeakPickerConfig,
  type PeakPickerOptions,
  type PickedPeak,
} from "./analysis/onset/peakPicker";
export { ENVELOPE_FLOOR_DB, rmsToDb } from "./analysis/levels";
export {
  ATTACK_ENVELOPE_DEFAULTS,
  AttackEnvelope,
  type AttackEnvelopeConfig,
  type AttackEnvelopeOptions,
  type LocatedAttack,
} from "./analysis/onset/attackEnvelope";
export {
  ONSET_DETECTOR_DEFAULTS,
  OnsetDetector,
  type OnsetDetectorOptions,
  type OnsetEvent,
} from "./analysis/onset/onsetDetector";
export {
  OnsetPipeline,
  type OnsetPipelineOptions,
  type OnsetPipelineResult,
} from "./analysis/onset/onsetPipeline";
export {
  DEFAULT_ONSET_METHOD,
  ONSET_METHODS,
  ONSET_METHOD_DEFAULTS,
  isOnsetMethod,
  onsetMethodPreset,
  type OnsetMethod,
  type OnsetMethodDefaults,
  type OnsetMethodPreset,
} from "./analysis/onset/onsetMethods";
export {
  SUPER_FLUX_COMPLEX_DEFAULTS,
  SuperFluxComplexOdf,
  type SuperFluxComplexConfig,
  type SuperFluxComplexOptions,
} from "./analysis/onset/complexFlux";
export {
  StreamHistory,
  clickBandShare,
  clickWindowLength,
  spectralRise,
  RISE_BAND_EDGES_HZ,
  riseSimilarity,
  type ClickBandOptions,
  type SpectralRise,
  chordAfterOnset,
  chordReadyAt,
  noteAfterOnset,
  noteReadyAt,
  type ChordAfterOnsetOptions,
  type NoteAfterOnsetOptions,
} from "./analysis/onset/afterOnset";
export {
  BAND_LEVEL_METER_DEFAULTS,
  BandLevelMeter,
  type BandLevelMeterConfig,
  type BandLevelMeterOptions,
  type LevelBlock,
} from "./analysis/gate/bandLevelMeter";
export {
  INITIAL_LEVEL_FLOOR_STATE,
  LEVEL_FLOOR_DEFAULTS,
  LevelFloorTracker,
  levelFloorOf,
  stepLevelFloor,
  type LevelFloorConfig,
  type LevelFloorState,
} from "./analysis/gate/levelFloorTracker";
export {
  AdaptiveNoiseGate,
  NOISE_GATE_DEFAULTS,
  initialNoiseGateState,
  stepNoiseGate,
  type NoiseGateConfig,
  type NoiseGateInput,
  type NoiseGateState,
} from "./analysis/gate/noiseGate";
export {
  GATE_LEVELS,
  GATE_STRICTNESS,
  gateLevelOf,
  gateTuning,
  type GateLevel,
  type GateTuning,
  type GateUse,
} from "./analysis/gate/strictness";

// --- Timing ------------------------------------------------------------------

export {
  AudioClockSync,
  CLOCK_SYNC_DEFAULTS,
  type CaptureBatchInfo,
  type ClockSyncConfig,
  type ClockSyncStats,
} from "./timing/clockSync";
export {
  beatAt,
  beatDuration,
  beatTime,
  beatsBetween,
  isDownbeat,
  type BeatGrid,
} from "./timing/beatGrid";
export {
  CLICK_BAND_HZ,
  CLICK_ECHO_DEFAULTS,
  ClickEchoFilter,
  type ClickEchoConfig,
  type ClickEchoVerdict,
  type LearntClick,
} from "./timing/clickEcho";
export {
  LATENCY_TEST,
  latencyTestClicks,
  measureTapLatency,
  TAP_LATENCY_DEFAULTS,
  type TapLatency,
  type TapLatencyConfig,
} from "./timing/tapLatency";
export {
  ASSUMED_OUTPUT_LATENCY_MS,
  ASSUMED_OUTPUT_UNCERTAINTY_MS,
  type TimingReference,
  ASSUMED_INPUT_LATENCY_MS,
  ASSUMED_INPUT_UNCERTAINTY_MS,
  BLUETOOTH_INPUT_LATENCY_MS,
  BLUETOOTH_INPUT_UNCERTAINTY_MS,
  combineTimingComponents,
  estimateTimingBudget,
  looksLikeBluetooth,
  type TimingBudget,
  type TimingBudgetInput,
  type TimingComponent,
  type TimingComponentId,
  type TimingComponentSource,
} from "./timing/timingBudget";
export { argmax, clamp, mean, median, softmax } from "./analysis/math";

// --- Engines ---------------------------------------------------------------

export {
  CHORD_HMM_DEFAULTS,
  SILENCE_LEVEL_DB,
  TONALITY_ENGINE_DEFAULTS,
  TonalityEngine,
  emptyTonalityFrame,
  type ChordHmmSettings,
  type ChordSmoothing,
  type ChromaMethod,
  type KeyMethod,
  type TonalityEngineConfig,
  type TonalityFrame,
} from "./analysis/engine/tonalityEngine";
export {
  CHORD_METHOD_PRESETS,
  CHORD_SMOOTHINGS,
  CHROMA_METHODS,
  DEFAULT_CHORD_METHOD_PRESET,
  DEFAULT_CHORD_SMOOTHING,
  DEFAULT_CHROMA_METHOD,
  DEFAULT_KEY_METHOD,
  KEY_METHODS,
  isChordMethodPreset,
  isChordSmoothing,
  isChromaMethod,
  isKeyMethod,
  type ChordMethodOptions,
  type ChordMethodPreset,
} from "./analysis/engine/tonalityMethods";
export { ChordHmm, selfTransitionFor, type ChordHmmOptions } from "./analysis/chordHmm";
export { CqtChroma, type CqtChromaOptions } from "./analysis/cqt";
export {
  DEFAULT_TEMPO_METHOD,
  TEMPO_ANALYZER_DEFAULTS,
  TEMPO_FLUX_DEFAULTS,
  TEMPO_METHODS,
  TempoAnalyzer,
  isTempoMethod,
  type TempoAnalyzerConfig,
  type TempoAnalyzerMethod,
  type TempoEstimate,
  type TempoFrame,
} from "./analysis/engine/tempoAnalyzer";

// --- Web Audio adapters ----------------------------------------------------

export {
  MIC_CONSTRAINTS,
  openMicrophone,
  type MicSource,
  type OpenMicrophoneOptions,
} from "./audio/micStream";
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
  startLiveAnalysis,
  type LiveAnalysis,
  type LiveAnalysisOptions,
  type LiveFrameListener,
  type LiveSpectrum,
} from "./audio/liveAnalysis";
export {
  startSampleCapture,
  type CaptureMethod,
  type SampleBatchInfo,
  type SampleCapture,
  type SampleCaptureOptions,
  type SampleListener,
} from "./audio/sampleCapture";
export {
  ACCENT_CLICK_HZ,
  CLICK_HZ,
  METRONOME_DEFAULTS,
  startMetronome,
  type Metronome,
  type MetronomeOptions,
} from "./audio/metronome";
export { nativeAudioContext } from "./audio/nativeContext";
export {
  outputLatencySeconds,
  startOnsetAnalysis,
  timingInputFromMic,
  type OnsetAnalysis,
  type OnsetAnalysisOptions,
  type AnalysedBatchListener,
  type BatchListener,
  type OnsetAnalysisSnapshot,
  type OnsetListener,
  type TimedOnset,
} from "./audio/onsetAnalysis";
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

// --- Note models (Basic Pitch) ------------------------------------------------

export * from "./analysis/notes";

// --- Pitch: pYIN and CREPE (opt-in tuner methods) ---------------------------

export {
  PyinTracker,
  pyinThresholdPrior,
  type PyinCandidate,
  type PyinTrackerOptions,
} from "./analysis/pyin";
export {
  CREPE_BINS,
  CREPE_FRAME,
  CREPE_SAMPLE_RATE,
  CrepePitch,
  CrepeTracker,
  crepeActivations,
  decodeCrepeActivations,
  loadCrepeModel,
  parseCrepeModel,
  type CrepeModel,
  type CrepeModelOptions,
  type CrepePitchOptions,
  type CrepeResult,
  type CrepeTrackerOptions,
} from "./analysis/crepe";
export { refineFrequencyNear, smoothPitchHistory } from "./analysis/pitch";
export {
  DEFAULT_PITCH_METHOD,
  PITCH_METHODS,
  createPitchTracker,
  isPitchMethod,
  loadCrepeModelCached,
  type LivePitchTracker,
  type PitchMethod,
} from "./analysis/pitchMethods";
