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

The lab's **Rhythm** tab shows all of it, live: the three exercises, the
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
refinement). Add the capture batch (11 ms with 512) and delivery for the
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
  4 s, with the gate slightly too open meanwhile.
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
  otherwise 10 ± 8 ms is assumed. A Bluetooth headset microphone (spotted
  by its label) is assumed at 150 ± 50 ms.

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

| Component      | Offset                                  | σ                                               | Source                       |
| -------------- | --------------------------------------- | ----------------------------------------------- | ---------------------------- |
| input          | reported, else 10 ms (Bluetooth 150 ms) | max(5, ½ reported), else 8 ms (Bluetooth 50 ms) | reported / assumed           |
| display        | 1.5 frames                              | 1 frame                                         | assumed (period measured)    |
| clock          | 0                                       | offset spread, ≥ 0.5 ms                         | measured                     |
| detector       | 0                                       | 4 ms                                            | assumed (synthetic baseline) |
| strum (chords) | 0                                       | 12 ms                                           | assumed                      |

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
Defaults ±50 / ±150 ms, between rhythm-game "good" windows (±70–100 ms)
and the chain's own precision. `toleranceFromUncertainty(σ)` widens them to
2σ / 3σ: a window narrower than the measurement would grade the
microphone, not the player.

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

## 6. Using it in an exercise

```tsx
import { useOnsetAnalysis } from "@audiolab/react";
import { chordAfterOnset, chordReadyAt } from "@audiolab/core";
import { chordKey } from "@audiolab/core/games";
import { TimingScorer, toleranceFromUncertainty } from "@audiolab/core/rhythm";

// notes: [{ id, time /* AudioContext s */, label: chordKey(chord) }]
const scorerRef = useRef<TimingScorer | null>(null);
const pending = useRef<{ id: number; frame: number; readyAt: number }[]>([]);

const { analysis, budget } = useOnsetAnalysis(mic, {
  strummed: true,
  onOnset: (onset) => {
    scorerRef.current?.onset({ id: onset.id, time: onset.time });
    pending.current.push({
      id: onset.id,
      frame: onset.frame,
      readyAt: chordReadyAt(onset.frame, sr),
    });
  },
  onBatch: (history, analysedTime) => {
    const scorer = scorerRef.current;
    if (!scorer) return;
    pending.current = pending.current.filter((p) => {
      if (p.readyAt > history.range.to) return true;
      const best = chordAfterOnset(history, p.frame, sr)[0];
      scorer.label(p.id, best ? chordKey(best) : null);
      return false;
    });
    scorer.advance(analysedTime);
  },
});

// At start: targets on the audio clock, tolerance and offset from the budget.
const now = analysis!.clock.perfMsToContextTime(performance.now())!;
scorerRef.current = new TimingScorer(notesFrom(now + 3), {
  tolerance: toleranceFromUncertainty(budget!.uncertaintyMs),
  offsetMs: budget!.offsetMs,
  adaptiveBias: true,
});

// In the rAF loop: x = hitX + (note.time − perfMsToContextTime(performance.now())) · speed
```

For a written rhythm, collect `onset.time` values and call
`fitPattern(beats, times)` after each onset; no budget is needed.

## 7. Limits

- **No absolute calibration without a sound.** The input latency is
  assumed or reported; `adaptiveBias` corrects a constant error but cannot
  tell latency from a steady rush. Saying "you rush by 30 ms" against a
  scrolling target is not reliable; saying it within a written rhythm
  (`fitPattern` residuals) is.
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
- **Bluetooth output** delays what the player hears by 150–300 ms; it only
  matters if the exercise plays sound (these exercises do not).
- **Synthetic numbers**: the accuracy table comes from synthetic plucks;
  measure on labelled recordings before quoting real-world figures.

## 8. References

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
