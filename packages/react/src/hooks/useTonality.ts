"use client";

/**
 * Live key / chord analysis: polls an AnalyserNode on the given microphone
 * source at `framesPerSecond` and runs each spectrum through the
 * `TonalityEngine`. The hook owns no microphone; pass it the `mic` from
 * `useMicrophone()` (or null to stay idle).
 *
 * The magnitude spectrum and noise floor for the FFT tab are only copied
 * and estimated when `fftEnabled` is true, so the other tabs do not pay
 * for them.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ANALYSIS_DEFAULTS,
  createAnalyser,
  DEFAULT_DETECTOR_SETTINGS,
  DEFAULT_FFT_SETTINGS,
  emptyTonalityFrame,
  estimateNoiseFloor,
  FFT_DISPLAY_MAX_HZ,
  type HighWaterMarkMode,
  type MicSource,
  NOISE_FLOOR_SILENCE_DB,
  type NoiseFloorMethod,
  readSpectrumDb,
  TonalityEngine,
  type TonalityEngineConfig,
  type TonalityFrame,
} from "@audiolab/core";

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
  /** Copy the spectrum and estimate the noise floor for the FFT tab. */
  fftEnabled?: boolean;
  /** Noise floor estimation method ("median", "mean", "p80"). */
  noiseMethod?: NoiseFloorMethod;
}

/** Magnitude spectrum of the last frame (only updated while `fftEnabled`). */
export interface SpectrumState {
  /** AnalyserNode dB spectrum (one-sided, fftSize / 2 bins). Empty when idle. */
  spectrumDb: Float32Array;
  /** Bin spacing in Hz (sampleRate / fftSize). */
  binHz: number;
  /** Noise floor estimated over the displayed band [0, FFT_DISPLAY_MAX_HZ]. */
  noiseFloorDb: number;
  noiseMethod: NoiseFloorMethod;
}

const EMPTY_SPECTRUM: SpectrumState = {
  spectrumDb: new Float32Array(0),
  binHz: 0,
  noiseFloorDb: NOISE_FLOOR_SILENCE_DB,
  noiseMethod: DEFAULT_FFT_SETTINGS.noiseMethod,
};

export function useTonality(mic: MicSource | null, options: UseTonalityOptions = {}) {
  const fftSize = options.fftSize ?? ANALYSIS_DEFAULTS.fftSize;
  const framesPerSecond = options.framesPerSecond ?? ANALYSIS_DEFAULTS.framesPerSecond;
  const engineConfig: TonalityEngineConfig = {
    framesPerSecond,
    chordWindowSeconds: options.chordWindowSeconds ?? ANALYSIS_DEFAULTS.chordWindowSeconds,
    liveAcquisitionSeconds:
      options.liveAcquisitionSeconds ?? DEFAULT_DETECTOR_SETTINGS.liveAcquisitionSeconds,
    tonalityAcquisitionSeconds:
      options.tonalityAcquisitionSeconds ?? DEFAULT_DETECTOR_SETTINGS.tonalityAcquisitionSeconds,
    minFreq: options.minFreq ?? ANALYSIS_DEFAULTS.minFreq,
    maxFreq: options.maxFreq ?? ANALYSIS_DEFAULTS.maxFreq,
    filterTolerancy: options.maxFilterTolerancy ?? DEFAULT_DETECTOR_SETTINGS.maxFilterTolerancy,
    filterMemory: options.maxFilterMemory ?? DEFAULT_DETECTOR_SETTINGS.maxFilterMemory,
    filterMode: options.maxFilterMode ?? DEFAULT_DETECTOR_SETTINGS.maxFilterMode,
  };
  const fftEnabled = options.fftEnabled ?? false;
  const noiseMethod = options.noiseMethod ?? DEFAULT_FFT_SETTINGS.noiseMethod;

  const [frame, setFrame] = useState<TonalityFrame>(emptyTonalityFrame);
  const [spectrum, setSpectrum] = useState<SpectrumState>(EMPTY_SPECTRUM);

  const engineRef = useRef<TonalityEngine | null>(null);
  // Latest per-frame options, read inside the interval without re-arming it.
  const liveOptsRef = useRef({ fftEnabled, noiseMethod });
  liveOptsRef.current = { fftEnabled, noiseMethod };

  const engineConfigRef = useRef(engineConfig);
  engineConfigRef.current = engineConfig;

  // Reconfigure the engine on the fly when windows / filter params change
  // (keyed on the primitive values: the config object is rebuilt each render).
  useEffect(() => {
    engineRef.current?.configure(engineConfigRef.current);
  }, [
    engineConfig.framesPerSecond,
    engineConfig.chordWindowSeconds,
    engineConfig.liveAcquisitionSeconds,
    engineConfig.tonalityAcquisitionSeconds,
    engineConfig.minFreq,
    engineConfig.maxFreq,
    engineConfig.filterTolerancy,
    engineConfig.filterMemory,
    engineConfig.filterMode,
  ]);

  // Analysis loop, bound to the microphone session.
  useEffect(() => {
    if (!mic) {
      engineRef.current = null;
      setFrame(emptyTonalityFrame());
      setSpectrum(EMPTY_SPECTRUM);
      return;
    }

    const analyser = createAnalyser(mic.context, mic.source, { fftSize });
    const engine = new TonalityEngine(engineConfigRef.current);
    engineRef.current = engine;

    const tick = () => {
      const db = readSpectrumDb(analyser);
      setFrame(engine.processDbSpectrum(db, analyser.sampleRate));

      const { fftEnabled: wantSpectrum, noiseMethod: method } = liveOptsRef.current;
      if (wantSpectrum) {
        const binHz = analyser.sampleRate / (2 * db.length);
        const spectrumDb = new Float32Array(db); // React must own its copy
        const { noiseFloorDb } = estimateNoiseFloor(spectrumDb, method, {
          toBin: Math.ceil(FFT_DISPLAY_MAX_HZ / binHz),
        });
        setSpectrum({ spectrumDb, binHz, noiseFloorDb, noiseMethod: method });
      }
    };

    const id = setInterval(tick, 1000 / framesPerSecond);
    return () => {
      clearInterval(id);
      analyser.analyser.disconnect();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [mic, fftSize, framesPerSecond]);

  /**
   * Clear the sliding windows and the filter memory without stopping the
   * microphone; the windows refill as new audio comes in.
   */
  const reset = useCallback(() => {
    engineRef.current?.reset();
    setFrame(emptyTonalityFrame());
    setSpectrum(EMPTY_SPECTRUM);
  }, []);

  return { ...frame, fft: spectrum, reset };
}
