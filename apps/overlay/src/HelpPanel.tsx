/**
 * The overlay's help (H): every key, on a stage plate, shown together with
 * the diagnostics, so one key answers both "what can I do?" and "what does
 * the overlay hear?".
 */

import { Plate, STAGE_THEME } from "@audiolab/react/stage";

import { DISPLAY_KEYS } from "./useDisplayPrefs";

const ACTIONS = {
  fr: [
    ["H", "aide et diagnostic"],
    ["S", "réglages (fenêtres, seuils, vibrato…)"],
    ["R", "nouveau morceau : tonalité et accords à zéro"],
    ["C", "accords lus sur l'instrument / sur le mix"],
    ["D", "diagnostic seul"],
  ],
  en: [
    ["H", "help and diagnostics"],
    ["S", "settings (windows, thresholds, vibrato…)"],
    ["R", "new song: key and chords start over"],
    ["C", "chords from the instrument / from the mix"],
    ["D", "diagnostics only"],
  ],
} as const;

export function HelpPanel({ notation }: { notation: "fr" | "en" }) {
  const t = STAGE_THEME;
  const fr = notation === "fr";
  const row = { display: "grid", gridTemplateColumns: "40px 1fr", gap: 12 } as const;
  const keyStyle = { color: t.major } as const;
  return (
    <Plate label={fr ? "Aide" : "Help"} width={1040}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 40,
          rowGap: 6,
          marginTop: 12,
          font: `22px ${t.fonts.hero}`,
        }}
      >
        <div style={{ display: "grid", gap: 6, alignContent: "start" }}>
          {ACTIONS[notation].map(([key, what]) => (
            <div key={key} style={row}>
              <span style={keyStyle}>{key}</span>
              <span style={{ color: t.ink }}>{what}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 6, alignContent: "start" }}>
          {Object.entries(DISPLAY_KEYS).map(([key, what]) => (
            <div key={key} style={row}>
              <span style={keyStyle}>{key}</span>
              <span style={{ color: t.inkMuted }}>{fr ? what.fr : what.en}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ color: t.inkFaint, font: `18px ${t.fonts.mono}`, marginTop: 12 }}>
        {fr
          ? "OBS : clic droit sur la source › Interagir, puis la touche. Les choix sont mémorisés. Dock de réglages : ?view=settings"
          : "OBS: right-click the source › Interact, then the key. Choices are remembered. Settings dock: ?view=settings"}
      </div>
    </Plate>
  );
}
