/**
 * Sliding-window aggregator for chroma vectors.
 *
 * We don't keep raw audio — we keep the last N chroma frames computed at the
 * analysis cadence (e.g. one every 100 ms → 80 frames for an 8 s window). The
 * aggregate is the element-wise mean, then L1-renormalized.
 *
 * Because every instantaneous chroma is itself L1-normalised (it sums to 1),
 * the mean gives each frame the same weight whatever its loudness: the
 * window is level-invariant, not energy-weighted. A fortissimo frame and a
 * frame of microphone hiss contribute equally; only exactly-silent frames
 * (all-zero chroma) contribute nothing to the ranking.
 *
 * The window length can be reconfigured at runtime via `resize()`, which is
 * useful when the UI exposes the window size as a slider.
 *
 * The element-wise sum is maintained incrementally (add the new frame,
 * subtract the evicted one) so `aggregate()` is O(12) instead of O(N·12).
 * It is recomputed from scratch each time the ring wraps, which bounds the
 * floating-point drift of the running sum.
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
  private sum = new Float64Array(CHROMA_SIZE);

  constructor(options: ChromaWindowOptions) {
    this.capacity = ChromaWindow.capacityFor(options);
  }

  private static capacityFor({ windowSeconds, framesPerSecond }: ChromaWindowOptions): number {
    if (!(windowSeconds > 0) || !(framesPerSecond > 0)) {
      throw new Error("windowSeconds and framesPerSecond must be > 0");
    }
    return Math.max(1, Math.round(windowSeconds * framesPerSecond));
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
    const newCapacity = ChromaWindow.capacityFor(options);
    if (newCapacity === this.capacity) return;

    const ordered = this.snapshotOrdered();
    const kept = ordered.slice(Math.max(0, ordered.length - newCapacity));

    this.capacity = newCapacity;
    this.reset();
    for (const frame of kept) this.push(frame);
  }

  /** Append a new chroma frame, discarding the oldest if the window is full. */
  push(chroma: ArrayLike<number>): void {
    if (chroma.length !== CHROMA_SIZE) {
      throw new Error(`expected chroma of length ${CHROMA_SIZE}, got ${chroma.length}`);
    }
    const copy = new Float32Array(CHROMA_SIZE);
    for (let i = 0; i < CHROMA_SIZE; i++) copy[i] = chroma[i];

    if (this.filled === this.capacity) {
      const evicted = this.buffer[this.head];
      for (let i = 0; i < CHROMA_SIZE; i++) this.sum[i] -= evicted[i];
    } else {
      this.filled++;
    }
    for (let i = 0; i < CHROMA_SIZE; i++) this.sum[i] += copy[i];
    this.buffer[this.head] = copy;
    this.head = (this.head + 1) % this.capacity;
    if (this.head === 0) this.recomputeSum();
  }

  /** Element-wise mean of the held frames, L1-normalized. Zero vector if empty. */
  aggregate(): Float32Array {
    return l1Normalize(this.aggregateRaw());
  }

  /**
   * Element-wise mean WITHOUT L1 normalization — useful when the bins
   * represent counts/indicators and the absolute scale carries meaning
   * (e.g. presence frequencies in [0, 1]).
   */
  aggregateRaw(): Float32Array {
    const out = new Float32Array(CHROMA_SIZE);
    if (this.filled === 0) return out;
    for (let j = 0; j < CHROMA_SIZE; j++) out[j] = this.sum[j] / this.filled;
    return out;
  }

  /** Drop all held frames. */
  reset(): void {
    this.buffer.length = 0;
    this.head = 0;
    this.filled = 0;
    this.sum.fill(0);
  }

  private recomputeSum(): void {
    this.sum.fill(0);
    for (let i = 0; i < this.filled; i++) {
      const frame = this.buffer[i];
      for (let j = 0; j < CHROMA_SIZE; j++) this.sum[j] += frame[j];
    }
  }

  /** Return frames in oldest → newest order. */
  private snapshotOrdered(): Float32Array[] {
    const out: Float32Array[] = [];
    if (this.filled === 0) return out;
    if (this.filled < this.capacity) {
      for (let i = 0; i < this.filled; i++) out.push(this.buffer[i]);
      return out;
    }
    for (let i = 0; i < this.capacity; i++) {
      out.push(this.buffer[(this.head + i) % this.capacity]);
    }
    return out;
  }
}
