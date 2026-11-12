"use client";

/**
 * The song's key, large: tonic name, mode word in the mode's colour, the
 * English short name, and a 12-cell gauge of how settled the key is. While
 * the settler hesitates the runner-up is named ("or G major"); while it
 * listens, three dots. Nothing here claims a percentage of certainty: the
 * gauge is the vote share of the last seconds.
 */

import { memo } from "react";

import type { KeyReading } from "@audiolab/core";

import { keyShortName, modeName, noteName, type Notation } from "../names";
import { STAGE_THEME, modeColour, type StageTheme } from "../theme";
import { outlined } from "./outlined";
import { Plate } from "./Plate";

export interface KeyPlateProps {
  reading: KeyReading;
  /** Main notation; "both" shows the other one small. Default "both" (French first). */
  notation?: Notation | "both";
  width?: number;
  /** Size of the tonic name in px. Default 112. */
  size?: number;
  theme?: StageTheme;
}

const WORDS = {
  fr: { label: "Tonalité", or: "ou", listening: "À l'écoute" },
  en: { label: "Key", or: "or", listening: "Listening" },
};

export const KeyPlate = memo(function KeyPlate({
  reading,
  notation = "both",
  width = 528,
  size = 112,
  theme = STAGE_THEME,
}: KeyPlateProps) {
  const main: Notation = notation === "en" ? "en" : "fr";
  const words = WORDS[main];
  const key = reading.key;
  const settled = reading.phase === "settled";
  const lit = Math.round(reading.stability * 12);
  const accent = key ? modeColour(theme, key.mode) : theme.plateBorder;

  return (
    <Plate
      label={words.label}
      accent={settled ? accent : key ? `${accent}80` : theme.plateBorder}
      corners={key?.mode === "min" ? "bevel" : "notch"}
      width={width}
      theme={theme}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          marginTop: 4,
          minHeight: size,
          opacity: settled || !key ? 1 : 0.75,
          transition: "opacity 300ms linear",
        }}
      >
        {key ? (
          <>
            <span style={outlined(size, theme.ink, theme.fonts.hero)}>
              {noteName(key.tonic, main)}
            </span>
            <span style={outlined(Math.round(size * 0.57), accent, theme.fonts.hero)}>
              {modeName(key.mode, main)}
            </span>
            {notation === "both" && (
              <span
                style={{
                  marginLeft: "auto",
                  font: `28px ${theme.fonts.mono}`,
                  color: theme.inkMuted,
                }}
              >
                {keyShortName(key.tonic, key.mode, "en")}
              </span>
            )}
          </>
        ) : (
          <span style={outlined(size, theme.inkFaint, theme.fonts.hero)}>· · ·</span>
        )}
      </div>
      <div
        style={{
          font: `24px ${theme.fonts.mono}`,
          color: theme.inkMuted,
          minHeight: 32,
        }}
      >
        {reading.phase === "hesitant" && reading.runnerUp
          ? `${words.or} ${noteName(reading.runnerUp.tonic, main)} ${modeName(reading.runnerUp.mode, main)}`
          : !key
            ? words.listening
            : ""}
      </div>
      <div aria-hidden style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            style={{
              width: 16,
              height: 8,
              background: key && i < lit ? theme.pitchBright[key.tonic] : theme.shadeLine,
              transition: "background-color 200ms linear",
            }}
          />
        ))}
      </div>
    </Plate>
  );
});
