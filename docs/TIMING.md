# Timing: onsets, adaptive gate, latency and rhythm

How AudioLab tells **when** a note was played, how sure it can be, and how
a rhythm exercise uses that. Everything here runs in the browser on the
learner's device, without playing any sound (no click, no loopback), and
without any setting for the learner to adjust.

The tools are separate modules; each can be used on its own.

| Need                                      | Tool                                                                         | Entry                   |
| ----------------------------------------- | ---------------------------------------------------------------------------- | ----------------------- |
| Frame-tagged audio batches                | `startSampleCapture` (`SampleBatchInfo`)                                     | `@audiolab/core`        |
| When a note starts                        | `OnsetDetector` (`SuperFluxOdf` + `OnlinePeakPicker` + `AttackEnvelope`)     | `@audiolab/core`        |
| Is someone playing (no slider)            | `AdaptiveNoiseGate` / `stepNoiseGate`, `LevelFloorTracker`, `BandLevelMeter` | `@audiolab/core`        |
| Onsets that rise above the room           | `OnsetPipeline`                                                              | `@audiolab/core`        |
| Audio clock ↔ page clock, delivery delays | `AudioClockSync`                                                             | `@audiolab/core`        |
| How late, how sure                        | `estimateTimingBudget`, `combineTimingComponents`                            | `@audiolab/core`        |
| The live loop                             | `startOnsetAnalysis` (`latest()`, `subscribe()`)                             | `@audiolab/core`        |
| Which note / chord at an onset            | `StreamHistory`, `noteAfterOnset`, `chordAfterOnset`                         | `@audiolab/core`        |
| Grade notes on a timeline                 | `TimingScorer` / `stepTimingScorer`, `scoreTimings`                          | `@audiolab/core/rhythm` |
| Grade a written rhythm at a free tempo    | `fitPattern`                                                                 | `@audiolab/core/rhythm` |
| Windows from the chain's precision        | `toleranceFromUncertainty`, `classifyDelta`                                  | `@audiolab/core/rhythm` |
| Bias, jitter, drift                       | `timingStats`                                                                | `@audiolab/core/rhythm` |
| React                                     | `useOnsetAnalysis`, `useDisplayFramePeriod`                                  | `@audiolab/react`       |
| A steady beat, a metronome                | `beatTime`, `beatAt`, `beatsBetween` (`BeatGrid`), `startMetronome`          | `@audiolab/core`        |
| Tell the click from the playing           | `clickBandShare`, `ClickEchoFilter` (also measures the round trip)           | `@audiolab/core`        |
| A whole play-along exercise               | `PlayAlongSession`                                                           | `@audiolab/core/rhythm` |
| Draw it                                   | `PlayAlongLane`, `BeatLights`, `targetState`; `useMetronome`                 | `@audiolab/react`       |

The lab's **Rhythm** tab shows all of it, live: four exercises (rhythm lane,
written rhythm, scrolling notes, scrolling chords) on a metronome, the
automatic gate with an onset timeline, and the latency budget.

## 1. The clock: one sample-exact timeline

Before this work the capture posted bare 2048-sample batches; the page
could only date them by their arrival, 43 ms of batching plus whatever the
main thread was doing. Now the worklet tags each batch with the
AudioContext frame of its first sample (`currentFrame`), so:

- **timestamps are exact**: an onset's frame is a sample index on the audio
  clock, whatever the batch size, the main-thread load or a late message;
- **delivery only delays the verdict**: a batch that arrives 60 ms late
  makes the feedback appear 60 ms late, never moves the note on the
  timeline.

The batch size is a processor option (default 2048; `startOnsetAnalysis`
uses 512 ≈ 11 ms so feedback reaches the page sooner). The worklet module
is added once per AudioContext, its processor name is versioned
(`audiolab-sample-capture-2`), and the batcher flushes on a frame
discontinuity so a batch never spans a gap. The AnalyserNode fallback
estimates its frames from `currentTime` and flags them `exact: false`.

The canonical time is **AudioContext seconds**. A game drawn with
requestAnimationFrame converts its timestamp once per frame:
`analysis.clock.perfMsToContextTime(performance.now())`.

## 2. Onset detection

`OnsetDetector` chains three stages, all streaming and causal.

### 2.1 SuperFlux onset function

