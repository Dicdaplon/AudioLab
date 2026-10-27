# Benchmarks

How well AudioLab finds note onsets, the tempo, the chord, the key and the pitch, with every method it offers (the original ones and the opt-in alternatives of docs/POC-METHODS.md), on generated signals and on real recordings, clean and under noise (a noisy room, a bar, a bad microphone). The code is in
`packages/core/bench/`; the tables in "Results" are generated from the latest run.

## 1. Summary

From the full run of 2026-10-27 (benchmark version 2, 30 752 records; tables in "Results"). It is an unofficial run: made from uncommitted changes, its JSON sits in the git-ignored `bench/results/local/`; the first official run will be committed with the code. Every method the lab offers is measured, the original first. "Real" is the style-balanced score (styles equal within a source, sources weighted by their independent units; for key and tempo it also includes the backing tracks and the fixtures); "Synthetic" is generated audio. **Strict**: exact tonic and mode; **merged**: the key or its relative (C major = A minor). The "Both" columns of the tables (mean of synthetic and real) are not repeated here. In bold, the opt-in methods whose paired gain over the original is clear (95 % interval above zero) in every condition shown.

| Task, metric             | Method                | Synthetic, clean | Real, clean        | Real, busy bar (10 dB) | Real, loud bar (5 dB) | Real, bad microphone |
| ------------------------ | --------------------- | ---------------- | ------------------ | ---------------------- | --------------------- | -------------------- |
| Onsets, F (±50 ms)       | classic (original)    | 92.2 %           | 69.0 % [66.2–73.0] | 56.5 %                 | 47.3 %                | 60.4 %               |
|                          | sensitive             | 75.7 %           | 77.0 % [74.7–79.6] | 66.5 %                 | 57.9 %                | 79.4 %               |
|                          | **superflux-complex** | 95.6 %           | 81.2 % [78.8–83.5] | 74.9 %                 | 69.1 %                | 82.1 %               |
| Tempo, Acc1              | envelope (original)   | 6.3 %            | 14.5 % [8.4–21.2]  | 12.8 %                 | 11.2 %                | 8.5 %                |
|                          | **flux**              | 59.4 %           | 67.8 % [55.5–79.3] | 65.3 %                 | 53.4 %                | 64.6 %               |
| Chords, frame accuracy   | 1 s window (original) | 44.8 %           | 48.7 % [44.6–53.1] | 44.8 %                 | 41.3 %                | 42.6 %               |
|                          | hmm + gaussian-log    | 65.4 %           | 50.6 % [45.9–55.8] | 45.7 %                 | 36.9 %                | 40.3 %               |
|                          | cqt + hmm             | 68.3 %           | 55.1 % [50.3–59.9] | 50.1 %                 | 40.9 %                | 45.4 %               |
|                          | AI note reader        | 46.5 %           | 51.6 % [47.1–55.9] | 41.1 %                 | 34.1 %                | 36.8 %               |
| Key strict (live engine) | profile (original)    | 63.9 %           | 48.8 % [35.4–60.9] | 46.4 %                 | 43.7 %                | 41.5 %               |
|                          | **chords vote**       | 66.7 %           | 71.7 % [62.4–81.7] | 73.1 %                 | 68.9 %                | 58.4 %               |
| Key merged (live engine) | profile (original)    | 97.2 %           | 63.6 % [51.1–75.8] | 63.6 %                 | 61.7 %                | 53.8 %               |
|                          | **chords vote**       | 100 %            | 82.1 % [74.4–90.2] | 84.8 %                 | 82.7 %                | 67.9 %               |
| Pitch, RPA50 (±50 cents) | MPM (original)        | 32.8 %           | 63.0 % [58.5–66.1] | 37.4 %                 | 18.5 %                | 73.8 %               |
|                          | pYIN                  | 29.7 %           | 57.4 % [52.2–61.0] | 41.7 %                 | 25.7 %                | 63.4 %               |
|                          | **CREPE tiny**        | 56.3 %           | 76.9 % [73.1–79.3] | 62.0 %                 | 46.9 %                | 79.5 %               |

### Key findings

1. **Four opt-in methods win everywhere.** Paired against the original, on the same excerpts:
   superflux-complex onsets +12 points clean, +18 in a busy bar, +22 with a bad microphone;
   flux tempo +42 to +56 points of Acc1 in every condition; the chords vote for the key +33
   strict (+21 merged) clean and in a bar, +18 strict with a bad microphone; CREPE +14 points
   clean, +25 to +28 in a bar, +6 with a bad microphone. None of their intervals touches zero.
2. **The tempo goes from unusable to usable.** The original is right on one live reading in
   seven (Acc1 14.5 %); flux on two in three (67.8 %), with octave errors down from 18 % to 6 %.
   Noise alone still gets a plausible tempo: the confidence does not flag the absence of music.
3. **Onsets: the original is precise but deaf; superflux-complex hears.** Classic keeps 83–94 %
   precision but its recall falls to 38–48 % in a bar. superflux-complex keeps 63–84 % precision
   and 79–86 % recall, and on strums goes from 59 to 81 % F (27 → 67 % in a loud bar). The
   "sensitive" preset is a cheaper half-way: better recall, more false hits, and below the
   original on synthetic audio (76 vs 92 %).
4. **Chords: CQT + HMM is the best listener up to a busy bar, not beyond.** +6.3 points clean
   [+4.1, +9.0], +5.3 in a busy bar, +2.8 with a bad microphone; level with the original in a
   loud bar (−0.4). It answers in 400 ms at the median instead of 614 ms and switches wrongly
   a third less often, but misses slightly more changes (25 vs 23 %) and shows nothing on 12 %
   of the frames in a busy bar. hmm + gaussian-log gains less and loses in strong noise.
5. **The AI note reader is the steadiest but does not survive noise.** Clean, +2.9 points (not
   clear), it misses half as many changes (12 vs 23 %) with half the wrong switches; but from
   10 dB of noise down it falls clearly behind the original (−8 points at 10 dB of pink noise, −7 in a
   loud bar) and shows nothing on 17–29 % of the frames. A choice for a quiet room only.
6. **The key comes far better from the chords than from the notes.** Voting with the chords found
   lifts the live engine from 49 to 72 % strict and 64 to 82 % merged, the minor keys most
   (55 → 74 %): a progression says which chord is home, the note counts alone confuse C and Am.
7. **CREPE is the most accurate tuner, pYIN only helps in noise.** CREPE reads 65 % of the moments
   within 10 cents (MPM 52 %) with almost no octave errors (0.4 %). pYIN loses 6 points clean and
   10 with a bad microphone, gains 4–7 in a bar, and speaks more often on silence (47 vs 28 %).
8. **Style still decides more than the method for chords**, and the bar recording still contains
   music (a few false onsets a minute, a key): see "Noise alone" and the per-style tables.

The cost side, measured while integrating them: CREPE about 5 ms per frame on
the main thread, the AI note reader about 15 MB of WASM runtime and a 230 KB model loaded on demand,
superflux-complex about 51 ms of decision latency, the others negligible.

## 2. How to run

From the repository root:

| Command                                    | What it does                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `npm run bench`                            | Full run, the conditions spread over 4 child processes (`--jobs 4`): about 5 min               |
| `npm run bench:quick`                      | 4 conditions (`clean`, `pink-20`, `bar-10`, `bad-mic`) on a smaller set: about 3.5 min, serial |
| `npm run bench:report [-- <results.json>]` | Rewrites the generated part of this page from a results file (default: the newest)             |

Options, after `--` (e.g. `npm run bench -- --tasks chords,keys`):

| Option              | Meaning                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `--quick`           | The smaller set and the 4 quick conditions (indicative: too few units for intervals)     |
| `--jobs N`          | Run the conditions in N child processes; the numbers are the same as serial              |
| `--conditions a,b`  | Only these conditions (ids in §5)                                                        |
| `--tasks a,b`       | Only these tasks: `onsets`, `tempo`, `chords`, `keys`                                    |
| `--guitarset <dir>` | GuitarSet folder (default `../AILab/datasets/public/guitarset`, next to this repository) |
| `--backing <dir>`   | backing-tracks folder (default `../AILab/datasets/backing-tracks`)                       |
| `--out <file>`      | Where to write the JSON                                                                  |

Durations are measured on the development laptop (Intel Core Ultra 7 258V, Node 24); the exact
duration of a run is in the header of the generated tables.

### Data

| Data                                                               | Where                                 | Licence                         | When absent                                                          |
| ------------------------------------------------------------------ | ------------------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| GuitarSet 1.1.0: `audio/*_mic.wav` and `annotations/jams/*.jams`   | AILab `datasets/public/guitarset`     | CC BY 4.0                       | No real chords or onsets; real keys and tempo keep the other sources |
| backing-tracks: `manifest.jsonl` and `audio/clips/`                | AILab `datasets/backing-tracks`       | Commercial, private, local only | Its key and tempo rows are left out                                  |
| Bar ambience: `Sons dAmbiance - Bar Café #1.mp3` (677 s, 44.1 kHz) | `localSample/` at the repository root | Private, local only             | The `bar-*` conditions are skipped (quick mode uses `pink-10`)       |
| `tests/Sample` fixtures (Tona, FLStudio, Backing)                  | committed                             | see the repository              | always present                                                       |
| Synthetic signals                                                  | generated                             | –                               | always present                                                       |

The AI chord method (Basic Pitch) needs onnxruntime-node, which is not a dependency of the repository: set `BASIC_PITCH_DIR` to a folder where `npm i onnxruntime-node` was run (the model itself ships with the lab). Without it, its rows are left out. CREPE (the AI pitch method) runs in plain TypeScript from the model in `apps/lab/public/models/crepe-tiny/`.

Anyone cloning the repository without these files still gets the synthetic split and the fixtures; the `bar-*` rows cannot be reproduced without the private recording. The report header lists what was found.

For an exact reproduction: `npm ci` (lock file), Node 24, GuitarSet 1.1.0 (Zenodo 3371780), the backing-tracks build of `datasets/backing-tracks/build-info.json` (its file hashes), and the bar recording `Sons dAmbiance - Bar Café #1.mp3` (677 s); the results JSON records the commit, Node, CPU and what was found.

## 3. Workflow

    sources (items + references) → condition (noise, mic) → task (detector + metric)
      → records (JSON) → aggregation + bootstrap → tables (this page)

1. **Sources** (`bench/sources.ts`): every item carries its audio, its reference, a _source_
   (`synthetic`, `guitarset`, `backing`, `fixtures`), a _stratum_ (style or scenario) and a
   _cluster_ (its independent unit, see §6).
2. **Conditions** (`bench/augment.ts`): each item is played under each condition (§5), in memory.
3. **Tasks** (`bench/tasks.ts`): every detector runs as it does in the SDK, live path included;
   each item gives one **record** per metric and method: score `x`, mass `m`, stratum and cluster.
