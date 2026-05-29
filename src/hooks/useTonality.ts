/**
 * React hook that orchestrates the full live pipeline.
 *
 * Three sliding ChromaWindows + one HighWaterMark + one presence accumulator
 * run in parallel from a single FFT per frame:
 *
 *   chordWindow            (1 s default)         → 24 chord probabilities
 *   liveAcquisitionWindow  (8 s default)         → 24 key probabilities (energy)
 *   tonalityAcquisitionWin (30 s default)        → 24 key probabilities (energy)
 *
 *   ToneBaseTonality (presence-based, secondary path):
 *     liveAcquisitionWindow.aggregate()
 *      → HighWaterMarkFilter (configurable tolerancy + memory)
 *      → binary indicator
 *      → presenceWindow (over tonalityAcquisition seconds)
 *      → detectKeyFromPresence
 *
 * Window sizes and filter params are reactive: changing them rebuilds the
 * affected buffers / filter state on the fly.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createAnalyser,
  readSpectrumDb,
  startTimeCapture,
  type AnalyserSetup,
} from "../audio/analyser";
import { openMicrophone, type MicSource } from "../audio/micStream";
import {
  CHROMA_SIZE,
  dbSpectrumToMagnitude,
  spectrumToChroma,
} from "../analysis/chroma";
import { ChromaWindow } from "../analysis/windowing";
import { detectKey, type KeyScore } from "../analysis/keyDetection";
import { detectChord, type ChordScore } from "../analysis/chordDetection";
import { detectKeyFromPresence } from "../analysis/presenceTonality";
import {
  HighWaterMarkFilter,
  HIGH_WATER_MARK_DEFAULTS,
  HIGH_WATER_MARK_MEMORY_MAX,
  HIGH_WATER_MARK_MEMORY_MIN,
  type HighWaterMarkMode,
} from "../analysis/highWaterMark";
import { TimeRingBuffer } from "../analysis/timeBuffer";
import { computeFftDb } from "../analysis/timeFft";
import { estimateNoiseFloor, type NoiseFloorMethod } from "../analysis/noiseFloor";
import { LowpassFilter } from "../analysis/lowpass";

export interface UseTonalityOptions {
  /** Live acquisition window length (seconds). Was "short key window". */
  liveAcquisitionSeconds?: number;
  /** Tonality acquisition window length (seconds). Was "long key window". */
  tonalityAcquisitionSeconds?: number;
  /** Chord detection window length (seconds). */
  chordWindowSeconds?: number;
  framesPerSecond?: number;
  fftSize?: number;
  minFreq?: number;
  maxFreq?: number;
  /** High-water-mark filter tolerancy ∈ [0, 1]. */
  maxFilterTolerancy?: number;
  /** High-water-mark filter memory ∈ [2, 15]. */
  maxFilterMemory?: number;
  /** Aggregation mode for the peak memory. */
  maxFilterMode?: HighWaterMarkMode;
  /** FFT analysis enabled. */
  fftEnabled?: boolean;
  /** Noise floor estimation method ("median", "mean", "p80"). */
  noiseMethod?: NoiseFloorMethod;
  /** Lowpass filter cutoff for tempo analysis (Hz). */
  lowpassCutoffHz?: number;
}

export interface TonalityState {
  running: boolean;
  error: string | null;

  /** Latest single-frame chroma (12-D). */
  instantaneousChroma: Float32Array;

  /** Chroma averaged over the chord window. */
  chordChroma: Float32Array;
  /** Chroma averaged over the live acquisition window. */
  liveAcquisitionChroma: Float32Array;
  /** Chroma averaged over the tonality acquisition window. */
  tonalityAcquisitionChroma: Float32Array;

  /** Live acquisition chroma AFTER the high-water-mark filter. */
  filteredLiveChroma: Float32Array;
  /** Binary 0/1 indicator derived from the filtered live chroma. */
  presenceIndicator: Float32Array;
  /** Mean presence over the tonality acquisition window (∈ [0, 1]). */
  presenceHistogram: Float32Array;

  /** Current threshold value used by the filter. */
  filterThreshold: number;
  /** Most recent peak observed by the filter. */
  filterLastPeak: number;

  /** Average dB of the last spectrum frame in the music band [minFreq, maxFreq]. */
  signalLevelDb: number;

