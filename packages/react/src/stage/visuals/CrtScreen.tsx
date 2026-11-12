"use client";

/**
 * CRT screen: a pixel-art monitor around a webcam that sits *behind* the
 * overlay. The screen is the webcam's own rectangle (square corners, so the
 * image is not cut); a thick casing with a lit top edge, a dark lip and
 * corner screws frames it. On the glass: scanlines, darker stepped edges, a
 * soft reflection and a slow rolling band, and now and then (every 15–40 s)
 * one event: a glare sweeping across, a short flicker, or a glitch band
 * running down. The chin carries the brand, a strip in the song key's colour
 * and a power light lit while the music plays.
 *
 * Plain CSS and SVG: crisp at any size, nothing redrawn per frame. The
 * events are CSS animations started from a timer in an effect. Compression:
 * the scanlines are 2 px every 5 px, the edge darkening is stepped, the
 * casing is flat colour; flicker stays under 10 % of brightness, once.
 */

import { memo, useEffect, useState } from "react";

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
  /** Occasional glass events (glare, flicker, glitch). Default true. */
  effects?: boolean;
  /** Edge and tint style of the tube (`CRT_LOOKS`). Default "clean". */
  look?: CrtLook;
  theme?: StageTheme;
}

/**
 * Tube looks, from a clean modern CRT to a cheap, yellowed old one. The
 * overlay sits *over* the webcam, so a look can only lay translucent veils
 * on the image (a page cannot recolour another OBS source): darkened edges,
 * a warm or phosphor tint, heavier scanlines.
 */
export const CRT_LOOKS = ["clean", "dark", "aged", "fallout", "worn"] as const;
export type CrtLook = (typeof CRT_LOOKS)[number];

interface LookLayers {
  /** Scanline darkness and period (dark 2 px every `period` px). */
  scan: number;
  period: number;
  /** Veil over the whole image, or none. */
  tint: string | null;
  /** Edge darkening (CSS background). */
  edge: string;
  /** Extra uneven shading (CSS background), or none. */
  wear: string | null;
}

const STEP = (a: number, b: number) =>
  `rgba(0,0,0,${a}) 0 6px, rgba(0,0,0,${b}) 6px 16px, transparent 34px calc(100% - 34px), rgba(0,0,0,${b}) calc(100% - 16px) calc(100% - 6px), rgba(0,0,0,${a}) calc(100% - 6px)`;
const STEPPED_EDGE = `linear-gradient(to right, ${STEP(0.28, 0.14)}), linear-gradient(to bottom, ${STEP(0.28, 0.14)})`;

const LOOKS: Readonly<Record<CrtLook, LookLayers>> = {
  clean: { scan: 0.2, period: 5, tint: null, edge: STEPPED_EDGE, wear: null },
  dark: {
    scan: 0.22,
    period: 5,
    tint: null,
    edge: `radial-gradient(ellipse 78% 74% at 50% 50%, transparent 58%, rgba(0,0,0,0.5) 86%, rgba(0,0,0,0.85) 100%), ${STEPPED_EDGE}`,
    wear: null,
  },
  aged: {
    scan: 0.2,
    period: 5,
    tint: "rgba(232, 178, 74, 0.10)",
    edge: "radial-gradient(ellipse 80% 76% at 50% 50%, transparent 55%, rgba(36, 22, 4, 0.45) 88%, rgba(20, 12, 2, 0.75) 100%)",
    wear: null,
  },
  fallout: {
    scan: 0.28,
    period: 4,
    tint: "rgba(150, 255, 120, 0.07)",
    edge: "radial-gradient(ellipse 76% 72% at 50% 50%, transparent 52%, rgba(0, 8, 0, 0.55) 84%, rgba(0, 4, 0, 0.9) 100%)",
    wear: "linear-gradient(to bottom, rgba(150,255,120,0.04), transparent 40%, rgba(150,255,120,0.03))",
  },
  worn: {
    scan: 0.22,
    period: 5,
    tint: "rgba(214, 168, 92, 0.13)",
    edge: "radial-gradient(ellipse 82% 78% at 50% 50%, transparent 52%, rgba(50, 30, 8, 0.5) 86%, rgba(24, 14, 4, 0.85) 100%)",
    // An uneven tube: one side duller, a faint burn mark top left.
    wear: "linear-gradient(to right, rgba(0,0,0,0.12), transparent 30%, transparent 75%, rgba(0,0,0,0.06)), radial-gradient(circle at 18% 22%, rgba(80, 50, 10, 0.12), transparent 30%)",
  },
};