Böck & Widmer (2013). A spectral flux on a log-frequency, log-magnitude
spectrogram whose reference frame is spread across frequency by a maximum
filter:

```
X[n,k]  = |STFT|                      Hann window ≈ 21 ms (1024 at 48 kHz), hop 128 (2.7 ms)
S[n,b]  = log10(1 + λ·Σk F[b,k]·X[n,k])   triangular filters, 12 per octave, 30 Hz–16 kHz
Sᵐ[n,b] = max(S[n, b−1 … b+1])            the maximum filter
odf[n]  = (1/B)·Σb max(0, S[n,b] − Sᵐ[n−μ,b])
```

- The log magnitude makes the flux depend on level ratios, so the
  microphone gain barely matters, and very quiet noise stays in the linear
  part of log(1 + x).
- The maximum filter is SuperFlux's contribution: a partial that drifts by
  a band (vibrato, bend, a ringing string slightly out of tune) falls
  inside the widened reference and is not counted as a new note. A real
  attack raises many bands at once.
- μ is the frame whose Hann window overlaps the current one by half (2
  hops with 1024/128), as madmom's `diff_ratio = 0.5`.
- Dividing by the band count makes the thresholds independent of the
  filterbank.

### 2.2 Online peak picking

Böck, Krebs & Schedl (2012). Frame n is an onset when it is the maximum of
the last 30 ms (plus one frame of look-ahead), exceeds the mean of the last
100 ms by `delta` (0.03), exceeds `threshold` (0.01), and comes at least
50 ms after the previous onset. The 50 ms "combine" window merges the
strings of a strum into one event.

### 2.3 Attack localisation

The flux says that a note started somewhere in its last 21 ms window; a
fine envelope says where. `AttackEnvelope` keeps the RMS level of 32-sample
blocks (0.7 ms) of the pre-emphasised signal (y = x − 0.97·x₋₁, which tilts
the level towards the broadband pick transient and away from the low
partials of ringing strings). Ten ms after a detection:

1. the rise starts after the quietest block of the search range; its
   **peak** is the first block within 6 dB of the loudest one (for a strum,
   the first string, not the loudest);
2. the **baseline** is the quietest block in the 30 ms before that peak;
3. the **attack** is the start of the run of blocks, ending at the peak,
   above baseline + 30 % of the rise (in dB, the rise capped at 30 dB so a
   digital-silence baseline does not stretch it).

Without a rise of 4 dB (legato, a note under a louder ringing one) the
onset falls back to the middle of the flux window and is flagged
`localized: false`.

**Decision latency** (when the onset is known, not when it happened):
≈ 24 ms at 48 kHz (half a window, one hop of look-ahead, 10 ms of
refinement); the worst case, an attack at the far end of the searched
window, is `maxDecisionLatencySeconds` ≈ 34 ms, and the analysed time
passed to scorers (`analysedTime`) subtracts that worst case so no note is
declared missed while its onset is still being decided. Add the capture batch (11 ms with 512) and delivery for the
reaction delay shown in the lab.

### 2.4 Measured accuracy

`npm run measure:onsets` runs the whole `OnsetPipeline` (detector + gate,
512-sample batches) on synthetic performances and matches onsets to the
truth within ±50 ms, one to one (MIREX protocol). Errors are detected −
true.

| Case                                          | Notes | F (±50 ms) | Precision | Recall | Median abs. error | p90 abs. error | Mean error | Attack found | Decision delay |
| --------------------------------------------- | ----- | ---------- | --------- | ------ | ----------------- | -------------- | ---------- | ------------ | -------------- |
| Single notes, quiet room (−66 dBFS)           | 40    | 0.99       | 100 %     | 98 %   | 0.0 ms            | 2.0 ms         | -0.6 ms    | 100 %        | 23.7 ms        |
| Single notes, noisy room (−50 dBFS)           | 40    | 0.97       | 98 %      | 98 %   | 0.0 ms            | 0.7 ms         | -0.6 ms    | 100 %        | 23.9 ms        |
| Single notes, loud room (−44 dBFS)            | 40    | 0.99       | 98 %      | 100 %  | 0.0 ms            | 4.0 ms         | -1.5 ms    | 100 %        | 25.6 ms        |
| Fast notes (eighths at 160 BPM)               | 40    | 0.92       | 100 %     | 85 %   | 1.3 ms            | 7.8 ms         | -2.8 ms    | 100 %        | 26.5 ms        |
| Same note repeated                            | 30    | 0.97       | 97 %      | 97 %   | 0.0 ms            | 2.0 ms         | -0.4 ms    | 100 %        | 23.4 ms        |
| Soft attacks (15 ms ramp, no pick)            | 40    | 0.90       | 100 %     | 83 %   | 2.7 ms            | 8.7 ms         | 3.2 ms     | 100 %        | 25.1 ms        |
| Strummed chords (15–50 ms across the strings) | 24    | 0.98       | 100 %     | 96 %   | 0.0 ms            | 1.3 ms         | 1.2 ms     | 100 %        | 26.5 ms        |
| Slow strums (60–100 ms across the strings)    | 24    | 0.94       | 92 %      | 96 %   | 0.7 ms            | 14.0 ms        | 1.4 ms     | 100 %        | 25.6 ms        |

