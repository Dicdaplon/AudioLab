# Alternative methods: proofs of concept

Twenty alternative methods tried against the SDK's onset, tempo, pitch, chord and key detectors,
on a small but varied set, the promising ones pushed further, then checked on material none of
them was tuned on. Done 2026-10-26/27. Proofs of concept: the code lives in
`packages/core/poc/`, outside the SDK; nothing here changes the published packages.

## The protocol

**Data.** GuitarSet (Xi et al., ISMIR 2018, CC BY 4.0: acoustic guitar, six players, the same 30
lead sheets in five styles, with time-aligned notes, chords, beats, tempo and key), plus the AILab
backing tracks for keys and tempo. Three sets, never mixed:

| Set        | What                                                                                                             | Used for                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **POC**    | players 00–02, 2 lead sheets per style: 10 strummed + 10 single-note excerpts of 20 s; 2 clips per backing track | first look at every idea |
| **tune30** | players 00–02, all 30 lead sheets                                                                                | choosing settings        |
| **test**   | players 03–05, all 30 lead sheets (the benchmark's players), other backing clips                                 | the numbers to believe   |

**Conditions.** Clean, pink noise at 20 dB (noisy room), a real bar ambience at 10 dB (busy bar),
and a phone-grade microphone chain (band 300 Hz–3.4 kHz, clipping, hiss), from `bench/augment.ts`.

**Scores.** As the benchmark: onsets F-measure at ±50 ms; tempo Acc1 (share of the live readings
within 4 %); pitch RPA50 (share of voiced frames within 50 cents), RPA10, octave errors, false
voicing; chords majmin accuracy at display time; key strict (C ≠ Am) and merged (C = Am). Each
style weighs the same.

**What went wrong first, and why the protocol has three sets.** The POC set (2 sheets per style)
was too small to rank methods: NNLS chroma, first on it (79.6 % against 68.7 %), came back below
the SDK on the test players (47.8 % against 48.9 %); HPSS kept half a point of its 3. Everything
below is judged on the test set.

Run: `cd packages/core && [POC_SPLIT=tune30|test] npx tsx poc/run.ts --task onsets|tempo|pitch|chords|keys [--only names]`.
Per-task notes with every variant: `packages/core/poc/notes/*.md`.

## Summary

Gains are on the **test** players, clean / busy bar, in points over the SDK.

| #   | Task   | Method                                   | Source                                 | Test result (clean / bar)                          | Verdict                             |
| --- | ------ | ---------------------------------------- | -------------------------------------- | -------------------------------------------------- | ----------------------------------- |
| 1   | Onsets | Gate strictness (gentle / strict)        | AudioLab's own gate                    | ±0.3 on the POC set                                | Not the cause                       |
| –   | Onsets | **Peak-picking threshold 0.03 → 0.01**   | (finding of #1)                        | **+8.6 / +8.5**                                    | **Adopt first: one parameter**      |
| 2   | Onsets | Adaptive whitening                       | Stowell & Plumbley, ICMC 2007          | below plain log flux                               | Drop                                |
| 3   | Onsets | Complex domain (+ SuperFlux)             | Duxbury et al. 2003; Bello et al. 2004 | **+14.5 / +20.7** (combined)                       | Promising                           |
| 4   | Onsets | High-frequency content                   | Masri 1996                             | 28 % F (POC)                                       | Drop                                |
| 5   | Tempo  | **Spectral-flux novelty + ACF + prior**  | Ellis 2007                             | **+38.5 / +33.9** untuned; **+55.5 / +53.3** tuned | **Adopt**                           |
| 6   | Tempo  | Generalised ACF + pulse trains           | Percival & Tzanetakis 2014             | +50.6 / +51.1 (with an accumulator)                | Promising, second                   |
| 7   | Tempo  | Fourier tempogram + continuity           | Grosche & Müller 2011                  | +2.7 / +1.4; +36 with sub-harmonics                | Below #5                            |
| 8   | Pitch  | YIN (+ MPM refinement)                   | de Cheveigné & Kawahara 2002           | +2.0 / +12.4, more false voicing                   | Neutral                             |
| 9   | Pitch  | pYIN (50 ms look-ahead)                  | Mauch & Dixon 2014                     | +4.8 / +13.9, false voicing 34 vs 19 %             | Promising, cheap                    |
| 10  | Pitch  | **CREPE tiny (+ MPM cents)**             | Kim et al. 2018                        | **+7.1 / +20.4** at 10 Hz, octave errors ÷8        | **Promising, needs a fast runtime** |
| 11  | Chords | Harmonic/percussive separation (HPSS)    | FitzGerald 2010                        | +3.1 / +3.7                                        | Small                               |
| 12  | Chords | Spectral subtraction                     | Boll 1979; Martin 2001                 | +1.9 / +0.7                                        | Drop                                |
| 13  | Chords | Bass chroma                              | Mauch & Dixon 2010 (TASLP)             | +7.1 / +0.4; sign flips across players             | Unstable                            |
| 14  | Chords | NNLS chroma                              | Mauch & Dixon, ISMIR 2010              | −1.1 / −1.6 (+ bass)                               | Drop (POC false positive)           |
| 15  | Chords | **Constant-Q transform (CQT)**           | Brown 1991; Schörkhuber & Klapuri 2010 | **+6.2 / +3.4**; +12.4 / +7.5 with bass            | **Promising**                       |
| 16  | Chords | Beat-synchronous chroma                  | Bello & Pickens 2005                   | −0.7 / −3.0 on the POC set, 2× flicker             | Drop                                |
| 17  | Chords | "No chord" from the level                | (fix of the HMM's weak point)          | worse everywhere                                   | Drop                                |
| 18  | Chords | **Basic Pitch notes → chroma**           | Bittner et al., ICASSP 2022            | **+11.5 / +3.7**, weak through the bad mic         | Promising for clean rooms           |
| 19  | Key    | HPCP (harmonic pitch-class profile)      | Gómez 2006                             | −10 strict (POC)                                   | Drop                                |
| 20  | Key    | **Key from the chords found (+ chroma)** | Noland & Sandler 2006 (spirit)         | **+13.9 / +16.6** strict                           | **Adopt**                           |

## Onsets

SDK today: `OnsetPipeline`, SuperFlux novelty, online peak picking (threshold `delta` 0.03 on a
band-averaged curve), attack localisation, adaptive noise gate. Test players: F 70.8 clean, 66.1
noisy room, 59.3 bar, 59.7 bad mic; it misses notes (recall 64 %), it rarely invents them
(precision 91 %). Details: `poc/notes/onsets.md`.

### 1. Gate strictness (and the finding it led to)

- **Idea.** If the gate is too strict, quiet notes are dropped: test its three levels.
- **Result.** Gentle, normal, strict and no gate at all are within 0.3 points. The notes are lost
  before the gate, in the peak picker: its threshold `delta = 0.03` is too high for strums and soft
  notes. **With `delta = 0.01` the unchanged pipeline goes to 79.4 / 79.6 / 67.8 / 80.7 on the test
  players** (+8.6 clean, +21 through the bad microphone), precision 77 %. The value was chosen on
  the POC set.
- **Verdict.** The cheapest win of the study: one constant.

### 2. Adaptive whitening — Stowell & Plumbley, "Adaptive whitening for improved real-time audio onset detection", ICMC 2007

- **Idea.** Loud low notes hide quiet high attacks. Divide each frequency bin by a slowly decaying
  memory of its own peak, so every band counts by its own changes, not its absolute level.
- **Done.** Peak memory with decay 0.997 per 10 ms frame and a floor, before (log) spectral flux.
- **Result.** Test 79.9 / 75.1 / 71.2 / 81.1, below the plain log flux (80.9 / 77.4 / 72.5 / 81.8):
  it lifts the noise bins along with the guitar.
- **Verdict.** Drop.

### 3. Complex domain — Duxbury, Bello, Davies & Sandler, DAFx 2003; Bello et al., IEEE Signal Processing Letters 11(6), 2004 (tutorial: Bello et al., IEEE TSAP 13(5), 2005)

- **Idea.** A steady note is predictable: each bin keeps its magnitude and turns its phase at a
  steady rate. Predict the next frame from the last two; the distance between prediction and
  observation (in the complex plane) jumps at a new note, even a soft one with no burst of energy.
- **Done.** Prediction |X[n−1]|·e^{j(2φ[n−1]−φ[n−2])}; rectified variant (only energy rises).
- **Result.** Alone: 80.6 / 78.6 / 75.4 / 78.7. Summed with a SuperFlux-like curve (SuperFlux:
  Böck & Widmer, DAFx 2013: spectral flux after a maximum filter across frequency, so vibrato does
  not fire): **85.3 / 86.2 / 80.0 / 85.5**, the best of all (+14.5 / +20.7 over the SDK). The
  SuperFlux-like curve alone gives 83.5 / 83.9 / 77.7 / 83.5.
- **Caveat.** These POC curves are normalised by the whole file's maximum; a causal running
  maximum costs about 2 points (81.8 / 82.0 / 73.0 / 81.5). Cost 13.5 ms per second of audio.
- **Verdict.** Promising, after the threshold fix.

### 4. High-frequency content — Masri, PhD thesis, University of Bristol, 1996

- **Idea.** Attacks are broadband: weight each bin's energy by its frequency, and a pick hit jumps.
- **Result.** 28 % F on the POC set (recall 18 %): an acoustic guitar's attacks are not bright
  enough. A log-difference variant is neutral with the lowest precision.
- **Verdict.** Drop.

## Tempo

SDK today: `TempoAnalyzer`, the spectrum of a low-passed RMS envelope over 8 s with a tempo prior.
Right on click tracks, lost on strummed guitar: Acc1 14.0 % on the test players. Details:
`poc/notes/tempo.md`. Every method uses the same new input, the change in the spectrum from one
10 ms frame to the next (log spectral flux, 30 Hz–8 kHz): a strum barely moves the overall
energy, but each string adds energy in its own frequency bins.

### 5. Autocorrelation and a tempo prior — Ellis, "Beat Tracking by Dynamic Programming", J. New Music Research 36(1):51–60, 2007

- **Idea.** If notes come back every beat, the curve resembles itself shifted by one beat: its
  autocorrelation peaks at the beat period (and at half and double). A bell curve over tempo
  (centred at 120 BPM) picks the likely one.
- **Done.** Autocorrelation of the last 8 s, prior σ = 1.4 octaves (published) or 0.7 (tuned),
  harmonic enhancement r(τ) + r(2τ) + ½·r(4τ), readings smoothed across seconds.
- **Result (test).** Published settings: **52.5 / 49.9 / 47.4 / 50.1** (SDK 14.0 / 13.8 / 13.5 /
  9.9). Tuned on the POC set: **69.5 / 67.0 / 66.8 / 65.9**, Acc2 75 %. Noise barely matters.
  Remaining errors: 3:2 and 4:3 on swing and shuffle, half tempo on fast jazz.
- **Cost.** More than 100× real time.
- **Verdict.** Adopt: the largest gain of the study.

### 6. Generalised autocorrelation and pulse trains — Percival & Tzanetakis, "Streamlined Tempo Estimation Based on Autocorrelation and Cross-correlation With Pulses", IEEE/ACM TASLP 22(12):1765–1776, 2014

- **Idea.** A sharper autocorrelation (the inverse FFT of |FFT|^0.5), then each candidate tempo is
  checked against the signal with ideal pulse trains at every phase.
- **Result (test).** 36.7 % as published; 64.6 / 61.5 / 64.6 / 65.6 with a decaying vote across
  readings (a causal stand-in for the paper's accumulator). Best Acc2.
- **Verdict.** Promising, second to #5.

### 7. Fourier tempogram — Grosche & Müller, "Extracting Predominant Local Pulse Information From Music Recordings", IEEE TASLP 19(6):1688–1701, 2011

- **Idea.** A Fourier transform of the novelty curve over a few seconds gives, at each moment, how
  strongly each tempo pulses (the tempogram); keep the strongest, with continuity in time.
- **Result (test).** 16.7 %: on strummed guitar the strongest pulse is the eighth note. With a
  sub-harmonic sum 50.0 %; the causal HMM continuity did not help.
- **Verdict.** Below #5.

## Pitch (the tuner)

SDK today: MPM (McLeod & Wyvill, "A Smarter Way to Find Pitch", ICMC 2005) on 2048-sample windows.
Reference: GuitarSet's per-string pitch contours (frames with one string sounding). Details:
`poc/notes/pitch.md`.

### 8. YIN — de Cheveigné & Kawahara, "YIN, a fundamental frequency estimator for speech and music", JASA 111(4):1917–1930, 2002

- **Idea.** Compare the signal with itself shifted by every candidate period; normalise the
  difference by its running mean; take the first dip under a threshold.
- **Result (test).** With MPM measuring the cents: 85.8 / 80.7 / 62.3 / 90.2 (MPM 83.8 / 76.2 /
  49.9 / 89.7), but false voicing 26 % against 19 %: it mostly answers more often.
- **Verdict.** Neutral.

### 9. pYIN — Mauch & Dixon, "pYIN: A Fundamental Frequency Estimator Using Probabilistic Threshold Distributions", ICASSP 2014

- **Idea.** Instead of one YIN threshold, a spread of thresholds gives several candidates with
  probabilities; a hidden Markov model then follows the most plausible pitch line, voiced or not.
- **Result (test, 50 ms look-ahead).** 88.6 / 84.8 / 63.8 / 93.7, octave errors 2.5 % vs 3.5 %, but
  false voicing 34 % vs 19 %. Without look-ahead it loses about 5 points. Note: GuitarSet's own
  reference contours were made with pYIN, which flatters it slightly.
- **Verdict.** Promising and cheap (0.25 ms per frame), if its voicing is made stricter.

### 10. CREPE — Kim, Salamon, Li & Bello, "CREPE: A Convolutional Representation for Pitch Estimation", ICASSP 2018 (code and weights MIT)

- **Idea.** A small neural network trained to read pitch straight from 64 ms of waveform; it
  outputs a probability over 360 pitch bins, so it also says how sure it is.
- **Done.** The "tiny" model (MIT weights from the official TF.js export, 1.9 MB), run in plain
  TypeScript with no new dependency; it decides whether a note sounds and which, MPM measures the
  cents.
- **Result (test, every method answering 10 times a second for a fair comparison).** **75.9 / 74.6
  / 61.2 / 77.6** against MPM 68.8 / 62.6 / 40.8 / 77.2: +20 points in the bar, octave errors 0.4 %
  against 3.3 %, same false voicing.
- **Cost.** 28 ms per frame in plain TypeScript: too slow for 100 Hz, borderline for a 10–20 Hz
  tuner display. A WASM-SIMD or WebGPU runtime should bring it to a few ms (not measured).
- **Verdict.** The most robust tuner in noise; worth a fast runtime.

## Chords

SDK today: nearest-semitone chroma over a 1 s window (default) or the opt-in HMM with the
Gaussian/log chroma. All variants below go through one decoder (24 triad templates, cosine, then
the window or the chord HMM), so only the front-end changes; a control reproduces the SDK within a
point. Test players, SDK default: **48.9 / 48.6 / 46.6 / 43.0**; SDK opt-in 51.3 / 51.2 / 47.3 /
40.8.

### 11. Harmonic/percussive separation — FitzGerald, "Harmonic/Percussive Separation Using Median Filtering", DAFx 2010

- **Idea.** In a spectrogram, sustained notes are horizontal lines, strikes and scratches are
  vertical lines. A median along time keeps the first, a median along frequency the second; keep
  only the harmonic part before the chroma.
- **Done.** Causal medians (last 9 frames at 20 fps; 17 bins), soft mask, then the Gaussian/log
  chroma and the HMM.
- **Result.** POC +3.4; test **52.0 / 52.6 / 50.3 / 42.7** (+3.1 / +4.0 / +3.7 / −0.3).
- **Verdict.** Small and costly (median filters); not a priority.

### 12. Spectral subtraction — Boll, "Suppression of acoustic noise in speech using spectral subtraction", IEEE TASSP 27(2), 1979; noise by minimum statistics (Martin, IEEE TSAP 2001)

- **Idea.** Estimate the noise spectrum as the quietest level each bin reaches over a few seconds,
  and subtract it.
- **Result.** Test 50.8 / 50.3 / 47.3 / 41.5: a held chord is itself the "quietest level" of its
  bins, and gets subtracted.
- **Verdict.** Drop.

### 13. Bass chroma — Mauch & Dixon, "Simultaneous Estimation of Chords and Musical Context From Audio", IEEE TASLP 18(6):1280–1289, 2010

- **Idea.** The lowest note usually is the root: a separate chroma of the bass range (55–200 Hz)
  pulls the chords whose root it holds (score + λ·bass[root]).
- **Result.** With the Gaussian/log chroma, λ = 0.3: test 56.0 / 55.6 / 47.0 / 43.0 (+7 clean), but
  on the tune30 players it **loses** 5 points clean and 11 in the bar. With the CQT, same story
  (+6 on the test players, −5 on the tune30 players).
- **Verdict.** Its effect depends on how each player voices chords: unstable, not to adopt as is.

### 14. NNLS chroma — Mauch & Dixon, "Approximate Note Transcription for the Improved Identification of Difficult Chords", ISMIR 2010

- **Idea.** Explain each spectrum as a sum of notes, each note with its harmonics (amplitude
  0.7^(h−1)), by non-negative least squares; fold the note activations, not the raw bins, into
  chroma. Harmonics stop masquerading as chord tones.
- **Done.** Log-frequency spectrum at 3 bins per semitone (interpolated from the 16384-point FFT),
  whitened over an octave, 49 notes (E2–E6), 10 partials, multiplicative updates.
- **Result.** POC 79.6 (with bass): the best; tune30 60.3; test **47.8 / 47.7 / 45.0 / 49.0**, below
  the SDK. At 2.7 Hz per FFT bin the low register is interpolation, not resolution.
- **Verdict.** Drop in this form (the POC false positive).

### 15. Constant-Q transform — Brown, "Calculation of a constant Q spectral transform", JASA 89(1):425–434, 1991; Schörkhuber & Klapuri, "Constant-Q transform toolbox for music processing", SMC 2010; variable-Q: Schörkhuber, Klapuri, Holighaus & Dörfler, AES 53rd Conference, 2014

- **Idea.** Analyse each note with a window matched to its pitch: long for low notes (to tell E2
  from F2), short for high ones; quarter-tone bins. The FFT gives every frequency the same window.
  The variable-Q version widens low bins (γ) to shorten their windows.
- **Done.** Direct computation in time, 24 bins per octave, E2 to ~4 kHz, causal windows (up to
  0.9 s at E2), log compression.
- **Result.** CQT: test **55.1 / 53.9 / 50.0 / 45.2** (+6.2 / +5.3 / +3.4 / +2.2) and +6.1 / +5.5 /
  +4.9 / +7.5 on the tune30 players: the only front-end ahead on both player groups. With the bass
  (λ 0.2–0.3): test 60.7–61.4 / 60.3–60.8 / 55.3–58.4 / 49.7–50.6, but see #13. Variable-Q with
  γ = 20 Hz: much worse (39.7): the short bass windows lose the semitone.
- **Cost.** 34 ms per second of audio in naive JS; an FFT-based (Brown–Puckette) version would be
  cheaper.
- **Verdict.** Promising: the most consistent chord gain.

### 16. Beat-synchronous chroma — Bello & Pickens, "A Robust Mid-level Representation for Harmonic Content in Music Signals", ISMIR 2005

- **Idea.** Chords change on beats: average the chroma since the last beat instead of the last
  second (here the annotated beats stand in for the game's metronome).
- **Result.** POC 70.4 against 71.1 for the 1 s window, with twice the wrong switches at each
  beat.
- **Verdict.** Drop.

### 17. "No chord" decided by the level

- **Idea.** The opt-in HMM's weak point in noise (benchmark: "no chord" on 12 % of the frames in a
  busy bar). Decide "no chord" from the level against a running noise floor instead of the chroma's
  flatness.
- **Result.** Worse in every form tried (test 37.9 or 50.7 clean, 14.6 or 34.5 in the bar): a
  decaying strum looks like the floor.
- **Verdict.** Drop; the fix lies elsewhere (e.g. the gate's floor estimate).

### 18. Basic Pitch — Bittner, Bosch, Rubinstein, Meseguer-Brocal & Ewert, "A Lightweight Instrument-Agnostic Model for Polyphonic Note Transcription and Multipitch Estimation", ICASSP 2022 (code and weights Apache-2.0)

- **Idea.** A small neural network (Spotify) that writes down the notes being played, several at
  once, frame by frame. Fold the notes it hears into a chroma (treble) and a bass chroma.
- **Done.** The official ONNX model (230 KB) on onnxruntime-node; ~38 ms per second of audio;
  needs ~174 ms of look-ahead in streaming use. The HMM's "no chord" state had to be switched off
  (its notes are sparse and looked like "no chord").
- **Result (test, λ = 0.3).** **60.4 / 54.7 / 50.3 / 44.0** (+11.5 / +6.1 / +3.7 / +1.0); fastest
  reaction (420 ms). Its notes fade in noise.
- **Verdict.** Promising for quiet rooms; the strongest "recent" candidate for chords.

## Key

SDK today: Krumhansl–Schmuckler on the whole item's chroma (default), or the opt-in Gaussian/log
chroma. Test: strict **37.2 / 40.0 / 42.8 / 41.1**, merged 57.2; opt-in 48.3 / 51.1 / 54.4 / 45.6.
The test key set is 30 lead sheets and 10 backing clips: about 35 independent answers, so only
large gaps are readable.

### 19. HPCP — Gómez, "Tonal Description of Polyphonic Audio for Music Content Processing", INFORMS J. Computing 18(3), 2006 (PhD UPF 2006)

- **Idea.** Use the spectral peaks only, each credited with a cosine weight to its nearest pitch
  class, and also to the pitch classes it could be a harmonic of (f/2, f/3…, decaying weights).
- **Result.** POC strict 66.7, against 86.7 for the opt-in chroma.
- **Verdict.** Drop.

### 20. Key from the chords found — in the spirit of Noland & Sandler, "Key Estimation Using a Hidden Markov Model", ISMIR 2006

- **Idea.** A key is a family of chords: C major is made of C, F, G, Dm, Am, Em. Detect the chords
  first, then let each one vote for the keys it belongs to, weighted by its role (I and V weigh
  most); optionally add the chroma correlation.
- **Done.** Chords from the NNLS + bass front-end and the HMM (here NNLS works: a wrong chord still
  belongs to the right key), votes over the excerpt, + 0.5 × the Krumhansl correlation.
- **Result.** tune30 79.4 / 81.1 / 81.1 / 78.3 (SDK 51.7 / 51.7 / 48.9 / 45.0); test **51.1 / 59.4 /
  59.4 / 57.2** strict, 62.8 merged (+13.9 / +19.4 / +16.6 / +16.1 strict over the SDK default,
  +3–12 over the opt-in).
- **Verdict.** Adopt: it also tells relative keys apart better.

## Other recent work, not tested

From a literature check (references verified unless marked):

- **Beat This!** (Foscarin, Schlüter & Widmer, ISMIR 2024; MIT): state-of-the-art beats without
  post-processing, but offline (non-causal); a reference for recorded takes.
- **BeatNet** (Heydari, Cwitkowitz & Duan, ISMIR 2021; CC BY 4.0): online beats, depends on madmom.
- **PESTO** (Riou et al., ISMIR 2023; TISMIR 2025): tiny real-time pitch, but **LGPL-3.0**.
- **BTC** (Park et al., ISMIR 2019; MIT): transformer chords, needs look-ahead; pop-trained.
- **Murgul, Schimper & Heizmann**, ISMIR 2025: strum direction + chords on guitar recordings
  (licence unverified): the closest task to the SDK.
- Excluded for licences: madmom models (CC BY-NC-SA), Essentia (AGPL), the NNLS Vamp plugin (GPL).

## What to do next, in order

1. **Onsets: lower the peak-picking threshold** (0.03 → 0.01–0.015) and run the benchmark: one
   constant, +9 to +21 points.
2. **Tempo: replace the RMS envelope by the spectral-flux novelty with Ellis's autocorrelation**
   (published settings first: 14 → 52 %; tuned 69 %).
3. **Key: key from chords + chroma** as an opt-in key path.
4. **Chords: a real-time CQT front-end** (+6 on both player groups); revisit the bass chroma with a
   per-player check.
5. **Pitch: CREPE tiny behind a WASM/WebGPU runtime** for noisy rooms; pYIN with a stricter voicing
   as the cheap alternative.
6. **Basic Pitch** for chords in quiet rooms, once a runtime decision is made (shared with CREPE).

Each must go through `npm run bench` before it ships, with the benchmark version bumped if a
setting is chosen there.
