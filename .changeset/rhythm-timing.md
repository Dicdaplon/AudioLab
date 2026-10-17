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
- React: `useOnsetAnalysis`, `useDisplayFramePeriod`.
- The lab has a Rhythm tab: written rhythm, scrolling notes and chords, the automatic
  gate and the latency budget.
