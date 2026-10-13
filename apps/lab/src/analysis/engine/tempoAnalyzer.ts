/**
 * TempoAnalyzer: beat-rate estimation from the amplitude envelope of a
 * continuous audio stream. Pure TypeScript, no Web Audio dependency.
 *
 * Tempo is not visible in the waveform's own spectrum (audio has no energy
 * below 20 Hz); it lives in how the *loudness* fluctuates. The chain is:
 *
 *   samples ─► RMS per block (128 samples → 375 Hz @ 48 kHz)
 *           ─► log compression   L[n] = ln(1 + γ·rms[n])
 *           ─► onset strength    o[n] = max(0, L[n] − L[n−1])
 *           ─► Butterworth lowpass (fc = `lowpassCutoffHz`, order 4)
 *           ─► decimation ÷ D (→ ~94 Hz)
 *           ─► ring buffer of `windowSeconds`
 *           ─► analyze(): mean removal, Hann window, zero-padded FFT
 *                         → envelope spectrum on a BPM axis (bpm = 60·f)
 *                         → prior-weighted peak = BPM estimate
 *
 * The log compression makes the onset strength roughly independent of the
 * microphone gain above the knee (1/γ) while keeping very quiet noise
 * linear (hence small). The lowpass is the anti-aliasing filter of the
 * decimation stage and doubles as a smoothing control: a low cutoff
 * attenuates fast beat rates (e.g. 2 Hz → 120 BPM at −3 dB).
 *
 * The frequency resolution of the envelope spectrum is set by the window
 * length: 1/8 s = 0.125 Hz = 7.5 BPM for an 8 s window. Zero-padding to
 * `fftSize` only interpolates between those points; the parabolic peak
 * interpolation refines the estimate within a bin.
 *
 * Tempo prior: Gaussian in log2(BPM) centred on 120 BPM with σ = 1.4
 * octaves, after Ellis, "Beat Tracking by Dynamic Programming", J. New
 * Music Research 36(1), 2007. It breaks ties between a tempo and its
 * double/half in favour of the musically likely one.
 */

import { LowpassFilter } from "../lowpass";
import { TimeRingBuffer } from "../timeBuffer";
import { computeFftDb } from "../timeFft";

export interface TempoAnalyzerConfig {
  /** Sample rate of the pushed audio, in Hz. */
  sampleRate: number;
  /** Samples per RMS block. Default 128 (one Web Audio render quantum). */
  blockSize: number;
  /** Decimation factor applied after the lowpass. Default 4. */
  decimation: number;
  /** Length of the analysed onset-strength window, in seconds. Default 8. */
  windowSeconds: number;
  /** Cutoff of the onset-strength lowpass, in Hz. Default 8. */
  lowpassCutoffHz: number;
  /** Log-compression gain γ: knee at rms = 1/γ. Default 100 (−40 dBFS). */
  compressionGain: number;
  /** Zero-padded FFT length of the envelope spectrum. Default 4096. */
  fftSize: number;
  /** BPM axis of the result. Defaults 40–240. */
  minBpm: number;
  maxBpm: number;
  /** Tempo prior centre and width (octaves). Defaults 120 BPM, 1.4. */
  priorCentreBpm: number;
  priorSigmaOctaves: number;
}

export const TEMPO_ANALYZER_DEFAULTS: Omit<TempoAnalyzerConfig, "sampleRate"> = {
  blockSize: 128,
  decimation: 4,
  windowSeconds: 8,
  lowpassCutoffHz: 8,
  compressionGain: 100,
  fftSize: 4096,
  minBpm: 40,
  maxBpm: 240,
  priorCentreBpm: 120,
  priorSigmaOctaves: 1.4,
};

export interface TempoEstimate {
  /** Estimated beat rate in BPM (parabolic interpolation around the peak). */
  bpm: number;
  /**
   * Peak prominence in [0, 1]: 1 − mean/peak of the prior-weighted spectrum
   * over the BPM range. Near 0 for a flat (noise-like) envelope spectrum.
   */
  confidence: number;
}

