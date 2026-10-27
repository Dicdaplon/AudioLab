# Basic Pitch (Spotify, ICASSP 2022) — inference POC

`poc/methods/basicPitch.ts` → `basicPitchNotes(samples, sampleRate)` returns per-frame
note and onset posteriors (88 keys, index 0 = MIDI 21) at 22050 / 256 ≈ 86.13 fps.

## How it was run

- Model: the official ONNX export `basic_pitch/saved_models/icassp_2022/nmp.onnx` from
  github.com/spotify/basic-pitch (main), sha256 `2c3c1d14…c059a0ec`, **230 KB**
  (input `[batch, 43844, 1]`, outputs `[batch, 172, 88]` note / onset and `[batch, 172, 264]` contour).
- Runtime: `onnxruntime-node` 1.31.1, CPU provider, Node 24 on Windows. The prebuilt win-x64 binary
  ships in the npm package, so the skipped postinstall did not matter. ~294 MB on disk.
- Neither is a repo dependency: both sit in the session scratchpad (`.../scratchpad/basicpitch/`,
  `node_modules/` + `dl/nmp.onnx`) and are loaded with `createRequire`; point `BASIC_PITCH_DIR`
  at another folder with the same layout to move them.
- Output mapping copied from basic-pitch `inference.py`: `StatefulPartitionedCall:1` = note,
  `:2` = onset, `:0` = contour.
- Resampling to 22050 Hz: windowed sinc (Blackman, 32 zero crossings, cutoff at 0.97 × the new Nyquist).
- Windowing: 43844-sample windows (2 s − 1 hop); 15 frames dropped at each edge, as basic-pitch does
  (it uses 30 overlapping frames). Unlike basic-pitch, the window hop is a whole **142 frames** (36352 samples),
  not 141.27, so stitched frames do not drift; 15 frames of lead padding put kept frame 0 on sample 0.
- Cache: `poc/.cache/basicpitch/<sha1 of samples + rate>.bin` (frame count, then notes, then onsets
  as float32). The folder is not in `.gitignore` yet (only `bench/.cache/` is).

## Licence

Code and weights: Apache-2.0, "Copyright 2022 Spotify AB" (LICENSE in the spotify/basic-pitch repo;
the weights are in the same repo). onnxruntime: MIT.

## Timing convention and latency

- Frame `n` is centred at `t = n · 256 / 22050` s (centred CQT frames: 43844 samples give
  1 + ⌊43844 / 256⌋ = 172 frames). Measured on GuitarSet, the onset-posterior peak sits on average
  −0.25 frames (−3 ms) from the annotated onset, so no correction is needed.
- Streaming: the model works on whole 2 s windows. To keep the same quality as offline, a frame needs its
  15 frames of right context, so the **look-ahead is 15 × 256 / 22050 ≈ 174 ms**. Add the time between
  window runs (e.g. a window every 100 ms → up to 274 ms) and the inference time (at most ~35 ms per window here: 0.67 s for 20 windows, session load included).
  Using frames nearer the window edge cuts the latency but the edge frames are less reliable (not measured).

## Speed (this laptop, CPU)

32 s clip at 44.1 kHz: **1.22 s on the first run (≈ 38 ms per second of audio)**, of which ~0.55 s is the
JS resampler and ~0.67 s session load + inference (batches of 8 windows). From cache: 7 ms.

## Sanity check — GuitarSet `00_Rock1-90-C#_solo_mic.wav` vs its JAMS `note_midi` (178 notes)

| measure (frame lag 0)                                                       | result |
| --------------------------------------------------------------------------- | ------ |
| reference notes with the pitch's note posterior > 0.5 on at least one frame | 97.8 % |
| … on the majority of the note's frames                                      | 94.4 % |
| reference notes with onset posterior > 0.5 within ±2 frames of the onset    | 91.0 % |
| active key-frames (> 0.5) not in the reference                              | 7.7 %  |

Shifting the posteriors by ±4 frames drops the onset hit rate to 74 % / 48 %, which confirms the alignment.
Script: `scratchpad/bpcheck.mts` (not in the repo), run with `npx tsx` from `packages/core`.
