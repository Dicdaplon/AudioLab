import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

import { DEFAULT_VIZ_THEME, readVizTheme, tickFont, useVizTheme } from "../../src/ui/vizTheme";

function clearTokens(el: HTMLElement) {
  for (const name of [
    "--al-viz-signal",
    "--al-viz-bed",
    "--al-plot-pad-left",
    "--al-plot-font-size",
  ]) {
    el.style.removeProperty(name);
  }
}

describe("readVizTheme", () => {
  afterEach(() => {
    cleanup();
    clearTokens(document.documentElement);
    delete document.documentElement.dataset.theme;
  });

  it("falls back to the dark defaults when no token is defined", () => {
    const theme = readVizTheme(document.documentElement);
    expect(theme).toEqual(DEFAULT_VIZ_THEME);
    expect(tickFont(theme)).toBe(`500 11px ${DEFAULT_VIZ_THEME.fontMono}`);
  });

  it("reads literal colours and plot geometry from the custom properties", () => {
    const root = document.documentElement;
    root.style.setProperty("--al-viz-signal", "#123456");
    root.style.setProperty("--al-viz-bed", " #ffffff ");
    root.style.setProperty("--al-plot-pad-left", "36");
    root.style.setProperty("--al-plot-font-size", "10");
    const theme = readVizTheme(root);
    expect(theme.signal).toBe("#123456");
    expect(theme.bed).toBe("#ffffff");
    expect(theme.pad.left).toBe(36);
    expect(theme.pad.right).toBe(DEFAULT_VIZ_THEME.pad.right);
    expect(theme.tickPx).toBe(10);
    // Tokens that are not set keep their defaults.
    expect(theme.trace2).toBe(DEFAULT_VIZ_THEME.trace2);
  });

  it("re-reads the tokens when the document theme attribute changes", async () => {
    const root = document.documentElement;
    const seen: string[] = [];
    function Probe() {
      const theme = useVizTheme();
      seen.push(theme.signal);
      return null;
    }
    render(<Probe />);
    expect(seen.at(-1)).toBe(DEFAULT_VIZ_THEME.signal);

    root.style.setProperty("--al-viz-signal", "#0f5c4e");
    await act(async () => {
      root.dataset.theme = "light";
      // MutationObserver callbacks run as microtasks.
      await Promise.resolve();
    });
    expect(seen.at(-1)).toBe("#0f5c4e");
  });

  it("ignores attribute changes other than data-theme", async () => {
    const root = document.documentElement;
    const refresh = vi.fn();
    function Probe() {
      const theme = useVizTheme();
      refresh(theme);
      return null;
    }
    render(<Probe />);
    const calls = refresh.mock.calls.length;
    await act(async () => {
      root.setAttribute("lang", "fr");
      await Promise.resolve();
    });
    expect(refresh.mock.calls.length).toBe(calls);
  });
});
