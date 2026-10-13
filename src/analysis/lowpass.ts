/**
 * IIR lowpass filter: 4th-order Butterworth as two cascaded biquad sections.
 *
 * Used by the tempo analyser to smooth the onset-strength envelope before it
 * is decimated and transformed (anti-aliasing / de-noising of a signal whose
 * useful content lives below ~10 Hz).
 *
 * Design: an N-th order Butterworth lowpass has its poles equally spaced on
 * the left half of the unit circle in the s-plane, at angles
 *
 *     θ_k = (2k − 1)·π / (2N),   k = 1 … N/2
 *
 * measured from the imaginary axis. Each conjugate pole pair at
 * −sin(θ_k) ± j·cos(θ_k) becomes one biquad with Q = 1 / (2·sin θ_k). For
 * N = 4 that gives θ = π/8 (Q ≈ 1.307) and θ = 3π/8 (Q ≈ 0.541). Using the
 * same angle twice would not be a Butterworth: the cascade of two identical
 * 3π/8 sections, for example, sits at −10.7 dB instead of −3.01 dB at fc.
 *
 * Each section is mapped to the z-plane with the bilinear transform and
 * tan(ω_c / 2) frequency pre-warping, so the digital −3 dB point lands
 * exactly on the requested cutoff.
 */

/**
 * Biquad section coefficients (Direct Form I, a0 normalised to 1):
 *   y[n] = b0·x[n] + b1·x[n−1] + b2·x[n−2] − a1·y[n−1] − a2·y[n−2]
 */
export interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/** State of a single biquad filter (two delay taps per side). */
export interface BiquadState {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/** Filter order (number of poles). Two biquad sections. */
export const BUTTERWORTH_ORDER = 4;

/**
 * Pole angles (from the imaginary axis) of an even-order Butterworth
 * lowpass, one per biquad section.
 */
export function butterworthPoleAngles(order: number): number[] {
  if (order < 2 || order % 2 !== 0) {
    throw new Error(`order must be a positive even integer, got ${order}`);
  }
  const angles: number[] = [];
  for (let k = 1; k <= order / 2; k++) {
    angles.push(((2 * k - 1) * Math.PI) / (2 * order));
  }
  return angles;
}

/**
 * Design one Butterworth lowpass biquad section.
 *
 * @param normalizedFreq Cutoff as a fraction of Nyquist (0 < f < 1).
 * @param theta Pole angle of this section (see module doc).
 */
export function designButterworthBiquad(normalizedFreq: number, theta: number): BiquadCoeffs {
  if (normalizedFreq <= 0 || normalizedFreq >= 1) {
    throw new Error(`normalizedFreq must be in (0, 1), got ${normalizedFreq}`);
  }

  // Bilinear transform s → (1 − z⁻¹) / (1 + z⁻¹) with pre-warping, so that
  // the analog prototype's cutoff ω = 1 maps onto the digital ω_c.
  const wc = normalizedFreq * Math.PI;
  const K = Math.tan(wc / 2);
  const K2 = K * K;
  const twoSinTheta = 2 * Math.sin(theta); // = 1/Q
  const norm = 1 / (1 + twoSinTheta * K + K2);

  return {
    b0: K2 * norm,
    b1: 2 * K2 * norm,
    b2: K2 * norm,
    a1: 2 * (K2 - 1) * norm,
    a2: (1 - twoSinTheta * K + K2) * norm,
  };
}

/** Apply one biquad section to one sample; `state` is updated in place. */
function processBiquad(x: number, c: BiquadCoeffs, s: BiquadState): number {
  const y = c.b0 * x + c.b1 * s.x1 + c.b2 * s.x2 - c.a1 * s.y1 - c.a2 * s.y2;
  s.x2 = s.x1;
  s.x1 = x;
  s.y2 = s.y1;
  s.y1 = y;
  return y;
}

/** Magnitude (linear) of one biquad section at angular frequency ω. */
function biquadMagnitude(c: BiquadCoeffs, omega: number): number {
  const cos1 = Math.cos(omega);
  const sin1 = Math.sin(omega);
  const cos2 = Math.cos(2 * omega);
  const sin2 = Math.sin(2 * omega);
  // Evaluate numerator and denominator polynomials at z⁻¹ = e^{−jω}.
  const numRe = c.b0 + c.b1 * cos1 + c.b2 * cos2;
  const numIm = -(c.b1 * sin1 + c.b2 * sin2);
  const denRe = 1 + c.a1 * cos1 + c.a2 * cos2;
  const denIm = -(c.a1 * sin1 + c.a2 * sin2);
  return Math.hypot(numRe, numIm) / Math.hypot(denRe, denIm);
}

function validateCutoff(cutoffHz: number, sampleRate: number): void {
  if (!(cutoffHz > 0) || !(sampleRate > 0)) {
    throw new Error(`cutoffHz and sampleRate must be > 0 (got ${cutoffHz}, ${sampleRate})`);
  }
  if (cutoffHz >= sampleRate / 2) {
    throw new Error(`cutoffHz (${cutoffHz}) must be < Nyquist (${sampleRate / 2})`);
  }
}

/**
 * 4th-order Butterworth IIR lowpass (two cascaded biquads).
 *
 * The delay taps start at zero, so the first samples after construction or
 * `reset()` include the filter's start-up transient. State persists across
 * `processSample` / `processFrame` calls for continuous streaming.
 */
export class LowpassFilter {
  private sections: BiquadCoeffs[] = [];
  private states: BiquadState[] = [];
  private cutoffHz = 0;
  private sampleRate = 0;

