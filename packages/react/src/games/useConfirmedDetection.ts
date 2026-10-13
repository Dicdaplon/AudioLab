"use client";

/**
 * Debounces a noisy, per-frame detector into discrete "confirmed" events.
 *
 * A label is confirmed once it has been the top-1 candidate for `required`
 * consecutive detection frames with a probability of at least `minProbability`.
 * After a confirmation the counter starts over, so holding a note or chord
 * needs a fresh run of frames before it fires again.
 */

import { useCallback, useEffect, useRef, useState } from "react";

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

export interface UseConfirmedDetectionArgs<T> extends ConfirmationOptions {
  /**
   * Any value whose identity changes exactly once per detection frame (for
   * example the chord ranking array). Re-renders that keep the same frame do
   * not count as new frames.
   */
  frame: unknown;
  /** Current top-1 label, or `null` when there is no usable candidate. */
  label: T | null;
  /** Probability (or energy) of `label` for this frame. */
  probability: number;
  /** Called once per confirmation, from an effect. */
  onConfirm: (label: T) => void;
}

export interface UseConfirmedDetectionResult<T> extends ConfirmationState<T> {
  /** Clears the current run, e.g. when the target changes. */
  reset: () => void;
}

/**
 * React wrapper around {@link stepConfirmation}.
 *
 * Counting is keyed on `frame` identity, so StrictMode's double effect runs
 * and unrelated re-renders cannot count the same frame twice. A `null` label
 * (or a probability below the threshold) resets the run immediately, even
 * without a new frame.
 */
export function useConfirmedDetection<T>({
  frame,
  label,
  probability,
  required,
  minProbability,
  onConfirm,
}: UseConfirmedDetectionArgs<T>): UseConfirmedDetectionResult<T> {
  const [state, setState] = useState<ConfirmationState<T>>(EMPTY_CONFIRMATION);
  const stateRef = useRef<ConfirmationState<T>>(EMPTY_CONFIRMATION);
  const lastFrameRef = useRef<unknown>(undefined);
  const onConfirmRef = useRef(onConfirm);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  const commit = useCallback((next: ConfirmationState<T>) => {
    if (next.label === stateRef.current.label && next.count === stateRef.current.count) return;
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    const qualifies = label !== null && probability >= minProbability;
    if (qualifies && frame === lastFrameRef.current) return;
    lastFrameRef.current = frame;

    const step = stepConfirmation(stateRef.current, label, probability, {
      required,
      minProbability,
    });
    commit(step.state);
    if (step.confirmed !== null) onConfirmRef.current(step.confirmed);
  }, [frame, label, probability, required, minProbability, commit]);

  const reset = useCallback(() => commit(EMPTY_CONFIRMATION), [commit]);

  return { label: state.label, count: state.count, reset };
}
