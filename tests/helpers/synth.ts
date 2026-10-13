/**
 * Deterministic test-signal generators and an AnalyserNode emulation, so the
 * TonalityEngine can be driven end-to-end from audio without fixtures.
 */
import { fftMagnitude } from "../../src/analysis/fft";

/** Seeded PRNG (mulberry32): same seed, same sequence, on every platform. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ToneOptions {
  sampleRate: number;
  seconds: number;
  /** Peak amplitude of each note's fundamental. Default 0.2. */
  amplitude?: number;
  /** Number of harmonics, amplitude 1/n. Default 4. */
  harmonics?: number;
  /** Detuning applied to every note, in cents. Default 0. */
  cents?: number;
}

export function midiToHz(midi: number, cents = 0): number {
  return 440 * Math.pow(2, (midi - 69 + cents / 100) / 12);
}

/** Sum of harmonic tones (1/n amplitudes) for the given MIDI notes. */
export function notes(midiNotes: readonly number[], opts: ToneOptions): Float32Array {
  const { sampleRate, seconds, amplitude = 0.2, harmonics = 4, cents = 0 } = opts;
  const n = Math.round(seconds * sampleRate);
  const out = new Float32Array(n);
  midiNotes.forEach((midi, idx) => {
    const f0 = midiToHz(midi, cents);
    // Distinct starting phases avoid an artificial peak at t = 0.
    const phase0 = idx * 1.3;
    for (let h = 1; h <= harmonics; h++) {
      const f = f0 * h;
      if (f >= sampleRate / 2) break;
      const w = (2 * Math.PI * f) / sampleRate;
      const a = amplitude / h;
      for (let i = 0; i < n; i++) out[i] += a * Math.sin(w * i + phase0 * h);
    }
  });
  return out;
}

/** Concatenate signals. */
export function concat(parts: readonly Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function scale(signal: Float32Array, gain: number): Float32Array {
  return signal.map((x) => x * gain);
}

export function rms(signal: Float32Array): number {
  let s = 0;
  for (const x of signal) s += x * x;
  return Math.sqrt(s / Math.max(1, signal.length));
}

/** Uniform white noise in [-amplitude, amplitude]. */
export function whiteNoise(length: number, amplitude: number, seed = 1): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) out[i] = amplitude * (2 * rand() - 1);
  return out;
}

/** signal + white noise scaled to the requested signal-to-noise ratio (dB). */
export function addNoise(signal: Float32Array, snrDb: number, seed = 1): Float32Array {
  const noise = whiteNoise(signal.length, 1, seed);
  const gain = rms(signal) / (rms(noise) * Math.pow(10, snrDb / 20));
  return signal.map((x, i) => x + gain * noise[i]);
}

/**
 * AnalyserNode emulation: Blackman window, FFT, 1/N scaling, 20·log10.
 * Returns `fftSize / 2` dB bins (silent bins are -Infinity), i.e. what
 * `getFloatFrequencyData` delivers.
 */
export function analyserDbFrame(frame: Float32Array): Float32Array {
  const N = frame.length;
  const windowed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = i / N;
    const w = 0.42 - 0.5 * Math.cos(2 * Math.PI * x) + 0.08 * Math.cos(4 * Math.PI * x);
    windowed[i] = frame[i] * w;
  }
  const mag = fftMagnitude(windowed);
  return mag.map((m) => 20 * Math.log10(m / N));
}

/**
 * Cut `signal` into AnalyserNode-sized windows taken every `hopSamples`
 * (the polling interval of the live hook) and return their dB spectra.
 */
export function analyserFrames(
  signal: Float32Array,
  fftSize: number,
  hopSamples: number,
): Float32Array[] {
  const frames: Float32Array[] = [];
  for (let end = fftSize; end <= signal.length; end += hopSamples) {
    frames.push(analyserDbFrame(signal.subarray(end - fftSize, end)));
  }
  return frames;
}