**Read these as an upper bound.** The synthetic plucks have an ideal
attack, no room reverberation, no microphone processing; the published
real-world numbers for online detectors are F ≈ 0.80–0.85 at ±50 ms on
mixed material (Böck et al. 2012). What the table does show:

- where the detector loses notes: **quiet notes right after a louder one**
  (in the cases inspected, a note 8–15 dB below a predecessor that is still
  ringing; this is what the fast-notes and soft-attack misses look like) and
  **slow strums** (beyond the 50 ms
  combine window, a strum can give two onsets);
- that the timing of what is found is essentially exact (the attack is
  found on the envelope for every matched note).

To measure on your own recordings: label the attacks in Audacity (one
label per note at the attack), export the label track, then
`npm run measure:onsets -- take.wav labels.txt`.

## 3. Adaptive noise gate (no slider)

The goal is a gate a learner never touches, and that would rather let a
noise through than cut a note.

- **Level**: `BandLevelMeter` high-passes at 80 Hz (2nd-order Butterworth:
  −8 dB at 50 Hz mains hum, −3 dB at the low E) and measures 10 ms blocks.
- **Background**: `LevelFloorTracker`, the minimum of the smoothed level
  over the last 6 s, kept as six one-second sub-minima (the layout of
  Martin's minimum statistics, 2001, without its bias compensation: the
  floor sits slightly _under_ the background, towards letting sound
  through). It falls at once and rises only when a whole window had no
  quieter moment.
- **Rise limit**: the gate's floor starts at −90 dBFS and climbs at most
  6 dB/s. A player who starts at once with a steady level is therefore
  not learnt as background (10 s to climb from −90 to −30 dBFS, and every
  decay between notes pulls it back down); a quiet room is learnt in about
  4 s, with the gate slightly too open meanwhile. `settling` is true while
  the floor is still climbing: an exercise can show "listening to the
  room…" for a few seconds before its count-in.
- **Decision**: opens instantly at floor + 6 dB, or on a caller's tonal cue
  (Wolf Jumper passes a clear pitch); closes below floor + 3 dB after
  250 ms (hysteresis + hold: a guitar decays slowly); open during the first
  500 ms; floor clamped to [−90, −30] dBFS, `noisy` above −45 dBFS so a UI
  can say "play closer to the microphone" instead of blocking everything.

The gate never cuts the signal fed to the onset detector (a gate that
cuts creates onsets when it opens). `OnsetPipeline` accepts an onset when
its attack's band level reaches floor + 6 dB. In practice the detector
already ignores bursts of noise (3 and 6 dB bursts gave no candidate in
the tests); the margin is a safety net for very quiet rooms.

Wolf Jumper uses it: `WolfJumperDetector` takes `gate: "adaptive"`
(default `"fixed"` for existing callers) and the React game gates
automatically by default, "Set it myself" bringing the slider back.

## 4. Latency without a sound

### 4.1 What shifts a detected note

For a target drawn at T and a perfectly timed player:

```
detected onset (audio clock) = T + display + input
```

- **display**: the target is seen ≈ 1.5 frames after it is drawn
  (composition at the next vsync, scan-out), more on a TV. The frame period
  is measured (`useDisplayFramePeriod`), the 1.5-frame model is assumed.
