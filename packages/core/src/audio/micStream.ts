/**
 * Microphone capture: returns an AudioContext, the MediaStream, and the
 * source node ready to be connected to analysis nodes.
 *
 * The browser prompts the user the first time. Disabling AGC, noise
 * suppression and echo cancellation matters: all three reshape the spectrum
 * and would skew the chroma estimates. These are *ideal* constraints: a
 * device that cannot honour them keeps its processing on silently, which is
 * why the effective track settings are exposed on the returned object.
 *
 * `openMicrophone` must be called from a user gesture (click): some
 * browsers keep a fresh AudioContext suspended until then, and `resume()`
 * would otherwise never settle.
 *
 * A host that already runs an AudioContext (Tone.js, a synth, a player) can
 * pass it in: the SDK then never creates one of its own and never closes
 * the host's. The same goes for a MediaStream the host acquired itself.
 */

import { MicrophoneError, checkMicrophoneSupport, toMicError } from "./errors";

export interface MicSource {
  context: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  /** Effective settings reported by the audio track (AGC, noise suppression, ...). */
  trackSettings: MediaTrackSettings;
  /** True when `openMicrophone` created the context (and `dispose()` closes it). */
  ownsContext: boolean;
  /** True when `openMicrophone` acquired the stream (and `dispose()` stops its tracks). */
  ownsStream: boolean;
  /**
   * Disconnects the source node, stops the media tracks the SDK acquired
   * and closes the AudioContext the SDK created. A caller-provided context
   * or stream is left untouched. Idempotent.
   */
  dispose(): Promise<void>;
}

export interface OpenMicrophoneOptions {
  /**
   * An AudioContext owned by the host (for Tone.js: `Tone.getContext().rawContext`).
   * It is resumed if suspended, never closed by the SDK.
   */
  context?: AudioContext;
  /** A MediaStream the host already acquired. Its tracks are never stopped by the SDK. */
  stream?: MediaStream;
  /** Constraints for `getUserMedia` when the SDK acquires the stream. Default `MIC_CONSTRAINTS`. */
  constraints?: MediaStreamConstraints;
}

export const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  },
  video: false,
};

function stopTracks(stream: MediaStream): void {
  for (const track of stream.getTracks()) track.stop();
}

/**
 * Open the microphone. Throws a `MicrophoneError` with a stable `code`
 * and a user-facing message on any failure. If something fails after the
 * stream was acquired, the tracks are stopped and the context closed so the
 * browser's recording indicator does not stay on — but only for the stream
 * and context the SDK created itself.
 */
export async function openMicrophone(options: OpenMicrophoneOptions = {}): Promise<MicSource> {
  const ownsStream = !options.stream;
  const ownsContext = !options.context;

  // With both a stream and a context supplied, nothing needs the globals.
  if (ownsStream || ownsContext) {
    const unsupported = checkMicrophoneSupport();
    if (unsupported) throw new MicrophoneError(unsupported);
  }

  let stream: MediaStream;
  if (options.stream) {
    stream = options.stream;
  } else {
    try {
      stream = await navigator.mediaDevices.getUserMedia(options.constraints ?? MIC_CONSTRAINTS);
    } catch (err) {
      throw new MicrophoneError(toMicError(err), { cause: err });
    }
  }

  let context: AudioContext | null = null;
  try {
    context = options.context ?? new AudioContext();
    if (context.state === "suspended") await context.resume();
    const source = context.createMediaStreamSource(stream);
    const trackSettings = stream.getAudioTracks()[0]?.getSettings?.() ?? {};

    let disposed = false;
    const ctx = context;
    const dispose = async (): Promise<void> => {
      if (disposed) return;
      disposed = true;
      try {
        source.disconnect();
      } catch {
        // Already disconnected (context closed by the host).
      }
      if (ownsStream) stopTracks(stream);
      if (ownsContext && ctx.state !== "closed") await ctx.close();
    };

    return { context, stream, source, trackSettings, ownsContext, ownsStream, dispose };
  } catch (err) {
    if (ownsStream) stopTracks(stream);
    if (ownsContext && context && context.state !== "closed") {
      await context.close().catch(() => undefined);
    }
    throw new MicrophoneError(toMicError(err), { cause: err });
  }
}
