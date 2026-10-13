# DSP design notes

Working notes on the signal-processing decisions in AudioLab, written for whoever
maintains the documentation. Everything here is implemented in `src/analysis/`
(pure TypeScript, unit-tested) and `src/audio/` (Web Audio adapters). Numbers are
given for a 48 kHz AudioContext unless stated otherwise; nothing hard-codes the
sample rate.

## 1. Signal path

```
Microphone ─► MediaStreamAudioSourceNode ─┬─► AnalyserNode (FFT 16384, Blackman, dB)
                                          │      └─► TonalityEngine (10 Hz) ─► key / chord / presence
                                          │      └─► spectrum view + noise floor (FFT tab only)
                                          └─► AudioWorklet "sample-capture" (FFT tab only)
                                                 └─► TempoAnalyzer ─► onset envelope ─► beat spectrum ─► BPM
```

- `useMicrophone` owns the session (race-safe start/stop).
- `useTonality` polls the AnalyserNode at `framesPerSecond` (10 Hz) and feeds the
  `TonalityEngine`. The spectrum copy and the noise floor are only produced while
  the FFT tab is visible.
- `useTempoAnalysis` is mounted by the FFT tab only; the worklet, the analyser
  fallback and the tempo maths stop as soon as the tab is left.

## 2. Spectrum front-end (AnalyserNode)

- `fftSize = 16384` → bin spacing `Δf = fs / N = 2.93 Hz` (2.69 Hz at 44.1 kHz).
- The AnalyserNode applies a **Blackman** window and scales by 1/N;
  `getFloatFrequencyData` returns `20·log10|X|` with **no clamping** to
  `minDecibels`/`maxDecibels` (those only affect the byte API). A 0 dBFS sine
  reads about −13.6 dB; a silent bin reads `-Infinity`.
- **Low-frequency resolution.** The Blackman main lobe is about ±3 bins
  (±8.8 Hz). The semitone spacing is 3.3 Hz at 55 Hz, 6.5 Hz at 110 Hz, 13 Hz at
  220 Hz. Adjacent semitones are therefore only cleanly separated from roughly
  A3 (220 Hz) upwards; below ~150 Hz a note leaks into its neighbouring pitch
  classes (±2.7 semitones at 55 Hz). The default band starts at 55 Hz anyway
  because the second harmonic reinforces the fundamental's pitch class.
- `smoothingTimeConstant = 0`: temporal smoothing is done by the chroma windows.

## 3. Chroma

For every bin `k` with `f_k = k·Δf ∈ [minFreq, maxFreq]`:

```
pc(k) = round(69 + 12·log2(f_k / 440)) mod 12
chroma[pc(k)] += |X_k|²             (energy weighting)
chroma ← chroma / Σ chroma          (L1 normalisation)
```

The dB spectrum is converted back to linear magnitude with a −90 dB gate
(`dbSpectrumToMagnitude`): bins at or below −90 dB contribute 0.

**Level invariance.** Because each frame sums to 1, the sliding-window average
gives every non-silent frame the same weight. Loud and quiet passages count
equally; only exactly silent frames (all bins ≤ −90 dB) contribute nothing. The
windows are _not_ energy-weighted. The high-water-mark filter (section 7)
therefore adapts to chroma _flatness_, not to loudness.

## 4. Sliding windows

`ChromaWindow` keeps the last `round(seconds × fps)` frames and returns their
element-wise mean (L1-renormalised for chroma, raw for the presence indicator).
The sum is maintained incrementally (add new, subtract evicted) and recomputed
on every ring wrap, so `aggregate()` is O(12) and the floating-point drift is
bounded.

Effective durations: each AnalyserNode frame already integrates 16384 samples
(341 ms), so a 10-frame "1 s" chord window actually spans
`9 × 100 ms + 341 ms ≈ 1.24 s`, and the "8 s" live window ≈ 8.24 s.

## 5. Key detection (Krumhansl–Schmuckler)

For each of the 24 candidates (12 tonics × major/minor) the chroma is correlated
with the Krumhansl & Kessler (1982) profile rotated to the tonic:

```
r(t, mode) = Pearson( chroma[i], profile_mode[(i − t) mod 12] )
score = softmax(r / τ),  τ = 0.1
```

