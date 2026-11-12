"use client";

/**
 * The stage plate: a night panel at 78 % over the stream, with a hard 4 px
 * border, cut corners and an optional coloured bar on the left (the mode).
 * Plain inline styles: the stage renders outside the Loupe root, on a
 * transparent page, and must not depend on its stylesheet.
 */

import type { CSSProperties, ReactNode } from "react";

import { STAGE_THEME, type StageTheme } from "../theme";

export interface PlateProps {
  label?: string;
  /** Left bar colour (e.g. the mode); none when undefined. */
  accent?: string;
  /** Background tint flashed on events (falls back to the plate colour). */
  tint?: string;
  /** Corner shape: notched for major, bevelled for minor (shape doubles the colour). */
  corners?: "notch" | "bevel";
  width?: number;
  height?: number;
  theme?: StageTheme;
  style?: CSSProperties;
  children?: ReactNode;
}

const CUT = 8;

function clipFor(corners: "notch" | "bevel"): string {
  if (corners === "bevel") {
    return `polygon(0 0, calc(100% - ${CUT * 2}px) 0, 100% ${CUT * 2}px, 100% 100%, 0 100%)`;
  }
  return `polygon(${CUT}px 0, calc(100% - ${CUT}px) 0, calc(100% - ${CUT}px) ${CUT}px, 100% ${CUT}px,
    100% calc(100% - ${CUT}px), calc(100% - ${CUT}px) calc(100% - ${CUT}px), calc(100% - ${CUT}px) 100%,
    ${CUT}px 100%, ${CUT}px calc(100% - ${CUT}px), 0 calc(100% - ${CUT}px), 0 ${CUT}px, ${CUT}px ${CUT}px)`;
}

export function Plate({
  label,
  accent,
  tint,
  corners = "notch",
  width,
  height,
  theme = STAGE_THEME,
  style,
  children,
}: PlateProps) {
  return (
    <div
      style={{
        position: "relative",
        boxSizing: "border-box",
        width,
        height,
        padding: `16px 24px 16px ${accent ? 32 : 24}px`,
        background: tint ?? theme.plate,
        border: `4px solid ${theme.plateBorder}`,
        clipPath: clipFor(corners),
        color: theme.ink,
        transition: "background-color 400ms linear",
        overflow: "hidden",
        ...style,
      }}
    >
      {accent && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 8,
            background: accent,
            transition: "background-color 600ms linear",
          }}
        />
      )}
      {label && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            font: `16px ${theme.fonts.label}`,
            letterSpacing: 1,
            color: theme.inkMuted,
            textTransform: "uppercase",
          }}
        >
          <span aria-hidden style={{ width: 8, height: 8, background: theme.major }} />
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