- **input**: microphone, converter and driver buffers, until the samples
  reach the audio thread. **No web API measures it without playing a sound
  and recording it** (loopback). `MediaTrackSettings.latency` is used when
  it is plausible (0–500 ms; Chrome is known to report a constant),
  otherwise 10 ± 8 ms is assumed. When nothing is reported and the label
  says Bluetooth (`bluetooth`, `airpods`, `hands-free`, `bt`; not
  "headset", which wired USB headsets share), 100 ± 60 ms is assumed: a
  label is a weak clue, the adaptive bias refines it.

What does **not** shift timestamps: the capture's batching, the delivery
to the main thread, the detector's decision delay. They only delay the
feedback ("reaction delay" in the lab).

### 4.2 What the capture measures (`AudioClockSync`)

From the frame-tagged batches alone:

- **clock offset**: a batch cannot arrive before its last sample was
  processed, so `received − contextEnd` is the offset plus a non-negative
  delay; its minimum over the last 5 s is the offset (it follows a slow
  drift between the two clocks). The tests recover it within 0.5 ms under
  8 ms of jitter, and follow a 100 ppm drift.
- **delivery delay** of each batch beyond the best case (median, p95, max);
- **startup**: from the start request to the first batch and to the first
  batch with signal; this is the "samples take time to start" effect
  (AudioContext resume, worklet module load, microphone warm-up);
- **gaps** in the frame sequence (dropped audio).

### 4.3 The budget

`estimateTimingBudget` turns this into components, each with an offset, a
standard deviation and a source (`measured`, `reported`, `assumed`):

| Component      | Offset                                         | σ                                                      | Source                       |
| -------------- | ---------------------------------------------- | ------------------------------------------------------ | ---------------------------- |
| input          | reported, else 10 ms (Bluetooth label: 100 ms) | max(5, ½ reported), else 8 ms (Bluetooth label: 60 ms) | reported / assumed           |
| display        | 1.5 frames                                     | 1 frame                                                | assumed (period measured)    |
| clock          | 0                                              | offset spread, ≥ 0.5 ms                                | measured                     |
| detector       | 0                                              | 4 ms                                                   | assumed (synthetic baseline) |
| strum (chords) | 0                                              | 12 ms                                                  | assumed                      |

Offsets add; uncertainties add in quadrature. A typical wired setup on a
60 Hz screen gives ≈ 35 ms of offset and σ ≈ 19 ms. `minToleranceMs = 2σ`
is the narrowest window in which a perfectly timed note lands 95 % of the
time.

### 4.4 Learning the rest from the player

Assumed components can be wrong by a constant (a TV, an unlisted Bluetooth
device). `TimingScorer` with `adaptiveBias: true` learns the median offset
of the last 8 matched notes (after 4, bounded by ±250 ms) and subtracts it
from later ones. This is the calibration that needs no sound: the first
notes of a scrolling exercise teach the offset. It also absorbs a steady
tendency to rush or drag, so it suits "play with the scrolling notes",
not "measure whether the learner rushes".

## 5. Rhythm assessment (`@audiolab/core/rhythm`)

Pure logic over `{ time }` objects; no Web Audio.

### 5.1 Tolerance

`|Δ| ≤ onTimeMs` → on time; up to `windowMs` → early / late; no onset → missed.
Defaults ±100 / ±300 ms (play-tested: ±50 / ±150 ms felt too strict for learners), above rhythm-game "good" windows (±70–100 ms)
and the chain's own precision. `toleranceFromUncertainty(σ)` widens them to
2σ / 3σ: a window narrower than the measurement would grade the
microphone, not the player.

### 5.1b A continuous score per note

On top of the tiers, every resolved note gets `score` in [0, 1], a Gaussian of its
corrected offset (latency and bias removed, the same as `deltaMs`):

```
score = timingScore(Δ, σ) = exp(−Δ² / (2σ²))      missed → 0, unresolved → null
```

A note passes from `SCORE_PASS` = 0.8. By default σ is derived from the tolerance so
that the on-time edge scores exactly 0.8 (`scoreSigmaFor(tolerance)`:
σ = onTimeMs / √(2·ln 1.25), **≈ 149.7 ms at ±100 ms**), so the `onTime` tier and
"score ≥ 0.8" agree. Set `scoreSigmaMs` to change the curve; `sigmaForScore(80, 0.8)`
gives the σ for "0.8 at ±80 ms" (≈ 119.8 ms). `fitPattern` scores each note on its
residual the same way (option `scoreSigmaMs`). The tiers do not change.

