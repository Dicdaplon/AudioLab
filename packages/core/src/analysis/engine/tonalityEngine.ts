/**
 * TonalityEngine: the complete per-frame key / chord pipeline, free of any
 * DOM or Web Audio dependency.
 *
 * One magnitude spectrum per frame goes through:
 *
 *   spectrum ─► chroma (12-D, L1-normalised) ─┬─► chordWindow    ─► detectChord
 *                                             ├─► liveWindow     ─► detectKey
 *                                             │        │
 *                                             │        └─► HighWaterMarkFilter
 *                                             │              └─► 0/1 indicator ─► presenceWindow ─► detectKeyFromPresence
 *                                             └─► tonalityWindow ─► detectKey
 *
 * The live hook feeds it AnalyserNode spectra at `framesPerSecond`; the
 * offline pipeline feeds it FFT frames of decoded files at its own frame
 * rate. Both get the same code path, so the sample-based tests exercise what
 * runs in the browser.
 *
 * `push()` updates the stateful part (windows and filter); `snapshot()` reads
 * the aggregates and rankings. `process*()` does both.
 *
 * Opt-in alternatives (the defaults keep the original pipeline):
 *   chromaMethod "gaussian-log"  Gaussian semitone binning + log compression
 *   chromaMethod "cqt"           constant-Q chroma from the time signal
 *                                (`pushTimeDomain`; spectra fall back to
 *                                "gaussian-log")
 *   keyMethod "chords"           the key voted by the chords found
 *   keyProfile                   Temperley or Kostka–Payne profiles
 *   chordSmoothing "hmm"         per-frame templates smoothed by `ChordHmm`
 *                                instead of the chord-window mean
 */

import {
  CHORD_QUALITY_BIAS,
  TRIAD_QUALITIES,
  chordPitchClasses,
  chordTemplates,
  cosineSimilarity,
  detectChord,
  type ChordQuality,
  type ChordScore,
} from "../chordDetection";
import { ChordHmm, selfTransitionFor } from "../chordHmm";
import {
  CHROMA_SIZE,
  GAUSSIAN_LOG_CHROMA,
  dbSpectrumToMagnitude,
  spectrumToChroma,
} from "../chroma";
import {
  HighWaterMarkFilter,
  HIGH_WATER_MARK_MEMORY_MAX,
  HIGH_WATER_MARK_MEMORY_MIN,
  type HighWaterMarkMode,
} from "../highWaterMark";
import {
  detectKey,
  keyName,
  keyShortName,
  type KeyProfileName,
  type KeyScore,
} from "../keyDetection";
import { baseTriad } from "../chordDetection";
import { CqtChroma } from "../cqt";
import { clamp, softmax } from "../math";
import { detectKeyFromPresence } from "../presenceTonality";
import { ChromaWindow } from "../windowing";
import { ANALYSIS_DEFAULTS, DEFAULT_DETECTOR_SETTINGS } from "../../config/settings";
import type { ChordSmoothing, ChromaMethod, KeyMethod } from "./tonalityMethods";

