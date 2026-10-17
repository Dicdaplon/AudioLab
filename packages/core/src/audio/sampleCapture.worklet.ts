/**
 * AudioWorkletProcessor that forwards the first input channel to the main
 * thread, gapless, in batches of `batchSize` samples (processor option,
 * default 2048), each tagged with the AudioContext frame of its first
 * sample. It outputs silence so it can be connected to the destination
 * (which keeps it rendering) without being audible.
 *
 * Message: `{ samples: Float32Array, startFrame: number }`, the samples'
 * buffer transferred. The frame lets the main thread timestamp what it
 * receives exactly, however late the message arrives.
 *
 * `scripts/buildWorklet.ts` bundles this file (with its imports) into the
 * string exported by `sampleCaptureWorklet.source.ts`; `sampleCapture.ts`
 * loads that string through a Blob URL, so the processor needs no separate
 * asset whatever bundler the consumer uses.
 */

import { SampleBatcher } from "./sampleBatcher";

/**
 * Registered processor name (must match `sampleCapture.ts`). Versioned:
 * the message format is internal, and two builds of the library on one
 * page must not register different processors under one name.
 */
const PROCESSOR_NAME = "audiolab-sample-capture-2";
/** Default samples per message: 2048 ≈ 43 ms at 48 kHz, ~23 messages per second. */
const DEFAULT_BATCH_SIZE = 2048;

// The AudioWorklet global scope is not part of lib.dom.
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: { processorOptions?: unknown });
}
declare function registerProcessor(
  name: string,
  ctor: new (options?: { processorOptions?: unknown }) => AudioWorkletProcessor & {
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
  },
): void;
/** Frame of the render quantum being processed (AudioWorkletGlobalScope). */
declare const currentFrame: number | undefined;

class SampleCaptureProcessor extends AudioWorkletProcessor {
  private readonly batcher: SampleBatcher;

  constructor(options?: { processorOptions?: unknown }) {
    super(options);
    const requested = (options?.processorOptions as { batchSize?: unknown } | undefined)?.batchSize;
    const batchSize =
      typeof requested === "number" && requested >= 128
        ? Math.round(requested)
        : DEFAULT_BATCH_SIZE;
    this.batcher = new SampleBatcher(batchSize, (samples, startFrame) => {
      this.port.postMessage({ samples, startFrame }, [samples.buffer]);
    });
  }

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0];
    if (channel && channel.length > 0) {
      this.batcher.push(channel, typeof currentFrame === "number" ? currentFrame : undefined);
    }
    return true; // keep alive; outputs stay silent
  }
}

registerProcessor(PROCESSOR_NAME, SampleCaptureProcessor);