### 5.2 Scrolling notes and chords: `TimingScorer`

Each expected note accepts onsets within ±wₖ, wₖ = min(windowMs, ½ · gap to
the nearest note) so windows never overlap; an onset goes to the nearest
open note; a note keeps its nearest onset (others are extras). A note
resolves as soon as an onset lands in the on-time window, otherwise when
the analysed time passes its window (pass `analysedTime`, the time up to
which every onset is known, so a note is not declared missed while its
onset is still being decided). Timing and label are two separate verdicts:
`label(onsetId, heard)` grades "right note / chord" independently.

### 5.3 What was played: `noteAfterOnset`, `chordAfterOnset`

The live tonality frames cannot say which chord was strummed at 12.345 s
(1 s window, polled without an audio timestamp). These functions analyse
the samples that follow the onset, from a `StreamHistory` addressed by
frame: McLeod pitch on 2048 samples from 30 ms after the attack (verdict
≈ 75 ms after the onset), or a chroma of a 170 ms segment from 30 ms after
it (verdict 200 ms after). The short chord segment has 6 Hz bins, so bass
notes leak: use a generous threshold. `OnsetEvidence` does the same pairing
for any stream of timestamped label observations.

### 5.4 Written rhythm at a free tempo: `fitPattern`

The exercise gives note positions in beats; the player plays without a
click. The performance is fitted as `t = a + b·beat` (start, seconds per
beat) from a tempo hint, the first two onsets, or the span, refined by
matching and least squares with outlier rejection; each note is graded on
its residual. **Latency cancels completely** (it only moves `a`), and a
slow or fast player is not penalised, only an uneven rhythm. Below three
matched notes the fit is flagged unreliable.

### 5.5 Statistics

`timingStats`: bias = median Δ, jitter = IQR / 1.349 (σ for normal
offsets), drift = Theil–Sen slope of Δ over time (ms per second).

## 6. Metronome and play-along

### 6.1 Metronome

`startMetronome(context, { bpm, beatsPerBar, sound })` schedules its clicks on
the AudioContext clock with the look-ahead pattern (a 25 ms timer schedules
the next 150 ms with `OscillatorNode.start(time)`), so a busy main thread
never makes a click late; a main thread blocked longer than 150 ms, or a
background tab whose timers the browser slows down, drops the clicks it could
not schedule (silence, never a late click). Beat 0 comes one bar after the start: the first
bar is the count-in. Its `grid` (`BeatGrid`) places the notes of an
exercise written in beats (`beatTime(grid, 2.5)` is the "and" of beat 3), and
the beat and bar lines of a display. With `sound: false` the grid runs
silently, for a visual metronome (`BeatLights`).

### 6.2 The click in the microphone

Without headphones the microphone hears the click. The click is a 30 ms
sine burst at 2640 Hz (3520 Hz on the downbeat), high where a guitar has
little new energy. `clickBandShare` compares the spectrum just after an onset
with the one just before: a click puts most of its _new_ energy in the
2.3–4 kHz band (over 0.8 in the tests, even over a ringing string), a guitar
attack spreads it (under 0.4). `ClickEchoFilter` calls an onset the click's
echo when it follows a scheduled click within 400 ms and its band share is
at least 0.6; a strum played on the beat merges with the echo into one
broadband onset and stays a note.

Each echo is also a free **loopback measurement**: the delay from the
scheduled click to its detection is the whole round trip (output buffers,
speaker, air, microphone, input buffers), the offset of a player who plays
with what they hear. Its median is `roundTripMs`; passed to the budget with
`reference: "audio"`, it replaces the assumed output and input latencies, and
the budget becomes `calibrated`. With headphones there is no echo: the
budget uses the reported `outputLatency + baseLatency` and the assumed input.

**A click that is not the SDK's.** The defaults fit the SDK's sine clicks. For a host's
own metronome, two things change:

- `clicks.times` lists the AudioContext time of every click that actually sounds. With
  Tone.js, push the `time` argument of the callback that triggers the click (a
  `Tone.Part` or `Transport.scheduleRepeat` callback): it already includes Tone's
  `lookAhead` and is on the native context's clock. Drop entries older than a few
  seconds.
