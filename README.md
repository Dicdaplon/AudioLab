# AudioLab

**Real-time audio analysis in the browser: key and chord detection, spectrum and noise
floor, tempo estimation and two microphone-driven ear-training games, all built on the
Web Audio API with hand-written, unit-tested DSP.**

[![CI](https://github.com/Dicdaplon/AudioLab/actions/workflows/ci.yml/badge.svg)](https://github.com/Dicdaplon/AudioLab/actions/workflows/ci.yml)
[![Deploy](https://github.com/Dicdaplon/AudioLab/actions/workflows/deploy.yml/badge.svg)](https://github.com/Dicdaplon/AudioLab/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](tsconfig.app.json)

**Live demo: <https://dicdaplon.github.io/AudioLab/>** (needs a microphone; nothing is
recorded or uploaded, all processing happens locally in the page).

![AudioLab screenshot](docs/screenshot.png)

## Features

- **Live key detection.** Krumhansl–Schmuckler correlation over all 24 major and minor
  keys, on two sliding windows (8 s "live" and 30 s "tonality", both adjustable).
- **Presence-based key detection.** An adaptive high-water-mark filter keeps only the
  dominant pitch classes, and a 30 s histogram of how often each note was present is
  ranked against the same key profiles.
- **Chord detection.** 24 major/minor triad templates scored by cosine similarity on a
  1 s chroma window.
- **Spectrum view.** AnalyserNode magnitude spectrum (0–4 kHz) with a noise-floor
  estimate (median, mean or 80th percentile), an optional slope overlay and A minor
  pentatonic reference lines.
- **Tempo analysis.** Gapless sample capture on the audio thread (AudioWorklet),
  onset-strength envelope, beat spectrum on a 40–240 BPM axis and a prior-weighted BPM
  estimate.
- **Chord game.** Ear-training: play the requested chord; a hit needs a stable detection
  over several frames. Six chord pools, from open guitar chords to all 24 triads.
- **Wolf Jumper.** A small arcade game: play the note shown on an incoming enemy to
  destroy it, play chords to collect bonuses. Includes an adjustable noise gate.

## How it works

```text
Microphone ─► MediaStreamAudioSourceNode ─┬─► AnalyserNode (FFT 16384, Blackman, dB) ── polled at 10 Hz
                                          │      ├─► TonalityEngine ─► chroma ─► windows ─► keys / chords / presence
                                          │      └─► spectrum + noise floor             (FFT tab only)
                                          └─► AudioWorklet "sample-capture"             (FFT tab only)
                                                 └─► TempoAnalyzer ─► onset envelope ─► beat spectrum ─► BPM
```

**Capture.** `getUserMedia` opens a mono stream with echo cancellation, noise
suppression and automatic gain control disabled, because all three reshape the
spectrum. A single microphone session is shared by every tab.

**Spectrum and chroma.** Ten times per second the AnalyserNode spectrum (16384-point
FFT, 2.93 Hz bins at 48 kHz) is converted back to linear magnitude and folded into a
12-bin chroma vector: the energy of every bin between 55 Hz and 5 kHz is added to the
pitch class nearest to its centre frequency, and the vector is normalised to sum to 1.

**Sliding windows.** The chroma frames are averaged over three ring buffers (1 s, 8 s,
30 s by default) with O(12) incremental updates. Because every frame is normalised,
the windows weigh loud and quiet passages equally.

**Detection.** Keys: Pearson correlation of the window chroma with the
Krumhansl–Kessler major and minor profiles rotated to each of the 12 tonics, turned into
a ranking score by a softmax (τ = 0.1). Chords: cosine similarity with 24 binary triad
templates, same softmax. Presence: the 8 s chroma is thresholded at a fraction of its
recent peak, binarised, and averaged over 30 s before the same key correlation.

**Tempo.** Tempo is invisible in the audio spectrum; it lives in the loudness envelope.
The worklet streams every sample to the main thread, where blocks of 128 samples are
turned into a log-compressed, half-wave rectified RMS difference (onset strength),
smoothed by a 4th-order Butterworth lowpass, decimated to about 94 Hz, and analysed
over 8 s with a zero-padded FFT. The peak of the spectrum, weighted by a log-Gaussian
tempo prior centred on 120 BPM, gives the estimate.

Deep dives: [docs/THEORY.md](docs/THEORY.md) (the maths and DSP decisions, with
numbers) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (layers, data flow, threads,
extension points).

## Tech stack

| Area     | Choice                                                                                  |
| -------- | --------------------------------------------------------------------------------------- |
| UI       | React 18, plain CSS, canvas plots (no chart library)                                    |
| Language | TypeScript (strict), ES modules                                                         |
| Build    | Vite 5, AudioWorklet bundled through a `?worker&url` import, `base: "./"` for Pages     |
| Audio    | Web Audio API: `getUserMedia`, `AnalyserNode`, `AudioWorkletNode`                       |
| DSP      | Hand-written: radix-2 FFT, chroma, Butterworth biquads, key/chord scoring (no DSP deps) |
| Tests    | Vitest 2 (unit / dom / samples projects), Testing Library, jsdom, v8 coverage           |
| Quality  | ESLint 9 (typescript-eslint, react-hooks), Prettier                                     |
| CI/CD    | GitHub Actions: checks + coverage, sample regression suite, GitHub Pages deploy         |

The only runtime dependencies are `react` and `react-dom`.

## Getting started

Requirements: **Node.js ≥ 20** (`.nvmrc` pins 20) and npm.

```bash
git clone https://github.com/Dicdaplon/AudioLab.git
cd AudioLab
npm ci
npm run dev        # http://127.0.0.1:5173
```

Start the microphone from the page and allow access when the browser asks. Browsers only expose `getUserMedia` in a
secure context: `localhost`/`127.0.0.1` or HTTPS. Opening the dev server through a LAN
IP over plain HTTP shows an "insecure context" error instead of the permission prompt.

## Scripts

| Command                   | What it does                                                         |
| ------------------------- | -------------------------------------------------------------------- |
| `npm run dev`             | Vite dev server on `127.0.0.1:5173`                                  |
| `npm run build`           | Type-check (`tsc -b`) then production bundle in `dist/`              |
| `npm run preview`         | Serve the production build locally                                   |
| `npm test`                | Fast suite: Vitest `unit` + `dom` projects                           |
| `npm run test:watch`      | Same projects in watch mode                                          |
| `npm run test:samples`    | Regression suite on the real audio fixtures in `tests/Sample`        |
| `npm run test:all`        | All three projects                                                   |
| `npm run coverage`        | Fast suite with v8 coverage and enforced thresholds                  |
| `npm run typecheck`       | `tsc -b` (app, tests, scripts and config)                            |
| `npm run lint`            | ESLint                                                               |
| `npm run format`          | Prettier, write                                                      |
| `npm run format:check`    | Prettier, check only                                                 |
| `npm run sweep`           | Grid search of the chord and presence parameters over the samples    |
| `npm run extract:backing` | Cut three 30 s WAV extracts from each track in `localSample/`        |
| `npm run analyze:backing` | Print chord histogram and key rankings for the backing-track extract |

## Testing strategy

The DSP lives in plain TypeScript modules with no browser dependency, so most of it is
tested in Node against signals whose answer is known analytically.

| Vitest project | Files                     | Environment | Content                                                                                       |
| -------------- | ------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `unit`         | `tests/**/*.test.ts`      | Node        | DSP maths, engines, offline pipeline, audio adapters against a fake Web Audio API, game logic |
| `dom`          | `tests/**/*.test.tsx`     | jsdom       | Hooks (start/stop races, worklet and fallback capture) and components                         |
| `samples`      | `tests/samples/*.test.ts` | Node        | Real recordings decoded from MP3/WAV and run through the shared `TonalityEngine`              |

- **Synthetic signals.** Seeded generators (`tests/helpers/synth.ts`) produce tones,
  chords, scales and click tracks; an AnalyserNode emulation (`tests/helpers/liveRig.ts`)
  frames them exactly like the live hook, including the dB round-trip. Examples: a
  bin-centred sine reads 0 dB in `computeFftDb`; the Butterworth filter is −3.01 dB at
  the cutoff; click tracks at 90–180 BPM are estimated within 3 BPM; I–IV–V–I and
  i–iv–V–i cadences in all 24 keys are ranked first by all three key paths; all 24
  triads are detected top-1.
- **Real audio.** 17 fixtures (clean guitar recordings, FL Studio renders with drums and
  noise, backing-track extracts). Assertions pin the measured ranks with a small slack,
  e.g. "the 4 most frequent chords of `CAmDmG_2_1.mp3` are exactly {D, Bm, Em, A}".
- **Measured on the current `main`:** `npm run coverage` runs 434 tests in 35 files
  (about 7 s); `npm run test:samples` runs 44 tests in 4 files (about 6 s).

Coverage (v8, unit + dom) and the thresholds enforced in
[`vite.config.ts`](vite.config.ts):

| Scope                  | Lines (measured / min) | Branches (measured / min) | Functions (measured / min) |
| ---------------------- | ---------------------- | ------------------------- | -------------------------- |
| Whole `src/`           | 87.8 % / 86 %          | 93.8 % / 92 %             | 94.7 % / 93 %              |
| `src/analysis/*.ts`    | 99.3 % / 99 %          | 97.7 % / 97 %             | 100 % / 100 %              |
| `src/analysis/engine`  | 100 % / 99 %           | 97.3 % / 96 %             | 100 % / 100 %              |
| `src/analysis/offline` | 100 % / 99 %           | 95.1 % / 93 %             | 100 % / 100 %              |
| `src/audio`            | 100 % / 99 %           | 94.1 % / 92 %             | 100 % / 100 %              |
| `src/hooks`            | 100 % / 99 %           | 100 % / 98 %              | 100 % / 100 %              |

The global figure is pulled down by `src/components` (about 63 % of lines) and
`App.tsx`, which are only partly covered by tests.

**CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push to
`main` and every pull request, in two jobs: `check` (typecheck, lint, format check,
coverage with thresholds, coverage report uploaded as an artifact, production build) and
`samples` (the real-audio regression suite). [`deploy.yml`](.github/workflows/deploy.yml)
builds and publishes `dist/` to GitHub Pages on every push to `main`.

## Project structure

```text
src/
├── analysis/                 Pure TypeScript DSP, no DOM or Web Audio
│   ├── chroma.ts             dB → magnitude, spectrum → 12-bin chroma
│   ├── windowing.ts          ChromaWindow: ring buffer with incremental mean
│   ├── keyDetection.ts       Krumhansl–Schmuckler, 24 keys, Pearson + softmax
│   ├── chordDetection.ts     24 triad templates, cosine + softmax
│   ├── highWaterMark.ts      Adaptive peak-relative threshold filter
│   ├── presenceTonality.ts   Key ranking from a presence histogram
│   ├── fft.ts                Radix-2 FFT, symmetric Hann
│   ├── timeFft.ts            Amplitude-normalised FFT in dB (periodic Hann)
│   ├── lowpass.ts            4th-order Butterworth (two biquads)
│   ├── noiseFloor.ts         Median / mean / p80 over finite bins
│   ├── spectrumSlope.ts      Centred finite difference, dB/Hz
│   ├── timeBuffer.ts         Ring buffer for continuous signals
│   ├── math.ts               softmax, mean, median, argmax, clamp
│   ├── engine/
│   │   ├── tonalityEngine.ts Per-frame key / chord / presence pipeline
│   │   └── tempoAnalyzer.ts  Onset envelope, beat spectrum, BPM estimate
│   └── offline/              Node only: file decoding, framing (tests, scripts)
├── audio/                    Web Audio adapters
│   ├── micStream.ts          getUserMedia + AudioContext, disposal
│   ├── errors.ts             DOMException → stable error codes and messages
│   ├── analyser.ts           AnalyserNode setup and polling
│   ├── sampleCapture.ts      Worklet capture with AnalyserNode fallback
│   ├── sampleCapture.worklet.ts  AudioWorkletProcessor (audio thread)
│   └── sampleBatcher.ts      128-sample quanta → 2048-sample messages
├── hooks/                    useMicrophone, useTonality, useTempoAnalysis
├── config/settings.ts        Settings types and defaults
├── features/games/           Chord game and Wolf Jumper (pure engines + views)
├── components/               Detector views, FFT tab, canvas plots
├── utils/                    Note maths, plot helpers
└── App.tsx                   Tabs and wiring
tests/                        Mirrors src/; helpers/, setup/, samples/, Sample/ (audio)
scripts/                      Parameter sweep and backing-track tools (tsx)
docs/                         ARCHITECTURE.md, THEORY.md
```

## Known limitations

- **Tempo octave errors.** A pulse train has envelope harmonics at 1×, 2×, 3× the beat
  rate, so the estimate can be half or double the felt tempo (a 60 BPM click is reported
  as 120 BPM). Resolution is 7.5 BPM before peak interpolation (8 s window). No beat
  phase tracking.
- **Low-frequency pitch resolution.** The AnalyserNode's Blackman main lobe is about
  ±9 Hz wide; semitones are only cleanly separated from roughly 220 Hz upwards. Bass
  notes below ~150 Hz leak into neighbouring pitch classes.
- **Relative major/minor ambiguity.** A minor key and its relative major share all
  seven notes; the profiles only separate them by emphasis on the tonic, so both often
  rank together. The sample tests accept either.
- **Harmonics.** The chroma has no harmonic suppression: the 5th harmonic adds a major
  third, which can push minor chords towards major.
- **Vocabulary.** Major and minor triads only (no sevenths, sus, diminished or
  augmented); Western 12-TET tuning with A4 = 440 Hz; mono input.
- **Scores are not probabilities.** The softmax outputs rank candidates and sum to 1,
  but they are not calibrated confidences.
- **Main-thread analysis.** The spectrum is polled with `setInterval` on the main thread;
  a throttled background tab slows the key and chord updates.
- **Tuning data.** Default filter parameters come from a sweep over a small set of
  recordings, framed offline at about 21.5 fps with a Hann window, not the live 10 fps
  Blackman front-end.

## License

[MIT](LICENSE) © dicdaplon
