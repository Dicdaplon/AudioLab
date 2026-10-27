/**
 * Spotify Basic Pitch (Bittner et al., ICASSP 2022), inference only, POC.
 *
 * Runs the official ONNX export (spotify/basic-pitch, Apache-2.0,
 * basic_pitch/saved_models/icassp_2022/nmp.onnx) with onnxruntime-node on CPU.
 * Neither is a repo dependency: both live in a scratch folder loaded through
 * createRequire (override with BASIC_PITCH_DIR, containing node_modules/ and
 * dl/nmp.onnx). See poc/notes/basicpitch.md.
 *
 * Frame convention: frame n is centred at t = n * 256 / 22050 s (≈ 86.13 fps),
 * frame 0 centred on the first sample, like librosa's centred frames.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODEL_SR = 22050;
const HOP = 256;
/** Model input: 2 s minus one hop = 43844 samples -> 172 centred frames. */
const WIN = MODEL_SR * 2 - HOP;
const WIN_FRAMES = 172;
const KEYS = 88;
/** Frames dropped at each window edge (basic-pitch drops 30 / 2). */
const EDGE = 15;
/**
 * Window hop. basic-pitch hops 43844 - 30*256 samples (141.27 frames, not an
 * integer, so its stitched frames drift); a whole 142 frames keeps every
 * stitched frame on the n * 256 grid.
 */
const KEEP = 142;
const HOP_WIN = KEEP * HOP;
const BATCH = 8;
const CACHE_VERSION = "bp-onnx-v2";

const DEFAULT_DIR =
  "C:/Users/chafi/AppData/Local/Temp/claude/c--Users-chafi-Documents-Dev-AudioLab/01b1f915-a549-4cb4-88a4-72fa5fdd2798/scratchpad/basicpitch";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(HERE, "..", ".cache", "basicpitch");

export interface BasicPitchOutput {
  /** Frames per second (22050 / 256). */
  fps: number;
  /** Per frame, 88 note posteriors, index 0 = MIDI 21 (A0). */
  notes: Float32Array[];
  /** Per frame, 88 onset posteriors, same layout. */
  onsets: Float32Array[];
}

// Minimal structural typing of the onnxruntime-node surface used here.
interface OrtTensor {
  readonly data: unknown;
  readonly dims: readonly number[];
}
interface OrtSession {
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
}
interface Ort {
  Tensor: new (type: "float32", data: Float32Array, dims: readonly number[]) => OrtTensor;
  InferenceSession: { create(path: string, opts?: Record<string, unknown>): Promise<OrtSession> };
}

let session: Promise<{ ort: Ort; s: OrtSession }> | undefined;

function load(): Promise<{ ort: Ort; s: OrtSession }> {
  if (!session) {
    const dir = process.env.BASIC_PITCH_DIR ?? DEFAULT_DIR;
    const req = createRequire(path.join(dir, "package.json"));
    const ort = req("onnxruntime-node") as Ort;
    session = ort.InferenceSession.create(path.join(dir, "dl", "nmp.onnx"), {
      executionProviders: ["cpu"],
    }).then((s) => ({ ort, s }));
  }
  return session;
}

/** Windowed-sinc (Blackman, 32 zero crossings) resampler with anti-alias low-pass, tabulated kernel. */
export function resample(x: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return x;
  const ratio = to / from;
  const cutoff = Math.min(1, ratio) * 0.97; // relative to the input Nyquist
  const half = Math.ceil(32 / cutoff);
  const OS = 512; // kernel table points per input sample
  const table = new Float32Array(half * OS + 2);
  for (let i = 0; i < table.length; i++) {
    const d = i / OS;
    const u = d * cutoff;
    const sinc = u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
    const p = (d / half + 1) / 2; // 0.5..1 across the symmetric window
    const w =
      p >= 1 ? 0 : 0.42 - 0.5 * Math.cos(2 * Math.PI * p) + 0.08 * Math.cos(4 * Math.PI * p);
    table[i] = cutoff * sinc * w;
  }
  const n = Math.floor(x.length * ratio);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / ratio;
    const c = Math.floor(t);
    let acc = 0;
    let wsum = 0;
    const k0 = Math.max(0, c - half + 1);
    const k1 = Math.min(x.length - 1, c + half);
    for (let k = k0; k <= k1; k++) {
      const pos = Math.abs(t - k) * OS;
      const ip = Math.floor(pos);
      if (ip >= table.length - 1) continue;
      const fr = pos - ip;
      const h = table[ip] + fr * (table[ip + 1] - table[ip]);
      acc += x[k] * h;
      wsum += h;
    }
    y[i] = wsum > 0 ? acc / wsum : 0;
  }
  return y;
}

