/**
 * React hook that orchestrates the live pipeline: microphone → AnalyserNode
 * spectrum → `TonalityEngine` (chroma windows, high-water-mark filter,
 * presence histogram, rankings) → React state, at `framesPerSecond`.
 *
 * Window sizes and filter params are reactive: changing them reconfigures
 * the engine on the fly.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createAnalyser, readSpectrumDb, type AnalyserSetup } from "../audio/analyser";
import { toMicError } from "../audio/errors";
import { openMicrophone, type MicSource } from "../audio/micStream";
import { CHROMA_SIZE } from "../analysis/chroma";
import {
  TonalityEngine,
  emptyTonalityFrame,
  type TonalityFrame,
} from "../analysis/engine/tonalityEngine";
import {
  HIGH_WATER_MARK_MEMORY_MAX,
  HIGH_WATER_MARK_MEMORY_MIN,
  type HighWaterMarkMode,
} from "../analysis/highWaterMark";
import { clamp } from "../analysis/math";
import { estimateNoiseFloor, type NoiseFloorMethod } from "../analysis/noiseFloor";
import { LowpassFilter } from "../analysis/lowpass";
import { TimeRingBuffer } from "../analysis/timeBuffer";
import { computeFftDb } from "../analysis/timeFft";
import {
  ANALYSIS_DEFAULTS,
  DEFAULT_DETECTOR_SETTINGS,
  DEFAULT_FFT_SETTINGS,
  LOWPASS_CUTOFF_RANGE,
} from "../config/settings";

export interface UseTonalityOptions {
  /** Live acquisition window length (seconds). */
  liveAcquisitionSeconds?: number;
  /** Tonality acquisition window length (seconds). */
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

export interface TonalityState extends TonalityFrame {
  running: boolean;
  error: string | null;

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

  /** Tempo analysis state (Section 2: lowpass-filtered envelope + time signal). */
  tempoAnalysis: {
    envelopeDb: Float32Array;
    binHz: number;
    lowpassCutoffHz: number;
    timeSignal: Float32Array;
    sampleRate: number;
  };
}

