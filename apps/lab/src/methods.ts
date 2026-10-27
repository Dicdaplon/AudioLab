/**
 * The listening methods the lab lets you pick, page by page: the method's name,
 * a tag, one factual sentence, the SDK options behind it, and its "How?" sheet.
 * The originals stay the defaults; the others are the opt-in methods that
 * won their tests (docs/POC-METHODS.md, docs/BENCHMARKS.md). The ids and the
 * engine options are the SDK's registries (`PITCH_METHODS`, `TEMPO_METHODS`,
 * `CHORD_METHOD_PRESETS`…); the lab adds the names, the words and the sheets.
 */
import {
  CHORD_METHOD_PRESETS,
  type ChordMethodOptions,
  type ChordMethodPreset,
  type ChromaMethod,
  type KeyMethod,
  type OnsetMethod,
  type PitchMethod,
  type TempoAnalyzerMethod,
} from "@audiolab/core";

import type { MethodChoice } from "./components/MethodPicker";
import {
  ChordAiHow,
  ChordClassicHow,
  ChordCqtHow,
  ChordFollowHow,
  ChordSharperHow,
  KeyChordsHow,
  KeyProfileHow,
  LabelChromaCqtHow,
  LabelChromaLogHow,
  LabelChromaNearestHow,
  OnsetClassicHow,
  OnsetPhaseHow,
  OnsetSensitiveHow,
  PitchCrepeHow,
  PitchMpmHow,
  PitchPyinHow,
  TempoEnvelopeHow,
  TempoFluxHow,
} from "./how/methods";

// --- chords ---------------------------------------------------------------------------

/** The SDK's chord presets, plus Basic Pitch (a note model, run by the lab). */
export type ChordMethodId = ChordMethodPreset | "ai";

export const CHORD_METHODS: readonly MethodChoice<ChordMethodId>[] = [
  {
    id: "classic",
    name: "Chroma templates",
    tag: "original",
    summary: "Chroma averaged over 1 s, matched against chord templates.",
    how: ChordClassicHow,
  },
  {
    id: "follow",
    name: "Templates + HMM",
    tag: "experimental",
    summary: "Templates scored ten times a second, smoothed by a hidden Markov model.",
    how: ChordFollowHow,
  },
  {
    id: "sharper",
    name: "Log chroma + HMM",
    tag: "experimental",
    summary: "Gaussian-weighted, log-compressed chroma, then the HMM.",
    how: ChordSharperHow,
  },
  {
    id: "cqt",
    name: "Constant-Q + HMM",
    tag: "experimental",
    summary: "Constant-Q transform, 24 bins per octave, then the HMM.",
    how: ChordCqtHow,
  },
  {
    id: "ai",
    name: "Basic Pitch",
    tag: "AI",
    summary: "Neural note transcription (Spotify), notes folded into chords. About 15 MB.",
    how: ChordAiHow,
  },
];

/** The TonalityEngine options of each chord method (the AI one also feeds the key). */
export const CHORD_ENGINE: Record<ChordMethodId, ChordMethodOptions> = {
  ...CHORD_METHOD_PRESETS,
  ai: CHORD_METHOD_PRESETS.sharper,
};

// --- key -------------------------------------------------------------------------------

export type KeyMethodId = KeyMethod;

export const KEY_METHODS: readonly MethodChoice<KeyMethodId>[] = [
  {
    id: "profile",
    name: "Key profiles",
    tag: "original",
    summary: "Chroma over the long window correlated with the 24 key profiles.",
    how: KeyProfileHow,
  },
  {
    id: "chords",
    name: "Chord vote",
    tag: "recommended",
    summary: "Detected chords vote for their keys, plus half the profile score.",
    how: KeyChordsHow,
  },
];

// --- pitch (tuner) ---------------------------------------------------------------------

export type PitchMethodId = PitchMethod;

/** The CREPE tiny model shipped with the lab (MIT, public/models/crepe-tiny/). */
export const CREPE_MODEL_URL = `${import.meta.env.BASE_URL}models/crepe-tiny/crepe-tiny.bin`;

export const PITCH_METHODS: readonly MethodChoice<PitchMethodId>[] = [
  {
    id: "mpm",
    name: "MPM",
    tag: "original",
    summary: "McLeod pitch method: normalised autocorrelation, first strong peak.",
    how: PitchMpmHow,
  },
  {
    id: "pyin",
    name: "pYIN",
    tag: "experimental",
    summary: "YIN over many thresholds, decoded by an HMM. 50 ms look-ahead.",
    how: PitchPyinHow,
  },
  {
    id: "crepe",
    name: "CREPE tiny",
    tag: "AI",
    summary: "Convolutional network at 16 kHz, cents refined by MPM. About 1 MB.",
    how: PitchCrepeHow,
  },
];

// --- onsets (rhythm) ---------------------------------------------------------------------

export type OnsetMethodId = OnsetMethod;

export const ONSET_METHODS: readonly MethodChoice<OnsetMethodId>[] = [
  {
    id: "classic",
    name: "SuperFlux",
    tag: "original",
    summary: "Spectral flux with vibrato suppression, peak threshold 0.03.",
    how: OnsetClassicHow,
  },
  {
    id: "sensitive",
    name: "SuperFlux, low threshold",
    tag: "experimental",
    summary: "Same detector, threshold 0.01: more notes found, more false hits.",
    how: OnsetSensitiveHow,
  },
  {
    id: "superflux-complex",
    name: "SuperFlux + complex domain",
    tag: "experimental",
    summary: "Adds the phase deviation (complex-domain flux), causal normalisation.",
    how: OnsetPhaseHow,
  },
];

// --- tempo -------------------------------------------------------------------------------

export type TempoMethodId = TempoAnalyzerMethod;

export const TEMPO_METHODS: readonly MethodChoice<TempoMethodId>[] = [
  {
    id: "envelope",
    name: "RMS envelope",
    tag: "original",
    summary: "Periodicity of the loudness envelope over 8 s.",
    how: TempoEnvelopeHow,
  },
  {
    id: "flux",
    name: "Spectral flux",
    tag: "experimental",
    summary: "Autocorrelation of the spectral flux over 8 s, with a tempo prior.",
    how: TempoFluxHow,
  },
];

// --- what was played at an onset (play-along labels) ------------------------------------

/** The chroma of `chordLabeler` (`chromaMethod`): one look at the 170 ms after a strum. */
export const LABEL_CHROMA_METHODS: readonly MethodChoice<ChromaMethod>[] = [
  {
    id: "nearest",
    name: "FFT chroma",
    tag: "original",
    summary: "One FFT of the 170 ms after the strum, bins to the nearest note.",
    how: LabelChromaNearestHow,
  },
  {
    id: "gaussian-log",
    name: "Log chroma",
    tag: "experimental",
    summary: "The same FFT, Gaussian-weighted and log-compressed.",
    how: LabelChromaLogHow,
  },
  {
    id: "cqt",
    name: "Constant-Q chroma",
    tag: "experimental",
    summary: "Constant-Q transform of the same 170 ms, 24 bins per octave.",
    how: LabelChromaCqtHow,
  },
];
