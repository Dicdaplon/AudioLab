/**
 * Accumulates fixed-size audio blocks (128-sample render quanta) into
 * larger batches so the audio thread posts a few messages per second
 * instead of several hundred. Pure, shared by the worklet and its tests.
 */
export class SampleBatcher {
  private batch: Float32Array;
  private fill = 0;

  /**
   * @param batchSize Samples per emitted batch.
   * @param emit Receives a fresh Float32Array each time (safe to transfer).
   */
  constructor(
    private readonly batchSize: number,
    private readonly emit: (batch: Float32Array) => void,
  ) {
    if (!(batchSize >= 1)) throw new Error("batchSize must be ≥ 1");
    this.batch = new Float32Array(batchSize);
  }

  /** Append a block; emits every time `batchSize` samples are complete. */
  push(block: ArrayLike<number>): void {
    let offset = 0;
    while (offset < block.length) {
      const room = this.batchSize - this.fill;
      const take = Math.min(room, block.length - offset);
      for (let i = 0; i < take; i++) this.batch[this.fill + i] = block[offset + i];
      this.fill += take;
      offset += take;
      if (this.fill === this.batchSize) this.flush();
    }
  }

  /** Emit whatever is accumulated (possibly a short batch), if anything. */
  flush(): void {
    if (this.fill === 0) return;
    const out = this.fill === this.batchSize ? this.batch : this.batch.slice(0, this.fill);
    this.batch = new Float32Array(this.batchSize);
    this.fill = 0;
    this.emit(out);
  }
}
