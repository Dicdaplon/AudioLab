import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createStore,
  shallowEqual,
  useStoreSelector,
} from "../../src/features/games/wolf-jumper/store";

type State = { a: number; b: number };
type Action = { type: "a" } | { type: "b" } | { type: "noop" };

function reducer(s: State, action: Action): State {
  switch (action.type) {
    case "a":
      return { ...s, a: s.a + 1 };
    case "b":
      return { ...s, b: s.b + 1 };
    case "noop":
      return s;
  }
}

const selectA = (s: State) => s.a;
const selectAObject = (s: State) => ({ a: s.a });

describe("createStore", () => {
  it("notifies subscribers only when the state changes", () => {
    const store = createStore(reducer, { a: 0, b: 0 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.dispatch({ type: "noop" });
    expect(listener).not.toHaveBeenCalled();
    store.dispatch({ type: "a" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState()).toEqual({ a: 1, b: 0 });

    unsubscribe();
    store.dispatch({ type: "a" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("shallowEqual", () => {
  it("compares own keys with Object.is", () => {
    const arr: number[] = [];
    expect(shallowEqual({ x: 1, y: arr }, { x: 1, y: arr })).toBe(true);
    expect(shallowEqual({ x: 1, y: arr }, { x: 1, y: [] })).toBe(false);
    expect(shallowEqual<Record<string, number>>({ x: 1 }, { x: 1, y: 2 })).toBe(false);
  });
});

describe("useStoreSelector", () => {
  afterEach(cleanup);

  it("re-renders only when the selected slice changes", () => {
    const store = createStore(reducer, { a: 0, b: 0 });
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useStoreSelector(store, selectA);
    });
    const initialRenders = renders;

    act(() => store.dispatch({ type: "b" }));
    expect(renders).toBe(initialRenders);

    act(() => store.dispatch({ type: "a" }));
    expect(result.current).toBe(1);
    expect(renders).toBe(initialRenders + 1);
  });

  it("keeps object selections stable with an equality function", () => {
    const store = createStore(reducer, { a: 0, b: 0 });
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useStoreSelector(store, selectAObject, shallowEqual);
    });
    const first = result.current;
    const initialRenders = renders;

    act(() => store.dispatch({ type: "b" }));
    expect(result.current).toBe(first);
    expect(renders).toBe(initialRenders);
  });
});
