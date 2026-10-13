/**
 * Circular buffer holding the last N samples of a continuous stream.
 *
 * Used by the tempo analyser to keep a rolling window (e.g. 8 s) of the
 * onset-strength envelope. Appends are O(1) per sample; snapshots are O(N).
 */
export class TimeRingBuffer {
  private buffer: Float32Array;
  private writeIndex = 0;
  private filled = false;

  /** @param capacitySamples Maximum number of samples to hold. */
  constructor(capacitySamples: number) {
    if (!(capacitySamples > 0)) {
      throw new Error("capacitySamples must be > 0");
    }
    this.buffer = new Float32Array(Math.floor(capacitySamples));
  }

  get capacity(): number {
    return this.buffer.length;
  }

  /** Number of samples currently stored (equals capacity once wrapped). */
  get size(): number {
    return this.filled ? this.buffer.length : this.writeIndex;
  }

  /** True once the buffer has wrapped at least once. */
  get isFull(): boolean {
    return this.filled;
  }

  /**
   * Append one sample or an array of samples, overwriting the oldest ones
   * when full. Pushing more than `capacity` samples at once keeps only the
   * newest `capacity` of them (the rest would be overwritten immediately).
   */
  push(sample: number): void;
  push(samples: ArrayLike<number>): void;
  push(samples: number | ArrayLike<number>): void {
    if (typeof samples === "number") {
      this.writeOne(samples);
      return;
    }
    const cap = this.buffer.length;
    const start = samples.length > cap ? samples.length - cap : 0;
    for (let i = start; i < samples.length; i++) this.writeOne(samples[i]);
  }

  private writeOne(v: number): void {
    this.buffer[this.writeIndex] = v;
    this.writeIndex += 1;
    if (this.writeIndex >= this.buffer.length) {
      this.writeIndex = 0;
      this.filled = true;
    }
  }

  /**
   * The last `count` samples, newest first. Positions beyond the number of
   * stored samples are zero (the buffer never re-reads newer samples as
   * older ones, even when `count` exceeds `capacity`).
   */
  lastSamples(count: number): Float32Array {
    const out = new Float32Array(Math.max(0, Math.floor(count)));
    const n = Math.min(out.length, this.size);
    const len = this.buffer.length;
    for (let i = 0; i < n; i++) {
      let idx = this.writeIndex - 1 - i;
      if (idx < 0) idx += len;
      out[i] = this.buffer[idx];
    }
    return out;
  }

  /**
   * The last `count` samples in chronological order (oldest first). The
   * output is left-padded with zeros when fewer samples are stored.
   */
  lastSamplesChronological(count: number): Float32Array {
    const outLen = Math.max(0, Math.floor(count));
    const out = new Float32Array(outLen);
    const n = Math.min(outLen, this.size);
    if (n === 0) return out;
    const len = this.buffer.length;
    const dest = outLen - n; // leading zeros when n < outLen
    // Oldest requested sample sits n positions before the write index.
    let src = this.writeIndex - n;
    if (src < 0) src += len;
    const firstChunk = Math.min(n, len - src);
    out.set(this.buffer.subarray(src, src + firstChunk), dest);
    if (firstChunk < n) {
      out.set(this.buffer.subarray(0, n - firstChunk), dest + firstChunk);
    }
    return out;
  }

  /**
   * The last `durationSeconds` of signal in chronological order.
   * @param durationSeconds Duration to extract.
   * @param sampleRate Rate of the stored signal, in Hz.
   */
  lastSeconds(durationSeconds: number, sampleRate: number): Float32Array {
    return this.lastSamplesChronological(Math.round(durationSeconds * sampleRate));
  }

  /** Clear the buffer. */
  reset(): void {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.filled = false;
  }
}
