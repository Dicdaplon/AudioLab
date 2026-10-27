# Pitch (tuner) — proof of concept

Code: `poc/methods/pitch.ts`. Run: `npx tsx poc/run.ts --task pitch [--only name]`.
Data: 10 GuitarSet solo excerpts (players 00–02, 20 s, mic), reference f0 every 10 ms
(one voiced string only). Scores are macro-averaged over styles, as `poc/evaluate.ts` does.

Caveat on the reference: GuitarSet's pitch contours were themselves made with pYIN on the
hexaphonic pickup (Xi et al., ISMIR 2018). A pYIN-like estimator is judged by a pYIN-like
reference, so RPA10 slightly favours it; RPA50 much less.

RPA50 mixes two things: voicing recall (did the method answer?) and accuracy when it
answers. Most of the gaps below are voicing, so falseVoice must be read alongside: a lower
voicing threshold buys RPA50 with false alarms. Accuracy-when-answered (clean) is quoted
where it tells a different story.

## Results

| Method                                 | RPA50 clean | pink-20 | bar-10   | bad-mic | RPA10 clean | octave | falseVoice | ms/frame |
| -------------------------------------- | ----------- | ------- | -------- | ------- | ----------- | ------ | ---------- | -------- |
| SDK MPM (detectPitch, 2048)            | 80.2        | 75.5    | 51.7     | 84.1    | 73.9        | 3.7    | 24.3       | 0.21     |
| YIN 0.15                               | 78.1        | 70.1    | 43.3     | 81.8    | 70.1        | 4.2    | 18.2       | 0.22     |
| YIN 0.15, window 4096                  | 73.9        | 66.1    | 39.5     | 80.7    | 66.8        | 3.7    | 19.0       | 0.49     |
| YIN 0.30                               | 84.7        | 81.2    | 63.7     | 85.4    | 74.6        | 3.2    | 33.8       | 0.22     |
| YIN 0.30 + MPM octave check            | 84.7        | 81.2    | 63.7     | 85.5    | 74.7        | 3.2    | 35.0       | 0.43     |
| YIN 0.30 + MPM refine                  | 84.8        | 81.4    | 64.2     | 85.5    | 77.0        | 3.2    | 33.8       | 0.40     |
| pYIN offline                           | 86.2        | 84.1    | 66.0     | 89.8    | 75.5        | 2.1    | 43.3       | 0.25     |
| pYIN lag 50 ms                         | 85.8        | 84.0    | 65.6     | 89.9    | 75.2        | 3.1    | 46.0       | 0.25     |
| pYIN causal (lag 0)                    | 81.2        | 79.4    | 60.8     | 88.7    | 71.2        | 4.2    | 40.6       | 0.25     |
| pYIN beta(3,17)                        | 87.4        | 85.5    | 70.1     | 90.3    | 76.4        | 1.8    | 46.5       | 0.25     |
| pYIN trust 0.3                         | 85.4        | 82.5    | 63.0     | 88.4    | 75.1        | 2.0    | 33.1       | 0.25     |
| CREPE tiny (conf 0.5)                  | 90.1        | 89.2    | 80.9     | 88.8    | 76.7        | 0.6    | 34.0       | 28       |
| CREPE tiny Viterbi (conf 0.5)          | 90.6        | 89.4    | 82.0     | 87.7    | 77.1        | 0.1    | 34.5       | 28       |
| **CREPE tiny (conf 0.6) + MPM refine** | 88.5        | 87.4    | **77.3** | 87.4    | **80.8**    | 0.4    | 23.9       | 28       |
| CREPE tiny (conf 0.7) + MPM refine     | 86.1        | 84.3    | 71.0     | 84.3    | 79.5        | 0.2    | 14.7       | 28       |

ms/frame: one 2048-sample (or 1024 at 16 kHz) analysis, Node 24, one core, pure TypeScript.
pYIN's Viterbi adds ~0.03 ms/frame. CREPE is ~37 M multiply-adds per frame.

Accuracy when the method answers (clean): MPM 92.6 % within 50 cents / 85.3 % within 10;
YIN 0.30 91.5 / 80.6; pYIN 92.5 / 81.0; CREPE 0.5 96.0 / 81.6; CREPE 0.7 98.8 / 86.0;
CREPE 0.7 + MPM refine 98.7 / 91.2. In bar-10: MPM 88.7 / 78.0, CREPE 0.6 + refine 95.7 / 81.9.

Tuned on this POC set (so optimistic): YIN threshold (0.10/0.15/0.20/0.30), pYIN prior,
trust, switch probability, bin size and look-ahead, CREPE confidence (0.3–0.7), the windows.

## Baseline: MPM

McLeod, P. & Wyvill, G. (2005). "A Smarter Way to Find Pitch." Proc. ICMC, Barcelona.

The normalised square difference function peaks at every multiple of the period; the first
peak within 90 % of the highest is the period, then refined on a multiple of it. A clarity
(peak height) under 0.8 means unvoiced. Very precise when it answers; the clarity gate is
what drops it in noise (bar-10: it answers on only 58 % of voiced frames).

## 1. YIN

de Cheveigné, A. & Kawahara, H. (2002). "YIN, a fundamental frequency estimator for speech
and music." JASA 111(4), 1917–1930.

The difference function d(τ) = Σ (x[j] − x[j+τ])² dips at the period; dividing by its
running mean (CMNDF) removes the dip at τ = 0, so a fixed absolute threshold picks the first
dip deep enough, which avoids octave-too-low errors.

