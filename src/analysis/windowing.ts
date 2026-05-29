/**
 * Sliding-window aggregator for chroma vectors.
 *
 * We don't keep raw audio — we keep the last N chroma frames computed at the
 * analysis cadence (e.g. one every 100 ms → 80 frames for an 8 s window). The
 * aggregate is the element-wise mean, then L1-renormalized.
 *
 * The window length can be reconfigured at runtime via `resize()`, which is
 * useful when the UI exposes the window size as a slider.
 */

import { CHROMA_SIZE, l1Normalize } from "./chroma";

export interface ChromaWindowOptions {
  /** Window length in seconds. */
  windowSeconds: number;
  /** Analysis cadence in Hz (frames per second). */
  framesPerSecond: number;
}

export class ChromaWindow {
  private capacity: number;
  private buffer: Float32Array[] = [];
  private head = 0;
  private filled = 0;

  constructor(options: ChromaWindowOptions) {
    const { windowSeconds, framesPerSecond } = options;
    if (windowSeconds <= 0 || framesPerSecond <= 0) {
      throw new Error("windowSeconds and framesPerSecond must be > 0");
    }
    this.capacity = Math.max(1, Math.round(windowSeconds * framesPerSecond));
  }

  /** Number of frames currently held in the window. */
  get size(): number {
    return this.filled;
  }

  /** Maximum number of frames the window keeps. */
  get maxSize(): number {
    return this.capacity;
  }

  /**
   * Change the window capacity in-place, preserving the most recent frames
   * (and dropping oldest if the new capacity is smaller).
   */
  resize(options: ChromaWindowOptions): void {
    const { windowSeconds, framesPerSecond } = options;
    if (windowSeconds <= 0 || framesPerSecond <= 0) {
      throw new Error("windowSeconds and framesPerSecond must be > 0");
    }
    const newCapacity = Math.max(1, Math.round(windowSeconds * framesPerSecond));
    if (newCapacity === this.capacity) return;

    // Reconstruct the linear order of currently held frames (oldest → newest).
    const ordered = this.snapshotOrdered();
    const keepCount = Math.min(ordered.length, newCapacity);
    const kept = ordered.slice(ordered.length - keepCount);

    this.capacity = newCapacity;
    this.buffer = [];
    this.head = 0;
    this.filled = 0;
    for (const frame of kept) this.push(frame);
  }

  /** Append a new chroma frame, discarding the oldest if the window is full. */
  push(chroma: ArrayLike<number>): void {
    if (chroma.length !== CHROMA_SIZE) {
      throw new Error(`expected chroma of length ${CHROMA_SIZE}, got ${chroma.length}`);
    }
    const copy = new Float32Array(CHROMA_SIZE);
    for (let i = 0; i < CHROMA_SIZE; i++) copy[i] = chroma[i];
    this.buffer[this.head] = copy;
    this.head = (this.head + 1) % this.capacity;
    if (this.filled < this.capacity) this.filled++;
  }

  /** Element-wise mean of the held frames, L1-normalized. Zero vector if empty. */
  aggregate(): Float32Array {
    const out = new Float32Array(CHROMA_SIZE);
    if (this.filled === 0) return out;
    for (let i = 0; i < this.filled; i++) {
      const frame = this.buffer[i];
      for (let j = 0; j < CHROMA_SIZE; j++) out[j] += frame[j];
    }
    for (let j = 0; j < CHROMA_SIZE; j++) out[j] /= this.filled;
    return l1Normalize(out);
  }

  /**
   * Element-wise mean WITHOUT L1 normalization — useful when the bins
   * represent counts/indicators and the absolute scale carries meaning
   * (e.g. presence frequencies in [0, 1]).
   */
  aggregateRaw(): Float32Array {
    const out = new Float32Array(CHROMA_SIZE);
    if (this.filled === 0) return out;
    for (let i = 0; i < this.filled; i++) {
      const frame = this.buffer[i];
      for (let j = 0; j < CHROMA_SIZE; j++) out[j] += frame[j];
    }
    for (let j = 0; j < CHROMA_SIZE; j++) out[j] /= this.filled;
    return out;
  }

  /** Drop all held frames. */
  reset(): void {
    this.buffer.length = 0;
    this.head = 0;
    this.filled = 0;
  }

  /** Return frames in oldest → newest order. */
  private snapshotOrdered(): Float32Array[] {
    const out: Float32Array[] = [];
    if (this.filled === 0) return out;
    if (this.filled < this.capacity) {
      // Buffer was filled from index 0 onwards, in order.
      for (let i = 0; i < this.filled; i++) out.push(this.buffer[i]);
      return out;
    }
    // Buffer is full; oldest is at `head`, walk around.
    for (let i = 0; i < this.capacity; i++) {
      out.push(this.buffer[(this.head + i) % this.capacity]);
    }
    return out;
  }
}
