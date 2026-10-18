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
import { openMicrophone, startLiveAnalysis } from "@audiolab/core";

// Must run from a user gesture (click): browsers keep the AudioContext suspended otherwise.
const mic = await openMicrophone(); // throws MicrophoneError with a stable `code`
const live = startLiveAnalysis({ context: mic.context, source: mic.source, framesPerSecond: 10 });

live.subscribe((frame) => console.log(frame.tonalityKeys[0]?.name, frame.chords[0]?.name));
// or read live.latest() from your own clock

// Later:
live.stop(); // detaches the analyser, never closes the context
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
`nativeAudioContext(Tone.getContext().rawContext)`) and, if you already have one, the `MediaStream`: the SDK
resumes the context if it is suspended, never closes it, and never stops tracks it did
not acquire. `mic.ownsContext` / `mic.ownsStream` say what `dispose()` will release.

```ts
const mic = await openMicrophone({
  // rawContext is standardized-audio-context's wrapper: unwrap it, or the
  // sample capture loses its exact timing (see nativeAudioContext).
  context: nativeAudioContext(Tone.getContext().rawContext as AudioContext),
});
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

Pure reducers and detectors, keyed by pitch classes and `{ root, quality }` chord
references:

```ts
import {
  ChordTargetMatcher,
  WolfJumperDetector,
  aliveBonusChords,
  createInitialState,
  gameReducer,
  pickChord,
} from "@audiolab/core/games";

// Wolf Jumper, restricted to A minor pentatonic, 3 HP:
let game = createInitialState(seed, { notePool: [9, 0, 2, 4, 7], maxHp: 3 });
const detector = new WolfJumperDetector({ chordAccept: "triad" });
game = gameReducer(game, { type: "start" });
game = gameReducer(game, { type: "tick", dtMs: 16 }); // from your animation loop
for (const action of detector.push(frame, game.config.notePool, aliveBonusChords(game))) {
  game = gameReducer(game, action); // noteDetected / chordDetected, from each TonalityFrame
}

// Chord game, on your own chord list:
let target = pickChord(myChords); // { root, quality } | null
const matcher = new ChordTargetMatcher({ accept: "exact" });
if (matcher.push(frame, target).confirmed) target = pickChord(myChords, target);
```

See [docs/INTEGRATION.md](../../docs/INTEGRATION.md#7-engines-for-custom-uis) for the
full loop (confirmation of noisy detections, display names).

### Onsets, gate and rhythm

```ts
import {
  estimateTimingBudget,
  openMicrophone,
  startOnsetAnalysis,
  timingInputFromMic,
} from "@audiolab/core";
import { attachPlayAlong, toleranceFromUncertainty } from "@audiolab/core/rhythm";

const mic = await openMicrophone({ context }); // the host's (native) AudioContext
const analysis = await startOnsetAnalysis(context, mic.source, { historySeconds: 3 });
const budget = estimateTimingBudget(timingInputFromMic(mic));

