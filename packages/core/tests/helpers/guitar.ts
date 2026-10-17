/**
 * A synthetic guitar for the chord and note measurements: real voicings
 * (fret per string, standard tuning) rendered with `pluckedTone`, a strum
 * offset between strings and the comb filter of the plucking position
 * (partial k of a string plucked at a fraction β of its length has an
 * amplitude ∝ |sin(π·k·β)| / k). It is a model, not a recording: the
 * numbers it produces are baselines, labelled as such wherever published.
 */
import { addNoise, mulberry32, pluckedTone } from "./synth";

/** Open strings E2 A2 D3 G3 B3 E4, as MIDI notes, low to high. */
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64] as const;

/** "x02220" → MIDI notes of the sounding strings ("x" = muted). */
export function voicingNotes(shape: string): number[] {
  if (shape.length !== 6) throw new Error(`a voicing has 6 strings: ${shape}`);
  const notes: number[] = [];
  [...shape].forEach((fret, string) => {
    if (fret !== "x") notes.push(STANDARD_TUNING[string] + Number.parseInt(fret, 16));
  });
  return notes;
}

export interface StrumOptions {
  sampleRate: number;
  seconds: number;
  /** Seed for the phases, the strum offsets and the pluck positions. */
  seed: number;
  /** Mean delay between two strings, in ms. Default 20. */
  strumMs?: number;
  /** Signal-to-noise ratio in dB; `Infinity` for none. Default Infinity. */
  snrDb?: number;
  /** Plucking position as a fraction of the string length. Default drawn in [1/7, 1/5]. */
  pluckPosition?: number;
  /** Stiffness coefficient of the strings. Default 1e-4. */
  inharmonicity?: number;
}

export interface LowStringOptions {
  sampleRate: number;
  seconds: number;
  /** Level of the fundamental, in dB relative to the 2nd partial. Default −6. */
  fundamentalDb?: number;
  /** Level of the 3rd partial, in dB relative to the 2nd. Default +3. */
  thirdHarmonicDb?: number;
  seed?: number;
}

/**
 * A wound string heard through a small microphone: the fundamental is
 * rolled off (high-pass around 120 Hz, 12 dB per octave, on top of
 * `fundamentalDb`), the 3rd partial is the loudest, the others fall by
 * 3 dB per octave. Below about A2 the chroma's strongest bin is then the
 * fifth of the note (the 3rd harmonic), not the note.
 */
export function lowStringTone(midi: number, opts: LowStringOptions): Float32Array {
  const { sampleRate, seconds, fundamentalDb = -6, thirdHarmonicDb = 3, seed = 5 } = opts;
  const f0 = midiToHz(midi);
  const tone = pluckedTone(f0, {
    sampleRate,
    seconds,
    harmonics: 30,
    decaySeconds: 3,
    inharmonicity: 5e-5,
    seed,
    amplitude: (k) => {
      const f = k * f0;
      const highPass = f < 120 ? (f / 120) ** 2 : 1;
      const db = k === 1 ? fundamentalDb : k === 3 ? thirdHarmonicDb : -3 * Math.log2(k);
      return highPass * 10 ** (db / 20);
    },
  });
  return addNoise(tone, 35, seed);
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Strummed chord: one plucked tone per MIDI note, low to high. */
export function strum(midiNotes: readonly number[], opts: StrumOptions): Float32Array {
  const { sampleRate, seconds, seed, strumMs = 20, snrDb = Infinity, inharmonicity = 1e-4 } = opts;
  const rand = mulberry32(seed);
  const n = Math.round(seconds * sampleRate);
  const out = new Float32Array(n);
  let offset = 0;
  midiNotes.forEach((midi, i) => {
    const beta = opts.pluckPosition ?? 1 / 7 + rand() * (1 / 5 - 1 / 7);
    const tone = pluckedTone(midiToHz(midi), {
      sampleRate,
      seconds,
      harmonics: 16,
      amplitude: (k) => Math.abs(Math.sin(Math.PI * k * beta)) / k,
      decaySeconds: 1.2 + rand(),
      inharmonicity,
      seed: seed * 31 + i,
    });
    const start = Math.round(offset * sampleRate);
    for (let j = start; j < n; j++) out[j] += 0.2 * tone[j - start];
    offset += ((0.5 + rand()) * strumMs) / 1000;
  });
  return Number.isFinite(snrDb) ? addNoise(out, snrDb, seed) : out;
}
