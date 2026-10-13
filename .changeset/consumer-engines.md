---
"@audiolab/core": minor
"@audiolab/react": minor
---

Engines for hosts that build their own UI, and a shared AudioContext.

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
