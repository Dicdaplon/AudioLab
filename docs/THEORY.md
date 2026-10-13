# Theory and DSP notes

The maths behind AudioLab and the reasoning behind each signal-processing choice.
Everything described here is implemented in `src/analysis/` (pure TypeScript,
unit-tested) and `src/audio/` (Web Audio adapters). Numbers assume a 48 kHz
`AudioContext` unless stated otherwise; nothing hard-codes the sample rate.

Contents:

1. [Signal path](#1-signal-path)
2. [Spectrum front-end](#2-spectrum-front-end)
3. [Chroma](#3-chroma)
4. [Sliding windows](#4-sliding-windows)
5. [Key detection (Krumhansl–Schmuckler)](#5-key-detection-krumhanslschmuckler)
6. [Chord detection](#6-chord-detection)
7. [Presence-based key detection](#7-presence-based-key-detection)
8. [FFT tab: spectrum view](#8-fft-tab-spectrum-view)
9. [FFT tab: tempo analysis](#9-fft-tab-tempo-analysis)
10. [Offline pipeline vs live path](#10-offline-pipeline-vs-live-path)
11. [Pitch detection (McLeod pitch method)](#11-pitch-detection-mcleod-pitch-method)
12. [Scale matching](#12-scale-matching)
13. [Limitations and ideas](#13-limitations-and-ideas)
14. [References](#14-references)

## 1. Signal path

```text
Microphone ─► MediaStreamAudioSourceNode ─┬─► AnalyserNode (FFT 16384, Blackman, dB)
                                          │      ├─► TonalityEngine (10 Hz) ─► key / chord / presence
                                          │      └─► spectrum view + noise floor (FFT tab only)
                                          └─► AudioWorklet "sample-capture" (FFT tab only)
                                                 └─► TempoAnalyzer ─► onset envelope ─► beat spectrum ─► BPM
```

The key/chord path works on spectra polled at 10 Hz; the tempo path works on every
sample. See [ARCHITECTURE.md](ARCHITECTURE.md) for threads and lifecycles.

## 2. Spectrum front-end

The browser's `AnalyserNode` provides the spectrum (`src/audio/analyser.ts`):

- `fftSize` $N = 16384$, so the bin spacing is $\Delta f = f_s / N = 2.93$ Hz at 48 kHz
  (2.69 Hz at 44.1 kHz). Bin $k$ is centred on $f_k = k \, \Delta f$.
- The node applies a **Blackman** window and scales by $1/N$.
  `getFloatFrequencyData` returns $S_k = 20 \log_{10} |X_k|$ with **no clamping**:
  `minDecibels` / `maxDecibels` only affect the byte API. A 0 dBFS sine reads about
  −13.6 dB; a silent bin reads $-\infty$.
- `smoothingTimeConstant = 0`: temporal smoothing is done by the chroma windows
  instead.
- Each analysis frame integrates 16384 samples, i.e. 341 ms of audio.

**Low-frequency resolution.** The Blackman main lobe spans about ±3 bins (±8.8 Hz). The
semitone spacing is 3.3 Hz at 55 Hz, 6.5 Hz at 110 Hz and 13 Hz at 220 Hz. Adjacent
semitones are therefore only cleanly separated from roughly A3 (220 Hz) upwards; below
~150 Hz a note leaks into neighbouring pitch classes (±2.7 semitones at 55 Hz). The
chroma band still starts at 55 Hz because the second harmonic of a bass note lands an
octave higher, where resolution is better, and reinforces the right pitch class.

**dB back to magnitude.** The chroma needs linear magnitudes, so each bin is converted
back with a −90 dB gate (`dbSpectrumToMagnitude`):

$$
|X_k| = \begin{cases} 10^{S_k/20} & \text{if } S_k > -90 \text{ dB} \\ 0 & \text{otherwise (including } -\infty) \end{cases}
$$

## 3. Chroma

**Bin to pitch class.** With the MIDI convention A4 = 440 Hz = note 69:

$$
\mathrm{midi}(f) = 69 + 12 \log_2\!\left(\frac{f}{440}\right), \qquad
\mathrm{pc}(f) = \operatorname{round}\big(\mathrm{midi}(f)\big) \bmod 12
$$

with pitch class 0 = C, 1 = C♯, …, 9 = A, …, 11 = B. Rounding to the nearest semitone
means a detuning of up to ±50 cents is tolerated (the synthetic tests check ±30 cents).

**Folding.** For every bin in the band $[f_{\min}, f_{\max}] = [55, 5000]$ Hz, its
**energy** is added to its pitch class, then the vector is **L1-normalised**:

$$
c[p] = \sum_{\substack{k \,:\, \mathrm{pc}(f_k) = p \\ f_{\min} \le f_k \le f_{\max}}} |X_k|^2,
\qquad
\tilde c[p] = \frac{c[p]}{\sum_{q=0}^{11} c[q]}
$$

($\tilde c = 0$ if every $c[q]$ is zero, i.e. digital silence or everything under the
gate.)

**Level invariance.** Because each frame sums to 1, every non-silent frame carries the
same total weight downstream. Loud and quiet passages count equally in the sliding
windows; only exactly silent frames contribute nothing. The windows are _not_
energy-weighted, and the high-water-mark filter of section 7 therefore adapts to chroma
_flatness_, not to loudness.

## 4. Sliding windows

`ChromaWindow` (`windowing.ts`) keeps the last $M = \operatorname{round}(T \cdot F)$
frames, where $F = 10$ frames per second and $T$ is the window length, and exposes their
element-wise mean:

$$
\bar c[p] = \frac{1}{M} \sum_{t=0}^{M-1} \tilde c_t[p]
$$

L1-renormalised for chroma (`aggregate()`), raw for the presence indicator
(`aggregateRaw()`). Three chroma windows run in parallel on the same frames:

| Window   | Default $T$ | $M$ (10 fps) | Estimator                 |
| -------- | ----------- | ------------ | ------------------------- |
| Chord    | 1 s         | 10           | `detectChord`             |
| Live     | 8 s         | 80           | `detectKey`, filter input |
| Tonality | 30 s        | 300          | `detectKey`               |

The running sum is maintained incrementally (add the new frame, subtract the evicted
one), so `aggregate()` costs O(12) whatever the window length; it is recomputed from
scratch at each ring wrap to bound floating-point drift. `resize()` changes the length on
the fly, keeping the most recent frames, which is how the UI sliders work without
resetting the analysis.

**Effective durations.** Each frame already spans 341 ms, so a 10-frame "1 s" chord
window covers $9 \times 100 \text{ ms} + 341 \text{ ms} \approx 1.24$ s of audio, and the
"8 s" window about 8.24 s.

**Why not one long FFT?** An 8 s or 30 s FFT at 48 kHz would transform 384 000 or
1 440 000 samples per update. Averaging short-time chromas gives the pitch-class
statistics that key and chord detection need, for one 16384-point FFT (done natively by
the browser) plus O(12) work per window per frame.

## 5. Key detection (Krumhansl–Schmuckler)

Krumhansl and Kessler (1982) measured, in probe-tone experiments, how well each of the
12 scale degrees "fits" a major or a minor key. Index 0 is the tonic:

$$
p^{\text{maj}} = (6.35,\ 2.23,\ 3.48,\ 2.33,\ 4.38,\ 4.09,\ 2.52,\ 5.19,\ 2.39,\ 3.66,\ 2.29,\ 2.88)
$$

$$
p^{\text{min}} = (6.33,\ 2.68,\ 3.52,\ 5.38,\ 2.60,\ 3.53,\ 2.54,\ 4.75,\ 3.98,\ 2.69,\ 3.34,\ 3.17)
$$

The tonic is high in both; the major third (index 4, 4.38) versus the minor third
(index 3, 5.38) is what tells the modes apart; the fifth (index 7) is high in both.

For each of the **24 candidates** (12 tonics $K$ × 2 modes $m$) the profile is rotated to
the tonic, $p_{K,m}[i] = p^{m}[(i - K) \bmod 12]$, and correlated with the window chroma
$\bar c$ (Pearson):

$$
r_{K,m} = \frac{\sum_{i=0}^{11} (\bar c[i] - \mu_c)(p_{K,m}[i] - \mu_p)}
{\sqrt{\sum_{i=0}^{11} (\bar c[i] - \mu_c)^2} \ \sqrt{\sum_{i=0}^{11} (p_{K,m}[i] - \mu_p)^2}}
\in [-1, 1]
$$

where $\mu_c$ and $\mu_p$ are the means over the 12 components ($r = 0$ for a constant
chroma). Pearson correlation is invariant to scaling and to adding a constant, which is
why both the L1-normalised chroma and the un-normalised presence histogram (section 7)
can be fed to it unchanged.

**Softmax.** The 24 correlations are turned into scores that sum to 1:

$$
P(K, m) = \frac{\exp(r_{K,m} / \tau)}{\sum_{K', m'} \exp(r_{K',m'} / \tau)}, \qquad \tau = 0.1
$$

This is a **ranking score**, not a calibrated probability: with $\tau = 0.1$ a
correlation difference of 0.1 is a factor $e$ between two scores. The implementation
subtracts the maximum before exponentiating for numerical stability.

**Relative major/minor ambiguity.** A natural minor key and its relative major (A minor
and C major, F♯ minor and A major) use the same seven notes. If all seven are equally
weighted, the profiles cannot tell them apart; they separate them only through emphasis
on the tonic, third and fifth. Both are often ranked together, and the sample tests
accept either. This is a property of the method, not an implementation bug.

**Two key windows.** The live (8 s) and tonality (30 s) windows use the same estimator.
The short one follows modulations but is noisier; the long one is stable but slow to
react. When they disagree, the music has usually modulated or borrowed chords.

## 6. Chord detection

Template matching (Fujishima, 1999). Each of the **24 triads** gets a binary template
$t_C \in \{0, 1\}^{12}$ with ones on its chord tones: major $\{0, 4, 7\}$ and minor
$\{0, 3, 7\}$ semitones above the root.

| Chord   | Notes      | Template (C, C♯, D, …, B)              |
| ------- | ---------- | -------------------------------------- |
| C major | C, E, G    | `[1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]` |
| A minor | A, C, E    | `[1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0]` |
| F♯ maj  | F♯, A♯, C♯ | `[0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]` |

Each template is scored by cosine similarity with the 1 s window chroma:

$$
s(C) = \frac{\langle \bar c, t_C \rangle}{\lVert \bar c \rVert \, \lVert t_C \rVert}
= \frac{\sum_{p \in C} \bar c[p]}{\sqrt{3}\, \lVert \bar c \rVert}
$$

For a non-negative chroma, $s \in [0, 1]$. Since every template has the same norm
($\lVert t_C \rVert^2 = 3$), the argmax of the cosine is the argmax of the plain dot
product: the winning chord is the triad that holds the most chroma energy. The scores go
through the same softmax ($\tau = 0.1$).

**Why 1 s?** Chords in pop and rock typically change every one to two seconds. Shorter
windows are dominated by attack transients; longer ones blur consecutive chords at the
transitions.

## 7. Presence-based key detection

A complementary key estimate: instead of averaging chroma values, count **how often each
pitch class is among the dominant ones**, then rank that histogram with the same
Krumhansl–Schmuckler step. Within a frame, a strong pitch class counts fully and a weak
one not at all, so the result depends on which notes are present rather than on how
much louder one is than another. The threshold also removes most upper-harmonic leakage
and hiss.

At each frame $n$, with $\ell_n$ the live-window chroma (8 s, L1-normalised):

$$
\text{peak}_n = \max_i \ell_n[i], \qquad
\theta_n = \alpha \cdot \operatorname{agg}\big(\text{peak}_{n-M+1}, \dots, \text{peak}_n\big),
\quad \operatorname{agg} \in \{\text{mean}, \text{median}\}
$$

$$
b_n[i] = \begin{cases} 1 & \text{if } \ell_n[i] \ge \theta_n \text{ and } \ell_n[i] > 0 \\ 0 & \text{otherwise} \end{cases}
\qquad
h[i] = \frac{1}{N_\text{ton}} \sum_{n} b_n[i] \in [0, 1]
$$

$h$ is averaged over the tonality window ($N_\text{ton}$ frames, 30 s by default) and
is the fraction of time each pitch class was dominant. It is passed to the correlation of
section 5 as is (no normalisation needed).

The current peak is included in the memory before the threshold is computed. Because
$\ell_n$ sums to 1, the peak measures how concentrated the chroma is: a flat chroma
(noise) lets every bin through, silence lets none through. The median option is more
robust to a single transient peak.

| Setting (UI)         | Symbol   | Range       | Default |
| -------------------- | -------- | ----------- | ------- |
| Live acquisition     | —        | 1–30 s      | 8 s     |
| Tonality acquisition | —        | 5–120 s     | 30 s    |
| Max filter tolerancy | $\alpha$ | 0–1         | 0.35    |
| Max memory           | $M$      | 2–15 frames | 3       |
| Peak aggregator      | agg      | mean/median | mean    |

The defaults come from `npm run sweep` (`scripts/parameterSweep.ts`), a grid search
scored against the known keys and chord grids of the sample recordings.

**Reading the three key outputs together:** when the live, tonality and presence
rankings agree, confidence is high; when they diverge, the passage is ambiguous
(modulation, non-diatonic material, unusual weighting of the scale degrees).

## 8. FFT tab: spectrum view

- **Displayed spectrum.** The AnalyserNode dB spectrum (section 2), 0–4 kHz, with the
  node's own reference level ($1/N$ scaling, Blackman).
- **Amplitude-normalised FFT.** `computeFftDb` (`timeFft.ts`, used by the tempo
  analysis) applies a **periodic Hann** window $w[n] = 0.5 - 0.5\cos(2\pi n / L)$ over
  the signal length $L$, zero-pads to a power of two, and scales the one-sided
  magnitude by $2 / \sum w$ ($1 / \sum w$ at DC). A full-scale sine centred on a bin then
  reads **0 dB** whatever the FFT size; a bin-centred tone leaks exactly −6.02 dB into
  its two neighbours and nothing elsewhere; the worst-case (half-bin) leakage is below
  −31 dB three bins away. Silence is $-\infty$. Zero-padding interpolates the spectrum
  but does not change the normalisation or the true resolution.
- **Noise floor** (`noiseFloor.ts`): median, mean or 80th percentile of the **finite**
  bins over the displayed band. $-\infty$ and NaN are discarded first, so silent bins
  never bias the median; p80 ≥ median always.
- **Slope overlay** (`spectrumSlope.ts`): centred finite difference in dB/Hz,

  $$
  s[k] = \frac{S[k+1] - S[k-1]}{2\,\Delta f},
  $$

  with one-sided differences at the ends and non-finite bins clamped to −100 dB.

- **Reference notes:** the A minor / C major **pentatonic** (A, C, D, E, G).

## 9. FFT tab: tempo analysis

### 9.1 Why tempo needs an envelope

Audio has essentially no energy below 20 Hz, so lowpassing the raw waveform at 0.5–10 Hz
only leaves DC offset, handling rumble and the filter's own start-up transient; and a
65536-point FFT of 1.37 s of audio gives 0.73 Hz = 44 BPM per bin. Tempo lives in the
**amplitude envelope**, which has to be computed first. (An earlier version of the FFT tab
tried the lowpass-the-waveform approach; it was replaced by the chain below.)

### 9.2 Capture

An `AudioWorkletProcessor` forwards every sample once, in transferable 2048-sample batches
(~23 messages/s at 48 kHz). The worklet outputs silence into the destination so the
graph keeps rendering it. Vite bundles it through a `?worker&url` import; the main chunk
resolves it relative to itself, which works with `base: "./"`.

Fallback without AudioWorklet: poll an AnalyserNode's time-domain window every 20 ms and
take the last $\operatorname{round}((t_\text{now} - t_\text{last}) \cdot f_s)$ samples.
Measuring the advance from the audio clock rather than assuming $f_s / \text{rate}$
avoids duplicated or dropped audio when a timer tick is late; the residual error is the
128-sample render-quantum alignment of the analyser buffer, harmless at envelope level
but not sample-accurate. Gaps longer than the window (throttled tab) are zero-filled so
the timeline keeps its length.

### 9.3 Onset strength

$$
\begin{aligned}
\text{rms}[n] &= \sqrt{\tfrac{1}{B}\textstyle\sum_{j \in \text{block } n} x_j^2}, & B &= 128 \ \Rightarrow\ 375 \text{ Hz} \\
L[n] &= \ln\big(1 + \gamma \cdot \text{rms}[n]\big), & \gamma &= 100 \ (\text{knee at } -40 \text{ dBFS}) \\
o[n] &= \max\big(0,\ L[n] - L[n-1]\big) & & \text{half-wave rectified difference} \\
s[n] &= (h_\text{LP} * o)[n] & & \text{Butterworth, order 4, } f_c = 8 \text{ Hz default} \\
e[m] &= s[4m] & & \text{decimation} \div 4 \ \Rightarrow\ 93.75 \text{ Hz}
\end{aligned}
$$

The log compression makes $o$ roughly independent of the input gain above the knee (the
estimate does not change between a loud and a quiet take) while keeping very quiet noise
linear, hence small. The lowpass is the anti-aliasing filter of the decimation and
doubles as the user's smoothing control (slider 1–20 Hz): at $f_c = 2$ Hz, 120 BPM sits
at −3 dB and 240 BPM at −24 dB. Blocks are completed across `pushSamples` calls, so the
envelope does not depend on how the audio was chunked.

### 9.4 Butterworth lowpass (order 4)

The poles of an $N$-th order Butterworth prototype sit at angles

$$
\theta_k = \frac{(2k - 1)\pi}{2N}, \qquad k = 1, \dots, N/2
$$

from the imaginary axis; each conjugate pair becomes one biquad with
$Q_k = 1 / (2 \sin\theta_k)$. For $N = 4$: $\theta = \pi/8$ ($Q = 1.307$) and
$3\pi/8$ ($Q = 0.541$). Each section is mapped to the z-plane with the bilinear transform
and pre-warping $K = \tan(\omega_c / 2)$, $\omega_c = 2\pi f_c / f_s$:

$$
\nu = \frac{1}{1 + K/Q + K^2}, \quad
b_0 = K^2 \nu,\ b_1 = 2K^2 \nu,\ b_2 = K^2 \nu, \quad
a_1 = 2(K^2 - 1)\,\nu,\ a_2 = (1 - K/Q + K^2)\,\nu
$$

Result: $|H(f_c)| = -3.01$ dB, $|H(2f_c)| = -24.1$ dB, $|H(10 f_c)| \approx -80$ dB,
0 dB at DC, monotone passband. Using the same angle twice is not a Butterworth: two
identical $3\pi/8$ sections give −10.7 dB at $f_c$ and a real −3 dB point near
$0.5 f_c$ (an earlier version of the code had exactly this bug). The pole radius stays
below 1 over the whole slider range; at the 375 Hz block rate the design is well
conditioned even at $f_c = 1$ Hz.

### 9.5 Beat spectrum and estimate

Over the last 8 s of $e$ (750 samples): subtract the mean, apply a periodic Hann window,
zero-pad to 4096 points and take the normalised magnitude spectrum (`computeFftDb`). The
bin spacing is $93.75 / 4096 = 0.0229$ Hz $= 1.37$ BPM, but the true resolution is set by
the window, $1 / 8 \text{ s} = 0.125$ Hz $= 7.5$ BPM; zero-padding only interpolates.
The BPM axis is $\text{bpm} = 60 f$, restricted to 40–240 BPM.

The estimate is the argmax of the spectrum weighted by the log-Gaussian tempo prior of
Ellis (2007):

$$
w(\text{bpm}) = \exp\!\left(-\frac{1}{2}\left(\frac{\log_2(\text{bpm} / 120)}{1.4}\right)^2\right)
$$

refined by parabolic interpolation around the peak, with

$$
\text{confidence} = 1 - \frac{\operatorname{mean}_\text{axis}\big(|E| \cdot w\big)}{\max_\text{axis}\big(|E| \cdot w\big)}
$$

(close to 0 for a flat, noise-like spectrum). No estimate is reported for an envelope
with zero variance (silence). Synthetic click tracks at 90–180 BPM are estimated within
3 BPM.

**Octave ambiguity.** A pulse train has equal-strength envelope harmonics at 1×, 2×, 3×
the beat rate, so a 60 BPM click track is reported as 120 BPM (the prior prefers it).
This is inherent to spectral tempo estimation, and the UI says so. An
autocorrelation-based tie-break would be the next step.

## 10. Offline pipeline vs live path

The sample tests and the scripts decode files in Node and frame them with the pure-JS
FFT (`fft.ts`: radix-2, **symmetric** Hann, 8192 points, hop 2048 ≈ 21.5 fps at
44.1 kHz) instead of the AnalyserNode (Blackman, 16384 points, 10 fps, dB round-trip with
the −90 dB gate). From the chroma onwards both drive the **same `TonalityEngine`**.

What the sample tests do _not_ exercise: the Blackman leakage profile, the dB gate and
the exact 10 Hz cadence. The synthetic live-path tests (`tests/helpers/liveRig.ts`) cover
those by emulating the AnalyserNode framing. Note also that window lengths are set in
seconds but the filter memory $M$ is set in frames, so $M = 3$ is 0.3 s live and about
0.14 s in the offline sweep that chose it.

## 11. Pitch detection (McLeod pitch method)

The tuner needs one frequency, not a chroma: a 12-bin histogram cannot tell 440 from
445 Hz, and the AnalyserNode's 2.9 Hz bins are 11 cents wide at 440 Hz. The pitch is
read in the time domain, from the same gapless sample stream as the tempo (section 9.2),
with the McLeod pitch method (MPM) in `analysis/pitch.ts`.

**Normalised square difference.** For a window $x_0 \dots x_{W-1}$ and a lag $\tau$,

$
r(\tau) = \sum_{j=0}^{W-1-\tau} x_j\,x_{j+\tau}, \qquad
m(\tau) = \sum_{j=0}^{W-1-\tau} \left(x_j^2 + x_{j+\tau}^2\right), \qquad
n(\tau) = \frac{2\,r(\tau)}{m(\tau)} \in [-1, 1].
$

$n$ is the autocorrelation normalised by the energy of the two segments it compares
(equivalently $1 - d(\tau)/m(\tau)$ with $d$ the square difference function). Unlike the
plain autocorrelation, whose peaks shrink with the lag because fewer samples overlap and
with a decaying note because the later segment is quieter, $n$ peaks at **1** at every
multiple of the period for any periodic signal, whatever its envelope: a plucked string
reads the same on the attack and in the decay. $r$ is computed with two FFTs on the
zero-padded window ($N = 2W$: $r = \mathrm{IFFT}(|X|^2)$, and since $|X|^2$ is real and even
a second forward FFT does the job), $m$ by the recursion
$m(\tau+1) = m(\tau) - x_{W-1-\tau}^2 - x_\tau^2$ from $m(0) = 2\sum x_j^2$. The window
mean is removed first so a DC offset cannot keep $n$ positive.

**Peak picking.** The candidates are the local maxima of the positive lobes that follow
the main lobe at $\tau = 0$ (a lobe still rising at the last lag is not a candidate: its
period is beyond the search range). Let $n_{\max}$ be the highest; the pitch is the
**first** candidate with $n(\tau) \ge k\,n_{\max}$, $k = 0.9$. Taking the first peak above
a fraction of the best, rather than the best, is what removes the octave-too-low error:
the peak at $2\tau_0$ is as high as the one at $\tau_0$ for a stationary tone. A signal
whose fundamental is weak or absent (partials 2…6 only) still peaks at $\tau_0$, because
the partials are periodic with the fundamental's period and only partially constructive
at $\tau_0/2$ ($n(\tau_0/2) \approx 0.26$ for $1/k$ amplitudes, well under $k$). The
estimate is dropped when the chosen peak's value, the **clarity**, is below 0.8 (noise,
chords), when the window RMS is below −60 dBFS (silence) or when the lag is outside
$[f_s/f_{\max}, f_s/f_{\min}]$.

**Sub-sample precision.** The integer peak $\tau$ is refined by the vertex of the parabola
through $(a, b, c) = (n(\tau-1), n(\tau), n(\tau+1))$:

$
\delta = \frac{a - c}{2\,(a - 2b + c)}, \qquad \hat\tau = \tau + \delta .
$

For a cosine-shaped peak of angular frequency $\omega$ sampled $d$ off its true maximum
the bias is about $d\,(\omega d)^2 / 3$: at 1.4 kHz ($\tau_0 \approx 34$ samples at
48 kHz, $\omega = 0.185$, $|d| \le 0.5$) that is 0.0014 samples, or 0.07 cents. Harmonic-
rich tones have sharper peaks and a larger bias, so when the window holds several
periods the lag is re-read at the **largest usable multiple** $K\hat\tau$ (the peak must
be a local maximum with $n \ge 0.8$): the interpolation error in samples is the same there
and the period is $\hat\tau_K / K$. Then $f_0 = f_s / \hat\tau$,
$\text{midi} = 69 + 12 \log_2 (f_0 / f_{A4})$ (rounded), and the cents are the
remainder × 100. $f_{A4}$ is configurable (440 Hz by default).

**Window.** 2048 samples: the lags are searched up to $W/2$, so the lowest detectable
note is 46.9 Hz at 48 kHz (two periods in the window) and `minFrequency` is set to
60 Hz; the hop is 1024 samples (21 ms). One analysis costs two 4096-point FFTs plus
$O(W)$ bookkeeping, about 0.2 ms in Node.

**Tracker.** `PitchTracker` keeps a ring buffer, analyses every hop and reports the
**median** of the last three fractional MIDI values (one wrong frame cannot move the
reading), `null` when fewer than two of the three are valid (silence drops the display
within ~40 ms), and holds the current note name until the pitch is more than
50 + 10 cents away from it, so a quarter-tone does not make the name flap while the
cents still move.

**Measured on synthetic signals** (the generators in `tests/helpers/synth.ts`; no
recorded single-string fixture exists in the repository), 61 frequencies from 70 Hz to
1.4 kHz with random detuning, at 44.1 and 48 kHz, worst case:

| Signal                                                           | Max error (cents) |
| ---------------------------------------------------------------- | ----------------- |
| Pure sine                                                        | 0.002             |
| Plucked-string-like (12 partials $1/k$, decaying), attack        | 0.07              |
| Same, 600 ms into the decay                                      | 0.22              |
| Same with stiffness $B = 10^{-5}$ ($f_k = k f_0\sqrt{1 + Bk^2}$) | 0.47              |
| Same with $B = 2\cdot 10^{-5}$                                   | 0.93              |
| Partials 2–6 only, or $f_0$ 30 dB down (196 Hz)                  | < 0.01            |

The stiff-string rows are not detector error as such: the partials of a stiff string
are sharp of $k f_0$, the period they agree on is shorter than $1/f_0$, and the ear hears
that pitch too. The tests pin "< 1 cent" on every row.

## 12. Scale matching

`analysis/scales.ts` answers "which scales contain the notes I heard?" from the presence
histogram of section 7 (or any 12 weights $w_p$). A pitch class is **played** when
$w_p$ exceeds a threshold ($P$ = the played set, $|P| \ge 1$). Every scale of the list
(intervals from the tonic) is rotated to the 12 tonics ($S$ = its pitch classes) and the
candidates are sorted by:

1. $|P \setminus S|$, the played notes **outside** the scale (0 first);
2. $|S \setminus P|$, the scale notes **missing** from what was played;
3. $\sum_{p \in P \cap S} w_p \big/ \sum_{p \in P} w_p$, the share of the played weight
   inside the scale (so when two scales each exclude one heard note, the one excluding
   the fainter note wins);
4. the position of the scale in the list, then the tonic.

Each match also carries a display score
$s = \frac{\sum_{p \in P \cap S} w_p}{\sum_{p \in P} w_p} \cdot \frac{|P \cap S|}{|S|}$:
1 for a scale whose notes were all heard and nothing else. The ordering is the
lexicographic one above, not a sort on $s$. Scales that share a pitch-class set (C major
pentatonic / A minor pentatonic, the seven modes of C major) tie on 1–3 and are listed
in list order: the engine does not decide the tonic between relatives, the key profiles
of section 5 do that.

## 13. Limitations and ideas

- **Harmonics.** No harmonic handling in the chroma: the 5th harmonic adds a major third
  (biasing minor chords towards major). A 1/octave weight or HPS-style attenuation would
  help.
- **Bass resolution.** Chroma below ~150 Hz is smeared (section 2). A per-bin weight
  fading in below 150 Hz, or `minFreq` ≈ 110 Hz, would reduce the leakage.
- **Near-silence.** Windows are level-invariant, so quiet noise between notes still
  counts. Gating frames below a `signalLevelDb` threshold would stop near-silence from
  diluting the chord window.
- **Vocabulary.** Triads only; sevenths, sus, diminished and augmented chords would need
  more templates. Alternative key profiles (Temperley, harmonic minor) could be compared.
- **Tempo.** Octave disambiguation (autocorrelation or harmonic sum), and a beat-phase
  tracker for a visual metronome.
- **Pitch.** Monophonic by construction; a polyphonic reading would need a different
  model. The multiples refinement assumes a steady note over the window; vibrato is
  averaged. A recorded single-string fixture would turn the synthetic figures above into
  a real baseline.

## 14. References

- C. L. Krumhansl and E. J. Kessler, "Tracing the dynamic changes in perceived tonal
  organization in a spatial representation of musical keys", _Psychological Review_
  89(4), 1982. C. L. Krumhansl, _Cognitive Foundations of Musical Pitch_, Oxford
  University Press, 1990.
- T. Fujishima, "Realtime chord recognition of musical sound: a system using Common Lisp
  Music", _ICMC_, 1999.
- D. P. W. Ellis, "Beat tracking by dynamic programming", _Journal of New Music Research_
  36(1), 2007.
- P. McLeod and G. Wyvill, "A smarter way to find pitch", _ICMC_, 2005 (the normalised
  square difference function and its peak picking).
- R. G. Lyons, _Understanding Digital Signal Processing_, 3rd ed., Prentice Hall, 2010
  (windows, bilinear transform).
