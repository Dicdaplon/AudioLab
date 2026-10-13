/**
 * AnalyserNode setup and polling.
 *
 * A 16384-point FFT gives a bin spacing of sampleRate / 16384 (≈ 2.9 Hz at
 * 48 kHz). The AnalyserNode applies a Blackman window whose main lobe spans
 * about ±3 bins (±9 Hz), so adjacent semitones are only cleanly separated
 * from roughly A3 (220 Hz, semitone spacing 13 Hz) upwards; below ~150 Hz a
 * single note leaks into the neighbouring pitch classes. Smoothing is
 * disabled because we average ourselves across the sliding windows.
 */

export interface AnalyserSetup {
  analyser: AnalyserNode;
  /** Effective sample rate of the AudioContext. */
  sampleRate: number;
  /** Pre-allocated buffer to receive getFloatFrequencyData (dB) output. */
  dbBuffer: Float32Array<ArrayBuffer>;
}

export interface AnalyserOptions {
  fftSize?: number;
  /** AnalyserNode internal smoothing constant. 0 = no smoothing. */
  smoothingTimeConstant?: number;
  /**
   * `minDecibels` / `maxDecibels` only define the mapping used by
   * `getByteFrequencyData`. The float API used here returns the raw
   * 20·log10 magnitudes (silence reads -Infinity), so these two values do
   * not clamp anything in this project; they are exposed for completeness.
   */
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
