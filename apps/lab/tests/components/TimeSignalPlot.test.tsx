import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { TimeSignalPlot } from "../../src/components/TimeSignalPlot";
import { EMPTY_TEXT } from "../../src/ui/canvasPlot";
import { installCanvasStub, type CanvasRecorder } from "../helpers/canvasStub";

describe("TimeSignalPlot", () => {
  let canvas: CanvasRecorder;

  beforeEach(() => {
    canvas = installCanvasStub(600);
  });

  afterEach(() => {
    cleanup();
    canvas.restore();
  });

  it("draws the waiting state for an empty signal", () => {
    render(<TimeSignalPlot signal={new Float32Array(0)} sampleRate={100} />);
    const texts = canvas.of("fillText").map((c) => c.args[0]);
    expect(texts).toContain(EMPTY_TEXT);
    expect(canvas.of("stroke")).toHaveLength(0);
  });

  it("renders an all-zero signal without hanging (regression: zero amplitude range)", () => {
    render(<TimeSignalPlot signal={new Float32Array(100)} sampleRate={100} title="Silence" />);
    // The title is DOM, the axis titles too.
    expect(screen.getByRole("img", { name: "Silence" })).toBeTruthy();
    expect(screen.getByText("Time (s)")).toBeTruthy();
    const labels = canvas.of("fillText").map((c) => String(c.args[0]));
    expect(labels).not.toContain("Silence");
    // Five finite amplitude ticks were drawn.
    const ticks = labels.filter((l) => /^-?\d\.\d\d$/.test(l));
    expect(ticks.length).toBeGreaterThanOrEqual(5);
    expect(ticks.every((t) => Number.isFinite(Number(t)))).toBe(true);
    // The trace is a bounded path: never more points than 2 × plot width.
    expect(canvas.of("lineTo").length).toBeLessThan(2 * 600);
  }, 2000);

  it("bounds the number of drawn points by the plot width, not the signal length", () => {
    const long = new Float32Array(400_000).map((_, i) => Math.sin(i / 50));
    render(<TimeSignalPlot signal={long} sampleRate={48000} />);
    // Axis lines + grid + at most 2 points per pixel column.
    expect(canvas.of("lineTo").length).toBeLessThan(2 * 600 + 40);
  });

  it("uses a zero-based axis for a non-negative envelope", () => {
    render(<TimeSignalPlot signal={new Float32Array([0, 0.5, 1])} sampleRate={10} />);
    const labels = canvas.of("fillText").map((c) => String(c.args[0]));
    expect(labels).toContain("0.00");
    expect(labels).toContain("1.00");
    expect(labels).not.toContain("-1.00");
  });
});
