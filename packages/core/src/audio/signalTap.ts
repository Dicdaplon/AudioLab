/**
 * Display tap: a small AnalyserNode of its own, read on every animation
 * frame by visuals (oscilloscope, spectrum bars) with no engine behind it.
 *
 * The tonality analyser is 16384 points with no smoothing, tuned for chroma
 * at 10 Hz; reading it at 60 Hz would cost a 16384-point FFT per frame and
 * look jittery. The tap defaults to 2048 points with the browser's own
 * smoothing, which is what a display wants. Readers pass pre-allocated
 * buffers, so a frame allocates nothing.
 */

import { createAnalyser } from "./analyser";

export interface SignalTapOptions {
  /** AnalyserNode FFT size (power of two, 32 to 32768). Default 2048. */
  fftSize?: number;
  /** AnalyserNode smoothing of the magnitude spectrum, in [0, 1). Default 0.8. */
  smoothingTimeConstant?: number;
}

export interface SignalTap {
  /** Width of one frequency bin, in Hz. */
  readonly binHz: number;
  /** Number of time-domain samples per read (= fftSize). */
  readonly size: number;
  /** Number of frequency bins per read (= fftSize / 2). */
  readonly bins: number;
  readonly sampleRate: number;
  /** Copy the latest `size` samples into `out` (its first `size` entries). */
  readTimeDomain(out: Float32Array<ArrayBuffer>): void;
  /** Copy the latest dB spectrum into `out` (its first `bins` entries; silence is -Infinity). */
  readFrequencyDb(out: Float32Array<ArrayBuffer>): void;
  /** Disconnect the tap from the source. Idempotent. */
  stop(): void;
}

/** Put a display tap on `source`. The source keeps feeding its other consumers. */
export function startSignalTap(
  context: AudioContext,
  source: AudioNode,
  options: SignalTapOptions = {},
): SignalTap {
  const { fftSize = 2048, smoothingTimeConstant = 0.8 } = options;
  const { analyser } = createAnalyser(context, source, { fftSize, smoothingTimeConstant });
  let stopped = false;
  return {
    binHz: context.sampleRate / fftSize,
    size: fftSize,
    bins: fftSize / 2,
    sampleRate: context.sampleRate,
    readTimeDomain(out) {
      analyser.getFloatTimeDomainData(out);
    },
    readFrequencyDb(out) {
      analyser.getFloatFrequencyData(out);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        source.disconnect(analyser);
      } catch {
        // Already disconnected (context closed or source disposed).
      }
    },
  };
}
