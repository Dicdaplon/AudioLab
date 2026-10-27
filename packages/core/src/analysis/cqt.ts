/**
 * Constant-Q chroma: every note analysed with a window matched to its pitch.
 *
 * An FFT gives every frequency the same window, so the low strings get the
 * same 0.34 s as the high ones: two neighbouring low notes, 5 Hz apart,
 * blur together, while high notes are blurred in time for nothing. A
 * constant-Q transform gives each bin a window of the same number of
 * periods: long for E2 (about 0.7 s), short for E5 (a few tens of ms).
 *
 *   bins        24 per octave (quarter tones) from E2 (82 Hz) to D7 (2.3 kHz)
 *   kernels     Hann-windowed complex exponentials, length 2·sr / (α·f),
 *               α = 2^(1/24) − 1 (≈ 68 periods), capped by the buffer
 *   chroma      log(1 + 100·E / E_max) per bin, the on-semitone bin to its
 *               pitch class, the quarter-tone bins half to each neighbour
 *
 * Computed directly in time on the latest samples (each window ends now,
 * so the analysis is causal), at the display rate (10 times a second).
 *
 * References:
 *   Brown, J. C. (1991). Calculation of a constant Q spectral transform.
 *   JASA 89(1), 425–434.
 *   Schörkhuber, C. & Klapuri, A. (2010). Constant-Q transform toolbox for
 *   music processing. Proc. SMC.
 */

import { CHROMA_SIZE, l1Normalize } from "./chroma";

export interface CqtChromaOptions {
  sampleRate: number;
  /** Longest window, in samples (the buffer the caller provides). */
  maxLength: number;
  /** Lowest note, MIDI. Default 40 (E2). */
  lowMidi?: number;
  /** Highest note, MIDI. Default 98 (D7). */
  highMidi?: number;
  /** Log-compression gain. Default 100. */
  logGain?: number;
}

interface Kernel {
  midi: number;
  length: number;
  cos: Float32Array;
  sin: Float32Array;
}

export class CqtChroma {
  readonly sampleRate: number;
  readonly maxLength: number;
  private readonly kernels: Kernel[];
  private readonly logGain: number;
  private readonly energies: Float64Array;

  constructor(opts: CqtChromaOptions) {
    const { sampleRate, maxLength, lowMidi = 40, highMidi = 98, logGain = 100 } = opts;
    if (!(sampleRate > 0) || !(maxLength > 0))
      throw new Error("CqtChroma: sampleRate and maxLength must be > 0");
    this.sampleRate = sampleRate;
    this.maxLength = Math.floor(maxLength);
    this.logGain = logGain;
    const alpha = Math.pow(2, 1 / 24) - 1;
    this.kernels = [];
    for (let m = lowMidi; m <= highMidi; m += 0.5) {
      const f = 440 * Math.pow(2, (m - 69) / 12);
      if (f >= sampleRate / 2) break;
      const length = Math.min(this.maxLength, Math.round((2 * sampleRate) / (alpha * f)));
      const cos = new Float32Array(length);
      const sin = new Float32Array(length);
      let norm = 0;
      for (let n = 0; n < length; n++) norm += 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / length);
      for (let n = 0; n < length; n++) {
        const w = (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / length)) / norm;
        const ph = (2 * Math.PI * f * n) / sampleRate;
        cos[n] = w * Math.cos(ph);
        sin[n] = w * Math.sin(ph);
      }
      this.kernels.push({ midi: m, length, cos, sin });
    }
    this.energies = new Float64Array(this.kernels.length);
  }

  /** Multiply-adds per call (cost estimate). */
  get cost(): number {
    return this.kernels.reduce((s, k) => s + 2 * k.length, 0);
  }

  /**
   * Chroma of the latest samples: `samples` ends now; only its last
   * `maxLength` samples are read. Returns the L1-normalised chroma and the
   * mean bin energy in dB (for level checks); a zero chroma when silent.
   */
  analyse(samples: ArrayLike<number>): { chroma: Float32Array; levelDb: number } {
    const end = samples.length;
    let peak = 0;
    let sum = 0;
    this.kernels.forEach((k, i) => {
      const start = end - k.length;
      let re = 0;
      let im = 0;
      if (start >= 0) {
        for (let n = 0; n < k.length; n++) {
          const x = samples[start + n];
          re += x * k.cos[n];
          im += x * k.sin[n];
        }
      }
      const e = re * re + im * im;
      this.energies[i] = e;
      sum += e;
      if (e > peak) peak = e;
    });
    const chroma = new Float32Array(CHROMA_SIZE);
    const levelDb = sum > 0 ? 10 * Math.log10(sum / this.kernels.length) : -200;
    if (!(peak > 0)) return { chroma, levelDb };
    this.kernels.forEach((k, i) => {
      const v = Math.log1p((this.logGain * this.energies[i]) / peak);
      const low = Math.floor(k.midi);
      if (k.midi === low) chroma[((low % 12) + 12) % 12] += v;
      else {
        chroma[((low % 12) + 12) % 12] += v / 2;
        chroma[(((low + 1) % 12) + 12) % 12] += v / 2;
      }
    });
    return { chroma: l1Normalize(chroma), levelDb };
  }
}