Pearson correlation is invariant to scaling and to adding a constant, which is
why both the L1-normalised chroma and the un-normalised presence histogram can
be fed to it. The softmax output is a **ranking score** that sums to 1 over the
candidates, not a calibrated probability: with τ = 0.1 a correlation difference
of 0.1 is a factor _e_ between two scores. A minor key and its relative major
share all seven scale notes and are often ranked together; the sample tests
accept either.

## 6. Chord detection

24 binary templates (major/minor triads, 3 ones each, ‖t‖² = 3), scored by
cosine similarity against the chord-window chroma, then the same softmax
(τ = 0.1). For a non-negative chroma the similarity lies in [0, 1]; argmax
cosine = argmax dot product since all templates have the same norm.

## 7. High-water-mark filter and presence tonality

```
peak_n      = max_i liveChroma_n[i]
threshold_n = tolerance × agg(peak_{n−M+1} … peak_n)      agg ∈ {mean, median}
filtered[i] = liveChroma[i] if liveChroma[i] ≥ threshold else 0
indicator[i] = filtered[i] > 0 ? 1 : 0
presence     = mean of the last 30 s of indicators  ∈ [0, 1]^12
```

Defaults (tolerance 0.35, memory 3, mean) come from `npm run sweep`. The
presence histogram goes through the same Krumhansl–Schmuckler step. A flat
chroma (noise) passes every bin; silence passes none.

## 8. FFT tab: spectrum view

- `computeFftDb` (pure JS) uses a **periodic Hann** window applied over the
  signal length before zero-padding, and scales the one-sided magnitude by
  `2 / Σw` (`1 / Σw` at DC). Reference: a full-scale sine centred on a bin reads
  **0 dB** whatever the FFT size; a bin-centred tone leaks exactly −6.02 dB into
  its two neighbours and nothing elsewhere; the worst-case (half-bin) leakage is
  below −31 dB three bins away. Silence is `-Infinity`.
- The displayed AnalyserNode spectrum keeps the AnalyserNode's own reference
  (1/N scaling, Blackman), see section 2.
- **Noise floor** = median / mean / 80th percentile of the finite bins only
  (`-Infinity` and NaN are discarded first, so silent bins never bias the
  median), estimated over the displayed band 0–4 kHz. `p80 ≥ median` always.
- **Slope overlay** = centred finite difference `(S[k+1] − S[k−1]) / (2Δf)` in
  dB/Hz, drawn over the same bin range as the spectrum, centred mid-plot.
- The reference-note overlay is the **A minor / C major pentatonic**
  (A, C, D, E, G), not a major scale.

## 9. FFT tab: tempo analysis

### 9.1 Why the old approach could not work

Audio has essentially no energy below 20 Hz. Lowpassing the raw waveform at
0.5–10 Hz leaves DC offset, handling rumble and the filter's own start-up
transient; and a 65536-point FFT of 1.37 s gives 0.73 Hz = 44 BPM per bin.
Tempo lives in the **amplitude envelope**, which has to be computed first.

### 9.2 Capture

An `AudioWorkletProcessor` forwards every sample once, in transferable
2048-sample batches (~23 messages/s). The worklet outputs silence into the
destination so the graph keeps rendering it. Vite bundles it through a
`?worker&url` import; in the build the main chunk resolves it with
`new URL("sampleCapture.worklet-<hash>.js", import.meta.url)`, i.e. relative to
the chunk, which works with `base: "./"`.

Fallback without AudioWorklet: poll an AnalyserNode's time-domain window and
take the last `round((currentTime − lastTime) × fs)` samples. Measuring the
advance from the audio clock (instead of assuming `fs / fps`) removes the
10 Hz click train of the old implementation; the residual error is the
128-sample quantum alignment of the analyser buffer, which is harmless at
envelope level but not sample-accurate. Gaps longer than the window (throttled
tab) are zero-filled so the timeline keeps its length.

### 9.3 Onset strength

```
rms[n]   = sqrt( mean(x²) over block n )          block = 128 samples → 375 Hz
L[n]     = ln(1 + γ·rms[n]),  γ = 100              knee at −40 dBFS
o[n]     = max(0, L[n] − L[n−1])                   half-wave rectified difference
s[n]     = Butterworth_4(o)[n],  fc = onsetLowpassHz (default 8 Hz)
e[m]     = s[4m]                                   decimation ÷4 → 93.75 Hz
```

