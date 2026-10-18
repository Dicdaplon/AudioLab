import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { SpectrumPlot } from "../../src/components/SpectrumPlot";
import { TimeSignalPlot } from "../../src/components/TimeSignalPlot";
import { LoupeRoot } from "../../src/LoupeRoot";
import {
  cellOf,
  crisp,
  drawPixelTrace,
  drawStepped,
  plotFrame,
  prepareCanvas,
  stepColumns,
} from "../../src/ui/canvasPlot";
import { drawLane } from "../../src/ui/laneDraw";
import { DEFAULT_VIZ_THEME, readVizTheme, tickFont } from "../../src/ui/vizTheme";
import { installCanvasStub, type CanvasRecorder } from "../helpers/canvasStub";

describe("pixel mode tokens", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--al-viz-pixel");
    document.documentElement.style.removeProperty("--al-plot-font");
  });

  it("is off by default: pixel 0, no plot font, the plain tick font", () => {
    const theme = readVizTheme(document.documentElement);
    expect(theme.pixel).toBe(0);
    expect(theme.plotFont).toBeUndefined();
    expect(cellOf(theme)).toBe(1);
    expect(tickFont(theme)).toBe(`500 11px ${DEFAULT_VIZ_THEME.fontMono}`);
  });

  it("reads the cell size and the plot font when the tokens are set", () => {
    document.documentElement.style.setProperty("--al-viz-pixel", "2");
    document.documentElement.style.setProperty("--al-plot-font", '"Silkscreen"');
    const theme = readVizTheme(document.documentElement);
    expect(theme.pixel).toBe(2);
    expect(cellOf(theme)).toBe(2);
    expect(theme.plotFont).toBe('"Silkscreen"');
    expect(tickFont(theme)).toBe(`400 11px "Silkscreen", ${DEFAULT_VIZ_THEME.fontMono}`);
  });

  it("treats 0 and 1 as off", () => {
    for (const v of ["0", "1"]) {
      document.documentElement.style.setProperty("--al-viz-pixel", v);
      expect(cellOf(readVizTheme(document.documentElement))).toBe(1);
    }
  });
});

describe("prepareCanvas", () => {
  let dpr: number;
  beforeEach(() => {
    dpr = window.devicePixelRatio;
    installCanvasStub(600);
  });
  afterEach(() => {
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: dpr });
  });

  it("keeps the plain sizing when pixel mode is off", () => {
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
    const canvas = document.createElement("canvas");
    prepareCanvas(canvas, 301, 150);
    expect(canvas.width).toBe(602);
    expect(canvas.height).toBe(300);
    expect(canvas.style.width).toBe("301px");
    expect(canvas.style.imageRendering ?? "").toBe("");
    // The default argument is the off path.
    prepareCanvas(canvas, 301, 150, 1);
    expect(canvas.width).toBe(602);
  });

  it("holds one backing pixel per cell, rounded up, at the same CSS size", () => {
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
    const canvas = document.createElement("canvas");
    prepareCanvas(canvas, 301, 150, 2);
    // 2 CSS px × dpr 2 = 4 device px per cell; 301 / 2 → 151 cells.
    expect(canvas.width).toBe(151);
    expect(canvas.height).toBe(75);
    expect(canvas.style.width).toBe("301px");
    expect(canvas.style.height).toBe("150px");
    expect(canvas.style.imageRendering).toBe("pixelated");
    // Back to the plain mode: smooth scaling again.
    prepareCanvas(canvas, 301, 150);
    expect(canvas.style.imageRendering ?? "").toBe("");
  });

  it("rounds a cell to whole device pixels on fractional ratios", () => {
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 1.25 });
    const canvas = document.createElement("canvas");
    prepareCanvas(canvas, 300, 100, 2);
    // round(2 × 1.25) = 3 device px → 2.4 CSS px per cell.
    expect(canvas.width).toBe(Math.ceil(300 / 2.4));
  });
});

