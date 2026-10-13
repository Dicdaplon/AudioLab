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
 */

import { detectChord, type ChordScore } from "../chordDetection";
import { CHROMA_SIZE, dbSpectrumToMagnitude, spectrumToChroma } from "../chroma";
import {
  HighWaterMarkFilter,
  HIGH_WATER_MARK_DEFAULTS,
  HIGH_WATER_MARK_MEMORY_MAX,
  HIGH_WATER_MARK_MEMORY_MIN,
  type HighWaterMarkMode,
} from "../highWaterMark";
import { detectKey, type KeyScore } from "../keyDetection";
import { clamp } from "../math";
import { detectKeyFromPresence } from "../presenceTonality";
import { ChromaWindow } from "../windowing";

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
  /** High-water-mark filter tolerance ∈ [0, 1]. */
  filterTolerancy: number;
  /** High-water-mark filter memory ∈ [MEMORY_MIN, MEMORY_MAX]. */
  filterMemory: number;
  /** High-water-mark peak aggregation. */
  filterMode: HighWaterMarkMode;
}

export const TONALITY_ENGINE_DEFAULTS: TonalityEngineConfig = {
  framesPerSecond: 10,
  chordWindowSeconds: 1,
  liveAcquisitionSeconds: 8,
  tonalityAcquisitionSeconds: 30,
  minFreq: 55,
  maxFreq: 5000,
  filterTolerancy: HIGH_WATER_MARK_DEFAULTS.tolerancy,
  filterMemory: HIGH_WATER_MARK_DEFAULTS.memory,
  filterMode: HIGH_WATER_MARK_DEFAULTS.mode,
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
  /** Ranked chord scores (chord window). */
  chords: ChordScore[];
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

function normaliseConfig(cfg: TonalityEngineConfig): TonalityEngineConfig {
  return {
    ...cfg,
    filterTolerancy: clamp(cfg.filterTolerancy, 0, 1),
    filterMemory: Math.round(
      clamp(cfg.filterMemory, HIGH_WATER_MARK_MEMORY_MIN, HIGH_WATER_MARK_MEMORY_MAX),
    ),
  };
}

export class TonalityEngine {
  private cfg: TonalityEngineConfig;
  private chordWindow: ChromaWindow;
  private liveWindow: ChromaWindow;
  private tonalityWindow: ChromaWindow;
  private presenceWindow: ChromaWindow;
  private filter: HighWaterMarkFilter;

  private lastInstantaneous = zeros();
  private lastFiltered = zeros();
  private lastIndicator = zeros();
  private lastLevelDb = SILENCE_LEVEL_DB;

  constructor(config: Partial<TonalityEngineConfig> = {}) {
    this.cfg = normaliseConfig({ ...TONALITY_ENGINE_DEFAULTS, ...config });
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
    this.cfg = normaliseConfig({ ...this.cfg, ...patch });
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
  }

  /** Clear every window and the filter memory (the configuration stays). */
  reset(): void {
    this.chordWindow.reset();
    this.liveWindow.reset();
    this.tonalityWindow.reset();
    this.presenceWindow.reset();
    this.filter.reset();
    this.lastInstantaneous = zeros();
    this.lastFiltered = zeros();
    this.lastIndicator = zeros();
    this.lastLevelDb = SILENCE_LEVEL_DB;
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
    return avg > 0 ? 20 * Math.log10(avg) : SILENCE_LEVEL_DB;
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
    });
    this.pushChroma(chroma, this.signalLevelDb(magnitude, sampleRate));
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

    this.chordWindow.push(inst);
    this.liveWindow.push(inst);
    this.tonalityWindow.push(inst);

    const filtered = this.filter.filter(this.liveWindow.aggregate());
    const indicator = new Float32Array(CHROMA_SIZE);
    for (let i = 0; i < CHROMA_SIZE; i++) indicator[i] = filtered[i] > 0 ? 1 : 0;
    this.presenceWindow.push(indicator);

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
      chords: hasAudio ? detectChord(chordChroma) : [],
      liveKeys: hasAudio ? detectKey(liveChroma) : [],
      tonalityKeys: hasAudio ? detectKey(tonalityChroma) : [],
      presenceKeys: hasAudio ? detectKeyFromPresence(presence) : [],
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

  processChroma(chroma: ArrayLike<number>, signalLevelDb = SILENCE_LEVEL_DB): TonalityFrame {
    this.pushChroma(chroma, signalLevelDb);
    return this.snapshot();
  }
}
