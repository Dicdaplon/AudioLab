"use client";

/**
 * The played note: its name in its pitch colour with the octave, its degree
 * in the song's key (or "out of key"), and a 25-cell cents ruler with a
 * gliding needle. In tune (±5 ¢ held 300 ms) lights the centre in green
 * and stays lit, never blinks. On silence the last note fades for 1.5 s,
 * then a dash.
 */

import { memo, useEffect, useRef, useState } from "react";

import {
  scaleDegree,
  type BendReading,
  type KeyRef,
  type PitchEstimate,
  type VibratoReading,
} from "@audiolab/core";

import { bendLabel, noteName, type Notation } from "../names";
import { STAGE_THEME, type StageTheme } from "../theme";
import { outlined } from "./outlined";
import { Plate } from "./Plate";

export interface TunerPlateProps {
  note: PitchEstimate | null;
  songKey: KeyRef | null;
  /** Vibrato of the held note: shown with its rate and width when active. */
  vibrato?: VibratoReading;
  /** Bend of the held note: shown (in tones, guitar style) while it is up. */
  bend?: BendReading | null;
  notation?: Notation | "both";
  width?: number;
  /** Size of the note name in px. Default 96. */
  size?: number;
  theme?: StageTheme;
}

const CELLS = 25;

const HOLD_MS = 1500;
const IN_TUNE_MS = 300;

function cellColour(cents: number, theme: StageTheme): string {
  const a = Math.abs(cents);
  return a <= 5 ? theme.good : a <= 15 ? theme.warn : theme.bad;
}

export const TunerPlate = memo(function TunerPlate({
  note,
  songKey,
  vibrato,
  bend,
  notation = "both",
  width = 528,
  size = 96,
  theme = STAGE_THEME,
}: TunerPlateProps) {
  const main: Notation = notation === "en" ? "en" : "fr";
  // Keep the last note through short gaps.
  const [held, setHeld] = useState<{ note: PitchEstimate; fresh: boolean } | null>(null);
  const inTuneSince = useRef<number | null>(null);
  const [inTune, setInTune] = useState(false);

  useEffect(() => {
    if (note) {
      setHeld({ note, fresh: true });
      const now = performance.now();
      if (Math.abs(note.cents) <= 5) {
        inTuneSince.current ??= now;
        if (now - inTuneSince.current >= IN_TUNE_MS) setInTune(true);
      } else {
        inTuneSince.current = null;
        setInTune(false);
      }
      return;
    }
    inTuneSince.current = null;
    setInTune(false);
    setHeld((h) => (h ? { ...h, fresh: false } : h));
    const timer = setTimeout(() => setHeld(null), HOLD_MS);
    return () => clearTimeout(timer);
  }, [note]);

  const shown = held?.note ?? null;
  const cents = shown ? Math.max(-50, Math.min(50, shown.cents)) : 0;
  const degree =
    shown && songKey ? scaleDegree(shown.pitchClass, songKey.tonic, songKey.mode) : null;
  const octave = shown ? Math.floor(shown.midi / 12) - 1 : 0;
  const centre = (CELLS - 1) / 2;
  const valueCell = centre + (cents / 50) * centre;

  return (
    <Plate label={main === "fr" ? "Note" : "Note"} width={width} theme={theme}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, minHeight: size }}>
        <span style={{ minWidth: size * 1.6, opacity: held?.fresh === false ? 0.3 : 1 }}>
          {shown ? (
            <>
              <span style={outlined(size, theme.pitchBright[shown.pitchClass], theme.fonts.hero)}>
                {noteName(shown.pitchClass, main)}
              </span>
              <sub style={outlined(Math.round(size * 0.4), theme.inkMuted, theme.fonts.hero)}>
                {octave}
              </sub>
            </>
          ) : (
            <span style={outlined(size, theme.inkFaint, theme.fonts.hero)}>—</span>
          )}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              font: `16px ${theme.fonts.label}`,
              color: degree === null && shown && songKey ? theme.bad : theme.inkMuted,
              textTransform: "uppercase",
              minHeight: 20,
            }}
          >
            {!shown || !songKey
              ? ""
              : degree === null
                ? main === "fr"
                  ? "Hors gamme"
                  : "Out of key"
                : `${main === "fr" ? "Degré" : "Degree"} ${degree}`}
            {inTune && (
              <span style={{ float: "right", color: theme.good }}>
                {main === "fr" ? "Juste" : "In tune"}
              </span>
            )}
          </div>
          <div
            aria-hidden
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 4,
              height: 48,
            }}
          >
            {Array.from({ length: CELLS }, (_, i) => {
              const lit =
                shown &&
                (i - centre) * (valueCell - centre) >= 0 &&
                Math.abs(i - centre) <= Math.abs(valueCell - centre);
              const isCentre = i === centre;
              return (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: isCentre ? 48 : 24,
                    background: isCentre
                      ? inTune
                        ? theme.good
                        : theme.shade
                      : lit
                        ? cellColour(cents, theme)
                        : theme.shadeLine,
                    outline: isCentre ? `2px solid ${theme.inkMuted}` : undefined,
                  }}
                />
              );
            })}
            {shown && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  width: 8,
                  height: 56,
                  marginLeft: -4,
                  left: `${((valueCell + 0.5) / CELLS) * 100}%`,
                  background: theme.ink,
                  outline: `2px solid ${theme.night}`,
                  transition: "left 80ms linear",
                }}
              />
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              font: `24px ${theme.fonts.mono}`,
              color: theme.inkMuted,
            }}
          >
            <span style={{ color: theme.signal }}>
              {bend && !bend.released && held?.fresh !== false ? (
                <>
                  <span style={{ font: `16px ${theme.fonts.label}` }}>BEND </span>
                  {`${bend.direction === "down" ? "↘" : "↗"} ${bendLabel(bend.current, main)}`}
                </>
              ) : (
                vibrato?.active &&
                held?.fresh !== false && (
                  <>
                    <span style={{ font: `16px ${theme.fonts.label}` }}>VIBRATO </span>
                    {`${vibrato.rateHz.toFixed(1)} Hz · ±${Math.round(vibrato.extentCents)} ¢`}
                  </>
                )
              )}
            </span>
            <span>{shown ? `${cents >= 0 ? "+" : ""}${Math.round(cents)} ¢` : ""}</span>
          </div>
        </div>
      </div>
    </Plate>
  );
});
