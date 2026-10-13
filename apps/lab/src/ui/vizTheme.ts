/**
 * Canvas code cannot use var(): it reads the --viz-* tokens at draw time
 * through getComputedStyle. Those tokens hold literal colours for that
 * reason (see styles/tokens.css). The defaults below mirror the dark theme
 * so drawing still works where no stylesheet is loaded (tests).
 */

import { useEffect, useState } from "react";

export interface PlotPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface VizTheme {
  bed: string;
  grid: string;
  gridStrong: string;
  axis: string;
  axisLabel: string;
  signal: string;
  signalStrong: string;
  signalFill: string;
  trace2: string;
  noiseFloor: string;
  threshold: string;
  marker: string;
  peak: string;
  danger: string;
  modeMajor: string;
  modeMinor: string;
  emptyText: string;
  fontMono: string;
  fontUi: string;
  /** Tick label size in CSS px. */
  tickPx: number;
  pad: PlotPadding;
}

export const DEFAULT_VIZ_THEME: VizTheme = {
  bed: "#090c0b",
  grid: "#1e2522",
  gridStrong: "#344039",
  axis: "#717a73",
  axisLabel: "#a8a297",
  signal: "#7fd3b8",
  signalStrong: "#a9ead3",
  signalFill: "rgba(127, 211, 184, 0.14)",
  trace2: "#bfa8e8",
  noiseFloor: "#8a9189",
  threshold: "#e8a75c",
  marker: "rgba(127, 211, 184, 0.28)",
  peak: "#e4e0d6",
  danger: "#f08e80",
  modeMajor: "#e8a75c",
  modeMinor: "#bfa8e8",
  emptyText: "#a8a297",
  fontMono: '"IBM Plex Mono", ui-monospace, Consolas, monospace',
  fontUi: '"IBM Plex Sans", system-ui, sans-serif',
  tickPx: 11,
  pad: { top: 10, right: 12, bottom: 28, left: 44 },
};

const COLOR_TOKENS: ReadonlyArray<[keyof VizTheme, string]> = [
  ["bed", "--viz-bed"],
  ["grid", "--viz-grid"],
  ["gridStrong", "--viz-grid-strong"],
  ["axis", "--viz-axis"],
  ["axisLabel", "--viz-axis-label"],
  ["signal", "--viz-signal"],
  ["signalStrong", "--viz-signal-strong"],
  ["signalFill", "--viz-signal-fill"],
  ["trace2", "--viz-trace-2"],
  ["noiseFloor", "--viz-noise-floor"],
  ["threshold", "--viz-threshold"],
  ["marker", "--viz-marker"],
  ["peak", "--viz-peak"],
  ["danger", "--viz-danger"],
  ["modeMajor", "--viz-mode-major"],
  ["modeMinor", "--viz-mode-minor"],
  ["emptyText", "--viz-empty-text"],
  ["fontMono", "--font-mono"],
  ["fontUi", "--font-ui"],
];

/**
 * Read the current data-viz tokens from `el` (the root element by default).
 * A token that is missing or empty keeps its default, so the result is
 * always complete.
 */
export function readVizTheme(el: Element = document.documentElement): VizTheme {
  const cs = getComputedStyle(el);
  const read = (name: string): string => cs.getPropertyValue(name).trim();
  const num = (name: string, fallback: number): number => {
    const n = Number(read(name));
    return Number.isFinite(n) && read(name) !== "" ? n : fallback;
  };
  const theme: VizTheme = { ...DEFAULT_VIZ_THEME, pad: { ...DEFAULT_VIZ_THEME.pad } };
  for (const [key, token] of COLOR_TOKENS) {
    const value = read(token);
    if (value) (theme as unknown as Record<string, string>)[key] = value;
  }
  theme.tickPx = num("--plot-font-size", DEFAULT_VIZ_THEME.tickPx);
  theme.pad = {
    top: num("--plot-pad-top", DEFAULT_VIZ_THEME.pad.top),
    right: num("--plot-pad-right", DEFAULT_VIZ_THEME.pad.right),
    bottom: num("--plot-pad-bottom", DEFAULT_VIZ_THEME.pad.bottom),
    left: num("--plot-pad-left", DEFAULT_VIZ_THEME.pad.left),
  };
  return theme;
}

function sameTheme(a: VizTheme, b: VizTheme): boolean {
  for (const key of Object.keys(a) as (keyof VizTheme)[]) {
    if (key === "pad") continue;
    if (a[key] !== b[key]) return false;
  }
  return (
    a.pad.top === b.pad.top &&
    a.pad.right === b.pad.right &&
    a.pad.bottom === b.pad.bottom &&
    a.pad.left === b.pad.left
  );
}

/** Canvas font string for tick labels. */
export function tickFont(theme: VizTheme): string {
  return `500 ${theme.tickPx}px ${theme.fontMono}`;
}

/**
 * The current viz theme, re-read when `<html data-theme>` changes or the
 * OS colour-scheme preference flips. Draw effects depend on the returned
 * object, so a theme change redraws every plot.
 */
export function useVizTheme(): VizTheme {
  const [theme, setTheme] = useState<VizTheme>(() => readVizTheme());

  useEffect(() => {
    // Keep the previous object when nothing changed so draw effects do not re-run.
    const refresh = () =>
      setTheme((prev) => {
        const next = readVizTheme();
        return sameTheme(prev, next) ? prev : next;
      });
    refresh();

    const observer =
      typeof MutationObserver === "function"
        ? new MutationObserver((mutations) => {
            if (mutations.some((m) => m.attributeName === "data-theme")) refresh();
          })
        : null;
    observer?.observe(document.documentElement, { attributes: true });

    // OS colour-scheme flips and the phone breakpoint (plot geometry tokens).
    const queries =
      typeof window.matchMedia === "function"
        ? ["(prefers-color-scheme: light)", "(max-width: 479px)"].map((q) => window.matchMedia(q))
        : [];
    for (const media of queries) media.addEventListener?.("change", refresh);

    return () => {
      observer?.disconnect();
      for (const media of queries) media.removeEventListener?.("change", refresh);
    };
  }, []);

  return theme;
}
