---
"@audiolab/core": minor
"@audiolab/react": minor
---

Play-along without React, and Tone.js contexts.

- `attachPlayAlong(analysis, notes, { endTime, … })` in `@audiolab/core/rhythm` runs a whole
  exercise on a live onset analysis: `results`, `onsets`, `roundTripMs`, `biasMs`, a `finished`
  promise, `subscribe` (results, round trip, done), `finish()` and `stop()`. No timer; it
  detaches when it ends. `usePlayAlong` now runs on it.
- `startOnsetAnalysis` takes `historySeconds` (keeps a `StreamHistory`, exposed as `history`),
  exposes `sampleRate` and `subscribeBatch` (after each batch, once its onsets are delivered).
- `nativeAudioContext(ctx)` unwraps Tone.js' standardized-audio-context wrapper. On the wrapper
  the AudioWorklet capture cannot start and fell back silently to estimated timing;
  `startSampleCapture` now warns once when that happens.
- Notation gives keys, not labels: `NoteFigure.id` (`FigureId`: "whole" … "sixteenth"); the
  English names moved to `@audiolab/react` (`FIGURE_NAMES_EN`, `figureLabel`, `StaffNotation
figureWords`).
