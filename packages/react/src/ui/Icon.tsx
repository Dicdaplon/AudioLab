"use client";

import type { ReactNode } from "react";

export type IconName =
  | "mic"
  | "stop"
  | "reset"
  | "play"
  | "warning"
  | "check"
  | "heart"
  | "shield"
  | "slow"
  | "target"
  | "chevron";

/* 16 × 16 grid, 1.5 px strokes in currentColor. */
const PATHS: Record<IconName, ReactNode> = {
  mic: (
    <>
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" />
      <path d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2M5.5 14.5h5" />
    </>
  ),
  stop: <rect x="3" y="3" width="10" height="10" rx="1" />,
  reset: (
    <>
      <path d="M2.5 8a5.5 5.5 0 1 0 1.7-3.9" />
      <path d="M2.5 2.5v3.5h3.5" />
    </>
  ),
  play: <path d="M4.5 2.5l8 5.5-8 5.5z" />,
  warning: (
    <>
      <path d="M8 2l6.5 11.5h-13z" />
      <path d="M8 6.5v3.5M8 12v.5" />
    </>
  ),
  check: <path d="M3 8.5l3 3 7-7" />,
  heart: (
    <path d="M8 13.5S2.5 10 2.5 6a2.75 2.75 0 0 1 5.5-.5 2.75 2.75 0 0 1 5.5.5c0 4-5.5 7.5-5.5 7.5z" />
  ),
  shield: <path d="M8 1.5l5.5 2v4.5c0 3-2.5 5.5-5.5 6.5-3-1-5.5-3.5-5.5-6.5v-4.5z" />,
  slow: (
    <>
      <path d="M2.5 11a5.5 5.5 0 0 1 11 0" />
      <path d="M8 11L5 8" />
    </>
  ),
  target: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  chevron: <path d="M4 6l4 4 4-4" />,
};

interface IconProps {
  name: IconName;
  /** Rendered size in px. Default 16. */
  size?: number;
  className?: string;
  /** Accessible name; without it the icon is decorative (aria-hidden). */
  label?: string;
}

/** Inline stroke icon. Always accompanied by text unless `label` is given. */
export function Icon({ name, size = 16, className, label }: IconProps) {
  return (
    <svg
      className={className ? `al-icon ${className}` : "al-icon"}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
