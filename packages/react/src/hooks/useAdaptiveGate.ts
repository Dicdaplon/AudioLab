"use client";

/**
 * An adaptive noise gate fed by a level that changes with each analysis
 * frame (e.g. `useTonality().signalLevelDb`): it learns the room's
 * background and says whether someone is playing. It steps once per new
 * `frame` object, during the render that brings it, so the verdict is never
 * one frame late and a re-render does not count twice. `strictness` (0
 * gentle … 1 strict, `GATE_STRICTNESS`) can change at any time; the
 * background is kept.
 */

import { useRef } from "react";

import {
  AdaptiveNoiseGate,
  gateTuning,
  GATE_STRICTNESS,
  type NoiseGateState,
} from "@audiolab/core";

export interface UseAdaptiveGateOptions {
  /** 0 gentle … 1 strict. Default `GATE_STRICTNESS.chords`. */
  strictness?: number;
  /** Time between two frames, in ms. Default 100. */
  frameMs?: number;
  /** False to stop stepping (the gate stays as it was). Default true. */
  enabled?: boolean;
}

function tuningOf(strictness: number) {
  const { onsetMarginDb: _onset, ...tuning } = gateTuning(strictness);
  return tuning;
}

/** The gate's state after the latest frame, or null before the first. */
export function useAdaptiveGate(
  levelDb: number | null | undefined,
  frame: unknown,
  options: UseAdaptiveGateOptions = {},
): NoiseGateState | null {
  const { strictness = GATE_STRICTNESS.chords, frameMs = 100, enabled = true } = options;
  const ref = useRef<{
    gate: AdaptiveNoiseGate;
    strictness: number;
    frame: unknown;
    state: NoiseGateState | null;
  } | null>(null);
  ref.current ??= {
    gate: new AdaptiveNoiseGate(tuningOf(strictness)),
    strictness,
    frame: undefined,
    state: null,
  };
  const g = ref.current;
  if (g.strictness !== strictness) {
    g.gate.configure(tuningOf(strictness));
    g.strictness = strictness;
  }
  if (enabled && levelDb !== null && levelDb !== undefined && frame !== g.frame) {
    g.frame = frame;
    g.state = g.gate.push({ levelDb, dtMs: frameMs });
  }
  return g.state;
}
