---
"@audiolab/core": minor
"@audiolab/react": minor
---

`@audiolab/core/games`: the detection logic of the games, without React or timers.

- `WolfJumperDetector` (and the pure `stepWolfDetector`): push one analysis frame, get the
  `noteDetected` / `chordDetected` actions for `gameReducer`. It holds the chroma smoothing,
  the note-pool filter, both confirmations and the noise gate (`noiseGateDb`, default -60),
  takes the bonus chords to aim at (`aliveBonusChords(state)`) with a `chordAccept` policy, and
  can read the note from a `PitchTracker` estimate (`noteSource: "pitch"`).
- `ChordTargetMatcher` (and `stepChordTarget`): confirmation of a target chord with an accept
  policy and an optional noise gate.
