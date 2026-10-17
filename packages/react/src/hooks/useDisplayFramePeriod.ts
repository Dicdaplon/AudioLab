"use client";

/**
 * The display's frame period, measured from requestAnimationFrame: the
 * median interval of the last 60 frames, in ms (16.7 at 60 Hz, 8.3 at
 * 120 Hz). It feeds the display part of a timing budget. Null until
 * measured, while disabled, and where rAF does not exist (SSR).
 */

import { useEffect, useState } from "react";

const SAMPLES = 60;

export function useDisplayFramePeriod(enabled = true): number | null {
  const [period, setPeriod] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof requestAnimationFrame !== "function") return;
    const intervals: number[] = [];
    let last: number | null = null;
    let handle = 0;
    const tick = (now: number) => {
      if (last !== null) {
        const dt = now - last;
        // Skip hidden-tab gaps: they are not frames.
        if (dt > 0 && dt < 100) intervals.push(dt);
        if (intervals.length > SAMPLES) intervals.shift();
        if (intervals.length === SAMPLES) {
          const sorted = [...intervals].sort((a, b) => a - b);
          const median = sorted[SAMPLES / 2];
          setPeriod((p) => (p !== null && Math.abs(p - median) < 0.2 ? p : median));
        }
      }
      last = now;
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [enabled]);

  return period;
}
