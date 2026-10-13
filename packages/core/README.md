# @audiolab/core

Framework-free audio analysis for the browser: live key, chord, pitch and tempo
detection on the Web Audio API, scale matching and the pure engines of two ear-training
games, with hand-written, unit-tested DSP. No React, no runtime dependencies. Part of
[AudioLab](https://github.com/Dicdaplon/AudioLab).

> Not published on npm yet. Until the first release, `npm pack` the package into the
> host's vendor folder: see [docs/INTEGRATION.md](../../docs/INTEGRATION.md#8-developing-across-the-two-repositories).

```bash
npm install @audiolab/core
```

ESM only, TypeScript declarations included. Three entry points: `@audiolab/core`
(browser-safe), `@audiolab/core/games` (pure game engines) and `@audiolab/core/offline`
(Node ≥ 20 only).

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

### Sharing the host's AudioContext

A page must run a single `AudioContext`. Pass the host's (for Tone.js,
`Tone.getContext().rawContext`) and, if you already have one, the `MediaStream`: the SDK
resumes the context if it is suspended, never closes it, and never stops tracks it did
not acquire. `mic.ownsContext` / `mic.ownsStream` say what `dispose()` will release.

```ts
const mic = await openMicrophone({ context: Tone.getContext().rawContext as AudioContext });
// ... later, from the host's own teardown:
await mic.dispose(); // disconnects the source, stops the SDK's tracks, leaves the context running
```

### Pitch (tuner)

```ts
import { PitchTracker, detectPitch, startSampleCapture } from "@audiolab/core";

// One window at a time:
const estimate = detectPitch(samples, 48000, { referenceA4: 442 });
// → { frequency: 110.02, midi: 45, pitchClass: 9, cents: 0.3, clarity: 0.99 } or null

// Streaming, with median smoothing and a note-name hysteresis:
const tracker = new PitchTracker({ sampleRate: mic.context.sampleRate });
const capture = await startSampleCapture(mic.context, mic.source, (s) => tracker.push(s));
setInterval(() => console.log(tracker.estimate), 50);
```

`detectPitch` is the McLeod pitch method (normalised square difference function,
first key maximum above `peakThreshold` × the highest, parabolic interpolation refined at
a multiple of the lag). It returns `null` on silence (`silenceRms`), on low clarity
(`clarityThreshold`) and outside `[minFrequency, maxFrequency]`; the window must hold two
periods of the lowest note (2048 samples reach 60 Hz at 48 kHz). Pitch classes are 0–11
(C = 0), no note names are produced.

### Scales

```ts
import { SCALES, SCALE_NAMES_EN, matchScales } from "@audiolab/core";

const presence = [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0]; // C D E G A, or frame.presenceHistogram
const [best] = matchScales(presence, SCALES, { threshold: 0, topN: 5 });
// → { scaleId: "major-pentatonic", tonic: 0, pitchClasses: [0, 2, 4, 7, 9],
//     score: 1, missing: [], outside: [] }
SCALE_NAMES_EN[best.scaleId]; // "major pentatonic" (optional labels, not used by the engine)
```

Ranking: fewest played notes outside the scale, then fewest unplayed scale notes, then
the share of the played weight inside the scale, then list order and tonic (ties are
deterministic). Pass your own `ScaleDefinition[]` (`{ id, intervals }`) to match other
scales.

### Game engines (`@audiolab/core/games`)

Pure reducers and pools, keyed by pitch classes and `{ root, quality }` chord references:

```ts
import {
  CHORD_POOLS,
  chordGameReducer,
  createInitialState,
  gameReducer,
  pickChord,
  stepConfirmation,
} from "@audiolab/core/games";

// Wolf Jumper, restricted to A minor pentatonic, 3 HP:
let game = createInitialState(seed, { notePool: [9, 0, 2, 4, 7], maxHp: 3 });
game = gameReducer(game, { type: "start" });
game = gameReducer(game, { type: "tick", dtMs: 16 }); // from your animation loop
game = gameReducer(game, { type: "noteDetected", pc: 9 }); // from your detector
game = gameReducer(game, { type: "chordDetected", chord: { root: 9, quality: "min" } });

// Chord game:
const target = pickChord(CHORD_POOLS["open-mix"]); // { root, quality } | null
```