/** Casing thickness around the screen (sides and top) and under it (the chin), in px. */
export const CRT_BEZEL = { side: 30, chin: 52 } as const;
const LIP = 8;

type GlassEvent = "glare" | "flicker" | "glitch";
const EVENTS: readonly GlassEvent[] = ["glare", "flicker", "glitch"];
/** Slow enough to read as the glass, fading in and out (never popping). */
const EVENT_SECONDS: Readonly<Record<GlassEvent, number>> = {
  glare: 3.8,
  flicker: 1.4,
  glitch: 2.2,
};

const KEYFRAMES = `
@keyframes al-crt-roll { from { transform: translateY(-200px); } to { transform: translateY(var(--al-crt-h)); } }
@keyframes al-crt-glare {
  0% { transform: translateX(-60%) skewX(-20deg); opacity: 0; }
  20% { opacity: 1; }
  75% { opacity: 1; }
  100% { transform: translateX(380%) skewX(-20deg); opacity: 0; }
}
@keyframes al-crt-flicker { 0% { opacity: 0; } 25% { opacity: 1; } 45% { opacity: 0.45; } 65% { opacity: 0.85; } 100% { opacity: 0; } }
@keyframes al-crt-glitch {
  0% { transform: translateY(-20px); opacity: 0; }
  12% { opacity: 1; }
  70% { opacity: 0.8; }
  100% { transform: translateY(var(--al-crt-h)); opacity: 0; }
}`;

