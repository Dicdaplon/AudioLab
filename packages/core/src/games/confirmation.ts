/**
 * Debounces a noisy, per-frame detector into discrete "confirmed" events.
 *
 * A label is confirmed once it has been the top-1 candidate for `required`
 * consecutive detection frames with a probability of at least
 * `minProbability`. After a confirmation the counter starts over, so
 * holding a note or chord needs a fresh run of frames before it fires
 * again. Labels are compared with `===`: use primitives (a pitch class, a
 * chord key), not objects.
 */

export interface ConfirmationOptions {
  /** Consecutive frames needed to confirm a label. */
  required: number;
  /** Frames whose probability is below this value break the run. */
  minProbability: number;
}

export interface ConfirmationState<T> {
  /** Label currently being counted, or `null` when nothing qualifies. */
  label: T | null;
  /** Number of consecutive frames `label` has been seen. */
  count: number;
}

export interface ConfirmationStep<T> {
  state: ConfirmationState<T>;
  /** The label confirmed by this frame, or `null`. */
  confirmed: T | null;
}

export const EMPTY_CONFIRMATION: ConfirmationState<never> = { label: null, count: 0 };

/** Pure transition: feeds one detection frame into the confirmation counter. */
export function stepConfirmation<T>(
  state: ConfirmationState<T>,
  label: T | null,
  probability: number,
  { required, minProbability }: ConfirmationOptions,
): ConfirmationStep<T> {
  if (label === null || probability < minProbability) {
    return { state: EMPTY_CONFIRMATION, confirmed: null };
  }
  const count = label === state.label ? state.count + 1 : 1;
  if (count >= required) {
    return { state: EMPTY_CONFIRMATION, confirmed: label };
  }
  return { state: { label, count }, confirmed: null };
}
