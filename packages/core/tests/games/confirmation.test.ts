import { describe, expect, it } from "vitest";

import {
  EMPTY_CONFIRMATION,
  stepConfirmation,
  type ConfirmationState,
} from "../../src/games/confirmation";

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

  it("works with numeric labels such as pitch classes", () => {
    let state: ConfirmationState<number> = EMPTY_CONFIRMATION;
    const opts = { required: 2, minProbability: 0.1 };
    state = stepConfirmation(state, 7, 0.5, opts).state;
    expect(stepConfirmation(state, 7, 0.5, opts).confirmed).toBe(7);
  });
});