The log compression makes `o` roughly gain-independent above the knee (the
BPM estimate does not change between a loud and a quiet take) while keeping
very quiet noise linear, hence small. The lowpass is the anti-aliasing filter
of the decimation and doubles as the user's smoothing control: at fc = 2 Hz,
120 BPM sits at −3 dB and 240 BPM at −24 dB.

### 9.4 Butterworth lowpass (order 4)

Poles of an N-th order Butterworth prototype sit at angles
`θ_k = (2k − 1)π / (2N)`, k = 1…N/2, from the imaginary axis; each conjugate
pair is one biquad with `Q_k = 1 / (2 sin θ_k)`. For N = 4: θ = π/8 (Q = 1.307)
and 3π/8 (Q = 0.541). Each section is mapped with the bilinear transform and
pre-warping `K = tan(ω_c / 2)`:

```
norm = 1 / (1 + K/Q + K²)
b0 = K²·norm,  b1 = 2K²·norm,  b2 = K²·norm
a1 = 2(K² − 1)·norm,  a2 = (1 − K/Q + K²)·norm
```

Result: |H(fc)| = −3.01 dB, |H(2fc)| = −24.1 dB, |H(10fc)| ≈ −80 dB, 0 dB at DC,
monotone passband. (The previous code used θ = 3π/8 twice, which is a cascade of
two over-damped sections: −10.7 dB at fc and a real −3 dB point at 0.5 fc.)
Pole radius stays < 1 over the whole slider range; at the onset-envelope rate
(375 Hz) the design is well conditioned even at fc = 1 Hz.

### 9.5 Beat spectrum and estimate

Over the last 8 s of `e` (750 samples): subtract the mean, periodic Hann
window, zero-pad to 4096 points, magnitude spectrum (`computeFftDb`). Bin
spacing is `93.75 / 4096 = 0.0229 Hz = 1.37 BPM`, but the true resolution is set
by the window: `1 / 8 s = 0.125 Hz = 7.5 BPM`; zero-padding only interpolates.
The BPM axis is `bpm = 60·f` over 40–240 BPM.

Estimate = argmax over the axis of `|E(f)| · w(bpm)` with the log-Gaussian
tempo prior of Ellis (2007):

```
w(bpm) = exp( −½ · (log2(bpm / 120) / 1.4)² )
```

refined by parabolic interpolation around the peak. `confidence =
1 − mean/peak` of the weighted spectrum over the axis (≈ 0 for a flat,
noise-like spectrum). Synthetic click tracks at 90–180 BPM are estimated within
3 BPM at 44.1 and 48 kHz.

**Octave ambiguity.** A pulse train has equal-strength envelope harmonics at
1×, 2×, 3× the beat rate, so a 60 BPM click track is reported as 120 BPM (the
prior prefers it). This is inherent to spectral tempo estimation; the UI says
so. An autocorrelation-based tie-break would be the next step.

## 10. Offline pipeline vs. live path

The sample-based tests decode files in Node and frame them with the pure-JS
FFT (symmetric Hann, 8192 points, hop 2048 ≈ 21.5 fps) instead of the
AnalyserNode (Blackman, 16384, 10 Hz, dB round-trip with the −90 dB gate). From
the chroma onwards both drive the **same `TonalityEngine`**; the refactor left
the offline rankings byte-identical. What the sample tests do _not_ exercise:
the Blackman leakage profile, the dB gate, and the exact 10 Hz cadence.

## 11. Known limitations / ideas

- No harmonic handling in the chroma: the 5th harmonic adds a major third
  (biases minor chords towards major); a 1/octave weight or HPS-style
  attenuation would help.
- Chroma below ~150 Hz is smeared (section 2); a per-bin weight fading in
  below 150 Hz, or `minFreq ≈ 110 Hz`, would reduce the leakage.
- Windows are level-invariant; gating frames below a `signalLevelDb`
  threshold would stop near-silence from diluting the chord window.
- Tempo: octave disambiguation (autocorrelation or harmonic-sum), and a
  beat-phase tracker if a visual metronome is wanted.
