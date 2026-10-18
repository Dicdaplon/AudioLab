---
"@audiolab/core": minor
"@audiolab/react": minor
---

A continuous score per note in `@audiolab/core/rhythm`, on top of the unchanged tiers.

- `timingScore(deltaMs, sigmaMs)` = exp(−Δ² / 2σ²), `SCORE_PASS = 0.8`, `sigmaForScore(deltaMs, score)`,
  `scoreSigmaFor(tolerance)` and `scorerSigmaMs(config)`.
- `NoteResult.score`: null until the note resolves, 0 when missed, else the score of the corrected
  offset; present in `TimingScorer`, `scoreTimings`, `PlayAlongSession` and `attachPlayAlong`.
  `FittedNote.score` scores the residual in `fitPattern`.
- Option `scoreSigmaMs` (scorer and `fitPattern`); by default σ is derived from the tolerance so
  that the on-time edge scores 0.8 (≈ 149.7 ms at ±100 ms).
- The lab shows the mean score of each exercise.
