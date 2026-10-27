# Tempo: proof of concept

Code: `poc/methods/tempo.ts`. Run: `npx tsx poc/run.ts --task tempo [--only name]`.

POC set: GuitarSet comp excerpts of players 00–02 (10 items, 20 s, lead-sheet tempo) and 3 backing
tracks (30 s, title BPM). There are 13 tempi in all, from 68 to 200 BPM. Each method gives one
reading a second from 8 s on. Each reading uses only the audio heard up to that second. Scores are
the share of readings within 4 % (Acc1), or within 4 % of ×1, ×2, ×½, ×3 or ×⅓ (Acc2), averaged
over styles.

**What was tuned on this set:** the prior width (σ), the harmonic weight, the window length (6, 8,
10 or 12 s), the continuity (EMA weight, HMM width), the novelty band and the local-mean removal.
Every variant below the published configurations was chosen by looking at these same 13 items. A
narrow prior (σ = 0.7 octave around 120 BPM) fits this set's tempo range (68–200). These numbers
are optimistic until the benchmark split (players 03–05) confirms them.

## Shared front end: the novelty curve

All three methods use the same onset-strength curve:

- an STFT (2048-point Hann window at 44.1 kHz, 10 ms hop, causal frames);
- each magnitude compressed as `log(1 + 100·|X|)`, after normalising for the window;
- the positive frame-to-frame difference, summed over 30 Hz – 8 kHz;
- a causal 0.5 s moving mean subtracted, then values below zero set to zero.

This curve alone is the main gain over the SDK. The SDK works on the RMS envelope of the whole
band. When a chord is strummed, that envelope barely moves, but each string adds energy in its own
frequency bins, and spectral flux picks that up.

## 1. ACF + log-Gaussian prior

Ellis, "Beat Tracking by Dynamic Programming", _J. New Music Research_ 36(1):51–60, 2007.

**Idea.** If the onsets repeat at the beat, the autocorrelation of the onset-strength curve peaks at
the beat period. The ACF also peaks at the half beat and at the double beat. A log-Gaussian
weighting of the tempo (centre 120 BPM, width σ in octaves) picks the musically likely peak.

