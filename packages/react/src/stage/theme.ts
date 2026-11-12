/**
 * Stage theme: literal colours and fonts for canvas visuals drawn over an
 * unknown background (a webcam, a game, a stream scene).
 *
 * The stage cannot read the Loupe tokens (it renders outside `.loupe`, on a
 * transparent page), so the values are copied here. The pitch-class hues are
 * the `--al-viz-pc-*` tokens, ordered on the circle of fifths (neighbouring
 * keys get neighbouring hues). Two derived ramps are added for streams:
 * `pitchBright` for strokes, glows and coloured text (≥ 8.5:1 on the night
 * plate) and `pitchDark` for tinted plate backgrounds.
 */

export interface StageTheme {
  /** Plate fill (night bed at 78 % alpha) and its 4 px border. */
  plate: string;
  plateBorder: string;
  /** Opaque night, for outlines and pixel shadows. */
  night: string;
  /** Unlit cells, building bodies. */
  shade: string;
  shadeLine: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  major: string;
  minor: string;
  signal: string;
  signalStrong: string;
  good: string;
  warn: string;
  bad: string;
  /** Mid pitch-class fills (the tokens), 0 = C … 11 = B. */
  pitch: readonly string[];
  /** Bright pitch-class strokes and text. */
  pitchBright: readonly string[];
  /** Dark pitch-class plate tints. */
  pitchDark: readonly string[];
  /** Ink on a `pitch` fill. */
  pitchOn: string;
  fonts: {
    /** Hero values: key, chord, note (VT323 in the Loupe pixel skin). */
    hero: string;
    /** Small caps labels (Silkscreen, 8/16/24 px only). */
    label: string;
    /** Measured numbers. */
    mono: string;
    /** Brand. */
    brand: string;
    /** The mode word in the smooth skin. */
    serif: string;
  };
}

export const STAGE_THEME: StageTheme = {
  plate: "rgba(9, 12, 11, 0.78)",
  plateBorder: "#344039",
  night: "#090c0b",
  shade: "#141917",
  shadeLine: "#232a26",
  ink: "#e4e0d6",
  inkMuted: "#a8a297",
  inkFaint: "#717a73",
  major: "#e8a75c",
  minor: "#bfa8e8",
  signal: "#7fd3b8",
  signalStrong: "#a9ead3",
  good: "#74c88f",
  warn: "#e8a75c",
  bad: "#f08e80",
  pitch: [
    "#c24976",
    "#199db0",
    "#b16411",
    "#6783ec",
    "#708502",
    "#c063ba",
    "#158d7d",
    "#dc5f4e",
    "#0b82bf",
    "#ab8702",
    "#8a5fc9",
    "#2aa654",
  ],
  pitchBright: [
    "#dc97b0",
    "#20c7df",
    "#ec973c",
    "#94a7f2",
    "#c9ec13",
    "#d496d0",
    "#21dec5",
    "#e89489",
    "#41b5f0",
    "#ecbe13",
    "#b99fde",
    "#33cc67",
  ],
  pitchDark: [
    "#3d1424",
    "#0c3e45",
    "#452a0c",
    "#0c1845",
    "#3c450c",
    "#3a1738",
    "#0c453e",
    "#44140d",
    "#0c3245",
    "#45390c",
    "#25153d",
    "#104121",
  ],
  pitchOn: "#0d110f",
  fonts: {
    hero: '"VT323", "IBM Plex Mono", monospace',
    label: '"Silkscreen", "VT323", monospace',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
    brand: '"Pixelify Sans", "VT323", sans-serif',
    serif: '"Source Serif 4", Georgia, serif',
  },
};

/** Colour of a key's mode. */
export function modeColour(theme: StageTheme, mode: "maj" | "min"): string {
  return mode === "min" ? theme.minor : theme.major;
}

/** `#rrggbb` → `rgba(r, g, b, a)`. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
