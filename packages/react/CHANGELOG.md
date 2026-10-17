# @audiolab/react

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

### Patch Changes

- Updated dependencies [048913a]
- Updated dependencies [7296891]
  - @audiolab/core@0.1.0
