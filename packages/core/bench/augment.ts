/**
 * Noise conditions of the benchmark: what a guitar sounds like through a
 * noisy room or a poor microphone. Every condition is deterministic: the
 * same (item, condition) always gives the same samples.
 *
 *   clean          the signal as it is
 *   pink-<snr>     pink noise (equal energy per octave, like room hiss and
 *                  traffic) mixed <snr> dB under the signal
 *   bar-<snr>      a real café/bar ambience recording (voices, cutlery,
 *                  maybe some background music), a fixed excerpt per item
 *                  mixed <snr> dB under the signal; local only
 *                  (localSample/, not in git): skipped when absent
 *   bad-mic        a phone-like chain: room hiss at 25 dB, a 300 Hz–3.4 kHz
 *                  band (4th-order Butterworth each side), then hard
 *                  clipping of the loudest 0.5 % of the samples
 *
 * The SNR compares the active part of the signal (50 ms frames within 30 dB
 * of its loudest) with the noise, both measured in the 50 Hz–5.5 kHz band
 * the analysers listen to (the noise is mixed unfiltered).
 *
 * Seeds come from the item and the noise family, not the level: pink-30,
 * pink-20 and pink-10 add the same noise at three gains, bar-20/10/5 the
 * same excerpt, so the levels compare pairwise.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decodeAudioFile } from "../src/offline/decodeAudio";
import { mulberry32 } from "../tests/helpers/synth";
import { seedFor } from "./seeds";

export interface Condition {
  id: string;
  /** Plain-words label for the report. */
  label: string;
  kind: "clean" | "pink" | "bar" | "bad-mic";
  snrDb?: number;
}

export const CONDITIONS: readonly Condition[] = [
  { id: "clean", label: "clean", kind: "clean" },
  { id: "pink-30", label: "light hiss (pink noise, 30 dB)", kind: "pink", snrDb: 30 },
  { id: "pink-20", label: "noisy room (pink noise, 20 dB)", kind: "pink", snrDb: 20 },
  { id: "pink-10", label: "very noisy room (pink noise, 10 dB)", kind: "pink", snrDb: 10 },
  { id: "bar-20", label: "quiet café (real bar ambience, 20 dB)", kind: "bar", snrDb: 20 },
  { id: "bar-10", label: "busy bar (real bar ambience, 10 dB)", kind: "bar", snrDb: 10 },
  { id: "bar-5", label: "loud bar (real bar ambience, 5 dB)", kind: "bar", snrDb: 5 },
  { id: "bad-mic", label: "bad microphone (phone band, clipping, hiss)", kind: "bad-mic" },
];

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const BAR_NOISE_FILE = path.join(
  REPO_ROOT,
  "localSample",
  "Sons dAmbiance - Bar Café #1.mp3",
);

let barCache: { samples: Float32Array; sampleRate: number } | null | undefined;
const barResampled = new Map<number, Float32Array>();

/** The bar ambience, decoded once; null when the private file is not there. */
export async function loadBarNoise(): Promise<{
  samples: Float32Array;
  sampleRate: number;
} | null> {
  if (barCache !== undefined) return barCache;
  if (!existsSync(BAR_NOISE_FILE)) return (barCache = null);
  const a = await decodeAudioFile(BAR_NOISE_FILE);
  return (barCache = { samples: a.samples, sampleRate: a.sampleRate });
}

/** Pink noise (Paul Kellet's refined filter on white noise). */
export function pinkNoise(length: number, seed: number): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(length);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i++) {
    const w = rand() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return out;
}

/** RBJ biquad with quality factor q, applied in place. */
function biquad(
  x: Float32Array,
  sampleRate: number,
  type: "lowpass" | "highpass",
  freq: number,
  q: number,
): void {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const alpha = Math.sin(w0) / (2 * q);
  const cos = Math.cos(w0);
  const b0 = type === "lowpass" ? (1 - cos) / 2 : (1 + cos) / 2;
  const b1 = type === "lowpass" ? 1 - cos : -(1 + cos);
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = (b0 * x[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    x[i] = y;
  }
}

/** 4th-order Butterworth (two biquads, Q = 0.5412 and 1.3066): −3 dB at `freq`. */
export function butterworth4(
  x: Float32Array,
  sampleRate: number,
  type: "lowpass" | "highpass",
  freq: number,
): void {
  if (freq >= sampleRate / 2) return;
  biquad(x, sampleRate, type, freq, 0.5412);
  biquad(x, sampleRate, type, freq, 1.3066);
}

/** The analysis band copy of a signal, for level measurements only. */
function inBand(x: Float32Array, sampleRate: number): Float32Array {
  const y = Float32Array.from(x);
  butterworth4(y, sampleRate, "highpass", 50);
  butterworth4(y, sampleRate, "lowpass", Math.min(5500, 0.45 * sampleRate));
  return y;
}

/** RMS of the active part: 50 ms frames within 30 dB of the loudest frame. */
export function activeRms(x: Float32Array, sampleRate: number): number {
  const n = Math.max(1, Math.round(0.05 * sampleRate));
  const energies: number[] = [];
  let max = 0;
  for (let s = 0; s + n <= x.length; s += n) {
    let e = 0;
    for (let i = s; i < s + n; i++) e += x[i] * x[i];
    energies.push(e / n);
    if (e / n > max) max = e / n;
  }
  const active = energies.filter((e) => e >= max * 1e-3);
  if (active.length === 0) return 0;
  return Math.sqrt(active.reduce((a, b) => a + b, 0) / active.length);
}

function rms(x: Float32Array): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, x.length));
}