- `clicks.band` must hold the click's energy. A band-pass noise click (a clave at
  2400 Hz, Q 2.4, has a −3 dB band of about 1.95–2.95 kHz) keeps only about half of its
  energy in the default 2.3–4 kHz band, under the 0.6 threshold, so its echoes would
  count as late notes. A band around the click, e.g. `[1700, 3400]`, holds about 0.7 of
  it. **Not measured yet:** whether guitar attacks stay under 0.6 in that lower band (the
  pick has energy there); check `run.onsets` (`echo` flags) on real takes, or keep
  headphones, before relying on it.

Which latency applies depends on what the player follows:

| Reference                                     | Offset                                     |
| --------------------------------------------- | ------------------------------------------ |
| `"visual"` (a scrolling target, `BeatLights`) | input + display                            |
| `"audio"` (an audible click)                  | input + output, or the measured round trip |

### 6.2b Bluetooth headphones: latency by ear

With Bluetooth headphones (a phone, typically) the click is heard 150–400 ms
after its scheduled time, the microphone hears no echo, and no web API
measures the delay reliably (`outputLatency` may be missing or optimistic).
Two things go wrong at once: the grading subtracts the assumed 20 ms instead
of the real delay, and the lane reaches its line that much before the click
is heard, so screen and ear disagree.

**The test** (`measureTapLatency`, `useLatencyTest`): a 4-click count-in,
then 8 clicks to play on, 750 ms apart (`LATENCY_TEST`). Each click owns the
notes in [−150, +600) ms after it; the gap is as long as that window, so a
note belongs to one click only, even with 400 ms of delay (eighth notes at
a usual tempo would be ambiguous: at 90 BPM they are 333 ms apart). The
median delay is the offset, notes 80 ms away from it are dropped, the spread
is IQR / 1.349; reliable from 5 notes and a spread up to 40 ms. Without
headphones the test's own play-along run drops the click's echoes. The
delay includes the player's habit of playing slightly ahead of a click,
which is what they will do in the exercise too.

**The budget** takes it as `calibratedOffsetMs` with
`calibrationReference: "audio"`: it replaces input + output when the player
follows the click, and is ignored for a visual reference (the Bluetooth
delay is not in that chain). A measured echo still wins.

**The screen** is held back: `budget.outputDelayMs` is how late the click is
heard (the measured delay minus the input estimate, or the reported
output), `budget.visualDelayMs` that minus the screen's own 1.5 frames,
never negative. Draw anything placed on the audio clock that much later
(`now = contextTime − visualDelayMs / 1000`) and the lane reaches its line
when the click is heard. On a wired setup it is about 0 (a 20 ms output
against a 25 ms screen), so nothing moves there.

### 6.3 `PlayAlongSession`

One exercise run, pure: expected notes in, onsets in, results and a display
list out.

- `onset(o)` queues an onset; `update(history, analysedTime)` processes the
  queue once the samples just after each onset are captured, drops the
  click's echoes (`clicks` option), grades the rest with a `TimingScorer`,
  names what was played with an `OnsetLabeler` once its audio is in
  (`labeler` option: `noteAfterOnset` / `chordAfterOnset`), then advances. The
  scorer advances only with an empty queue, so a note is never closed before
  its onset is in.
- `onsets` lists every onset with its played time (latency and learnt bias
  removed) and an `echo` flag: this is what `PlayAlongLane` draws as red
  (notes) and grey (clicks) dots, so the player sees whether each note came
  before or after its target.
- `done` is true once every note is graded and labelled.

### 6.4 Written as on a score

An exercise is written as durations in beats, a negative one for a rest
(`eventsFromDurations([1, 1, 0.5, 0.5, -1])`): the notes to play are
`playedBeats`, placed on the metronome grid with `beatTime`. `StaffNotation`
draws the same events as a score, above the lane: a one-line rhythm staff
(figures, dots, beams per beat, rests, the count "1 & 2 & …" underneath), or
a treble staff with the guitar 8 when pitches are given, chord symbols on
top. Time is proportional, so the notes sit above their beats; the cursor and
the red dots move without re-rendering, and each note takes its verdict
colour.

### 6.5 `PlayAlongLane`

