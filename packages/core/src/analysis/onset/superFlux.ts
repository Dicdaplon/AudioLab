/**
 * SuperFlux onset detection function, streaming. Pure TypeScript.
 *
 * An onset detection function (ODF) turns audio into a curve that peaks
 * where notes start. SuperFlux is a spectral flux on a log-frequency, log-
 * magnitude spectrogram whose reference frame is first spread across
 * frequency by a maximum filter:
 *
 *   X[n, k]  = |STFT|  (Hann window of `frameSize`, one frame per `hopSize`)
 *   S[n, b]  = log10(1 + λ · Σ_k F[b, k] · X[n, k])     (triangular filters,
 *                                                        `bandsPerOctave`)
 *   Sᵐ[n, b] = max(S[n, b−r … b+r])                      (r = maxFilterRadius)
 *   odf[n]   = (1/B) · Σ_b max(0, S[n, b] − Sᵐ[n − μ, b])
 *
 * - The log magnitude makes the flux depend on level *ratios*, so a
 *   change of microphone gain barely moves it, while very quiet noise stays
 *   in the linear part of log(1 + x) and contributes almost nothing.
 * - The maximum filter is what SuperFlux adds to plain spectral flux: a
 *   partial that drifts by a band or so (vibrato, bend, a slightly detuned
 *   ringing string) finds itself in the widened reference and is not
 *   counted as new energy. A real attack raises many bands at once.
 * - μ (`diffFrames`) compares a frame with the one whose window overlaps it
 *   by about half, so the difference spans a meaningful part of the window
 *   even with a small hop.
 * - The sum is divided by the band count so that the peak-picking
 *   threshold does not depend on the filterbank resolution.
 *
 * Frames are causal: the value of frame n is available as soon as its last
 * sample has been pushed (`endFrame`). With the defaults at 48 kHz (1024 /
 * 128) there is one value every 2.7 ms and the window spans 21 ms.
 *
 * Reference: S. Böck and G. Widmer, "Maximum filter vibrato suppression for
 * onset detection", Proc. DAFx-13, Maynooth, 2013.
 */

import { fftInPlace } from "../fft";
import { nextPow2 } from "../timeFft";

export interface SuperFluxConfig {
  /** Sample rate of the pushed audio, in Hz. */
  sampleRate: number;
  /** STFT window length (power of two). Default: about 21 ms (1024 at 44.1/48 kHz). */
  frameSize: number;
  /** Samples between two frames. Default 128 (one Web Audio render quantum). */
  hopSize: number;
  /** Filterbank resolution. Default 12 bands per octave. */
  bandsPerOctave: number;
  /** Filterbank range, in Hz. Defaults 30 Hz – 16 kHz (clamped to Nyquist). */
  minFrequency: number;
  maxFrequency: number;
  /** Magnitude gain λ inside log10(1 + λ·x). Default 1. */
  logGain: number;
  /** Half width of the maximum filter, in bands. Default 1 (3 bands, as in the paper). */
  maxFilterRadius: number;
  /** Reference frame distance μ. Default: derived from the window overlap (ratio 0.5). */
  diffFrames: number;
}

export type SuperFluxOptions = Partial<SuperFluxConfig> & { sampleRate: number };

/** One ODF value. `endFrame` is the stream frame just after the frame's last sample. */
export interface OdfFrame {
  endFrame: number;
  value: number;
}

/** Window length of about 21 ms, as a power of two. */
export function defaultFrameSize(sampleRate: number): number {
  return nextPow2(Math.round(sampleRate * 0.016));
}

/**
 * μ such that the window value at the reference frame's centre offset is
 * at least `ratio` of its maximum (madmom's `diff_ratio`): for a Hann window
 * the half-height point is N/4 from the centre.
 */
export function diffFramesFor(frameSize: number, hopSize: number, ratio = 0.5): number {
  // Hann: w(n) = 0.5 − 0.5·cos(2πn/N) reaches `ratio` at n = N·acos(1 − 2·ratio)/(2π).
  const sampleAtRatio = (frameSize * Math.acos(1 - 2 * ratio)) / (2 * Math.PI);
  const distance = frameSize / 2 - sampleAtRatio;
  return Math.max(1, Math.round(distance / hopSize));
}

