# @audiolab/react

React hooks, components, canvas plots and ear-training games on top of
[`@audiolab/core`](../core/README.md), styled by the Loupe design system. Part of
[AudioLab](https://github.com/Dicdaplon/AudioLab) — see it live at
<https://dicdaplon.github.io/AudioLab/>.

> Not published on npm yet. Until the first release, `npm pack` the packages into the
> host's vendor folder: see [docs/INTEGRATION.md](../../docs/INTEGRATION.md#8-developing-across-the-two-repositories).

```bash
npm install @audiolab/react @audiolab/core
# optional, for the self-hosted fonts (fonts.css):
npm install @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono @fontsource/source-serif-4
```

Peer dependencies: `react` and `react-dom` `^18.2 || ^19`. ESM only, declarations included.
Every module is a client module (`"use client"` is preserved in the build), so the package
can be imported from a Next.js App Router page.

## Minimal usage

```tsx
"use client";

import "@audiolab/react/styles.css"; // tokens + components, scoped under .loupe
import "@audiolab/react/fonts.css"; // optional

import { DEFAULT_DETECTOR_SETTINGS, type DetectorSettings } from "@audiolab/core";
import { DetectorTab, LoupeRoot, MicTransport, useMicrophone, useTonality } from "@audiolab/react";
import { useState } from "react";

export function KeyFinder() {
  const [settings, setSettings] = useState<DetectorSettings>(DEFAULT_DETECTOR_SETTINGS);
  const [colourByPitch, setColourByPitch] = useState(false);
  const microphone = useMicrophone();
  const tonality = useTonality(microphone.mic, settings);

  return (
    <LoupeRoot>
      <MicTransport
        state={microphone.running ? "live" : microphone.unsupported ? "unsupported" : "idle"}
        onStart={microphone.start}
        onStop={microphone.stop}
        onReset={tonality.reset}
      />
      <DetectorTab
        data={tonality}
        settings={settings}
        onSettingsChange={setSettings}
        colourByPitch={colourByPitch}
        onColourByPitchChange={setColourByPitch}
      />
    </LoupeRoot>
  );
}
```

## API overview

| Group    | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root     | `LoupeRoot` (renders the `.loupe` element every token and plot colour hangs on; `as`, `className` and any HTML attribute), `useLoupeRoot`, `LOUPE_ROOT_CLASS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Hooks    | `useMicrophone({ context?, stream? })` → `{ mic, running, starting, error, unsupported, start, stop }` (a host-owned context is never closed); `useTonality(mic, options)` → the `TonalityFrame` fields plus `fft` and `reset`; `useTempoAnalysis(mic, options)`; `usePitch(mic, { referenceA4?, updatesPerSecond? })` → `{ estimate, captureMethod }` for a tuner; `useOnsetAnalysis(mic, { onOnset?, onBatch?, strummed? })` → `{ snapshot, budget, analysis, history, captureMethod }` for rhythm exercises (see docs/TIMING.md); `useDisplayFramePeriod`; `useConfirmedDetection` (`stepConfirmation` re-exported from core) |
| Detector | `DetectorTab` (the whole bench), `Readout`, `RankList`, `ChromaBars`, `ChromaView`, `ChordView`, `KeyProbabilities`, `ToneBaseTonalityView`, `SettingsPanel`, `SettingsRail`, `Panel`, `Segments`                                                                                                                                                                                                                                                                                                                                                                                                                                |
| FFT      | `FftTab`, `FftSettingsPanel`, `SpectrumPlot`, `TempoPlot`, `TimeSignalPlot`, `PlotFigure`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Controls | `RangeField`, `SelectField`, `Switch`, `Icon`, `MicTransport`, `MicNotice`, `MicPrompt`, `TabBar` (+ `tabId` / `panelId`), `ThemeToggle`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Games    | `ChordGame` (`confirmations`, `minProbability`), `WolfJumper` (`config`: note pool, bonus chords, speeds, health; `detection`; `gate`: `"auto"` by default, `"manual"` for the slider), `CHORD_POOL_LABELS_EN`, `bonusTypeLabels`; the engines themselves are in `@audiolab/core/games`                                                                                                                                                                                                                                                                                                                                          |
| Theme    | `applyTheme`, `resolveTheme`, `readStoredTheme`, `systemTheme`, `isTheme`, `THEME_STORAGE_KEY`; `useVizTheme` / `readVizTheme` / `DEFAULT_VIZ_THEME` (canvas colours); `useMediaQuery`, `BREAKPOINTS`; `chordRows`, `keyRows`, `splitKeyName`                                                                                                                                                                                                                                                                                                                                                                                    |
| Art      | `@audiolab/react/art`: `WOLF_PATHS`, `WOLF_VIEWBOX`, `WOLF_TRANSFORM`, `WOLF_ASPECT` as plain data (no React, no CSS, no "use client")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Build    | `BUILD_INFO` (`version`, `commit` of the build)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

Prop types are reachable through `React.ComponentProps<typeof DetectorTab>`. Internals
(canvas helpers, stores) are not exported; the game engines, pools and the confirmation
step live in `@audiolab/core/games` so a host can build its own UI on them.

## Styling and theming

- `styles.css` defines every design token on the `.loupe` class (never on `:root`) with
  an `--al-` prefix (`--al-color-ink`, `--al-viz-signal`, `--al-sp-4`…), and every
  component class with an `al-` prefix (`al-panel`, `al-readout__value`…). Nothing
  reaches the host page; inside a `LoupeRoot` the subtree gets a box-sizing / margin
  reset and the Loupe font and colour.
- The theme contract is the host's: `<html data-theme="dark" | "light">` wins, otherwise
  the OS `prefers-color-scheme` (dark by default). The choice is persisted under
  `localStorage("theme")` by `applyTheme` / `ThemeToggle`. A host that already manages
  this attribute needs nothing else; the SDK follows it.
- Override tokens on the root: `.loupe { --al-color-accent: #c8a; }`. The `--al-viz-*`
  tokens must stay literal colours (no `var()`): the canvas plots read them with
  `getComputedStyle` on the nearest `LoupeRoot`.
- `fonts.css` only contains `@import "@fontsource/…"` lines; import it when the three
  font packages are installed, or let the tokens fall back to system fonts.

## Server rendering (Next.js App Router)

No module touches `window`, `document` or `localStorage` at import time, and the first
client render matches the server markup: media queries, the stored theme, the
microphone support check and the chord game's random target are all resolved in
effects. A page can be prerendered statically and hydrated without warnings; see
[docs/INTEGRATION.md](https://github.com/Dicdaplon/AudioLab/blob/main/docs/INTEGRATION.md)
for a complete Next.js setup.

## The AudioWorklet

`useTempoAnalysis` captures samples through an AudioWorklet that `@audiolab/core` ships as
a string and loads from a Blob URL, so no bundler configuration is needed. A strict CSP
must allow `blob:` scripts; otherwise capture silently falls back to AnalyserNode polling.

## License

MIT
