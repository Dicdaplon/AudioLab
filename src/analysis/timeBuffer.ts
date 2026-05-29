/**
 * Circular time-domain audio buffer: capture and extract fixed-length time windows
 * from a continuous audio stream.
 *
 * Used in Section 2 to maintain a rolling 8-second window of audio samples,
 * from which we extract spectral envelopes for temporal analysis.
 */

/**
 * Circular ring buffer that holds the last N audio samples.
 * Provides efficient O(1) append and O(N) snapshot extraction.
 */
export class TimeRingBuffer {
  private buffer: Float32Array;
  private writeIndex = 0;
  private filled = false;

  /**
   * @param capacitySamples Maximum number of samples to hold.
   */
  constructor(capacitySamples: number) {
    if (capacitySamples <= 0) {
      throw new Error("capacitySamples must be > 0");
    }
    this.buffer = new Float32Array(capacitySamples);
  }

  get capacity(): number {
    return this.buffer.length;
  }

  /**
   * Total number of samples currently stored.
   * Once filled, this equals capacity.
   */
  get size(): number {
    return this.filled ? this.buffer.length : this.writeIndex;
  }

  /**
   * Check if the buffer has cycled at least once (fully filled).
   */
  get isFull(): boolean {
    return this.filled;
  }

  /**
   * Append a new sample (or array of samples).
   * If the buffer is full, the oldest sample(s) are overwritten.
   */
  push(sample: number): void;
  push(samples: ArrayLike<number>): void;
  push(samples: number | ArrayLike<number>): void {
    if (typeof samples === "number") {
      this.buffer[this.writeIndex] = samples;
      this.writeIndex += 1;
      if (this.writeIndex >= this.buffer.length) {
        this.writeIndex = 0;
        this.filled = true;
      }
    } else {
      for (let i = 0; i < samples.length; i++) {
        this.buffer[this.writeIndex] = samples[i];
        this.writeIndex += 1;
        if (this.writeIndex >= this.buffer.length) {
          this.writeIndex = 0;
          this.filled = true;
        }
      }
    }
  }

  /**
   * Extract the last N samples (most recent first).
   * @param count Number of samples to extract. If greater than size, pad with zeros.
   * @return Array of samples, newest first.
   */
  lastSamples(count: number): Float32Array {
    const out = new Float32Array(count);
    const n = this.size;

    if (n === 0) {
      // Empty buffer: return zeros.
      return out;
    }

    // Read backwards from writeIndex (which points to the next write position).
    for (let i = 0; i < count; i++) {
      let idx = this.writeIndex - 1 - i;
      if (idx < 0) idx += this.buffer.length;
      out[i] = this.buffer[idx];
    }

    return out;
  }

  /**
   * Extract the last N seconds of audio (in chronological order).
   * @param durationSeconds Duration to extract.
   * @param sampleRate Sample rate in Hz.
   * @return Samples in chronological order (oldest first).
   */
  lastSeconds(durationSeconds: number, sampleRate: number): Float32Array {
    const count = Math.round(durationSeconds * sampleRate);
    const samples = this.lastSamples(count);

    // Reverse to get chronological order (oldest first).
    const reversed = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      reversed[i] = samples[samples.length - 1 - i];
    }

    return reversed;
  }

  /**
   * Clear the buffer.
   */
  reset(): void {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.filled = false;
  }
}
