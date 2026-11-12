"use client";

/**
 * The song's key, large: tonic name, mode word in the mode's colour, the
 * English short name, and a 12-cell gauge of how settled the key is. While
 * the settler hesitates the runner-up is named ("or G major"); while it
 * listens, three dots. Nothing here claims a percentage of certainty: the
 * gauge is the vote share of the last seconds.
 */

import { memo } from "react";

import { relativeKey, type KeyReading, type TempoEstimate } from "@audiolab/core";

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
  /** Tempo shown with the key (BPM, when confident). */
  tempo?: TempoEstimate | null;
  /** "Live" light: lit while the input is playing. Hidden when undefined. */
  live?: boolean;
  /** One line (tonic, mode, BPM), no label, runner-up or gauge: for a corner chip. */
  compact?: boolean;
  theme?: StageTheme;
}

const WORDS = {
  fr: { label: "Tonalité", or: "ou", listening: "À l'écoute", relative: "relatif :" },
  en: { label: "Key", or: "or", listening: "Listening", relative: "relative:" },
};

export const KeyPlate = memo(function KeyPlate({
  reading,
  notation = "both",
  width = 528,
  size = 112,
  tempo,
  live,
  compact = false,
  theme = STAGE_THEME,
}: KeyPlateProps) {
  const main: Notation = notation === "en" ? "en" : "fr";
  const words = WORDS[main];
  const key = reading.key;
  const settled = reading.phase === "settled";
  const lit = Math.round(reading.stability * 12);
  const accent = key ? modeColour(theme, key.mode) : theme.plateBorder;
  const bpm = tempo && tempo.confidence >= 0.5 ? Math.round(tempo.bpm) : null;
  // The relative key is always shown: same notes, and the safer half of the answer.
  const rel = key ? relativeKey(key.tonic, key.mode) : null;
  const relName = rel ? `${noteName(rel.tonic, main)} ${modeName(rel.mode, main)}` : "";
  const status =
    live === undefined && bpm === null ? null : (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginLeft: "auto",
          font: `24px ${theme.fonts.mono}`,
          color: theme.inkMuted,
          whiteSpace: "nowrap",
        }}
      >
        {bpm !== null && `${bpm} BPM`}
        {live !== undefined && (
          <span
            aria-label={live ? "live" : "idle"}
            style={{
              width: 12,
              height: 12,
              background: live ? theme.good : theme.shadeLine,
              transition: "background-color 300ms linear",
            }}
          />
        )}
      </span>
    );

  if (compact) {
    return (
      <Plate
        accent={accent}
        corners={key?.mode === "min" ? "bevel" : "notch"}
        width={width}
        theme={theme}
        style={{ padding: "8px 16px 8px 24px" }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          {key ? (
            <>
              <span style={outlined(size, theme.ink, theme.fonts.hero)}>
                {noteName(key.tonic, main)}
              </span>
              <span style={outlined(Math.round(size * 0.6), accent, theme.fonts.hero)}>
                {modeName(key.mode, main)}
              </span>
              <span style={{ font: `20px ${theme.fonts.mono}`, color: theme.inkMuted }}>
                / {relName}
              </span>
            </>
          ) : (
            <span style={outlined(size, theme.inkFaint, theme.fonts.hero)}>· · ·</span>
          )}
          {status}
        </div>
      </Plate>
    );
  }

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
            {notation === "both" && !status && (
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
            {status}
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
        {!key
          ? words.listening
          : reading.phase === "hesitant" &&
              reading.runnerUp &&
              !(reading.runnerUp.tonic === rel?.tonic && reading.runnerUp.mode === rel?.mode)
            ? `${words.or} ${noteName(reading.runnerUp.tonic, main)} ${modeName(reading.runnerUp.mode, main)}`
            : `${words.relative} ${relName}`}
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