See [docs/INTEGRATION.md](../../docs/INTEGRATION.md#7-engines-for-custom-uis) for the
full loop (confirmation of noisy detections, display names).

## API overview

Everything below is exported from `@audiolab/core`; modules not re-exported from
`src/index.ts` are internal.

| Area      | Exports                                                                                                                                                                                                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engines   | `TonalityEngine` (per-frame chroma → key / chord / presence), `TempoAnalyzer` (onset envelope → beat spectrum → BPM), `emptyTonalityFrame`, their config and frame types                                                                                                                                              |
| Chroma    | `spectrumToChroma`, `dbSpectrumToMagnitude`, `averageChromas`, `l1Normalize`, `ChromaWindow`, `CHROMA_SIZE`                                                                                                                                                                                                           |
| Detection | `detectKey`, `detectMajorKey`, `detectChord`, `detectKeyFromPresence`, `HighWaterMarkFilter`, `KEY_PROFILES`, `CHORD_TEMPLATES`, `keyName`, `keyShortName`, `chordName`, `relativeMajorTonic`                                                                                                                         |
| Pitch     | `detectPitch` → `PitchEstimate` (frequency, midi, pitchClass, cents, clarity) or null, `PitchTracker` (push samples, `estimate`, `setReferenceA4`, `reset`), `PITCH_DEFAULTS`, `normalizedSquareDifference`, `frequencyToPitch`                                                                                       |
| Scales    | `matchScales` → `ScaleMatch[]` (scaleId, tonic, pitchClasses, score, missing, outside), `SCALES` (12 built-in `ScaleDefinition`s with stable ids), `SCALE_NAMES_EN`, `scalePitchClasses`                                                                                                                              |
| Signal    | `fftMagnitude`, `fftInPlace`, `applyHannWindow`, `computeFftDb`, `periodicHannWindow`, `nextPow2`, `LowpassFilter` (4th-order Butterworth), `estimateNoiseFloor`, `spectrumSlopeDbPerHz`, `TimeRingBuffer`, `softmax`, `mean`, `median`, `argmax`, `clamp`                                                            |
| Web Audio | `openMicrophone({ context?, stream?, constraints? })` → `MicSource` (`ownsContext`, `ownsStream`, `dispose()`), `checkMicrophoneSupport`, `MicrophoneError` / `toMicError` (stable error codes), `createAnalyser` + `readSpectrumDb`, `startSampleCapture` (AudioWorklet with AnalyserNode fallback), `SampleBatcher` |
| Settings  | `DEFAULT_DETECTOR_SETTINGS`, `DEFAULT_FFT_SETTINGS`, `ANALYSIS_DEFAULTS`, `ONSET_LOWPASS_RANGE`, `FFT_DISPLAY_MAX_HZ` and the `DetectorSettings` / `FftSettings` types                                                                                                                                                |
| Notes     | `NOTE_NAMES`, `freqToMidi`, `midiToFreq`, `freqToPitchClass`, `pitchClassName`, `pitchClassFrequencies`, `A_MINOR_PENTATONIC_PITCH_CLASSES`                                                                                                                                                                           |

### `@audiolab/core/games`

| Area        | Exports                                                                                                                                                                                                                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wolf Jumper | `createInitialState(seed, config?)`, `gameReducer`, `GameState` / `GameAction`, `WOLF_JUMPER_DEFAULTS` + `WolfJumperConfig` (note pool, bonus chords and types, health, travel and spawn curves, durations, lanes), `WOLF_JUMPER_DETECTION_DEFAULTS`, `computeTravelMs`, `computeSpawnMs`, `shieldRemainingMs`, `slowRemainingMs`, `pushChromaFrame`, `dominantNote` |
| Chord game  | `CHORD_POOLS` keyed by `ChordPoolId`, `CHORD_POOL_IDS`, `DEFAULT_CHORD_POOL`, `pickChord`, `chordGameReducer` + `INITIAL_CHORD_GAME_STATS`, `CHORD_GAME_DEFAULTS` (confirmation frames, minimum score)                                                                                                                                                               |
| Shared      | `ChordRef` + `sameChord` / `chordKey` / `parseChordKey`, `stepConfirmation` + `EMPTY_CONFIRMATION` (debounce a per-frame detector into events), `SeededRandom` / `nextRandom` / `randomSeed`                                                                                                                                                                         |

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