export interface TonalityEngineConfig {
  /** Analysis cadence: how many spectra per second are pushed. */
  framesPerSecond: number;
  /** Chord window length in seconds. */
  chordWindowSeconds: number;
  /** Live acquisition window length in seconds (energy key + filter input). */
  liveAcquisitionSeconds: number;
  /** Tonality acquisition window length in seconds (energy key + presence). */
  tonalityAcquisitionSeconds: number;
  /** Chroma band, in Hz. */
  minFreq: number;
  maxFreq: number;
  /**
   * High-water-mark filter tolerance ∈ [0, 1].
   * @deprecated Use `filterTolerance` (same value; it wins when both are given).
   */
  filterTolerancy: number;
  /**
   * High-water-mark filter tolerance ∈ [0, 1]. Alias of `filterTolerancy`;
   * the engine's `config` carries both, equal.
   */
  filterTolerance?: number;
  /** High-water-mark filter memory ∈ [MEMORY_MIN, MEMORY_MAX]. */
  filterMemory: number;
  /** High-water-mark peak aggregation. */
  filterMode: HighWaterMarkMode;
  /**
   * Chord qualities the chord ranking considers, in tie-break order (see
   * `detectChord`). Default: major and minor triads.
   */
  chordQualities?: readonly ChordQuality[];
  /** Overrides of `CHORD_QUALITY_BIAS` for the chord ranking. */
  chordQualityBias?: Partial<Record<ChordQuality, number>>;
  /**
   * Chroma front-end. "nearest" (default): each FFT bin to its nearest
   * semitone, energy summed. "gaussian-log": Gaussian semitone binning and
   * log compression (`GAUSSIAN_LOG_CHROMA`). "cqt": a constant-Q chroma
   * computed from the latest time samples (`pushTimeDomain`), each note with
   * a window matched to its pitch (`CqtChroma`); spectra pushed in this mode
   * use "gaussian-log". Opt-in alternatives.
   */
  chromaMethod?: ChromaMethod;
  /** Key-profile set of every key ranking. Default "krumhansl". */
  keyProfile?: KeyProfileName;
  /**
   * How `liveKeys` and `tonalityKeys` are ranked. "profile" (default): the
   * window's chroma against the key profiles. "chords": the chords found in
   * the window vote for the keys they belong to (weighted by their role:
   * I, IV, V first), plus half the profile correlation. Opt-in alternative.
   */
  keyMethod?: KeyMethod;
  /**
   * How the chord ranking is smoothed. "window" (default): templates matched
   * on the chord-window mean. "hmm": templates matched on every frame, then
   * smoothed by a hidden Markov model (`chordHmm` settings); `chords` then
   * answers for the frame `lagSeconds` ago. Opt-in alternative.
   */
  chordSmoothing?: ChordSmoothing;
  /** Settings of the "hmm" chord smoothing. */
  chordHmm?: ChordHmmSettings;
}

export type { ChordSmoothing, ChromaMethod, KeyMethod } from "./tonalityMethods";

/** Diatonic chords of a key: [semitones above the tonic, triad, weight]. */
const KEY_ROLES: Record<"maj" | "min", readonly [number, "maj" | "min", number][]> = {
  maj: [
    [0, "maj", 1],
    [5, "maj", 0.8],
    [7, "maj", 0.9],
    [2, "min", 0.6],
    [9, "min", 0.7],
    [4, "min", 0.4],
  ],
  min: [
    [0, "min", 1],
    [5, "min", 0.8],
    [7, "maj", 0.9],
    [7, "min", 0.4],
    [8, "maj", 0.7],
    [3, "maj", 0.6],
    [10, "maj", 0.6],
  ],
};

/** Chord labels of the last frames ("root|maj" or null), with running counts. */
class ChordTally {
  private labels: (string | null)[] = [];
  readonly counts = new Map<string, number>();
  constructor(private capacity: number) {}
  resize(capacity: number): void {
    this.capacity = Math.max(1, capacity);
    while (this.labels.length > this.capacity) this.drop();
  }
  push(label: string | null): void {
    this.labels.push(label);
    if (label) this.counts.set(label, (this.counts.get(label) ?? 0) + 1);
    while (this.labels.length > this.capacity) this.drop();
  }
  private drop(): void {
    const old = this.labels.shift();
    if (old) {
      const n = (this.counts.get(old) ?? 1) - 1;
      if (n > 0) this.counts.set(old, n);
      else this.counts.delete(old);
    }
  }
  get size(): number {
    return this.labels.length;
  }
  reset(): void {
    this.labels = [];
    this.counts.clear();
  }
}

/**
 * Keys ranked by the chords of a window: Σ role weight × share of frames,
 * plus half the profile correlation of the window's chroma. Probabilities
 * by softmax (τ = 0.1); `correlation` holds the combined score.
 */