  /**
   * @param cutoffHz −3 dB cutoff frequency in Hz.
   * @param sampleRate Sample rate of the signal being filtered, in Hz.
   */
  constructor(cutoffHz: number, sampleRate: number) {
    this.setCutoff(cutoffHz, sampleRate);
    this.reset();
  }

  /** Coefficients of the cascaded sections (first section first). */
  get coefficients(): readonly BiquadCoeffs[] {
    return this.sections;
  }

  /** Current −3 dB cutoff in Hz. */
  get cutoff(): number {
    return this.cutoffHz;
  }

  /** Clear the delay taps of every section. */
  reset(): void {
    this.states = this.sections.map(() => ({ x1: 0, x2: 0, y1: 0, y2: 0 }));
  }

  /**
   * Recompute the coefficients for a new cutoff and/or sample rate. The
   * filter state is kept, so a cutoff change during streaming does not
   * introduce a discontinuity larger than the response change itself.
   */
  setCutoff(cutoffHz: number, sampleRate: number): void {
    validateCutoff(cutoffHz, sampleRate);
    const normalizedFreq = cutoffHz / (sampleRate / 2);
    this.sections = butterworthPoleAngles(BUTTERWORTH_ORDER).map((theta) =>
      designButterworthBiquad(normalizedFreq, theta),
    );
    this.cutoffHz = cutoffHz;
    this.sampleRate = sampleRate;
    if (this.states.length !== this.sections.length) this.reset();
  }

  /** Steady-state magnitude response in dB at `frequencyHz`. */
  magnitudeDb(frequencyHz: number): number {
    const omega = (2 * Math.PI * frequencyHz) / this.sampleRate;
    let mag = 1;
    for (const c of this.sections) mag *= biquadMagnitude(c, omega);
    return mag > 0 ? 20 * Math.log10(mag) : -Infinity;
  }

  /** Process one sample through the cascade. */
  processSample(x: number): number {
    let y = x;
    for (let i = 0; i < this.sections.length; i++) {
      y = processBiquad(y, this.sections[i], this.states[i]);
    }
    return y;
  }

  /** Process an array of samples into a new Float32Array. State persists. */
  processFrame(input: ArrayLike<number>): Float32Array {
    const out = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) out[i] = this.processSample(input[i]);
    return out;
  }
}
