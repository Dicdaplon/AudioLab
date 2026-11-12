"use client";

/**
 * Harmonic aurora: twelve curtains of light hanging from the top edge, one
 * per pitch class, in circle-of-fifths order and centred on the song's
 * tonic. The tonic hangs in the middle with its dominant and subdominant
 * beside it and the tritone split across both edges, so a song's harmony
 * draws a roughly symmetric aurora around its key. Each curtain's length
 * is the 8 s chroma (slow shape); the 1 s chord chroma and recent attacks
 * ripple its hem. A one-cell fringe in the tonic's colour follows the hems:
 * it signs the key.
 *
 * Rendered as raw cells (ImageData) and posterised into four alpha steps,
 * with a coarse 4×4 Bayer dither at each step: big flat cells that stream
 * encoders keep intact, where a smooth dark gradient would band.
 */

import { useRef, type RefObject } from "react";

import { fifthsIndex } from "@audiolab/core";

import { approach, clamp01, peakOf } from "../draw";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface HarmonicAuroraProps {
  signals: RefObject<StageSignals | null>;
  /** CSS size (the spec: 1920×300 across the top). */
  width: number;
  height: number;
  /** Cell size in CSS px. Default 8. */
  cell?: number;
  theme?: StageTheme;
}

/** Alpha of the four steps, from the top of a curtain down to its hem. */
const POSTER = [0.55 * 255, 0.38 * 255, 0.22 * 255, 0.1 * 255];
const FRINGE_ALPHA = 0.7 * 255;
/** 4×4 Bayer thresholds in (0, 1). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

interface AuroraState {
  img: ImageData | null;
  /** Bright pitch colours as RGB, for the theme in use. */
  rgb: Uint8Array;
  rgbTheme: StageTheme | null;
  /** Curtain slot of the tonic, eased around the circle on modulations. */
  offset: number;
  /** Smoothed curtain lengths (0…1) and hem ripple (0…1), per pitch class. */
  length: Float32Array;
  ripple: Float32Array;
  /** Hem row per column (cells). */
  hems: Int16Array;
  /** 0…1, follows the signal level. */
  master: number;
}

function wrap12(x: number): number {
  return ((x % 12) + 12) % 12;
}

export function HarmonicAurora({
  signals,
  width,
  height,
  cell = 8,
  theme = STAGE_THEME,
}: HarmonicAuroraProps) {
  const state = useRef<AuroraState>({
    img: null,
    rgb: new Uint8Array(36),
    rgbTheme: null,
    offset: 0,
    length: new Float32Array(12),
    ripple: new Float32Array(12),
    hems: new Int16Array(0),
    master: 0,
  });

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    const W = f.width;
    const H = f.height;
    if (!st.img || st.img.width !== W || st.img.height !== H) {
      st.img = ctx.createImageData(W, H);
      st.hems = new Int16Array(W);
    }
    if (st.rgbTheme !== theme) {
      st.rgbTheme = theme;
      theme.pitchBright.forEach((hex, pc) => {
        const n = parseInt(hex.slice(1, 7), 16);
        st.rgb[pc * 3] = (n >> 16) & 255;
        st.rgb[pc * 3 + 1] = (n >> 8) & 255;
        st.rgb[pc * 3 + 2] = n & 255;
      });
    }

    // Rotate the curtains (shortest way round) so the tonic hangs in the middle.
    const tonic = s.key.key?.tonic ?? 0;
    const target = fifthsIndex(tonic);
    let delta = wrap12(target - st.offset);
    if (delta > 6) delta -= 12;
    st.offset = wrap12(st.offset + delta * approach(f.dt, 0.7));

    const live = s.chroma.live;
    const chord = s.chroma.chord;
    const livePeak = peakOf(live) || 1;
    const chordPeak = peakOf(chord) || 1;
    for (let pc = 0; pc < 12; pc++) {
      st.length[pc] += (live[pc] / livePeak - st.length[pc]) * approach(f.dt, 0.6);
      st.ripple[pc] += (chord[pc] / chordPeak - st.ripple[pc]) * approach(f.dt, 0.3);
    }
    const lastOnset = s.onsets.length ? s.onsets[s.onsets.length - 1].time : -Infinity;
    // Attack recency: 1 on the attack, gone after ~1 s.
    const swell = Math.exp(-Math.max(0, f.now - lastOnset) / 0.35);

    // Fade the whole sky with the level (−100 dB is digital silence, music ≈ −85…−70).
    st.master += (clamp01((s.levelDb + 97) / 12) - st.master) * approach(f.dt, 0.4);

    const t = f.now;
    const data = st.img.data;
    const rgb = st.rgb;
    const key = s.key.key;
    data.fill(0);
    const hems = st.hems;
    for (let x = 0; x < W; x++) {
      // Fifths position of this column: the strip's middle is the tonic's centre.
      const q = wrap12(((x + 0.5) / W) * 12 - 6 + 0.5 + st.offset);
      const k = Math.floor(q);
      const pc = (k * 7) % 12;
      // Taper each curtain's sides so neighbours read as separate folds.
      const side = 2 * (q - k) - 1;
      const taper = 1 - 0.35 * side * side * side * side;
      const fold = 0.5 + 0.5 * Math.sin(x * 0.35 + t * 0.6 + pc);
      const h =
        st.master *
        (st.length[pc] * 0.72 * H * taper +
          0.16 * H * st.ripple[pc] * fold +
          3 * swell * Math.sin(t * 2.1 + x * 0.2));
      const hem = h < 1 ? 0 : Math.min(H - 1, Math.floor(h));
      hems[x] = hem;
      const r = rgb[pc * 3];
      const g = rgb[pc * 3 + 1];
      const b = rgb[pc * 3 + 2];
      for (let y = 0; y < hem; y++) {
        // Four flat steps top → hem, dithered in the second half of each step.
        const band = (y / hem) * 4;
        let i = Math.floor(band);
        const frac = band - i;
        if (frac > 0.5 && (frac - 0.5) * 2 > BAYER[((y & 3) << 2) | (x & 3)]) i += 1;
        if (i > 3) continue;
        const p = (y * W + x) * 4;
        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
        data[p + 3] = POSTER[i];
      }
    }
    // Fringe under the hems, stepping down the sides where a neighbour hangs lower.
    if (key) {
      const fr = rgb[key.tonic * 3];
      const fg = rgb[key.tonic * 3 + 1];
      const fb = rgb[key.tonic * 3 + 2];
      for (let x = 0; x < W; x++) {
        const hem = hems[x];
        const left = x > 0 ? hems[x - 1] - 1 : 0;
        const right = x < W - 1 ? hems[x + 1] - 1 : 0;
        const hi = Math.min(H - 1, Math.max(hem, left, right));
        if (hem === 0 && hi <= 0) continue;
        for (let y = hem; y <= hi; y++) {
          const p = (y * W + x) * 4;
          data[p] = fr;
          data[p + 1] = fg;
          data[p + 2] = fb;
          data[p + 3] = FRINGE_ALPHA;
        }
      }
    }
    ctx.putImageData(st.img, 0, 0);
  };

  return <StageCanvas width={width} height={height} pixel={cell} draw={draw} />;
}
