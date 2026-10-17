/**
 * Accumulates fixed-size audio blocks (128-sample render quanta) into
 * larger batches so the audio thread posts a few messages per second
 * instead of several hundred. Pure, shared by the worklet and its tests.
 *
 * Optionally tracks where each batch starts in a stream clock: give
 * `push` the frame of each block (in the worklet, `currentFrame`) and
 * `emit` receives the frame of the batch's first sample. A block that does
 * not follow the previous one (the input was disconnected for a while)
 * flushes the batch first, so a batch never spans a gap and its start
 * frame stays exact.
 */
export class SampleBatcher {
  private batch: Float32Array;
  private fill = 0;
  private batchStart = 0;
  private nextFrame: number | null = null;

  /**
   * @param batchSize Samples per emitted batch.
   * @param emit Receives a fresh Float32Array each time (safe to transfer)
   *   and the stream frame of its first sample (counted from the first
   *   push when `push` is given no frames).
   */
  constructor(
    private readonly batchSize: number,
    private readonly emit: (batch: Float32Array, startFrame: number) => void,
  ) {
    if (!(batchSize >= 1)) throw new Error("batchSize must be ≥ 1");
    this.batch = new Float32Array(batchSize);
  }

  /**
   * Append a block; emits every time `batchSize` samples are complete.
   * `frame` is the stream frame of `block[0]`; omitted, the block follows
   * the previous one.
   */
  push(block: ArrayLike<number>, frame?: number): void {
    if (frame !== undefined && this.nextFrame !== null && frame !== this.nextFrame) this.flush();
    let position = frame ?? this.nextFrame ?? 0;
    let offset = 0;
    while (offset < block.length) {
      if (this.fill === 0) this.batchStart = position;
      const room = this.batchSize - this.fill;
      const take = Math.min(room, block.length - offset);
      for (let i = 0; i < take; i++) this.batch[this.fill + i] = block[offset + i];
      this.fill += take;
      offset += take;
      position += take;
      if (this.fill === this.batchSize) this.flush();
    }
    this.nextFrame = position;
  }

  /** Emit whatever is accumulated (possibly a short batch), if anything. */
  flush(): void {
    if (this.fill === 0) return;
    const out = this.fill === this.batchSize ? this.batch : this.batch.slice(0, this.fill);
    this.batch = new Float32Array(this.batchSize);
    this.fill = 0;
    this.emit(out, this.batchStart);
  }
}
