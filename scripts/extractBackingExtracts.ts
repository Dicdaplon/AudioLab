/**
 * Extract 3 × 30 s excerpts from each backing track in `localSample/` and
 * save them as mono 16-bit PCM WAV files under `tests/Sample/Backing/`.
 *
 * Naming convention :
 *   <name>.mp3        →  <name>_a.wav, <name>_b.wav, <name>_c.wav
 *
 * Extracts are taken at 30 %, 50 %, 70 % of the total duration (so all three
 * sit roughly in the middle of the track, without overlapping).
 *
 * Usage:  npm run extract:backing
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import decode from "audio-decode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const LOCAL_SAMPLE_DIR = path.join(PROJECT_ROOT, "localSample");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "tests", "Sample", "Backing");

const EXTRACT_DURATION_SEC = 30;
const EXTRACT_POSITIONS = [0.3, 0.5, 0.7] as const;
const EXTRACT_LABELS = ["a", "b", "c"] as const;

const BACKING_FILES = ["BackingBm1.mp3", "BackingDm1.mp3"];

/** Mix down all channels to a single mono Float32 stream. */
function toMono(audio: {
  numberOfChannels: number;
  length: number;
  getChannelData(ch: number): Float32Array;
}): Float32Array {
  const mono = new Float32Array(audio.length);
  for (let ch = 0; ch < audio.numberOfChannels; ch++) {
    const data = audio.getChannelData(ch);
    for (let i = 0; i < audio.length; i++) {
      mono[i] += data[i] / audio.numberOfChannels;
    }
  }
  return mono;
}

/** Encode a mono Float32 sample stream into a 16-bit PCM WAV buffer. */
function encodeWav(samples: Float32Array, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * blockAlign;
  const headerSize = 44;
  const buf = Buffer.alloc(headerSize + dataSize);

  let off = 0;
  buf.write("RIFF", off); off += 4;
  buf.writeUInt32LE(headerSize + dataSize - 8, off); off += 4;
  buf.write("WAVE", off); off += 4;
  buf.write("fmt ", off); off += 4;
  buf.writeUInt32LE(16, off); off += 4;            // PCM subchunk size
  buf.writeUInt16LE(1, off); off += 2;             // PCM format
  buf.writeUInt16LE(numChannels, off); off += 2;
  buf.writeUInt32LE(sampleRate, off); off += 4;
  buf.writeUInt32LE(byteRate, off); off += 4;
  buf.writeUInt16LE(blockAlign, off); off += 2;
  buf.writeUInt16LE(bitsPerSample, off); off += 2;
  buf.write("data", off); off += 4;
  buf.writeUInt32LE(dataSize, off); off += 4;

  for (let i = 0; i < samples.length; i++) {
    const clipped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clipped * 32767), off);
    off += 2;
  }
  return buf;
}

(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const filename of BACKING_FILES) {
    const inputPath = path.join(LOCAL_SAMPLE_DIR, filename);
    process.stdout.write(`Loading ${filename}... `);

    const fileBuf = await readFile(inputPath);
    const u8 = new Uint8Array(fileBuf.buffer, fileBuf.byteOffset, fileBuf.byteLength);
    const audio = await decode(u8);
    const durationSec = audio.length / audio.sampleRate;
    console.log(
      `${durationSec.toFixed(1)}s @ ${audio.sampleRate} Hz, ${audio.numberOfChannels}ch`,
    );

    const mono = toMono(audio);
    const extractSamples = Math.round(EXTRACT_DURATION_SEC * audio.sampleRate);
    const baseName = filename.replace(/\.mp3$/i, "");

    for (let i = 0; i < EXTRACT_POSITIONS.length; i++) {
      const startSec = durationSec * EXTRACT_POSITIONS[i];
      const startSample = Math.floor(startSec * audio.sampleRate);
      const endSample = Math.min(startSample + extractSamples, mono.length);
      const slice = mono.slice(startSample, endSample);
      const outName = `${baseName}_${EXTRACT_LABELS[i]}.wav`;
      const outPath = path.join(OUTPUT_DIR, outName);
      const wav = encodeWav(slice, audio.sampleRate);
      await writeFile(outPath, wav);
      const actualSec = slice.length / audio.sampleRate;
      console.log(
        `  → ${outName}  (start=${startSec.toFixed(1)}s, length=${actualSec.toFixed(1)}s, ${(wav.length / 1024 / 1024).toFixed(1)} MB)`,
      );
    }
  }

  console.log("\nDone.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