const t0 = context.currentTime + 2;
const run = attachPlayAlong(
  analysis,
  [0, 1, 2, 3].map((i) => ({ id: i, time: t0 + i * 0.75 })),
  {
    endTime: t0 + 3.4,
    tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
    offsetMs: budget.offsetMs,
    adaptiveBias: true,
  },
);
run.subscribe((e) => e.type === "results" && console.log(run.results));
const results = await run.finished; // tier and deltaMs per note
```

No timer, no hidden state: the run follows the analysis' batches and detaches when it
ends; the analysis and the context stay the host's. A complete example with a Tone.js
metronome is in [docs/TIMING.md](../../docs/TIMING.md#7-using-it-in-an-exercise).

Every stage is a separate pure module (`OnsetDetector`, `AdaptiveNoiseGate`,
`AudioClockSync`, `estimateTimingBudget`, `fitPattern`…); algorithms, measured accuracy,
references and limits are in [docs/TIMING.md](../../docs/TIMING.md).

## API overview

Everything below is exported from `@audiolab/core`; modules not re-exported from
`src/index.ts` are internal.

| Area      | Exports                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engines   | `TonalityEngine` (per-frame chroma → key / chord / presence; `chordQualities` option), `startLiveAnalysis` (AnalyserNode polling loop: `latest`, `subscribe`, `stop`), `TempoAnalyzer` (onset envelope → beat spectrum → BPM), `emptyTonalityFrame`, their config and frame types                                                                                                                                                   |
| Chroma    | `spectrumToChroma`, `dbSpectrumToMagnitude`, `averageChromas`, `l1Normalize`, `ChromaWindow`, `CHROMA_SIZE`                                                                                                                                                                                                                                                                                                                         |
| Detection | `detectKey`, `detectMajorKey`, `detectChord(chroma, { qualities, temperature, qualityBias })`, `detectKeyFromPresence`, `HighWaterMarkFilter`, `KEY_PROFILES`, `CHORD_TEMPLATES`, `CHORD_QUALITIES` / `TRIAD_QUALITIES` / `CHORD_QUALITY_INTERVALS` / `CHORD_QUALITY_BIAS`, `chordTemplates`, `chordPitchClasses`, `baseTriad`, `isChordQuality`, `keyName`, `keyShortName`, `chordName`, `relativeMajorTonic`                      |
| Pitch     | `detectPitch` → `PitchEstimate` (frequency, midi, pitchClass, cents, clarity) or null, `PitchTracker` (push samples, `estimate`, `setReferenceA4`, `reset`), `PITCH_DEFAULTS`, `normalizedSquareDifference`, `frequencyToPitch`                                                                                                                                                                                                     |
| Scales    | `matchScales` → `ScaleMatch[]` (scaleId, tonic, pitchClasses, score, missing, outside), `SCALES` (12 built-in `ScaleDefinition`s with stable ids), `SCALE_NAMES_EN`, `scalePitchClasses`                                                                                                                                                                                                                                            |
| Signal    | `fftMagnitude`, `fftInPlace`, `applyHannWindow`, `computeFftDb`, `periodicHannWindow`, `nextPow2`, `LowpassFilter` (4th-order Butterworth), `estimateNoiseFloor`, `spectrumSlopeDbPerHz`, `TimeRingBuffer`, `softmax`, `mean`, `median`, `argmax`, `clamp`                                                                                                                                                                          |
| Onsets    | `OnsetDetector` (samples + start frame → `OnsetEvent`: frame, time, strength, level, localized), its stages `SuperFluxOdf`, `OnlinePeakPicker`, `AttackEnvelope`; `OnsetPipeline` (detector + gate acceptance); `StreamHistory`, `noteAfterOnset` / `chordAfterOnset` (+ `noteReadyAt` / `chordReadyAt`)                                                                                                                            |
| Gate      | `AdaptiveNoiseGate` / `stepNoiseGate` + `NOISE_GATE_DEFAULTS` (learnt floor, hysteresis, hold, warm-up, `noisy`), `LevelFloorTracker` / `stepLevelFloor` (sliding minimum), `BandLevelMeter` (80 Hz high-pass, 10 ms levels)                                                                                                                                                                                                        |
| Timing    | `AudioClockSync` (context ↔ performance clock, delivery, startup, gaps), `estimateTimingBudget` / `combineTimingComponents` → `TimingBudget` (offset, σ, minimum tolerance), `looksLikeBluetooth`, `startOnsetAnalysis` (live loop: `latest`, `subscribe`, `subscribeBatch`, `stop`; `historySeconds` keeps a `StreamHistory`), `timingInputFromMic`, `nativeAudioContext` (unwraps a Tone.js / standardized-audio-context context) |
| Metronome | `startMetronome` (look-ahead clicks, count-in, `setSound`, `clickTimes`), `BeatGrid` + `beatTime` / `beatAt` / `beatsBetween` / `isDownbeat`, `clickBandShare`, `ClickEchoFilter` (echo vs note, measured round trip), `outputLatencySeconds`                                                                                                                                                                                       |
| Web Audio | `openMicrophone({ context?, stream?, constraints? })` → `MicSource` (`ownsContext`, `ownsStream`, `dispose()`), `checkMicrophoneSupport`, `MicrophoneError` / `toMicError` (stable error codes), `createAnalyser` + `readSpectrumDb`, `startSampleCapture` (AudioWorklet with AnalyserNode fallback), `SampleBatcher`                                                                                                               |
| Build     | `BUILD_INFO` (`version`, `commit` of the build)                                                                                                                                                                                                                                                                                                                                                                                     |
| Settings  | `DEFAULT_DETECTOR_SETTINGS`, `DEFAULT_FFT_SETTINGS`, `ANALYSIS_DEFAULTS`, `ONSET_LOWPASS_RANGE`, `FFT_DISPLAY_MAX_HZ` and the `DetectorSettings` / `FftSettings` types                                                                                                                                                                                                                                                              |
| Notes     | `NOTE_NAMES`, `freqToMidi`, `midiToFreq`, `freqToPitchClass`, `pitchClassName`, `pitchClassFrequencies`, `A_MINOR_PENTATONIC_PITCH_CLASSES`                                                                                                                                                                                                                                                                                         |

### `@audiolab/core/games`

| Area        | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wolf Jumper | `createInitialState(seed, config?)`, `gameReducer`, `GameState` / `GameAction`, `WOLF_JUMPER_DEFAULTS` + `WolfJumperConfig` (note pool, bonus chords and types, health, travel and spawn curves, durations, lanes), `WOLF_JUMPER_DETECTION_DEFAULTS`, `computeTravelMs`, `computeSpawnMs`, `shieldRemainingMs`, `slowRemainingMs`, `pushChromaFrame`, `dominantNote`; detection: `WolfJumperDetector` / `stepWolfDetector`, `WOLF_DETECTOR_DEFAULTS` (noise gate, note source, chord policy), `aliveBonusChords` |
| Chord game  | `CHORD_POOLS` (the lab examples) keyed by `ChordPoolId`, `CHORD_POOL_IDS`, `DEFAULT_CHORD_POOL`, `pickChord` (any pool), `ChordTargetMatcher` / `stepChordTarget` + `CHORD_TARGET_DEFAULTS`, `chordGameReducer` + `INITIAL_CHORD_GAME_STATS`, `CHORD_GAME_DEFAULTS` (confirmation frames, minimum score)                                                                                                                                                                                                         |
| Shared      | `ChordRef` + `sameChord` / `matchesTarget` (`exact` or `triad`) / `chordKey` / `parseChordKey`, `stepConfirmation` + `EMPTY_CONFIRMATION` (debounce a per-frame detector into events), `SeededRandom` / `nextRandom` / `randomSeed`                                                                                                                                                                                                                                                                              |

### `@audiolab/core/rhythm`

| Area      | Exports                                                                                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoring   | `TimingScorer` / `stepTimingScorer` / `createTimingScorerState` + `TIMING_SCORER_DEFAULTS` (timing × label, adaptive bias), `scoreTimings`                                                           |
| Rhythm    | `fitPattern` (written rhythm at a free tempo → tempo, per-note residuals and tiers)                                                                                                                  |
| Score     | `timingScore(deltaMs, sigmaMs)` (Gaussian, 0..1), `SCORE_PASS` (0.8), `sigmaForScore`, `scoreSigmaFor(tolerance)`, `scorerSigmaMs`; `NoteResult.score` and `FittedNote.score`, option `scoreSigmaMs` |
| Tolerance | `toleranceFromUncertainty`, `classifyDelta`, `TIMING_TOLERANCE_DEFAULTS`                                                                                                                             |
| Notation  | `eventsFromDurations` (durations, negative for a rest), `playedBeats`, `rhythmLength`, `figureOf` → `NoteFigure` (`id`: `FigureId`, a key), `beamGroups`, `staffStep`                                |
| Session   | `attachPlayAlong` (a run on a live analysis, no React: `results`, `onsets`, `roundTripMs`, `biasMs`, `finished`, `subscribe`, `finish`, `stop`), `PlayAlongSession` (the pure engine under it)       |
| Labels    | `noteLabeler`, `chordLabeler` (what was played at an onset), `noteLabel` (the pitch-class key)                                                                                                       |
| Stats     | `timingStats` (bias, jitter, drift), `medianOf`, `OnsetEvidence` (label observations → label per onset)                                                                                              |

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
processor posts batches tagged with the AudioContext frame of their first sample
(`SampleBatchInfo`), loads once per context, and is shipped **inside the bundle as a string** and loaded through a Blob URL
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
