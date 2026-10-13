---
"@audiolab/core": minor
"@audiolab/react": minor
---

First release of the SDK extracted from the AudioLab app.

- `@audiolab/core`: framework-free DSP (chroma, key, chord, tempo, FFT,
  filters), the `TonalityEngine` and `TempoAnalyzer`, the Web Audio adapters
  (microphone session, analyser polling, gapless sample capture with an
  AudioWorklet shipped as a Blob-loaded string) and the settings defaults;
  the Node-only file pipeline under `@audiolab/core/offline`.
- `@audiolab/react`: `LoupeRoot`, the hooks (`useMicrophone`, `useTonality`,
  `useTempoAnalysis`, `useConfirmedDetection`), the detector and FFT views,
  canvas plots, controls, the chord game and Wolf Jumper, with the Loupe
  styles scoped under `.loupe` (`styles.css`) and optional self-hosted fonts
  (`fonts.css`).
