"use client";

import { useEffect, useState } from "react";

/** True while `query` matches; false where matchMedia is unavailable. */
export function useMediaQuery(query: string): boolean {
  const supported = typeof window !== "undefined" && typeof window.matchMedia === "function";
  const [matches, setMatches] = useState(() =>
    supported ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (!supported) return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query, supported]);

  return matches;
}

/** Breakpoints shared with the stylesheets (min-width, mobile first). */
export const BREAKPOINTS = {
  sm: "(min-width: 480px)",
  md: "(min-width: 720px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
} as const;