/** signal + noise scaled so that the in-band active signal sits `snrDb` above the in-band noise. */
export function mixAtSnr(
  signal: Float32Array,
  noise: Float32Array,
  snrDb: number,
  sampleRate: number,
): Float32Array {
  const s = activeRms(inBand(signal, sampleRate), sampleRate);
  const n = rms(inBand(noise, sampleRate));
  const gain = n > 0 ? s / (n * Math.pow(10, snrDb / 20)) : 0;
  return signal.map((x, i) => x + gain * noise[i]);
}

/** The bar ambience at `sampleRate` (anti-aliased when downsampling), cached per rate. */
function barAt(
  bar: { samples: Float32Array; sampleRate: number },
  sampleRate: number,
): Float32Array {
  let out = barResampled.get(sampleRate);
  if (out) return out;
  let src = bar.samples;
  if (sampleRate < bar.sampleRate) {
    src = Float32Array.from(bar.samples);
    butterworth4(src, bar.sampleRate, "lowpass", 0.45 * sampleRate);
  }
  const ratio = bar.sampleRate / sampleRate;
  out = new Float32Array(Math.floor((src.length - 1) / ratio));
  for (let i = 0; i < out.length; i++) {
    const t = i * ratio;
    const k = Math.floor(t);
    out[i] = src[k] + (t - k) * (src[k + 1] - src[k]);
  }
  barResampled.set(sampleRate, out);
  return out;
}

/** Where an item's bar excerpt starts, in seconds: drawn in [10 %, 90 %] of the recording. */
export function barOffsetSeconds(itemId: string, barSeconds: number, itemSeconds: number): number {
  const u = mulberry32(seedFor(itemId, "bar"))();
  const lo = 0.1 * barSeconds;
  const hi = Math.max(lo, 0.9 * barSeconds - itemSeconds);
  return lo + u * (hi - lo);
}

/** Phone-like chain; returns the signal and the share of clipped samples. */
function badMic(
  signal: Float32Array,
  sampleRate: number,
  itemId: string,
): { signal: Float32Array; clipped: number } {
  const y = mixAtSnr(signal, pinkNoise(signal.length, seedFor(itemId, "bad-mic")), 25, sampleRate);
  butterworth4(y, sampleRate, "highpass", 300);
  butterworth4(y, sampleRate, "lowpass", 3400);
  const sorted = Float32Array.from(y, Math.abs).sort();
  const ceiling = sorted[Math.floor(0.995 * (sorted.length - 1))] || 1;
  let clipped = 0;
  for (let i = 0; i < y.length; i++) {
    if (Math.abs(y[i]) > ceiling) {
      y[i] = Math.sign(y[i]) * ceiling;
      clipped++;
    }
  }
  return { signal: y, clipped: clipped / Math.max(1, y.length) };
}

export interface Augmented {
  signal: Float32Array;
  /** Facts about the realisation, for the JSON. */
  meta: { barOffsetSeconds?: number; clippedShare?: number };
}

/**
 * The signal of item `itemId` under a condition. Returns null when the
 * condition needs the private bar recording and it is absent.
 */
export async function applyCondition(
  signal: Float32Array,
  sampleRate: number,
  condition: Condition,
  itemId: string,
): Promise<Augmented | null> {
  switch (condition.kind) {
    case "clean":
      return { signal, meta: {} };
    case "pink":
      return {
        signal: mixAtSnr(
          signal,
          pinkNoise(signal.length, seedFor(itemId, "pink")),
          condition.snrDb!,
          sampleRate,
        ),
        meta: {},
      };
    case "bar": {
      const bar = await loadBarNoise();
      if (!bar) return null;
      const resampled = barAt(bar, sampleRate);
      const offset = barOffsetSeconds(
        itemId,
        resampled.length / sampleRate,
        signal.length / sampleRate,
      );
      const start = Math.floor(offset * sampleRate);
      const noise = new Float32Array(signal.length);
      for (let i = 0; i < noise.length; i++) noise[i] = resampled[(start + i) % resampled.length];
      return {
        signal: mixAtSnr(signal, noise, condition.snrDb!, sampleRate),
        meta: { barOffsetSeconds: Math.round(offset * 100) / 100 },
      };
    }
    case "bad-mic": {
      const out = badMic(signal, sampleRate, itemId);
      return { signal: out.signal, meta: { clippedShare: out.clipped } };
    }
  }
}

/**
 * Noise alone under a condition (the noise-only controls), at the level it
 * would have under music whose active part sits at −20 dBFS. Null for
 * "clean" and when the bar recording is absent.
 */
export async function noiseOnly(
  seconds: number,
  sampleRate: number,
  condition: Condition,
  itemId: string,
): Promise<Float32Array | null> {
  const n = Math.round(seconds * sampleRate);
  const music = 0.1; // −20 dBFS
  const scaled = (noise: Float32Array, snrDb: number) => {
    const g = music / (rms(inBand(noise, sampleRate)) * Math.pow(10, snrDb / 20) || 1);
    return noise.map((x) => x * g);
  };
  switch (condition.kind) {
    case "clean":
      return null;
    case "pink":
      return scaled(pinkNoise(n, seedFor(itemId, "pink")), condition.snrDb!);
    case "bar": {
      const bar = await loadBarNoise();
      if (!bar) return null;
      const resampled = barAt(bar, sampleRate);
      const start = Math.floor(
        barOffsetSeconds(itemId, resampled.length / sampleRate, seconds) * sampleRate,
      );
      return scaled(resampled.slice(start, start + n), condition.snrDb!);
    }
    case "bad-mic": {
      const y = scaled(pinkNoise(n, seedFor(itemId, "bad-mic")), 25);
      butterworth4(y, sampleRate, "highpass", 300);
      butterworth4(y, sampleRate, "lowpass", 3400);
      return y;
    }
  }
}
