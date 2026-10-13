/**
 * Minimal external store for the game state.
 *
 * The simulation ticks at display refresh rate. Keeping its state outside
 * React lets each component subscribe to just the slice it renders, so only
 * the scene re-renders every frame while the HUD updates when its numbers
 * change.
 */

import { useCallback, useRef, useSyncExternalStore } from "react";

export interface ReadableStore<S> {
  getState(): S;
  subscribe(listener: () => void): () => void;
}

export interface Store<S, A> extends ReadableStore<S> {
  dispatch(action: A): void;
}

export function createStore<S, A>(reducer: (state: S, action: A) => S, initial: S): Store<S, A> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = reducer(state, action);
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Shallow equality for flat objects of primitives. */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  const keys = Object.keys(a) as (keyof T)[];
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => Object.is(a[k], b[k]));
}

/**
 * Subscribes to `selector(store.getState())`. The component re-renders only
 * when the selected value changes according to `isEqual`.
 */
export function useStoreSelector<S, R>(
  store: ReadableStore<S>,
  selector: (state: S) => R,
  isEqual: (a: R, b: R) => boolean = Object.is,
): R {
  const cache = useRef<{ state: S; selector: (state: S) => R; value: R } | null>(null);

  const getSnapshot = useCallback((): R => {
    const state = store.getState();
    const cached = cache.current;
    if (cached && cached.state === state && cached.selector === selector) return cached.value;
    const value = selector(state);
    const stable = cached && isEqual(cached.value, value) ? cached.value : value;
    cache.current = { state, selector, value: stable };
    return stable;
  }, [store, selector, isEqual]);

  return useSyncExternalStore(store.subscribe, getSnapshot);
}
