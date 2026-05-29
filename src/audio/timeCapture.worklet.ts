/**
 * AudioWorkletProcessor for continuous time-domain audio capture.
 *
 * This processor runs on the audio thread and sends audio data to the main
 * thread via MessagePort. It is connected in parallel to the AnalyserNode
 * and does not modify the signal.
 *
 * The worklet receives audio in blocks (typically 128 samples) and forwards
 * them to the main thread. The main thread assembles these blocks into a
 * sliding time buffer.
 */

declare class AudioWorkletProcessor {
  port: MessagePort;
}

declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void;

/**
 * TimeCaptureProcessor: forwards all audio to the main thread.
 */
class TimeCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  /**
   * Process one block of audio.
   * @param inputs  Array of input arrays (one per input channel). Each contains 128 samples.
   * @return Whether the processor should stay alive.
   */
  process(inputs: Float32Array[][]): boolean {
    const input = inputs[0];
    if (input && input.length > 0) {
      const samples = input[0];
      // Post the audio block to the main thread.
      this.port.postMessage({
        type: "audioBlock",
        data: samples.slice(), // Copy the samples.
      });
    }
    return true; // Keep processing.
  }
}

registerProcessor("time-capture", TimeCaptureProcessor);
