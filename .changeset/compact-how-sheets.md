---
"@audiolab/react": minor
---

Compact "How?" sheets for the small windows. `HowPanel` takes `compact`; `Panel`,
`ChromaView`, `ChordView`, `KeyProbabilities`, `ToneBaseTonalityView` and
`SettingsPanel` take a `how` node (a panel with a sheet drops its technical hint);
`DetectorTab` takes `how: DetectorHow`, one slot per window. `FftTab` takes
`view: "all" | "spectrum" | "tempo"` to show one half, and a `how` per half; the tempo
capture only runs while the tempo half is shown. The chord list hint no longer claims
24 templates when extended qualities are on.

An opt-in pixel skin: put `al-pixel` on an ancestor of the Loupe root for notched
corners, square LEDs and switches, block chevrons and stepped game motion (new tokens
`--al-font-pixel`, `--al-font-pixel-micro`, falling back to the mono). Without the
class nothing changes, except the select chevron, which shows again (its SVG namespace
was broken).
