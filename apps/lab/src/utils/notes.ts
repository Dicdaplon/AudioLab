/**
 * Note / frequency / pitch-class conversions.
 *
 * Pitch-class convention: 0 = C, 1 = C#, 2 = D, ..., 9 = A, ..., 11 = B.
 * Reference: A4 = 440 Hz = MIDI 69.
 */

export const NOTE_NAMES: readonly string[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const A4_FREQ = 440;
export const A4_MIDI = 69;

/** Convert a frequency in Hz to a (fractional) MIDI number. */
export function freqToMidi(freq: number): number {
  return A4_MIDI + 12 * Math.log2(freq / A4_FREQ);
}

/** Convert a MIDI number to a frequency in Hz. */
export function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** Pitch class (0..11) for a given frequency. Rounds to nearest semitone. */
export function freqToPitchClass(freq: number): number {
  const midi = Math.round(freqToMidi(freq));
  return ((midi % 12) + 12) % 12;
}

/** Human-readable note name (e.g. "C#") for a pitch class. */
export function pitchClassName(pc: number): string {
  const safe = ((pc % 12) + 12) % 12;
  return NOTE_NAMES[safe];
}

/**
 * A minor (= C major) pentatonic: A, C, D, E, G. Five notes, not a scale
 * of seven — the FFT view overlays these as reference lines.
 */
export const A_MINOR_PENTATONIC_PITCH_CLASSES: readonly number[] = [9, 0, 2, 4, 7];

/**
 * Frequencies (ascending) of every note of the given pitch classes that
 * falls inside [minFreq, maxFreq], across MIDI 0..127.
 */
export function pitchClassFrequencies(
  pitchClasses: readonly number[],
  minFreq: number,
  maxFreq: number,
): number[] {
  const freqs: number[] = [];
  for (let midi = 0; midi < 128; midi++) {
    if (!pitchClasses.includes(midi % 12)) continue;
    const f = midiToFreq(midi);
    if (f >= minFreq && f <= maxFreq) freqs.push(f);
  }
  return freqs;
}
