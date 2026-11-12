---
"@audiolab/core": minor
"@audiolab/react": minor
---

Stream visuals. Core: display readouts (`KeySettler` settles the key with hysteresis and modulation detection, `ChordChangeTracker` turns the chord ranking into debounced changes and a timed history, `BeatClock` derives a beat phase from the tempo and the onsets, `SongBreak` ends a song after a long silence, `chordDegree` / `scaleDegree` / `keyPitchClasses` / `fifthsIndex` name harmony in a key) and `startSignalTap`, a small smoothed analyser for display-rate reads. React: `useSignalTap`, and the new `@audiolab/react/stage` entry for an OBS browser source or a stage screen: `useStageSignals` gathers key, chords, note, tempo, attacks and taps from one or two sessions; `KeyPlate`, `ChordPlate`, `TunerPlate` and `ChordRibbon` show the readings; `StageCanvas` and the canvas visuals draw pixel-art cells that survive stream compression, with their own literal theme on a transparent page.