export interface TempoFrame {
  /** Onset-strength window in chronological order (zero-padded while filling). */
  onsetEnvelope: Float32Array;
  /** Rate of `onsetEnvelope`, in Hz. */
  envelopeRate: number;
  /** Seconds of audio received so far (capped at `windowSeconds`). */
  filledSeconds: number;
  /** Envelope spectrum magnitude (linear, see computeFftDb) over the BPM range. */
  spectrum: Float32Array;
  /** BPM of each `spectrum` entry (ascending). */
  bpmAxis: Float32Array;
  /** Tempo prior weight of each `spectrum` entry, in (0, 1]. */
  priorWeight: Float32Array;
  /** Beat-rate estimate, or null when the window holds no onsets. */
  estimate: TempoEstimate | null;
}

export class TempoAnalyzer {
  private cfg: TempoAnalyzerConfig;
  private lowpass: LowpassFilter;
  private buffer: TimeRingBuffer;

  // Block accumulation state (carried across pushes for gapless capture).
  private blockSumSquares = 0;
  private blockCount = 0;
  private previousLevel = 0;
  private decimationPhase = 0;
  private totalBlocks = 0;

  constructor(config: Partial<TempoAnalyzerConfig> & { sampleRate: number }) {
    this.cfg = { ...TEMPO_ANALYZER_DEFAULTS, ...config };
    const c = this.cfg;
    if (!(c.sampleRate > 0)) throw new Error("sampleRate must be > 0");
    if (!(c.blockSize >= 1) || !(c.decimation >= 1)) {
      throw new Error("blockSize and decimation must be ≥ 1");
    }
    if (!(c.windowSeconds > 0)) throw new Error("windowSeconds must be > 0");
    if (!(c.minBpm > 0) || !(c.maxBpm > c.minBpm)) throw new Error("invalid BPM range");
    this.lowpass = new LowpassFilter(c.lowpassCutoffHz, this.blockRate);
    this.buffer = new TimeRingBuffer(Math.max(2, Math.round(c.windowSeconds * this.envelopeRate)));
  }

  get config(): Readonly<TempoAnalyzerConfig> {
    return this.cfg;
  }

  /** Rate of the RMS blocks (before decimation), in Hz. */
  get blockRate(): number {
    return this.cfg.sampleRate / this.cfg.blockSize;
  }

  /** Rate of the onset-strength envelope stored in the window, in Hz. */
  get envelopeRate(): number {
    return this.blockRate / this.cfg.decimation;
  }

  /** Number of envelope samples in the analysis window. */
  get windowLength(): number {
    return this.buffer.capacity;
  }

  /** Change the lowpass cutoff on the fly (state is kept). */
  setLowpassCutoff(cutoffHz: number): void {
    this.lowpass.setCutoff(cutoffHz, this.blockRate);
    this.cfg = { ...this.cfg, lowpassCutoffHz: cutoffHz };
  }

  /** Clear the window and all accumulation state. */
  reset(): void {
    this.lowpass.reset();
    this.buffer.reset();
    this.blockSumSquares = 0;
    this.blockCount = 0;
    this.previousLevel = 0;
    this.decimationPhase = 0;
    this.totalBlocks = 0;
  }

  /**
   * Feed audio samples (any length, any chunking). Blocks are completed
   * across calls, so chunk boundaries never create artefacts.
   */
  pushSamples(samples: ArrayLike<number>): void {
    const { blockSize, compressionGain, decimation } = this.cfg;
    for (let i = 0; i < samples.length; i++) {
      const x = samples[i];
      this.blockSumSquares += x * x;
      this.blockCount++;
      if (this.blockCount < blockSize) continue;

      const rms = Math.sqrt(this.blockSumSquares / blockSize);
      this.blockSumSquares = 0;
      this.blockCount = 0;
      this.totalBlocks++;

      const level = Math.log1p(compressionGain * rms);
      const onset = Math.max(0, level - this.previousLevel);
      this.previousLevel = level;

      const smoothed = this.lowpass.processSample(onset);
      if (this.decimationPhase === 0) this.buffer.push(smoothed);
      this.decimationPhase = (this.decimationPhase + 1) % decimation;
    }
  }

