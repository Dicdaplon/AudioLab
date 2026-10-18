"use client";

/**
 * One light per beat of the bar, the current one lit, following a beat grid
 * on the AudioContext clock (the metronome's). During the count-in (beats
 * before 0) the lights carry `data-count-in`. Updated on every animation
 * frame without re-rendering.
 */

import { useEffect, useRef } from "react";

import { beatAt, type BeatGrid } from "@audiolab/core";

export interface BeatLightsProps {
  grid: BeatGrid | null;
  /** Current AudioContext time in s, or null while unknown. */
  now: () => number | null;
  /** Lights shown when there is no grid. Default 4. */
  beatsPerBar?: number;
  className?: string;
  /** Accessible names. Defaults: "Beat" and `Beat ${n}`. */
  labels?: { list: string; beat: (n: number) => string };
}

const DEFAULT_LABELS = { list: "Beat", beat: (n: number) => `Beat ${n}` };

export function BeatLights({
  grid,
  now,
  beatsPerBar = 4,
  className,
  labels = DEFAULT_LABELS,
}: BeatLightsProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const nowRef = useRef(now);
  nowRef.current = now;
  const count = grid?.beatsPerBar ?? beatsPerBar;

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof requestAnimationFrame !== "function") return;
    let handle = 0;
    const frame = () => {
      const t = nowRef.current();
      let active = -1;
      let countIn = false;
      if (grid && t !== null) {
        const beat = Math.floor(beatAt(grid, t) + 1e-6);
        if (beat >= -grid.beatsPerBar) {
          active = ((beat % grid.beatsPerBar) + grid.beatsPerBar) % grid.beatsPerBar;
        }
        countIn = beat < 0;
      }
      if (countIn) list.dataset.countIn = "";
      else delete list.dataset.countIn;
      Array.from(list.children).forEach((li, i) => {
        if (i === active) (li as HTMLElement).dataset.on = "";
        else delete (li as HTMLElement).dataset.on;
      });
      handle = requestAnimationFrame(frame);
    };
    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, [grid]);

  return (
    <ol
      ref={listRef}
      className={className ? `al-beats ${className}` : "al-beats"}
      aria-label={labels.list}
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="al-beats__light" data-downbeat={i === 0 ? "" : undefined}>
          <span className="al-visually-hidden">{labels.beat(i + 1)}</span>
        </li>
      ))}
    </ol>
  );
}
