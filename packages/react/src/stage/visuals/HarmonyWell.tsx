"use client";

/**
 * Harmony well: a map of what each chord *does* in the key. The tonic chord
 * sits at the bottom of a well, in the centre; the other degrees are
 * stations on three orbits, by function, the further out the more tension:
 *
 * - inner orbit, TONIC (rest): vi and iii, the tonic's stand-ins;
 * - middle orbit, SUBDOMINANT (leaving home): IV and ii, on the left, the
 *   flat side of the circle of fifths;
 * - outer orbit, DOMINANT (tension, wants to come home): V and vii°, on the
 *   right, the sharp side.
 *
 * The current chord is a marker that glides from station to station on
 * every change, leaving a dotted trail of the last few chords, so a learner
 * watches a progression as a journey: Am → Dm → E7 → Am goes home, left,
 * far right, and falls back into the well. Landing on the tonic sends a
 * small ring out of the centre (resolution). A chord outside the key stops
 * just beyond its station, dashed, its numeral in the "borrowed" colour.
 * Majors are octagons and minors diamonds, as everywhere on the stage.
 */

import { useRef, type RefObject } from "react";

import { chordDegree, scaleDegree, type ChordQuality, type KeyMode } from "@audiolab/core";

import { easeOut, lerp, outlinedText, polygonPath } from "../draw";
import { chordName, isMinorQuality, type Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface HarmonyWellProps {
  signals: RefObject<StageSignals | null>;
  /** Side of the square, in CSS px. */
  size: number;
  /** Cell size of the shapes. Default 4. */
  pixel?: number;
  notation?: Notation;
  theme?: StageTheme;
}

type Fn = 0 | 1 | 2; // tonic, subdominant, dominant

/** Orbit radii (fraction of R) per function; the tonic itself is the centre. */
const ORBIT = [0.36, 0.67, 0.97] as const;
const PIT = 0.17;

/** Per scale degree (0 = I … 6 = VII): function and angle (0 = up, clockwise). */
const STATIONS: readonly { fn: Fn; angle: number }[] = [
  { fn: 0, angle: 0 }, // I: the centre
  { fn: 1, angle: -Math.PI / 4 }, // ii
  { fn: 0, angle: (3 * Math.PI) / 4 }, // iii
  { fn: 1, angle: -Math.PI / 2 }, // IV
  { fn: 2, angle: Math.PI / 2 }, // V
  { fn: 0, angle: (-3 * Math.PI) / 4 }, // vi
  { fn: 2, angle: Math.PI / 4 }, // vii°
];

const DEGREE_NAMES: Readonly<Record<KeyMode, readonly string[]>> = {
  maj: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  min: ["i", "ii°", "III", "iv", "V", "VI", "VII"],
};
const DEGREE_MINOR: Readonly<Record<KeyMode, readonly boolean[]>> = {
  maj: [false, true, true, false, false, true, true],
  min: [true, true, false, true, false, false, false],
};

/** Degree index (0–6) of each root interval, by mode. */
const DEGREE_OF: Readonly<Record<KeyMode, readonly number[]>> = {
  maj: Array.from({ length: 12 }, (_, i) => chordDegree(i, "maj", 0, "maj").degree - 1),
  min: Array.from({ length: 12 }, (_, i) => chordDegree(i, "maj", 0, "min").degree - 1),
};

const LABELS: Readonly<Record<Notation, readonly string[]>> = {
  fr: ["TONIQUE", "SOUS-DOMINANTE", "DOMINANTE"],
  en: ["TONIC", "SUBDOMINANT", "DOMINANT"],
};

const GLIDE = 0.45;
const LANDING = 0.6;
const TRAIL = 5;

interface WellState {
  /** Marker position (fractions of R from the centre) and its glide. */
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  t0: number;
  root: number;
  quality: ChordQuality;
  numeral: string;
  diatonic: boolean;
  has: boolean;
  /** Chord and key the marker was placed for (re-placed on any change); tonic −1 = none. */
  placedRoot: number;
  placedQuality: ChordQuality | null;
  placedTonic: number;
  placedMode: KeyMode | null;
  landedAt: number;
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** Station of a chord root in a key, as fractions of R; chromatic roots sit 0.16 R further out. */
function stationOf(
  root: number,
  tonic: number,
  mode: KeyMode,
  out: { x: number; y: number },
): void {
  const interval = mod12(root - tonic);
  const d = DEGREE_OF[mode][interval];
  if (d === 0 && interval === 0) {
    out.x = 0;
    out.y = 0;
    return;
  }
  const st = STATIONS[d];
  const r =
    (d === 0 ? ORBIT[0] : ORBIT[st.fn]) + (scaleDegree(root, tonic, mode) === null ? 0.16 : 0);
  const a = d === 0 ? Math.PI : st.angle;
  out.x = r * Math.sin(a);
  out.y = -r * Math.cos(a);
}

function functionOf(root: number, tonic: number, mode: KeyMode): Fn {
  return STATIONS[DEGREE_OF[mode][mod12(root - tonic)]].fn;
}

const FN_COLOUR = (theme: StageTheme): readonly string[] => [theme.good, theme.warn, theme.bad];

export function HarmonyWell({
  signals,
  size,
  pixel = 4,
  notation = "en",
  theme = STAGE_THEME,
}: HarmonyWellProps) {
  const state = useRef<WellState>({
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    t0: 0,
    root: 0,
    quality: "maj",
    numeral: "",
    diatonic: true,
    has: false,
    placedRoot: -1,
    placedQuality: null,
    placedTonic: -1,
    placedMode: null,
    landedAt: -1,
  });
  const scratch = useRef({ x: 0, y: 0 });

  /** Marker position now (fractions of R). */
  const markerAt = (now: number, out: { x: number; y: number }) => {
    const st = state.current;
    const e = easeOut((now - st.t0) / GLIDE);
    out.x = lerp(st.fromX, st.toX, e);
    out.y = lerp(st.fromY, st.toY, e);
  };

  const update = (s: StageSignals, now: number) => {
    const st = state.current;
    const key = s.key.key;
    const c = s.chord.current;
    if (!key || !c) {
      st.has = false;
      st.placedTonic = -1;
      return;
    }
    if (
      st.placedTonic === key.tonic &&
      st.placedMode === key.mode &&
      st.placedRoot === c.root &&
      st.placedQuality === c.quality
    ) {
      return;
    }
    const p = scratch.current;
    if (st.has) {
      markerAt(now, p);
      st.fromX = p.x;
      st.fromY = p.y;
    }
    stationOf(c.root, key.tonic, key.mode, p);
    if (!st.has) {
      st.fromX = p.x;
      st.fromY = p.y;
    }
    st.toX = p.x;
    st.toY = p.y;
    st.t0 = now;
    st.has = true;
    st.placedRoot = c.root;
    st.placedQuality = c.quality;
    st.placedTonic = key.tonic;
    st.placedMode = key.mode;
    st.root = c.root;
    st.quality = c.quality;
    const degree = chordDegree(c.root, c.quality, key.tonic, key.mode);
    st.numeral = degree.numeral;
    st.diatonic = degree.diatonic;
    if (c.root === key.tonic) st.landedAt = now + GLIDE * 0.6;
  };

  const drawShapes = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    update(s, f.now);
    const cx = f.width / 2;
    const cy = f.height / 2;
    const R = (Math.min(f.width, f.height) / 2) * 0.8;
    const cell = 4 / f.pixel; // one 4 px stroke, in buffer units
    const key = s.key.key;
    const fnColour = FN_COLOUR(theme);
    const activeFn = key && st.has ? functionOf(st.root, key.tonic, key.mode) : -1;
    ctx.lineJoin = "miter";

    // Orbits: the active function's ring is lit.
    for (let fn = 0; fn < 3; fn++) {
      polygonPath(ctx, cx, cy, ORBIT[fn] * R, 8);
      ctx.lineWidth = Math.max(1, Math.round(cell));
      ctx.strokeStyle = withAlpha(fnColour[fn], !key ? 0.15 : fn === activeFn ? 0.8 : 0.3);
      ctx.stroke();
    }

    // The well: the tonic's pit.
    polygonPath(ctx, cx, cy, PIT * R, 8);
    ctx.fillStyle = key ? theme.pitchDark[key.tonic] : theme.shade;
    ctx.fill();
    ctx.lineWidth = Math.max(1, Math.round(cell));
    ctx.strokeStyle = key ? theme.pitchBright[key.tonic] : theme.shadeLine;
    ctx.stroke();
    if (!key) return;

    // Stations.
    const names = DEGREE_MINOR[key.mode];
    for (let d = 1; d < 7; d++) {
      const stn = STATIONS[d];
      const r = ORBIT[stn.fn] * R;
      const x = cx + r * Math.sin(stn.angle);
      const y = cy - r * Math.cos(stn.angle);
      const minor = names[d];
      polygonPath(
        ctx,
        x,
        y,
        R * (minor ? 0.1 : 0.085),
        minor ? 4 : 8,
        minor ? -Math.PI / 2 : Math.PI / 8,
      );
      ctx.fillStyle = theme.night;
      ctx.fill();
      ctx.strokeStyle = withAlpha(fnColour[stn.fn], 0.7);
      ctx.stroke();
    }

    // Trail of the last chords, oldest faintest, as dashes between stations.
    const hist = s.chord.history;
    const p = scratch.current;
    ctx.setLineDash([Math.round(2 * cell), Math.round(2 * cell)]);
    ctx.lineWidth = Math.max(1, Math.round(cell));
    const first = Math.max(0, hist.length - 1 - TRAIL);
    for (let i = first; i < hist.length - 1; i++) {
      stationOf(hist[i].chord.root, key.tonic, key.mode, p);
      const x0 = cx + p.x * R;
      const y0 = cy + p.y * R;
      if (i + 1 === hist.length - 1) markerAt(f.now, p);
      else stationOf(hist[i + 1].chord.root, key.tonic, key.mode, p);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(cx + p.x * R, cy + p.y * R);
      ctx.strokeStyle = withAlpha(theme.ink, 0.15 + (0.5 * (i - first + 1)) / TRAIL);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Resolution: a ring out of the pit when the marker lands home.
    const lu = (f.now - st.landedAt) / LANDING;
    if (st.landedAt >= 0 && lu >= 0 && lu < 1) {
      polygonPath(ctx, cx, cy, lerp(PIT, ORBIT[0] * 1.15, easeOut(lu)) * R, 8);
      ctx.lineWidth = Math.max(1, Math.round(2 * cell));
      ctx.strokeStyle = withAlpha(theme.good, Math.round(0.6 * (1 - lu) * 20) / 20);
      ctx.stroke();
    }

    // The current chord.
    if (st.has) {
      markerAt(f.now, p);
      const x = cx + p.x * R;
      const y = cy + p.y * R;
      const minor = isMinorQuality(st.quality);
      polygonPath(
        ctx,
        x,
        y,
        R * (minor ? 0.17 : 0.14),
        minor ? 4 : 8,
        minor ? -Math.PI / 2 : Math.PI / 8,
      );
      ctx.fillStyle = s.chord.silent ? theme.pitchDark[st.root] : theme.pitch[st.root];
      ctx.fill();
      ctx.lineWidth = Math.max(1, Math.round(cell));
      if (!st.diatonic) ctx.setLineDash([Math.round(2 * cell), Math.round(2 * cell)]);
      ctx.strokeStyle = st.diatonic ? theme.pitchBright[st.root] : theme.bad;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    const cx = f.width / 2;
    const cy = f.height / 2;
    const R = (Math.min(f.width, f.height) / 2) * 0.8;
    const key = s.key.key;
    const fnColour = FN_COLOUR(theme);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Orbit names along the bottom axis (no station there).
    const activeFn = key && st.has ? functionOf(st.root, key.tonic, key.mode) : -1;
    const labels = LABELS[notation];
    ctx.font = `16px ${theme.fonts.label}`;
    for (let fn = 0; fn < 3; fn++) {
      const y = cy + ORBIT[fn] * R * Math.cos(Math.PI / 8) + 14;
      const text = labels[fn];
      const w = ctx.measureText(text).width + 12;
      ctx.fillStyle = theme.night;
      ctx.fillRect(Math.round(cx - w / 2), Math.round(y - 12), Math.round(w), 24);
      ctx.fillStyle = fn === activeFn ? fnColour[fn] : theme.inkFaint;
      ctx.fillText(text, cx, y + 1);
    }
    if (!key) return;

    // Station numerals.
    const heroSmall = Math.max(16, Math.round(size / 24));
    const names = DEGREE_NAMES[key.mode];
    ctx.font = `${heroSmall}px ${theme.fonts.hero}`;
    for (let d = 1; d < 7; d++) {
      const stn = STATIONS[d];
      const r = ORBIT[stn.fn] * R;
      ctx.fillStyle = theme.inkMuted;
      ctx.fillText(names[d], cx + r * Math.sin(stn.angle), cy - r * Math.cos(stn.angle) + 1);
    }

    // The current chord: its name on the marker, its numeral above it.
    if (st.has) {
      const p = scratch.current;
      markerAt(f.now, p);
      const x = cx + p.x * R;
      const y = cy + p.y * R;
      const big = Math.max(20, Math.round(size / 12));
      const name = chordName(st.root, st.quality, notation);
      // Shrink long names ("Sol♯m7") to fit inside the marker.
      ctx.font = `${big}px ${theme.fonts.hero}`;
      const fit = Math.min(
        big,
        Math.floor((big * R * 0.24) / Math.max(1, ctx.measureText(name).width)),
      );
      ctx.font = `${fit}px ${theme.fonts.hero}`;
      ctx.fillStyle = theme.pitchOn;
      ctx.fillText(name, x, y + 2);
      outlinedText(
        ctx,
        st.numeral,
        x,
        y - R * 0.17 - big * 0.45,
        big,
        theme.fonts.hero,
        st.diatonic ? theme.major : theme.bad,
        theme.night,
      );
    } else {
      outlinedText(
        ctx,
        DEGREE_NAMES[key.mode][0],
        cx,
        cy + 2,
        heroSmall,
        theme.fonts.hero,
        theme.inkMuted,
      );
    }
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <StageCanvas width={size} height={size} pixel={pixel} draw={drawShapes} />
      <StageCanvas
        width={size}
        height={size}
        draw={drawLabels}
        style={{ position: "absolute", inset: 0 }}
      />
    </div>
  );
}
