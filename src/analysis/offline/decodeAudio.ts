/**
 * Node-side audio file decoding for the offline pipeline (tests, scripts).
 * Not imported by the browser bundle.
 */

import { readFile } from "node:fs/promises";
import decode from "audio-decode";

export interface DecodedAudio {
  /** Mono Float32 signal (channels averaged). */
  samples: Float32Array;
  sampleRate: number;
  durationSeconds: number;
}

/** Decode an audio file (mp3/wav/flac/ogg) to mono Float32 samples. */
export async function decodeAudioFile(path: string): Promise<DecodedAudio> {
  const buf = await readFile(path);
  // `audio-decode` accepts any ArrayBuffer view; pass a Uint8Array.
  const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const audioBuffer = await decode(u8);
  const length = audioBuffer.length;
  const channels = audioBuffer.numberOfChannels;
  const mono = new Float32Array(length);
  for (let ch = 0; ch < channels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels;
  }
  return {
    samples: mono,
    sampleRate: audioBuffer.sampleRate,
    durationSeconds: length / audioBuffer.sampleRate,
  };
}
