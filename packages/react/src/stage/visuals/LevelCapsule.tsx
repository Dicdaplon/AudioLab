"use client";

/**
 * Level capsule: the small proof that the guitar drives the stream. A
 * 16-cell VU meter of the input level with an 800 ms peak hold, an "on air"
 * LED lit as soon as there is signal (it never blinks), the loloupTech
 * brand, and the tempo: BPM in figures with a four-cell metronome lit on the
 * current beat of the bar (beat one in ember). The tempo is shown only when
 * its estimate is confident; a wrong tempo is worse than none.
 */

import { useRef, type RefObject } from "react";

import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface LevelCapsuleProps {
  signals: RefObject<StageSignals | null>;
  /** "EN DIRECT" (fr) or "LIVE" (en). Default "fr". */
  notation?: "fr" | "en";
  theme?: StageTheme;
}

/** CSS size of the capsule. */
export const LEVEL_CAPSULE_SIZE = { width: 456, height: 104 } as const;

const CELLS = 16;
/** Level scale (`TonalityFrame.signalLevelDb`): empty meter, full meter, "live" threshold. */
const EMPTY_DB = -95;
const FULL_DB = -65;
const LIVE_DB = -90;
const RELEASE_DB_PER_S = 20;
const PEAK_HOLD = 0.8;
const MIN_CONFIDENCE = 0.5;

interface CapsuleState {
  level: number;
  peak: number;
  peakAt: number;
}

export function LevelCapsule({ signals, notation = "fr", theme = STAGE_THEME }: LevelCapsuleProps) {
  const state = useRef<CapsuleState>({ level: EMPTY_DB, peak: EMPTY_DB, peakAt: 0 });
  const { width: W, height: H } = LEVEL_CAPSULE_SIZE;

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    const st = state.current;
    const now = f.now;
    const db = s && Number.isFinite(s.levelDb) ? s.levelDb : -100;

    // Instant attack, linear release; the peak holds 800 ms then falls.
    st.level = db >= st.level ? db : Math.max(db, st.level - RELEASE_DB_PER_S * f.dt);
    if (st.level >= st.peak) {
      st.peak = st.level;
      st.peakAt = now;
    } else if (now - st.peakAt > PEAK_HOLD) {
      st.peak = Math.max(st.level, st.peak - RELEASE_DB_PER_S * f.dt);
    }

    // Plate: night at 78 %, 4 px border, 6 px cut corners.
    const c = 6;
    ctx.beginPath();
    ctx.moveTo(2 + c, 2);
    ctx.lineTo(W - 2 - c, 2);
    ctx.lineTo(W - 2, 2 + c);
    ctx.lineTo(W - 2, H - 2 - c);
    ctx.lineTo(W - 2 - c, H - 2);
    ctx.lineTo(2 + c, H - 2);
    ctx.lineTo(2, H - 2 - c);
    ctx.lineTo(2, 2 + c);
    ctx.closePath();
    ctx.fillStyle = theme.plate;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = theme.plateBorder;
    ctx.stroke();

    // Row 1: on-air LED and brand.
    const live = db > LIVE_DB;
    ctx.fillStyle = live ? theme.good : theme.shadeLine;
    ctx.fillRect(24, 20, 12, 12);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.font = `16px ${theme.fonts.label}`;
    ctx.fillStyle = live ? theme.ink : theme.inkFaint;
    ctx.fillText(notation === "en" ? "LIVE" : "EN DIRECT", 44, 33);

    ctx.font = `500 21px ${theme.fonts.brand}`;
    const tech = ctx.measureText("Tech").width;
    ctx.textAlign = "right";
    ctx.fillStyle = theme.major;
    ctx.fillText("Tech", W - 24, 34);
    ctx.fillStyle = theme.ink;
    ctx.fillText("loloup", W - 24 - tech, 34);

    // Row 2: VU, 16 cells of 12 × 24 (signal, then ember, then coral).
    const lit = Math.round(
      Math.max(0, Math.min(1, (st.level - EMPTY_DB) / (FULL_DB - EMPTY_DB))) * CELLS,
    );
    const peakCell =
      Math.round(Math.max(0, Math.min(1, (st.peak - EMPTY_DB) / (FULL_DB - EMPTY_DB))) * CELLS) - 1;
    for (let i = 0; i < CELLS; i++) {
      const zone = i < 10 ? theme.signal : i < 14 ? theme.major : theme.bad;
      ctx.fillStyle = i < lit ? zone : i === peakCell ? theme.ink : theme.shadeLine;
      ctx.fillRect(24 + i * 16, 56, 12, 24);
    }

    // Tempo: figures and metronome, only from a confident estimate.
    const tempo = s?.tempo ?? null;
    const confident = !!tempo && tempo.confidence >= MIN_CONFIDENCE;
    const beat = confident && s ? s.beatAt(now) : null;
    ctx.textAlign = "left";
    ctx.font = `500 32px ${theme.fonts.mono}`;
    ctx.fillStyle = confident ? theme.ink : theme.inkFaint;
    ctx.fillText(confident ? String(Math.round(tempo.bpm)) : "—", 300, 82);
    ctx.font = `16px ${theme.fonts.label}`;
    ctx.fillStyle = theme.inkMuted;
    ctx.fillText("BPM", 372, 66);
    const current = beat ? beat.beatInBar % 4 : -1;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i !== current ? theme.shadeLine : i === 0 ? theme.major : theme.signal;
      ctx.fillRect(372 + i * 16, 72, 12, 12);
    }
  };

  return (
    <StageCanvas
      width={W}
      height={H}
      draw={draw}
      label={notation === "en" ? "Input level and tempo" : "Niveau d'entrée et tempo"}
    />
  );
}
