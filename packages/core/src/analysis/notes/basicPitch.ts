/**
 * Spotify Basic Pitch (Bittner et al., ICASSP 2022), everything but the
 * neural network: the SDK stays free of dependencies, so the model runs
 * behind a `NoteModelRunner` that any runtime can implement (onnxruntime-web
 * in the browser, onnxruntime-node in scripts, a fake in tests).
 *
 * The model reads 43 844 samples at 22050 Hz (2 s minus one hop) and returns
 * 172 frames (hop 256, ~86 fps), each with 88 note posteriors (index 0 =
 * MIDI 21, A0) and 88 onset posteriors, between 0 and 1. Frame n is centred
 * on sample n × 256 of the window. The first and last 15 frames see the
 * window edge and are less reliable: basic-pitch drops them when it stitches
 * windows, and so does `transcribeNotes`. In live use, a frame therefore
 * needs 15 frames of audio after it: a look-ahead of 15 × 256 / 22050 ≈ 174 ms.
 *
 * Stitching differs from basic-pitch in one detail: windows hop a whole 142
 * frames (36 352 samples) instead of 141.27, so every stitched frame sits on
 * the n × 256 grid (no drift), and 15 frames of lead padding put the first
 * kept frame on sample 0.
 *
 * Model and weights: Apache-2.0, Copyright 2022 Spotify AB
 * (github.com/spotify/basic-pitch, basic_pitch/saved_models/icassp_2022/nmp.onnx).
 *
 * Reference:
 *   Bittner, R. M., Bosch, J. J., Rubinstein, D., Meseguer-Brocal, G. &
 *   Ewert, S. (2022). A lightweight instrument-agnostic model for polyphonic
 *   note transcription and multipitch estimation. ICASSP.
 */

import { resampleAudio } from "./resample";

/** The shapes the Basic Pitch model was trained with. */
export const BASIC_PITCH = {
  /** Model input rate, Hz. */
  sampleRate: 22_050,
  /** Samples between frames. */
  hop: 256,
  /** Samples per model window (2 s minus one hop). */
  windowSamples: 43_844,
  /** Frames per model window (1 + ⌊43844 / 256⌋). */
  windowFrames: 172,
  /** Notes per frame. */
  keys: 88,
  /** MIDI note of key 0 (A0). */
  lowestMidi: 21,
  /** Frames dropped at each window edge. */
  edgeFrames: 15,
} as const;

/** Frames per second of the model output (22050 / 256 ≈ 86.13). */
export const BASIC_PITCH_FPS = BASIC_PITCH.sampleRate / BASIC_PITCH.hop;

/** Audio a frame needs after it to be as reliable as offline: ~174 ms. */
export const BASIC_PITCH_LOOKAHEAD_SECONDS =
  (BASIC_PITCH.edgeFrames * BASIC_PITCH.hop) / BASIC_PITCH.sampleRate;

/** What a note model returns for one window: one row of 88 posteriors per frame. */
export interface NoteModelOutput {
  /** Per frame, the probability that each key sounds (index 0 = MIDI 21). */
  notes: Float32Array[];
  /** Per frame, the probability that each key starts. */
  onsets: Float32Array[];
}

/**
 * Runs the network on one window of `BASIC_PITCH.windowSamples` mono samples
 * at 22050 Hz and resolves with its `windowFrames` frames. Implementations
 * own the runtime (and may run it in a worker); the SDK never calls `run`
 * again before the previous call settled.
 */
export interface NoteModelRunner {
  run(window: Float32Array): Promise<NoteModelOutput>;
}

/** Note and onset posteriors of a whole signal, frame n centred at n / fps seconds. */
export interface NoteActivations {
  fps: number;
  notes: Float32Array[];
  onsets: Float32Array[];
}

/** Throws unless the output has `windowFrames` rows of `keys` values in both matrices. */
export function checkNoteModelOutput(output: NoteModelOutput): void {
  const { windowFrames, keys } = BASIC_PITCH;
  for (const name of ["notes", "onsets"] as const) {
    const rows = output[name];
    if (!Array.isArray(rows) || rows.length !== windowFrames) {
      throw new Error(`note model: expected ${windowFrames} ${name} frames, got ${rows?.length}`);
    }
    for (const row of rows) {
      if (row.length !== keys) {
        throw new Error(`note model: expected ${keys} ${name} per frame, got ${row.length}`);
      }
    }
  }
}

/**
 * Note and onset posteriors of a whole recording: resampled to 22050 Hz,
 * cut into overlapping model windows, the 15 edge frames of each dropped,
 * the rest stitched end to end. The runner is called once per window, in
 * order. Frame count: ⌊samples at 22050 Hz / 256⌋ + 1.
 */
export async function transcribeNotes(
  samples: Float32Array,
  sampleRate: number,
  runner: NoteModelRunner,
): Promise<NoteActivations> {
  const { hop, windowSamples, windowFrames, edgeFrames } = BASIC_PITCH;
  const keep = windowFrames - 2 * edgeFrames; // 142
  const x = resampleAudio(samples, sampleRate, BASIC_PITCH.sampleRate);
  const frames = Math.floor(x.length / hop) + 1;
  const windows = Math.max(1, Math.ceil(frames / keep));
  const lead = edgeFrames * hop;
  const notes: Float32Array[] = [];
  const onsets: Float32Array[] = [];
  for (let w = 0; w < windows; w++) {
    const start = w * keep * hop - lead; // index in x of the window's first sample
    const input = new Float32Array(windowSamples);
    const from = Math.max(0, start);
    const to = Math.min(x.length, start + windowSamples);
    if (to > from) input.set(x.subarray(from, to), from - start);
    const out = await runner.run(input);
    checkNoteModelOutput(out);
    for (let j = 0; j < keep && notes.length < frames; j++) {
      notes.push(Float32Array.from(out.notes[edgeFrames + j]));
      onsets.push(Float32Array.from(out.onsets[edgeFrames + j]));
    }
  }
  return { fps: BASIC_PITCH_FPS, notes, onsets };
}
