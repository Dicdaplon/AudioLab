// @vitest-environment jsdom
import { StrictMode, createElement, type ReactNode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_CONFIRMATION,
  stepConfirmation,
  useConfirmedDetection,
  type ConfirmationState,
  type UseConfirmedDetectionArgs,
} from "../../src/features/games/useConfirmedDetection";

const OPTS = { required: 3, minProbability: 0.2 };

describe("stepConfirmation", () => {
  function feed(labels: (string | null)[], probability = 0.5) {
    let state: ConfirmationState<string> = EMPTY_CONFIRMATION;
    const confirmed: string[] = [];
    for (const label of labels) {
      const step = stepConfirmation(state, label, probability, OPTS);
      state = step.state;
      if (step.confirmed !== null) confirmed.push(step.confirmed);
    }
    return { state, confirmed };
  }

  it("counts consecutive frames of the same label", () => {
    expect(feed(["C", "C"]).state).toEqual({ label: "C", count: 2 });
  });

  it("confirms after the required number of frames and starts over", () => {
    const { state, confirmed } = feed(["C", "C", "C"]);
    expect(confirmed).toEqual(["C"]);
    expect(state).toEqual(EMPTY_CONFIRMATION);
  });

  it("needs a fresh run to confirm the same label again", () => {
    expect(feed(["C", "C", "C", "C", "C"]).confirmed).toEqual(["C"]);
    expect(feed(["C", "C", "C", "C", "C", "C"]).confirmed).toEqual(["C", "C"]);
  });

  it("restarts the run when the label changes", () => {
    const { state, confirmed } = feed(["C", "C", "G", "C", "C"]);
    expect(confirmed).toEqual([]);
    expect(state).toEqual({ label: "C", count: 2 });
  });

  it("resets on a null label", () => {
    expect(feed(["C", "C", null, "C"]).state).toEqual({ label: "C", count: 1 });
  });

  it("treats a probability below the threshold as no candidate", () => {
    const step = stepConfirmation({ label: "C", count: 2 }, "C", 0.19, OPTS);
    expect(step).toEqual({ state: EMPTY_CONFIRMATION, confirmed: null });
  });

  it("accepts a probability equal to the threshold", () => {
    const step = stepConfirmation({ label: "C", count: 2 }, "C", 0.2, OPTS);
    expect(step.confirmed).toBe("C");
  });
});

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
