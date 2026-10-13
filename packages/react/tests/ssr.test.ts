/**
 * Server-rendering smoke test, in plain Node (no jsdom): importing the
 * package and rendering its components must never touch window, document
 * or localStorage, which is what a Next.js App Router page does at build
 * time before hydration.
 */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { DEFAULT_DETECTOR_SETTINGS, emptyTonalityFrame } from "@audiolab/core";
import * as sdk from "../src/index";

describe("server rendering", () => {
  it("has no window or document at module scope", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    expect(Object.keys(sdk).length).toBeGreaterThan(20);
  });

  it("renders the detector, the plots and the games to a string", () => {
    const frame = emptyTonalityFrame();
    const html = renderToString(
      createElement(
        sdk.LoupeRoot,
        null,
        createElement(sdk.DetectorTab, {
          data: frame,
          settings: DEFAULT_DETECTOR_SETTINGS,
          onSettingsChange: () => {},
          colourByPitch: false,
          onColourByPitchChange: () => {},
        }),
        createElement(sdk.SpectrumPlot, {
          spectrumDb: new Float32Array(0),
          binHz: 0,
          noiseFloorDb: -100,
        }),
        createElement(sdk.ChordGame, { chords: [], running: false }),
        createElement(sdk.WolfJumper, {
          instantaneousChroma: frame.instantaneousChroma,
          chords: [],
          running: false,
          signalLevelDb: -100,
        }),
        createElement(sdk.ThemeToggle),
      ),
    );
    expect(html.startsWith('<div class="loupe">')).toBe(true);
    expect(html).toContain("Estimated key");
    expect(html).toContain("<canvas");
    expect(html).toContain("Start the microphone");
  });
});
