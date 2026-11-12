---
"@audiolab/core": minor
"@audiolab/react": minor
---

Stream visuals. Core: display readouts (`KeySettler` settles the key with hysteresis and modulation detection, `ChordChangeTracker` turns the chord ranking into debounced changes and a timed history, `BeatClock` derives a beat phase from the tempo and the onsets, `SongBreak` ends a song after a long silence, `chordDegree` / `scaleDegree` / `keyPitchClasses` / `fifthsIndex` name harmony in a key) and `startSignalTap`, a small smoothed analyser for display-rate reads. React: `useSignalTap`, and the new `@audiolab/react/stage` entry for an OBS browser source or a stage screen: `useStageSignals` gathers key, chords, note, tempo, attacks and taps from one or two sessions; `KeyPlate`, `ChordPlate`, `TunerPlate` and `ChordRibbon` show the readings; `StageCanvas` and the canvas visuals draw pixel-art cells that survive stream compression, with their own literal theme on a transparent page.

Adaptive levels (`AdaptiveLevel`: an adaptive noise gate plus a peak-following ceiling) drive the stage's silence, meter, city and embers instead of fixed dB thresholds; `useStageSignals({ chords: "notes" })` reads the chords from the instrument's session; `AttackField` answers strong attacks with embers and a stepped edge glow.

`GuitarTimeline` shows the played notes as a scrolling tablature with the chords above it, from the new `NoteSegmenter` (pitch estimates to timed notes) and `FretPlacer` (a plausible string and fret, keeping a hand position and starting in the key's pentatonic box); `useStageSignals` exposes the segments as `notes` and a `playing` flag; `KeyPlate` can show the tempo, a live light and a compact one-line form; `ChordShockwave` can drop its text stamp.
