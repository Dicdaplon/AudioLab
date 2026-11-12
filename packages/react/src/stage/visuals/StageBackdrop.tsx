"use client";

/**
 * Stage backdrop, "Nuit du loup": an opaque, calm night landscape behind
 * the whole page, for a stream where the overlay is the only layer. A sky
 * in five posterised bands (dithered seams, no smooth gradient) tinted by
 * the song key, a few twinkling stars, slow clouds, two hill ridges, and a
 * clean frame around the webcam hole.
 *
 * It answers the music gently, never flashing: the key tints the sky over
 * 4 s; the level raises a glow on the horizon and speeds the clouds up; the
 * beat lifts the far ridge's crest line; a strong attack lights one star in
 * the note's colour. Less than 2 % of the screen reacts at any moment.
 * Silence calms it down; long silence slows the twinkle and sends a
 * shooting star now and then.
 *
 * Drawn on a 1/8 resolution buffer (cells of 8 px, `StageCanvas`); the
 * webcam rectangle is left transparent, so the overlay sits above the
 * webcam source in OBS, and the frame is plain CSS at full resolution.
 */

import { useRef, type CSSProperties, type RefObject } from "react";

import { approach } from "../draw";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface BackdropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StageBackdropProps {
  signals: RefObject<StageSignals | null>;
  width: number;
  height: number;
  /** Webcam rectangle (CSS px): left transparent and framed. */
  cam?: BackdropRect;
  /** Areas (plates) where attack stars must not appear. */
  keepOut?: readonly BackdropRect[];
  /** Song tonic, for the frame's corner colour (the sky reads it from `signals`). */
  tonic?: number | null;
  /** "night" (default): sky, stars, clouds, ridges. "plain": sky and frame only. */
  variant?: "night" | "plain";
  /** Number of stars. Default 28. */
  stars?: number;
  theme?: StageTheme;
}