function keysFromChords(
  tally: ChordTally,
  chroma: Float32Array,
  profile?: KeyProfileName,
): KeyScore[] {
  const profiles = detectKey(chroma, { profile });
  const total = Math.max(1, tally.size);
  const candidates: { tonic: number; mode: "maj" | "min"; score: number }[] = [];
  for (const mode of ["maj", "min"] as const) {
    for (let tonic = 0; tonic < CHROMA_SIZE; tonic++) {
      let votes = 0;
      for (const [deg, q, w] of KEY_ROLES[mode]) {
        votes += (w * (tally.counts.get(`${(tonic + deg) % CHROMA_SIZE}|${q}`) ?? 0)) / total;
      }
      const corr = profiles.find((k) => k.tonic === tonic && k.mode === mode)?.correlation ?? 0;
      candidates.push({ tonic, mode, score: votes + 0.5 * corr });
    }
  }
  const probs = softmax(
    candidates.map((c) => c.score),
    0.1,
  );
  return candidates
    .map((c, i) => ({
      tonic: c.tonic,
      mode: c.mode,
      name: keyName(c.tonic, c.mode),
      shortName: keyShortName(c.tonic, c.mode),
      correlation: c.score,
      probability: probs[i],
    }))
    .sort((a, b) => b.probability - a.probability);
}

export interface ChordHmmSettings {
  /**
   * Mean chord duration the model expects, in seconds. Default 1 (tuned on
   * GuitarSet players 00–02, checked on players 03–05: docs/ALTERNATIVES.md).
   */
  meanChordSeconds?: number;
  /** Smoothing lag, in seconds. Default 0 (measured: a 0.3 s lag cost 100 ms of reaction for no clear gain). */
  lagSeconds?: number;
  /** Exponent of the per-frame probabilities, in (0, 1]. Default 0.6 (tuned with the duration). */
  emissionExponent?: number;
  /**
   * Flatness from which a frame reads as "no chord": the cosine between
   * its chroma and a flat one, in [0.29, 1]. Measured: music sits around
   * 0.55–0.9 (higher with "gaussian-log"), white noise around 0.98.
   * Default 0.95. A silent frame (zero chroma) is always "no chord".
   */
  noChordFlatness?: number;
}

export const CHORD_HMM_DEFAULTS: Required<ChordHmmSettings> = {
  meanChordSeconds: 1,
  lagSeconds: 0,
  emissionExponent: 0.6,
  noChordFlatness: 0.95,
};

/** The engine defaults, from the shared settings (`ANALYSIS_DEFAULTS`, `DEFAULT_DETECTOR_SETTINGS`). */
export const TONALITY_ENGINE_DEFAULTS: TonalityEngineConfig = {
  framesPerSecond: ANALYSIS_DEFAULTS.framesPerSecond,
  chordWindowSeconds: ANALYSIS_DEFAULTS.chordWindowSeconds,
  liveAcquisitionSeconds: DEFAULT_DETECTOR_SETTINGS.liveAcquisitionSeconds,
  tonalityAcquisitionSeconds: DEFAULT_DETECTOR_SETTINGS.tonalityAcquisitionSeconds,
  minFreq: ANALYSIS_DEFAULTS.minFreq,
  maxFreq: ANALYSIS_DEFAULTS.maxFreq,
  filterTolerancy: DEFAULT_DETECTOR_SETTINGS.maxFilterTolerancy,
  filterMemory: DEFAULT_DETECTOR_SETTINGS.maxFilterMemory,
  filterMode: DEFAULT_DETECTOR_SETTINGS.maxFilterMode,
};

/** Level reported when the band holds no energy at all. */
export const SILENCE_LEVEL_DB = -100;

