"use client";

/**
 * A display tap on the session (`startSignalTap`), for visuals that read the
 * waveform or a smoothed spectrum on every animation frame. Holds no React
 * state: the visual's own requestAnimationFrame loop reads `ref.current`, so
 * nothing re-renders at display rate.
 */

import { useEffect, useRef, type RefObject } from "react";

import {
  startSignalTap,
  type MicSource,
  type SignalTap,
  type SignalTapOptions,
} from "@audiolab/core";

export function useSignalTap(
  mic: MicSource | null,
  options: SignalTapOptions = {},
): RefObject<SignalTap | null> {
  const ref = useRef<SignalTap | null>(null);
  const { fftSize, smoothingTimeConstant } = options;

  useEffect(() => {
    if (!mic) return;
    const tap = startSignalTap(mic.context, mic.source, { fftSize, smoothingTimeConstant });
    ref.current = tap;
    return () => {
      tap.stop();
      if (ref.current === tap) ref.current = null;
    };
  }, [mic, fftSize, smoothingTimeConstant]);

  return ref;
}
