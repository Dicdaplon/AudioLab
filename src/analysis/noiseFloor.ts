/**
 * Noise floor estimation: summarise a dB spectrum with a robust statistic
 * so the FFT view can draw a reference line for the background level.
 */

/** Supported noise floor estimation methods. */
export type NoiseFloorMethod = "median" | "mean" | "p80";

export const NOISE_FLOOR_METHODS: readonly NoiseFloorMethod[] = ["median", "mean", "p80"];

export function isNoiseFloorMethod(value: string): value is NoiseFloorMethod {
  return (NOISE_FLOOR_METHODS as readonly string[]).includes(value);
}

export interface NoiseFloorResult {
  /** Estimated noise floor in dB. */
  noiseFloorDb: number;
  /** Method used. */
  method: NoiseFloorMethod;
}

export interface NoiseFloorOptions {
  /** First bin (inclusive) of the band to analyse. Default 0. */
  fromBin?: number;
  /** Last bin (exclusive) of the band to analyse. Default spectrum length. */
  toBin?: number;
}

/** Value returned when no finite bin is available (digital silence). */
export const NOISE_FLOOR_SILENCE_DB = -100;

/**
 * Estimate the noise floor of a dB spectrum.
 *
 * Non-finite bins (`-Infinity` for zero magnitude, NaN) are discarded
 * before any statistic is computed, so silent bins never drag the estimate
 * down. If no finite bin remains, `NOISE_FLOOR_SILENCE_DB` is returned.
 *
 * - **median**: robust to peaks; the level of the typical bin.
 * - **mean**: arithmetic mean in dB; pulled up by strong peaks.
 * - **p80**: 80th percentile; always ≥ the median, sits closer to the
 *   upper edge of the noise band and therefore masks more of the noise.
 *
 * @param spectrumDb dB-scale magnitude spectrum.
 * @param method Statistic to use (default "median").
 * @param options Optional bin range so the estimate matches a displayed band.
 */
export function estimateNoiseFloor(
  spectrumDb: ArrayLike<number>,
  method: NoiseFloorMethod = "median",
  options: NoiseFloorOptions = {},
): NoiseFloorResult {
  const from = Math.max(0, Math.floor(options.fromBin ?? 0));
  const to = Math.min(spectrumDb.length, Math.ceil(options.toBin ?? spectrumDb.length));

  // Compact the finite values into a typed array (numeric sort, no boxing).
  const finite = new Float32Array(Math.max(0, to - from));
  let count = 0;
  for (let k = from; k < to; k++) {
    const v = spectrumDb[k];
    if (Number.isFinite(v)) finite[count++] = v;
  }
  if (count === 0) return { noiseFloorDb: NOISE_FLOOR_SILENCE_DB, method };

  const values = finite.subarray(0, count);
  let noiseFloorDb: number;
  switch (method) {
    case "mean": {
      let sum = 0;
      for (let i = 0; i < count; i++) sum += values[i];
      noiseFloorDb = sum / count;
      break;
    }
    case "p80": {
      values.sort();
      noiseFloorDb = values[Math.floor(0.8 * (count - 1))];
      break;
    }
    case "median":
    default: {
      values.sort();
      const mid = count >> 1;
      noiseFloorDb = count % 2 === 0 ? (values[mid - 1] + values[mid]) * 0.5 : values[mid];
      break;
    }
  }

  return { noiseFloorDb, method };
}
