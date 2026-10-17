---
"@audiolab/core": minor
"@audiolab/react": patch
---

`startLiveAnalysis({ context, source, engine?, framesPerSecond?, fftSize? })`: the live
analysis loop without a UI. Read the last frame with `latest()` or `subscribe()` to every
frame; `stop()` detaches the analyser from the source and never touches the context.
`useTonality` now runs on it, which also fixes the source → analyser link that was left
connected when the hook stopped.
