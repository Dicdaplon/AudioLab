/**
 * Key POCs: the key of the whole excerpt from different chroma front-ends
 * (the same as the chord POCs, averaged over the excerpt), from harmonic
 * pitch-class profiles, and from the chords found.
 *
 *   front-end + Krumhansl   mean chroma of a POC front-end → Krumhansl–Schmuckler
 *   + bass                  the bass chroma added with a weight (the tonic is often in the bass)
 *   HPCP                    Gómez 2006: spectral peaks, each also credited to its subharmonics
 *   from chords             Noland & Sandler 2006 spirit: the chords found, weighted by
 *                           their role in each key (I, IV, V…), vote for a key
 */
import { GAUSSIAN_LOG_CHROMA } from "../../src/analysis/chroma";
import { detectKey } from "../../src/analysis/keyDetection";
import { computeChromaSequence } from "../../src/offline/offlinePipeline";
import type { KeyRef } from "../../bench/metrics";
import type { KeyMethod } from "../evaluate";
import { fold, midiOf, stft } from "../dsp";
import { FRONTS, decode, type Features } from "./chords";

function meanChroma(f: Features, bassWeight = 0): Float32Array {
  const c = new Float32Array(12);
  for (const x of f.feats) {
    for (let i = 0; i < 12; i++) {
      c[i] += x.treble[i];
      if (bassWeight && x.bass) {
        let bs = 0;
        for (const v of x.bass) bs += v;
        if (bs > 0) c[i] += (bassWeight * x.bass[i]) / bs;
      }
    }
  }
  return c;
}

const fromFront =
  (
    front: (x: Float32Array, sr: number) => Features | Promise<Features>,
    bassWeight = 0,
  ): KeyMethod =>
  async (x, sr) =>
    detectKey(meanChroma(await front(x, sr), bassWeight))[0] ?? null;

/** HPCP-like: peaks of an 8192-point spectrum, each credited to f/h (h = 1..8) with weight 0.6^(h−1). */
const hpcp =
  (harmonics = 8, decay = 0.6): KeyMethod =>
  (x, sr) => {
    const s = stft(x, sr, 8192, 2048);
    const c = new Float32Array(12);
    for (const m of s.mag) {
      let max = 0;
      for (const v of m) max = Math.max(max, v);
      for (let k = 2; k < m.length - 1; k++) {
        const f = k * s.binHz;
        if (f < 55 || f > 5000) continue;
        if (!(m[k] > m[k - 1] && m[k] >= m[k + 1]) || m[k] < max * 1e-3) continue;
        // Parabolic interpolation of the peak frequency.
        const d = (0.5 * (m[k - 1] - m[k + 1])) / (m[k - 1] - 2 * m[k] + m[k + 1]);
        const fp = (k + d) * s.binHz;
        const a = m[k] * m[k];
        for (let h = 1; h <= harmonics; h++) {
          const f0 = fp / h;
          if (f0 < 55) break;
          const midi = midiOf(f0);
          const near = Math.round(midi);
          const dist = Math.abs(midi - near);
          // Cosine weighting window of 4/3 semitone (Gómez 2006).
          if (dist > 2 / 3) continue;
          const w = Math.cos((Math.PI / 2) * (dist / (2 / 3))) ** 2;
          c[((near % 12) + 12) % 12] += a * w * Math.pow(decay, h - 1);
        }
      }
    }
    return detectKey(c)[0] ?? null;
  };

// Diatonic chord weights (degree in semitones above the tonic, quality) per mode.
const MAJOR_ROLES: [number, "maj" | "min", number][] = [
  [0, "maj", 1],
  [5, "maj", 0.8],
  [7, "maj", 0.9],
  [2, "min", 0.6],
  [9, "min", 0.7],
  [4, "min", 0.4],
];
const MINOR_ROLES: [number, "maj" | "min", number][] = [
  [0, "min", 1],
  [5, "min", 0.8],
  [7, "maj", 0.9],
  [7, "min", 0.4],
  [8, "maj", 0.7],
  [3, "maj", 0.6],
  [10, "maj", 0.6],
];

/** The chords found vote for the keys they belong to; optionally added to the chroma correlation. */
const fromChords =
  (
    front: (x: Float32Array, sr: number) => Features | Promise<Features>,
    mixWithChroma = 0,
  ): KeyMethod =>
  async (x, sr) => {
    const f = await front(x, sr);
    const chords = decode(f, { mode: "hmm", lambdaBass: 0.3, meanChordSeconds: 2 });
    const count = new Map<string, number>();
    for (const c of chords)
      if (c.chord)
        count.set(
          `${c.chord.root}|${c.chord.quality}`,
          (count.get(`${c.chord.root}|${c.chord.quality}`) ?? 0) + 1,
        );
    const total = chords.length || 1;
    const chroma = mixWithChroma ? detectKey(meanChroma(f, 0.5)) : [];
    let best: KeyRef | null = null;
    let bestScore = -Infinity;
    for (const mode of ["maj", "min"] as const) {
      for (let tonic = 0; tonic < 12; tonic++) {
        let s = 0;
        for (const [deg, q, w] of mode === "maj" ? MAJOR_ROLES : MINOR_ROLES) {
          s += (w * (count.get(`${(tonic + deg) % 12}|${q}`) ?? 0)) / total;
        }
        if (mixWithChroma) {
          const k = chroma.find((x) => x.tonic === tonic && x.mode === mode);
          s += mixWithChroma * (k?.correlation ?? 0);
        }
        if (s > bestScore) {
          bestScore = s;
          best = { tonic, mode };
        }
      }
    }
    return best;
  };

/** The SDK energy path with a 16384-point front (control for the 10 fps fronts). */
const sdkLike: KeyMethod = (x, sr) => {
  const audio = { samples: x, sampleRate: sr, durationSeconds: x.length / sr };
  return (
    detectKey(
      computeChromaSequence(audio, {
        fftSize: 8192,
        hopSize: 2048,
        chroma: GAUSSIAN_LOG_CHROMA,
      }).reduce((acc, c) => {
        for (let i = 0; i < 12; i++) acc[i] += c[i];
        return acc;
      }, new Float32Array(12)),
    )[0] ?? null
  );
};
void fold;

export const METHODS: Record<string, KeyMethod> = {
  "control: glog 8192 (≈ SDK opt-in)": sdkLike,
  "glog 10 fps + bass 0.5": fromFront(FRONTS.glogBass, 0.5),
  "HPSS + glog": fromFront(FRONTS.hpss),
  NNLS: fromFront(FRONTS.nnls),
  "NNLS + bass 0.5": fromFront(FRONTS.nnls, 0.5),
  "NNLS + bass 1": fromFront(FRONTS.nnls, 1),
  CQT: fromFront(FRONTS.vqt0),
  "Basic Pitch + bass 0.5": fromFront(FRONTS.basicPitch, 0.5),
  "HPCP (8 harmonics)": hpcp(8, 0.6),
  "HPCP (4 harmonics)": hpcp(4, 0.6),
  "from chords (NNLS + bass)": fromChords(FRONTS.nnls),
  "from chords + chroma": fromChords(FRONTS.nnls, 0.5),
  "from chords (CQT + bass)": fromChords(FRONTS.vqt0),
  "from chords (glog + bass)": fromChords(FRONTS.glogBass),
  "from chords (glog + bass) + chroma": fromChords(FRONTS.glogBass, 0.5),
};
