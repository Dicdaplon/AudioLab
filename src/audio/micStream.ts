/**
 * Microphone capture: returns an AudioContext, the MediaStream, and the
 * source node ready to be connected to an AnalyserNode.
 *
 * The browser will prompt the user the first time. Disabling AGC / noise
 * suppression / echo cancellation is important: these all distort the
 * spectrum and would skew chroma estimates.
 */

export interface MicSource {
  context: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  /** Stops the media tracks and closes the AudioContext. */
  dispose(): Promise<void>;
}

export async function openMicrophone(): Promise<MicSource> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia is not available in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
    },
    video: false,
  });

  const context = new AudioContext();
  // Some browsers start the context suspended until a user gesture.
  if (context.state === "suspended") {
    await context.resume();
  }
  const source = context.createMediaStreamSource(stream);

  const dispose = async (): Promise<void> => {
    for (const track of stream.getTracks()) track.stop();
    if (context.state !== "closed") await context.close();
  };

  return { context, stream, source, dispose };
}