  /** Ranked chord probabilities (chord window). */
  chords: ChordScore[];
  /** Ranked 24-key probabilities (energy, live window). */
  liveKeys: KeyScore[];
  /** Ranked 24-key probabilities (energy, tonality window). */
  tonalityKeys: KeyScore[];
  /** Ranked 24-key probabilities (presence-based, ToneBaseTonality). */
  presenceKeys: KeyScore[];

  /** Effective configured durations + filter params, mirrored for the UI. */
  config: {
    liveAcquisitionSeconds: number;
    tonalityAcquisitionSeconds: number;
    chordWindowSeconds: number;
    framesPerSecond: number;
    maxFilterTolerancy: number;
    maxFilterMemory: number;
    maxFilterMode: HighWaterMarkMode;
  };

  /** FFT analysis state (Section 1: magnitude spectrum + noise floor). */
  fft: {
    spectrumDb: Float32Array;
    binHz: number;
    noiseFloorDb: number;
    noiseMethod: NoiseFloorMethod;
  };

  /** Tempo analysis state (Section 2: lowpass-filtered envelope). */
  tempoAnalysis: {
    envelopeDb: Float32Array;
    binHz: number;
    lowpassCutoffHz: number;
  };
}

const DEFAULTS = {
  liveAcquisitionSeconds: 8,
  tonalityAcquisitionSeconds: 30,
  chordWindowSeconds: 1,
  framesPerSecond: 10,
  fftSize: 16384,
  minFreq: 55,
  maxFreq: 5000,
  maxFilterTolerancy: HIGH_WATER_MARK_DEFAULTS.tolerancy,
  maxFilterMemory: HIGH_WATER_MARK_DEFAULTS.memory,
  maxFilterMode: HIGH_WATER_MARK_DEFAULTS.mode,
  fftEnabled: false,
  noiseMethod: "median" as NoiseFloorMethod,
  lowpassCutoffHz: 2,
};

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function emptyVector(): Float32Array {
  return new Float32Array(CHROMA_SIZE);
}

