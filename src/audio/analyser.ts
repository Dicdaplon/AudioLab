/**
 * AnalyserNode setup and polling.
 *
 * We use a large FFT (16384) to get ~3 Hz bin resolution at 48 kHz, which is
 * enough to resolve adjacent semitones in the low-mid register where most
 * tonal content lives. Smoothing is disabled because we average ourselves
 * across the sliding window.
 */

export type AudioBlockCallback = (samples: Float32Array) => void;

export interface AnalyserSetup {
  analyser: AnalyserNode;
  /** Effective sample rate of the AudioContext. */
  sampleRate: number;
  /** Pre-allocated buffer to receive getFloatFrequencyData (dB) output. */
  dbBuffer: any;
  /** Callback for time-domain audio blocks (if time capture is active). */
  audioBlockCallback?: AudioBlockCallback;
}

export interface AnalyserOptions {
  fftSize?: number;
  /** AnalyserNode internal smoothing constant. 0 = no smoothing. */
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

export function createAnalyser(
  context: AudioContext,
  source: AudioNode,
  options: AnalyserOptions = {},
): AnalyserSetup {
  const {
    fftSize = 16384,
    smoothingTimeConstant = 0,
    minDecibels = -100,
    maxDecibels = -10,
  } = options;

  const analyser = context.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothingTimeConstant;
  analyser.minDecibels = minDecibels;
  analyser.maxDecibels = maxDecibels;

  source.connect(analyser);

  return {
    analyser,
    sampleRate: context.sampleRate,
    dbBuffer: new Float32Array(analyser.frequencyBinCount),
  };
}

/** Read the latest dB spectrum into the pre-allocated buffer. */
export function readSpectrumDb(setup: AnalyserSetup): Float32Array {
  // `getFloatFrequencyData` requires a Float32Array backed by an ArrayBuffer
  // (not a SharedArrayBuffer). The buffer above is constructed accordingly.
  setup.analyser.getFloatFrequencyData(setup.dbBuffer);
  return setup.dbBuffer;
}

/**
 * Start time-domain audio capture via an AudioWorkletNode.
 * The worklet must be registered before calling this.
 *
 * @param setup AnalyserSetup (must have an analyser source connected).
 * @param callback Function called with each audio block.
 */
export async function startTimeCapture(
  setup: AnalyserSetup,
  callback: AudioBlockCallback,
): Promise<void> {
  const context = setup.analyser.context;

  // Load and register the worklet code.
  try {
    await context.audioWorklet.addModule(
      new URL("./timeCapture.worklet.ts", import.meta.url),
    );
  } catch (err) {
    throw new Error(
      `Failed to load time capture worklet: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Create the worklet node.
  const workletNode = new AudioWorkletNode(context, "time-capture");

  // Set up message handler.
  workletNode.port.onmessage = (event) => {
    if (event.data.type === "audioBlock" && Array.isArray(event.data.data)) {
      callback(new Float32Array(event.data.data));
    }
  };

  // Connect the worklet in parallel (it doesn't modify audio).
  // It should be connected to the same source as the analyser.
  const analyserSource = setup.analyser;
  analyserSource.disconnect(setup.analyser);
  analyserSource.connect(workletNode);
  analyserSource.connect(setup.analyser);

  // Store callback and node for cleanup later.
  setup.audioBlockCallback = callback;

  // Activate the message port (required in some browsers).
  workletNode.port.start?.();
}

/**
 * Stop time-domain audio capture.
 */
export function stopTimeCapture(setup: AnalyserSetup): void {
  setup.audioBlockCallback = undefined;
}