/** Triangular log-spaced filters over FFT bins; each filter sums to 1. */
export interface Filterbank {
  /** First bin of each filter. */
  start: Int32Array;
  /** Weights of each filter, from `start[b]`. */
  weights: Float32Array[];
  /** Centre frequency of each band, in Hz. */
  centres: Float32Array;
}

export function logFilterbank(
  frameSize: number,
  sampleRate: number,
  bandsPerOctave: number,
  minFrequency: number,
  maxFrequency: number,
): Filterbank {
  const binHz = sampleRate / frameSize;
  const nyquist = sampleRate / 2;
  const fMax = Math.min(maxFrequency, nyquist);
  // Centre bins of log-spaced frequencies, deduplicated (low bands collapse
  // onto the same bin when the FFT is coarse).
  const bins: number[] = [];
  for (let i = 0; ; i++) {
    const f = minFrequency * Math.pow(2, i / bandsPerOctave);
    if (f > fMax) break;
    const bin = Math.round(f / binHz);
    if (bin >= 1 && bin < frameSize / 2 && bins[bins.length - 1] !== bin) bins.push(bin);
  }
  const start: number[] = [];
  const weights: Float32Array[] = [];
  const centres: number[] = [];
  for (let i = 1; i < bins.length - 1; i++) {
    const lo = bins[i - 1];
    const mid = bins[i];
    const hi = bins[i + 1];
    const w = new Float32Array(hi - lo + 1);
    let sum = 0;
    for (let k = lo; k <= hi; k++) {
      const v = k <= mid ? (k - lo) / (mid - lo) : (hi - k) / (hi - mid);
      w[k - lo] = v;
      sum += v;
    }
    if (sum <= 0) continue;
    for (let j = 0; j < w.length; j++) w[j] /= sum;
    start.push(lo);
    weights.push(w);
    centres.push(mid * binHz);
  }
  if (weights.length === 0) throw new Error("filterbank is empty: widen the frequency range");
  return {
    start: Int32Array.from(start),
    weights,
    centres: Float32Array.from(centres),
  };
}

export class SuperFluxOdf {
  readonly config: Readonly<SuperFluxConfig>;
  readonly filterbank: Filterbank;

  private readonly window: Float64Array;
  private readonly ring: Float32Array;
  private readonly real: Float64Array;
  private readonly imag: Float64Array;
  private readonly magnitude: Float32Array;
  /** Last μ+1 max-filtered band frames, as a ring. */
  private readonly history: Float32Array[];
  private readonly current: Float32Array;
  private writePos = 0;
  private filled = 0;
  private sinceHop = 0;
  private framesComputed = 0;
  /** Stream frame of the next pushed sample; null before the first push. */
  private nextFrame: number | null = null;

  constructor(options: SuperFluxOptions) {
    const sampleRate = options.sampleRate;
    if (!(sampleRate > 0)) throw new Error("sampleRate must be > 0");
    const frameSize = options.frameSize ?? defaultFrameSize(sampleRate);
    if (frameSize < 16 || (frameSize & (frameSize - 1)) !== 0) {
      throw new Error("frameSize must be a power of two ≥ 16");
    }
    const hopSize = options.hopSize ?? 128;
    if (!(hopSize >= 1 && hopSize <= frameSize))
      throw new Error("hopSize must be in [1, frameSize]");
    const cfg: SuperFluxConfig = {
      sampleRate,
      frameSize,
      hopSize,
      bandsPerOctave: options.bandsPerOctave ?? 12,
      minFrequency: options.minFrequency ?? 30,
      maxFrequency: options.maxFrequency ?? 16000,
      logGain: options.logGain ?? 1,
      maxFilterRadius: options.maxFilterRadius ?? 1,
      diffFrames: options.diffFrames ?? diffFramesFor(frameSize, hopSize),
    };
    if (!(cfg.diffFrames >= 1)) throw new Error("diffFrames must be ≥ 1");
    this.config = cfg;
    this.filterbank = logFilterbank(
      frameSize,
      sampleRate,
      cfg.bandsPerOctave,
      cfg.minFrequency,
      cfg.maxFrequency,
    );

    this.window = new Float64Array(frameSize);
    for (let n = 0; n < frameSize; n++) {
      this.window[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / frameSize);
    }
    this.ring = new Float32Array(frameSize);
    this.real = new Float64Array(frameSize);
    this.imag = new Float64Array(frameSize);
    this.magnitude = new Float32Array(frameSize / 2 + 1);
    const bands = this.filterbank.weights.length;
    this.current = new Float32Array(bands);
    this.history = Array.from({ length: cfg.diffFrames + 1 }, () => new Float32Array(bands));
  }

