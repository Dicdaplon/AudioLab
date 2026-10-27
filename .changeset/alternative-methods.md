---
"@audiolab/core": minor
"@audiolab/react": minor
---

Opt-in alternative methods next to the original chord and key pipeline (defaults unchanged,
measurements in docs/ALTERNATIVES.md). `TonalityEngine` / `useTonality` take
`chordSmoothing: "hmm"` (per-frame templates smoothed by `ChordHmm`, a hidden Markov model with a
"no chord" state; `chordHmm` settings, `CHORD_HMM_DEFAULTS`; frames then carry
`noChordProbability`), `chromaMethod: "gaussian-log"` (Gaussian semitone binning and log
compression, `GAUSSIAN_LOG_CHROMA`; `spectrumToChroma` takes `binning`, `compression`,
`logGain`, `tuningCents`) and `keyProfile: "temperley" | "kostkaPayne"` (`KEY_PROFILE_SETS`;
`detectKey(chroma, { temperature, profile })`, the number argument still works). The offline
pipeline takes `chroma` frame options and a key profile. The HMM defaults (mean chord 1 s,
emission exponent 0.6, lag 0) were tuned on GuitarSet players 00–02 and checked on 03–05.
