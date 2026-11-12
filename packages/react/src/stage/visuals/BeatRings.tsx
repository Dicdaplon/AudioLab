"use client";

/**
 * Beat rings: on every beat of the tracked tempo, an octagon ring leaves the
 * centre (usually the mandala's edge) and fades as it grows, so the pulse is
 * visible without a single filled flash. The colour is the key's mode
 * (ember for major, violet for minor); the first beat of the bar draws a
 * thicker, wider ring, so the viewer can count "ONE two three four".
 *
 * Nothing is drawn without a confident tempo (`beatAt` returns null): a
 * wrong pulse is worse than none. Above 180 BPM only every other beat (the
 * half note) gets a ring. At most three rings live at once.
 */

import { useRef, type RefObject } from "react";

import { easeOut, lerp, polygonPath } from "../draw";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface BeatRingsProps {
  signals: RefObject<StageSignals | null>;
  /** Canvas size in CSS px; the rings are centred in it. */
  width: number;
  height: number;
  /** Radius the rings start from, in CSS px (e.g. the mandala's radius). */
  radius: number;
  /** Cell size. Default 4. */
  pixel?: number;
  theme?: StageTheme;
}

const MAX_RINGS = 3;
const MAX_DURATION = 0.7;
const FAST_BPM = 180;

interface Ring {
  alive: boolean;
  /** Start time (on the beat itself, even if seen a frame late). */
  t0: number;
  duration: number;
  downbeat: boolean;
}

interface RingsState {
  rings: Ring[];
  lastBeat: number | null;
}

export function BeatRings({
  signals,
  width,
  height,
  radius,
  pixel = 4,
  theme = STAGE_THEME,
}: BeatRingsProps) {
  const state = useRef<RingsState>({
    rings: Array.from({ length: MAX_RINGS }, () => ({
      alive: false,
      t0: 0,
      duration: 0,
      downbeat: false,
    })),
    lastBeat: null,
  });

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    const beat = s.beatAt(f.now);

    if (!beat) {
      st.lastBeat = null;
    } else if (beat.beat !== st.lastBeat) {
      const first = st.lastBeat === null;
      st.lastBeat = beat.beat;
      const fast = 60 / beat.period > FAST_BPM;
      // A clock that just appeared mid-beat waits for the next one.
      const onTime = !first || beat.phase < 0.2;
      if (onTime && (!fast || beat.beat % 2 === 0)) {
        // Reuse a dead ring, else the oldest one.
        let slot = st.rings[0];
        for (const r of st.rings) {
          if (!r.alive) {
            slot = r;
            break;
          }
          if (r.t0 < slot.t0) slot = r;
        }
        slot.alive = true;
        slot.t0 = f.now - beat.phase * beat.period;
        slot.duration = Math.min(0.9 * beat.period * (fast ? 2 : 1), MAX_DURATION);
        slot.downbeat = beat.beatInBar === 0;
      }
    }

    const key = s.key.key;
    const colour = key ? (key.mode === "min" ? theme.minor : theme.major) : theme.signal;
    const cx = f.width / 2;
    const cy = f.height / 2;
    const r0 = radius / f.pixel;
    ctx.lineJoin = "miter";
    for (const r of st.rings) {
      if (!r.alive) continue;
      const u = (f.now - r.t0) / r.duration;
      if (u >= 1) {
        r.alive = false;
        continue;
      }
      if (u < 0) continue;
      const e = easeOut(u);
      const rr = lerp(r0, r0 * (r.downbeat ? 1.6 : 1.45), e);
      // Alpha in hard steps of 1/20: smooth fades of a large outline band under compression.
      const alpha = Math.round((r.downbeat ? 0.5 : 0.35) * (1 - u) * 20) / 20;
      if (alpha <= 0) continue;
      polygonPath(ctx, cx, cy, rr, 8);
      ctx.lineWidth = Math.max(1, Math.round((r.downbeat ? 12 : 8) / f.pixel));
      ctx.strokeStyle = withAlpha(colour, alpha);
      ctx.stroke();
    }
  };

  return <StageCanvas width={width} height={height} pixel={pixel} draw={draw} />;
}
