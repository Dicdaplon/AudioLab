---
"@audiolab/core": minor
"@audiolab/react": minor
---

Latency by ear, for Bluetooth headphones: `measureTapLatency` (and `LATENCY_TEST`,
`latencyTestClicks`) measures the click → note delay from 8 clicks played along after a
4-click count-in; `useLatencyTest` runs it with its own audible metronome. The budget takes
it with `calibrationReference: "audio"` (a calibration now applies only to the reference it
was measured with; default "visual", as before), and reports `outputDelayMs` and
`visualDelayMs`: draw the lane that much later so it lands with the click heard.
`useOnsetAnalysis` takes `calibration`.
