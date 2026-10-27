/**
 * pYIN, streaming: probabilistic YIN with a fixed-lag Viterbi, for a tuner.
 *
 * Mauch, M. & Dixon, S. (2014). "pYIN: A fundamental frequency estimator
 * using probabilistic threshold distributions." ICASSP, 659–663.
 *
 * Stage 1, per frame. YIN's cumulative mean normalised difference d′(τ)
 * dips at the period. Instead of one threshold, a Beta prior spreads 100
 * thresholds over [0, 1]; each threshold gives its probability to the first
 * dip under it (the global minimum gets 1 % of it when no dip is), so every
 * dip becomes a pitch candidate with a probability; their sum is the
 * frame's voicing probability.
 *
 * Stage 2, over time. A hidden Markov model over pitch bins (20 cents) ×
 * {voiced, unvoiced}: pitch moves at most `maxOctavesPerSecond` with a
 * triangular preference for small moves, voiced ↔ unvoiced switches cost
 * `switchProbability`; a voiced state is observed with `yinTrust` × the
 * probability of the candidates in its bin, an unvoiced one with what is
 * left, spread over the bins. Viterbi decodes it with a fixed lag: the
 * decision for a frame is taken `lagFrames` frames later (50 ms by default),
 * which in the proof of concept gave almost the offline accuracy (−0.4
 * point) where a causal decision lost 5 points and doubled octave errors.
 * The reported frequency is the most probable candidate near the chosen bin.
 *
 * Latency: the half window (21 ms at 2048 / 48 kHz) plus the lag.
 */

import { fftInPlace } from "./fft";
import { PITCH_DEFAULTS, frequencyToPitch, smoothPitchHistory, type PitchEstimate } from "./pitch";
import { nextPow2 } from "./timeFft";

export interface PyinTrackerOptions {
  sampleRate: number;
  /** Frequency of A4 in Hz. Default 440. */
  referenceA4?: number;
  /** Lowest detectable frequency in Hz (the window must hold two periods). Default 60. */
  minFrequency?: number;
  /** Highest detectable frequency in Hz. Default 2000. */
  maxFrequency?: number;
  /** Windows whose RMS is below this value have no candidate. Default 0.001 (−60 dBFS). */
  silenceRms?: number;
  /** Samples per analysis window. Default 2048. */
  windowSize?: number;
  /** Samples between two analyses. Default 10 ms. */
  hopSize?: number;
  /** Frames of look-ahead of the Viterbi decision. Default 50 ms worth of hops. */
  lagFrames?: number;
  /** Beta(a, b) prior over the YIN thresholds (mean a / (a + b)). Default 2, 18. */
  betaA?: number;
  betaB?: number;
  /** Cents per pitch state. Default 20. */
  binCents?: number;
  /** Fastest pitch move, in octaves per second. Default 35.92 (librosa's). */
  maxOctavesPerSecond?: number;
  /** Probability of a voiced ↔ unvoiced switch per frame. Default 0.01. */
  switchProbability?: number;
  /** Weight of the YIN candidates against the unvoiced hypothesis. Default 0.5. */
  yinTrust?: number;
  /** Cents band that keeps the displayed note's name (as `PitchTracker`). Default 10. */
  hysteresisCents?: number;
}

/** A pitch candidate of one frame: frequency (Hz) and probability. */
export interface PyinCandidate {
  frequency: number;
  probability: number;
}

const N_THRESHOLDS = 100;

/** Beta(a, b) CDF for integer a, b: P(Binomial(a + b − 1, x) ≥ a). */
function betaCdf(x: number, a: number, b: number): number {
  const n = a + b - 1;
  let s = 0;
  let c = 1; // C(n, k)
  for (let k = 0; k <= n; k++) {
    if (k >= a) s += c * Math.pow(x, k) * Math.pow(1 - x, n - k);
    c = (c * (n - k)) / (k + 1);
  }
  return s;
}

/** Probability mass of each of the 100 thresholds 0.01 … 1.00 under Beta(a, b). */
export function pyinThresholdPrior(a: number, b: number): Float64Array {
  const ia = Math.max(1, Math.round(a));
  const ib = Math.max(1, Math.round(b));
  const p = new Float64Array(N_THRESHOLDS);
  for (let i = 0; i < N_THRESHOLDS; i++) {
    p[i] = betaCdf((i + 1) / N_THRESHOLDS, ia, ib) - betaCdf(i / N_THRESHOLDS, ia, ib);
  }
  return p;
}

/** Parabolic vertex of a minimum around integer lag t. */
function parabolicMinimum(y: Float64Array, t: number): number {
  const a = y[t - 1];
  const b = y[t];
  const c = y[t + 1];
  const den = a - 2 * b + c;
  if (den <= 0) return t;
  return t + (a - c) / (2 * den);
}