export interface TonalityFrame {
  /** Latest single-frame chroma (12-D, L1-normalised). */
  instantaneousChroma: Float32Array;
  /** Chroma averaged over the chord window. */
  chordChroma: Float32Array;
  /** Chroma averaged over the live acquisition window. */
  liveAcquisitionChroma: Float32Array;
  /** Chroma averaged over the tonality acquisition window. */
  tonalityAcquisitionChroma: Float32Array;
  /** Live acquisition chroma after the high-water-mark filter. */
  filteredLiveChroma: Float32Array;
  /** Binary 0/1 indicator derived from the filtered live chroma. */
  presenceIndicator: Float32Array;
  /** Mean presence over the tonality acquisition window (∈ [0, 1]). */
  presenceHistogram: Float32Array;
  /** Current threshold of the filter. */
  filterThreshold: number;
  /** Most recent peak seen by the filter. */
  filterLastPeak: number;
  /** Mean linear magnitude of the last spectrum in [minFreq, maxFreq], in dB. */
  signalLevelDb: number;
  /** Ranked chord scores (chord window, or the HMM posterior in "hmm" mode). */
  chords: ChordScore[];
  /**
   * "hmm" chord smoothing only: posterior of the "no chord" state. The
   * chord probabilities then sum to 1 minus this.
   */
  noChordProbability?: number;
  /** Ranked 24-key scores (energy, live window). */
  liveKeys: KeyScore[];
  /** Ranked 24-key scores (energy, tonality window). */
  tonalityKeys: KeyScore[];
  /** Ranked 24-key scores (presence histogram). */
  presenceKeys: KeyScore[];
}

function zeros(): Float32Array {
  return new Float32Array(CHROMA_SIZE);
}

/** Frame with zero vectors and empty rankings (before any audio). */
export function emptyTonalityFrame(): TonalityFrame {
  return {
    instantaneousChroma: zeros(),
    chordChroma: zeros(),
    liveAcquisitionChroma: zeros(),
    tonalityAcquisitionChroma: zeros(),
    filteredLiveChroma: zeros(),
    presenceIndicator: zeros(),
    presenceHistogram: zeros(),
    filterThreshold: 0,
    filterLastPeak: 0,
    signalLevelDb: SILENCE_LEVEL_DB,
    chords: [],
    liveKeys: [],
    tonalityKeys: [],
    presenceKeys: [],
  };
}

/**
 * `base` patched by `patch`, clamped. The tolerance may come under either
 * name: the patch's wins over the base's, `filterTolerance` over
 * `filterTolerancy`, and the result carries both.
 */
function normaliseConfig(
  base: TonalityEngineConfig,
  patch: Partial<TonalityEngineConfig>,
): TonalityEngineConfig {
  const cfg = { ...base, ...patch };
  // Fail on a bad quality list at configuration time, not on the next frame.
  if (cfg.chordQualities) chordTemplates(cfg.chordQualities);
  const tolerance =
    patch.filterTolerance ?? patch.filterTolerancy ?? base.filterTolerance ?? base.filterTolerancy;
  return {
    ...cfg,
    filterTolerancy: clamp(tolerance, 0, 1),
    filterTolerance: clamp(tolerance, 0, 1),
    filterMemory: Math.round(
      clamp(cfg.filterMemory, HIGH_WATER_MARK_MEMORY_MIN, HIGH_WATER_MARK_MEMORY_MAX),
    ),
  };
}

/** The chord HMM of an engine: one state per pitch set, plus "no chord" last. */
interface HmmRig {
  hmm: ChordHmm;
  /** Pitch-set key ("0,4,7") → state index. */
  stateOf: Map<string, number>;
  /** Per-frame chord readings of the frames still inside the lag, oldest first. */
  readings: ChordScore[][];
  /** Last smoothed answer. */
  chords: ChordScore[];
  noChord: number;
}

const FLAT_CHROMA = new Float32Array(CHROMA_SIZE).fill(1);

const pitchSetKey = (c: { root: number; quality: ChordQuality }) =>
  chordPitchClasses(c.root, c.quality).join(",");

