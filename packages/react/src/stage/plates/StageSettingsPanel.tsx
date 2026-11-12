"use client";

/**
 * Live settings of a stage (`StageSettings`): one labelled slider per
 * numeric setting, from `STAGE_SETTING_RANGES`, and the chord source. Drawn
 * as a stage plate (inline styles, no Loupe stylesheet), so it can sit on
 * the overlay itself, in an OBS dock, or in a lab page. Controlled: the host
 * keeps the settings (and decides whether to store or share them).
 */

import { memo, useId } from "react";

import {
  DEFAULT_STAGE_SETTINGS,
  STAGE_KEY_WINDOWS,
  STAGE_SETTING_RANGES,
  type NumericStageSetting,
  type StageSettings,
} from "@audiolab/core";

import type { Notation } from "../names";
import { STAGE_THEME, type StageTheme } from "../theme";
import { Plate } from "./Plate";

export interface StageSettingsPanelProps {
  settings: StageSettings;
  onChange: (next: StageSettings) => void;
  notation?: Notation;
  width?: number;
  theme?: StageTheme;
}

interface Row {
  key: NumericStageSetting;
  fr: string;
  en: string;
  /** Value as shown next to the slider. */
  format: (v: number, fr: boolean) => string;
}

const seconds = (v: number) => `${v} s`;

const ROWS: readonly Row[] = [
  { key: "chordWindowSeconds", fr: "Fenêtre des accords", en: "Chord window", format: seconds },
  {
    key: "chordHoldSeconds",
    fr: "Tenue avant changement",
    en: "Hold before a change",
    format: seconds,
  },
  {
    key: "chordMinMargin",
    fr: "Marge du meilleur accord",
    en: "Best chord margin",
    format: (v) => v.toFixed(2),
  },
  {
    key: "songBreakSeconds",
    fr: "Silence de fin de morceau",
    en: "Silence ending a song",
    format: (v, fr) => (v === 0 ? (fr ? "jamais" : "never") : `${v} s`),
  },
  {
    key: "gateStrictness",
    fr: "Seuil de jeu (doux → strict)",
    en: "Playing gate (gentle → strict)",
    format: (v) => `${Math.round(v * 100)} %`,
  },
  {
    key: "noteClarity",
    fr: "Netteté des notes",
    en: "Note clarity",
    format: (v) => `${Math.round(v * 100)} %`,
  },
  {
    key: "vibratoMinCents",
    fr: "Vibrato minimal",
    en: "Smallest vibrato",
    format: (v) => `±${v} ¢`,
  },
];

export const StageSettingsPanel = memo(function StageSettingsPanel({
  settings,
  onChange,
  notation = "fr",
  width = 528,
  theme = STAGE_THEME,
}: StageSettingsPanelProps) {
  const fr = notation === "fr";
  const idPrefix = useId();
  const label = { font: `20px ${theme.fonts.hero}`, color: theme.inkMuted } as const;
  const value = {
    font: `20px ${theme.fonts.mono}`,
    color: theme.ink,
    minWidth: 88,
    textAlign: "right",
  } as const;
  const set = (patch: Partial<StageSettings>) => onChange({ ...settings, ...patch });
  const choice = (on: boolean) =>
    ({
      font: `20px ${theme.fonts.hero}`,
      padding: "2px 12px",
      border: `2px solid ${theme.plateBorder}`,
      background: on ? theme.major : "transparent",
      color: on ? theme.pitchOn : theme.ink,
      cursor: "pointer",
    }) as const;

  return (
    <Plate label={fr ? "Réglages" : "Settings"} width={width} theme={theme}>
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {ROWS.map((row) => {
          const range = STAGE_SETTING_RANGES[row.key];
          const id = `${idPrefix}-${row.key}`;
          return (
            <div key={row.key} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4 }}>
              <label htmlFor={id} style={label}>
                {fr ? row.fr : row.en}
              </label>
              <span style={value}>{row.format(settings[row.key], fr)}</span>
              <input
                id={id}
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={settings[row.key]}
                onChange={(e) => set({ [row.key]: Number(e.target.value) })}
                style={{ gridColumn: "1 / -1", accentColor: theme.major, width: "100%" }}
              />
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={label}>{fr ? "Tonalité : moyenne des" : "Key: average of the last"}</span>
          {STAGE_KEY_WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={settings.songSeconds === w}
              onClick={() => set({ songSeconds: w })}
              style={choice(settings.songSeconds === w)}
            >
              {w} s
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={label}>{fr ? "Accords lus sur" : "Chords read from"}</span>
          {(["harmony", "notes"] as const).map((source) => (
            <button
              key={source}
              type="button"
              aria-pressed={settings.chordSource === source}
              onClick={() => set({ chordSource: source })}
              style={{
                font: `20px ${theme.fonts.hero}`,
                padding: "2px 12px",
                border: `2px solid ${theme.plateBorder}`,
                background: settings.chordSource === source ? theme.major : "transparent",
                color: settings.chordSource === source ? theme.pitchOn : theme.ink,
                cursor: "pointer",
              }}
            >
              {source === "harmony"
                ? fr
                  ? "le mix"
                  : "the mix"
                : fr
                  ? "l'instrument"
                  : "the instrument"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_STAGE_SETTINGS })}
            style={{
              marginLeft: "auto",
              font: `16px ${theme.fonts.label}`,
              padding: "4px 10px",
              border: `2px solid ${theme.plateBorder}`,
              background: "transparent",
              color: theme.inkMuted,
              cursor: "pointer",
            }}
          >
            {fr ? "Défauts" : "Defaults"}
          </button>
        </div>
      </div>
    </Plate>
  );
});
