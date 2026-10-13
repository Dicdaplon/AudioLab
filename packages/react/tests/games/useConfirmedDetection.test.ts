// @vitest-environment jsdom
import { StrictMode, createElement, type ReactNode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  useConfirmedDetection,
  type UseConfirmedDetectionArgs,
} from "../../src/games/useConfirmedDetection";

const OPTS = { required: 3, minProbability: 0.2 };

describe("useConfirmedDetection", () => {
  afterEach(cleanup);

  type Props = UseConfirmedDetectionArgs<string>;

  function setup(
    initial: Partial<Props> = {},
    wrapper?: (p: { children: ReactNode }) => ReactNode,
  ) {
    const onConfirm = vi.fn<(label: string) => void>();
    const initialProps: Props = {
      frame: {},
      label: null,
      probability: 0,
      onConfirm,
      ...OPTS,
      ...initial,
    };
    const hook = renderHook((props: Props) => useConfirmedDetection(props), {
      initialProps,
      wrapper,
    });
    let props = initialProps;
    const frame = (label: string | null, probability = 0.5) => {
      props = { ...props, frame: {}, label, probability };
      hook.rerender(props);
    };
    const rerenderSameFrame = (patch: Partial<Props> = {}) => {
      props = { ...props, ...patch };
      hook.rerender(props);
    };
    return { hook, onConfirm, frame, rerenderSameFrame };
  }

  it("exposes the running count and fires onConfirm once", () => {
    const { hook, onConfirm, frame } = setup();
    frame("Am");
    frame("Am");
    expect(hook.result.current).toMatchObject({ label: "Am", count: 2 });
    expect(onConfirm).not.toHaveBeenCalled();

    frame("Am");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("Am");
    expect(hook.result.current).toMatchObject({ label: null, count: 0 });
  });

  it("does not count a re-render that keeps the same frame", () => {
    const { hook, frame, rerenderSameFrame } = setup();
    frame("Am");
    rerenderSameFrame();
    rerenderSameFrame({ onConfirm: vi.fn() });
    expect(hook.result.current.count).toBe(1);
  });

  it("resets immediately when the label disappears, even without a new frame", () => {
    const { hook, frame, rerenderSameFrame } = setup();
    frame("Am");
    frame("Am");
    rerenderSameFrame({ label: null });
    expect(hook.result.current.count).toBe(0);
    // Re-qualifying on the same frame must not count that frame again.
    rerenderSameFrame({ label: "Am" });
    expect(hook.result.current.count).toBe(0);
  });

  it("ignores frames below the probability threshold", () => {
    const { hook, onConfirm, frame } = setup();
    frame("Am", 0.1);
    frame("Am", 0.1);
    frame("Am", 0.1);
    expect(hook.result.current.count).toBe(0);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("reset() clears the current run", () => {
    const { hook, onConfirm, frame } = setup();
    frame("Am");
    frame("Am");
    act(() => hook.result.current.reset());
    expect(hook.result.current.count).toBe(0);
    frame("Am");
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls the latest onConfirm callback", () => {
    const { onConfirm, frame, rerenderSameFrame } = setup();
    const latest = vi.fn();
    frame("Em");
    frame("Em");
    rerenderSameFrame({ onConfirm: latest });
    frame("Em");
    expect(onConfirm).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith("Em");
  });

  it("counts each frame once under StrictMode", () => {
    const strict = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children);
    const { hook, onConfirm, frame } = setup({ label: "C", probability: 0.5 }, strict);
    expect(hook.result.current.count).toBe(1);
    frame("C");
    expect(hook.result.current.count).toBe(2);
    frame("C");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
