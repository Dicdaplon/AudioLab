/** Pure helpers turning recent chroma frames into a note candidate. */

import { CHROMA_SIZE } from "@audiolab/core";

export interface DominantNote {
  /** Pitch class 0..11. */
  pc: number;
  /** Mean chroma energy of that pitch class. */
  energy: number;
}

/** Appends `frame` to `history`, keeping the last `size` well-formed frames. */
export function pushChromaFrame(
  history: readonly Float32Array[],
  frame: Float32Array,
  size: number,
): readonly Float32Array[] {
  if (frame.length !== CHROMA_SIZE) return history;
  return [...history, frame].slice(-size);
}

/**
 * Strongest pitch class of the averaged frames, or `null` for no frames or
 * silence.
 */
export function dominantNote(frames: readonly Float32Array[]): DominantNote | null {
  if (frames.length === 0) return null;
  let best: DominantNote | null = null;
  for (let pc = 0; pc < CHROMA_SIZE; pc++) {
    let sum = 0;
    for (const f of frames) sum += f[pc];
    const energy = sum / frames.length;
    if (energy > 0 && (best === null || energy > best.energy)) best = { pc, energy };
  }
  return best;
}
