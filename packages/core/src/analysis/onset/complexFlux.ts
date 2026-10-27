/**
 * SuperFlux + rectified complex domain, streaming. Pure TypeScript. The ODF
 * of the opt-in onset method "superflux-complex".
 *
 * Two detection functions on the same causal STFT frames, each divided by
 * its own running maximum, then summed:
 *
 *   sf[n]  = SuperFlux (see superFlux.ts)
 *   X̂[n,k] = |X[n−μ,k]| · e^{j(2φ[n−μ,k] − φ[n−2μ,k])}     (phase advanced at
 *                                                          its previous rate)
 *   cd[n]  = Σ_k |X[n,k] − X̂[n,k]|  over the bins where |X[n,k]| > |X[n−μ,k]|
 *   odf[n] = sf[n] / Mₛ[n] + cd[n] / M꜀[n]
 *   M[n]   = max(v[n], M[n−1] · decay, floor)                (decay: `normSeconds`)
 *
 * - In a steady note each bin keeps its magnitude and turns its phase at a
 *   constant rate, so the next frame is predictable; an attack is far from
 *   the prediction in magnitude or in phase. That catches soft, pitched
 *   attacks that barely change the log energy SuperFlux sees, and the
 *   rectification (only rising bins) ignores note releases.
 * - The two functions live on different scales, hence the normalisation.
 *   A live detector cannot know the loudest frame of the whole take, so it
 *   uses a running maximum that forgets over about `normSeconds`; the floor
 *   keeps silence or a faint background from being stretched up to 1.
 * - The predicted phasor is computed without angles:
 *   X̂ = X[n−μ]² · conj(X[n−2μ]) / (|X[n−μ]| · |X[n−2μ]|), so there is no
 *   atan2 per bin.
 * - cd is divided by frameSize / 4, the peak bin of a unit sine under a
 *   Hann window, so its floor reads as an amplitude.
 *
 * References: J. P. Bello, C. Duxbury, M. Davies, M. Sandler, "On the use of
 * phase and energy for musical onset detection in the complex domain",
 * IEEE SPL 11(6), 2004; S. Dixon, "Onset detection revisited", DAFx 2006
 * (rectified complex domain); S. Böck and G. Widmer, DAFx 2013 (SuperFlux).
 */

import { SuperFluxOdf, type SuperFluxConfig } from "./superFlux";

export interface SuperFluxComplexConfig extends SuperFluxConfig {
  /** Frame distance μ of the complex-domain prediction. Default 1. */
  complexDiffFrames: number;
  /** Memory of the running maxima, in seconds (time constant). Default 10. */
  normSeconds: number;
  /** Smallest running maximum of the SuperFlux term. Default 0.05. */
  fluxFloor: number;
  /** Smallest running maximum of the complex-domain term (amplitude units). Default 0.05. */
  complexFloor: number;
}

export const SUPER_FLUX_COMPLEX_DEFAULTS = {
  complexDiffFrames: 1,
  normSeconds: 10,
  fluxFloor: 0.05,
  complexFloor: 0.05,
} as const;

export type SuperFluxComplexOptions = Partial<SuperFluxComplexConfig> & { sampleRate: number };

export class SuperFluxComplexOdf extends SuperFluxOdf {
  readonly complexConfig: Readonly<
    Pick<SuperFluxComplexConfig, keyof typeof SUPER_FLUX_COMPLEX_DEFAULTS>
  >;
  /** Spectra (re, im, magnitude) of the last 2μ+1 frames, as a ring. */
  private readonly specRe: Float32Array[];
  private readonly specIm: Float32Array[];
  private readonly specMag: Float32Array[];
  private readonly decay: number;
  private readonly cdScale: number;
  private frames = 0;
  private fluxMax = 0;
  private complexMax = 0;

