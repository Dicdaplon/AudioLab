"use client";

/**
 * Circle-of-fifths mandala: twelve petals in fifths order whose length
 * follows the 1 s chroma, an outer ring with the 8 s chroma (slow memory),
 * and the current chord drawn as a polygon between its notes. The wheel
 * turns (shortest way, ~2 s) to keep the song's tonic at the top, so a
 * major triad and a minor triad are mirror shapes and related keys sit side
 * by side. Notes outside the key are dimmed. It breathes on attacks, by at
 * most 2.5 %.
 */

import { useRef, type RefObject } from "react";

import { CHORD_QUALITY_INTERVALS, fifthsIndex, keyPitchClasses } from "@audiolab/core";

import { approach, approachAngle, outlinedText, peakOf, sectorPath, snap, TAU } from "../draw";
import { noteName, type Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, withAlpha, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface FifthsMandalaProps {
  signals: RefObject<StageSignals | null>;
  /** Diameter in CSS px. */
  size: number;
  /** Cell size of the shapes. Default 4. */
  pixel?: number;
  /** Note names around the wheel. Default true. */
  labels?: boolean;
  notation?: Notation;
  theme?: StageTheme;
}

const SEC = TAU / 12;
const GAP = 0.04;

interface MandalaState {
  rotation: number;
  /** Interpolated angles of the chord polygon's vertices. */
  vertices: number[];
  root: number;
  breath: number;
  lastOnsets: number;
}

function angleOf(pc: number, rotation: number): number {
  return rotation + fifthsIndex(pc) * SEC;
}

function targetRotation(signals: StageSignals): number {
  const key = signals.key.key;
  return key ? -Math.PI / 2 - fifthsIndex(key.tonic) * SEC : -Math.PI / 2;
}

export function FifthsMandala({
  signals,
  size,
  pixel = 4,
  labels = true,
  notation = "en",
  theme = STAGE_THEME,
}: FifthsMandalaProps) {
  const state = useRef<MandalaState>({
    rotation: -Math.PI / 2,
    vertices: [],
    root: 0,
    breath: 0,
    lastOnsets: 0,
  });

  const drawShapes = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    st.rotation = approachAngle(st.rotation, targetRotation(s), f.dt, 0.6);
    if (s.onsetCount !== st.lastOnsets) {
      st.lastOnsets = s.onsetCount;
      st.breath = 1;
    }
    st.breath *= 1 - approach(f.dt, 0.12);

    const cx = f.width / 2;
    const cy = f.height / 2;
    const R0 = (Math.min(f.width, f.height) / 2) * (labels ? 0.8 : 0.96);
    const R = R0 * (1 + 0.025 * st.breath);
    const key = s.key.key;
    const inKey = new Set(
      key ? keyPitchClasses(key.tonic, key.mode) : Array.from({ length: 12 }, (_, i) => i),
    );
    const chord = s.chroma.chord;
    const live = s.chroma.live;
    const peak = peakOf(chord) || 1;
    const livePeak = peakOf(live) || 1;
    const ring = Math.max(1, Math.round(R * 0.07));

    // Tonic disc.
    if (key) {
      ctx.fillStyle = theme.pitchDark[key.tonic];
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.18, 0, TAU);
      ctx.fill();
    }

    for (let pc = 0; pc < 12; pc++) {
      const a = angleOf(pc, st.rotation);
      const level = snap(chord[pc] / peak, 1 / 16);
      const rOut = R * (0.3 + 0.55 * level);
      sectorPath(ctx, cx, cy, R * 0.22, rOut, a - SEC / 2 + GAP, a + SEC / 2 - GAP);
      ctx.fillStyle = inKey.has(pc) ? theme.pitch[pc] : theme.pitchDark[pc];
      ctx.fill();
      if (inKey.has(pc) && level > 0) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = theme.pitchBright[pc];
        ctx.stroke();
      }
      // Outer ring: the slow (8 s) chroma.
      sectorPath(ctx, cx, cy, R * 0.96 - ring, R * 0.96, a - SEC / 2 + GAP, a + SEC / 2 - GAP);
      ctx.fillStyle = withAlpha(theme.pitchBright[pc], 0.25 + 0.75 * (live[pc] / livePeak));
      ctx.fill();
    }

    // Chord polygon, its vertices gliding to the new notes.
    const current = s.chord.current;
    if (current && !s.chord.silent) {
      const tones = CHORD_QUALITY_INTERVALS[current.quality].map((i) => (current.root + i) % 12);
      const targets = tones.map((pc) => angleOf(pc, st.rotation)).sort((x, y) => x - y);
      if (st.vertices.length !== targets.length) st.vertices = targets.slice();
      for (let i = 0; i < targets.length; i++) {
        st.vertices[i] = approachAngle(st.vertices[i], targets[i], f.dt, 0.09);
      }
      st.root = current.root;
      ctx.beginPath();
      st.vertices.forEach((a, i) => {
        const x = cx + R * 0.78 * Math.cos(a);
        const y = cy + R * 0.78 * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = withAlpha(theme.pitchBright[st.root], 0.22);
      ctx.fill();
      ctx.lineWidth = Math.max(1, Math.round(R * 0.03));
      ctx.lineJoin = "miter";
      ctx.strokeStyle = theme.pitchBright[st.root];
      ctx.stroke();
    }
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const key = s.key.key;
    const inKey = new Set(key ? keyPitchClasses(key.tonic, key.mode) : []);
    const cx = f.width / 2;
    const cy = f.height / 2;
    const R = (Math.min(f.width, f.height) / 2) * 0.8;
    const fontSize = Math.max(14, Math.round(size / 22));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let pc = 0; pc < 12; pc++) {
      const a = angleOf(pc, state.current.rotation);
      const x = cx + R * 1.12 * Math.cos(a);
      const y = cy + R * 1.12 * Math.sin(a);
      const fill = !key || inKey.has(pc) ? theme.ink : theme.inkFaint;
      outlinedText(ctx, noteName(pc, notation), x, y, fontSize, theme.fonts.hero, fill);
    }
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <StageCanvas width={size} height={size} pixel={pixel} draw={drawShapes} />
      {labels && (
        <StageCanvas
          width={size}
          height={size}
          draw={drawLabels}
          style={{ position: "absolute", inset: 0 }}
        />
      )}
    </div>
  );
}