A canvas lane: targets travel right to left and reach the hit line at their
time; the band around the line is the tolerance (`toleranceFromUncertainty`
of the budget: darker for on time, lighter for still early / late); beat and
bar lines follow the grid; dots show the detected onsets. It redraws on
every animation frame from `now()` and `onsets()` and only re-renders when its
`targets` change. `targetState(result)` maps a `NoteResult` to a lane colour.

## 7. Using it in an exercise

```tsx
import { beatTime, chordAfterOnset, chordReadyAt, ClickEchoFilter } from "@audiolab/core";
import { chordKey } from "@audiolab/core/games";
import { PlayAlongSession, toleranceFromUncertainty } from "@audiolab/core/rhythm";
import { PlayAlongLane, targetState, useMetronome, useOnsetAnalysis } from "@audiolab/react";

const echo = useMemo(() => new ClickEchoFilter(), []); // keeps the round trip across runs
const metronome = useMetronome(mic?.context ?? null);
const session = useRef<PlayAlongSession | null>(null);
const [results, setResults] = useState<readonly NoteResult[]>([]);

const { analysis, budget } = useOnsetAnalysis(mic, {
  strummed: true,
  reference: "audio",
  roundTripMs: echo.roundTripMs,
  onOnset: (onset) => session.current?.onset(onset),
  onBatch: (history, analysedTime) => {
    const s = session.current;
    if (s && s.update(history, analysedTime).length > 0) setResults([...s.results]);
  },
});
const now = () => analysis?.clock.perfMsToContextTime(performance.now()) ?? null;

function start() {
  const m = metronome.start({ bpm: 80, sound: true }); // one-bar count-in
  if (!m || !budget) return;
  session.current = new PlayAlongSession(
    chords.map((c, i) => ({ id: i, time: beatTime(m.grid, i * 2), label: chordKey(c) })),
    {
      sampleRate: mic.context.sampleRate,
      tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
      offsetMs: budget.offsetMs,
      adaptiveBias: !budget.calibrated,
      clicks: { times: () => m.clickTimes, filter: echo },
      labeler: {
        readyAt: (frame) => chordReadyAt(frame, mic.context.sampleRate),
        label: (history, frame) => {
          const best = chordAfterOnset(history, frame, mic.context.sampleRate)[0];
          return best ? chordKey(best) : null;
        },
      },
    },
  );
}

<PlayAlongLane
  now={now}
  grid={metronome.metronome?.grid}
  tolerance={budget && toleranceFromUncertainty(budget.uncertaintyMs)}
  onsets={() => session.current?.onsets ?? []}
  targets={results.map((r, i) => ({
    time: r.expectedTime,
    label: names[i],
    state: targetState(r),
  }))}
/>;
```

**Without React** (`attachPlayAlong`, `@audiolab/core/rhythm`): one analysis for the
whole lesson, one run per exercise. The host owns the context, the microphone and the
metronome (here a Tone.js clave); the SDK never closes them.

```ts
import * as Tone from "tone";
import {
  ClickEchoFilter,
  estimateTimingBudget,
  nativeAudioContext,
  openMicrophone,
  startOnsetAnalysis,
  timingInputFromMic,
} from "@audiolab/core";
import {
  attachPlayAlong,
  toleranceFromUncertainty,
  type ExpectedNote,
} from "@audiolab/core/rhythm";

await Tone.start();
const context = nativeAudioContext(Tone.getContext().rawContext as AudioContext);
const mic = await openMicrophone({ context });
const analysis = await startOnsetAnalysis(context, mic.source, { historySeconds: 3 });
const echoes = new ClickEchoFilter(); // keep it: the round trip carries over to the next run

// The site's metronome: note the time of every click that sounds.
const clickTimes: number[] = [];
const part = new Tone.Part(
  (time) => {
    clave.trigger(time); // the host's own sound, bus and limiter
    clickTimes.push(time);
    while (clickTimes.length && clickTimes[0] < time - 4) clickTimes.shift();
  },
  beats.map((b) => b * Tone.Time("4n").toSeconds()),
);

function play(notes: ExpectedNote[], endTime: number) {
  const budget = estimateTimingBudget({
    ...timingInputFromMic(mic),
    reference: "audio",
    measuredRoundTripMs: echoes.roundTripMs,
    roundTripSpreadMs: echoes.spreadMs,
  });
  const run = attachPlayAlong(analysis, notes, {
    endTime,
    tolerance: { onTimeMs: 100, windowMs: 300 }, // pass it: don't rely on defaults
    offsetMs: budget.offsetMs,
    adaptiveBias: !budget.calibrated,
    clicks: { times: () => clickTimes, filter: echoes, band: [1700, 3400] },
  });
  run.subscribe((e) => {
    if (e.type === "results") draw(run.results); // note by note: tier, deltaMs
  });
  return run; // run.finished resolves at endTime; run.finish() / run.stop() end it early
}

// notes: one per played beat, on the AudioContext clock, e.g.
// const t0 = Tone.Transport.seconds…; notes = beats.map((b, i) => ({ id: i, time: start + b * spb }))
```

