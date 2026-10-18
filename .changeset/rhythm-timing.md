---
"@audiolab/core": minor
"@audiolab/react": minor
---

Onset timing, an adaptive noise gate, a latency budget and rhythm scoring.

- Captured batches carry their AudioContext frame (`SampleBatchInfo`, second argument of
  the sample listener); the batch size is an option; the worklet loads once per context.
- `OnsetDetector` (SuperFlux, online peak picking, attack localisation), `OnsetPipeline`,
  `AdaptiveNoiseGate` / `stepNoiseGate`, `LevelFloorTracker`, `BandLevelMeter`,
  `AudioClockSync`, `estimateTimingBudget`, `startOnsetAnalysis`, `StreamHistory`,
  `noteAfterOnset` / `chordAfterOnset`.
- New subpath `@audiolab/core/rhythm`: `TimingScorer`, `fitPattern`,
  `toleranceFromUncertainty`, `timingStats`, `OnsetEvidence`.
- `WolfJumperDetector` takes `gate: "adaptive"`; the `WolfJumper` component gates
  automatically by default (`gate: "manual"` for the slider).
- Metronome and play-along: `startMetronome` (look-ahead clicks on the audio clock, one-bar
  count-in), `BeatGrid` helpers, `clickBandShare` and `ClickEchoFilter` (the click heard by
  the microphone is not a note, and its delay measures the round trip), timing budget
  `reference: "audio"`, and `PlayAlongSession` in `@audiolab/core/rhythm`.
- Labels for play-along: `noteLabeler`, `chordLabeler`, `noteLabel` (stable keys: pitch class
  string, `chordKey`). `outputLatencySeconds`, `TimingReference`, `spectralRise`,
  `METRONOME_DEFAULTS`, `CLICK_BAND_HZ`; `timingInputFromMic` accepts the context (output latency).
- React: `useOnsetAnalysis` (options `reference`, `roundTripMs`), `useDisplayFramePeriod`,
  `useMetronome` (reactive `sound`), `usePlayAlong` (session lifecycle, end detection, measured
  round trip), `PlayAlongLane` (tolerance band, beat lines, a dot per detected onset, early /
  late / missed colours, a ring for a wrong note), `BeatLights` (translatable labels),
  `laneTarget`, `targetState`, `LANE_GEOMETRY_DEFAULTS`. `styles.css` adds the `.al-lane` and
  `.al-beats` classes and the `--al-viz-onset` token.
- Use the same version of `@audiolab/core` and `@audiolab/react`: classes such as
  `StreamHistory` are shared between them.
- Behaviour changes: `SampleListener` now receives a second argument (`SampleBatchInfo`);
  callbacks written with one parameter keep working, code that _calls_ a listener must pass
  it. `WolfJumper` gates automatically by default; pass `gate="manual"` for the old slider.
- The lab has a Rhythm tab: written rhythm, scrolling notes and chords, the automatic
  gate and the latency budget.