export class TonalityEngine {
  private cfg: TonalityEngineConfig;
  private hmm: HmmRig | null = null;
  private cqt: CqtChroma | null = null;
  private liveChords: ChordTally;
  private tonalityChords: ChordTally;
  private chordWindow: ChromaWindow;
  private liveWindow: ChromaWindow;
  private tonalityWindow: ChromaWindow;
  private presenceWindow: ChromaWindow;
  private filter: HighWaterMarkFilter;

  private lastInstantaneous = zeros();
  private lastFiltered = zeros();
  private lastIndicator = zeros();
  private lastLevelDb = SILENCE_LEVEL_DB;
  /**
   * Window-mode chord ranking computed by the last push (for the chord key
   * vote), handed to the next `snapshot()` instead of ranking the same
   * window again. Cleared by every push, `configure` and `reset`.
   */
  private pendingChords: ChordScore[] | null = null;

  constructor(config: Partial<TonalityEngineConfig> = {}) {
    this.cfg = normaliseConfig(TONALITY_ENGINE_DEFAULTS, config);
    const fps = this.cfg.framesPerSecond;
    this.chordWindow = new ChromaWindow({
      windowSeconds: this.cfg.chordWindowSeconds,
      framesPerSecond: fps,
    });
    this.liveWindow = new ChromaWindow({
      windowSeconds: this.cfg.liveAcquisitionSeconds,
      framesPerSecond: fps,
    });
    this.tonalityWindow = new ChromaWindow({
      windowSeconds: this.cfg.tonalityAcquisitionSeconds,
      framesPerSecond: fps,
    });
    this.presenceWindow = new ChromaWindow({
      windowSeconds: this.cfg.tonalityAcquisitionSeconds,
      framesPerSecond: fps,
    });
    this.filter = new HighWaterMarkFilter({
      tolerancy: this.cfg.filterTolerancy,
      memory: this.cfg.filterMemory,
      mode: this.cfg.filterMode,
    });
    this.hmm = this.buildHmm();
    this.liveChords = new ChordTally(Math.round(this.cfg.liveAcquisitionSeconds * fps));
    this.tonalityChords = new ChordTally(Math.round(this.cfg.tonalityAcquisitionSeconds * fps));
  }

  private buildHmm(): HmmRig | null {
    if (this.cfg.chordSmoothing !== "hmm") return null;
    const settings = { ...CHORD_HMM_DEFAULTS, ...this.cfg.chordHmm };
    const stateOf = new Map<string, number>();
    for (const t of chordTemplates(this.cfg.chordQualities ?? TRIAD_QUALITIES)) {
      const key = pitchSetKey(t);
      if (!stateOf.has(key)) stateOf.set(key, stateOf.size);
    }
    const fps = this.cfg.framesPerSecond;
    return {
      hmm: new ChordHmm({
        states: stateOf.size + 1,
        selfTransition: selfTransitionFor(settings.meanChordSeconds, fps),
        lagFrames: Math.round(settings.lagSeconds * fps),
        emissionExponent: settings.emissionExponent,
      }),
      stateOf,
      readings: [],
      chords: [],
      noChord: 0,
    };
  }