`offsetMs` is fixed when a run starts: the round trip measured during a run applies
from the next one (or keep `adaptiveBias` on). The run has no timer: if the capture
stops (suspended context, background tab) it waits; `finish()` ends it.

For a written rhythm, collect `onset.time` values and call
`fitPattern(beats, times)` after each onset; no budget is needed.

## 8. Limits

- **Absolute calibration needs the click in the microphone.** With an
  audible metronome and no headphones, the click's echo measures the round
  trip and "you rush by 30 ms" is meaningful. With headphones or a visual
  reference, the input latency is assumed or reported; `adaptiveBias`
  corrects a constant error but cannot tell latency from a steady rush.
  Within a written rhythm at a free tempo (`fitPattern` residuals) the
  latency cancels anyway.
- **Click echo heuristics**: a click over a very loud strum may not be
  recognised (the strum's broadband rise dominates) and then counts as the
  player's onset if no note was played; a guitar with strong 2.3–4 kHz
  content could in principle look like a click. Headphones remove both.
- **Quiet after loud**: a note 10–15 dB below a still-ringing one may be
  missed; hammer-ons, pull-offs and slides often have no attack at all.
  A pitch-change detector would be the next step (not done).
- **Slow strums** (> 50 ms across the strings) can give two onsets; raise
  `combineSeconds` for strummed exercises, at the cost of fast repeated
  strums.
- **Phones and laptops** may keep automatic gain control or noise
  suppression on even when asked not to (`trackSettings` tells); AGC
  flattens attacks and moves the floor.
- **Room reverberation** smears the attack of quiet notes; the 50 ms
  combine window and the moving-average threshold limit false onsets.
- **Background tabs** throttle the page, not the worklet: timestamps stay
  exact, feedback stalls.
- **Bluetooth output** delays the click by 150–300 ms. With the click in the
  microphone the round trip measures it; with Bluetooth headphones there is
  no echo, and the reported `outputLatency` may or may not include it.
- **Synthetic numbers**: the accuracy table comes from synthetic plucks;
  measure on labelled recordings before quoting real-world figures.

## 9. References

- J. P. Bello, L. Daudet, S. Abdallah, C. Duxbury, M. Davies, M. Sandler,
  "A tutorial on onset detection in music signals", IEEE Trans. Speech and
  Audio Processing 13(5), 2005.
- S. Dixon, "Onset detection revisited", Proc. DAFx, 2006.
- S. Böck, F. Krebs, M. Schedl, "Evaluating the online capabilities of onset
  detection methods", Proc. ISMIR, 2012.
- S. Böck, G. Widmer, "Maximum filter vibrato suppression for onset
  detection", Proc. DAFx, 2013.
- R. Martin, "Noise power spectral density estimation based on optimal
  smoothing and minimum statistics", IEEE Trans. Speech and Audio
  Processing 9(5), 2001.
- P. McLeod, G. Wyvill, "A smarter way to find pitch", Proc. ICMC, 2005.
- P. K. Sen, "Estimates of the regression coefficient based on Kendall's
  tau", JASA 63, 1968.
- B. H. Repp, "Sensorimotor synchronization: a review of the tapping
  literature", Psychonomic Bulletin & Review 12(6), 2005.
- W3C, Web Audio API (`AudioWorkletGlobalScope.currentFrame`,
  `AudioContext.outputLatency`, `getOutputTimestamp`); MDN,
  `MediaTrackSettings.latency`.
- madmom (CPJKU), librosa `onset_backtrack`: reference implementations.