const DEFAULTS = {
  ...DEFAULT_DETECTOR_SETTINGS,
  ...ANALYSIS_DEFAULTS,
  fftEnabled: false,
  noiseMethod: DEFAULT_FFT_SETTINGS.noiseMethod,
  lowpassCutoffHz: DEFAULT_FFT_SETTINGS.lowpassCutoffHz,
};

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
    maxFilterTolerancy: clamp(options.maxFilterTolerancy ?? DEFAULTS.maxFilterTolerancy, 0, 1),
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
    lowpassCutoffHz: clamp(
      options.lowpassCutoffHz ?? DEFAULTS.lowpassCutoffHz,
      LOWPASS_CUTOFF_RANGE.min,
      LOWPASS_CUTOFF_RANGE.max,
    ),
  };

  const [state, setState] = useState<TonalityState>(() => ({
    ...emptyTonalityFrame(),
    running: false,
    error: null,
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
      timeSignal: new Float32Array(0),
      sampleRate: 0,
    },
  }));

  const micRef = useRef<MicSource | null>(null);
  const analyserRef = useRef<AnalyserSetup | null>(null);
  const engineRef = useRef<TonalityEngine | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tempo analysis: a single lowpass filter applied to the time-domain signal
  // (at the audio sample rate) before its FFT is computed for Section 2.
  const lowpassTimeFilterRef = useRef<LowpassFilter | null>(null);
  // Time-domain signal buffer (8 seconds) for display.
  const timeBufferRef = useRef<TimeRingBuffer | null>(null);

  // Latest opts (always up-to-date inside the interval callback).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Reconfigure the engine when window sizes or filter params change.
  useEffect(() => {
    engineRef.current?.configure({
      framesPerSecond: opts.framesPerSecond,
      chordWindowSeconds: opts.chordWindowSeconds,
      liveAcquisitionSeconds: opts.liveAcquisitionSeconds,
      tonalityAcquisitionSeconds: opts.tonalityAcquisitionSeconds,
      minFreq: opts.minFreq,
      maxFreq: opts.maxFreq,
      filterTolerancy: opts.maxFilterTolerancy,
      filterMemory: opts.maxFilterMemory,
      filterMode: opts.maxFilterMode,
    });
  }, [
    opts.framesPerSecond,
    opts.chordWindowSeconds,
    opts.liveAcquisitionSeconds,
    opts.tonalityAcquisitionSeconds,
    opts.minFreq,
    opts.maxFreq,
    opts.maxFilterTolerancy,
    opts.maxFilterMemory,
    opts.maxFilterMode,
  ]);

  /**
   * Clear all sliding-window buffers + filter memory, without stopping the
   * mic. Display state is also wiped to zero vectors. After a reset, the
   * windows refill from scratch as new audio comes in.
   */
  const reset = useCallback(() => {
    engineRef.current?.reset();
    setState((s) => ({
      ...s,
      ...emptyTonalityFrame(),
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
        timeSignal: new Float32Array(0),
        sampleRate: s.tempoAnalysis.sampleRate,
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
    engineRef.current = null;
    lowpassTimeFilterRef.current = null;
    timeBufferRef.current = null;
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

      // Initialize time-domain buffer for 8-second signal display.
      const timeBufferCapacity = Math.round(8 * analyser.sampleRate);
      timeBufferRef.current = new TimeRingBuffer(timeBufferCapacity);
      engineRef.current = new TonalityEngine({
        framesPerSecond: o.framesPerSecond,
        chordWindowSeconds: o.chordWindowSeconds,
        liveAcquisitionSeconds: o.liveAcquisitionSeconds,
        tonalityAcquisitionSeconds: o.tonalityAcquisitionSeconds,
        minFreq: o.minFreq,
        maxFreq: o.maxFreq,
        filterTolerancy: o.maxFilterTolerancy,
        filterMemory: o.maxFilterMemory,
        filterMode: o.maxFilterMode,
      });

      // Section 2 lowpass filter operates on the time-domain signal at the
      // audio sample rate; (re)built lazily inside the frame loop so cutoff
      // changes take effect.
      lowpassTimeFilterRef.current = null;

      const periodMs = 1000 / o.framesPerSecond;
      intervalRef.current = setInterval(() => {
        const a = analyserRef.current;
        const engine = engineRef.current;
        const curOpts = optsRef.current;
        if (!a || !engine) return;

        const db = readSpectrumDb(a);

        // Capture time-domain samples for display: only the new tail of the
        // analyser window (approximately sampleRate / framesPerSecond
        // samples) so a transient is not duplicated across frames.
        const timeBuf = timeBufferRef.current;
        if (timeBuf && a.analyser) {
          const windowLen = a.analyser.fftSize;
          const timeDomainData = new Float32Array(windowLen);
          a.analyser.getFloatTimeDomainData(timeDomainData);

          const advance = Math.min(
            windowLen,
            Math.max(1, Math.round(a.sampleRate / curOpts.framesPerSecond)),
          );
          timeBuf.push(timeDomainData.subarray(windowLen - advance));
        }

        const frame = engine.processDbSpectrum(db, a.sampleRate);

        // FFT analysis: use the spectrum dB directly from the AnalyserNode.
        const fftSpectrumDb = new Float32Array(db);
        const fftBinHz = a.sampleRate / (2 * db.length);
        const fftNoiseFloorDb = estimateNoiseFloor(fftSpectrumDb, curOpts.noiseMethod).noiseFloorDb;

        // Section 2: lowpass the 8 s time-domain signal and FFT its most
        // recent power-of-two chunk.
        let rawTimeSignal: Float32Array = new Float32Array(0);
        const timeBufDisplay = timeBufferRef.current;
        if (timeBufDisplay) {
          rawTimeSignal = timeBufDisplay.lastSeconds(8, a.sampleRate);
        }

        if (!lowpassTimeFilterRef.current) {
          lowpassTimeFilterRef.current = new LowpassFilter(curOpts.lowpassCutoffHz, a.sampleRate);
        } else {
          lowpassTimeFilterRef.current.setCutoff(curOpts.lowpassCutoffHz, a.sampleRate);
        }

        const lp = lowpassTimeFilterRef.current;
        lp.reset();
        const filteredTimeSignal =
          rawTimeSignal.length > 0 ? lp.processFrame(rawTimeSignal) : new Float32Array(0);

        let tempoEnvelopeDb: Float32Array = new Float32Array(0);
        let tempoBinHz = 0;
        if (filteredTimeSignal.length > 1) {
          const FFT_MAX_SAMPLES = 1 << 16; // 65536
          const fftInput =
            filteredTimeSignal.length > FFT_MAX_SAMPLES
              ? filteredTimeSignal.subarray(filteredTimeSignal.length - FFT_MAX_SAMPLES)
              : filteredTimeSignal;
          const fftResult = computeFftDb(fftInput, a.sampleRate);
          tempoEnvelopeDb = fftResult.spectrumDb;
          tempoBinHz = fftResult.binHz;
        }

        setState({
          ...frame,
          running: true,
          error: null,
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
            timeSignal: filteredTimeSignal,
            sampleRate: a.sampleRate,
          },
        });
      }, periodMs);

      setState((s) => ({ ...s, running: true, error: null }));
    } catch (err) {
      const { message } = toMicError(err);
      setState((s) => ({ ...s, running: false, error: message }));
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

export { emptyVector as emptyChromaVector };
