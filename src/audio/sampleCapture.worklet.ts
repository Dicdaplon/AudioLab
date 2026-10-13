/**
 * AudioWorkletProcessor that forwards the first input channel to the main
 * thread, gapless, in batches of `CAPTURE_BATCH_SIZE` samples. It outputs
 * silence so it can be connected to the destination (which keeps it
 * rendering) without being audible.
 *
 * Loaded by `sampleCapture.ts` through Vite's `?worker&url` import, so it
 * is bundled as its own script in `vite build`.
 */

import { SampleBatcher } from "./sampleBatcher";

/** Registered processor name (must match `sampleCapture.ts`). */
const PROCESSOR_NAME = "sample-capture";
/** Samples per message: 2048 ≈ 43 ms at 48 kHz, ~23 messages per second. */
const CAPTURE_BATCH_SIZE = 2048;

// The AudioWorklet global scope is not part of lib.dom.
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}
declare function registerProcessor(
  name: string,
  ctor: new () => AudioWorkletProcessor & {
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
  },
): void;

class SampleCaptureProcessor extends AudioWorkletProcessor {
  private readonly batcher = new SampleBatcher(CAPTURE_BATCH_SIZE, (batch) => {
    this.port.postMessage(batch, [batch.buffer]);
  });

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    if (channel && channel.length > 0) this.batcher.push(channel);
    return true; // keep alive; outputs stay silent
  }
}

registerProcessor(PROCESSOR_NAME, SampleCaptureProcessor);