  /** Advance the chord HMM by one frame ("hmm" smoothing only). */
  private stepHmm(rig: HmmRig, chroma: Float32Array): void {
    const n = rig.stateOf.size;
    const readings = detectChord(chroma, {
      qualities: this.cfg.chordQualities,
      qualityBias: this.cfg.chordQualityBias,
    });
    const silent = chroma.every((v) => v === 0);
    const flatness = this.cfg.chordHmm?.noChordFlatness ?? CHORD_HMM_DEFAULTS.noChordFlatness;
    const bias = (q: ChordQuality) => this.cfg.chordQualityBias?.[q] ?? CHORD_QUALITY_BIAS[q];
    const scores = new Array<number>(n + 1).fill(-Infinity);
    for (const r of readings)
      scores[rig.stateOf.get(pitchSetKey(r))!] = r.similarity - bias(r.quality);
    // "No chord" scores level with the best chord at the flatness threshold,
    // above it when flatter, below it when more peaked.
    const best = Math.max(...scores);
    scores[n] = silent ? 1 : best + 2 * (cosineSimilarity(chroma, FLAT_CHROMA) - flatness);
    const emissions = silent
      ? Array.from({ length: n + 1 }, (_, i) => (i === n ? 1 : 0))
      : softmax(scores, 0.1);

    rig.readings.push(readings);
    if (rig.readings.length > rig.hmm.lagFrames + 1) rig.readings.shift();
    const posterior = rig.hmm.push(emissions);
    rig.noChord = posterior[n];
    rig.chords = rig.readings[0]
      .map((r) => ({ ...r, probability: posterior[rig.stateOf.get(pitchSetKey(r))!] }))
      .sort((a, b) => b.probability - a.probability);
  }

  /** Effective (clamped) configuration. */
  get config(): Readonly<TonalityEngineConfig> {
    return this.cfg;
  }

  /**
   * Apply a partial configuration change on the fly. Windows are resized
   * keeping their most recent frames; filter parameters take effect on the
   * next frame.
   */
  configure(patch: Partial<TonalityEngineConfig>): void {
    this.cfg = normaliseConfig(this.cfg, patch);
    this.pendingChords = null;
    const fps = this.cfg.framesPerSecond;
    this.chordWindow.resize({ windowSeconds: this.cfg.chordWindowSeconds, framesPerSecond: fps });
    this.liveWindow.resize({
      windowSeconds: this.cfg.liveAcquisitionSeconds,
      framesPerSecond: fps,
    });
    this.tonalityWindow.resize({
      windowSeconds: this.cfg.tonalityAcquisitionSeconds,
      framesPerSecond: fps,
    });
    this.presenceWindow.resize({
      windowSeconds: this.cfg.tonalityAcquisitionSeconds,
      framesPerSecond: fps,
    });
    this.filter.setTolerancy(this.cfg.filterTolerancy);
    this.filter.setMemory(this.cfg.filterMemory);
    this.filter.setMode(this.cfg.filterMode);
    this.liveChords.resize(Math.round(this.cfg.liveAcquisitionSeconds * fps));
    this.tonalityChords.resize(Math.round(this.cfg.tonalityAcquisitionSeconds * fps));
    // The HMM's states and transitions depend on the qualities and the frame
    // rate: rebuild it (its memory starts over) whenever they may change.
    if (
      "chordSmoothing" in patch ||
      "chordHmm" in patch ||
      "chordQualities" in patch ||
      "chordQualityBias" in patch ||
      "framesPerSecond" in patch
    ) {
      this.hmm = this.buildHmm();
    }
  }

  /** Clear every window and the filter memory (the configuration stays). */
  reset(): void {
    this.chordWindow.reset();
    this.liveWindow.reset();
    this.tonalityWindow.reset();
    this.presenceWindow.reset();
    this.filter.reset();
    this.hmm = this.buildHmm();
    this.liveChords.reset();
    this.tonalityChords.reset();
    this.lastInstantaneous = zeros();
    this.lastFiltered = zeros();
    this.lastIndicator = zeros();
    this.lastLevelDb = SILENCE_LEVEL_DB;
    this.pendingChords = null;
  }

