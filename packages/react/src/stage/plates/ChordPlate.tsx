"use client";

/**
 * The current chord: the root in its pitch colour, the quality as an
 * exponent, and its degree in the song's key (roman numeral: amber when
 * diatonic, coral when borrowed or chromatic). A close runner-up is named
 * underneath. On each change the plate flashes its root's dark tint and the
 * value pops in; during silence it dims.
 */

import { memo } from "react";

import { chordDegree, type ChordReading, type KeyRef } from "@audiolab/core";

import { chordName, chordSuffix, noteName, type Notation } from "../names";
import { STAGE_THEME, type StageTheme } from "../theme";
import { outlined } from "./outlined";
import { Plate } from "./Plate";

export interface ChordPlateProps {
  reading: ChordReading;
  /** The song's key, for the roman numeral; none when null. */
  songKey: KeyRef | null;
  notation?: Notation | "both";
  width?: number;
  /** Size of the root name in px. Default 128. */
  size?: number;
  theme?: StageTheme;
}

const POP = `@keyframes al-stage-pop { 0% { transform: scale(1.15); } 100% { transform: scale(1); } }
@keyframes al-stage-flash { 0% { opacity: 1; } 100% { opacity: 0; } }`;

export const ChordPlate = memo(function ChordPlate({
  reading,
  songKey,
  notation = "both",
  width = 528,
  size = 128,
  theme = STAGE_THEME,
}: ChordPlateProps) {
  const main: Notation = notation === "en" ? "en" : "fr";
  const chord = reading.current;
  const degree =
    chord && songKey ? chordDegree(chord.root, chord.quality, songKey.tonic, songKey.mode) : null;
  const changes =
    reading.history.length > 0 ? reading.history[reading.history.length - 1].start : 0;

  return (
    <Plate label={main === "fr" ? "Accord" : "Chord"} width={width} theme={theme}>
      <style>{POP}</style>
      {chord && (
        <span
          key={`flash-${changes}`}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: theme.pitchDark[chord.root],
            animation: "al-stage-flash 400ms linear forwards",
            zIndex: -1,
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 24,
          minHeight: size,
          opacity: reading.silent ? 0.35 : 1,
          transition: "opacity 300ms linear",
        }}
      >
        {chord ? (
          <span
            key={`pop-${changes}`}
            style={{
              display: "inline-flex",
              alignItems: "flex-start",
              transformOrigin: "left bottom",
              animation: "al-stage-pop 200ms cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            <span style={outlined(size, theme.pitchBright[chord.root], theme.fonts.hero)}>
              {noteName(chord.root, main)}
            </span>
            <span style={outlined(Math.round(size * 0.5), theme.ink, theme.fonts.hero)}>
              {chordSuffix(chord.quality)}
            </span>
          </span>
        ) : (
          <span style={outlined(size, theme.inkFaint, theme.fonts.hero)}>—</span>
        )}
        {degree && (
          <span
            style={{
              // Long numerals ("VImaj7") get smaller so they stay in the plate.
              ...outlined(
                Math.round(size * (degree.numeral.length > 3 ? 0.4 : 0.55)),
                degree.diatonic ? theme.major : theme.bad,
                theme.fonts.hero,
              ),
              marginLeft: "auto",
            }}
          >
            {degree.numeral}
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          minHeight: 28,
          font: `24px ${theme.fonts.mono}`,
          color: theme.inkFaint,
        }}
      >
        {chord && notation === "both" && (
          <span style={{ color: theme.inkMuted }}>
            {chordName(chord.root, chord.quality, "en")}
          </span>
        )}
        {reading.runnerUp && (
          <span>
            {main === "fr" ? "ou" : "or"}{" "}
            {chordName(reading.runnerUp.root, reading.runnerUp.quality, main)}
          </span>
        )}
      </div>
    </Plate>
  );
});
