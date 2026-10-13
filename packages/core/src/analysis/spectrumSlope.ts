/**
 * Slope of a dB spectrum along the frequency axis (dB per Hz), using a
 * centred finite difference:
 *
 *     s[k] = (S[k+1] − S[k−1]) / (2·binHz)
 *
 * with one-sided differences at the two ends. Non-finite bins (silence,
 * -Infinity) are clamped to `floorDb` first so the slope stays finite.
 */
export function spectrumSlopeDbPerHz(
  spectrumDb: ArrayLike<number>,
  binHz: number,
  floorDb = -100,
): Float32Array {
  const n = spectrumDb.length;
  const out = new Float32Array(n);
  if (n < 2 || !(binHz > 0)) return out;
  const at = (k: number): number => {
    const v = spectrumDb[k];
    return Number.isFinite(v) && v > floorDb ? v : floorDb;
  };
  for (let k = 1; k < n - 1; k++) {
    out[k] = (at(k + 1) - at(k - 1)) / (2 * binHz);
  }
  out[0] = (at(1) - at(0)) / binHz;
  out[n - 1] = (at(n - 1) - at(n - 2)) / binHz;
  return out;
}