  /** Number of filterbank bands. */
  get bands(): number {
    return this.filterbank.weights.length;
  }

  /** Seconds between two ODF values. */
  get frameDuration(): number {
    return this.config.hopSize / this.config.sampleRate;
  }

  /** Clear all state; the next push restarts the stream clock. */
  reset(): void {
    this.ring.fill(0);
    for (const h of this.history) h.fill(0);
    this.writePos = 0;
    this.filled = 0;
    this.sinceHop = 0;
    this.framesComputed = 0;
    this.nextFrame = null;
  }

  /**
   * Feed samples. `startFrame` is the stream frame of `samples[0]` (for
   * live capture: the AudioContext frame); omitted, the samples follow the
   * previous push. A discontinuity (a gap or an overlap) restarts the
   * analysis at the new position, since frames across a gap mean nothing.
   */
  push(samples: ArrayLike<number>, startFrame?: number): OdfFrame[] {
    if (startFrame !== undefined && this.nextFrame !== null && startFrame !== this.nextFrame) {
      this.reset();
    }
    if (this.nextFrame === null) this.nextFrame = startFrame ?? 0;
    const { frameSize, hopSize } = this.config;
    const out: OdfFrame[] = [];
    for (let i = 0; i < samples.length; i++) {
      this.ring[this.writePos] = samples[i];
      this.writePos = (this.writePos + 1) % frameSize;
      this.nextFrame++;
      if (this.filled < frameSize) this.filled++;
      this.sinceHop++;
      if (this.sinceHop >= hopSize && this.filled === frameSize) {
        this.sinceHop = 0;
        out.push({ endFrame: this.nextFrame, value: this.computeFrame() });
      } else if (this.sinceHop >= hopSize) {
        this.sinceHop = 0;
      }
    }
    return out;
  }

  private computeFrame(): number {
    const { frameSize, logGain, maxFilterRadius, diffFrames } = this.config;
    const { real, imag, window, ring, magnitude } = this;
    for (let n = 0; n < frameSize; n++) {
      real[n] = ring[(this.writePos + n) % frameSize] * window[n];
      imag[n] = 0;
    }
    fftInPlace(real, imag);
    for (let k = 0; k <= frameSize / 2; k++) {
      magnitude[k] = Math.hypot(real[k], imag[k]);
    }

    const { start, weights } = this.filterbank;
    const bands = weights.length;
    const cur = this.current;
    for (let b = 0; b < bands; b++) {
      const w = weights[b];
      const s = start[b];
      let acc = 0;
      for (let j = 0; j < w.length; j++) acc += w[j] * magnitude[s + j];
      cur[b] = Math.log10(1 + logGain * acc);
    }

    // The reference is the max-filtered frame μ frames ago; it is only
    // meaningful once μ frames exist.
    const slot = this.framesComputed % this.history.length;
    const refSlot = (this.framesComputed - diffFrames) % this.history.length;
    let flux = 0;
    if (this.framesComputed >= diffFrames) {
      const ref = this.history[(refSlot + this.history.length) % this.history.length];
      for (let b = 0; b < bands; b++) {
        const d = cur[b] - ref[b];
        if (d > 0) flux += d;
      }
      flux /= bands;
    }

    const maxed = this.history[slot];
    for (let b = 0; b < bands; b++) {
      let m = cur[b];
      const lo = Math.max(0, b - maxFilterRadius);
      const hi = Math.min(bands - 1, b + maxFilterRadius);
      for (let j = lo; j <= hi; j++) if (cur[j] > m) m = cur[j];
      maxed[b] = m;
    }
    this.framesComputed++;
    return flux;
  }
}