/**
 * YIN's difference function through FFTs, reusing its buffers: d′(τ) for
 * τ = 0..maxLag of a window of W samples, integration length W − maxLag
 * (every lag compares the same number of samples).
 */
class Cmndf {
  private readonly re: Float64Array;
  private readonly im: Float64Array;
  private readonly re2: Float64Array;
  private readonly im2: Float64Array;
  private readonly energy: Float64Array;
  readonly out: Float64Array;

  constructor(
    private readonly windowSize: number,
    private readonly maxLag: number,
  ) {
    const n = nextPow2(2 * windowSize - maxLag);
    this.re = new Float64Array(n);
    this.im = new Float64Array(n);
    this.re2 = new Float64Array(n);
    this.im2 = new Float64Array(n);
    this.energy = new Float64Array(windowSize + 1);
    this.out = new Float64Array(maxLag + 1);
  }

  compute(x: ArrayLike<number>): Float64Array {
    const { re, im, re2, im2, energy, out, windowSize: w, maxLag } = this;
    const n = re.length;
    const len = w - maxLag;
    let mean = 0;
    for (let i = 0; i < w; i++) mean += x[i];
    mean /= w;
    re.fill(0);
    im.fill(0);
    re2.fill(0);
    im2.fill(0);
    for (let i = 0; i < w; i++) re[i] = x[i] - mean;
    for (let i = 0; i < len; i++) re2[i] = re[i];
    energy[0] = 0;
    for (let i = 0; i < w; i++) energy[i + 1] = energy[i] + re[i] * re[i];
    fftInPlace(re, im);
    fftInPlace(re2, im2);
    // r(τ) = Σ a[j]·x[j+τ]: inverse FFT of conj(A)·X, as a forward FFT of its conjugate.
    for (let i = 0; i < n; i++) {
      const a = re2[i];
      const b = -im2[i];
      const c = re[i];
      const d = im[i];
      re2[i] = a * c - b * d;
      im2[i] = -(a * d + b * c);
    }
    fftInPlace(re2, im2);
    out[0] = 1;
    const e0 = energy[len];
    let running = 0;
    for (let tau = 1; tau <= maxLag; tau++) {
      const r = re2[tau] / n;
      const d = Math.max(0, e0 + (energy[tau + len] - energy[tau]) - 2 * r);
      running += d;
      out[tau] = running > 0 ? (d * tau) / running : 1;
    }
    return out;
  }
}

/**
 * Streaming pYIN with `PitchTracker`'s interface: push samples, read
 * `estimate`. Every `hopSize` samples the latest `windowSize` are analysed;
 * the estimate is the decoded pitch of the frame `lagFrames` hops ago.
 * `clarity` is that frame's voicing probability (the share of YIN
 * thresholds that found a dip), in [0, 1].
 */
export class PyinTracker {
  private readonly sampleRate: number;
  private readonly windowSize: number;
  private readonly hopSize: number;
  private readonly lag: number;
  private readonly minFrequency: number;
  private readonly silenceRms: number;
  private readonly binCents: number;
  private readonly trust: number;
  private readonly hysteresisCents: number;
  private referenceA4: number;

  private readonly minLag: number;
  private readonly prior: Float64Array;
  private readonly cmndf: Cmndf;
  /** Number of pitch bins; states 0..nb−1 voiced, nb..2nb−1 unvoiced. */
  private readonly nb: number;
  /** Largest pitch move per frame, in bins. */
  private readonly reach: number;
  private readonly logTransition: Float64Array;
  private readonly logStay: number;
  private readonly logSwitch: number;

  private readonly ring: Float32Array;
  private readonly window: Float32Array;
  private writeIndex = 0;
  private filled = 0;
  private sinceAnalysis = 0;

  private score: Float64Array;
  private next: Float64Array;
  private readonly obsVoiced: Float64Array;
  private readonly bestV: Float64Array;
  private readonly argV: Int16Array;
  private readonly bestU: Float64Array;
  private readonly argU: Int16Array;
  /** Back-pointers and candidates of the last lag + 1 frames (ring). */
  private readonly back: Int16Array[];
  private readonly candidates: PyinCandidate[][];
  private frames = 0;
  private current: PitchEstimate | null = null;

