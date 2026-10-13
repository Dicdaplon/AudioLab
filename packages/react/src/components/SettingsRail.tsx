"use client";

import type { ReactNode } from "react";

import { BREAKPOINTS, useMediaQuery } from "../ui/useMediaQuery";

interface SettingsRailProps {
  children: ReactNode;
}

/**
 * Where the settings live: a sticky rail on the right at ≥ 1280 px, a
 * collapsed disclosure at the top of the tab below that, so a phone does
 * not scroll through five sliders to reach the readout.
 */
export function SettingsRail({ children }: SettingsRailProps) {
  const wide = useMediaQuery(BREAKPOINTS.xl);
  if (wide) {
    return <aside className="rail">{children}</aside>;
  }
  return (
    <details className="rail-details">
      <summary className="rail-details__summary">Settings</summary>
      <div className="rail-details__body">{children}</div>
    </details>
  );
}
