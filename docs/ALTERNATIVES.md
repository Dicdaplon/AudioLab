# Alternative methods

Opt-in alternatives to the chord and key pipeline, added next to the original one (which stays
the default) and measured against it. Started 2026-10-23 on branch `feat/alternative-methods`
from a plan built around CQT and wavelets; the plan was reordered after expert reviews (a
DSP/MIR one, three passes, and an audio-ML one), and the measurements below decided what is
worth keeping. On 2026-10-26 the measurements moved to real guitar: GuitarSet.

## In one table

On 46 minutes of real acoustic guitar that no setting was tuned on (GuitarSet, players 03–05),
against the lead sheet, majmin, at display time:

| Method                                         | Chords right | vs default, paired 95 % CI | Answer after a change | Wrong switches / min | JS cost / frame |
| ---------------------------------------------- | ------------ | -------------------------- | --------------------- | -------------------- | --------------- |
| 1 s window (default)                           | 48.6 %       | –                          | 670 ms                | 51.6                 | 145 µs          |
| **HMM + gaussian-log chroma** (`follow-sharp`) | **51.8 %**   | **+3.2 [+1.1, +5.1]**      | **410 ms**            | **40.4**             | 179 µs          |
| HMM (`follow`)                                 | 51.0 %       | +2.4 [+1.1, +3.7]          | 472 ms                | 52.2                 | 148 µs          |

Keys on the 180 GuitarSet excerpts (120 major, 60 minor): **44.4 % → 60.6 %** exact with the
gaussian-log chroma (minor keys 38 % → 68 %). On the 5 trusted backing tracks (all minor):
56 % → 68 % accepted, with one modal track broken. Both stay opt-in; the defaults are unchanged.

## What was added

Every option defaults to the original behaviour; the 799 tests that existed before pass
unchanged, and a test checks that a default frame carries none of the new fields.

| Option (TonalityEngine / useTonality)                        | What it does                                                                                                                               | Code                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `chordSmoothing: "hmm"` (+ `chordHmm`)                       | Chord templates matched on every frame, then smoothed by a hidden Markov model with a "no chord" state, instead of averaging 1 s of chroma | `analysis/chordHmm.ts`     |
| `chromaMethod: "gaussian-log"`                               | Each FFT bin shared between its two nearest semitones (Gaussian, σ = 0.3 semitone) and log-compressed, log(1 + 100·E/E_max)                | `analysis/chroma.ts`       |
| `keyProfile: "temperley" \| "kostkaPayne"`                   | Corpus-based key profiles (Temperley, _Music and Probability_, 2007, Table 6.1) instead of Krumhansl–Kessler                               | `analysis/keyDetection.ts` |
| `spectrumToChroma(…, { binning, compression, tuningCents })` | The building blocks of the above, usable alone (`GAUSSIAN_LOG_CHROMA` preset)                                                              | `analysis/chroma.ts`       |
| `detectKey(chroma, { profile })`                             | Profile choice on the bare function (the number argument still means the temperature)                                                      | `analysis/keyDetection.ts` |

The lab shows them on the Chords & keys page ("Listening method": steady average, follow the
changes, follow the changes with sharper notes; "What a key sounds like, after": the three
profiles), with a How? sheet ("the experimental methods"). The listening method also applies to
the games.

### The HMM in short

- States: one per chord pitch set of the enabled qualities, plus "no chord".
- Emissions: the per-frame softmax (τ = 0.1) of the template similarities, raised to κ = 0.6
  (neighbouring frames overlap by ~70 %, so they are not independent evidence). κ acts as a
  softmax temperature of τ/κ.
- "No chord": scores level with the best chord when the chroma's cosine with a flat chroma
  reaches 0.95, above it when flatter; a zero chroma is always "no chord". Music sits around
  0.55–0.9 (higher with the log chroma), white noise around 0.98.
- Transitions: stay with p = 1 − 1/(D·fps), D = 1 s mean chord length (p = 0.9 at 10 fps);
  any other state with (1 − p)/(S − 1). With uniform jumps a step costs O(S).
- Decoding: fixed-lag forward–backward, default lag 0 (causal filtering): a 0.3 s lag cost
  100–200 ms of reaction and lowered the accuracy at display time.
- `frame.chords` keeps its shape (one entry per pitch set, sorted); the probabilities sum to
  1 − `noChordProbability`.
- D = 1 s and κ = 0.6 come from a sweep on GuitarSet players 00–02 (D 0.5–3 s, κ 0.25–1, both
  chroma front-ends); the top of the sweep is a plateau (every setting within 0.3 points of
  64 %), and these values sit inside it. Before that the defaults were D = 2 s, κ = 0.4, from
  the literature.

