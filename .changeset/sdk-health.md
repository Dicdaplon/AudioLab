---
"@audiolab/core": minor
"@audiolab/react": minor
---

Public API housekeeping, all additive (every existing export and option still works):

- Method registries, in the pattern of `ONSET_METHODS`: `CHROMA_METHODS`, `KEY_METHODS`,
  `CHORD_SMOOTHINGS`, `TEMPO_METHODS`, `PITCH_METHODS`, each with its `DEFAULT_*` and `is*`
  guard; `CHORD_METHOD_PRESETS` (`classic`, `follow`, `sharper`, `cqt`) names the benchmarked
  chord methods as `TonalityEngine` options. `PitchMethod` now lives in core (`@audiolab/react`
  re-exports it).
- Framework-free pitch tracking: `createPitchTracker(method, options, crepeModel?)` returns a
  `LivePitchTracker` (MPM, pYIN or CREPE; "crepe" without a model runs MPM, its hop is never
  under 100 ms) and `loadCrepeModelCached(url)` fetches a model once per URL (a failed load is
  retried). `usePitch` is built on them and its state adds `activeMethod` and `modelError`, so
  the CREPE → MPM fallback is visible.
- Play-along labels: `noteLabeler` / `noteAfterOnset` take `method: "pyin" | "crepe"` (with
  `crepeModel`), `chordLabeler` / `chordAfterOnset` take `chromaMethod: "gaussian-log" | "cqt"`.
  Defaults unchanged.
- `TonalityEngine` accepts `filterTolerance` (`filterTolerancy` is deprecated, still honoured);
  its defaults are read from `ANALYSIS_DEFAULTS` / `DEFAULT_DETECTOR_SETTINGS` (same values).
- `@audiolab/core/games`: `wolfJumperReducer`, `WolfJumperState`, `WolfJumperAction`,
  `createWolfJumperState`; `gameReducer`, `GameState`, `GameAction` and `createInitialState`
  remain as deprecated aliases.
- The declarations no longer list the `@internal` weights of `CrepeModel`.
