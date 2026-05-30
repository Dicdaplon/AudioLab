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
import { estimateNoiseFloor, type NoiseFloorMethod } from "../analysis/noiseFloor";
import { LowpassFilter } from "../analysis/lowpass";
import { TimeRingBuffer } from "../analysis/timeBuffer";
import { computeFftDb } from "../analysis/timeFft";

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
      timeSignal: new Float32Array(0),
      sampleRate: 0,
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

  // Tempo analysis: a single lowpass filter applied to the time-domain signal
  // (at the audio sample rate) before its FFT is computed for Section 2.
  const lowpassTimeFilterRef = useRef<LowpassFilter | null>(null);
  // Time-domain signal buffer (8 seconds) for display.
  const timeBufferRef = useRef<TimeRingBuffer | null>(null);

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
    chordWindowRef.current = null;
    liveWindowRef.current = null;
    tonalityWindowRef.current = null;
    presenceWindowRef.current = null;
    filterRef.current = null;
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

      // FFT analysis uses the spectrum dB from the AnalyserNode directly.
      // Section 2 lowpass filter operates on the time-domain signal at the
      // audio sample rate; (re)built lazily inside the frame loop so cutoff
      // changes take effect.
      lowpassTimeFilterRef.current = null;

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

        // Capture time-domain samples for display.
        //
        // getFloatTimeDomainData() returns the most recent `fftSize` samples
        // every time it is called. Because we poll at framesPerSecond (e.g.
        // 10 fps) while each window holds ~0.34 s of audio (16384 samples at
        // 48 kHz), consecutive frames overlap heavily (~70%). Pushing the full
        // window each frame makes a single transient (e.g. a clap) appear 3-4
        // times in the ring buffer.
        //
        // To avoid duplication we only push the *new* tail of the window: the
        // number of samples the stream advanced since the previous frame,
        // which is approximately sampleRate / framesPerSecond. We clamp to the
        // window length in case a frame is delayed.
        const timeBuf = timeBufferRef.current;
        if (timeBuf && a.analyser) {
          const windowLen = a.analyser.fftSize;
          const timeDomainData = new Float32Array(windowLen);
          a.analyser.getFloatTimeDomainData(timeDomainData);

          const advance = Math.min(
            windowLen,
            Math.max(1, Math.round(a.sampleRate / curOpts.framesPerSecond)),
          );
          // The newest `advance` samples are at the end of the window.
          const newSamples = timeDomainData.subarray(windowLen - advance);
          timeBuf.push(newSamples);
        }

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

        // FFT analysis: use the spectrum dB directly from the AnalyserNode.
        const fftSpectrumDb = new Float32Array(db);
        const fftBinHz = binHz;
        const noiseFloor = estimateNoiseFloor(fftSpectrumDb, curOpts.noiseMethod);
        const fftNoiseFloorDb = noiseFloor.noiseFloorDb;

        // Section 2: Tempo / low-frequency modulation analysis.
        //
        // 1. Extract the 8-second time-domain signal.
        // 2. Apply the lowpass filter to that *time-domain signal* (at the
        //    audio sample rate). This isolates slow modulation (note onsets,
        //    vibrato, tremolo).
        // 3. Compute the FFT of the filtered signal and display its spectrum.
        //
        // The filtered time signal is also what we plot in the time-domain
        // view, so the user sees the same data that feeds the spectrum.
        let rawTimeSignal: Float32Array = new Float32Array(0);
        const timeBufDisplay = timeBufferRef.current;
        if (timeBufDisplay) {
          rawTimeSignal = timeBufDisplay.lastSeconds(8, a.sampleRate);
        }

        // (Re)build the time-domain lowpass filter if the cutoff changed.
        if (!lowpassTimeFilterRef.current) {
          lowpassTimeFilterRef.current = new LowpassFilter(
            curOpts.lowpassCutoffHz,
            a.sampleRate,
          );
        } else {
          lowpassTimeFilterRef.current.setCutoff(
            curOpts.lowpassCutoffHz,
            a.sampleRate,
          );
        }

        // Filter the whole 8 s window from scratch each frame. We reset state
        // first so the result depends only on the current buffer contents
        // (the buffer itself already advances over time), giving a stable,
        // zero-phase-independent rendering.
        const lp = lowpassTimeFilterRef.current;
        lp.reset();
        const filteredTimeSignal =
          rawTimeSignal.length > 0
            ? lp.processFrame(rawTimeSignal)
            : new Float32Array(0);

        // FFT of the filtered time-domain signal for the Section 2 spectrum.
        //
        // The full 8 s window at audio rate (≈384k samples @ 48 kHz) would
        // force a ~512k-point FFT every frame, which is far too expensive in
        // pure JS. Since we only display 0–50 Hz, we run the FFT over the most
        // recent power-of-two-sized chunk (≈1.4 s), giving sub-Hz resolution
        // there while keeping the transform small enough to run at 10 fps.
        let tempoEnvelopeDb: Float32Array = new Float32Array(0);
        let tempoBinHz = 0;
        if (filteredTimeSignal.length > 1) {
          const FFT_MAX_SAMPLES = 1 << 16; // 65536
          const fftInput =
            filteredTimeSignal.length > FFT_MAX_SAMPLES
              ? filteredTimeSignal.subarray(
                  filteredTimeSignal.length - FFT_MAX_SAMPLES,
                )
              : filteredTimeSignal;
          const fftResult = computeFftDb(fftInput, a.sampleRate);
          tempoEnvelopeDb = fftResult.spectrumDb;
          tempoBinHz = fftResult.binHz;
        }

        // Display the filtered time-domain signal.
        const timeSignalForDisplay = filteredTimeSignal;

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
            timeSignal: timeSignalForDisplay,
            sampleRate: a.sampleRate,
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