  constructor(options: SuperFluxComplexOptions) {
    super(options);
    const d = SUPER_FLUX_COMPLEX_DEFAULTS;
    const cfg = {
      complexDiffFrames: options.complexDiffFrames ?? d.complexDiffFrames,
      normSeconds: options.normSeconds ?? d.normSeconds,
      fluxFloor: options.fluxFloor ?? d.fluxFloor,
      complexFloor: options.complexFloor ?? d.complexFloor,
    };
    if (!(cfg.complexDiffFrames >= 1 && Number.isInteger(cfg.complexDiffFrames))) {
      throw new Error("complexDiffFrames must be an integer ≥ 1");
    }
    if (!(cfg.normSeconds > 0)) throw new Error("normSeconds must be > 0");
    if (!(cfg.fluxFloor > 0 && cfg.complexFloor > 0)) throw new Error("floors must be > 0");
    this.complexConfig = cfg;
    const { frameSize, hopSize, sampleRate } = this.config;
    this.decay = Math.exp(-hopSize / (sampleRate * cfg.normSeconds));
    this.cdScale = 4 / frameSize;
    const slots = 2 * cfg.complexDiffFrames + 1;
    const bins = frameSize / 2;
    this.specRe = Array.from({ length: slots }, () => new Float32Array(bins));
    this.specIm = Array.from({ length: slots }, () => new Float32Array(bins));
    this.specMag = Array.from({ length: slots }, () => new Float32Array(bins));
  }

  override reset(): void {
    super.reset();
    this.frames = 0;
    for (const ring of [this.specRe, this.specIm, this.specMag]) for (const v of ring) v.fill(0);
    this.fluxMax = 0;
    this.complexMax = 0;
  }

  protected override computeFrame(): number {
    const sf = super.computeFrame();
    const { real, imag, magnitude } = this;
    const mu = this.complexConfig.complexDiffFrames;
    const slots = this.specRe.length;
    const n = this.frames++;
    const s = n % slots;
    const re = this.specRe[s];
    const im = this.specIm[s];
    const mag = this.specMag[s];
    const bins = re.length;
    for (let k = 0; k < bins; k++) {
      re[k] = real[k];
      im[k] = imag[k];
      mag[k] = magnitude[k];
    }

    // Frames before the first one count as silence (zero spectra), so the
    // first value already holds the background level and the peak picker,
    // whose average starts with it, does not take the start for an attack.
    const p = (((n - mu) % slots) + slots) % slots;
    const q = (((n - 2 * mu) % slots) + slots) % slots;
    let cd = 0;
    const pRe = this.specRe[p];
    const pIm = this.specIm[p];
    const pMag = this.specMag[p];
    const qRe = this.specRe[q];
    const qIm = this.specIm[q];
    const qMag = this.specMag[q];
    for (let k = 1; k < bins; k++) {
      if (mag[k] <= pMag[k]) continue;
      const norm = pMag[k] * qMag[k];
      // Without a phase history, predict the previous frame unchanged.
      let tRe = pRe[k];
      let tIm = pIm[k];
      if (norm > 0) {
        // X[n−μ]² · conj(X[n−2μ]) / (|X[n−μ]|·|X[n−2μ]|): magnitude |X[n−μ]|,
        // phase 2φ[n−μ] − φ[n−2μ].
        const sqRe = pRe[k] * pRe[k] - pIm[k] * pIm[k];
        const sqIm = 2 * pRe[k] * pIm[k];
        tRe = (sqRe * qRe[k] + sqIm * qIm[k]) / norm;
        tIm = (sqIm * qRe[k] - sqRe * qIm[k]) / norm;
      }
      const dr = re[k] - tRe;
      const di = im[k] - tIm;
      cd += Math.sqrt(dr * dr + di * di);
    }
    cd *= this.cdScale;

    const { fluxFloor, complexFloor } = this.complexConfig;
    this.fluxMax = Math.max(sf, this.fluxMax * this.decay, fluxFloor);
    this.complexMax = Math.max(cd, this.complexMax * this.decay, complexFloor);
    return sf / this.fluxMax + cd / this.complexMax;
  }
}