  /** Prior weight for a beat rate (Gaussian in log2 BPM). */
  priorWeight(bpm: number): number {
    const { priorCentreBpm, priorSigmaOctaves } = this.cfg;
    const octaves = Math.log2(bpm / priorCentreBpm) / priorSigmaOctaves;
    return Math.exp(-0.5 * octaves * octaves);
  }

  /** Envelope spectrum over the BPM range and the current estimate. */
  analyze(): TempoFrame {
    const { fftSize, minBpm, maxBpm, windowSeconds } = this.cfg;
    const rate = this.envelopeRate;
    const onsetEnvelope = this.buffer.lastSamplesChronological(this.buffer.capacity);
    const filledSeconds = Math.min(
      windowSeconds,
      (this.totalBlocks * this.cfg.blockSize) / this.cfg.sampleRate,
    );

    // Remove the mean so the DC bin does not dominate the low-BPM end.
    let mean = 0;
    for (let i = 0; i < onsetEnvelope.length; i++) mean += onsetEnvelope[i];
    mean /= onsetEnvelope.length;
    const centred = new Float32Array(onsetEnvelope.length);
    let energy = 0;
    for (let i = 0; i < onsetEnvelope.length; i++) {
      centred[i] = onsetEnvelope[i] - mean;
      energy += centred[i] * centred[i];
    }

    const size = Math.max(fftSize, 2);
    const { magnitude, binHz } = computeFftDb(centred, rate, {
      fftSize: Math.max(size, nextPow2At(onsetEnvelope.length)),
    });

    const kMin = Math.max(1, Math.ceil(minBpm / 60 / binHz));
    const kMax = Math.min(magnitude.length - 1, Math.floor(maxBpm / 60 / binHz));
    const n = Math.max(0, kMax - kMin + 1);
    const spectrum = new Float32Array(n);
    const bpmAxis = new Float32Array(n);
    const priorWeight = new Float32Array(n);
    let peakIdx = -1;
    let peakValue = 0;
    let weightedSum = 0;
    for (let i = 0; i < n; i++) {
      const k = kMin + i;
      const bpm = 60 * k * binHz;
      const w = this.priorWeight(bpm);
      spectrum[i] = magnitude[k];
      bpmAxis[i] = bpm;
      priorWeight[i] = w;
      const weighted = magnitude[k] * w;
      weightedSum += weighted;
      if (weighted > peakValue) {
        peakValue = weighted;
        peakIdx = i;
      }
    }

    let estimate: TempoEstimate | null = null;
    if (peakIdx >= 0 && energy > 0 && peakValue > 0) {
      // Parabolic interpolation of the weighted peak (sub-bin accuracy).
      let offset = 0;
      if (peakIdx > 0 && peakIdx < n - 1) {
        const a = spectrum[peakIdx - 1] * priorWeight[peakIdx - 1];
        const b = peakValue;
        const c = spectrum[peakIdx + 1] * priorWeight[peakIdx + 1];
        const denom = a - 2 * b + c;
        if (denom < 0) offset = (0.5 * (a - c)) / denom;
      }
      const bpm = 60 * (kMin + peakIdx + offset) * binHz;
      const meanWeighted = weightedSum / n;
      estimate = { bpm, confidence: Math.max(0, 1 - meanWeighted / peakValue) };
    }

    return {
      onsetEnvelope,
      envelopeRate: rate,
      filledSeconds,
      spectrum,
      bpmAxis,
      priorWeight,
      estimate,
    };
  }
}

function nextPow2At(n: number): number {
  let p = 2;
  while (p < n) p <<= 1;
  return p;
}
