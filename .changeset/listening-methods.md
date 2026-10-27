---
"@audiolab/core": minor
"@audiolab/react": minor
---

Opt-in listening methods for every detector, the originals staying the defaults (measured in
docs/POC-METHODS.md and docs/BENCHMARKS.md):

- Onsets: `OnsetPipeline` / `OnsetDetector` / `useOnsetAnalysis` take `method: "classic" | "sensitive" |
"superflux-complex"` (`ONSET_METHODS`, `onsetMethodPreset`, `SuperFluxComplexOdf`).
- Tempo: `TempoAnalyzer` / `useTempoAnalysis` / `FftTab` take `method: "envelope" | "flux"` (spectral-flux
  novelty, autocorrelation, tempo prior; `TEMPO_FLUX_DEFAULTS`).
- Chords: `chromaMethod: "cqt"` (`CqtChroma`), fed by `TonalityEngine.pushTimeDomain` /
  `processTimeDomain`; `startLiveAnalysis` attaches a 32768-sample time analyser on demand.
- Key: `keyMethod: "chords"` on `TonalityEngine` / `useTonality` (the chords found vote for their keys).
- Pitch: `PyinTracker` (pYIN) and `CrepeTracker` / `CrepePitch` / `loadCrepeModel` (CREPE tiny in plain
  TypeScript, MIT weights), and `usePitch({ method: "mpm" | "pyin" | "crepe", crepeModelUrl })`.
- Note models: `NoteModelChords`, `NoteModelRunner`, `transcribeNotes` (Basic Pitch windowing, notes →
  chords, any runtime plugged in) and `useNoteModelChords`.
- `ChordView`: `windowSeconds` is optional (no window label for methods without a fixed window);
  `qualityMode` is exported.
