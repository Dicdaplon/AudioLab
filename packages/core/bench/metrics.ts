/**
 * Metrics of the benchmark, after the MIREX / mir_eval conventions.
 */

/**
 * Onsets: maximum one-to-one matching of detected and reference times
 * within ±`window` seconds. On a line with a symmetric window, a greedy
 * two-pointer over the sorted lists reaches the maximum matching, as
 * mir_eval's bipartite matching does. Returns the matched pairs.
 */
export function matchOnsets(
  reference: readonly number[],
  estimated: readonly number[],
  window = 0.05,
): [number, number][] {
  const ref = [...reference].sort((a, b) => a - b);
  const est = [...estimated].sort((a, b) => a - b);
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < ref.length && j < est.length) {
    const d = est[j] - ref[i];
    if (Math.abs(d) <= window) {
      pairs.push([ref[i], est[j]]);
      i++;
      j++;
    } else if (d < 0) j++;
    else i++;
  }
  return pairs;
}

export interface OnsetScore {
  f: number;
  precision: number;
  recall: number;
  /** detected − reference of the matched pairs, in seconds. */
  errors: number[];
}

/** F-measure, precision and recall of one item (mir_eval `onset.f_measure`). */
export function onsetScore(
  reference: readonly number[],
  estimated: readonly number[],
  window = 0.05,
): OnsetScore {
  const pairs = matchOnsets(reference, estimated, window);
  const precision = estimated.length ? pairs.length / estimated.length : reference.length ? 0 : 1;
  const recall = reference.length ? pairs.length / reference.length : 1;
  const f = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { f, precision, recall, errors: pairs.map(([r, e]) => e - r) };
}

/** Tempo: within 4 % of the reference (Gouyon et al. 2006, Accuracy 1). */
export function tempoAcc1(bpm: number, reference: number): boolean {
  return Math.abs(bpm - reference) <= 0.04 * reference;
}

/** Within 4 % of the reference or of ×2, ×½, ×3, ×⅓ (Accuracy 2: octave errors forgiven). */
export function tempoAcc2(bpm: number, reference: number): boolean {
  return [1, 2, 0.5, 3, 1 / 3].some((k) => tempoAcc1(bpm, reference * k));
}

/** An octave error: right at ×2 or ×½ but not at ×1. */
export function tempoOctaveError(bpm: number, reference: number): boolean {
  return (
    !tempoAcc1(bpm, reference) && (tempoAcc1(bpm, 2 * reference) || tempoAcc1(bpm, reference / 2))
  );
}

export interface KeyRef {
  tonic: number;
  mode: "maj" | "min";
}

/** Same tonic and mode. */
export function keyStrict(k: KeyRef, ref: KeyRef): boolean {
  return k.tonic === ref.tonic && k.mode === ref.mode;
}

/** The relative key: C major ↔ A minor. */
export function relativeOf(k: KeyRef): KeyRef {
  return k.mode === "maj"
    ? { tonic: (k.tonic + 9) % 12, mode: "min" }
    : { tonic: (k.tonic + 3) % 12, mode: "maj" };
}

/** Same key or its relative (same key signature: C = Am). */
export function keyMerged(k: KeyRef, ref: KeyRef): boolean {
  return keyStrict(k, ref) || keyStrict(k, relativeOf(ref));
}

/** MIREX weighted key score: 1 same, 0.5 a fifth (same mode), 0.3 relative, 0.2 parallel. */
export function keyMirex(k: KeyRef, ref: KeyRef): number {
  if (keyStrict(k, ref)) return 1;
  if (
    k.mode === ref.mode &&
    (k.tonic === (ref.tonic + 7) % 12 || k.tonic === (ref.tonic + 5) % 12)
  ) {
    return 0.5;
  }
  if (keyStrict(k, relativeOf(ref))) return 0.3;
  if (k.tonic === ref.tonic) return 0.2;
  return 0;
}
