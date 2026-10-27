/**
 * The "flux" tempo method of `TempoAnalyzer`: a log spectral-flux novelty
 * curve read by autocorrelation (Ellis 2007) with harmonic enhancement and
 * smoothing across readings.
 *
 *   samples ─► Hann STFT (2048 points ≥ 32 kHz, else 1024; 10 ms hop;
 *              each frame ends at its time stamp, so the curve is causal)
 *           ─► L[k] = ln(1 + 100·(4/N)·|X[k]|)  over 30 Hz – 8 kHz
 *           ─► flux  d = Σ max(0, L[k] − L_prev[k])
 *           ─► minus its causal 0.5 s moving mean, half-wave rectified
 *           ─► ring buffer of `windowSeconds` (100 frames/s)
 *           ─► analyze(): biased autocorrelation r(τ) of the window,
 *                         normalised by r(0), averaged across readings
 *                         (weight 0.7 on the previous average per second),
 *                         enhanced h(τ) = r(τ) + r(2τ) + ½·r(4τ),
 *                         × log-Gaussian prior → best lag → BPM
 *
 * Why not the RMS envelope: when a chord is strummed, the broadband
 * loudness barely moves, but each string adds energy in its own bins.
 * Spectral flux sees that. The harmonic enhancement backs a beat period by
 * its multiples, which keeps the reading off the eighth-note rate.
 *
 * This is the configuration confirmed on held-out GuitarSet players in the
 * proof of concept (poc/methods/tempo.ts, "ellis s0.7 harm1 ema0.7").
 */

import { fftInPlace } from "../fft";

/** Flux band and compression (POC values). */
const FLUX_LO_HZ = 30;
const FLUX_HI_HZ = 8000;
const FLUX_GAMMA = 100;
/** Causal moving mean removed from the flux, in seconds. */
const LOCAL_MEAN_SECONDS = 0.5;
/** Weight of the previous autocorrelation average, per second of audio. */
export const FLUX_SMOOTHING_PER_SECOND = 0.7;
/** Weight of r(2τ) in the enhancement (r(4τ) gets half of it). */
const HARMONIC_WEIGHT = 1;

/** Streaming log spectral-flux novelty, one value per hop. */
export class FluxNovelty {
  readonly fftSize: number;
  readonly hop: number;
  /** Novelty frames per second. */
  readonly frameRate: number;

  private readonly window: Float32Array;
  private readonly k0: number;
  private readonly k1: number;
  private readonly norm: number;
  private readonly input: Float32Array;
  private readonly re: Float64Array;
  private readonly im: Float64Array;
  private readonly prev: Float32Array;
  private readonly cur: Float32Array;
  private readonly fluxRing: Float32Array;

  private writeIndex = 0;
  private totalSamples = 0;
  private nextFrameAt: number;
  private havePrev = false;
  private fluxCount = 0;
  private fluxSum = 0;

  constructor(sampleRate: number) {
    this.fftSize = sampleRate > 32_000 ? 2048 : 1024;
    this.hop = Math.max(1, Math.round(sampleRate / 100));
    this.frameRate = sampleRate / this.hop;
    const n = this.fftSize;
    this.window = new Float32Array(n);
    for (let i = 0; i < n; i++) this.window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
    const binHz = sampleRate / n;
    this.k0 = Math.max(1, Math.floor(FLUX_LO_HZ / binHz));
    this.k1 = Math.max(this.k0, Math.min(n / 2 - 1, Math.ceil(FLUX_HI_HZ / binHz)));
    this.norm = 4 / n;
    this.input = new Float32Array(n);
    this.re = new Float64Array(n);
    this.im = new Float64Array(n);
    this.prev = new Float32Array(this.k1 - this.k0 + 1);
    this.cur = new Float32Array(this.k1 - this.k0 + 1);
    this.fluxRing = new Float32Array(Math.max(1, Math.round(LOCAL_MEAN_SECONDS * this.frameRate)));
    this.nextFrameAt = n;
  }

  reset(): void {
    this.input.fill(0);
    this.prev.fill(0);
    this.fluxRing.fill(0);
    this.writeIndex = 0;
    this.totalSamples = 0;
    this.nextFrameAt = this.fftSize;
    this.havePrev = false;
    this.fluxCount = 0;
    this.fluxSum = 0;
  }

  /** Feed samples; `emit` receives each new novelty value. */
  push(samples: ArrayLike<number>, emit: (value: number) => void): void {
    const n = this.fftSize;
    for (let i = 0; i < samples.length; i++) {
      this.input[this.writeIndex] = samples[i];
      this.writeIndex = this.writeIndex + 1 === n ? 0 : this.writeIndex + 1;
      this.totalSamples++;
      if (this.totalSamples === this.nextFrameAt) {
        this.nextFrameAt += this.hop;
        emit(this.frame());
      }
    }
  }

  private frame(): number {
    const { fftSize: n, re, im, input, window, k0, k1, norm, cur, prev } = this;
    // Oldest sample sits at the write index.
    for (let i = 0, j = this.writeIndex; i < n; i++) {
      re[i] = input[j] * window[i];
      im[i] = 0;
      j = j + 1 === n ? 0 : j + 1;
    }
    fftInPlace(re, im);
    let flux = 0;
    for (let k = k0; k <= k1; k++) {
      const v = Math.log1p(FLUX_GAMMA * norm * Math.sqrt(re[k] * re[k] + im[k] * im[k]));
      cur[k - k0] = v;
      if (this.havePrev) flux += Math.max(0, v - prev[k - k0]);
    }
    prev.set(cur);
    this.havePrev = true;

    // Causal moving mean over the last `fluxRing.length` flux values.
    const ring = this.fluxRing;
    const slot = this.fluxCount % ring.length;
    if (this.fluxCount >= ring.length) this.fluxSum -= ring[slot];
    ring[slot] = flux;
    this.fluxSum += flux;
    this.fluxCount++;
    const mean = this.fluxSum / Math.min(ring.length, this.fluxCount);
    return Math.max(0, flux - mean);
  }
}

/** Biased autocorrelation of the mean-removed window, normalised by r(0). */
export function normalisedAcf(w: Float32Array, maxLag: number): Float64Array | null {
  const len = w.length;
  let m = 0;
  for (let i = 0; i < len; i++) m += w[i];
  m /= len || 1;
  const c = new Float64Array(len);
  for (let i = 0; i < len; i++) c[i] = w[i] - m;
  const r = new Float64Array(maxLag + 1);
  for (let l = 0; l <= maxLag; l++) {
    let s = 0;
    for (let i = l; i < len; i++) s += c[i] * c[i - l];
    r[l] = s;
  }
  if (!(r[0] > 0)) return null;
  for (let l = maxLag; l >= 0; l--) r[l] /= r[0];
  return r;
}

/** h(τ) = r⁺(τ) + r⁺(2τ) + ½·r⁺(4τ) for τ in [0, maxLag + 1]. */
export function harmonicEnhance(r: Float64Array, maxLag: number): Float64Array {
  const at = (l: number) => (l < r.length ? Math.max(0, r[l]) : 0);
  const h = new Float64Array(maxLag + 2);
  for (let l = 0; l <= maxLag + 1; l++) {
    h[l] = at(l) + HARMONIC_WEIGHT * at(2 * l) + (HARMONIC_WEIGHT / 2) * at(4 * l);
  }
  return h;
}
