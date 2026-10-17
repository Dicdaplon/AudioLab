/**
 * Fan-out of the live onset analysis to the exercise on screen: onsets as
 * they are decided, and after every captured batch the time up to which
 * onsets are known (to advance a scorer and resolve pending labels).
 */

import { useEffect, useRef } from "react";
import type { StreamHistory, TimedOnset } from "@audiolab/core";

export interface OnsetHandlers {
  onOnset?: (onset: TimedOnset, history: StreamHistory) => void;
  /** `analysedTime`: AudioContext seconds up to which every onset is known. */
  onBatch?: (history: StreamHistory, analysedTime: number) => void;
}

export interface OnsetBus {
  emitOnset(onset: TimedOnset, history: StreamHistory): void;
  emitBatch(history: StreamHistory, analysedTime: number): void;
  subscribe(handlers: OnsetHandlers): () => void;
}

export function createOnsetBus(): OnsetBus {
  const subscribers = new Set<OnsetHandlers>();
  return {
    emitOnset(onset, history) {
      for (const s of subscribers) s.onOnset?.(onset, history);
    },
    emitBatch(history, analysedTime) {
      for (const s of subscribers) s.onBatch?.(history, analysedTime);
    },
    subscribe(handlers) {
      subscribers.add(handlers);
      return () => subscribers.delete(handlers);
    },
  };
}

/** Subscribe for the lifetime of the component; the latest handlers are always called. */
export function useOnsetBus(bus: OnsetBus, handlers: OnsetHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(
    () =>
      bus.subscribe({
        onOnset: (o, h) => ref.current.onOnset?.(o, h),
        onBatch: (h, t) => ref.current.onBatch?.(h, t),
      }),
    [bus],
  );
}
