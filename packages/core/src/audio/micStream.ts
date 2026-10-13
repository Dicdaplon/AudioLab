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
 */

import { MicrophoneError, checkMicrophoneSupport, toMicError } from "./errors";

export interface MicSource {
  context: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  /** Effective settings reported by the audio track (AGC, noise suppression, ...). */
  trackSettings: MediaTrackSettings;
  /** Stops the media tracks and closes the AudioContext (idempotent). */
  dispose(): Promise<void>;
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
 * browser's recording indicator does not stay on.
 */
export async function openMicrophone(): Promise<MicSource> {
  const unsupported = checkMicrophoneSupport();
  if (unsupported) throw new MicrophoneError(unsupported);

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
  } catch (err) {
    throw new MicrophoneError(toMicError(err), { cause: err });
  }

  let context: AudioContext | null = null;
  try {
    context = new AudioContext();
    if (context.state === "suspended") await context.resume();
    const source = context.createMediaStreamSource(stream);
    const trackSettings = stream.getAudioTracks()[0]?.getSettings?.() ?? {};

    let disposed = false;
    const ctx = context;
    const dispose = async (): Promise<void> => {
      if (disposed) return;
      disposed = true;
      stopTracks(stream);
      if (ctx.state !== "closed") await ctx.close();
    };

    return { context, stream, source, trackSettings, dispose };
  } catch (err) {
    stopTracks(stream);
    if (context && context.state !== "closed") {
      await context.close().catch(() => undefined);
    }
    throw new MicrophoneError(toMicError(err), { cause: err });
  }
}
