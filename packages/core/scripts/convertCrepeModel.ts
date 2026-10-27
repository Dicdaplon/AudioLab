/**
 * Converts the TF.js export of CREPE tiny (github.com/marl/crepe, gh-pages
 * branch, `model/`: model.json + group*-shard*; MIT, © 2018 Jong Wook Kim)
 * into the compact file read by `loadCrepeModel` (format in
 * src/analysis/crepe.ts, `parseCrepeModel`).
 *
 *   npx tsx scripts/convertCrepeModel.ts <tfjs model dir> [out file] [--float32]
 *
 * Default output: apps/lab/public/models/crepe-tiny/crepe-tiny.bin, float16
 * (half the size; the script checks that the float16 activations stay
 * within a hair of the float32 ones on test tones).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CREPE_FRAME,
  crepeActivations,
  decodeCrepeActivations,
  parseCrepeModel,
} from "../src/analysis/crepe";

interface Manifest {
  weightsManifest: {
    paths: string[];
    weights: { name: string; shape: number[]; dtype: string }[];
  }[];
}

/** float → IEEE 754 half, round to nearest even. */
function floatToHalf(value: number): number {
  const f32 = new Float32Array(1);
  const u32 = new Uint32Array(f32.buffer);
  f32[0] = value;
  const x = u32[0];
  const sign = (x >>> 16) & 0x8000;
  const exp = (x >>> 23) & 0xff;
  let mant = x & 0x7fffff;
  if (exp === 0xff) return sign | 0x7c00 | (mant ? 0x200 : 0);
  const e = exp - 127 + 15;
  if (e >= 0x1f) return sign | 0x7c00;
  if (e <= 0) {
    if (e < -10) return sign;
    mant |= 0x800000;
    const shift = 14 - e;
    let half = mant >>> shift;
    const rest = mant & ((1 << shift) - 1);
    const mid = 1 << (shift - 1);
    if (rest > mid || (rest === mid && half & 1)) half++;
    return sign | half;
  }
  let half = (e << 10) | (mant >>> 13);
  const rest = mant & 0x1fff;
  if (rest > 0x1000 || (rest === 0x1000 && half & 1)) half++; // a carry rounds up the exponent
  return sign | half;
}

function encode(
  tensors: { name: string; shape: number[]; data: Float32Array }[],
  dtype: "float16" | "float32",
): Uint8Array {
  let offset = 0;
  const entries = tensors.map((t) => {
    const e = { name: t.name, shape: t.shape, offset };
    offset += t.data.length;
    return e;
  });
  const header = new TextEncoder().encode(
    JSON.stringify({
      format: "audiolab-crepe",
      version: 1,
      model: "crepe-tiny",
      source: "github.com/marl/crepe (MIT, (c) 2018 Jong Wook Kim)",
      dtype,
      tensors: entries,
    }),
  );
  const dataStart = Math.ceil((8 + header.length) / 4) * 4;
  const width = dtype === "float16" ? 2 : 4;
  const out = new Uint8Array(dataStart + offset * width);
  const view = new DataView(out.buffer);
  out.set(new TextEncoder().encode("CREP"), 0);
  view.setUint32(4, header.length, true);
  out.set(header, 8);
  let p = dataStart;
  for (const t of tensors) {
    for (let i = 0; i < t.data.length; i++) {
      if (width === 2) view.setUint16(p, floatToHalf(t.data[i]), true);
      else view.setFloat32(p, t.data[i], true);
      p += width;
    }
  }
  return out;
}

function main(): void {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const float32 = process.argv.includes("--float32");
  const dir = args[0];
  if (!dir) {
    console.error("usage: convertCrepeModel.ts <tfjs model dir> [out file] [--float32]");
    process.exit(1);
  }
  const here = path.dirname(fileURLToPath(import.meta.url));
  const out =
    args[1] ?? path.resolve(here, "../../../apps/lab/public/models/crepe-tiny/crepe-tiny.bin");

  const manifest = JSON.parse(readFileSync(path.join(dir, "model.json"), "utf8")) as Manifest;
  const tensors: { name: string; shape: number[]; data: Float32Array }[] = [];
  for (const group of manifest.weightsManifest) {
    const buf = Buffer.concat(group.paths.map((p) => readFileSync(path.join(dir, p))));
    const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    let off = 0;
    for (const w of group.weights) {
      if (w.dtype !== "float32") throw new Error(`${w.name}: unsupported dtype ${w.dtype}`);
      const n = w.shape.reduce((a, b) => a * b, 1);
      tensors.push({ name: w.name, shape: w.shape, data: all.slice(off, off + n) });
      off += n;
    }
  }
  tensors.sort((a, b) => a.name.localeCompare(b.name));

  const bytes = encode(tensors, float32 ? "float32" : "float16");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, bytes);
  console.log(`${out}: ${bytes.length} bytes, ${tensors.length} tensors`);

  // Check: the written file against the float32 weights on a few tones.
  const toBuffer = (u: Uint8Array) =>
    u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
  const reference = parseCrepeModel(toBuffer(encode(tensors, "float32")));
  const written = parseCrepeModel(toBuffer(bytes));
  let worst = 0;
  let worstCents = 0;
  for (const f of [82.41, 110, 196, 220, 329.63, 440, 659.25, 987.77]) {
    const frame = Float32Array.from(
      { length: CREPE_FRAME },
      (_, i) =>
        0.3 * Math.sin((2 * Math.PI * f * i) / 16000) +
        0.1 * Math.sin((4 * Math.PI * f * i) / 16000 + 0.4),
    );
    const a = crepeActivations(reference, frame);
    const b = crepeActivations(written, frame);
    for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
    const fa = decodeCrepeActivations(a).frequency;
    const fb = decodeCrepeActivations(b).frequency;
    worstCents = Math.max(worstCents, Math.abs(1200 * Math.log2(fb / fa)));
    console.log(
      `${f} Hz: ${fb.toFixed(2)} Hz, confidence ${decodeCrepeActivations(b).confidence.toFixed(3)}`,
    );
  }
  console.log(
    `max activation difference vs float32: ${worst.toExponential(2)}, max pitch difference ${worstCents.toFixed(3)} cents`,
  );
}

main();
