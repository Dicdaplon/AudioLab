/**
 * IIR lowpass filter: Butterworth design with cascaded biquad sections.
 *
 * Used in Section 2 (tempo analysis) to smooth the spectral envelope and
 * extract the low-frequency modulation (note onsets, vibrato, etc.).
 *
 * Implementation: Butterworth lowpass with order 4 (2 cascaded biquad sections).
 * Cutoff frequency is typically 0.5–4 Hz (tempo-relevant).
 */

/**
 * Butterworth biquad section: one pole pair.
 * Implements y[n] = (b0·x[n] + b1·x[n-1] + b2·x[n-2]) - (a1·y[n-1] + a2·y[n-2])
 */
export interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/**
 * State of a single biquad filter (two delay taps).
 */
export interface BiquadState {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/**
 * Design a Butterworth lowpass biquad section.
 *
 * Converts normalized frequency (0 to 1, where 1 = Nyquist) to
 * Butterworth pole placement and then to biquad coefficients.
 *
 * @param normalizedFreq Cutoff frequency as a fraction of Nyquist (0 < freq < 1).
 * @return Biquad coefficients for one pole pair.
 */
function designButterworthBiquad(normalizedFreq: number): BiquadCoeffs {
  if (normalizedFreq <= 0 || normalizedFreq >= 1) {
    throw new Error(`normalizedFreq must be in (0, 1), got ${normalizedFreq}`);
  }

  // Butterworth poles in s-plane: one pair at -sin(θ) ± j·cos(θ),
  // where θ is the pole angle. For a single section (2nd order), θ = 3π/8.
  const theta = (3 * Math.PI) / 8;
  const sn = Math.sin(theta);

  // Bilinear transform: s → (2/T) · (1 - z⁻¹) / (1 + z⁻¹)
  // Normalized frequency ωc (angular, 0 to π):
  const wc = normalizedFreq * Math.PI;
  const tanHalf = Math.tan(wc / 2);

  // Bilinear-transformed denominator and numerator coefficients.
  const scale = 1 / (1 + 2 * sn * tanHalf + tanHalf * tanHalf);

  const b0 = tanHalf * tanHalf * scale;
  const b1 = 2 * (tanHalf * tanHalf) * scale;
  const b2 = tanHalf * tanHalf * scale;
  const a1 = 2 * (tanHalf * tanHalf - 1) * scale;
  const a2 = (1 - 2 * sn * tanHalf + tanHalf * tanHalf) * scale;

  return { b0, b1, b2, a1, a2 };
}

/**
 * Apply a single biquad filter section to an input sample.
 * @param x Input sample.
 * @param coeffs Biquad coefficients.
 * @param state Biquad state (updated in-place).
 * @return Filtered output sample.
 */
function processBiquad(x: number, coeffs: BiquadCoeffs, state: BiquadState): number {
  const y =
    coeffs.b0 * x +
    coeffs.b1 * state.x1 +
    coeffs.b2 * state.x2 -
    coeffs.a1 * state.y1 -
    coeffs.a2 * state.y2;

  state.x2 = state.x1;
  state.x1 = x;
  state.y2 = state.y1;
  state.y1 = y;

  return y;
}

/**
 * Butterworth IIR lowpass filter: order 4 (2 cascaded biquad sections).
 *
 * Initialized with flat frequency response (magnitude = 1 at all frequencies).
 * State is maintained across calls for continual filtering.
 */
export class LowpassFilter {
  private coeffs1: BiquadCoeffs;
  private coeffs2: BiquadCoeffs;
  private state1: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  private state2: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };

  /**
   * @param cutoffHz Cutoff frequency in Hz.
   * @param sampleRate Sample rate in Hz.
   */
  constructor(cutoffHz: number, sampleRate: number) {
    if (cutoffHz <= 0 || sampleRate <= 0) {
      throw new Error(`cutoffHz and sampleRate must be > 0 (got ${cutoffHz}, ${sampleRate})`);
    }
    if (cutoffHz >= sampleRate / 2) {
      throw new Error(`cutoffHz (${cutoffHz}) must be < Nyquist (${sampleRate / 2})`);
    }

    const normalizedFreq = cutoffHz / (sampleRate / 2);
    this.coeffs1 = designButterworthBiquad(normalizedFreq);
    this.coeffs2 = designButterworthBiquad(normalizedFreq);
  }

  /**
   * Reset the filter state (clear delay taps).
   */
  reset(): void {
    this.state1 = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.state2 = { x1: 0, x2: 0, y1: 0, y2: 0 };
  }

  /**
   * Update the cutoff frequency (recompute biquad coefficients).
   * @param cutoffHz New cutoff frequency in Hz.
   * @param sampleRate Sample rate in Hz.
   */
  setCutoff(cutoffHz: number, sampleRate: number): void {
    if (cutoffHz <= 0 || sampleRate <= 0) {
      throw new Error(`cutoffHz and sampleRate must be > 0 (got ${cutoffHz}, ${sampleRate})`);
    }
    if (cutoffHz >= sampleRate / 2) {
      throw new Error(`cutoffHz (${cutoffHz}) must be < Nyquist (${sampleRate / 2})`);
    }
    const normalizedFreq = cutoffHz / (sampleRate / 2);
    this.coeffs1 = designButterworthBiquad(normalizedFreq);
    this.coeffs2 = designButterworthBiquad(normalizedFreq);
  }

  /**
   * Process a single sample through the cascaded biquad filter.
   * @param x Input sample.
   * @return Filtered output sample.
   */
  processSample(x: number): number {
    const y1 = processBiquad(x, this.coeffs1, this.state1);
    const y2 = processBiquad(y1, this.coeffs2, this.state2);
    return y2;
  }

  /**
   * Process an array of samples, returning a new filtered array.
   * State persists across calls.
   * @param input Input samples.
   * @return Filtered samples.
   */
  processFrame(input: ArrayLike<number>): Float32Array {
    const out = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      out[i] = this.processSample(input[i]);
    }
    return out;
  }
}