4. **Results**: one JSON per run, holding every record plus provenance (git commit and dirty flag,
   Node, CPU, arguments, sources found, the noise realisation of every item, durations).
   - Official runs (full, from a clean git tree, no `--conditions` or `--tasks`) are written to
     `packages/core/bench/results/` and committed.
   - Every other run goes to `packages/core/bench/results/local/`, which git ignores.
   - Audio and `bench/.cache/` are never committed.
5. **Report** (`bench/report.ts`): aggregates the records (§6) and rewrites the block between
   `<!-- bench:begin -->` and `<!-- bench:end -->`. Everything outside that block is hand-written.

### Determinism

Nothing draws from a shared random stream:

- **Seeds:** every seed is a hash of `BENCH_VERSION`, the item and the noise family (`seedFor` in
  `bench/seeds.ts`), so adding or removing an item changes nothing for the others.
- **Same run, same file:** two runs on the same commit and data give the same records; only the
  date and durations differ.
- **`--jobs`:** changes nothing but the time.

The unit tests in `packages/core/tests/bench/bench.test.ts` check the metrics (hand-computed
cases), the determinism, SNR and spectrum of the conditions, and the weighting.

### Never tune on this bench

GuitarSet players 03–05 were never used to tune anything (the HMM settings came from players
00–02). The bench must stay a test. If a setting is ever chosen by looking at these tables, bump
`BENCH_VERSION` in `bench/seeds.ts`, say so in the commit, and treat the numbers that follow as
tuned, not measured. Also bump the version whenever items, conditions or metrics change: results
of different versions are not comparable.

## 4. What is measured

Every method the lab lets you pick is measured, the original one first: the report gives each opt-in method's paired difference with it. Each task is reported on three splits: **synthetic** (generated, answer known by construction),
**real** (recordings with human or title labels) and **both** (the mean of the two, §6).

### GuitarSet bench30

All GuitarSet chord, key and tempo results use **bench30**, a fixed selection: one accompaniment
("comp") excerpt per lead sheet (30 sheets), the player rotating over 03, 04, 05 by the sheet's
rank. That gives 6 sheets per style (bossa nova `BN`, `Funk`, `Jazz`, `Rock`, singer-songwriter
`SS`) and 10 per player. Quick mode keeps the first 2 sheets of each style. Audio: the microphone
recording (`audio_mono-mic`) at 44.1 kHz.

### Rhythm: onsets

- **Methods:** `OnsetPipeline` with `method` "classic" (SuperFlux, online peak picking, attack localisation, adaptive gate), "sensitive" (the same, peak-picking threshold 0.01 instead of 0.03) and "superflux-complex" (SuperFlux plus a rectified complex-domain function, causal normalisation), fed in 512-sample batches as the live capture does.
- **Metric:** F-measure, precision and recall at ±50 ms, with one-to-one maximum matching (the
  mir_eval `onset.f_measure` convention), per item; also the timing of the matched onsets
  (median and p90 absolute error, and the mean: the bias).
- **Real data:** GuitarSet, the comp and solo excerpts of 4 sheets per style (1 in quick mode),
  the first 15 s (10 s in quick mode). The reference is the note starts of the six strings,
  grouped when within 50 ms of the group's first note (the window the detector uses to merge a
  strum into one event). Strums (comp) and single notes (solo) are also reported apart.
- **Synthetic data:** quarter-note strums with an accented downbeat and syncopated eighth notes
  at six tempos (65–175 BPM; three in quick mode), plus the cases of `npm run measure:onsets`
  without their own noise floor.
- **Pre-roll:** under every noisy condition, 4 s of the noise alone come first, so the gate can
  learn the room as it would live. The scoring starts with the music.

### Rhythm: tempo

- **Methods:** `TempoAnalyzer` with `method` "envelope" (the original: spectrum of the RMS envelope) and "flux" (spectral-flux novelty, autocorrelation, tempo prior, harmonic enhancement); one reading a second once the 8 s window is full, as a live display would show them.
- **Metrics:** share of readings within 4 % of the reference. **Acc1:** the tempo itself;
  **Acc2:** also ×2, ×½, ×3, ×⅓ (Gouyon et al. 2006); and the share of octave errors.
