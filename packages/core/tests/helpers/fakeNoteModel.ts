/**
 * A stand-in for the Basic Pitch network: frame n "hears" whatever
 * `hear(sample)` says about the window sample it is centred on (n × 256).
 * Lets the windowing, stitching, timing and chord decoding be tested
 * without a model or a runtime.
 */
import { BASIC_PITCH, type NoteModelOutput, type NoteModelRunner } from "../../src/analysis/notes";

/** MIDI notes → a row of 88 posteriors. */
export function keyRow(midis: readonly number[], value = 0.9): Float32Array {
  const row = new Float32Array(BASIC_PITCH.keys);
  for (const m of midis) row[m - BASIC_PITCH.lowestMidi] = value;
  return row;
}

export interface FakeNoteModel extends NoteModelRunner {
  calls: Float32Array[];
}

export function fakeNoteModel(
  hear: (sample: number, frame: number) => Float32Array,
  onsets: (sample: number, frame: number) => Float32Array = () =>
    new Float32Array(BASIC_PITCH.keys),
): FakeNoteModel {
  const calls: Float32Array[] = [];
  return {
    calls,
    run(window: Float32Array): Promise<NoteModelOutput> {
      calls.push(window);
      const notes: Float32Array[] = [];
      const ons: Float32Array[] = [];
      for (let n = 0; n < BASIC_PITCH.windowFrames; n++) {
        const s = window[n * BASIC_PITCH.hop] ?? 0;
        notes.push(hear(s, n));
        ons.push(onsets(s, n));
      }
      return Promise.resolve({ notes, onsets: ons });
    },
  };
}

/** Silence → nothing; positive → C major (C3 bass); negative → A minor (A2 bass). */
export const C_OR_AM = (s: number): Float32Array =>
  Math.abs(s) < 0.05 ? keyRow([]) : s > 0 ? keyRow([48, 60, 64, 67]) : keyRow([45, 57, 60, 64]);
