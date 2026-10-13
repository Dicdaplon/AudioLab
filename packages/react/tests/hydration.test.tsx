/**
 * Hydration smoke test: the markup produced on the server must be exactly
 * what the client renders first, otherwise React discards it (error #418
 * / #423 in a Next.js page). Anything that depends on the browser (random
 * draws, media queries, stored theme) has to wait for an effect.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { createElement, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  DEFAULT_DETECTOR_SETTINGS,
  DEFAULT_FFT_SETTINGS,
  emptyTonalityFrame,
} from "@audiolab/core";
import {
  ChordGame,
  DetectorTab,
  FftTab,
  LoupeRoot,
  MicTransport,
  ThemeToggle,
  WolfJumper,
} from "../src/index";
import { installCanvasStub } from "./helpers/canvasStub";

function page(): ReactElement {
  const frame = emptyTonalityFrame();
  return createElement(
    LoupeRoot,
    null,
    createElement(MicTransport, {
      state: "idle",
      onStart: () => {},
      onStop: () => {},
      onReset: () => {},
    }),
    createElement(ThemeToggle),
    createElement(DetectorTab, {
      data: frame,
      settings: DEFAULT_DETECTOR_SETTINGS,
      onSettingsChange: () => {},
      colourByPitch: false,
      onColourByPitchChange: () => {},
    }),
    createElement(FftTab, {
      mic: null,
      spectrum: {
        spectrumDb: new Float32Array(0),
        binHz: 0,
        noiseFloorDb: -100,
        noiseMethod: "median",
      },
      settings: DEFAULT_FFT_SETTINGS,
      onSettingsChange: () => {},
    }),
    createElement(ChordGame, { chords: [], running: false }),
    createElement(WolfJumper, {
      instantaneousChroma: frame.instantaneousChroma,
      chords: [],
      running: false,
      signalLevelDb: -100,
    }),
  );
}

describe("hydration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hydrates the server markup of every view without a mismatch", async () => {
    const canvas = installCanvasStub(600);
    const html = renderToString(page());
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const recoverable: string[] = [];
    const consoleErrors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      consoleErrors.push(args.map(String).join(" "));
    });

    let root: ReturnType<typeof hydrateRoot> | null = null;
    await act(async () => {
      root = hydrateRoot(container, page(), {
        onRecoverableError: (err) => recoverable.push(String(err)),
      });
    });

    expect(recoverable).toEqual([]);
    expect(consoleErrors.filter((m) => /hydrat|did not match/i.test(m))).toEqual([]);

    await act(async () => root?.unmount());
    container.remove();
    canvas.restore();
  });
});
