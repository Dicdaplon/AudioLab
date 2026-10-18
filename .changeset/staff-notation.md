---
"@audiolab/core": minor
"@audiolab/react": minor
---

- Scores: `StaffNotation` (react) writes a rhythm on a one-line staff, or notes on a treble staff
  with the guitar 8, with chord symbols, the count, verdict colours, a live cursor and red dots;
  `@audiolab/core/rhythm` adds the notation helpers (`eventsFromDurations`, `figureOf`, `beamGroups`,
  `staffStep`…). `styles.css` adds the `.al-staff` classes and the `--al-viz-good` token.
- The default timing tolerance doubles to ±100 ms on time and ±300 ms window: ±50 / ±150 ms
  felt too strict in play-testing. Verdict colours: on time is green, early amber, late violet.
- The lab writes every rhythm exercise above its lane, as on a score, and the rhythms gained
  rests, half notes and sixteenths.
