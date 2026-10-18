"use client";

/**
 * Canvas code cannot use var(): it reads the --al-viz-* tokens at draw time
 * through getComputedStyle on the Loupe root element. Those tokens hold
 * literal colours for that reason (see styles/tokens.css). The defaults
 * below mirror the dark theme so drawing still works where no stylesheet
 * is loaded (tests) and during server rendering.
 */

import { useEffect, useState } from "react";

import { useLoupeRoot } from "../LoupeRoot";

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
  /** Detected onsets on a play-along lane. */
  onset: string;
  /** A verdict that went well (on time). */
  good: string;
  modeMajor: string;
  modeMinor: string;
  emptyText: string;
  fontMono: string;
  fontUi: string;
  /** Tick label size in CSS px. */
  tickPx: number;
  pad: PlotPadding;
  /**
   * Pixel-art cell size in CSS px, from the optional `--al-viz-pixel` token.
   * 0 (the default), 1 or unset: plots draw as usual. 2 or more: each plot
   * draws on a grid of square cells of that size, scaled up without
   * smoothing (stepped columns, pixel traces, block text).
   */
  pixel?: number;
  /**
   * Canvas font family for tick and empty-state text, from the optional
   * `--al-plot-font` token. Unset: the mono (`fontMono`).
   */
  plotFont?: string;
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
  onset: "#ff5c5c",
  good: "#74c88f",
  modeMajor: "#e8a75c",
  modeMinor: "#bfa8e8",
  emptyText: "#a8a297",
  fontMono: '"IBM Plex Mono", ui-monospace, Consolas, monospace',
  fontUi: '"IBM Plex Sans", system-ui, sans-serif',
  tickPx: 11,
  pad: { top: 10, right: 12, bottom: 28, left: 44 },
  pixel: 0,
};

const COLOR_TOKENS: ReadonlyArray<[keyof VizTheme, string]> = [
  ["bed", "--al-viz-bed"],
  ["grid", "--al-viz-grid"],
  ["gridStrong", "--al-viz-grid-strong"],
  ["axis", "--al-viz-axis"],
  ["axisLabel", "--al-viz-axis-label"],
  ["signal", "--al-viz-signal"],
  ["signalStrong", "--al-viz-signal-strong"],
  ["signalFill", "--al-viz-signal-fill"],
  ["trace2", "--al-viz-trace-2"],
  ["noiseFloor", "--al-viz-noise-floor"],
  ["threshold", "--al-viz-threshold"],
  ["marker", "--al-viz-marker"],
  ["peak", "--al-viz-peak"],
  ["danger", "--al-viz-danger"],
  ["onset", "--al-viz-onset"],
  ["good", "--al-viz-good"],
  ["modeMajor", "--al-viz-mode-major"],
  ["modeMinor", "--al-viz-mode-minor"],
  ["emptyText", "--al-viz-empty-text"],
  ["fontMono", "--al-font-mono"],
  ["fontUi", "--al-font-ui"],
];

/**
 * Read the current data-viz tokens from `el` (the document root by
 * default). A token that is missing or empty keeps its default, so the
 * result is always complete.
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
  theme.tickPx = num("--al-plot-font-size", DEFAULT_VIZ_THEME.tickPx);
  // Optional opt-ins (see tokens.css): no token, no change.
  const pixel = num("--al-viz-pixel", 0);
  theme.pixel = pixel > 1 ? pixel : 0;
  const plotFont = read("--al-plot-font");
  if (plotFont) theme.plotFont = plotFont;
  theme.pad = {
    top: num("--al-plot-pad-top", DEFAULT_VIZ_THEME.pad.top),
    right: num("--al-plot-pad-right", DEFAULT_VIZ_THEME.pad.right),
    bottom: num("--al-plot-pad-bottom", DEFAULT_VIZ_THEME.pad.bottom),
    left: num("--al-plot-pad-left", DEFAULT_VIZ_THEME.pad.left),
  };
  return theme;
}

function sameTheme(a: VizTheme, b: VizTheme): boolean {
  for (const key of Object.keys(a) as (keyof VizTheme)[]) {
    if (key === "pad") continue;
    if (a[key] !== b[key]) return false;
  }
  return (
    (a.pixel ?? 0) === (b.pixel ?? 0) &&
    a.plotFont === b.plotFont &&
    a.pad.top === b.pad.top &&
    a.pad.right === b.pad.right &&
    a.pad.bottom === b.pad.bottom &&
    a.pad.left === b.pad.left
  );
}

/** Canvas font string for tick labels. */
export function tickFont(theme: VizTheme): string {
  // A pixel face has one weight: asking for 500 would not change it, but
  // keep the plain string byte-identical when no plot font is set.
  if (theme.plotFont) return `400 ${theme.tickPx}px ${theme.plotFont}, ${theme.fontMono}`;
  return `500 ${theme.tickPx}px ${theme.fontMono}`;
}

/**
 * The current viz theme of the nearest `<LoupeRoot>` (or of the document
 * root when there is none), re-read when `<html data-theme>` changes or the
 * OS colour-scheme preference flips. Draw effects depend on the returned
 * object, so a theme change redraws every plot. Server rendering gets the
 * defaults: nothing is read before the component is mounted.
 */
export function useVizTheme(): VizTheme {
  const root = useLoupeRoot();
  const [theme, setTheme] = useState<VizTheme>(DEFAULT_VIZ_THEME);

  useEffect(() => {
    // Keep the previous object when nothing changed so draw effects do not re-run.
    const refresh = () =>
      setTheme((prev) => {
        const next = readVizTheme(root?.current ?? document.documentElement);
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

    // A plot font (--al-plot-font) is often a web font that arrives after the
    // first draw: hand the plots a fresh object once fonts load so they redraw
    // with it. Without a plot font the theme object is kept (no redraw).
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    const onFonts = () => setTheme((prev) => (prev.plotFont ? { ...prev } : prev));
    fonts?.addEventListener?.("loadingdone", onFonts);

    return () => {
      observer?.disconnect();
      for (const media of queries) media.removeEventListener?.("change", refresh);
      fonts?.removeEventListener?.("loadingdone", onFonts);
    };
  }, [root]);

  return theme;
}