export const CrtScreen = memo(function CrtScreen({
  x,
  y,
  w,
  h,
  tonic = null,
  live = false,
  brand = "loloupTech",
  scanlines = true,
  effects = true,
  look = "clean",
  theme = STAGE_THEME,
}: CrtScreenProps) {
  const { side: SIDE, chin: CHIN } = CRT_BEZEL;
  const W = w + 2 * SIDE;
  const H = h + SIDE + CHIN;
  const accent = tonic !== null ? theme.pitchBright[tonic] : theme.signal;
  const layers = LOOKS[look];

  // One glass event at a time, at random intervals; the key restarts its animation.
  const [event, setEvent] = useState<{ kind: GlassEvent; id: number } | null>(null);
  useEffect(() => {
    if (!effects) return;
    let id = 0;
    let timer = 0;
    const next = () => {
      timer = window.setTimeout(
        () => {
          const kind = EVENTS[Math.floor(Math.random() * EVENTS.length)];
          setEvent({ kind, id: ++id });
          timer = window.setTimeout(() => {
            setEvent(null);
            next();
          }, EVENT_SECONDS[kind] * 1000);
        },
        15000 + Math.random() * 25000,
      );
    };
    next();
    return () => clearTimeout(timer);
  }, [effects]);

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
      <style>{KEYFRAMES}</style>
      {/* The glass. */}
      <div
        style={{
          position: "absolute",
          left: SIDE,
          top: SIDE,
          width: w,
          height: h,
          overflow: "hidden",
          ["--al-crt-h" as string]: `${h + 200}px`,
        }}
      >
        {layers.tint && <div style={{ position: "absolute", inset: 0, background: layers.tint }} />}
        {scanlines && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `repeating-linear-gradient(to bottom, rgba(0,0,0,${layers.scan}) 0 2px, transparent 2px ${layers.period}px)`,
            }}
          />
        )}
        {/* Edges darkened: the tube's curve, without rounding the image. */}
        <div style={{ position: "absolute", inset: 0, background: layers.edge }} />
        {layers.wear && <div style={{ position: "absolute", inset: 0, background: layers.wear }} />}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(125deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 14%, transparent 26%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 200,
            background:
              "linear-gradient(to bottom, transparent, rgba(255,255,255,0.05) 35%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 65%, transparent)",
            animation: "al-crt-roll 8s linear infinite",
          }}
        />
        {/* Tube glow at the edge, in the key's colour. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: `inset 0 0 0 3px ${withAlpha(accent, 0.18)}`,
            transition: "box-shadow 4s linear",
          }}
        />
        {event?.kind === "glare" && (
          <div
            key={event.id}
            style={{
              position: "absolute",
              top: "-10%",
              bottom: "-10%",
              width: "22%",
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.10) 60%, transparent)",
              animation: `al-crt-glare ${EVENT_SECONDS.glare}s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            }}
          />
        )}
        {event?.kind === "flicker" && (
          <div
            key={event.id}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.09)",
              animation: `al-crt-flicker ${EVENT_SECONDS.flicker}s ease-in-out forwards`,
            }}
          />
        )}
        {event?.kind === "glitch" && (
          <div
            key={event.id}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 12,
              background: `linear-gradient(to right, ${withAlpha(accent, 0.25)}, rgba(255,255,255,0.18), ${withAlpha(accent, 0.25)})`,
              animation: `al-crt-glitch ${EVENT_SECONDS.glitch}s steps(24) forwards`,
            }}
          />
        )}
      </div>

      {/* Casing: body, lit top edge, dark side, lip around the screen, corner screws. */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path
          d={`M0,0 H${W} V${H} H0 Z M${SIDE},${SIDE} V${SIDE + h} H${SIDE + w} V${SIDE} Z`}
          fill={theme.shade}
          fillRule="evenodd"
        />
        <rect x={0} y={0} width={W} height={6} fill={theme.plateBorder} />
        <rect x={0} y={0} width={6} height={H} fill={theme.shadeLine} />
        <rect x={W - 6} y={0} width={6} height={H} fill={theme.night} />
        <rect x={0} y={H - 6} width={W} height={6} fill={theme.night} />
        <path
          d={`M${SIDE - LIP},${SIDE - LIP} H${SIDE + w + LIP} V${SIDE + h + LIP} H${SIDE - LIP} Z M${SIDE},${SIDE} V${SIDE + h} H${SIDE + w} V${SIDE} Z`}
          fill={theme.night}
          fillRule="evenodd"
        />
        {[
          [12, 12],
          [W - 20, 12],
          [12, H - 20],
          [W - 20, H - 20],
        ].map(([sx, sy]) => (
          <g key={`${sx}-${sy}`}>
            <rect x={sx} y={sy} width={8} height={8} fill={theme.shadeLine} />
            <rect x={sx + 2} y={sy + 3} width={4} height={2} fill={theme.night} />
          </g>
        ))}
      </svg>

      {/* Chin: brand, key strip, knobs and power light. */}
      <div
        style={{
          position: "absolute",
          left: SIDE + 8,
          right: SIDE + 8,
          bottom: 12,
          height: CHIN - LIP - 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ font: `24px ${theme.fonts.brand}`, color: theme.inkMuted }}>
          {brand.replace(/Tech$/, "")}
          <span style={{ color: theme.major }}>{brand.endsWith("Tech") ? "Tech" : ""}</span>
        </span>
        <span
          style={{
            flex: "0 0 160px",
            height: 6,
            background: withAlpha(accent, 0.75),
            transition: "background-color 4s linear",
          }}
        />
        <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {[0, 1].map((i) => (
            <span key={i} style={{ width: 18, height: 18, background: theme.shadeLine }} />
          ))}
          <span
            style={{
              width: 14,
              height: 14,
              background: live ? theme.good : theme.plateBorder,
              boxShadow: live ? `0 0 0 4px ${withAlpha(theme.good, 0.22)}` : undefined,
              transition: "background-color 300ms linear",
            }}
          />
        </span>
      </div>
    </div>
  );
});
