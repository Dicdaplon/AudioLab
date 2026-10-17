# @audiolab/core

## 0.2.0

### Minor Changes

- 44879ab: `BUILD_INFO: { version, commit }` is exported by both packages and stamped at build
  time, so a host can tell which version and git commit a packed tarball comes from.
- 3233c73: Chord qualities beyond major and minor.

  - `@audiolab/core`: `ChordQuality` adds `dom7`, `maj7`, `min7`, `sus2`, `sus4`, `maj6`,
    `min6`, `dim` and `min7b5`. They are opt-in: `detectChord(chroma, { qualities })` and
    `TonalityEngine({ chordQualities })`; without them the output is unchanged (24 triads).
    Chords with identical pitch classes (C6 = Am7, Cm6 = Am7b5, Asus2 = Esus4, Asus4 = Dsus2)
    are scored once, under the strongest root (then the quality listed first). A per-quality bias (`CHORD_QUALITY_BIAS`, overridable)
    keeps a triad with a faint seventh a triad. New helpers: `CHORD_QUALITIES`,
    `TRIAD_QUALITIES`, `CHORD_QUALITY_INTERVALS`, `chordPitchClasses`, `baseTriad`,
    `chordTemplates`, `isChordQuality`; `chordName` knows every suffix.
    **Type change:** `ChordQuality` is wider, so an exhaustive `switch` or a
    `Record<ChordQuality, …>` in your code needs the new members (or use `chordName` and
    `baseTriad`).
  - `@audiolab/react`: the readouts tint by the base triad (`qualityMode`); sus and dim
    chords are untinted.

- 4fc2e3a: `@audiolab/core/games`: the detection logic of the games, without React or timers.

  - `WolfJumperDetector` (and the pure `stepWolfDetector`): push one analysis frame, get the
    `noteDetected` / `chordDetected` actions for `gameReducer`. It holds the chroma smoothing,
    the note-pool filter, both confirmations and the noise gate (`noiseGateDb`, default -60),
    takes the bonus chords to aim at (`aliveBonusChords(state)`) with a `chordAccept` policy, and
    can read the note from a `PitchTracker` estimate (`noteSource: "pitch"`).
  - `ChordTargetMatcher` (and `stepChordTarget`): confirmation of a target chord with an accept
    policy and an optional noise gate.

- 971ab92: `startLiveAnalysis({ context, source, engine?, framesPerSecond?, fftSize? })`: the live
  analysis loop without a UI. Read the last frame with `latest()` or `subscribe()` to every
  frame; `stop()` detaches the analyser from the source and never touches the context.
  `useTonality` now runs on it, which also fixes the source → analyser link that was left
  connected when the hook stopped.
- 5c0c88d: `@audiolab/core/games`: `matchesTarget(detected, target, { accept: "exact" | "triad" })`
  decides whether a detected chord counts for a target (`"triad"` lets E stand for E7 and
  E7 for E); `parseChordKey` accepts every chord quality.
- 64321dd: `@audiolab/react/art`: the wolf artwork (`WOLF_PATHS`, `WOLF_VIEWBOX`, `WOLF_ASPECT`,
  `WOLF_TRANSFORM`) as plain data, without React, CSS or the "use client" directive.

### Patch Changes

- bbf0797: Diminished chords carry a small ranking bias (`CHORD_QUALITY_BIAS.dim`, `.min7b5` = 0.03),
  measured on a synthetic guitar; among chords sharing their pitch classes the reading with
  the strongest root is named. `npm run measure:chords [-- <dir>]` prints the chord confusion
  for the synthetic guitar or for your own labelled recordings.
- 3ee4a4e: `useWolfJumper` runs on the core `WolfJumperDetector`; it also takes `pitch` and the new
  detection options (`noteSource`, `minPitchClarity`, `chordAccept`).

## 0.1.0

### Minor Changes

- 048913a: Engines for hosts that build their own UI, and a shared AudioContext.

  - `@audiolab/core`: `openMicrophone({ context, stream, constraints })` works on a
    host-owned AudioContext / MediaStream and never closes or stops what it did not
    create (`MicSource.ownsContext` / `ownsStream`); `detectPitch` and `PitchTracker`
    (McLeod pitch method) for a tuner; `matchScales` with twelve built-in scale
    definitions; the game engines moved to `@audiolab/core/games` with a configurable
    Wolf Jumper (`createInitialState(seed, config)`), chord pools keyed by id and
    `{ root, quality }` chord references; `chordName()`.
  - `@audiolab/react`: `useMicrophone({ context, stream })`, `usePitch(mic, options)`;
    `ChordGame` takes `confirmations` / `minProbability`, `WolfJumper` takes `config` and
    `detection`; labels exported as `CHORD_POOL_LABELS_EN` and `bonusTypeLabels`.
    `pickChord` now returns `null` for an empty pool and chord references instead of
    names.

- 7296891: First release of the SDK extracted from the AudioLab app.

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