describe("pixel helpers", () => {
  it("crisp is unchanged at c = 1 and lands on a cell centre otherwise", () => {
    expect(crisp(10.4)).toBe(10.5);
    expect(crisp(10.6)).toBe(11.5);
    expect(crisp(10.4, 1)).toBe(10.5);
    expect(crisp(10.4, 2)).toBe(11);
    expect(crisp(13, 4)).toBe(14);
  });

  it("reduces a curve to columns that keep its peaks, and draws them as cells", () => {
    const canvas = installCanvasStub(600);
    try {
      const ctx = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
      const frame = plotFrame(200, 100, {
        ...DEFAULT_VIZ_THEME,
        pad: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      // 400 samples over 200 px, a spike at sample 101 (x = 50.5).
      const ys = Array.from({ length: 400 }, (_, i) => (i === 101 ? 10 : 90));
      const cols = stepColumns(
        ys.length,
        (i) => i / 2,
        (i) => ys[i],
        frame,
        2,
      );
      expect(cols.length).toBeGreaterThan(30);
      expect(Math.min(...cols.map((col) => col.y))).toBe(10);
      for (const col of cols) expect(col.x % 2).toBe(0);

      drawStepped(ctx, frame, cols, 2, { body: "#000", cap: "#fff", segment: 2 });
      const rects = canvas.of("fillRect");
      expect(rects.length).toBeGreaterThan(cols.length);
      // Every rect sits on the cell grid.
      for (const r of rects) {
        expect((r.args[0] as number) % 2).toBe(0);
        expect((r.args[1] as number) % 2).toBe(0);
      }

      canvas.calls.length = 0;
      drawPixelTrace(ctx, frame, (x) => x / 2, "#fff", 2);
      const trace = canvas.of("fillRect");
      expect(trace.length).toBeGreaterThan(90);
      for (const r of trace) expect(r.args[2]).toBe(2);
    } finally {
      canvas.restore();
    }
  });
});

describe("plots in pixel mode", () => {
  let canvas: CanvasRecorder;
  beforeEach(() => {
    canvas = installCanvasStub(600);
  });
  afterEach(() => {
    cleanup();
    canvas.restore();
  });

  /** Calls of the last draw (after its prepareCanvas scale): the first render
   *  draws with the defaults, before the effect has read the tokens. */
  const lastDraw = (method: string) => {
    const start = canvas.calls.map((c) => c.method).lastIndexOf("scale");
    return canvas.calls.slice(start).filter((c) => c.method === method);
  };

  it("draws the spectrum as fillRect columns instead of a traced path", () => {
    const spectrum = new Float32Array(2048).map((_, k) => -80 + 40 * Math.sin(k / 30));
    const { container } = render(
      <LoupeRoot style={{ ["--al-viz-pixel" as string]: "2" }}>
        <SpectrumPlot spectrumDb={spectrum} binHz={2} noiseFloorDb={-70} maxFreqHz={2000} />
      </LoupeRoot>,
    );
    expect(container.querySelector("canvas")?.style.imageRendering).toBe("pixelated");
    // Bed + columns (body blocks and caps).
    expect(lastDraw("scale")[0].args).toEqual([0.5, 0.5]);
    expect(lastDraw("fillRect").length).toBeGreaterThan(100);
    // No path with one point per bin: only the grid, axes and floor.
    expect(lastDraw("lineTo").length).toBeLessThan(40);
  });

  it("draws the plain spectrum as a path when the token is absent", () => {
    const spectrum = new Float32Array(2048).map((_, k) => -80 + 40 * Math.sin(k / 30));
    render(
      <LoupeRoot>
        <SpectrumPlot spectrumDb={spectrum} binHz={2} noiseFloorDb={-70} maxFreqHz={2000} />
      </LoupeRoot>,
    );
    expect(canvas.of("fillRect")).toHaveLength(1); // the bed only
    expect(canvas.of("lineTo").length).toBeGreaterThan(1000);
  });

  it("draws a time signal as runs of cells", () => {
    const signal = new Float32Array(4000).map((_, i) => Math.sin(i / 20));
    render(
      <LoupeRoot style={{ ["--al-viz-pixel" as string]: "2" }}>
        <TimeSignalPlot signal={signal} sampleRate={1000} />
      </LoupeRoot>,
    );
    const rects = lastDraw("fillRect");
    expect(rects.length).toBeGreaterThan(200);
    for (const r of rects.slice(1)) expect(r.args[2]).toBe(2);
  });
});

describe("play-along lane in pixel mode", () => {
  const scene = {
    now: 10,
    tolerance: null,
    targets: [{ time: 10.2, label: "Am", state: "pending" as const }],
    onsets: [{ time: 9.9 }],
  };

  it("draws targets and onsets as pixel discs, and keeps the label's case", () => {
    const canvas = installCanvasStub(600);
    try {
      const ctx = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
      drawLane(ctx, 400, 120, scene, { ...DEFAULT_VIZ_THEME, pixel: 2 });
      expect(canvas.of("arc")).toHaveLength(0);
      expect(canvas.of("fillRect").length).toBeGreaterThan(20);
      expect(canvas.of("fillText").map((c) => c.args[0])).toEqual(["Am"]);
    } finally {
      canvas.restore();
    }
  });

  it("draws round targets when pixel mode is off", () => {
    const canvas = installCanvasStub(600);
    try {
      const ctx = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;
      drawLane(ctx, 400, 120, scene, DEFAULT_VIZ_THEME);
      expect(canvas.of("arc")).toHaveLength(2);
      expect(canvas.of("fillRect")).toHaveLength(1); // the bed
    } finally {
      canvas.restore();
    }
  });
});
