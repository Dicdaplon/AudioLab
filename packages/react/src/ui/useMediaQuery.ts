"use client";

import { useCallback, useSyncExternalStore } from "react";

const supported = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

/**
 * True while `query` matches; false where matchMedia is unavailable and on
 * the server. During hydration the server value (false) is used first, so
 * a server-rendered page never mismatches; a plain client render reads the
 * real value immediately.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!supported()) return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => supported() && window.matchMedia(query).matches,
    () => false,
  );
}

/** Breakpoints shared with the stylesheets (min-width, mobile first). */
export const BREAKPOINTS = {
  sm: "(min-width: 480px)",
  md: "(min-width: 720px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
} as const;