- **Real data:** bench30 with the GuitarSet `tempo` annotation (the lead sheet's tempo), and 30 s
  (three consecutive clips) of the three backing tracks whose title gives a tempo.
- **Synthetic data:** the strummed and syncopated items above (12; not the measure:onsets cases).
- **Beats:** not measured. The SDK has no beat tracker (beat grids come from the metronome).

### Chords

- **Detector:** the live path. An AnalyserNode emulation (10 fps, 16384 points at 44.1 kHz,
  4096 at 12 kHz) feeds `TonalityEngine`.
- **Methods:** the default 1 s window; the opt-in `hmm + gaussian-log`; `cqt + hmm` (constant-Q chroma from the time signal, fed the last 32768 samples at each frame, as the live AnalyserNode keeps them); and the AI note reader (Basic Pitch notes → chroma → chord HMM), run as it runs live: audio pushed in 0.25 s blocks, the model after each one, every display frame showing the newest decision available, look-ahead included.
- **Metric:** frame accuracy at display time, MIREX majmin vocabulary (G7 counts as G, m7b5
  frames left out): each frame's answer is compared with the chord sounding at that moment, so
  the latency counts against the method. Also the delay after a change (read it with the missed
  changes) and the wrong switches per minute.
- **Real data:** bench30, against the lead sheet (first chord annotation).
- **Synthetic data:** progressions on the model guitar, steady (100 BPM, 2–4 beats per chord) and
  fast (140 BPM, 1–2 beats), 10 seeds each (4 in quick mode), with no noise of their own.
- **Not scored:** the untimed loops of `tests/Sample` (AmDmEAm, AmGFE, FLStudio) have no chord
  times.

### Key

- **Methods:** the offline energy path (whole item, Krumhansl profile) with the original and the gaussian-log chroma; the presence path; and the live `TonalityEngine` as the site runs it (10 frames a second, its long window over the whole item), with `keyMethod` "profile" (the original) and "chords" (the chords found vote for their keys, plus half the profile correlation). Compare the two live-engine rows with each other: the offline rows use another front-end.
- **Metrics:** **strict** (same tonic and mode: relative keys are different answers), **merged**
  (same key or its relative, C = Am: the same key signature), the **MIREX** weighted score (1
  same, 0.5 a fifth, 0.3 relative, 0.2 parallel), and strict on major and minor references apart.
- **Real data:** bench30 (one key per lead sheet); the 5 trusted backing tracks, 8 evenly spaced
  10 s clips each (3 in quick mode; `cm-neosoul-90` is left out, its label is suspect); the
  `tests/Sample` fixtures: Tona ×3 (minor), FLStudio ×6 (C or D major), Backing ×6 (B or D minor).
- **Synthetic data:** loops of strummed triads (root in the bass), 2 s per chord, twice round, in
  the 12 tonics: I–V–vi–IV (major), i–iv–V–i (harmonic minor), i–VI–III–VII (natural minor, which
  shares its notes with the relative major on purpose). That is 36 items, 12 major and 24 minor
  (12 in quick mode).

### Pitch (the tuner)

- **Methods:** the three trackers of the tuner as they run live: `PitchTracker` (MPM, the original), `PyinTracker` (pYIN, 50 ms look-ahead) and `CrepeTracker` (CREPE tiny, ten times a second, MPM measuring the cents). Samples pushed in 512-sample blocks; the display reads each tracker's estimate ten times a second.
- **Metrics:** RPA50 (share of the voiced moments read within 50 cents), RPA10 (within 10 cents, the tuner's precision), octave errors, and readings on silence (false voicing).
- **Real data:** the GuitarSet solo excerpts of the onset set (4 sheets per style, 15 s), reference from the per-string pitch contours (moments with one string sounding; several strings: skipped).
- **Synthetic data:** single plucked notes across the neck with known pitch (the note's first 0.4 s; its fading tail skipped).

## 5. Noise conditions

| Id        | What it stands for     | How it is made                                                                                                                            |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `clean`   | the recording as it is | –                                                                                                                                         |
| `pink-30` | light hiss             | pink noise at 30 dB SNR                                                                                                                   |
| `pink-20` | noisy room             | pink noise at 20 dB                                                                                                                       |
| `pink-10` | very noisy room        | pink noise at 10 dB                                                                                                                       |
| `bar-20`  | quiet café             | real bar ambience at 20 dB (local only)                                                                                                   |
| `bar-10`  | busy bar               | real bar ambience at 10 dB (local only)                                                                                                   |
| `bar-5`   | loud bar               | real bar ambience at 5 dB (local only)                                                                                                    |
| `bad-mic` | phone-grade microphone | pink noise at 25 dB, then a 300 Hz–3.4 kHz band (4th-order Butterworth each side), then hard clipping of the loudest 0.5 % of the samples |

- **SNR:** the active part of the signal (50 ms frames within 30 dB of its loudest) against the
  noise, both measured in the 50 Hz–5.5 kHz band the analysers listen to; the noise itself is
  mixed unfiltered. Silences between notes do not make a performance look quieter.
- **Same noise at every level:** pink noise uses the same realisation for 30, 20 and 10 dB, and
  the bar the same excerpt for 20, 10 and 5 dB, at different gains: the levels compare item by
  item.
- **Bar excerpts** start between 10 % and 90 % of the recording; the bar is resampled with an
  anti-aliasing filter for the synthetic items (12 and 22.05 kHz); every offset is stored in the
  results.
- **No hidden clipping:** samples stay in floating point; only `bad-mic` clips, on purpose.
- **Noise alone:** each noisy condition also runs 30 s of noise without music (at the level it
  would have under music at −20 dBFS): false onsets per minute, share of frames showing a chord,
  tempo read, key found.

## 6. How the scores are combined

Style matters far more than method: on GuitarSet, chords are right 67–84 % of the time on rock and singer-songwriter, 22–50 % on bossa nova, jazz and funk, while the opt-in method gains about 2 points. So every score is built by stratum, and method or noise effects are read inside each
stratum.

### Records and strata

Every record is an item scored `x` with a mass `m`:

| Task   | `x`                                   | `m`                             |
| ------ | ------------------------------------- | ------------------------------- |
| Chords | frame accuracy of the item            | frames scored (10 per second)   |
| Pitch  | RPA50, RPA10, octave, false voicing   | voiced (or silent) moments read |
| Onsets | F, precision or recall of the item    | reference onsets                |
| Tempo  | share of right readings               | 1                               |
| Key    | 1 or 0 (strict, merged), MIREX weight | 1 per clip or excerpt           |

| Source         | Stratum                                              | Cluster (independent unit) |
| -------------- | ---------------------------------------------------- | -------------------------- |
| GuitarSet      | style (`BN`, `Funk`, `Jazz`, `Rock`, `SS`)           | lead sheet                 |
| backing-tracks | one stratum, "tracks"                                | track                      |
| fixtures       | one stratum, "fixtures"                              | recording or transposition |
| synthetic      | scenario (steady/fast, key template, rhythm pattern) | generated item             |

Clusters sit inside a single stratum: a lead sheet has one style. The backing tracks (one per
style, 5 in all) and the fixture families are pooled into one stratum each, because a stratum of
one unit cannot carry an interval.

### Formulas

    stratum           s_g   = Σ m·x / Σ m                 (over the items of g)
    source            S_src = mean of s_g over its strata  (each style weighs the same)
    real              S_real = Σ n_src·S_src / Σ n_src     (n_src = clusters of the source)
    synthetic         S_syn = mean of s_g over its scenarios
    both              (S_syn + S_real) / 2
    real, by volume   Σ m·x / Σ m over every real item     (shown next to the headline)

### Why the headline is style-balanced

- **The dataset's mix is arbitrary.** The mix of styles in a test set is a choice of the
  dataset's authors, not the mix of what AudioLab users play, which nobody knows. The balanced
  score does not move when more excerpts of one style are added.
- **Volume rewards long or dense styles.** In the volume score a slow bossa nova (more frames) or
  a busy funk part (more onsets) weighs more. Both scores are shown; a gap of more than about 2
  points means the composition of the data moves the result.
- **Sources are weighted by independent units**, so 5 backing tracks do not count as much as 30
  lead sheets.
- **Synthetic and real weigh the same in "both"**, otherwise "both" would depend on how many
  items were generated. It is a summary requested for convenience, not a measure of quality: the
  two splits measure different things.

### Uncertainty

- **Bootstrap:** 95 % intervals resample clusters, with replacement, inside each stratum (1000
  rounds, fixed seed). The style composition stays fixed, as the balanced score assumes.
- **Paired differences:** a method against the default, or a condition against clean, are
  computed on the same resample on both sides.
- **No interval below 3 units:** when a stratum behind a number has fewer than 3 independent
  units (quick mode), the interval is not shown. Per-stratum rows show the range over units
  instead of an interval.
- **Small n:** the key on GuitarSet rests on about 30 independent answers: only differences of
  15 points or more are readable; per style, about 6. With dozens of cells, a few intervals clear
  of zero are expected by chance.

## Results

<!-- bench:begin -->

Run of 2026-10-27, commit `24593aa` (uncommitted changes), mode **full**, benchmark version 2, 2871 s on Intel(R) Core(TM) Ultra 7 258V (Node v24.19.0). File: `packages/core/bench/results/local/bench-2026-10-27-24593aa.json`.

| Source    | Found                                         |
| --------- | --------------------------------------------- |
| guitarset | 30 comp excerpts (bench30), 40 onset excerpts |
| backing   | 40 key clips, 3 tempo excerpts                |
| fixtures  | 15 files                                      |
| bar       | 677 s (local)                                 |

### Rhythm: note onsets

F-measure (±50 ms) of the note starts found, mir_eval conventions.

**F, real recordings** (style-balanced, 95 % interval):

| Condition                                   | default (classic) | sensitive (opt-in) | superflux-complex (opt-in) |
| ------------------------------------------- | ----------------- | ------------------ | -------------------------- |
| clean                                       | 69.0 [66.2–73.0]  | 77.0 [74.7–79.6]   | 81.2 [78.8–83.5]           |
| light hiss (pink noise, 30 dB)              | 69.2 [65.9–73.6]  | 78.6 [76.4–81.1]   | 82.8 [80.3–85.6]           |
| noisy room (pink noise, 20 dB)              | 64.8 [61.5–69.4]  | 78.4 [75.9–81.1]   | 82.7 [80.3–85.8]           |
| very noisy room (pink noise, 10 dB)         | 51.2 [48.0–55.5]  | 66.7 [64.8–69.1]   | 79.2 [76.6–82.3]           |
| quiet café (real bar ambience, 20 dB)       | 66.5 [62.8–71.3]  | 77.1 [74.9–79.6]   | 80.1 [78.2–82.3]           |
| busy bar (real bar ambience, 10 dB)         | 56.5 [52.4–61.9]  | 66.5 [64.7–68.3]   | 74.9 [73.0–76.9]           |
| loud bar (real bar ambience, 5 dB)          | 47.3 [43.1–53.0]  | 57.9 [55.8–59.6]   | 69.1 [67.0–71.0]           |
| bad microphone (phone band, clipping, hiss) | 60.4 [56.1–66.0]  | 79.4 [77.1–82.0]   | 82.1 [79.3–85.2]           |

**Each method minus the default (default (classic)), real, paired points:**

| Condition                                   | sensitive (opt-in)   | superflux-complex (opt-in) |
| ------------------------------------------- | -------------------- | -------------------------- |
| clean                                       | +7.9 [+3.3, +11.7]   | +12.1 [+8.1, +15.3]        |
| light hiss (pink noise, 30 dB)              | +9.4 [+4.5, +13.1]   | +13.6 [+9.3, +17.1]        |
| noisy room (pink noise, 20 dB)              | +13.6 [+8.9, +17.8]  | +18.0 [+13.8, +21.5]       |
| very noisy room (pink noise, 10 dB)         | +15.5 [+10.1, +19.7] | +28.0 [+24.5, +31.2]       |
| quiet café (real bar ambience, 20 dB)       | +10.6 [+5.4, +15.0]  | +13.7 [+9.0, +17.5]        |
| busy bar (real bar ambience, 10 dB)         | +10.0 [+3.8, +15.0]  | +18.4 [+13.1, +22.6]       |
| loud bar (real bar ambience, 5 dB)          | +10.6 [+4.1, +15.9]  | +21.8 [+16.2, +26.4]       |
| bad microphone (phone band, clipping, hiss) | +19.0 [+14.3, +23.1] | +21.7 [+16.7, +26.3]       |

**F: synthetic / real by volume / both** (both = synthetic and real averaged):

| Condition                                   | default (classic)  | sensitive (opt-in) | superflux-complex (opt-in) |
| ------------------------------------------- | ------------------ | ------------------ | -------------------------- |
| clean                                       | 92.2 / 68.2 / 80.6 | 75.7 / 77.0 / 76.3 | 95.6 / 81.1 / 88.4         |
| light hiss (pink noise, 30 dB)              | 90.1 / 68.4 / 79.7 | 77.9 / 78.5 / 78.2 | 96.9 / 82.7 / 89.9         |
| noisy room (pink noise, 20 dB)              | 79.5 / 63.9 / 72.1 | 69.5 / 78.3 / 74.0 | 93.7 / 82.6 / 88.2         |
| very noisy room (pink noise, 10 dB)         | 54.8 / 50.2 / 53.0 | 44.2 / 66.5 / 55.4 | 79.5 / 79.0 / 79.3         |
| quiet café (real bar ambience, 20 dB)       | 85.8 / 65.6 / 76.1 | 71.4 / 77.0 / 74.2 | 90.1 / 80.1 / 85.1         |
| busy bar (real bar ambience, 10 dB)         | 67.7 / 55.6 / 62.1 | 51.9 / 66.3 / 59.2 | 75.7 / 74.6 / 75.3         |
| loud bar (real bar ambience, 5 dB)          | 51.4 / 46.5 / 49.4 | 43.4 / 57.8 / 50.7 | 62.3 / 69.0 / 65.7         |
| bad microphone (phone band, clipping, hiss) | 81.2 / 59.6 / 70.8 | 90.2 / 79.2 / 84.8 | 95.7 / 81.9 / 88.9         |

**F by style (real) and scenario (synthetic)**, methods numbered in the order above:

| Stratum                          | Units | clean #1 | clean #2 | clean #3 | pink-20 #1 | pink-20 #2 | pink-20 #3 | bar-10 #1 | bar-10 #2 | bar-10 #3 | bad-mic #1 | bad-mic #2 | bad-mic #3 |
| -------------------------------- | ----- | -------- | -------- | -------- | ---------- | ---------- | ---------- | --------- | --------- | --------- | ---------- | ---------- | ---------- |
| synthetic · strums               | 6     | 85.2     | 64.0     | 97.7     | 63.2       | 56.4       | 92.8       | 49.6      | 42.2      | 70.5      | 66.0       | 87.8       | 95.6       |
| synthetic · syncopated           | 6     | 96.6     | 84.4     | 97.5     | 90.7       | 78.8       | 96.2       | 82.2      | 60.9      | 83.8      | 89.7       | 93.3       | 97.3       |
| synthetic · measure:onsets cases | 6     | 95.0     | 78.7     | 91.6     | 84.6       | 73.4       | 92.0       | 71.4      | 52.8      | 72.8      | 87.8       | 89.5       | 94.2       |
| guitarset · BN                   | 4     | 76.3     | 79.5     | 82.0     | 67.1       | 83.9       | 86.4       | 54.7      | 68.0      | 77.7      | 61.2       | 82.5       | 84.0       |
| guitarset · Funk                 | 4     | 79.6     | 76.9     | 82.6     | 79.3       | 79.6       | 84.7       | 71.4      | 68.1      | 78.3      | 74.2       | 83.7       | 85.7       |
| guitarset · Jazz                 | 4     | 78.3     | 73.7     | 79.6     | 75.9       | 77.7       | 82.9       | 67.9      | 66.2      | 76.4      | 71.8       | 79.6       | 82.2       |
| guitarset · Rock                 | 4     | 61.1     | 78.2     | 82.4     | 55.5       | 75.2       | 79.7       | 48.6      | 65.5      | 71.1      | 53.0       | 77.1       | 79.9       |
| guitarset · SS                   | 4     | 50.0     | 76.5     | 79.1     | 46.1       | 75.9       | 80.1       | 39.8      | 64.5      | 70.8      | 41.9       | 74.2       | 78.9       |

**Precision / recall, real, by method:**

| Condition                                   | default (classic) | sensitive (opt-in) | superflux-complex (opt-in) |
| ------------------------------------------- | ----------------- | ------------------ | -------------------------- |
| clean                                       | 88.7 / 62.6       | 73.4 / 83.4        | 79.1 / 85.5                |
| light hiss (pink noise, 30 dB)              | 89.6 / 62.6       | 75.8 / 83.9        | 82.1 / 85.6                |
| noisy room (pink noise, 20 dB)              | 90.9 / 56.8       | 77.2 / 81.8        | 84.3 / 83.2                |
| very noisy room (pink noise, 10 dB)         | 94.1 / 41.2       | 61.2 / 76.0        | 82.1 / 78.6                |
| quiet café (real bar ambience, 20 dB)       | 90.7 / 58.8       | 73.1 / 83.5        | 78.6 / 84.3                |
| busy bar (real bar ambience, 10 dB)         | 88.1 / 47.6       | 58.2 / 80.0        | 71.7 / 81.3                |
| loud bar (real bar ambience, 5 dB)          | 82.9 / 38.3       | 47.2 / 78.8        | 62.7 / 79.9                |
| bad microphone (phone band, clipping, hiss) | 93.3 / 51.8       | 82.2 / 79.6        | 82.6 / 83.9                |

**Strums (comp) / single notes (solo), real F:**

| Condition                                   | default (classic) | sensitive (opt-in) | superflux-complex (opt-in) |
| ------------------------------------------- | ----------------- | ------------------ | -------------------------- |
| clean                                       | 59.1 / 84.8       | 77.0 / 77.2        | 81.2 / 80.8                |
| light hiss (pink noise, 30 dB)              | 58.4 / 85.9       | 78.3 / 79.3        | 82.4 / 83.0                |
| noisy room (pink noise, 20 dB)              | 50.6 / 85.7       | 76.5 / 81.5        | 81.8 / 83.9                |
| very noisy room (pink noise, 10 dB)         | 30.6 / 79.0       | 65.6 / 67.4        | 77.8 / 80.9                |
| quiet café (real bar ambience, 20 dB)       | 54.0 / 85.3       | 76.5 / 78.2        | 80.2 / 79.6                |
| busy bar (real bar ambience, 10 dB)         | 39.0 / 80.5       | 65.6 / 66.3        | 72.5 / 76.9                |
| loud bar (real bar ambience, 5 dB)          | 27.3 / 73.6       | 57.9 / 55.9        | 66.6 / 70.8                |
| bad microphone (phone band, clipping, hiss) | 43.4 / 84.6       | 76.6 / 83.7        | 81.4 / 83.1                |

### Rhythm: tempo

Share of the live readings (one a second once 8 s are heard) within 4 % of the reference (Acc1). Acc2 also accepts ×2, ×½, ×3, ×⅓ (octave and 3:1 errors).

**Acc1, real recordings** (style-balanced, 95 % interval):

| Condition                                   | default (TempoAnalyzer) | flux (opt-in)    |
| ------------------------------------------- | ----------------------- | ---------------- |
| clean                                       | 14.5 [8.4–21.2]         | 67.8 [55.5–79.3] |
| light hiss (pink noise, 30 dB)              | 14.6 [8.9–21.3]         | 67.2 [54.9–78.9] |
| noisy room (pink noise, 20 dB)              | 13.6 [9.0–19.4]         | 65.8 [53.2–77.8] |
| very noisy room (pink noise, 10 dB)         | 12.5 [6.8–19.2]         | 63.8 [51.8–76.4] |
| quiet café (real bar ambience, 20 dB)       | 13.7 [8.2–20.5]         | 65.9 [53.2–78.1] |
| busy bar (real bar ambience, 10 dB)         | 12.8 [7.0–19.4]         | 65.3 [52.4–77.1] |
| loud bar (real bar ambience, 5 dB)          | 11.2 [7.1–15.4]         | 53.4 [42.1–64.1] |
| bad microphone (phone band, clipping, hiss) | 8.5 [4.9–12.9]          | 64.6 [51.6–76.8] |

**Each method minus the default (default (TempoAnalyzer)), real, paired points:**

| Condition                                   | flux (opt-in)        |
| ------------------------------------------- | -------------------- |
| clean                                       | +53.2 [+42.7, +63.5] |
| light hiss (pink noise, 30 dB)              | +52.6 [+41.9, +63.0] |
| noisy room (pink noise, 20 dB)              | +52.2 [+41.2, +63.0] |
| very noisy room (pink noise, 10 dB)         | +51.3 [+41.0, +62.4] |
| quiet café (real bar ambience, 20 dB)       | +52.1 [+40.8, +63.4] |
| busy bar (real bar ambience, 10 dB)         | +52.5 [+41.0, +63.8] |
| loud bar (real bar ambience, 5 dB)          | +42.2 [+31.8, +52.9] |
| bad microphone (phone band, clipping, hiss) | +56.0 [+43.1, +68.4] |

**Acc1: synthetic / real by volume / both** (both = synthetic and real averaged):

| Condition                                   | default (TempoAnalyzer) | flux (opt-in)      |
| ------------------------------------------- | ----------------------- | ------------------ |
| clean                                       | 6.3 / 14.5 / 10.4       | 59.4 / 67.8 / 63.6 |
| light hiss (pink noise, 30 dB)              | 7.3 / 14.6 / 10.9       | 59.4 / 67.2 / 63.3 |
| noisy room (pink noise, 20 dB)              | 6.3 / 13.6 / 9.9        | 58.3 / 65.8 / 62.0 |
| very noisy room (pink noise, 10 dB)         | 9.4 / 12.5 / 10.9       | 58.3 / 63.8 / 61.1 |
| quiet café (real bar ambience, 20 dB)       | 7.3 / 13.7 / 10.5       | 59.4 / 65.9 / 62.6 |
| busy bar (real bar ambience, 10 dB)         | 6.3 / 12.8 / 9.5        | 60.4 / 65.3 / 62.9 |
| loud bar (real bar ambience, 5 dB)          | 3.1 / 11.2 / 7.2        | 49.0 / 53.4 / 51.2 |
| bad microphone (phone band, clipping, hiss) | 8.3 / 8.5 / 8.4         | 58.3 / 64.6 / 61.4 |

**Acc1 by style (real) and scenario (synthetic)**, methods numbered in the order above:

| Stratum                | Units | clean #1 | clean #2 | pink-20 #1 | pink-20 #2 | bar-10 #1 | bar-10 #2 | bad-mic #1 | bad-mic #2 |
| ---------------------- | ----- | -------- | -------- | ---------- | ---------- | --------- | --------- | ---------- | ---------- |
| synthetic · strums     | 6     | 8.3      | 66.7     | 10.4       | 66.7       | 8.3       | 66.7      | 14.6       | 66.7       |
| synthetic · syncopated | 6     | 4.2      | 52.1     | 2.1        | 50.0       | 4.2       | 54.2      | 2.1        | 50.0       |
| guitarset · BN         | 6     | 0.0      | 72.1     | 0.0        | 67.0       | 0.0       | 71.1      | 0.0        | 63.8       |
| guitarset · Funk       | 6     | 11.2     | 54.8     | 6.0        | 52.5       | 8.2       | 49.9      | 9.1        | 51.2       |
| guitarset · Jazz       | 6     | 22.3     | 61.4     | 25.9       | 58.3       | 23.6      | 52.2      | 19.0       | 56.7       |
| guitarset · Rock       | 6     | 20.0     | 67.9     | 15.8       | 67.1       | 21.7      | 67.5      | 6.7        | 67.7       |
| guitarset · SS         | 6     | 16.9     | 69.3     | 15.3       | 69.7       | 11.8      | 70.6      | 3.5        | 69.3       |
| backing · tracks       | 3     | 18.8     | 94.2     | 23.2       | 94.2       | 10.1      | 95.7      | 17.4       | 92.8       |

**Acc2 / octave errors, real:**

| Condition                                   | default (TempoAnalyzer) | flux (opt-in) |
| ------------------------------------------- | ----------------------- | ------------- |
| clean                                       | 33.0 / 18.4             | 73.5 / 5.7    |
| light hiss (pink noise, 30 dB)              | 32.6 / 17.9             | 72.9 / 5.7    |
| noisy room (pink noise, 20 dB)              | 31.3 / 17.6             | 71.9 / 6.2    |
| very noisy room (pink noise, 10 dB)         | 27.8 / 14.6             | 68.7 / 4.9    |
| quiet café (real bar ambience, 20 dB)       | 31.7 / 17.9             | 72.0 / 6.2    |
| busy bar (real bar ambience, 10 dB)         | 28.6 / 15.7             | 72.7 / 7.4    |
| loud bar (real bar ambience, 5 dB)          | 23.5 / 12.2             | 59.4 / 6.0    |
| bad microphone (phone band, clipping, hiss) | 19.5 / 11.0             | 71.3 / 6.7    |

Beat tracking: not measured (the SDK has no beat tracker; the beat grid comes from the metronome of the app).

### Chords

Share of frames (10 a second, what the player sees, latency included) showing the right chord, MIREX majmin (G7 counts as G; m7b5 frames left out). Real: GuitarSet bench30, against the lead sheet.

**Accuracy, real recordings** (style-balanced, 95 % interval):

| Condition                                   | default (1 s window) | hmm + gaussian-log (opt-in) | cqt + hmm (opt-in) | AI note reader (opt-in) |
| ------------------------------------------- | -------------------- | --------------------------- | ------------------ | ----------------------- |
| clean                                       | 48.7 [44.6–53.1]     | 50.6 [45.9–55.8]            | 55.1 [50.3–59.9]   | 51.6 [47.1–55.9]        |
| light hiss (pink noise, 30 dB)              | 48.4 [44.4–52.6]     | 50.4 [45.9–55.5]            | 54.6 [50.0–59.0]   | 49.3 [44.7–53.4]        |
| noisy room (pink noise, 20 dB)              | 48.9 [44.8–53.0]     | 50.7 [46.2–55.8]            | 54.3 [49.7–58.5]   | 46.9 [42.2–51.3]        |
| very noisy room (pink noise, 10 dB)         | 48.3 [44.3–52.7]     | 46.3 [41.6–51.9]            | 49.8 [45.2–54.7]   | 40.2 [35.7–44.5]        |
| quiet café (real bar ambience, 20 dB)       | 47.3 [43.4–51.7]     | 49.8 [45.3–54.9]            | 54.1 [49.5–58.6]   | 46.9 [42.4–51.1]        |
| busy bar (real bar ambience, 10 dB)         | 44.8 [40.9–49.0]     | 45.7 [40.9–51.4]            | 50.1 [45.4–54.9]   | 41.1 [36.7–45.1]        |
| loud bar (real bar ambience, 5 dB)          | 41.3 [37.5–45.5]     | 36.9 [32.3–42.4]            | 40.9 [36.7–45.8]   | 34.1 [29.3–38.1]        |
| bad microphone (phone band, clipping, hiss) | 42.6 [37.5–47.6]     | 40.3 [34.9–45.8]            | 45.4 [40.3–51.0]   | 36.8 [32.6–41.0]        |

**Each method minus the default (default (1 s window)), real, paired points:**

| Condition                                   | hmm + gaussian-log (opt-in) | cqt + hmm (opt-in) | AI note reader (opt-in) |
| ------------------------------------------- | --------------------------- | ------------------ | ----------------------- |
| clean                                       | +1.9 [−0.6, +4.5]           | +6.3 [+4.1, +9.0]  | +2.9 [−1.0, +6.5]       |
| light hiss (pink noise, 30 dB)              | +2.0 [−0.4, +4.6]           | +6.2 [+3.8, +8.9]  | +0.9 [−3.5, +4.6]       |
| noisy room (pink noise, 20 dB)              | +1.9 [−0.7, +4.4]           | +5.4 [+3.0, +8.3]  | −2.0 [−6.9, +2.0]       |
| very noisy room (pink noise, 10 dB)         | −1.9 [−5.1, +1.4]           | +1.5 [−1.7, +4.9]  | −8.1 [−13.5, −3.4]      |
| quiet café (real bar ambience, 20 dB)       | +2.4 [+0.1, +4.7]           | +6.7 [+3.9, +10.0] | −0.4 [−5.3, +3.7]       |
| busy bar (real bar ambience, 10 dB)         | +0.9 [−1.9, +3.8]           | +5.3 [+2.2, +9.1]  | −3.7 [−9.0, +0.7]       |
| loud bar (real bar ambience, 5 dB)          | −4.4 [−7.2, −1.5]           | −0.4 [−3.7, +3.5]  | −7.2 [−12.4, −2.2]      |
| bad microphone (phone band, clipping, hiss) | −2.3 [−4.7, −0.1]           | +2.8 [+0.9, +4.9]  | −5.8 [−10.3, −1.0]      |

**Accuracy: synthetic / real by volume / both** (both = synthetic and real averaged):

| Condition                                   | default (1 s window) | hmm + gaussian-log (opt-in) | cqt + hmm (opt-in) | AI note reader (opt-in) |
| ------------------------------------------- | -------------------- | --------------------------- | ------------------ | ----------------------- |
| clean                                       | 44.8 / 51.2 / 46.8   | 65.4 / 53.3 / 58.0          | 68.3 / 57.5 / 61.7 | 46.5 / 53.1 / 49.0      |
| light hiss (pink noise, 30 dB)              | 44.9 / 50.8 / 46.7   | 65.4 / 53.1 / 57.9          | 68.3 / 57.0 / 61.4 | 45.6 / 50.8 / 47.5      |
| noisy room (pink noise, 20 dB)              | 45.1 / 51.2 / 47.0   | 65.1 / 53.3 / 57.9          | 68.2 / 56.7 / 61.2 | 45.4 / 48.5 / 46.1      |
| very noisy room (pink noise, 10 dB)         | 45.5 / 50.6 / 46.9   | 63.2 / 49.2 / 54.8          | 65.9 / 52.5 / 57.8 | 44.5 / 42.2 / 42.4      |
| quiet café (real bar ambience, 20 dB)       | 45.0 / 49.8 / 46.2   | 65.0 / 52.5 / 57.4          | 68.0 / 56.5 / 61.0 | 45.8 / 48.5 / 46.4      |
| busy bar (real bar ambience, 10 dB)         | 45.0 / 47.3 / 44.9   | 62.9 / 48.6 / 54.3          | 65.4 / 52.7 / 57.7 | 45.2 / 42.8 / 43.2      |
| loud bar (real bar ambience, 5 dB)          | 44.3 / 43.8 / 42.8   | 58.7 / 39.8 / 47.8          | 61.4 / 43.7 / 51.1 | 43.6 / 35.8 / 38.8      |
| bad microphone (phone band, clipping, hiss) | 44.0 / 45.0 / 43.3   | 63.8 / 43.3 / 52.1          | 72.2 / 48.3 / 58.8 | 44.1 / 39.1 / 40.4      |

**Accuracy by style (real) and scenario (synthetic)**, methods numbered in the order above:

| Stratum            | Units | clean #1 | clean #2 | clean #3 | clean #4 | pink-20 #1 | pink-20 #2 | pink-20 #3 | pink-20 #4 | bar-10 #1 | bar-10 #2 | bar-10 #3 | bar-10 #4 | bad-mic #1 | bad-mic #2 | bad-mic #3 | bad-mic #4 |
| ------------------ | ----- | -------- | -------- | -------- | -------- | ---------- | ---------- | ---------- | ---------- | --------- | --------- | --------- | --------- | ---------- | ---------- | ---------- | ---------- |
| synthetic · steady | 10    | 63.2     | 81.2     | 82.2     | 67.6     | 63.3       | 81.1       | 82.1       | 67.2       | 64.0      | 79.7      | 81.0      | 66.4      | 62.6       | 79.6       | 84.6       | 64.7       |
| synthetic · fast   | 10    | 26.4     | 49.6     | 54.4     | 25.3     | 26.9       | 49.2       | 54.4       | 23.6       | 26.0      | 46.1      | 49.9      | 24.1      | 25.3       | 48.1       | 59.8       | 23.4       |
| guitarset · BN     | 6     | 49.1     | 49.7     | 55.6     | 60.9     | 50.2       | 50.7       | 54.9       | 54.2       | 45.1      | 45.4      | 53.0      | 48.6      | 43.4       | 34.3       | 39.8       | 36.5       |
| guitarset · Funk   | 6     | 23.9     | 22.0     | 26.6     | 25.5     | 22.2       | 21.2       | 23.9       | 23.4       | 21.9      | 17.7      | 20.3      | 18.6      | 19.3       | 14.8       | 19.1       | 16.6       |
| guitarset · Jazz   | 6     | 24.6     | 25.7     | 30.4     | 33.4     | 26.1       | 25.9       | 29.8       | 30.6       | 20.8      | 19.1      | 23.5      | 23.6      | 19.1       | 14.2       | 20.8       | 18.9       |
| guitarset · Rock   | 6     | 66.5     | 71.8     | 76.4     | 61.4     | 65.8       | 71.8       | 76.5       | 52.6       | 59.4      | 64.5      | 70.0      | 47.8      | 58.5       | 63.2       | 67.1       | 44.3       |
| guitarset · SS     | 6     | 79.5     | 83.9     | 86.2     | 76.8     | 79.9       | 84.1       | 86.1       | 73.4       | 76.6      | 81.9      | 83.6      | 66.9      | 72.6       | 74.8       | 80.2       | 67.8       |

**Reaction and flicker, real** (delay to the new chord held two frames, on the changes caught; read it with the missed share):

| Condition                                   | Method                      | Delay median / p90 | Missed changes % | Wrong switches / min | Nothing shown % |
| ------------------------------------------- | --------------------------- | ------------------ | ---------------- | -------------------- | --------------- |
| clean                                       | default (1 s window)        | 614 ms / 1184 ms   | 23.2             | 49.4                 | 0.0             |
| clean                                       | hmm + gaussian-log (opt-in) | 403 ms / 1370 ms   | 25.2             | 38.0                 | 1.1             |
| clean                                       | cqt + hmm (opt-in)          | 397 ms / 1117 ms   | 24.5             | 33.3                 | 0.1             |
| clean                                       | AI note reader (opt-in)     | 529 ms / 1172 ms   | 11.9             | 22.4                 | 16.8            |
| noisy room (pink noise, 20 dB)              | default (1 s window)        | 621 ms / 1259 ms   | 21.3             | 49.5                 | 0.0             |
| noisy room (pink noise, 20 dB)              | hmm + gaussian-log (opt-in) | 399 ms / 1383 ms   | 25.8             | 31.7                 | 4.2             |
| noisy room (pink noise, 20 dB)              | cqt + hmm (opt-in)          | 407 ms / 1272 ms   | 24.8             | 28.4                 | 3.7             |
| noisy room (pink noise, 20 dB)              | AI note reader (opt-in)     | 520 ms / 1241 ms   | 12.3             | 25.1                 | 22.7            |
| busy bar (real bar ambience, 10 dB)         | default (1 s window)        | 672 ms / 1357 ms   | 20.3             | 58.8                 | 0.0             |
| busy bar (real bar ambience, 10 dB)         | hmm + gaussian-log (opt-in) | 481 ms / 1108 ms   | 31.6             | 30.4                 | 12.9            |
| busy bar (real bar ambience, 10 dB)         | cqt + hmm (opt-in)          | 480 ms / 1350 ms   | 28.1             | 24.8                 | 11.6            |
| busy bar (real bar ambience, 10 dB)         | AI note reader (opt-in)     | 521 ms / 1319 ms   | 16.5             | 27.6                 | 29.3            |
| bad microphone (phone band, clipping, hiss) | default (1 s window)        | 613 ms / 1190 ms   | 29.7             | 46.7                 | 0.0             |
| bad microphone (phone band, clipping, hiss) | hmm + gaussian-log (opt-in) | 375 ms / 1146 ms   | 37.7             | 34.1                 | 5.1             |
| bad microphone (phone band, clipping, hiss) | cqt + hmm (opt-in)          | 304 ms / 1109 ms   | 34.8             | 31.6                 | 5.8             |
| bad microphone (phone band, clipping, hiss) | AI note reader (opt-in)     | 579 ms / 1429 ms   | 21.9             | 31.2                 | 27.5            |

### Key, strict (C major is not A minor)

Top-ranked key of the whole item. Real: GuitarSet bench30 + backing tracks (5 trusted, minor) + the tests/Sample fixtures. The live engine rows run the TonalityEngine as the site does (10 frames a second, its long window over the whole item).

**Strict, real recordings** (style-balanced, 95 % interval):

| Condition                                   | default (energy, Krumhansl) | gaussian-log (energy, Krumhansl, opt-in) | presence (default live path) | live engine, profile (default) | live engine, chords vote (opt-in) |
| ------------------------------------------- | --------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------ | --------------------------------- |
| clean                                       | 38.2 [27.1–49.2]            | 45.0 [33.3–57.7]                         | 32.5 [21.4–42.2]             | 48.8 [35.4–60.9]               | 71.7 [62.4–81.7]                  |
| light hiss (pink noise, 30 dB)              | 40.3 [28.3–51.9]            | 47.4 [34.5–60.2]                         | 34.6 [23.6–46.0]             | 48.8 [35.4–60.9]               | 70.6 [61.2–79.6]                  |
| noisy room (pink noise, 20 dB)              | 40.3 [28.3–51.9]            | 45.3 [31.5–58.3]                         | 35.2 [23.5–46.0]             | 48.8 [35.4–60.9]               | 70.6 [61.2–79.6]                  |
| very noisy room (pink noise, 10 dB)         | 39.7 [27.7–51.5]            | 44.6 [31.9–58.6]                         | 37.2 [25.0–49.0]             | 48.8 [35.7–60.6]               | 71.7 [62.2–81.0]                  |
| quiet café (real bar ambience, 20 dB)       | 40.3 [28.3–51.9]            | 48.5 [35.8–61.5]                         | 34.9 [23.4–45.8]             | 48.8 [35.4–60.9]               | 72.0 [62.6–81.9]                  |
| busy bar (real bar ambience, 10 dB)         | 39.3 [27.5–51.2]            | 49.7 [37.2–63.2]                         | 31.5 [21.4–43.3]             | 46.4 [33.5–58.5]               | 73.1 [63.9–82.4]                  |
| loud bar (real bar ambience, 5 dB)          | 35.4 [23.7–47.4]            | 43.7 [31.0–57.6]                         | 29.6 [18.9–41.4]             | 43.7 [31.4–55.8]               | 68.9 [59.1–77.3]                  |
| bad microphone (phone band, clipping, hiss) | 40.5 [28.5–52.4]            | 38.3 [26.3–50.2]                         | 42.9 [32.1–54.2]             | 41.5 [29.7–52.2]               | 58.4 [46.5–69.3]                  |

**Each method minus the default (default (energy, Krumhansl)), real, paired points:**

| Condition                                   | gaussian-log (energy, Krumhansl, opt-in) | presence (default live path) | live engine, profile (default) | live engine, chords vote (opt-in) |
| ------------------------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------ | --------------------------------- |
| clean                                       | +6.8 [−6.0, +19.7]                       | −5.7 [−17.5, +5.4]           | +10.6 [+2.9, +19.8]            | +33.5 [+21.4, +46.6]              |
| light hiss (pink noise, 30 dB)              | +7.1 [−3.6, +17.9]                       | −5.7 [−19.2, +6.8]           | +8.5 [+1.5, +16.3]             | +30.3 [+18.8, +41.8]              |
| noisy room (pink noise, 20 dB)              | +5.0 [−5.6, +15.7]                       | −5.1 [−17.2, +5.6]           | +8.5 [+1.5, +16.3]             | +30.3 [+18.8, +41.8]              |
| very noisy room (pink noise, 10 dB)         | +4.9 [−6.0, +16.4]                       | −2.5 [−12.7, +7.0]           | +9.1 [+2.1, +16.8]             | +32.0 [+20.4, +44.2]              |
| quiet café (real bar ambience, 20 dB)       | +8.2 [−2.6, +19.2]                       | −5.4 [−19.3, +7.3]           | +8.5 [+1.5, +16.3]             | +31.7 [+19.9, +43.9]              |
| busy bar (real bar ambience, 10 dB)         | +10.4 [+1.1, +21.2]                      | −7.8 [−19.0, +4.2]           | +7.1 [+1.5, +13.1]             | +33.8 [+21.7, +47.7]              |
| loud bar (real bar ambience, 5 dB)          | +8.4 [−4.3, +22.6]                       | −5.7 [−17.6, +5.5]           | +8.3 [+0.9, +16.0]             | +33.5 [+22.6, +45.9]              |
| bad microphone (phone band, clipping, hiss) | −2.2 [−12.8, +8.5]                       | +2.4 [−5.2, +11.1]           | +1.0 [−2.9, +6.7]              | +17.8 [+9.2, +28.1]               |

**Strict: synthetic / real by volume / both** (both = synthetic and real averaged):

| Condition                                   | default (energy, Krumhansl) | gaussian-log (energy, Krumhansl, opt-in) | presence (default live path) | live engine, profile (default) | live engine, chords vote (opt-in) |
| ------------------------------------------- | --------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------ | --------------------------------- |
| clean                                       | 63.9 / 41.2 / 51.1          | 66.7 / 44.7 / 55.8                       | 83.3 / 31.8 / 57.9           | 63.9 / 51.8 / 56.3             | 66.7 / 71.8 / 69.2                |
| light hiss (pink noise, 30 dB)              | 63.9 / 41.2 / 52.1          | 66.7 / 45.9 / 57.0                       | 80.6 / 31.8 / 57.6           | 63.9 / 51.8 / 56.3             | 66.7 / 70.6 / 68.6                |
| noisy room (pink noise, 20 dB)              | 63.9 / 41.2 / 52.1          | 66.7 / 45.9 / 56.0                       | 80.6 / 34.1 / 57.9           | 63.9 / 51.8 / 56.3             | 66.7 / 70.6 / 68.6                |
| very noisy room (pink noise, 10 dB)         | 63.9 / 38.8 / 51.8          | 69.4 / 48.2 / 57.0                       | 91.7 / 34.1 / 64.5           | 61.1 / 51.8 / 54.9             | 66.7 / 71.8 / 69.2                |
| quiet café (real bar ambience, 20 dB)       | 63.9 / 41.2 / 52.1          | 66.7 / 47.1 / 57.6                       | 83.3 / 32.9 / 59.1           | 63.9 / 51.8 / 56.3             | 66.7 / 72.9 / 69.3                |
| busy bar (real bar ambience, 10 dB)         | 63.9 / 42.4 / 51.6          | 66.7 / 51.8 / 58.2                       | 91.7 / 32.9 / 61.6           | 61.1 / 50.6 / 53.8             | 66.7 / 74.1 / 69.9                |
| loud bar (real bar ambience, 5 dB)          | 63.9 / 40.0 / 49.6          | 66.7 / 44.7 / 55.2                       | 97.2 / 30.6 / 63.4           | 61.1 / 48.2 / 52.4             | 66.7 / 74.1 / 67.8                |
| bad microphone (phone band, clipping, hiss) | 61.1 / 35.3 / 50.8          | 66.7 / 41.2 / 52.5                       | 75.0 / 36.5 / 59.0           | 58.3 / 34.1 / 49.9             | 66.7 / 51.8 / 62.5                |

**Strict by style (real) and scenario (synthetic)**, methods numbered in the order above:

| Stratum                                  | Units | clean #1 | clean #2 | clean #3 | clean #4 | clean #5 | pink-20 #1 | pink-20 #2 | pink-20 #3 | pink-20 #4 | pink-20 #5 | bar-10 #1 | bar-10 #2 | bar-10 #3 | bar-10 #4 | bar-10 #5 | bad-mic #1 | bad-mic #2 | bad-mic #3 | bad-mic #4 | bad-mic #5 |
| ---------------------------------------- | ----- | -------- | -------- | -------- | -------- | -------- | ---------- | ---------- | ---------- | ---------- | ---------- | --------- | --------- | --------- | --------- | --------- | ---------- | ---------- | ---------- | ---------- | ---------- |
| synthetic · I–V–vi–IV (major)            | 12    | 100.0    | 100.0    | 100.0    | 100.0    | 100.0    | 100.0      | 100.0      | 100.0      | 100.0      | 100.0      | 100.0     | 100.0     | 100.0     | 100.0     | 100.0     | 100.0      | 100.0      | 100.0      | 100.0      | 100.0      |
| synthetic · i–iv–V–i (harmonic minor)    | 12    | 91.7     | 100.0    | 50.0     | 91.7     | 100.0    | 91.7       | 100.0      | 41.7       | 91.7       | 100.0      | 91.7      | 100.0     | 75.0      | 83.3      | 100.0     | 83.3       | 100.0      | 33.3       | 75.0       | 100.0      |
| synthetic · i–VI–III–VII (natural minor) | 12    | 0.0      | 0.0      | 100.0    | 0.0      | 0.0      | 0.0        | 0.0        | 100.0      | 0.0        | 0.0        | 0.0       | 0.0       | 100.0     | 0.0       | 0.0       | 0.0        | 0.0        | 91.7       | 0.0        | 0.0        |
| guitarset · BN                           | 6     | 33.3     | 83.3     | 66.7     | 50.0     | 83.3     | 33.3       | 66.7       | 66.7       | 50.0       | 83.3       | 33.3      | 83.3      | 66.7      | 66.7      | 83.3      | 33.3       | 50.0       | 50.0       | 33.3       | 66.7       |
| guitarset · Funk                         | 6     | 16.7     | 16.7     | 0.0      | 33.3     | 33.3     | 33.3       | 33.3       | 16.7       | 33.3       | 33.3       | 33.3      | 33.3      | 16.7      | 33.3      | 50.0      | 50.0       | 16.7       | 50.0       | 50.0       | 50.0       |
| guitarset · Jazz                         | 6     | 0.0      | 16.7     | 0.0      | 16.7     | 33.3     | 0.0        | 16.7       | 0.0        | 16.7       | 33.3       | 0.0       | 16.7      | 0.0       | 0.0       | 16.7      | 16.7       | 16.7       | 0.0        | 16.7       | 16.7       |
| guitarset · Rock                         | 6     | 66.7     | 50.0     | 33.3     | 66.7     | 100.0    | 66.7       | 50.0       | 33.3       | 66.7       | 100.0      | 50.0      | 50.0      | 16.7      | 50.0      | 100.0     | 66.7       | 66.7       | 66.7       | 66.7       | 83.3       |
| guitarset · SS                           | 6     | 66.7     | 83.3     | 50.0     | 66.7     | 100.0    | 66.7       | 83.3       | 50.0       | 66.7       | 100.0      | 66.7      | 83.3      | 33.3      | 66.7      | 100.0     | 66.7       | 66.7       | 83.3       | 83.3       | 100.0      |
| backing · tracks                         | 5     | 45.0     | 50.0     | 27.5     | 55.0     | 70.0     | 42.5       | 52.5       | 30.0       | 55.0       | 70.0       | 45.0      | 60.0      | 30.0      | 55.0      | 72.5      | 32.5       | 52.5       | 32.5       | 30.0       | 45.0       |
| fixtures · fixtures                      | 7     | 40.0     | 20.0     | 46.7     | 53.3     | 80.0     | 40.0       | 20.0       | 46.7       | 53.3       | 73.3       | 46.7      | 26.7      | 53.3      | 53.3      | 86.7      | 20.0       | 6.7        | 20.0       | 13.3       | 46.7       |

### Key, merged (C major = A minor)

The key or its relative counts: the same key signature.

**Merged, real recordings** (style-balanced, 95 % interval):

| Condition                                   | default (energy, Krumhansl) | gaussian-log (energy, Krumhansl, opt-in) | presence (default live path) | live engine, profile (default) | live engine, chords vote (opt-in) |
| ------------------------------------------- | --------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------ | --------------------------------- |
| clean                                       | 60.9 [47.7–72.4]            | 59.8 [47.5–72.1]                         | 49.0 [38.9–58.0]             | 63.6 [51.1–75.8]               | 82.1 [74.4–90.2]                  |
| light hiss (pink noise, 30 dB)              | 64.1 [52.3–75.7]            | 62.2 [48.8–74.2]                         | 51.1 [40.3–61.0]             | 64.7 [52.7–76.4]               | 81.0 [72.2–89.7]                  |
| noisy room (pink noise, 20 dB)              | 61.7 [49.6–74.2]            | 59.8 [46.7–72.4]                         | 53.8 [42.2–65.0]             | 64.7 [52.7–76.4]               | 81.0 [72.2–89.7]                  |
| very noisy room (pink noise, 10 dB)         | 60.8 [48.6–73.4]            | 58.8 [47.4–71.6]                         | 57.3 [45.7–68.3]             | 64.7 [52.7–76.6]               | 81.0 [72.2–89.7]                  |
| quiet café (real bar ambience, 20 dB)       | 61.7 [49.6–74.2]            | 63.3 [50.8–75.5]                         | 53.8 [42.1–65.5]             | 64.7 [52.7–76.4]               | 82.4 [75.0–90.2]                  |
| busy bar (real bar ambience, 10 dB)         | 62.0 [49.9–74.6]            | 64.2 [51.6–76.3]                         | 52.5 [41.1–65.0]             | 63.6 [52.4–75.7]               | 84.8 [77.4–92.3]                  |
| loud bar (real bar ambience, 5 dB)          | 54.3 [41.1–67.9]            | 59.1 [45.1–72.8]                         | 44.0 [33.1–55.4]             | 61.7 [49.1–74.9]               | 82.7 [75.3–90.5]                  |
| bad microphone (phone band, clipping, hiss) | 54.1 [40.5–66.9]            | 48.2 [35.2–62.0]                         | 56.0 [45.4–67.0]             | 53.8 [39.8–66.5]               | 67.9 [55.8–79.6]                  |

**Each method minus the default (default (energy, Krumhansl)), real, paired points:**

| Condition                                   | gaussian-log (energy, Krumhansl, opt-in) | presence (default live path) | live engine, profile (default) | live engine, chords vote (opt-in) |
| ------------------------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------ | --------------------------------- |
| clean                                       | −1.1 [−14.7, +11.9]                      | −11.8 [−24.4, −0.2]          | +2.7 [−7.1, +12.8]             | +21.3 [+9.2, +34.3]               |
| light hiss (pink noise, 30 dB)              | −1.9 [−13.5, +9.0]                       | −13.0 [−26.6, +1.0]          | +0.6 [−8.0, +9.2]              | +16.9 [+6.2, +27.7]               |
| noisy room (pink noise, 20 dB)              | −1.9 [−12.4, +7.5]                       | −7.9 [−19.7, +3.3]           | +3.0 [−4.8, +10.7]             | +19.3 [+8.5, +30.3]               |
| very noisy room (pink noise, 10 dB)         | −2.0 [−12.3, +8.0]                       | −3.5 [−14.7, +7.3]           | +3.9 [−3.9, +12.8]             | +20.2 [+9.4, +31.2]               |
| quiet café (real bar ambience, 20 dB)       | +1.6 [−9.1, +11.4]                       | −7.9 [−22.1, +6.2]           | +3.0 [−4.8, +10.7]             | +20.7 [+9.8, +31.8]               |
| busy bar (real bar ambience, 10 dB)         | +2.2 [−8.5, +11.7]                       | −9.5 [−20.7, +2.2]           | +1.6 [−6.0, +8.6]              | +22.8 [+10.3, +35.0]              |
| loud bar (real bar ambience, 5 dB)          | +4.8 [−7.8, +16.1]                       | −10.3 [−23.3, +2.1]          | +7.4 [+0.6, +14.6]             | +28.5 [+16.3, +40.7]              |
| bad microphone (phone band, clipping, hiss) | −5.9 [−16.7, +5.0]                       | +1.9 [−6.5, +11.7]           | −0.3 [−3.3, +2.6]              | +13.7 [+6.0, +22.8]               |

**Merged: synthetic / real by volume / both** (both = synthetic and real averaged):

| Condition                                   | default (energy, Krumhansl) | gaussian-log (energy, Krumhansl, opt-in) | presence (default live path) | live engine, profile (default) | live engine, chords vote (opt-in) |
| ------------------------------------------- | --------------------------- | ---------------------------------------- | ---------------------------- | ------------------------------ | --------------------------------- |
| clean                                       | 97.2 / 63.5 / 79.1          | 100.0 / 62.4 / 79.9                      | 83.3 / 48.2 / 66.2           | 97.2 / 65.9 / 80.4             | 100.0 / 87.1 / 91.1               |
| light hiss (pink noise, 30 dB)              | 97.2 / 64.7 / 80.7          | 100.0 / 63.5 / 81.1                      | 80.6 / 48.2 / 65.8           | 97.2 / 67.1 / 81.0             | 100.0 / 85.9 / 90.5               |
| noisy room (pink noise, 20 dB)              | 97.2 / 63.5 / 79.5          | 100.0 / 62.4 / 79.9                      | 80.6 / 50.6 / 67.2           | 97.2 / 67.1 / 81.0             | 100.0 / 85.9 / 90.5               |
| very noisy room (pink noise, 10 dB)         | 97.2 / 60.0 / 79.0          | 100.0 / 63.5 / 79.4                      | 91.7 / 52.9 / 74.5           | 94.4 / 67.1 / 79.6             | 100.0 / 85.9 / 90.5               |
| quiet café (real bar ambience, 20 dB)       | 97.2 / 63.5 / 79.5          | 100.0 / 64.7 / 81.6                      | 83.3 / 50.6 / 68.6           | 97.2 / 67.1 / 81.0             | 100.0 / 88.2 / 91.2               |
| busy bar (real bar ambience, 10 dB)         | 97.2 / 64.7 / 79.6          | 100.0 / 68.2 / 82.1                      | 91.7 / 50.6 / 72.1           | 94.4 / 65.9 / 79.0             | 100.0 / 89.4 / 92.4               |
| loud bar (real bar ambience, 5 dB)          | 94.4 / 58.8 / 74.4          | 100.0 / 64.7 / 79.6                      | 97.2 / 44.7 / 70.6           | 91.7 / 63.5 / 76.7             | 100.0 / 89.4 / 91.4               |
| bad microphone (phone band, clipping, hiss) | 94.4 / 56.5 / 74.3          | 100.0 / 54.1 / 74.1                      | 77.8 / 50.6 / 66.9           | 91.7 / 55.3 / 72.7             | 100.0 / 68.2 / 83.9               |

**Merged by style (real) and scenario (synthetic)**, methods numbered in the order above:

| Stratum                                  | Units | clean #1 | clean #2 | clean #3 | clean #4 | clean #5 | pink-20 #1 | pink-20 #2 | pink-20 #3 | pink-20 #4 | pink-20 #5 | bar-10 #1 | bar-10 #2 | bar-10 #3 | bar-10 #4 | bar-10 #5 | bad-mic #1 | bad-mic #2 | bad-mic #3 | bad-mic #4 | bad-mic #5 |
| ---------------------------------------- | ----- | -------- | -------- | -------- | -------- | -------- | ---------- | ---------- | ---------- | ---------- | ---------- | --------- | --------- | --------- | --------- | --------- | ---------- | ---------- | ---------- | ---------- | ---------- |
| synthetic · I–V–vi–IV (major)            | 12    | 100.0    | 100.0    | 100.0    | 100.0    | 100.0    | 100.0      | 100.0      | 100.0      | 100.0      | 100.0      | 100.0     | 100.0     | 100.0     | 100.0     | 100.0     | 100.0      | 100.0      | 100.0      | 100.0      | 100.0      |
| synthetic · i–iv–V–i (harmonic minor)    | 12    | 91.7     | 100.0    | 50.0     | 91.7     | 100.0    | 91.7       | 100.0      | 41.7       | 91.7       | 100.0      | 91.7      | 100.0     | 75.0      | 83.3      | 100.0     | 83.3       | 100.0      | 33.3       | 75.0       | 100.0      |
| synthetic · i–VI–III–VII (natural minor) | 12    | 100.0    | 100.0    | 100.0    | 100.0    | 100.0    | 100.0      | 100.0      | 100.0      | 100.0      | 100.0      | 100.0     | 100.0     | 100.0     | 100.0     | 100.0     | 100.0      | 100.0      | 100.0      | 100.0      | 100.0      |
| guitarset · BN                           | 6     | 50.0     | 83.3     | 83.3     | 66.7     | 83.3     | 50.0       | 66.7       | 83.3       | 66.7       | 83.3       | 50.0      | 83.3      | 83.3      | 83.3      | 100.0     | 33.3       | 50.0       | 66.7       | 33.3       | 66.7       |
| guitarset · Funk                         | 6     | 33.3     | 16.7     | 0.0      | 33.3     | 33.3     | 50.0       | 33.3       | 16.7       | 33.3       | 33.3       | 50.0      | 33.3      | 16.7      | 33.3      | 50.0      | 50.0       | 16.7       | 50.0       | 50.0       | 50.0       |
| guitarset · Jazz                         | 6     | 33.3     | 33.3     | 0.0      | 50.0     | 66.7     | 33.3       | 33.3       | 16.7       | 50.0       | 66.7       | 33.3      | 33.3      | 33.3      | 33.3      | 50.0      | 33.3       | 33.3       | 16.7       | 33.3       | 33.3       |
| guitarset · Rock                         | 6     | 83.3     | 66.7     | 50.0     | 66.7     | 100.0    | 66.7       | 66.7       | 50.0       | 66.7       | 100.0      | 66.7      | 66.7      | 33.3      | 66.7      | 100.0     | 66.7       | 66.7       | 66.7       | 66.7       | 83.3       |
| guitarset · SS                           | 6     | 100.0    | 100.0    | 83.3     | 100.0    | 100.0    | 100.0      | 100.0      | 83.3       | 100.0      | 100.0      | 100.0     | 100.0     | 66.7      | 100.0     | 100.0     | 83.3       | 83.3       | 100.0      | 83.3       | 100.0      |
| backing · tracks                         | 5     | 67.5     | 67.5     | 40.0     | 70.0     | 90.0     | 65.0       | 67.5       | 40.0       | 70.0       | 90.0       | 67.5      | 75.0      | 40.0      | 70.0      | 92.5      | 60.0       | 67.5       | 45.0       | 57.5       | 67.5       |
| fixtures · fixtures                      | 7     | 60.0     | 53.3     | 80.0     | 60.0     | 100.0    | 66.7       | 53.3       | 80.0       | 66.7       | 93.3       | 66.7      | 60.0      | 86.7      | 60.0      | 100.0     | 53.3       | 26.7       | 46.7       | 53.3       | 73.3       |

**Major / minor references apart (strict, clean, real) and MIREX score (clean, real):**

| Method                                   | Major | Minor | MIREX |
| ---------------------------------------- | ----- | ----- | ----- |
| default (energy, Krumhansl)              | 34.8  | 42.4  | 53.0  |
| gaussian-log (energy, Krumhansl, opt-in) | 36.4  | 55.8  | 60.4  |
| presence (default live path)             | 34.8  | 30.8  | 45.4  |
| live engine, profile (default)           | 43.9  | 55.4  | 62.5  |
| live engine, chords vote (opt-in)        | 68.2  | 74.2  | 77.5  |

### Pitch (the tuner)

Each tracker as the tuner runs it, read ten times a second: share of the voiced moments where the reading is within 50 cents (RPA50). Real: GuitarSet solo lines (one string sounding); synthetic: single plucked notes.

**RPA50, real recordings** (style-balanced, 95 % interval):

| Condition                                   | default (MPM tracker) | pYIN (opt-in)    | CREPE tiny (opt-in) |
| ------------------------------------------- | --------------------- | ---------------- | ------------------- |
| clean                                       | 63.0 [58.5–66.1]      | 57.4 [52.2–61.0] | 76.9 [73.1–79.3]    |
| light hiss (pink noise, 30 dB)              | 62.5 [58.3–65.1]      | 57.6 [52.5–61.2] | 76.9 [73.2–79.2]    |
| noisy room (pink noise, 20 dB)              | 57.8 [53.9–60.5]      | 54.6 [50.1–57.5] | 75.6 [72.1–77.5]    |
| very noisy room (pink noise, 10 dB)         | 30.9 [26.9–35.2]      | 39.0 [34.4–44.7] | 67.4 [64.0–70.1]    |
| quiet café (real bar ambience, 20 dB)       | 58.7 [55.0–61.2]      | 54.8 [50.4–57.7] | 74.0 [70.8–76.1]    |
| busy bar (real bar ambience, 10 dB)         | 37.4 [33.2–42.1]      | 41.7 [37.9–45.3] | 62.0 [58.9–64.8]    |
| loud bar (real bar ambience, 5 dB)          | 18.5 [15.9–20.9]      | 25.7 [22.7–29.0] | 46.9 [42.7–51.6]    |
| bad microphone (phone band, clipping, hiss) | 73.8 [70.2–76.2]      | 63.4 [58.7–66.2] | 79.5 [76.6–81.4]    |

**Each method minus the default (default (MPM tracker)), real, paired points:**

| Condition                                   | pYIN (opt-in)       | CREPE tiny (opt-in)  |
| ------------------------------------------- | ------------------- | -------------------- |
| clean                                       | −5.6 [−7.6, −3.9]   | +13.9 [+11.7, +16.0] |
| light hiss (pink noise, 30 dB)              | −4.8 [−7.1, −2.9]   | +14.5 [+12.6, +16.2] |
| noisy room (pink noise, 20 dB)              | −3.2 [−5.5, −1.2]   | +17.8 [+15.5, +20.1] |
| very noisy room (pink noise, 10 dB)         | +8.1 [+5.5, +10.8]  | +36.5 [+32.8, +39.5] |
| quiet café (real bar ambience, 20 dB)       | −3.9 [−5.5, −2.6]   | +15.3 [+12.9, +17.4] |
| busy bar (real bar ambience, 10 dB)         | +4.4 [+1.9, +6.4]   | +24.6 [+20.6, +28.3] |
| loud bar (real bar ambience, 5 dB)          | +7.2 [+5.1, +9.2]   | +28.4 [+24.4, +32.7] |
| bad microphone (phone band, clipping, hiss) | −10.3 [−12.5, −8.2] | +5.8 [+4.0, +7.6]    |

**RPA50: synthetic / real by volume / both** (both = synthetic and real averaged):

| Condition                                   | default (MPM tracker) | pYIN (opt-in)      | CREPE tiny (opt-in) |
| ------------------------------------------- | --------------------- | ------------------ | ------------------- |
| clean                                       | 32.8 / 62.8 / 47.9    | 29.7 / 57.1 / 43.6 | 56.3 / 76.8 / 66.6  |
| light hiss (pink noise, 30 dB)              | 32.8 / 62.3 / 47.6    | 29.9 / 57.4 / 43.7 | 56.5 / 76.8 / 66.7  |
| noisy room (pink noise, 20 dB)              | 32.1 / 57.6 / 44.9    | 29.7 / 54.3 / 42.2 | 57.4 / 75.5 / 66.5  |
| very noisy room (pink noise, 10 dB)         | 20.6 / 30.9 / 25.7    | 27.1 / 39.0 / 33.1 | 52.6 / 67.4 / 60.0  |
| quiet café (real bar ambience, 20 dB)       | 32.1 / 58.5 / 45.4    | 29.7 / 54.5 / 42.2 | 55.8 / 73.9 / 64.9  |
| busy bar (real bar ambience, 10 dB)         | 23.6 / 37.3 / 30.5    | 27.9 / 41.5 / 34.8 | 49.2 / 61.8 / 55.6  |
| loud bar (real bar ambience, 5 dB)          | 12.8 / 18.5 / 15.6    | 20.7 / 25.7 / 23.2 | 40.4 / 46.8 / 43.7  |
| bad microphone (phone band, clipping, hiss) | 47.1 / 73.8 / 60.4    | 47.4 / 63.2 / 55.4 | 58.2 / 79.4 / 68.9  |

**RPA50 by style (real) and scenario (synthetic)**, methods numbered in the order above:

| Stratum                          | Units | clean #1 | clean #2 | clean #3 | pink-20 #1 | pink-20 #2 | pink-20 #3 | bar-10 #1 | bar-10 #2 | bar-10 #3 | bad-mic #1 | bad-mic #2 | bad-mic #3 |
| -------------------------------- | ----- | -------- | -------- | -------- | ---------- | ---------- | ---------- | --------- | --------- | --------- | ---------- | ---------- | ---------- |
| synthetic · single plucked notes | 6     | 32.8     | 29.7     | 56.3     | 32.1       | 29.7       | 57.4       | 23.6      | 27.9      | 49.2      | 47.1       | 47.4       | 58.2       |
| guitarset · BN                   | 4     | 62.7     | 55.9     | 78.1     | 58.4       | 54.5       | 77.1       | 37.6      | 39.8      | 60.9      | 76.0       | 63.4       | 82.4       |
| guitarset · Funk                 | 4     | 60.2     | 56.8     | 74.2     | 50.8       | 50.0       | 68.6       | 32.2      | 36.4      | 52.3      | 68.2       | 62.1       | 76.5       |
| guitarset · Jazz                 | 4     | 56.2     | 47.8     | 73.1     | 53.9       | 46.1       | 72.7       | 34.7      | 36.4      | 58.6      | 73.1       | 56.9       | 74.4       |
| guitarset · Rock                 | 4     | 67.3     | 63.1     | 78.8     | 62.3       | 61.5       | 79.6       | 45.4      | 52.3      | 70.0      | 74.6       | 68.5       | 80.0       |
| guitarset · SS                   | 4     | 68.5     | 63.5     | 80.4     | 63.5       | 60.8       | 80.0       | 36.9      | 43.8      | 68.1      | 76.9       | 66.2       | 84.2       |

**Within 10 cents / octave errors / readings on silence, real:**

| Method                | clean             | busy bar (real bar ambience, 10 dB) |
| --------------------- | ----------------- | ----------------------------------- |
| default (MPM tracker) | 51.7 / 2.4 / 28.4 | 30.8 / 2.0 / 9.3                    |
| pYIN (opt-in)         | 40.7 / 2.4 / 47.1 | 25.2 / 5.1 / 29.6                   |
| CREPE tiny (opt-in)   | 64.7 / 0.4 / 22.3 | 51.2 / 1.2 / 21.7                   |

### Noise alone (no music)

30 s of each noise at the level it would have under music played at −20 dBFS: what the detectors report when nobody plays.

| Condition                                   | Onsets / min | Chord shown %, default (1 s window) | Chord shown %, hmm + gaussian-log (opt-in) | Chord shown %, cqt + hmm (opt-in) | Tempo read                | Key read         |
| ------------------------------------------- | ------------ | ----------------------------------- | ------------------------------------------ | --------------------------------- | ------------------------- | ---------------- |
| quiet café (real bar ambience, 20 dB)       | 0            | 100.0                               | 5.7                                        | 5.7                               | 91 BPM (confidence 0.52)  | G major (69.0 %) |
| light hiss (pink noise, 30 dB)              | 0            | 100.0                               | 0.0                                        | 0.0                               | 71 BPM (confidence 0.45)  | D minor (45.0 %) |
| busy bar (real bar ambience, 10 dB)         | 4            | 100.0                               | 5.1                                        | 5.1                               | 114 BPM (confidence 0.55) | G major (69.0 %) |
| noisy room (pink noise, 20 dB)              | 0            | 100.0                               | 0.0                                        | 0.0                               | 158 BPM (confidence 0.45) | D minor (45.0 %) |
| loud bar (real bar ambience, 5 dB)          | 6            | 100.0                               | 5.1                                        | 5.1                               | 114 BPM (confidence 0.55) | G major (69.0 %) |
| very noisy room (pink noise, 10 dB)         | 0            | 100.0                               | 0.0                                        | 0.0                               | 158 BPM (confidence 0.46) | D minor (45.0 %) |
| bad microphone (phone band, clipping, hiss) | 0            | 100.0                               | 0.0                                        | 0.0                               | 136 BPM (confidence 0.63) | A minor (25.0 %) |

Durations per condition (s): clean 1388.6, bar-20 1309.3, pink-30 1472.5, bar-10 1282.4, pink-20 1451.6, bar-5 1281.8, pink-10 1473.5, bad-mic 1319.5.

<!-- bench:end -->

## 7. Limits

- **The noise is added, not acoustic:** no reverberation; no change in playing (players dig in
  harder in a loud bar); the pink noise is stationary; the bar recording may hold background
  music, which can pull the chord and key detectors towards its own harmony.
- **`bad-mic` is a model:** no measured microphone response, no automatic gain, noise
  suppression or codec. AudioLab asks the browser to switch these off, but some phones apply them
  anyway.
- **GuitarSet is one acoustic guitar, close-miked, in a quiet studio.** All six players play the
  same 30 lead sheets, so the player split holds out the playing and the recording, not the
  music.
- **References:** GuitarSet onsets come from a semi-automatic transcription of the hexaphonic
  pickup, and strings struck more than 50 ms apart count as separate events: the strummed rows
  (comp) are harsher than what a listener hears, and the bias of about −10 ms on real onsets
  (against about −1 ms on synthetic) is probably a reference convention, not a detector error.
  Chord references are lead sheets (the gap to the chords actually played is annotation noise);
  tempi are the nominal tempo of the sheet; backing-track keys and tempi come from their titles.
- **Few independent answers:** about 30 GuitarSet keys (one in three minor); 5 backing tracks,
  all minor; 4 sheets per style for the onsets.
- **Synthetic signals flatter the methods:** ideal attacks, no room, chords that change as often
  as the HMM expects.
- **Not comparable with MIREX:** chord accuracy is at display time, latency included, not the
  offline weighted chord symbol recall (WCSR) of MIREX.

## 8. Missing data

In order of value. Licences are to be checked on each source; "unsure" means not verified.

1. **Real playing in a real noisy room, annotated.** There is none. The most useful addition is
   our own: 20–30 min of guitar in a café, recorded at once by a phone, a laptop and a close
   microphone (or a DI); onsets labelled on the clean track (Audacity labels, as
   `npm run measure:onsets` reads them), chord times and the key; the same times reused for the
   phone and laptop tracks.
2. **Phone and laptop microphones.** None recorded. Microphone impulse responses: MicIRP
   (licence unsure). Rooms: OpenAIR (licence per response, often CC BY; check each), MIT IR
   Survey (Traer and McDermott 2016; licence unsure).
3. **A publishable bar noise**, so that the `bar-*` rows can be reproduced by anyone: DEMAND
   cafeteria, restaurant and station recordings (Zenodo 1227121; CC BY-SA 3.0 as far as known,
   unsure); FSD50K clips of chatter, crowd and cutlery, keeping CC0 and CC BY only; WHAM! noise
   (real cafés and restaurants) is non-commercial: private research only.
4. **Major keys outside GuitarSet.** The backing tracks are all minor. AAM (CC BY 4.0,
   annotations already in AILab): major and minor keys, chords, beats and onsets, on realistic
   synthetic mixes; its audio comes in 14.7 GB batches (single-file download unsure). FSL10K
   loops (Freesound licence per clip, keep CC0/BY); FMAK (CC licences of FMA tracks); major-key
   backing tracks bought with a licence, or recorded.
5. **Electric guitar with onsets.** GuitarSet is acoustic only. IDMT-SMT-Guitar (non-commercial,
   no-derivatives as far as known; unsure), EGDB and Guitar-TECHS (licences unsure).
6. **Tempo on produced music and on guitar with a known beat:** Ballroom (annotations CC0, audio
   rights unclear: private use), GiantSteps tempo (EDM). No beat annotations in noisy rooms
   exist; there is no beat tracker to test yet anyway.
7. **Chord times for the committed loops.** Labelling AmDmEAm, AmGFE and the six FLStudio
   renders (their times can be taken from `localSample/sample.flp`) is about an hour and would
   bring them into the real chord split.
8. **More than one annotator.** chordify-casd has four annotators per song (annotations only). In
   the meantime, GuitarSet's lead sheet against the chords played gives a measure of reference
   noise.
