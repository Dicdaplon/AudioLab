"use client";

/**
 * React wrapper around `stepConfirmation` from `@audiolab/core/games`:
 * turns a noisy per-frame detector into discrete "confirmed" events.
 *
 * Counting is keyed on `frame` identity, so StrictMode's double effect runs
 * and unrelated re-renders cannot count the same frame twice. A `null`
 * label (or a probability below the threshold) resets the run immediately,
 * even without a new frame.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type ConfirmationOptions,
  type ConfirmationState,
  EMPTY_CONFIRMATION,
  stepConfirmation,
} from "@audiolab/core/games";

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