  constructor(options: PyinTrackerOptions) {
    const sr = options.sampleRate;
    if (!(sr > 0)) throw new Error("PyinTracker needs a sample rate");
    this.sampleRate = sr;
    this.windowSize = options.windowSize ?? 2048;
    this.hopSize = Math.max(1, options.hopSize ?? Math.round(sr / 100));
    this.lag = Math.max(0, Math.round(options.lagFrames ?? (0.05 * sr) / this.hopSize));
    this.minFrequency = options.minFrequency ?? PITCH_DEFAULTS.minFrequency;
    const maxFrequency = options.maxFrequency ?? PITCH_DEFAULTS.maxFrequency;
    this.silenceRms = options.silenceRms ?? PITCH_DEFAULTS.silenceRms;
    this.binCents = options.binCents ?? 20;
    this.trust = options.yinTrust ?? 0.5;
    this.hysteresisCents = options.hysteresisCents ?? 10;
    this.referenceA4 = options.referenceA4 ?? PITCH_DEFAULTS.referenceA4;

    const maxLag = Math.min(Math.floor(sr / this.minFrequency), Math.floor(this.windowSize / 2));
    this.minLag = Math.max(2, Math.floor(sr / maxFrequency));
    this.cmndf = new Cmndf(this.windowSize, maxLag);
    this.prior = pyinThresholdPrior(options.betaA ?? 2, options.betaB ?? 18);

    this.nb = Math.ceil((1200 * Math.log2(maxFrequency / this.minFrequency)) / this.binCents) + 1;
    const maxOct = options.maxOctavesPerSecond ?? 35.92;
    const reach = Math.max(1, Math.round((maxOct * 1200 * (this.hopSize / sr)) / this.binCents));
    this.reach = reach;
    this.logTransition = new Float64Array(2 * reach + 1);
    let z = 0;
    for (let d = -reach; d <= reach; d++) z += reach + 1 - Math.abs(d);
    for (let d = -reach; d <= reach; d++) {
      this.logTransition[d + reach] = Math.log((reach + 1 - Math.abs(d)) / z);
    }
    const sw = Math.min(0.5, Math.max(1e-6, options.switchProbability ?? 0.01));
    this.logStay = Math.log(1 - sw);
    this.logSwitch = Math.log(sw);

    this.ring = new Float32Array(this.windowSize);
    this.window = new Float32Array(this.windowSize);
    const states = 2 * this.nb;
    this.score = new Float64Array(states);
    this.next = new Float64Array(states);
    this.obsVoiced = new Float64Array(this.nb);
    this.bestV = new Float64Array(this.nb);
    this.argV = new Int16Array(this.nb);
    this.bestU = new Float64Array(this.nb);
    this.argU = new Int16Array(this.nb);
    this.back = Array.from({ length: this.lag + 1 }, () => new Int16Array(states));
    this.candidates = Array.from({ length: this.lag + 1 }, () => []);
  }

  /** Latest decoded estimate (lagFrames behind), or `null` when unvoiced or idle. */
  get estimate(): PitchEstimate | null {
    return this.current;
  }

  /** Look-ahead of the decision, in seconds (plus half a window of centring). */
  get latencySeconds(): number {
    return (this.lag * this.hopSize + this.windowSize / 2) / this.sampleRate;
  }

  setReferenceA4(hz: number): void {
    this.referenceA4 = hz;
  }

  reset(): void {
    this.writeIndex = 0;
    this.filled = 0;
    this.sinceAnalysis = 0;
    this.frames = 0;
    this.current = null;
  }