const CELL = 8;
/** Sky bands, darkest at the top, and how much of the key tint each takes. */
const BANDS = ["#070a09", "#0a0e0d", "#0e1311", "#121916", "#171f1b"];
const TINT_SHARE = [0, 0.08, 0.16, 0.26, 0.36];
const NO_KEY_TINT = "#12201b";
const FAR_RIDGE = "#0e1311";
const NEAR_RIDGE = "#090c0b";
const MAX_ATTACK_STARS = 6;

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: Rgb, b: Rgb, t: number): string {
  const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${c(0)}, ${c(1)}, ${c(2)})`;
}

/** Deterministic hash noise in [0, 1). */
function rand(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function inside(x: number, y: number, r: BackdropRect): boolean {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

interface AttackStar {
  x: number;
  y: number;
  pc: number;
  big: boolean;
  born: number;
}

interface BackdropState {
  tint: Rgb;
  level: number;
  lastOnsets: number;
  peak: number;
  lastAttack: number;
  attacks: AttackStar[];
  quietSince: number | null;
  shootingAt: number;
  shooting: { x: number; y: number; born: number } | null;
  clouds: { x: number; y: number; w: number }[];
}

export function StageBackdrop({
  signals,
  width,
  height,
  cam,
  keepOut = [],
  tonic = null,
  variant = "night",
  stars = 28,
  theme = STAGE_THEME,
}: StageBackdropProps) {
  const state = useRef<BackdropState | null>(null);
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const blocked = [...(cam ? [cam] : []), ...keepOut];
  const free = (cx: number, cy: number) =>
    !blocked.some((r) => inside(cx * CELL + CELL / 2, cy * CELL + CELL / 2, r));

  // Fixed landscape: star positions and ridge heights (in cells), seeded.
  const starCells = useRef<{ x: number; y: number; phase: number }[]>([]);
  if (starCells.current.length !== stars) {
    const list: { x: number; y: number; phase: number }[] = [];
    for (let i = 0; list.length < stars && i < stars * 20; i++) {
      const x = Math.floor(rand(i * 2 + 1) * cols);
      const y = Math.floor(rand(i * 2 + 2) * rows * 0.6);
      if (free(x, y)) list.push({ x, y, phase: rand(i + 99) * 6.28 });
    }
    starCells.current = list;
  }
  const farRidge = (x: number) =>
    Math.round(rows * 0.8 + 3 * Math.sin(x * 0.045 + 1.3) + 2 * Math.sin(x * 0.11 + 0.4));
  const nearRidge = (x: number) =>
    Math.round(rows * 0.9 + 2 * Math.sin(x * 0.07 + 2.1) + 1.5 * Math.sin(x * 0.19));

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    state.current ??= {
      tint: rgb(NO_KEY_TINT),
      level: 0,
      lastOnsets: s?.onsetCount ?? 0,
      peak: 0,
      lastAttack: -1,
      attacks: [],
      quietSince: null,
      shootingAt: f.now + 45,
      shooting: null,
      clouds: [
        { x: cols * 0.15, y: rows * 0.18, w: 22 },
        { x: cols * 0.55, y: rows * 0.3, w: 30 },
        { x: cols * 0.85, y: rows * 0.12, w: 18 },
      ],
    };
    const st = state.current;
    const now = f.now;
    const W = f.width;
    const H = f.height;

    // Key tint: cross-fade towards the tonic's dark tone (4 s), back to neutral slower.
    const key = s?.key.key ?? null;
    const target = rgb(key ? theme.pitchDark[key.tonic] : NO_KEY_TINT);
    const k = approach(f.dt, key ? 1.3 : 2);
    st.tint = [0, 1, 2].map((i) => st.tint[i] + (target[i] - st.tint[i]) * k) as Rgb;

    const playing = !!s && (s.harmonyLevel.open || s.notesLevel.open);
    if (playing) st.quietSince = null;
    else st.quietSince ??= now;
    const quiet = st.quietSince === null ? 0 : now - st.quietSince;
    st.level += ((s?.harmonyLevel.level ?? 0) - st.level) * approach(f.dt, 1.5);

    // Sky: five bands with wobbling seams, dithered over three rows.
    const skyBottom = Math.round(rows * 0.8);
    const seam = (b: number) =>
      Math.round((skyBottom * b) / BANDS.length + Math.sin(now / (31 + b * 9) + b) * 1);
    for (let b = 0; b < BANDS.length; b++) {
      ctx.fillStyle = mix(rgb(BANDS[b]), st.tint, TINT_SHARE[b]);
      const y0 = b === 0 ? 0 : seam(b);
      const y1 = b === BANDS.length - 1 ? H : seam(b + 1);
      ctx.fillRect(0, y0, W, y1 - y0);
      if (b > 0) {
        // Seam: the upper band's colour reaches down in a 2×2 checker, thinning out.
        ctx.fillStyle = mix(rgb(BANDS[b - 1]), st.tint, TINT_SHARE[b - 1]);
        for (let x = 0; x < W; x += 2) {
          ctx.fillRect(x + (y0 % 2), y0, 1, 1);
          if (x % 4 === 0) ctx.fillRect(x, y0 + 1, 1, 1);
        }
      }
    }

    if (variant === "night") {
      // Stars: slow, stepped twinkle (half speed in a long silence).
      const speed = quiet > 10 ? 0.5 : 1;
      for (const star of starCells.current) {
        const v = Math.sin(now * 0.9 * speed + star.phase);
        const alpha = v > 0.6 ? 0.9 : v > -0.2 ? 0.6 : 0.35;
        ctx.fillStyle = withAlpha(theme.inkMuted, alpha);
        ctx.fillRect(star.x, star.y, 1, 1);
      }

      // Attack stars: a strong attack lights a star in the note's colour.
      if (s && s.onsetCount !== st.lastOnsets) {
        const fresh = Math.min(s.onsetCount - st.lastOnsets, s.onsets.length);
        st.lastOnsets = s.onsetCount;
        for (let i = s.onsets.length - fresh; i < s.onsets.length; i++) {
          const o = s.onsets[i];
          st.peak = Math.max(st.peak, o.strength);
          const force = st.peak > 0 ? o.strength / st.peak : 0;
          if (force < 0.55 || quiet > 2 || now - st.lastAttack < 0.12) continue;
          const pick = starCells.current[Math.floor(rand(o.time * 37) * starCells.current.length)];
          if (!pick) continue;
          st.attacks.push({
            x: pick.x,
            y: pick.y,
            pc: o.pitchClass ?? key?.tonic ?? 0,
            big: force > 0.85,
            born: now,
          });
          st.lastAttack = now;
          if (st.attacks.length > MAX_ATTACK_STARS) st.attacks.shift();
        }
      }
      st.peak *= 1 - approach(f.dt, 8);
      st.attacks = st.attacks.filter((a) => now - a.born < 0.42);
      for (const a of st.attacks) {
        const age = now - a.born;
        const alpha = age < 0.12 ? 1 : age < 0.22 ? 0.66 : age < 0.32 ? 0.33 : 0.15;
        ctx.fillStyle = withAlpha(theme.pitchBright[a.pc], alpha);
        ctx.fillRect(a.x, a.y, 1, 1);
        if (a.big) {
          ctx.fillRect(a.x - 1, a.y, 3, 1);
          ctx.fillRect(a.x, a.y - 1, 1, 3);
        }
      }

      // Shooting star in a long silence, every 60 ± 30 s.
      if (quiet > 10 && !st.shooting && now >= st.shootingAt) {
        st.shooting = { x: rand(now) * W * 0.6 + W * 0.2, y: rand(now + 1) * H * 0.3, born: now };
        st.shootingAt = now + 30 + rand(now + 2) * 60;
      }
      if (st.shooting) {
        const age = now - st.shooting.born;
        if (age > 0.9) st.shooting = null;
        else {
          const x = Math.round(st.shooting.x + age * 40);
          const y = Math.round(st.shooting.y + age * 14);
          ctx.fillStyle = withAlpha(theme.ink, 0.8);
          ctx.fillRect(x, y, 1, 1);
          ctx.fillStyle = withAlpha(theme.ink, 0.35);
          ctx.fillRect(x - 3, y - 1, 3, 1);
        }
      }

      // Clouds: soft blocks drifting right, faster with the level.
      const drift = ((4 + 6 * st.level) / CELL) * f.dt;
      ctx.fillStyle = mix(rgb(BANDS[3]), st.tint, 0.3);
      for (const c of st.clouds) {
        c.x += drift;
        if (c.x > W + c.w) c.x = -c.w;
        const x = Math.round(c.x);
        const y = Math.round(c.y);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x, y, c.w, 2);
        ctx.fillRect(x + 3, y - 1, c.w - 8, 1);
        ctx.fillRect(x + 5, y + 2, c.w - 9, 1);
        ctx.globalAlpha = 1;
      }

      // Horizon glow (level), far ridge with a crest line (beat), near ridge.
      const glowRows = Math.round(3 * st.level);
      const beat = s && quiet <= 2 ? s.beatAt(now) : null;
      const pulse = beat ? Math.max(0, 1 - beat.phase / 0.3) : 0;
      const crestAlpha = 0.14 + (beat?.beatInBar === 0 ? 0.2 : 0.12) * pulse;
      const crestColour = key ? theme.pitchBright[key.tonic] : theme.signal;
      for (let x = 0; x < W; x++) {
        const top = farRidge(x);
        if (glowRows > 0) {
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = mix(st.tint, rgb(crestColour), 0.3);
          ctx.fillRect(x, top - glowRows, 1, glowRows);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = mix(rgb(FAR_RIDGE), st.tint, 0.2);
        ctx.fillRect(x, top, 1, H - top);
        ctx.fillStyle = withAlpha(crestColour, crestAlpha);
        ctx.fillRect(x, top, 1, 1);
        ctx.fillStyle = NEAR_RIDGE;
        const near = nearRidge(x);
        ctx.fillRect(x, near, 1, H - near);
      }
    }

    // The webcam hole.
    if (cam) {
      ctx.clearRect(
        Math.floor(cam.x / CELL),
        Math.floor(cam.y / CELL),
        Math.ceil((cam.x + cam.w) / CELL) - Math.floor(cam.x / CELL),
        Math.ceil((cam.y + cam.h) / CELL) - Math.floor(cam.y / CELL),
      );
    }
  };

  const accent = tonic !== null ? theme.pitchBright[tonic] : theme.signal;
  const corner = (pos: CSSProperties): CSSProperties => ({
    position: "absolute",
    width: 40,
    height: 40,
    boxSizing: "border-box",
    borderColor: withAlpha(accent, 0.7),
    borderStyle: "solid",
    borderWidth: 0,
    transition: "border-color 4s linear",
    ...pos,
  });

  return (
    <div style={{ position: "absolute", inset: 0, width, height }}>
      <StageCanvas width={width} height={height} pixel={CELL} draw={draw} />
      {cam && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: cam.x,
            top: cam.y,
            width: cam.w,
            height: cam.h,
            boxSizing: "border-box",
            // Inner 4 px night edge (hides a 1–2 px crop error), outer 4 px
            // border, then a two-step halo in the key colour: hard steps, no blur.
            boxShadow: [
              `inset 0 0 0 4px ${theme.night}`,
              `0 0 0 4px ${theme.plateBorder}`,
              `0 0 0 12px ${withAlpha(accent, 0.14)}`,
              `0 0 0 24px ${withAlpha(accent, 0.07)}`,
            ].join(", "),
            transition: "box-shadow 4s linear",
          }}
        >
          <span style={corner({ left: -12, top: -12, borderLeftWidth: 8, borderTopWidth: 8 })} />
          <span style={corner({ right: -12, top: -12, borderRightWidth: 8, borderTopWidth: 8 })} />
          <span
            style={corner({ left: -12, bottom: -12, borderLeftWidth: 8, borderBottomWidth: 8 })}
          />
          <span
            style={corner({ right: -12, bottom: -12, borderRightWidth: 8, borderBottomWidth: 8 })}
          />
        </div>
      )}
    </div>
  );
}
