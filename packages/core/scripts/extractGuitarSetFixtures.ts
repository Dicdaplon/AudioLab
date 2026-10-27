/**
 * Cut the GuitarSet fixtures of the sample suite: the first 12 s of four
 * accompaniment excerpts (microphone recording), mono 16-bit WAV, with their
 * lead-sheet chords and key as JSON, into tests/Sample/GuitarSet/.
 *
 *   npm run extract:guitarset -w packages/core -- --guitarset <dir>
 *
 * GuitarSet is CC BY 4.0 (Xi, Bittner, Pauwels, Ye, Bello, ISMIR 2018):
 * the attribution travels in tests/Sample/GuitarSet/README.md.
 */
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decodeAudioFile } from "../src/offline/decodeAudio";

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "tests",
  "Sample",
  "GuitarSet",
);
const SECONDS = 12;

/** Test-split players (03–05), four styles, three major keys and a minor one. */
export const FIXTURES = [
  "03_Rock3-148-C_comp",
  "04_SS3-98-C_comp",
  "05_Funk3-98-A_comp",
  "03_Jazz2-187-F#_comp",
] as const;

function wav(samples: Float32Array, sampleRate: number): Buffer {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((x, i) =>
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x)) * 32767), 44 + 2 * i),
  );
  return buf;
}

async function main(): Promise<void> {
  const i = process.argv.indexOf("--guitarset");
  const dir = path.resolve(
    i >= 0 ? process.argv[i + 1] : "../../../AILab/datasets/public/guitarset",
  );
  await mkdir(OUT, { recursive: true });
  for (const id of FIXTURES) {
    const jams = JSON.parse(
      readFileSync(path.join(dir, "annotations", "jams", `${id}.jams`), "utf8"),
    ) as {
      annotations: {
        namespace: string;
        data: { time: number; duration: number; value: unknown }[];
      }[];
    };
    const chords = jams.annotations
      .filter((a) => a.namespace === "chord")[0]
      .data.filter((d) => d.time < SECONDS)
      .map((d) => ({
        start: Math.round(d.time * 1000) / 1000,
        end: Math.round(Math.min(SECONDS, d.time + d.duration) * 1000) / 1000,
        label: String(d.value),
      }));
    const key = String(jams.annotations.find((a) => a.namespace === "key_mode")!.data[0].value);
    const audio = await decodeAudioFile(path.join(dir, "audio", `${id}_mic.wav`));
    const cut = audio.samples.subarray(0, SECONDS * audio.sampleRate);
    await writeFile(path.join(OUT, `${id}.wav`), wav(cut, audio.sampleRate));
    await writeFile(
      path.join(OUT, `${id}.json`),
      JSON.stringify(
        {
          source: `GuitarSet 1.1.0, ${id} (audio_mono-mic), 0–${SECONDS} s`,
          license: "CC BY 4.0",
          key,
          chords,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`${id}: ${chords.length} chords, key ${key}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