  push(samples: ArrayLike<number>): void {
    const n = this.windowSize;
    for (let i = 0; i < samples.length; i++) {
      this.ring[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % n;
      if (this.filled < n) this.filled++;
      this.sinceAnalysis++;
      if (this.filled === n && this.sinceAnalysis >= this.hopSize) {
        this.sinceAnalysis = 0;
        this.analyse();
      }
    }
  }

  /**
   * pYIN stage 1 on one window: the CMNDF dips with the probability the
   * threshold prior gives them. Empty on silence.
   */
  candidatesOf(window: ArrayLike<number>): PyinCandidate[] {
    let energy = 0;
    for (let i = 0; i < this.windowSize; i++) energy += window[i] * window[i];
    if (Math.sqrt(energy / this.windowSize) < this.silenceRms) return [];
    const d = this.cmndf.compute(window);
    const maxLag = d.length - 1;
    const troughs: number[] = [];
    for (let t = this.minLag; t < maxLag; t++) {
      if (d[t] < d[t - 1] && d[t] <= d[t + 1]) troughs.push(t);
    }
    if (troughs.length === 0) return [];
    let global = troughs[0];
    for (const t of troughs) if (d[t] < d[global]) global = t;
    const prob = new Map<number, number>();
    for (let i = 0; i < N_THRESHOLDS; i++) {
      const s = (i + 1) / N_THRESHOLDS;
      let hit = -1;
      for (const t of troughs) {
        if (d[t] < s) {
          hit = t;
          break;
        }
      }
      if (hit < 0) prob.set(global, (prob.get(global) ?? 0) + 0.01 * this.prior[i]);
      else prob.set(hit, (prob.get(hit) ?? 0) + this.prior[i]);
    }
    const out: PyinCandidate[] = [];
    for (const [t, p] of prob) {
      out.push({ frequency: this.sampleRate / parabolicMinimum(d, t), probability: p });
    }
    return out;
  }

  private binOf(f: number): number {
    return Math.round((1200 * Math.log2(f / this.minFrequency)) / this.binCents);
  }

  private analyse(): void {
    const head = this.ring.subarray(this.writeIndex);
    this.window.set(head);
    this.window.set(this.ring.subarray(0, this.writeIndex), head.length);
    const cands = this.candidatesOf(this.window);
    const slot = this.frames % (this.lag + 1);
    this.candidates[slot] = cands;
    this.step(cands, this.back[slot]);
    this.frames++;
    if (this.frames <= this.lag) return;
    this.current = smoothPitchHistory([this.decide()], this.current, {
      medianFrames: 1,
      hysteresisCents: this.hysteresisCents,
      referenceA4: this.referenceA4,
    });
  }

  /** One Viterbi step: new scores into `score`, back-pointers into `bp`. */
  private step(cands: PyinCandidate[], bp: Int16Array): void {
    const { nb, reach, logTransition: lt, logStay, logSwitch, obsVoiced } = this;
    const { bestV, argV, bestU, argU } = this;
    const score = this.score;
    const next = this.next;
    obsVoiced.fill(0);
    let sum = 0;
    for (const c of cands) {
      const k = this.binOf(c.frequency);
      if (k < 0 || k >= nb) continue;
      obsVoiced[k] += this.trust * c.probability;
      sum += this.trust * c.probability;
    }
    const logObsU = Math.log(Math.max(1e-12, 1 - sum) / nb);

    if (this.frames === 0) {
      // Start unvoiced, uniform over the bins.
      for (let k = 0; k < nb; k++) {
        next[k] = -Infinity;
        next[nb + k] = Math.log(1 / nb) + logObsU;
        bp[k] = bp[nb + k] = nb + k;
      }
    } else {
      for (let k = 0; k < nb; k++) {
        let bv = -Infinity;
        let av = k;
        let bu = -Infinity;
        let au = nb + k;
        const from = Math.max(0, k - reach);
        const to = Math.min(nb - 1, k + reach);
        for (let j = from; j <= to; j++) {
          const w = lt[j - k + reach];
          const sv = score[j] + w;
          if (sv > bv) {
            bv = sv;
            av = j;
          }
          const su = score[nb + j] + w;
          if (su > bu) {
            bu = su;
            au = nb + j;
          }
        }
        bestV[k] = bv;
        argV[k] = av;
        bestU[k] = bu;
        argU[k] = au;
      }
      for (let k = 0; k < nb; k++) {
        const logObsV = obsVoiced[k] > 0 ? Math.log(obsVoiced[k]) : -Infinity;
        // Into voiced k: from voiced (stay) or from unvoiced (switch).
        const a1 = bestV[k] + logStay;
        const a2 = bestU[k] + logSwitch;
        next[k] = Math.max(a1, a2) + logObsV;
        bp[k] = a1 >= a2 ? argV[k] : argU[k];
        // Into unvoiced k.
        const b1 = bestU[k] + logStay;
        const b2 = bestV[k] + logSwitch;
        next[nb + k] = Math.max(b1, b2) + logObsU;
        bp[nb + k] = b1 >= b2 ? argU[k] : argV[k];
      }
    }
    // Renormalise to keep the numbers small, then swap the buffers.
    let m = -Infinity;
    for (let k = 0; k < 2 * nb; k++) if (next[k] > m) m = next[k];
    for (let k = 0; k < 2 * nb; k++) next[k] -= m;
    this.next = score;
    this.score = next;
  }

  /** Backtracks `lag` frames from the best current state; the decoded frame's estimate. */
  private decide(): PitchEstimate | null {
    const { nb, lag } = this;
    const score = this.score;
    let s = 0;
    for (let k = 1; k < score.length; k++) if (score[k] > score[s]) s = k;
    const last = this.frames - 1;
    for (let u = last; u > last - lag; u--) s = this.back[u % (lag + 1)][s];
    if (s >= nb) return null;
    const cands = this.candidates[(last - lag) % (lag + 1)];
    // A voiced state needs a candidate in its bin, so one is always found;
    // the bin's centre is only a fallback.
    let frequency = this.minFrequency * Math.pow(2, (s * this.binCents) / 1200);
    let bestProbability = -1;
    let voicing = 0;
    for (const c of cands) {
      voicing += c.probability;
      if (Math.abs(this.binOf(c.frequency) - s) <= 1 && c.probability > bestProbability) {
        bestProbability = c.probability;
        frequency = c.frequency;
      }
    }
    return frequencyToPitch(frequency, Math.min(1, voicing), this.referenceA4);
  }
}