## How it was measured

| Command                                                    | Data                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run measure:guitarset -- --guitarset <dir> [--sweep]` | GuitarSet, 180 accompaniment excerpts (91 min), time-aligned chords and key; `<dir>` = AILab `datasets/public/guitarset` |
| `npm run measure:progressions`                             | Synthetic guitar progressions with known change times, the two real loops of `tests/Sample`, and the JS cost             |
| `npm run measure:keys -- --dataset <dir>`                  | The AILab `backing-tracks` dataset (243 clips of 6 minor backing tracks, labels from titles)                             |

Every chord method goes through the live path (AnalyserNode emulation at 10 fps,
`TonalityEngine.processDbSpectrum`), and is scored on what the player would see at each frame:
the latency counts against it. "Delay" is the time from a chord change to the first frame from
which the new chord holds two frames, counted only on the changes that were caught: read it with
"missed". "Wrong switches" are answer changes to a chord that is not sounding.

GuitarSet (Xi, Bittner, Pauwels, Ye, Bello, ISMIR 2018) is CC BY 4.0, checked on its Zenodo
record (3371780, version 1.1.0). Six guitarists play the same 30 lead sheets in five styles. The
references are the lead sheet (first chord annotation) and the chords performed (second one,
transcribed from the notes), in the MIREX majmin vocabulary (G7 → G; Bm7b5 left out). Players
00–02 tune, players 03–05 test; since all play the same sheets, the test split holds out the
playing and the recording, not the music, and every interval is a bootstrap over the 30 lead
sheets, paired between methods. Four 12 s excerpts are committed in
`packages/core/tests/Sample/GuitarSet/` with their attribution.

## Results

### Chords, real guitar (GuitarSet test split, 90 excerpts, 46 min)

| Method                                     | Accuracy % [95 % CI] | vs default, points [95 % CI] | vs performed chords % | Delay median / p90 (ms) | Missed % | Wrong switches / min |
| ------------------------------------------ | -------------------- | ---------------------------- | --------------------- | ----------------------- | -------- | -------------------- |
| window 1 s (default)                       | 48.6 [39.5–56.5]     | –                            | 51.8                  | 670 / 1207              | 25.6     | 51.6                 |
| window 0.5 s                               | 49.6 [40.5–57.5]     | +1.0 [−0.2, 2.2]             | 53.2                  | 472 / 1164              | 20.5     | 82.9                 |
| window 0.5 s + hold 2 frames               | 48.2 [39.5–55.9]     | −0.4 [−1.4, 0.5]             | 51.6                  | 572 / 1211              | 20.8     | 54.1                 |
| gaussian-log chroma                        | 49.0 [39.4–57.2]     | +0.4 [−1.2, 2.3]             | 52.6                  | 621 / 1071              | 25.8     | 46.0                 |
| hmm                                        | 51.0 [41.5–59.4]     | +2.4 [1.1, 3.7]              | 54.6                  | 472 / 1213              | 27.5     | 52.2                 |
| **hmm + gaussian-log**                     | **51.8** [41.4–60.7] | **+3.2 [1.1, 5.1]**          | **55.9**              | **410** / 1118          | 29.6     | **40.4**             |
| all qualities → majmin, window 1 s         | 39.7 [32.9–45.8]     | −8.9 [−12.8, −5.1]           | 44.5                  | 821 / 1417              | 27.2     | 31.0                 |
| all qualities → majmin, hmm + gaussian-log | 49.4 [42.6–55.8]     | +0.8 [−3.8, 5.7]             | 55.2                  | 527 / 1305              | 23.9     | 31.4                 |
| all qualities, exact, window 1 s           | 26.0 [18.2–33.3]     | (exact vocabulary)           | 33.0                  | 923 / 1589              | 52.5     | 86.3                 |
| all qualities, exact, hmm + gaussian-log   | 22.5 [14.8–30.1]     | (exact vocabulary)           | 42.1                  | 683 / 1486              | 65.8     | 58.4                 |

The gain of hmm + gaussian-log holds for each test player (+4.0, +2.4, +3.2 points) and each
style (all players: bossa nova +3.7, funk +1.5, jazz +2.0, rock +7.0, singer-songwriter +5.9).
The levels differ far more by style than by method: rock and singer-songwriter 66–78 %, bossa
nova, jazz and funk 35–51 % (extended voicings, rootless shapes, muted strums).

What the wrong frames are (all players, lead sheet, majmin, share of frames):

| Method               | Right | Right root, wrong quality | Relative (C ↔ Am) | Third-related (C ↔ Em) | A fifth away (C ↔ G, F) | Other | Nothing shown |
| -------------------- | ----- | ------------------------- | ----------------- | ---------------------- | ----------------------- | ----- | ------------- |
| window 1 s (default) | 53.4  | 7.3                       | 6.9               | 4.5                    | 16.0                    | 11.9  | 0.0           |
| hmm + gaussian-log   | 57.6  | 6.6                       | 6.5               | 5.6                    | 13.1                    | 10.3  | 0.4           |

The largest error is a chord a fifth away: the 3rd harmonic of every note is its fifth, and a
bass note under the chord pulls the same way. That is what a bass chroma or NNLS chroma would
address.

Two ideas measured and rejected here: detecting the full vocabulary and showing its triad
(suggested by the review; −8.9 points with the window, neutral with the HMM), and the full
vocabulary itself on real guitar (22–26 % exact: sevenths and m7b5 are not readable this way).

### Chords, synthetic guitar

20 progressions (10 seeds × SNR 30/20 dB) per scenario. Steady: 100 BPM, 2–4 beats per chord
(1.2–2.4 s), 7 min. Fast: 140 BPM, 1–2 beats (0.43–0.86 s), 2.5 min. Interval: bootstrap over
progressions.

| Method                       | Steady: accuracy % [CI] | Delay median | Wrong / min | Fast: accuracy % [CI] | Delay median | Missed % |
| ---------------------------- | ----------------------- | ------------ | ----------- | --------------------- | ------------ | -------- |
| window 1 s (default)         | 63.3 [62.4–64.3]        | 741 ms       | 9.4         | 26.5 [23.0–30.1]      | 670 ms       | 58.6     |
| window 0.5 s                 | 77.8 [77.3–78.3]        | 441 ms       | 6.6         | 39.5 [37.9–41.2]      | 456 ms       | 52.3     |
| window 0.5 s + hold 2 frames | 72.0 [71.4–72.6]        | 541 ms       | 2.9         | 29.5 [27.7–31.4]      | 556 ms       | 51.8     |
| gaussian-log chroma          | 64.6 [63.7–65.6]        | 741 ms       | 9.9         | 27.9 [25.3–30.7]      | 570 ms       | 58.6     |
| hmm                          | **81.1** [80.3–82.0]    | **341 ms**   | **0.0**     | **51.7** [49.6–54.2]  | 327 ms       | 33.6     |
| hmm, lag 0.3 s               | 72.6 [71.8–73.3]        | 541 ms       | 0.0         | 32.6 [30.3–35.4]      | 527 ms       | 52.7     |
| hmm + gaussian-log           | 81.1 [80.3–81.9]        | 341 ms       | 0.0         | 49.3 [46.8–52.1]      | 356 ms       | 43.2     |

The synthetic progressions draw their chords at random and last about as long as the HMM
expects: they flatter it. GuitarSet is the number to trust.

### Chords, the two real loops of `tests/Sample` (no timings)

Share of frames answering a chord of the grid, answer changes per minute. Both reward inertia:
a sanity check, not a ranking.

| Method               | AmDmEAm    | AmGFE       |
| -------------------- | ---------- | ----------- |
| window 1 s (default) | 89.5 %, 67 | 84.1 %, 112 |
| gaussian-log chroma  | 92.9 %, 51 | 88.9 %, 90  |
| hmm                  | 85.2 %, 65 | 92.2 %, 92  |
| hmm + gaussian-log   | 90.0 %, 42 | 92.6 %, 70  |

A first version of this table, which ignored the "no chord" state, showed the HMM at 93–95 %;
once "no chord" was counted, the first calibration (flat cosine − 0.1) fell to 80 %, and to
5–21 % with the log chroma, which flattens the chroma. The flatness threshold fixed it.

### Keys

GuitarSet, 180 comp excerpts (120 major, 60 minor), energy path over the whole excerpt; the
interval is a bootstrap over the 30 lead sheets (one key per sheet, so about 30 independent
answers). The profiles were compared on all 180 excerpts, without a split.

| Front-end + profile           | Exact % [95 % CI] | Exact % on minor keys | MIREX % |
| ----------------------------- | ----------------- | --------------------- | ------- |
| nearest + krumhansl (default) | 44.4 [32.2–57.2]  | 38.3                  | 58.0    |
| nearest + temperley           | 56.7 [44.4–68.3]  | 35.0                  | 65.1    |
| nearest + kostkaPayne         | 51.7 [41.1–62.2]  | 46.7                  | 61.2    |
| gaussian-log + krumhansl      | 60.6 [50.0–71.1]  | 68.3                  | 71.6    |
| gaussian-log + temperley      | 63.3 [49.4–75.6]  | 45.0                  | 73.5    |
| gaussian-log + kostkaPayne    | 65.0 [55.0–74.4]  | 66.7                  | 74.6    |

Backing tracks (AILab `backing-tracks`, 243 clips of 10 s from 5 trusted minor tracks; accepted
= tonic key, relative major or parent major of a mode; MIREX against the title key):

| Front-end + profile           | dm-rock  | bm-dorian-funk | em-fusion | bm-ballad | am-blues      | Total accepted / MIREX % |
| ----------------------------- | -------- | -------------- | --------- | --------- | ------------- | ------------------------ |
| nearest + krumhansl (default) | 89 / 62  | **66 / 67**    | 15 / 33   | 65 / 40   | 74 / 79       | 56 / 50                  |
| nearest + temperley           | 89 / 34  | 59 / 56        | 6 / 4     | 76 / 40   | 83 / 83       | 56 / 38                  |
| nearest + kostkaPayne         | 100 / 52 | 56 / 60        | 6 / 13    | 76 / 44   | 78 / 85       | 56 / 45                  |
| gaussian-log + krumhansl      | 84 / 62  | 27 / 34        | 52 / 52   | 90 / 63   | **100 / 100** | **68 / 58**              |
| gaussian-log + temperley      | 95 / 51  | 49 / 49        | 63 / 30   | 95 / 42   | 78 / 69       | 75 / 44                  |
| gaussian-log + kostkaPayne    | 89 / 64  | 41 / 46        | 63 / 55   | 87 / 46   | 91 / 91       | 72 / 56                  |

The gaussian-log front-end wins on both sets, by about 15 points on GuitarSet and 12 on the
backing tracks. It breaks the B dorian funk track (66 → 27 %): B dorian has the notes of A major
and F# minor, and squashing the loud bass and tonic lets the G# and the scale membership decide.
The profiles do not separate consistently: Kostka–Payne leads on GuitarSet, Krumhansl on the
backing tracks' MIREX score.

### Cost

JS time per frame at the live size (48 kHz, 16384-point spectra, 8192 dB bins), Node 24 on the
development laptop. The FFT runs natively in the AnalyserNode and is the same for all.

| Method                       | µs / frame | Share of the 100 ms frame budget |
| ---------------------------- | ---------- | -------------------------------- |
| window 1 s (default)         | 145        | 0.15 %                           |
| gaussian-log chroma          | 177        | 0.18 %                           |
| hmm                          | 148        | 0.15 %                           |
| hmm + gaussian-log           | 179        | 0.18 %                           |
| window 1 s, all 11 qualities | 148        | 0.15 %                           |
| hmm, all 11 qualities        | 209        | 0.21 %                           |

At most +25 %, far below 1 % of the budget; memory is a few arrays of S + 1 numbers. Not
measured on a low-end phone.

## Verdict

The benchmark ([BENCHMARKS.md](BENCHMARKS.md)) adds noise to the same material: hmm + gaussian-log keeps its
lead down to 20 dB of room noise but falls behind the default in a loud bar (−5.9 points) and through a bad
microphone (−2.5), and shows no chord on 12 % of the frames in a busy bar. Its "no chord" state and log
compression need work before it can become a default.

| Method                           | Keep?                                          | Why                                                                                                                                                                                                                       |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HMM + gaussian-log (lag 0)       | Opt-in, candidate default for quiet rooms only | The only method ahead of the default on real guitar with a paired interval clear of zero (+3.2 points), in every style and for every test player; 260 ms faster; fewer wrong switches. Costs +0.03 % of the frame budget. |
| HMM alone                        | Opt-in                                         | +2.4 points, 200 ms faster on real guitar; best on synthetic fast changes.                                                                                                                                                |
| Gaussian-log chroma for keys     | Opt-in, candidate default for keys             | +16 points on GuitarSet, +12 on the backing tracks; breaks one modal track.                                                                                                                                               |
| Shorter window (0.5 s)           | No                                             | +1.0 point, not significant, and 60 % more wrong switches on real guitar.                                                                                                                                                 |
| HMM lag                          | No (option kept)                               | Costs reaction and accuracy at display time.                                                                                                                                                                              |
| Temperley, Kostka–Payne profiles | Opt-in                                         | Better than Krumhansl on GuitarSet, not on the backing tracks; chosen without a split.                                                                                                                                    |
| Full vocabulary → triad shown    | No                                             | −8.9 points with the window, neutral with the HMM.                                                                                                                                                                        |
| Log compression per note         | No                                             | Measured slightly worse on keys (63 vs 68 % accepted), equal on chords.                                                                                                                                                   |
| CQT / VQT                        | Not done                                       | A 36-bin/octave CQT has a 620 ms kernel at 82 Hz, worse for latency; only fast changes would gain. Offline ceiling at most.                                                                                               |
| NNLS chroma                      | Not done                                       | Next, after a bass chroma: the fifth-away errors are its target.                                                                                                                                                          |
| Synchrosqueezing, scattering     | Dropped                                        | MPM already gives a continuous pitch; no model and no data for scattering.                                                                                                                                                |

## What the reviews changed

- **DSP / MIR, first pass** (plan): fix the chroma before adding methods, CQT last as an
  offline ceiling, a "no chord" state and an emission exponent for the HMM.
- **DSP / MIR, second pass** (code): the "no chord" state was invisible to the metric and
  miscalibrated with the log chroma (fixed); the log gain comment said −40 dB for −20 dB
  (fixed); the wrong-switch metric favoured the HMM (split into transition and steady, a "window
  0.5 s + hold" baseline added); a fast scenario and bootstrap intervals added.
- **DSP / MIR, third pass** (GuitarSet): the player split does not hold out the music (intervals
  now bootstrap the 30 lead sheets, method gaps are paired); score against the performed chords
  too (added); the first sweep winner sat on the grid's edge (grid widened: a plateau); delay
  must be read with missed changes (said above); the error breakdown and the "full vocabulary
  then triad" idea (both measured).
- **Audio-ML** (dataset): evaluation only, leave-one-track-out; integer key fields, label status,
  decoded-PCM hash, levels and clipping, file hashes (all applied).

## Methods of the onset labels

The play-along labels (`noteAfterOnset` / `chordAfterOnset`, and the `noteLabeler` /
`chordLabeler` of `@audiolab/core/rhythm` built on them) take the methods that won on
continuous listening, opt-in, the originals staying the defaults:

| Option                           | What it does                                                                                    | Answer after the onset (48 kHz) |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| notes, default (`method: "mpm"`) | `detectPitch` on 2048 samples, 30 ms after the attack                                           | 30 ms + 43 ms                   |
| `method: "pyin"`                 | `PyinTracker` (10 ms hops) over the same window, plus one hop before it and 50 ms of look-ahead | 50 ms later than "mpm"          |
| `method: "crepe"`, `crepeModel`  | `CrepePitch` on the ≈ 66 ms after the 30 ms, confidence ≥ 0.6; throws without a model           | 30 ms + ≈ 66 ms                 |
| chords, default (`"nearest"`)    | One FFT of 170 ms, 30 ms after the attack, bins to the nearest semitone (70 Hz–2 kHz)           | 200 ms                          |
| `chromaMethod: "gaussian-log"`   | The same FFT with `GAUSSIAN_LOG_CHROMA`                                                         | 200 ms                          |
| `chromaMethod: "cqt"`            | `CqtChroma` of the same 170 ms (E2–D7); the low notes' windows are cut to the segment           | 200 ms                          |

There is no `chordSmoothing` for the labels: each label is a one-shot verdict on the segment
after its onset, so there is no frame sequence for the HMM to smooth, and smoothing across
onsets would pull a chord change towards the previous chord. These methods are not yet
benchmarked on onset labels (the figures above are for the live readouts); the CQT in
particular loses its low-note resolution on 170 ms. The lab's Rhythm page lets you pick them on
the scrolling notes and chords.

## Limits

- GuitarSet is one acoustic guitar setup, solo, close-miked: no phone microphone, no room, no
  backing track. Accuracy is at display time, latency included: not comparable with published
  MIREX WCSR figures.
- The key results rest on about 30 lead sheets and 5 backing tracks.
- The "no chord" threshold (0.95) comes from two loops and white noise.

## Next steps, in order

1. Record a few minutes of guitar on a phone, with chord times, to confirm the HMM + gaussian-log
   gain where the games run; then decide on the default.
2. A bass chroma (55–250 Hz) as a second HMM emission and for the key tonic: the fifth-away
   errors and the dorian case.
3. NNLS chroma, with a slow global tuning estimate.
4. Beat-synchronous frames in the games (the metronome is known): measure the ceiling with
   GuitarSet's beat annotations first.
5. Key-aware chord transitions (a diatonic prior) once the key is stable.
