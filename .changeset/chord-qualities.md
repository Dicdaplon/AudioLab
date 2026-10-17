---
"@audiolab/core": minor
"@audiolab/react": minor
---

Chord qualities beyond major and minor.

- `@audiolab/core`: `ChordQuality` adds `dom7`, `maj7`, `min7`, `sus2`, `sus4`, `maj6`,
  `min6`, `dim` and `min7b5`. They are opt-in: `detectChord(chroma, { qualities })` and
  `TonalityEngine({ chordQualities })`; without them the output is unchanged (24 triads).
  Chords with identical pitch classes (C6 = Am7, Cm6 = Am7b5, Asus2 = Esus4) are scored once,
  under the quality listed first. A per-quality bias (`CHORD_QUALITY_BIAS`, overridable)
  keeps a triad with a faint seventh a triad. New helpers: `CHORD_QUALITIES`,
  `TRIAD_QUALITIES`, `CHORD_QUALITY_INTERVALS`, `chordPitchClasses`, `baseTriad`,
  `chordTemplates`, `isChordQuality`; `chordName` knows every suffix.
  **Type change:** `ChordQuality` is wider, so an exhaustive `switch` or a
  `Record<ChordQuality, …>` in your code needs the new members (or use `chordName` and
  `baseTriad`).
- `@audiolab/react`: the readouts tint by the base triad (`qualityMode`); sus and dim
  chords are untinted.
