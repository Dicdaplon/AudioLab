---
"@audiolab/core": patch
"@audiolab/react": patch
---

Diminished chords carry a small ranking bias (`CHORD_QUALITY_BIAS.dim`, `.min7b5` = 0.03),
measured on a synthetic guitar; among chords sharing their pitch classes the reading with
the strongest root is named. `npm run measure:chords [-- <dir>]` prints the chord confusion
for the synthetic guitar or for your own labelled recordings.
