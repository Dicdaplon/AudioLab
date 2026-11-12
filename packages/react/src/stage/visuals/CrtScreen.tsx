"use client";

/**
 * CRT screen: a pixel-art monitor around a webcam that sits *behind* the
 * overlay. The bezel covers the webcam's square corners with a rounded
 * screen; on the glass, light scanlines, a vignette, two reflections and a
 * slow rolling band sell the old tube without hiding the face. The chin
 * carries the brand, a power light (lit while the music plays) and a strip
 * in the song key's colour.
 *
 * Plain CSS and SVG: crisp at any size, nothing redrawn per frame (the band
 * is a CSS animation). Compression: the scanlines are 2 px every 6 px at a
 * few percent of alpha, the glow is stepped; the bezel is flat colour.
 */

import { memo } from "react";

import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";

export interface CrtScreenProps {
  /** The screen (the webcam) rectangle, in CSS px of the page. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Song tonic, for the chin strip and the glass edge glow. */
  tonic?: number | null;
  /** Power light lit (e.g. `StageState.playing`). */
  live?: boolean;
  /** Text on the chin. Default "loloupTech". */
  brand?: string;
  /** Scanlines on the glass. Default true. */
  scanlines?: boolean;
  theme?: StageTheme;
}

/** Bezel thickness around the screen: sides and top, and the chin. */
const SIDE = 28;
const CHIN = 44;
const SCREEN_RADIUS = 36;
const OUTER_RADIUS = 20;

const ROLL = `@keyframes al-crt-roll { from { transform: translateY(-140px); } to { transform: translateY(var(--al-crt-h)); } }`;

export const CrtScreen = memo(function CrtScreen({
  x,
  y,
  w,
  h,
  tonic = null,
  live = false,
  brand = "loloupTech",
  scanlines = true,
  theme = STAGE_THEME,
}: CrtScreenProps) {
  const W = w + 2 * SIDE;
  const H = h + SIDE + CHIN;
  const accent = tonic !== null ? theme.pitchBright[tonic] : theme.signal;
  // Bezel = outer rounded rectangle minus the rounded screen (even-odd).
  const rr = (rx: number, ry: number, rw: number, rh: number, r: number) =>
    `M${rx + r},${ry} H${rx + rw - r} Q${rx + rw},${ry} ${rx + rw},${ry + r} V${ry + rh - r} Q${rx + rw},${ry + rh} ${rx + rw - r},${ry + rh} H${rx + r} Q${rx},${ry + rh} ${rx},${ry + rh - r} V${ry + r} Q${rx},${ry} ${rx + r},${ry} Z`;
  const outer = rr(0, 0, W, H, OUTER_RADIUS);
  const screen = rr(SIDE, SIDE, w, h, SCREEN_RADIUS);
  const lip = rr(SIDE - 6, SIDE - 6, w + 12, h + 12, SCREEN_RADIUS + 6);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x - SIDE,
        top: y - SIDE,
        width: W,
        height: H,
        pointerEvents: "none",
      }}
    >
      <style>{ROLL}</style>
      {/* The glass, clipped to the rounded screen. */}
      <div
        style={{
          position: "absolute",
          left: SIDE,
          top: SIDE,
          width: w,
          height: h,
          borderRadius: SCREEN_RADIUS,
          overflow: "hidden",
          ["--al-crt-h" as string]: `${h + 140}px`,
        }}
      >
        {scanlines && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(to bottom, rgba(0,0,0,0.10) 0 2px, transparent 2px 6px)",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 75% 70% at 50% 48%, transparent 62%, rgba(0,0,0,0.38) 100%)",
          }}
        />
        {/* Reflections: a broad sheen top-left and a small window glint top-right. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 16%, transparent 27%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "7%",
            top: "6%",
            width: "16%",
            height: "9%",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            transform: "rotate(-12deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 140,
            background:
              "linear-gradient(to bottom, transparent, rgba(255,255,255,0.035) 50%, transparent)",
            animation: "al-crt-roll 9s linear infinite",
          }}
        />
        {/* Tube glow at the edge, in the key's colour, two hard steps. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: SCREEN_RADIUS,
            boxShadow: `inset 0 0 0 4px ${withAlpha(accent, 0.12)}, inset 0 0 0 10px ${withAlpha(accent, 0.05)}`,
            transition: "box-shadow 4s linear",
          }}
        />
      </div>

      {/* Bezel: casing, a highlight on its top edge, the lip around the screen. */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d={`${outer} ${screen}`} fill={theme.shade} fillRule="evenodd" />
        <path d={`${lip} ${screen}`} fill={theme.night} fillRule="evenodd" />
        <path d={outer} fill="none" stroke={theme.plateBorder} strokeWidth={4} />
        <rect
          x={OUTER_RADIUS}
          y={2}
          width={W - 2 * OUTER_RADIUS}
          height={4}
          fill={theme.shadeLine}
        />
      </svg>

      {/* Chin: brand, key strip, power light. */}
      <div
        style={{
          position: "absolute",
          left: SIDE + 8,
          right: SIDE + 8,
          bottom: 8,
          height: CHIN - 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ font: `22px ${theme.fonts.brand}`, color: theme.inkMuted }}>
          {brand.replace(/Tech$/, "")}
          <span style={{ color: theme.major }}>{brand.endsWith("Tech") ? "Tech" : ""}</span>
        </span>
        <span
          style={{
            flex: "0 0 120px",
            height: 4,
            background: withAlpha(accent, 0.7),
            transition: "background-color 4s linear",
          }}
        />
        <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {[0, 1].map((i) => (
            <span
              key={i}
              style={{ width: 16, height: 16, borderRadius: 8, background: theme.shadeLine }}
            />
          ))}
          <span
            style={{
              width: 12,
              height: 12,
              background: live ? theme.good : theme.plateBorder,
              boxShadow: live ? `0 0 0 4px ${withAlpha(theme.good, 0.2)}` : undefined,
              transition: "background-color 300ms linear",
            }}
          />
        </span>
      </div>
    </div>
  );
});
