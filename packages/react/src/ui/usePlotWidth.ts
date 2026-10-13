"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * Width of the plot frame, kept up to date through a ResizeObserver so a
 * resize (or the settings rail appearing) redraws the plot. Falls back to
 * `fallback` before the first measurement or where clientWidth is 0.
 */
export function usePlotWidth(fallback = 600): [RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width > 0 ? width : fallback];
}
