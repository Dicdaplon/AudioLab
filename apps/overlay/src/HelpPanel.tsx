/**
 * The overlay's help (H): every key and the most useful URL parameters, on
 * a stage plate. Shown together with the debug panel, so one key answers
 * both "what can I do?" and "what does the overlay hear?".
 */

import { Plate, STAGE_THEME } from "@audiolab/react/stage";

const KEYS = {
  fr: [
    ["H", "aide et infos de diagnostic"],
    ["S", "réglages (fenêtres, seuils, vibrato…)"],
    ["R", "nouveau morceau : tonalité et accords à zéro"],
    ["D", "infos de diagnostic seules"],
  ],
  en: [
    ["H", "help and diagnostics"],
    ["S", "settings (windows, thresholds, vibrato…)"],
    ["R", "new song: key and chords start over"],
    ["D", "diagnostics only"],
  ],
} as const;

const PARAMS = {
  fr: [
    ["layout=", "cam · scene · band"],
    ["tab=", "frets · names · staff (portée)"],
    ["extras=", "mandala, paws, embers, aurora, scope, ribbon"],
    ["backdrop=", "night · plain · off"],
    ["chords=", "notes (instrument) · harmony (mix)"],
    ["view=settings", "réglages seuls, pour un dock OBS"],
  ],
  en: [
    ["layout=", "cam · scene · band"],
    ["tab=", "frets · names · staff"],
    ["extras=", "mandala, paws, embers, aurora, scope, ribbon"],
    ["backdrop=", "night · plain · off"],
    ["chords=", "notes (instrument) · harmony (mix)"],
    ["view=settings", "settings alone, for an OBS dock"],
  ],
} as const;

export function HelpPanel({ notation }: { notation: "fr" | "en" }) {
  const t = STAGE_THEME;
  const fr = notation === "fr";
  const row = { display: "grid", gridTemplateColumns: "150px 1fr", gap: 12 } as const;
  return (
    <Plate label={fr ? "Aide" : "Help"} width={720}>
      <div style={{ display: "grid", gap: 8, marginTop: 12, font: `22px ${t.fonts.hero}` }}>
        {KEYS[notation].map(([key, what]) => (
          <div key={key} style={row}>
            <span style={{ color: t.major }}>{key}</span>
            <span style={{ color: t.ink }}>{what}</span>
          </div>
        ))}
        <div style={{ color: t.inkMuted, font: `16px ${t.fonts.label}`, marginTop: 8 }}>
          {fr ? "Dans l'adresse" : "In the URL"}
        </div>
        {PARAMS[notation].map(([param, what]) => (
          <div key={param} style={row}>
            <span style={{ color: t.signal, font: `18px ${t.fonts.mono}` }}>{param}</span>
            <span style={{ color: t.inkMuted }}>{what}</span>
          </div>
        ))}
        <div style={{ color: t.inkFaint, font: `18px ${t.fonts.mono}`, marginTop: 8 }}>
          {fr
            ? "OBS : clic droit sur la source › Interagir, puis la touche."
            : "OBS: right-click the source › Interact, then the key."}
        </div>
      </div>
    </Plate>
  );
}
