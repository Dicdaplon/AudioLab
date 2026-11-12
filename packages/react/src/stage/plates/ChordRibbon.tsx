"use client";

/**
 * The chord path: the last chords as blocks, oldest on the left, each as
 * wide as it was held (the current one grows live), filled with its root's
 * pitch colour and labelled with its name and degree. Minor blocks have a
 * bevelled corner, so the shape doubles the colour. When the last four
 * chords repeat the four before, a brace marks the loop ("GRILLE ×2").
 */

import { memo } from "react";

import { chordDegree, type ChordReading, type ChordSegment, type KeyRef } from "@audiolab/core";

import { chordName, isMinorQuality, type Notation } from "../names";
import { STAGE_THEME, type StageTheme } from "../theme";

export interface ChordRibbonProps {
  reading: ChordReading;
  songKey: KeyRef | null;
  /** Blocks shown. Default 8. */
  count?: number;
  width: number;
  height?: number;
  notation?: Notation;
  theme?: StageTheme;
}

function blockWidth(segment: ChordSegment): number {
  const ms = (segment.end - segment.start) * 1000;
  return Math.round(Math.min(240, Math.max(48, 24 + 0.06 * ms)) / 8) * 8;
}

function labelSize(segment: ChordSegment, height: number, notation: Notation): number {
  const chars = chordName(segment.chord.root, segment.chord.quality, notation).length;
  return Math.max(
    16,
    Math.min(Math.round(height * 0.6), Math.floor((blockWidth(segment) - 12) / (chars * 0.5))),
  );
}

/** How many times the last 4 chords repeat back to back (1 = no loop). */
function loopCount(segments: readonly ChordSegment[]): number {
  const roots = segments.map((s) => `${s.chord.root}:${s.chord.quality}`);
  if (roots.length < 8) return 1;
  const last = roots.slice(-4).join("|");
  let n = 1;
  for (let end = roots.length - 4; end >= 4; end -= 4) {
    if (roots.slice(end - 4, end).join("|") !== last) break;
    n += 1;
  }
  return n;
}

export const ChordRibbon = memo(function ChordRibbon({
  reading,
  songKey,
  count = 8,
  width,
  height = 64,
  notation = "fr",
  theme = STAGE_THEME,
}: ChordRibbonProps) {
  const segments = reading.history.slice(-count);
  const loops = loopCount(reading.history);
  const loopWidth = segments.slice(-4).reduce((w, s) => w + blockWidth(s) + 4, -4);

  return (
    <div
      style={{
        position: "relative",
        width,
        height: height + 28,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {loops > 1 && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: loopWidth,
            height: 20,
            borderTop: `4px solid ${theme.major}`,
            borderLeft: `4px solid ${theme.major}`,
            borderRight: `4px solid ${theme.major}`,
            boxSizing: "border-box",
            font: `16px ${theme.fonts.label}`,
            color: theme.major,
            textAlign: "center",
            lineHeight: "12px",
          }}
        >
          <span
            style={{ background: theme.night, padding: "0 8px", position: "relative", top: -12 }}
          >
            {notation === "fr" ? "GRILLE" : "LOOP"} ×{loops}
          </span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, height }}>
        {segments.map((s, i) => {
          const minor = isMinorQuality(s.chord.quality);
          const degree = songKey
            ? chordDegree(s.chord.root, s.chord.quality, songKey.tonic, songKey.mode)
            : null;
          const current = i === segments.length - 1;
          return (
            <div
              key={`${s.start}`}
              style={{
                position: "relative",
                flex: "0 0 auto",
                width: blockWidth(s),
                height,
                background: theme.pitch[s.chord.root],
                clipPath: minor
                  ? "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)"
                  : undefined,
                outline: current ? `4px solid ${theme.ink}` : undefined,
                outlineOffset: -4,
                opacity: reading.silent && current ? 0.5 : 1,
                transition: "width 100ms linear",
                color: theme.pitchOn,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 8,
                  top: 4,
                  // Short blocks shrink the name to fit (VT323 glyphs are ~0.5 em wide).
                  font: `${labelSize(s, height, notation)}px/1 ${theme.fonts.hero}`,
                  whiteSpace: "nowrap",
                }}
              >
                {chordName(s.chord.root, s.chord.quality, notation)}
              </span>
              {degree && (
                <span
                  style={{
                    position: "absolute",
                    right: 6,
                    bottom: 2,
                    // VT323, not the all-caps label face: I and i must differ.
                    font: `20px/1 ${theme.fonts.hero}`,
                  }}
                >
                  {degree.numeral}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
