# @audiolab/core

Framework-free audio analysis for the browser: live key, chord and tempo detection on
the Web Audio API, with hand-written, unit-tested DSP. No React, no runtime
dependencies. Part of [AudioLab](https://github.com/Dicdaplon/AudioLab).

```bash
npm install @audiolab/core
```

ESM only, TypeScript declarations included. Node ≥ 20 for the offline subpath.

## Minimal usage

```ts
import { TonalityEngine, createAnalyser, openMicrophone, readSpectrumDb } from "@audiolab/core";

// Must run from a user gesture (click): browsers keep the AudioContext suspended otherwise.
const mic = await openMicrophone(); // throws MicrophoneError with a stable `code`
const analyser = createAnalyser(mic.context, mic.source, { fftSize: 16384 });
const engine = new TonalityEngine({ framesPerSecond: 10 });

const timer = setInterval(() => {
  const frame = engine.processDbSpectrum(readSpectrumDb(analyser), analyser.sampleRate);
  console.log(frame.tonalityKeys[0]?.name, frame.chords[0]?.name);
}, 100);

// Later:
clearInterval(timer);
await mic.dispose();
```

Tempo, from a gapless sample stream:

```ts
import { TempoAnalyzer, startSampleCapture } from "@audiolab/core";

const analyzer = new TempoAnalyzer({ sampleRate: mic.context.sampleRate });
const capture = await startSampleCapture(mic.context, mic.source, (s) => analyzer.pushSamples(s));
setInterval(() => console.log(analyzer.analyze().estimate?.bpm, capture.method), 200);
```

## API overview

Everything below is exported from `@audiolab/core`; modules not re-exported from
`src/index.ts` are internal.

| Area      | Exports                                                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engines   | `TonalityEngine` (per-frame chroma → key / chord / presence), `TempoAnalyzer` (onset envelope → beat spectrum → BPM), `emptyTonalityFrame`, their config and frame types                                                                                   |
| Chroma    | `spectrumToChroma`, `dbSpectrumToMagnitude`, `averageChromas`, `l1Normalize`, `ChromaWindow`, `CHROMA_SIZE`                                                                                                                                                |
| Detection | `detectKey`, `detectMajorKey`, `detectChord`, `detectKeyFromPresence`, `HighWaterMarkFilter`, `KEY_PROFILES`, `CHORD_TEMPLATES`, `keyName`, `keyShortName`, `relativeMajorTonic`                                                                           |
| Signal    | `fftMagnitude`, `fftInPlace`, `applyHannWindow`, `computeFftDb`, `periodicHannWindow`, `nextPow2`, `LowpassFilter` (4th-order Butterworth), `estimateNoiseFloor`, `spectrumSlopeDbPerHz`, `TimeRingBuffer`, `softmax`, `mean`, `median`, `argmax`, `clamp` |
| Web Audio | `openMicrophone` → `MicSource` (`dispose()`), `checkMicrophoneSupport`, `MicrophoneError` / `toMicError` (stable error codes), `createAnalyser` + `readSpectrumDb`, `startSampleCapture` (AudioWorklet with AnalyserNode fallback), `SampleBatcher`        |
| Settings  | `DEFAULT_DETECTOR_SETTINGS`, `DEFAULT_FFT_SETTINGS`, `ANALYSIS_DEFAULTS`, `ONSET_LOWPASS_RANGE`, `FFT_DISPLAY_MAX_HZ` and the `DetectorSettings` / `FftSettings` types                                                                                     |
| Notes     | `NOTE_NAMES`, `freqToMidi`, `midiToFreq`, `freqToPitchClass`, `pitchClassName`, `pitchClassFrequencies`, `A_MINOR_PENTATONIC_PITCH_CLASSES`                                                                                                                |

### `@audiolab/core/offline` (Node only)

```ts
import { decodeAudioFile } from "@audiolab/core/offline";
import { analyzeOverall, computeChromaSequence } from "@audiolab/core/offline";

const audio = await decodeAudioFile("song.mp3");
const chromas = computeChromaSequence(audio, { fftSize: 8192, hopSize: 2048 });
console.log(analyzeOverall(chromas).keys[0].name);
```

Decoding needs the optional peer dependency `audio-decode` (`npm install audio-decode`).
The subpath imports `node:fs`; never import it from browser code. `computeChromaSequence`,
`aggregateChromas`, `analyzeOverall`, `slidingChordHistogram` and `runPresenceTonality`
replay recordings through the same `TonalityEngine` the live path uses.

## The AudioWorklet

`startSampleCapture` prefers an `AudioWorkletProcessor` running on the audio thread. The
processor is shipped **inside the bundle as a string** and loaded through a Blob URL
(`data:` URL where object URLs are unavailable), so it works under any bundler (Next.js /
webpack, Vite, esbuild…) with no asset copying or special loader. Two consequences:

- a Content Security Policy must allow `blob:` in `script-src` (or `worker-src`);
- if the module fails to load for any reason, capture falls back to polling an
  `AnalyserNode` against `context.currentTime` (`capture.method === "analyser"`),
  envelope-accurate rather than sample-accurate.

## Browser requirements

`getUserMedia` needs a secure context (HTTPS or `localhost`). `checkMicrophoneSupport()`
reports `insecure-context` / `unsupported` before any prompt; `openMicrophone()` maps the
browser's `DOMException`s to `permission-denied`, `no-device`, `device-busy`, `blocked`,
`constraints` or `unknown`, each with an actionable message.

## License

MIT
