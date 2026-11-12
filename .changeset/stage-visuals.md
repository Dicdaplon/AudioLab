---
"@audiolab/core": minor
"@audiolab/react": minor
---

Stream visuals. Core: display readouts (`KeySettler` settles the key with hysteresis and modulation detection, `ChordChangeTracker` turns the chord ranking into debounced changes and a timed history, `BeatClock` derives a beat phase from the tempo and the onsets, `SongBreak` ends a song after a long silence, `chordDegree` / `scaleDegree` / `keyPitchClasses` / `fifthsIndex` name harmony in a key) and `startSignalTap`, a small smoothed analyser for display-rate reads. React: `useSignalTap`, and the new `@audiolab/react/stage` entry for an OBS browser source or a stage screen: `useStageSignals` gathers key, chords, note, tempo, attacks and taps from one or two sessions; `KeyPlate`, `ChordPlate`, `TunerPlate` and `ChordRibbon` show the readings; `StageCanvas` and the canvas visuals draw pixel-art cells that survive stream compression, with their own literal theme on a transparent page.

Adaptive levels (`AdaptiveLevel`: an adaptive noise gate plus a peak-following ceiling) drive the stage's silence, meter, city and embers instead of fixed dB thresholds; `useStageSignals` can read the chords from the instrument's session (`settings.chordSource`); `AttackField` answers strong attacks with embers and a stepped edge glow.

`GuitarTimeline` shows the played notes as a scrolling tablature with the chords above it, from the new `NoteSegmenter` (pitch estimates to timed notes) and `FretPlacer` (a plausible string and fret, keeping a hand position and starting in the key's pentatonic box); `useStageSignals` exposes the segments as `notes` and a `playing` flag; `KeyPlate` can show the tempo, a live light and a compact one-line form; `ChordShockwave` can drop its text stamp.

Live settings: `StageSettings` (chord window, key window, playing gate, chord hold and margin, song break, note clarity, smallest vibrato, chord source) with `DEFAULT_STAGE_SETTINGS`, `STAGE_SETTING_RANGES` and `normalizeStageSettings`; `useStageSignals({ settings })` applies them in place (the trackers gained `configure()`), and `StageSettingsPanel` edits them. Vibrato: `VibratoDetector` (rate and width of a held note's pitch oscillation), carried by every `NoteSegment` and shown by `TunerPlate` and `GuitarTimeline`. `StageBackdrop`: an opaque pixel night landscape for a stream whose overlay is the only layer, with a framed webcam hole.

Bends: `NoteSegmenter` follows the pitch continuously, tells a bend (a glide that climbs at least 70 cents without stepping back) from a vibrato, a hammer-on or a slide, and reports it on the note (`bend`); `TunerPlate` and `GuitarTimeline` show it in tones (`bendAmount`, `bendLabel`). `GuitarTimeline` gains a staff view (`view: "staff"`). `WolfBuddy` is a pixel wolf mascot with poses and a few dozen context-aware lines (`WolfBrain`, `WOLF_PHRASES`); `SpectrumCity` can hide its own wolf.

`WolfBuddy` can live on a `SpectrumCity` (`roofline`, `area`): it walks the roofs, climbs, hides behind the bass or treble building, falls off when the player hits hard and climbs back (`wolf/roam.ts`, `WOLF_ROAM_DEFAULTS`). Bends are read in both directions, vibrato within ~0.2 s, and `combineKeyRankings` / `relativeKey` blend the key detectors and name the relative key, which `KeyPlate` always shows.

`CrtScreen` frames a webcam behind the overlay as an old pixel monitor (rounded screen, scanlines, reflections, a rolling band, brand and power light); `StageBackdrop` can drop its own frame. `GuitarTimeline` with `labels: "names"` on the staff view draws name pills at the notes' staff positions.

`TempoSmoother` steadies the tempo with a decaying vote across the analyser's readings (docs/POC-METHODS.md §5–6), feeding the beat clock and the stage; `GuitarTimeline` shows it discreetly above the staff. The key window is a choice of 15, 30 or 60 s (`STAGE_KEY_WINDOWS`, default 30). `CrtScreen` keeps the webcam's square corners, with a heavier casing and occasional glass events (glare, flicker, glitch).

`CrtScreen` gains `look` (`CRT_LOOKS`: clean, dark, aged, fallout, worn): darker or yellowed edges, phosphor tints, heavier scanlines; its glass events are slower and fade in and out.

`TempoSmoother` folds every reading into 60–150 BPM (halving or doubling) before it votes, so octave errors reinforce the right tempo. `noteValue` / `NOTE_VALUES` name the written value nearest to a note's length at the tempo; `GuitarTimeline` draws it under the staff (`values`).