**Implemented.** The ACF of the last 8 s of novelty, over lags for 40–240 BPM, multiplied by the
prior (Ellis's 120 BPM, σ = 1.4 octaves). The best lag is refined with a parabola.

Variants:

- σ = 0.7 octave.
- "harm1": harmonic enhancement, r(τ) + r(2τ) + ½·r(4τ). A lag is backed by its multiples (Ellis's
  TPS2 idea, and P&T's).
- "w10": a 10 s window instead of 8 s.
- "ema0.7": the ACF averaged across readings with weight 0.7 on the previous average.

## 2. GACF + pulse trains

Percival & Tzanetakis, "Streamlined Tempo Estimation Based on Autocorrelation and Cross-correlation
With Pulses", _IEEE/ACM TASLP_ 22(12):1765–1776, 2014.

**Idea.** A "generalised" autocorrelation (inverse FFT of |FFT|^0.5) has sharper peaks than the
plain ACF. Adding A(2τ) and A(4τ) to A(τ) favours the true beat over its subdivisions. The top
candidates are then checked against the signal itself. Each one is cross-correlated with pulse
trains at τ, 2τ and 1.5τ over every phase. The score is the best match plus the variance across
phases. Over a whole song, the paper accumulates the candidates and corrects octaves with a
classifier.

**Implemented.** GACF (p = 0.5, zero-padded) of 8 s, then the enhancement EA(τ) = A(τ) + A(2τ) +
A(4τ). The 10 best peaks between 50 and 210 BPM are scored with pulse trains. There are 4 beats per
train, counted back from the newest frame, with weights 1 / 0.5 / 0.5, and the score is
max/Σmax + var/Σvar.

Variants:

- an optional log-Gaussian prior on the final choice;
- "acc0.8": a causal stand-in for the paper's accumulator. The candidate scores go into a 1 BPM
  histogram, smeared with a Gaussian (σ = 2 BPM), and the histogram decays by 0.8 per reading.

The octave classifier is not implemented.

## 3. Fourier tempogram + continuity

Grosche & Müller, "Extracting Predominant Local Pulse Information From Music Recordings", _IEEE
TASLP_ 19(6):1688–1701, 2011.

**Idea.** A windowed Fourier transform of the novelty curve, evaluated directly on a tempo axis,
gives a local tempo spectrum (the tempogram). The predominant local pulse is its strongest
sinusoid. Continuity from one column to the next keeps the reading from jumping.

**Implemented.** A Hann-windowed DFT of 8 s of novelty, on a log-tempo grid from 40 to 240 BPM (64
steps per octave). It is multiplied by the prior and sharpened (^4). Continuity is a causal HMM
filter: forward recursion with a Gaussian move of 0.1 octave per reading (or 0.03) and a small
floor. EMA smoothing of the columns was also tried.

Variant "harm1": a sub-harmonic sum T(f) + T(2f) + ½·T(4f). On its own, the Fourier tempogram puts
its peak at the eighth-note rate (2× the beat) on strummed guitar.

## Results

The SDK row is the baseline. Times are seconds for 13 items × 4 conditions.

| Method                      | Acc1 clean | Acc1 pink-20 | Acc1 bar-10 | Acc1 bad-mic | Acc2 clean | s   |
| --------------------------- | ---------- | ------------ | ----------- | ------------ | ---------- | --- |
| SDK TempoAnalyzer           | 12.1       | 10.2         | 16.2        | 10.3         | 28.1       | 12  |
| ellis ACF+prior 8s          | 43.1       | 40.4         | 33.0        | 38.9         | 64.8       | 9   |
| P&T GACF+pulses 8s          | 27.7       | 26.1         | 26.8        | 25.1         | 63.2       | 10  |
| tempogram 8s, no continuity | 18.9       | 21.4         | 19.2        | 24.8         | 67.1       | 9   |
| tempogram 8s + HMM          | 16.0       | 17.9         | 16.2        | 21.2         | 66.2       | 9   |
| _tuned here ↓_              |            |              |             |              |            |     |
| ellis s0.7                  | 51.3       | 48.2         | 46.0        | 43.5         | 70.9       | 8   |
| ellis s0.7 harm1            | 55.4       | 57.3         | 57.3        | 54.7         | 68.3       | 8   |
| ellis s0.7 harm1 w10        | 57.8       | 58.4         | 59.1        | 57.7         | 70.5       | 9   |
| ellis s0.7 harm1 ema0.7     | 57.4       | 60.6         | 60.8        | 56.4         | 69.9       | 9   |
| ellis s1.0 harm1 ema0.7     | 48.5       | 50.8         | 48.5        | 48.7         | 69.9       | 9   |
| P&T s0.7 acc0.8             | 58.6       | 53.3         | 50.0        | 52.2         | 80.8       | 9   |
| P&T s1.0 acc0.8             | 47.1       | 44.6         | 39.5        | 44.9         | 80.0       | 9*  |
| tgram s0.7 harm1            | 49.8       | 47.6         | 43.3        | 44.0         | 67.1       | 17* |
| tgram s0.7 harm1 HMM        | 48.1       | 42.5         | 41.7        | 41.7         | 66.0       | 11  |

\* These timings were noisy because the machine was busy. The same configurations ran in about 9 s
in isolation.

Other variants of the ACF method were swept and dropped. All rows are Acc1 clean / Acc2 clean, and
none uses the harmonic enhancement.

| Variant                            | Acc1 clean | Acc2 clean | Effect                                   |
| ---------------------------------- | ---------- | ---------- | ---------------------------------------- |
| σ = 1.0 octave                     | 49.7       | 67.2       |                                          |
| σ = 1.0, centre 100 BPM            | 46.1       | 64.1       | worse than centre 120                    |
| 12 s window                        | 42.4       | 64.4       | no change                                |
| 6 s window                         | 39.6       | 60.3       | worse                                    |
| EMA 0.7 alone                      | 43.3       | 66.8       | no change                                |
| flux band 30–500 Hz                | 42.9       | 65.5       | clean unchanged; bad-mic 44.3 vs 38.9    |
| no local-mean removal              | 46.9       | 65.4       | slightly better clean, worse under noise |
| σ = 0.5, harm 0.5                  | 62.3       | 74.8       | over-fitted prior: it forces 85–170 BPM  |
| harm 0.5, centre 110               | 51.4       | 71.6       | worse than centre 120 at σ 0.7           |
| P&T, σ 0.7, accumulator decay 0.9  | 57.5       | 79.8       | same as decay 0.8                        |
| P&T, σ 0.7, decay 0.8, 10 s window | 51.5       | 74.4       | worse                                    |
| P&T, σ 1.4, decay 0.8              | 37.4       | 77.3       |                                          |

**Remaining errors.** These come from the best ACF and P&T runs:

- 3:2 and 4:3 confusions on swing and shuffle material (BN 129 → 86, Funk 114 → 152, Rock 90 → 120,
  SS 68 → 103 or 115);
- half tempo on Jazz at 200 BPM (read as 100);
- with P&T, a steady 73 on BN at 147 (half).

## Verdicts

- **Spectral-flux novelty (shared): promising, and the biggest single win.** Acc1 goes from 12 to
  43 with the published Ellis configuration and no tuning, and it holds up under the three noisy
  conditions. The SDK should replace its RMS envelope with a log spectral flux.
- **Ellis ACF + prior: promising.** It is simple, cheap and robust under noise. With harmonic
  enhancement and some continuity it reaches 57–61 Acc1 in every condition, with σ tuned to 0.7.
- **P&T GACF + pulses: promising.** Frame by frame it is worse than Ellis (27.7, because the pulse
  score picks subdivisions). With the decaying candidate accumulator it has the best Acc2 (81) and
  the best clean Acc1 (58.6). It is the most stable reading, and its Acc1 is held back by octave
  choice.
- **Fourier tempogram: neutral to worse.** On its own it locks onto the eighth-note rate (Acc1 19,
  but Acc2 67). The sub-harmonic sum and narrow prior bring it to about 50, still below the ACF. The
  causal HMM did not help (−1 to −5): it holds on to the wrong octave once it has chosen it.
  Continuity by an EMA on the ACF did better (+0 to +3).

**Compute.** All methods run at more than 100× real time in Node: 1,160 s of audio, including
loading and conditioning, in about 8 s. Almost all of the cost is the 100 fps STFT (2048 points).
Each reading costs about 10⁵ multiply-adds for the ACF or tempogram, and P&T adds one 2048-point
FFT plus about 10 × τ × 12 pulse lookups. That is fine for a phone, including in an AudioWorklet.

## Next steps

1. Port the log-flux novelty into the SDK `TempoAnalyzer`. The SDK `SuperFlux` class could feed it.
2. Take "ellis s0.7 harm1 ema0.7" and "P&T s0.7 acc0.8" to the benchmark (players 03–05), with a
   σ sweep of 0.7 / 1.0, to check how much of the prior gain is fitted to this set.
3. Combine the two: use the P&T accumulator for stability, and the ACF with enhancement for the
   octave choice. Add a 3:2 check: compare the evidence at τ against 1.5τ and 2τ/3 using the
   swing ratio of the pulse fit.
4. Octave errors at fast tempi, like Jazz at 200, need a learned octave decision (P&T's classifier),
   or a UI choice (let the player tap or confirm half or double).
