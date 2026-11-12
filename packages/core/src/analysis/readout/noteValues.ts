/**
 * Note values: the written length (whole, half, quarter, eighth) nearest to
 * a note's measured duration at the current tempo, for a decorative line
 * under a staff. "Nearest" is measured on a log scale (a ratio), so a note
 * of 1.4 beats reads as a quarter (1.4 is closer to 1 than to 2 as a ratio).
 * No dots, ties or rests: a live performance is not a transcription.
 */

export const NOTE_VALUES = [
  { name: "whole", beats: 4 },
  { name: "half", beats: 2 },
  { name: "quarter", beats: 1 },
  { name: "eighth", beats: 0.5 },
] as const;

export type NoteValueName = (typeof NOTE_VALUES)[number]["name"];

/** The value nearest to `durationSeconds` with a beat of `beatSeconds`, or null without a beat. */
export function noteValue(durationSeconds: number, beatSeconds: number): NoteValueName | null {
  if (!(beatSeconds > 0) || !(durationSeconds > 0)) return null;
  const beats = durationSeconds / beatSeconds;
  let best: NoteValueName = "eighth";
  let bestDistance = Infinity;
  for (const v of NOTE_VALUES) {
    const distance = Math.abs(Math.log2(beats / v.beats));
    if (distance < bestDistance) {
      best = v.name;
      bestDistance = distance;
    }
  }
  return best;
}
