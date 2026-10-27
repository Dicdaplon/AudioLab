/**
 * Chord smoothing with a hidden Markov model: an alternative to averaging
 * the chroma over a fixed 1 s window before matching templates.
 *
 * Each frame is matched on its own (one analyser window, ~0.34 s), which
 * gives a probability per chord. The model then assumes a chord tends to
 * last: at every frame it stays with probability p, or jumps to any other
 * state with the same small probability. A frame that disagrees with its
 * neighbours is outvoted instead of flipping the answer, and a real change
 * wins after a few frames.
 *
 *   states      one per chord pitch set, plus "N" (no chord: silence,
 *               drums, noise)
 *   emissions   per-frame chord probabilities raised to an exponent κ < 1:
 *               neighbouring frames overlap (~70 % at 10 fps), so they are
 *               not independent evidence and must count for less
 *   transitions p on the diagonal, (1 − p) / (S − 1) elsewhere; with that
 *               uniform jump each step costs O(S), not O(S²)
 *   decoding    fixed-lag smoothing: the answer for frame t − L uses the L
 *               frames after it (forward–backward over the last L frames),
 *               L = 0 being plain causal filtering
 *
 * p comes from the mean chord duration D: p = 1 − 1 / (D · fps), the mean
 * of the geometric stay. Starting values from the MIR literature and our
 * reviewers: D ≈ 2 s, L ≈ 0.3 s, κ ≈ 0.4. Measured on
 * `npm run measure:progressions`, the lag did not pay for itself, and a
 * sweep on GuitarSet (real guitar, tuned on players 00–02, checked on
 * 03–05, `npm run measure:guitarset -- --sweep`) chose D = 1 s, κ = 0.6:
 * the engine defaults to those, with L = 0 (causal filtering).
 *
 * References:
 *   Sheh, A. & Ellis, D. P. W. (2003). Chord segmentation and recognition
 *   using EM-trained hidden Markov models. ISMIR.
 *   Cho, T. & Bello, J. P. (2014). On the relative importance of individual
 *   components of chord recognition systems. IEEE/ACM TASLP 22(2).
 */

export interface ChordHmmOptions {
  /** Number of states, the "no chord" state included. */
  states: number;
  /** Probability of staying in the same state from one frame to the next, in (0, 1). */
  selfTransition: number;
  /** Smoothing lag in frames (≥ 0). */
  lagFrames: number;
  /** Exponent applied to the emissions, in (0, 1]. Default 0.4 (the engine passes 0.6). */
  emissionExponent?: number;
}

export class ChordHmm {
  private readonly n: number;
  private readonly stay: number;
  private readonly jump: number;
  private readonly lag: number;
  private readonly kappa: number;
  /** Filtered posteriors α and emissions e of the last lag + 1 frames, oldest first. */
  private alphas: Float64Array[] = [];
  private emissions: Float64Array[] = [];

  constructor(opts: ChordHmmOptions) {
    if (!(opts.states >= 2)) throw new Error("ChordHmm: at least 2 states");
    if (!(opts.selfTransition > 0 && opts.selfTransition < 1)) {
      throw new Error("ChordHmm: selfTransition must be in (0, 1)");
    }
    this.n = opts.states;
    this.stay = opts.selfTransition;
    this.jump = (1 - opts.selfTransition) / (opts.states - 1);
    this.lag = Math.max(0, Math.round(opts.lagFrames));
    this.kappa = opts.emissionExponent ?? 0.4;
  }

  get states(): number {
    return this.n;
  }

  /** Frames between the newest input and the frame `push` answers for. */
  get lagFrames(): number {
    return this.lag;
  }

  reset(): void {
    this.alphas = [];
    this.emissions = [];
  }

  /**
   * Push the per-state probabilities of a new frame (need not sum to 1) and
   * return the smoothed posterior of the frame `lagFrames` earlier (of the
   * oldest frame while fewer have been pushed). Sums to 1.
   */
  push(probabilities: ArrayLike<number>): Float64Array {
    const n = this.n;
    if (probabilities.length !== n) {
      throw new Error(`ChordHmm: expected ${n} probabilities, got ${probabilities.length}`);
    }
    const e = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const p = probabilities[i];
      // A floor keeps a state reachable when one frame rules it out entirely.
      e[i] = Math.pow(Number.isFinite(p) && p > 1e-12 ? p : 1e-12, this.kappa);
    }

    const prev = this.alphas[this.alphas.length - 1];
    const alpha = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      const prior = prev ? this.stay * prev[j] + this.jump * (1 - prev[j]) : 1 / n;
      alpha[j] = e[j] * prior;
    }
    normalise(alpha);

    this.alphas.push(alpha);
    this.emissions.push(e);
    if (this.alphas.length > this.lag + 1) {
      this.alphas.shift();
      this.emissions.shift();
    }

    // Backward pass from the newest frame down to the oldest kept one.
    let beta = new Float64Array(n).fill(1);
    for (let k = this.alphas.length - 1; k > 0; k--) {
      const ek = this.emissions[k];
      let total = 0;
      for (let j = 0; j < n; j++) total += ek[j] * beta[j];
      const next = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const own = ek[i] * beta[i];
        next[i] = this.stay * own + this.jump * (total - own);
      }
      normalise(next);
      beta = next;
    }
    const gamma = new Float64Array(n);
    const a0 = this.alphas[0];
    for (let i = 0; i < n; i++) gamma[i] = a0[i] * beta[i];
    return normalise(gamma);
  }
}

function normalise(v: Float64Array): Float64Array {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i];
  if (s > 0) for (let i = 0; i < v.length; i++) v[i] /= s;
  else v.fill(1 / v.length);
  return v;
}

/** Self-transition probability for a mean chord duration at a frame rate. */
export function selfTransitionFor(meanChordSeconds: number, framesPerSecond: number): number {
  const frames = Math.max(1.01, meanChordSeconds * framesPerSecond);
  return 1 - 1 / frames;
}
