/**
 * Vibrato detector: tells whether a held note wavers periodically, how fast
 * and how wide, from the cents of its pitch estimates.
 *
 * A guitar vibrato is a pitch oscillation of roughly 4–8 Hz and ±10–50
 * cents. Over the last `windowSeconds` of the note the detector removes the
 * mean (and a linear drift, a slow bend), then reads:
 *
 *   - the extent: half the peak-to-peak of the detrended cents (±cents),
 *   - the rate: from the zero crossings of the detrended curve (two per
 *     cycle), kept only when the crossings are regular, so a random jitter
 *     of the tracker does not read as vibrato.
 *
 * Vibrato is reported when the rate is inside [minRateHz, maxRateHz] and
 * the extent is at least `minExtentCents`. The estimates must come at least
 * four times as fast as the fastest rate (40 per second for 10 Hz). A
 * verdict needs only two regular half-periods, about 0.17 s at 6 Hz, so a
 * short, violent vibrato is caught too. Time comes
 * from the caller, in seconds.
 */

export interface VibratoOptions {
  /** Analysis window, in seconds. Default 0.5 (short enough to catch a quick, wide vibrato). */
  windowSeconds?: number;
  /** Slowest oscillation counted as vibrato, in Hz. Default 3.5. */
  minRateHz?: number;
  /** Fastest oscillation counted as vibrato, in Hz. Default 10. */
  maxRateHz?: number;
  /** Smallest extent (± cents) counted as vibrato. Default 12. */
  minExtentCents?: number;
  /** Largest spread of the half-periods, relative to their mean. Default 0.45. */
  maxIrregularity?: number;
}

export const VIBRATO_DEFAULTS: Required<VibratoOptions> = {
  windowSeconds: 0.5,
  minRateHz: 3.5,
  maxRateHz: 10,
  minExtentCents: 12,
  maxIrregularity: 0.45,
};

export interface VibratoReading {
  /** True when the note is wavering like a vibrato. */
  active: boolean;
  /** Oscillation rate in Hz (0 when no regular oscillation was found). */
  rateHz: number;
  /** Half the peak-to-peak of the detrended cents (± cents). */
  extentCents: number;
}

export const NO_VIBRATO: VibratoReading = { active: false, rateHz: 0, extentCents: 0 };

export class VibratoDetector {
  private o: Required<VibratoOptions>;
  private times: number[] = [];
  private cents: number[] = [];

  constructor(options: VibratoOptions = {}) {
    this.o = { ...VIBRATO_DEFAULTS, ...options };
  }

  /** Change the thresholds; the samples are kept. */
  configure(options: VibratoOptions): void {
    this.o = { ...this.o, ...options };
  }

  /** Add an estimate of the held note (cents from its semitone) and read the vibrato. */
  push(cents: number, timeSeconds: number): VibratoReading {
    this.times.push(timeSeconds);
    this.cents.push(cents);
    const oldest = timeSeconds - this.o.windowSeconds;
    let drop = 0;
    while (drop < this.times.length && this.times[drop] < oldest) drop++;
    if (drop > 0) {
      this.times.splice(0, drop);
      this.cents.splice(0, drop);
    }
    return this.read();
  }

  /** Start over (a new note). */
  reset(): void {
    this.times = [];
    this.cents = [];
  }

  private read(): VibratoReading {
    const n = this.times.length;
    const span = n > 1 ? this.times[n - 1] - this.times[0] : 0;
    // Need a cycle of a typical (6 Hz) vibrato before saying anything; the
    // regularity check below needs at least two half-periods.
    if (n < 5 || span < 0.15) return NO_VIBRATO;

    // Least-squares line through the cents: what remains is the oscillation.
    let st = 0;
    let sc = 0;
    for (let i = 0; i < n; i++) {
      st += this.times[i];
      sc += this.cents[i];
    }
    const mt = st / n;
    const mc = sc / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (this.times[i] - mt) * (this.cents[i] - mc);
      den += (this.times[i] - mt) ** 2;
    }
    const slope = den > 0 ? num / den : 0;
    let lo = Infinity;
    let hi = -Infinity;
    const crossings: number[] = [];
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const d = this.cents[i] - (mc + slope * (this.times[i] - mt));
      lo = Math.min(lo, d);
      hi = Math.max(hi, d);
      if (i > 0 && prev !== 0 && Math.sign(d) !== Math.sign(prev) && d !== 0) {
        // Interpolated time of the crossing.
        const t0 = this.times[i - 1];
        const t1 = this.times[i];
        crossings.push(t0 + ((t1 - t0) * prev) / (prev - d));
      }
      if (d !== 0) prev = d;
    }
    const extentCents = (hi - lo) / 2;

    let rateHz = 0;
    if (crossings.length >= 3) {
      const halves: number[] = [];
      for (let i = 1; i < crossings.length; i++) halves.push(crossings[i] - crossings[i - 1]);
      const mean = halves.reduce((a, b) => a + b, 0) / halves.length;
      const spread = Math.sqrt(halves.reduce((a, b) => a + (b - mean) ** 2, 0) / halves.length);
      if (mean > 0 && spread / mean <= this.o.maxIrregularity) rateHz = 1 / (2 * mean);
    }
    const active =
      rateHz >= this.o.minRateHz &&
      rateHz <= this.o.maxRateHz &&
      extentCents >= this.o.minExtentCents;
    return { active, rateHz, extentCents };
  }
}
