# Onsets POC

Code: `poc/methods/onsets.ts`. Data: POC set (GuitarSet players 00–02, 2 sheets per style,
comp + solo, 20 s), references = note onsets merged within 50 ms, F at ±50 ms.

**Setup shared by every non-SDK method.** Causal Hann STFT, 2048 points, hop 441 (100 fps) at
44.1 kHz; same peak picker (`pickPeaks`, poc/dsp.ts; defaults delta 0.1, pre 3, avg 10, wait 3 =
30 ms). Reported time = frame start + half a window (23 ms). Calibration on the clean items: median
error of every method is between −4 and −11 ms (the SDK itself −11 ms), well inside ±50 ms, so no
per-method offset was tuned. Caveat: `pickPeaks` normalises by the **whole-file maximum**, which a
live detector cannot know; the "causal norm" row replaces it with a running maximum (decay 0.999 per
frame, about 10 s) to measure what that costs.

**Tuning disclosure.** Rows marked "(tuned)" had delta / wait chosen on this same POC set, about
15 settings tried in all; they are not held out. Confirm on the benchmark (players 03–05) before
believing the exact numbers.

**Harness note.** On Windows `poc/run.ts` fails at `await import(file)` (absolute `C:\` path, not a
`file://` URL: `ERR_UNSUPPORTED_ESM_URL_SCHEME`). The numbers below come from an identical copy of
run.ts that imports with `pathToFileURL(file).href`. Fixing run.ts the same way is a one-line fix.

## Results

| Method                          | F clean | F pink-20 | F bar-10 | F bad-mic | P clean | R clean | F comp clean | F solo clean | s   |
| ------------------------------- | ------- | --------- | -------- | --------- | ------- | ------- | ------------ | ------------ | --- |
| SDK OnsetPipeline (normal gate) | 60.3    | 54.3      | 47.0     | 44.7      | 95.1    | 48.8    | 44.8         | 81.9         | 33  |
| SDK gentle gate (0.25)          | 60.4    | 54.3      | 47.0     | 44.7      | 95.1    | 48.9    | 45.0         | 81.9         | 18  |
| SDK strict gate (0.75)          | 60.1    | 54.1      | 46.7     | 44.7      | 95.1    | 48.7    | 44.5         | 81.9         | 20  |
| SDK delta 0.01 (tuned)          | 79.0    | 77.6      | 71.8     | 75.3      | 85.2    | 75.0    | 76.3         | 82.4         | 21  |
| log flux                        | 78.0    | 68.6      | 69.5     | 78.7      | 88.6    | 73.1    | 73.0         | 84.3         | 16  |
| SuperFlux-like                  | 79.4    | 77.3      | 73.5     | 77.9      | 90.5    | 73.2    | 74.0         | 86.1         | 15  |
| whitened flux                   | 73.8    | 65.4      | 65.5     | 77.0      | 89.8    | 66.9    | 66.1         | 83.7         | 13  |
| whitened log flux               | 77.9    | 67.7      | 69.4     | 78.6      | 86.7    | 74.3    | 74.0         | 82.7         | 13  |
| complex domain                  | 78.4    | 72.7      | 73.1     | 76.5      | 87.5    | 74.3    | 73.4         | 84.7         | 29  |
| rectified CD                    | 78.2    | 75.8      | 74.2     | 78.5      | 88.4    | 73.3    | 72.9         | 84.9         | 23  |
| HFC (Masri)                     | 28.3    | 40.2      | 41.4     | 53.6      | 95.8    | 17.7    | 26.0         | 33.1         | 11  |
| HFC log diff                    | 75.8    | 80.6      | 70.7     | 78.0      | 81.1    | 72.1    | 72.2         | 81.2         | 9   |
| SuperFlux d.05 w5 (tuned)       | 84.5    | 83.5      | 75.4     | 84.7      | 86.2    | 84.2    | 84.1         | 84.6         | 10  |
| SuperFlux causal norm (tuned)   | 82.6    | 80.6      | 75.5     | 82.2      | 84.7    | 82.1    | 82.5         | 82.2         | 10  |
| SuperFlux+RCD (tuned)           | 83.4    | 81.6      | 78.6     | 83.5      | 89.0    | 80.3    | 81.4         | 85.6         | 21  |

Compute cost (Node 24, one core, clean items, whole method incl. STFT), ms per second of audio:
SDK pipeline 9.5 (hop 128, 3.4× more frames); log flux 6.6; SuperFlux-like 6.0; whitened 5.6–6.9;
complex domain 14.2; rectified CD 11.1; HFC 5.5; SuperFlux+RCD 13.5. All far below real time; the
phase (atan2 per bin) roughly doubles the cost.

Other settings tried (not kept in METHODS): SDK delta 0.015 → F clean 75.3, 0.007 → 79.5 but bar-10
66.5, 0.005 → 78.3; SDK delta 0.01 + combine 30 ms → 79.3; SDK delta 0.01 + strict gate → 78.1.
SuperFlux delta 0.03 → 81.9 (bar-10 63.7), 0.07 → 82.1, 0.15 → 74.9; 1024-point window with
d.05 w5 → 84.4 (same as 2048). Whitening floor 0.2 / 5, r 0.99, whitened RCD: 75–77 clean.
Plain log flux d.05 → 82.5. SuperFlux d.05 w5 with the SDK gate (on our candidates) at 0.5 / 0.75 →
84.5 / 83.5: no gain.

## 1. Gate strictness

- **Reference:** the SDK's own adaptive gate (`OnsetPipeline`, `gateTuning`); the peak picker follows
  Böck, Krebs & Schedl, ISMIR 2012, "Evaluating the online capabilities of onset detection methods".
- **Idea:** a candidate onset counts only if its band level clears the learnt background by a margin
  (3 / 6 / 12 dB for gentle / normal / strict). If the margin cut quiet notes, a gentler gate would
  raise recall.
- **Implemented:** `OnsetPipeline` with strictness 0.25 and 0.75; also `manualThresholdDb: −200`
  (no gate at all: F clean 60.4, same as gentle) and the SDK detector with `peaks.delta` lowered.
- **Verdict: the gate is not the reason (neutral).** Gentle, normal, strict and no gate are within
  0.3 point; about 670 matched onsets out of roughly 1370 references in every case. The recall is lost **before** the
  gate, in the detector's peak picker: `delta = 0.03` on the band-averaged SuperFlux is too high for
  strums and soft notes. With `delta = 0.01` the unchanged SDK pipeline goes from 60.3 to 79.0 clean
  and from 44.7 to 75.3 on bad-mic (precision 95 → 85, recall 49 → 75; comp 44.8 → 76.3).
- **Next:** validate `delta` 0.01–0.015 on the benchmark (players 03–05) and on the rhythm-game
  tests (stray sounds count against the run, so precision matters there); consider a relative
  (normalised) threshold instead of an absolute one.

## 2. Adaptive whitening

- **Reference:** D. Stowell and M. Plumbley, "Adaptive whitening for improved real-time audio onset
  detection", Proc. ICMC 2007. Compared with Bello et al., "A tutorial on onset detection in music
  signals", IEEE TSAP 13(5), 2005, and Böck & Widmer, "Maximum filter vibrato suppression for onset
  detection", DAFx 2013 (SuperFlux).
- **Idea:** each frequency bin is divided by its own recent peak, which decays slowly. Loud low
  strings no longer dominate the flux, so a quiet high note counts as much as a loud bass note.
- **Implemented:** P[k] ← max(X[k], floor, r·P[k]), r = 0.997 per 10 ms frame (≈ 3 s memory), floor
  1 (and 0.2, 5) in raw FFT magnitude units; then linear flux on X/P, and log flux (λ = 10) on X/P
  with floor 5. Reference ODFs on the same STFT: log flux log(1+X) over linear bins, and a
  SuperFlux-like ODF (24 bands/octave 30 Hz–16 kHz, log(1+X), max filter ±1 band, μ = 2 frames).
- **Verdict: worse.** Whitened flux 73.8 vs log flux 78.0 clean, and lower in pink noise (65 vs 69):
  whitening lifts the noise bins as much as the guitar. The log already does most of the level
  equalisation; SuperFlux-like beats both (79.4, and 77.3 in pink noise).
- **Next:** drop. If revisited, whiten the log-filterbank bands of SuperFlux with a floor tied to the
  learnt noise floor, not a fixed constant.

## 3. Complex domain

- **Reference:** C. Duxbury, J. P. Bello, M. Davies, M. Sandler, "Complex domain onset detection for
  musical signals", Proc. DAFx 2003; J. P. Bello, C. Duxbury, M. Davies, M. Sandler, "On the use of
  phase and energy for musical onset detection in the complex domain", IEEE SPL 11(6), 2004.
- **Idea:** in a steady note each bin keeps its magnitude and turns its phase at a constant rate, so
  the next frame is predictable. An onset is a frame far from that prediction, in magnitude or in
  phase; this also catches soft, pitched attacks that barely change the energy.
- **Implemented:** target X̂ = |X[n−1]|·e^{j(2φ[n−1] − φ[n−2])}, ODF = Σ_k |X[n] − X̂[k]|; rectified
  variant (Dixon, DAFx 2006) keeps only bins whose magnitude rises.
- **Verdict: neutral alone, promising in combination.** CD 78.4 / RCD 78.2 clean, on par with log
  flux, a little behind SuperFlux-like except in bar-10 (74.2 vs 73.5). Summed with SuperFlux (each
  scaled by its maximum) it gives the best bar-10 (78.6) and a higher precision (89.0) than SuperFlux
  alone at similar F, for twice the compute.
- **Next:** test SuperFlux+RCD on the benchmark's noisy conditions; worth it only if bar-10 matters.

## 4. High-frequency content

- **Reference:** P. Masri, "Computer modelling of sound for transformation and synthesis of musical
  signals", PhD thesis, University of Bristol, 1996 (and the Bello et al. 2005 tutorial).
- **Idea:** weight each bin by its frequency, HFC = Σ k·|X[k]|²: attacks are broadband, so the high
  bins jump at an onset while a sustained note sits low.
- **Implemented:** Masri's detection function (HFC[n]/HFC[n−1])·(HFC[n]/E[n]); and the rise of log
  HFC, HWR(log HFC[n] − log HFC[n−1]).
- **Verdict: worse (Masri form) / neutral (log diff).** Masri's form is dominated by bright frames and
  misses most notes (recall 18 %). The log-diff form reaches 75.8 clean and the best pink-20 score
  among untuned methods (80.6) because pink noise has little high-frequency energy, but its
  precision is the lowest (81 %), and in bar-10 it is behind.
- **Next:** none on its own; a high band could serve as a second cue, but SuperFlux already covers it.

## Pushing further

- **Peak picking matters more than the ODF.** SuperFlux-like with delta 0.05 and wait 5 (50 ms, like
  the SDK's combine) reaches 84.5 clean / 83.5 pink / 75.4 bar / 84.7 bad-mic (tuned on this set).
  The recall gain is on comp (74 → 84): a strum is several string onsets, and a lower delta keeps the
  second hit of a down-up pair.
- **Causal normalisation costs ~2 points** (82.6 clean with a running max and delta 0.1): the gain
  over the SDK is not an artefact of the whole-file normalisation.
- **The SDK gate on our candidates** changes nothing (±1 point): on this set the gate neither helps
  nor hurts.
- **Recommendation:** first lower the SDK picker's delta (0.01–0.015) and benchmark it, since it is a
  one-parameter change on code that already ships. Then test a relative threshold (ODF divided by a
  running max, delta ≈ 0.1) in the SDK picker, which is what makes the POC SuperFlux robust on
  bad-mic (84.7 vs 75.3). Complex domain only as an add-on for loud backgrounds.