  /**
   * Mean linear magnitude in [minFreq, maxFreq], in dB. Used as a cheap
   * "is something being played" level for noise gates.
   */
  signalLevelDb(magnitude: ArrayLike<number>, sampleRate: number): number {
    const nBins = magnitude.length;
    if (nBins === 0) return SILENCE_LEVEL_DB;
    const binHz = sampleRate / (2 * nBins);
    let sum = 0;
    let count = 0;
    for (let k = 1; k < nBins; k++) {
      const freq = k * binHz;
      if (freq < this.cfg.minFreq || freq > this.cfg.maxFreq) continue;
      const m = magnitude[k];
      if (Number.isFinite(m)) {
        sum += m;
        count++;
      }
    }
    const avg = count > 0 ? sum / count : 0;
    // Floor at the silence level so a quiet signal never reads below silence.
    return avg > 0 ? Math.max(SILENCE_LEVEL_DB, 20 * Math.log10(avg)) : SILENCE_LEVEL_DB;
  }

  /** Push an AnalyserNode-style dB spectrum (getFloatFrequencyData output). */
  pushDbSpectrum(dbSpectrum: ArrayLike<number>, sampleRate: number): void {
    this.pushSpectrum(dbSpectrumToMagnitude(dbSpectrum), sampleRate);
  }

  /** Push a one-sided linear magnitude spectrum (length = fftSize / 2). */
  pushSpectrum(magnitude: ArrayLike<number>, sampleRate: number): void {
    const chroma = spectrumToChroma(magnitude, {
      sampleRate,
      minFreq: this.cfg.minFreq,
      maxFreq: this.cfg.maxFreq,
      ...((this.cfg.chromaMethod === "gaussian-log" || this.cfg.chromaMethod === "cqt") &&
        GAUSSIAN_LOG_CHROMA),
    });
    this.pushChroma(chroma, this.signalLevelDb(magnitude, sampleRate));
  }

  /**
   * Push the latest time samples (e.g. AnalyserNode getFloatTimeDomainData,
   * the newest sample last) for the "cqt" chroma: each note is analysed over
   * a window ending now, up to the whole buffer for the low strings (a
   * 32768-sample buffer is 0.68 s at 48 kHz). `signalLevelDb` is passed
   * through (compute it from the spectrum, as `signalLevelDb()`, so the level
   * means the same in every mode). Other chroma methods ignore the call.
   */
  pushTimeDomain(
    samples: ArrayLike<number>,
    sampleRate: number,
    signalLevelDb = SILENCE_LEVEL_DB,
  ): void {
    if (this.cfg.chromaMethod !== "cqt") return;
    if (!this.cqt || this.cqt.sampleRate !== sampleRate || this.cqt.maxLength !== samples.length) {
      this.cqt = new CqtChroma({ sampleRate, maxLength: samples.length });
    }
    this.pushChroma(this.cqt.analyse(samples).chroma, signalLevelDb);
  }

  /** The chord shown for the latest frame, as a vote label ("root|maj"), or null. */
  private currentChordLabel(): string | null {
    let top: ChordScore | undefined;
    if (this.hmm) {
      top = this.hmm.chords[0];
      if (top && this.hmm.noChord > top.probability) return null;
    } else {
      const chroma = this.chordWindow.aggregate();
      if (chroma.every((v) => v === 0)) return null;
      this.pendingChords = detectChord(chroma, {
        qualities: this.cfg.chordQualities,
        qualityBias: this.cfg.chordQualityBias,
      });
      top = this.pendingChords[0];
    }
    if (!top) return null;
    const base = baseTriad(top.quality);
    return base === "maj" || base === "min" ? `${top.root}|${base}` : null;
  }