Implemented: CMNDF through FFTs (integration length 2048 − 630 = 1418 samples, lags 31–630,
70–1400 Hz), absolute threshold, walk to the local minimum, parabolic interpolation (on d′
or on raw d: within 0.3 point), unvoiced when no dip is under the threshold, −60 dBFS
silence gate.

Verdict: no better than MPM at equal false alarms. At 0.15 (paper's range) it answers less
than MPM; at 0.30 it matches MPM's accuracy-when-answering and gains RPA50 only by voicing
more (falseVoice 34 %). 10-cent precision is below MPM's (80.6 vs 85.3 %), MPM's
multiple-lag refinement is the reason: grafting it on (YIN + MPM refine) gives back most of
it. **Window 4096 is worse** (−4 to −5 points; a note changes within 93 ms and the low E
already has 2.6 periods in 2048 samples); **MPM's octave check brings nothing**: scores
unchanged, the two rarely disagree by an octave when YIN is confident.

## 2. pYIN

Mauch, M. & Dixon, S. (2014). "pYIN: A fundamental frequency estimator using probabilistic
threshold distributions." Proc. ICASSP, 659–663.

Instead of one threshold, YIN is run under a Beta-distributed range of thresholds: each dip
collects the probability of the thresholds that would pick it. A hidden Markov model over
pitch bins × {voiced, unvoiced} then picks the smoothest likely path with Viterbi.

Implemented (faithful, simplified): 100 thresholds, Beta(2,18) prior (mean 0.1), the first
dip under each threshold gets its weight, the global minimum gets 1 % when none; 20-cent
bins 70–1400 Hz (260), triangular pitch transitions up to 35.9 oct/s (librosa's), switch
probability 0.01, observation = 0.5 × probability (the original's "YIN trust"); output
frequency = best candidate near the chosen bin. Viterbi is offline or fixed-lag (the
decision at frame t is made after t + lag frames).

Latency: the HMM needs look-ahead. Fixed lag 50 ms ≈ offline (−0.4 point); causal (lag 0)
loses 5 points and doubles octave errors. Add the half window (23 ms) any centred method has.

Verdict: the best of the classical methods in noise (bar-10 66–70 vs 52), octave errors
halved, but it voices generously (falseVoice 43–47 %: it holds the note through releases).
Matched on false alarms (trust 0.3, 33 %) it is barely ahead of YIN 0.30 (85.4 vs 84.7).
10-cent precision 81 % when it answers: worse than MPM.

## 3. CREPE tiny

Kim, J. W., Salamon, J., Li, P. & Bello, J. P. (2018). "CREPE: A Convolutional
Representation for Pitch Estimation." Proc. ICASSP, 161–165. Code and weights MIT
(github.com/marl/crepe, © 2018 Jong Wook Kim).

A 6-layer 1-D CNN reads 1024 raw samples at 16 kHz (64 ms) and outputs 360 sigmoid
activations, one per 20-cent bin from 32 Hz to 2 kHz; the pitch is a weighted average around
the strongest bin, the confidence is its height. Trained on synthetic and real monophonic
music; GuitarSet is not among its listed training sets.

Implemented: inference in pure TypeScript (no dependency) from the TF.js export of the tiny
model on the repo's gh-pages branch (`model/`, 487 k parameters, 1.9 MB float32), Keras
"same" padding, ReLU → batch norm → max-pool, windowed-sinc resampling to 16 kHz, frame
normalisation, local weighted average decoding; optional CREPE Viterbi smoothing (offline).
Weights live outside the repo (`CREPE_DIR`, default the session scratchpad); activations are
cached there by input hash, so only the first run is slow (~15 min over 4 processes).
Verified on synthetic tones (82–987 Hz, within 4 cents).

Verdict: clearly the best decision-maker. Accurate when it answers (96–99 %), octave
errors almost gone (0.1–0.6 % vs 3.7), and robust: bar-10 81 % vs 52 %. Its own cents are
coarse (20-cent bins), so 10-cent precision is no better than MPM's; **MPM refine fixes
that**: CREPE says voiced or not and which note, MPM's NSDF peak near that period gives the
cents. At conf 0.6 the hybrid has MPM's false-alarm rate (23.9 vs 24.3 %) and wins
everywhere: +8 RPA50 clean, +26 in bar-10, +7 RPA10. Conf 0.7 cuts false alarms to 15 %.
Only bad-mic is not improved (the 300 Hz high-pass hurts the CNN more than MPM).

Cost is the issue: 28 ms per frame in plain JS, so ~3× too slow for a 100 fps track and
borderline at the SDK tuner's 43 fps hop (1024 at 44.1 kHz). A WASM-SIMD or WebGPU runtime
(TF.js / onnxruntime-web) should bring it to a few ms (not measured); a tuner could also run
CREPE at 20–25 fps for the note and MPM at full rate for the cents.

## Next steps

1. Benchmark (players 03–05) "CREPE tiny conf 0.6 + MPM refine" and "MPM refine of pYIN"
   against MPM, with the SDK's PitchTracker smoothing on top, before any SDK change.
2. CREPE runtime: measure tfjs-wasm (SIMD) and onnxruntime-web on a phone; try running the
   CNN every 2–4 frames with MPM in between. Licence fine (MIT), model 1.9 MB (≈ 1 MB as
   float16).
3. Without a network: the cheapest win is MPM's multiple-lag refinement (already in the
   SDK) plus a better voicing decision; pYIN's HMM with a fixed lag of 50 ms helps noise but
   needs a stricter voicing (trust ≤ 0.3) to keep false alarms at MPM's level.
4. Not worth pursuing: YIN as a replacement for MPM, a 4096 window, the YIN/MPM octave check.