export function useTonality(options: UseTonalityOptions = {}) {
  const opts = {
    liveAcquisitionSeconds: options.liveAcquisitionSeconds ?? DEFAULTS.liveAcquisitionSeconds,
    tonalityAcquisitionSeconds:
      options.tonalityAcquisitionSeconds ?? DEFAULTS.tonalityAcquisitionSeconds,
    chordWindowSeconds: options.chordWindowSeconds ?? DEFAULTS.chordWindowSeconds,
    framesPerSecond: options.framesPerSecond ?? DEFAULTS.framesPerSecond,
    fftSize: options.fftSize ?? DEFAULTS.fftSize,
    minFreq: options.minFreq ?? DEFAULTS.minFreq,
    maxFreq: options.maxFreq ?? DEFAULTS.maxFreq,
    maxFilterTolerancy: clamp(
      options.maxFilterTolerancy ?? DEFAULTS.maxFilterTolerancy,
      0,
      1,
    ),
    maxFilterMemory: Math.round(
      clamp(
        options.maxFilterMemory ?? DEFAULTS.maxFilterMemory,
        HIGH_WATER_MARK_MEMORY_MIN,
        HIGH_WATER_MARK_MEMORY_MAX,
      ),
    ),
    maxFilterMode: options.maxFilterMode ?? DEFAULTS.maxFilterMode,
    fftEnabled: options.fftEnabled ?? DEFAULTS.fftEnabled,
    noiseMethod: options.noiseMethod ?? DEFAULTS.noiseMethod,
    lowpassCutoffHz: Math.max(
      0.5,
      Math.min(options.lowpassCutoffHz ?? DEFAULTS.lowpassCutoffHz, 10),
    ),
  };

  const [state, setState] = useState<TonalityState>(() => ({
    running: false,
    error: null,
    instantaneousChroma: emptyVector(),
    chordChroma: emptyVector(),
    liveAcquisitionChroma: emptyVector(),
    tonalityAcquisitionChroma: emptyVector(),
    filteredLiveChroma: emptyVector(),
    presenceIndicator: emptyVector(),
    presenceHistogram: emptyVector(),
    filterThreshold: 0,
    filterLastPeak: 0,
    signalLevelDb: -100,
    chords: [],
    liveKeys: [],
    tonalityKeys: [],
    presenceKeys: [],
    config: {
      liveAcquisitionSeconds: opts.liveAcquisitionSeconds,
      tonalityAcquisitionSeconds: opts.tonalityAcquisitionSeconds,
      chordWindowSeconds: opts.chordWindowSeconds,
      framesPerSecond: opts.framesPerSecond,
      maxFilterTolerancy: opts.maxFilterTolerancy,
      maxFilterMemory: opts.maxFilterMemory,
      maxFilterMode: opts.maxFilterMode,
    },
    fft: {
      spectrumDb: new Float32Array(0),
      binHz: 0,
      noiseFloorDb: -100,
      noiseMethod: opts.noiseMethod,
    },
    tempoAnalysis: {
      envelopeDb: new Float32Array(0),
      binHz: 0,
      lowpassCutoffHz: opts.lowpassCutoffHz,
    },
  }));

  const micRef = useRef<MicSource | null>(null);
  const analyserRef = useRef<AnalyserSetup | null>(null);
  const chordWindowRef = useRef<ChromaWindow | null>(null);
  const liveWindowRef = useRef<ChromaWindow | null>(null);
  const tonalityWindowRef = useRef<ChromaWindow | null>(null);
  const presenceWindowRef = useRef<ChromaWindow | null>(null);
  const filterRef = useRef<HighWaterMarkFilter | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // FFT analysis.
  const timeBufferRef = useRef<TimeRingBuffer | null>(null);
  const lowpassFilterRef = useRef<LowpassFilter | null>(null);
  const prevSpectrumDbRef = useRef<Float32Array | null>(null);

  // Latest opts (always up-to-date inside the interval callback).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Resize windows when their seconds setting changes during a session.
  useEffect(() => {
    if (chordWindowRef.current) {
      chordWindowRef.current.resize({
        windowSeconds: opts.chordWindowSeconds,
        framesPerSecond: opts.framesPerSecond,
      });
    }
    if (liveWindowRef.current) {
      liveWindowRef.current.resize({
        windowSeconds: opts.liveAcquisitionSeconds,
        framesPerSecond: opts.framesPerSecond,
      });
    }
    if (tonalityWindowRef.current) {
      tonalityWindowRef.current.resize({
        windowSeconds: opts.tonalityAcquisitionSeconds,
        framesPerSecond: opts.framesPerSecond,
      });
    }
    if (presenceWindowRef.current) {
      presenceWindowRef.current.resize({
        windowSeconds: opts.tonalityAcquisitionSeconds,
        framesPerSecond: opts.framesPerSecond,
      });
    }
  }, [
    opts.chordWindowSeconds,
    opts.liveAcquisitionSeconds,
    opts.tonalityAcquisitionSeconds,
    opts.framesPerSecond,
  ]);

  // Update filter params live.
  useEffect(() => {
    const f = filterRef.current;
    if (!f) return;
    f.setTolerancy(opts.maxFilterTolerancy);
    f.setMemory(opts.maxFilterMemory);
    f.setMode(opts.maxFilterMode);
  }, [opts.maxFilterTolerancy, opts.maxFilterMemory, opts.maxFilterMode]);

  /**
   * Clear all sliding-window buffers + filter memory, without stopping the
   * mic. Display state is also wiped to zero vectors. After a reset, the
   * windows refill from scratch as new audio comes in.
   */
  const reset = useCallback(() => {
    chordWindowRef.current?.reset();
    liveWindowRef.current?.reset();
    tonalityWindowRef.current?.reset();
    presenceWindowRef.current?.reset();
    filterRef.current?.reset();
    timeBufferRef.current?.reset();
    lowpassFilterRef.current?.reset();
    prevSpectrumDbRef.current = null;
    setState((s) => ({
      ...s,
      instantaneousChroma: emptyVector(),
      chordChroma: emptyVector(),
      liveAcquisitionChroma: emptyVector(),
      tonalityAcquisitionChroma: emptyVector(),
      filteredLiveChroma: emptyVector(),
      presenceIndicator: emptyVector(),
      presenceHistogram: emptyVector(),
      filterThreshold: 0,
      filterLastPeak: 0,
      signalLevelDb: -100,
      chords: [],
      liveKeys: [],
      tonalityKeys: [],
      presenceKeys: [],
      fft: {
        spectrumDb: new Float32Array(0),
        binHz: 0,
        noiseFloorDb: -100,
        noiseMethod: s.fft.noiseMethod,
      },
      tempoAnalysis: {
        envelopeDb: new Float32Array(0),
        binHz: 0,
        lowpassCutoffHz: s.tempoAnalysis.lowpassCutoffHz,
      },
    }));
  }, []);

  const stop = useCallback(async () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (micRef.current) {
      await micRef.current.dispose();
      micRef.current = null;
    }
    analyserRef.current = null;
    chordWindowRef.current = null;
    liveWindowRef.current = null;
    tonalityWindowRef.current = null;
    presenceWindowRef.current = null;
    filterRef.current = null;
    timeBufferRef.current = null;
    lowpassFilterRef.current = null;
    prevSpectrumDbRef.current = null;
    setState((s) => ({ ...s, running: false }));
  }, []);

  const start = useCallback(async () => {
    try {
      if (micRef.current) return;
      const o = optsRef.current;
      const mic = await openMicrophone();
      const analyser = createAnalyser(mic.context, mic.source, {
        fftSize: o.fftSize,
      });

      micRef.current = mic;
      analyserRef.current = analyser;
      chordWindowRef.current = new ChromaWindow({
        windowSeconds: o.chordWindowSeconds,
        framesPerSecond: o.framesPerSecond,
      });
      liveWindowRef.current = new ChromaWindow({
        windowSeconds: o.liveAcquisitionSeconds,
        framesPerSecond: o.framesPerSecond,
      });
      tonalityWindowRef.current = new ChromaWindow({
        windowSeconds: o.tonalityAcquisitionSeconds,
        framesPerSecond: o.framesPerSecond,
      });
      presenceWindowRef.current = new ChromaWindow({
        windowSeconds: o.tonalityAcquisitionSeconds,
        framesPerSecond: o.framesPerSecond,
      });
      filterRef.current = new HighWaterMarkFilter({
        tolerancy: o.maxFilterTolerancy,
        memory: o.maxFilterMemory,
        mode: o.maxFilterMode,
      });

      // Initialize FFT analysis buffers if enabled.
      if (o.fftEnabled) {
        const timeBufferCapacity = Math.round(8 * analyser.sampleRate); // 8 seconds
        timeBufferRef.current = new TimeRingBuffer(timeBufferCapacity);
        lowpassFilterRef.current = new LowpassFilter(o.lowpassCutoffHz, analyser.sampleRate);
        prevSpectrumDbRef.current = null;

        // Start time-domain audio capture.
        try {
          await startTimeCapture(analyser, (samples) => {
            timeBufferRef.current?.push(samples);
          });
        } catch (err) {
          // Worklet loading may fail; log but continue without time capture.
          console.warn(
            `Failed to start time capture: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      const periodMs = 1000 / o.framesPerSecond;
      intervalRef.current = setInterval(() => {
        const a = analyserRef.current;
        const wChord = chordWindowRef.current;
        const wLive = liveWindowRef.current;
        const wTon = tonalityWindowRef.current;
        const wPres = presenceWindowRef.current;
        const filt = filterRef.current;
        const curOpts = optsRef.current;
        if (!a || !wChord || !wLive || !wTon || !wPres || !filt) return;

        const db = readSpectrumDb(a);
        const mag = dbSpectrumToMagnitude(db);
        const inst = spectrumToChroma(mag, {
          sampleRate: a.sampleRate,
          minFreq: curOpts.minFreq,
          maxFreq: curOpts.maxFreq,
        });

        // Average linear magnitude in the music band → dB. Useful as a
        // "is something being played" indicator for the noise gate.
        const nBins = mag.length;
        const binHz = a.sampleRate / (2 * nBins);
        let levelSum = 0;
        let levelBins = 0;
        for (let k = 1; k < nBins; k++) {
          const freq = k * binHz;
          if (freq < curOpts.minFreq || freq > curOpts.maxFreq) continue;
          if (Number.isFinite(mag[k])) {
            levelSum += mag[k];
            levelBins += 1;
          }
        }
        const avgLinear = levelBins > 0 ? levelSum / levelBins : 0;
        const signalLevelDb = avgLinear > 0 ? 20 * Math.log10(avgLinear) : -100;

        wChord.push(inst);
        wLive.push(inst);
        wTon.push(inst);

        const chordChroma = wChord.aggregate();
        const liveChroma = wLive.aggregate();
        const tonChroma = wTon.aggregate();

        const filteredLive = filt.filter(liveChroma);
        const indicator = new Float32Array(CHROMA_SIZE);
        for (let i = 0; i < CHROMA_SIZE; i++) {
          indicator[i] = filteredLive[i] > 0 ? 1 : 0;
        }
        wPres.push(indicator);
        const presence = wPres.aggregateRaw();

        // FFT analysis (Section 1 + Section 2).
        let fftSpectrumDb: Float32Array = new Float32Array(0);
        let fftBinHz = 0;
        let fftNoiseFloorDb = -100;
        let tempoEnvelopeDb: Float32Array = new Float32Array(0);
        let tempoBinHz = 0;

        if (curOpts.fftEnabled) {
          const timeBuf = timeBufferRef.current;
          const lpFilter = lowpassFilterRef.current;
          if (timeBuf && lpFilter) {
            // Section 1: Compute FFT magnitude + noise floor.
            const timeSignal = timeBuf.lastSeconds(1, a.sampleRate); // 1 second
            const fftResult = computeFftDb(timeSignal, a.sampleRate);
            fftSpectrumDb = fftResult.spectrumDb as Float32Array;
            fftBinHz = fftResult.binHz;

            const noiseFloor = estimateNoiseFloor(fftResult.spectrumDb, curOpts.noiseMethod);
            fftNoiseFloorDb = noiseFloor.noiseFloorDb;

            // Section 2: Temporal envelope analysis via lowpass filtering.
            const prevDb = prevSpectrumDbRef.current;
            if (prevDb && prevDb.length === fftResult.spectrumDb.length) {
              // For each bin, compute the instantaneous envelope by lowpass filtering
              // the dB magnitude over time.
              const envelope = new Float32Array(fftResult.spectrumDb.length);
              for (let k = 0; k < fftResult.spectrumDb.length; k++) {
                // Lowpass filter the dB value at this bin.
                const dbVal = fftResult.spectrumDb[k];
                envelope[k] = lpFilter.processSample(dbVal);
              }
              tempoEnvelopeDb = envelope;
              tempoBinHz = fftBinHz;
            }
            prevSpectrumDbRef.current = new Float32Array(fftResult.spectrumDb);
          }
        }

        setState({
          running: true,
          error: null,
          instantaneousChroma: inst,
          chordChroma,
          liveAcquisitionChroma: liveChroma,
          tonalityAcquisitionChroma: tonChroma,
          filteredLiveChroma: filteredLive,
          presenceIndicator: indicator,
          presenceHistogram: presence,
          filterThreshold: filt.currentThreshold,
          filterLastPeak: filt.lastPeak,
          signalLevelDb,
          chords: detectChord(chordChroma),
          liveKeys: detectKey(liveChroma),
          tonalityKeys: detectKey(tonChroma),
          presenceKeys: detectKeyFromPresence(presence),
          config: {
            liveAcquisitionSeconds: curOpts.liveAcquisitionSeconds,
            tonalityAcquisitionSeconds: curOpts.tonalityAcquisitionSeconds,
            chordWindowSeconds: curOpts.chordWindowSeconds,
            framesPerSecond: curOpts.framesPerSecond,
            maxFilterTolerancy: curOpts.maxFilterTolerancy,
            maxFilterMemory: curOpts.maxFilterMemory,
            maxFilterMode: curOpts.maxFilterMode,
          },
          fft: {
            spectrumDb: fftSpectrumDb,
            binHz: fftBinHz,
            noiseFloorDb: fftNoiseFloorDb,
            noiseMethod: curOpts.noiseMethod,
          },
          tempoAnalysis: {
            envelopeDb: tempoEnvelopeDb,
            binHz: tempoBinHz,
            lowpassCutoffHz: curOpts.lowpassCutoffHz,
          },
        });
      }, periodMs);

      setState((s) => ({ ...s, running: true, error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, running: false, error: msg }));
      await stop();
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return { ...state, start, stop, reset };
}