function cacheKey(samples: Float32Array, sampleRate: number): string {
  const h = createHash("sha1");
  h.update(`${CACHE_VERSION}:${sampleRate}:`);
  h.update(new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength));
  return h.digest("hex");
}

function split(flat: Float32Array, frames: number): Float32Array[] {
  const out: Float32Array[] = [];
  for (let f = 0; f < frames; f++) out.push(flat.slice(f * KEYS, (f + 1) * KEYS));
  return out;
}

export async function basicPitchNotes(
  samples: Float32Array,
  sampleRate: number,
): Promise<BasicPitchOutput> {
  const fps = MODEL_SR / HOP;
  const file = path.join(CACHE_DIR, `${cacheKey(samples, sampleRate)}.bin`);
  if (existsSync(file)) {
    const buf = readFileSync(file);
    const all = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const frames = all[0];
    return {
      fps,
      notes: split(all.subarray(1, 1 + frames * KEYS), frames),
      onsets: split(all.subarray(1 + frames * KEYS), frames),
    };
  }

  const { ort, s } = await load();
  const x = resample(samples, sampleRate, MODEL_SR);
  const frames = Math.floor(x.length / HOP) + 1;
  const nWin = Math.max(1, Math.ceil(frames / KEEP));
  // Lead pad so that kept frame EDGE of window 0 is centred on sample 0.
  const lead = EDGE * HOP;
  const note = new Float32Array(frames * KEYS);
  const onset = new Float32Array(frames * KEYS);

  for (let w0 = 0; w0 < nWin; w0 += BATCH) {
    const nb = Math.min(BATCH, nWin - w0);
    const input = new Float32Array(nb * WIN);
    for (let b = 0; b < nb; b++) {
      const start = (w0 + b) * HOP_WIN - lead; // in x's sample index
      for (let i = 0; i < WIN; i++) {
        const j = start + i;
        if (j >= 0 && j < x.length) input[b * WIN + i] = x[j];
      }
    }
    const r = await s.run({
      "serving_default_input_2:0": new ort.Tensor("float32", input, [nb, WIN, 1]),
    });
    // Output order per basic-pitch inference.py: :1 note, :2 onset, :0 contour.
    const nOut = r["StatefulPartitionedCall:1"].data as Float32Array;
    const oOut = r["StatefulPartitionedCall:2"].data as Float32Array;
    for (let b = 0; b < nb; b++) {
      for (let j = 0; j < KEEP; j++) {
        const f = (w0 + b) * KEEP + j;
        if (f >= frames) break;
        const src = (b * WIN_FRAMES + EDGE + j) * KEYS;
        note.set(nOut.subarray(src, src + KEYS), f * KEYS);
        onset.set(oOut.subarray(src, src + KEYS), f * KEYS);
      }
    }
  }

  mkdirSync(CACHE_DIR, { recursive: true });
  const all = new Float32Array(1 + 2 * frames * KEYS);
  all[0] = frames;
  all.set(note, 1);
  all.set(onset, 1 + frames * KEYS);
  writeFileSync(file, new Uint8Array(all.buffer));
  return { fps, notes: split(note, frames), onsets: split(onset, frames) };
}
