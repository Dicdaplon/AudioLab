/**
 * Noise floor estimation: analyze a dB spectrum to estimate the background
 * noise level using various statistical methods.
 *
 * Used to mask low-energy bins in the FFT visualization and to gate the
 * tempo analysis (Section 2) to avoid detecting noise fluctuations.
 */

/**
 * Supported noise floor estimation methods.
 */
export type NoiseFloorMethod = "median" | "mean" | "p80";

export interface NoiseFloorResult {
  /** Estimated noise floor in dB. */
  noiseFloorDb: number;
  /** Method used. */
  method: NoiseFloorMethod;
}

/**
 * Compute the median of an array in dB scale.
 * @internal
 */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) * 0.5
    : sorted[mid];
}

/**
 * Compute the mean of an array, skipping non-finite values.
 * @internal
 */
function mean(values: number[]): number {
  let sum = 0;
  let count = 0;
  for (const v of values) {
    if (Number.isFinite(v)) {
      sum += v;
      count++;
    }
  }
  return count > 0 ? sum / count : -Infinity;
}

/**
 * Compute the 80th percentile of an array.
 * @internal
 */
function percentile80(values: number[]): number {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return -Infinity;
  const sorted = finite.sort((a, b) => a - b);
  const idx = Math.floor(0.8 * (sorted.length - 1));
  return sorted[idx];
}

/**
 * Estimate the noise floor of a dB spectrum using the specified method.
 *
 * @param spectrumDb A dB-scale magnitude spectrum (typically from computeFftDb).
 * @param method     "median" (robust), "mean" (average), or "p80" (80th percentile).
 * @returns Object containing the estimated noise floor and method used.
 *
 * **median**: Robust to spikes; represents the typical bin level.
 * **mean**: Average across all bins; influenced by peaks.
 * **p80**: 80th percentile; between median and mean.
 */
export function estimateNoiseFloor(
  spectrumDb: ArrayLike<number>,
  method: NoiseFloorMethod = "median",
): NoiseFloorResult {
  const values = Array.from(spectrumDb);

  let noiseFloorDb: number;
  switch (method) {
    case "mean":
      noiseFloorDb = mean(values);
      break;
    case "p80":
      noiseFloorDb = percentile80(values);
      break;
    case "median":
    default:
      noiseFloorDb = median(values);
      break;
  }

  // Clamp to reasonable range.
  if (!Number.isFinite(noiseFloorDb)) noiseFloorDb = -100;

  return { noiseFloorDb, method };
}