  /**
   * Push an already computed instantaneous chroma. This is the step shared
   * by the live and offline paths; `signalLevelDb` is optional metadata.
   */
  pushChroma(chroma: ArrayLike<number>, signalLevelDb = SILENCE_LEVEL_DB): void {
    if (chroma.length !== CHROMA_SIZE) {
      throw new Error(`expected chroma of length ${CHROMA_SIZE}, got ${chroma.length}`);
    }
    const inst = new Float32Array(CHROMA_SIZE);
    for (let i = 0; i < CHROMA_SIZE; i++) inst[i] = chroma[i];
    this.pendingChords = null;

    this.chordWindow.push(inst);
    this.liveWindow.push(inst);
    this.tonalityWindow.push(inst);

    const filtered = this.filter.filter(this.liveWindow.aggregate());
    const indicator = new Float32Array(CHROMA_SIZE);
    for (let i = 0; i < CHROMA_SIZE; i++) indicator[i] = filtered[i] > 0 ? 1 : 0;
    this.presenceWindow.push(indicator);

    if (this.hmm) this.stepHmm(this.hmm, inst);
    if (this.cfg.keyMethod === "chords") {
      const label = inst.every((v) => v === 0) ? null : this.currentChordLabel();
      this.liveChords.push(label);
      this.tonalityChords.push(label);
    }

    this.lastInstantaneous = inst;
    this.lastFiltered = filtered;
    this.lastIndicator = indicator;
    this.lastLevelDb = signalLevelDb;
  }

  /** Aggregates and rankings for the current state. */
  snapshot(): TonalityFrame {
    const chordChroma = this.chordWindow.aggregate();
    const liveChroma = this.liveWindow.aggregate();
    const tonalityChroma = this.tonalityWindow.aggregate();
    const presence = this.presenceWindow.aggregateRaw();
    const hasAudio = this.chordWindow.size > 0;
    const keyOptions = { profile: this.cfg.keyProfile };
    // Taken once: a second snapshot of the same frame ranks the window again
    // (each snapshot owns its arrays).
    const pending = this.pendingChords;
    this.pendingChords = null;
    return {
      instantaneousChroma: this.lastInstantaneous,
      chordChroma,
      liveAcquisitionChroma: liveChroma,
      tonalityAcquisitionChroma: tonalityChroma,
      filteredLiveChroma: this.lastFiltered,
      presenceIndicator: this.lastIndicator,
      presenceHistogram: presence,
      filterThreshold: this.filter.currentThreshold,
      filterLastPeak: this.filter.lastPeak,
      signalLevelDb: this.lastLevelDb,
      chords: !hasAudio
        ? []
        : this.hmm
          ? this.hmm.chords
          : (pending ??
            detectChord(chordChroma, {
              qualities: this.cfg.chordQualities,
              qualityBias: this.cfg.chordQualityBias,
            })),
      ...(this.hmm && { noChordProbability: hasAudio ? this.hmm.noChord : 0 }),
      liveKeys: !hasAudio
        ? []
        : this.cfg.keyMethod === "chords"
          ? keysFromChords(this.liveChords, liveChroma, this.cfg.keyProfile)
          : detectKey(liveChroma, keyOptions),
      tonalityKeys: !hasAudio
        ? []
        : this.cfg.keyMethod === "chords"
          ? keysFromChords(this.tonalityChords, tonalityChroma, this.cfg.keyProfile)
          : detectKey(tonalityChroma, keyOptions),
      presenceKeys: hasAudio ? detectKeyFromPresence(presence, 0.1, this.cfg.keyProfile) : [],
    };
  }

  processDbSpectrum(dbSpectrum: ArrayLike<number>, sampleRate: number): TonalityFrame {
    this.pushDbSpectrum(dbSpectrum, sampleRate);
    return this.snapshot();
  }

  processSpectrum(magnitude: ArrayLike<number>, sampleRate: number): TonalityFrame {
    this.pushSpectrum(magnitude, sampleRate);
    return this.snapshot();
  }

  processTimeDomain(
    samples: ArrayLike<number>,
    sampleRate: number,
    signalLevelDb = SILENCE_LEVEL_DB,
  ): TonalityFrame {
    this.pushTimeDomain(samples, sampleRate, signalLevelDb);
    return this.snapshot();
  }

  processChroma(chroma: ArrayLike<number>, signalLevelDb = SILENCE_LEVEL_DB): TonalityFrame {
    this.pushChroma(chroma, signalLevelDb);
    return this.snapshot();
  }
}
