/**
 * A steady beat on the AudioContext clock: where beat n falls, which beat a
 * time is in, and the beats inside a time range. Pure; shared by the
 * metronome (to schedule clicks), the exercises (to place notes written in
 * beats) and the displays (to draw beat and bar lines).
 *
 * Beat 0 is the first downbeat at `startTime`; negative beats are the
 * count-in before it.
 */

export interface BeatGrid {
  /** AudioContext time of beat 0, in s. */
  startTime: number;
  bpm: number;
  /** Beats per bar (4 for 4/4). */
  beatsPerBar: number;
}

/** Seconds per beat. */
export function beatDuration(grid: BeatGrid): number {
  return 60 / grid.bpm;
}

/** Time of a beat (fractional beats allowed: 2.5 is the "and" of beat 3). */
export function beatTime(grid: BeatGrid, beat: number): number {
  return grid.startTime + beat * beatDuration(grid);
}

/** Beat position of a time, fractional. */
export function beatAt(grid: BeatGrid, time: number): number {
  return (time - grid.startTime) / beatDuration(grid);
}

/** True when a whole beat starts a bar. */
export function isDownbeat(grid: BeatGrid, beat: number): boolean {
  return ((beat % grid.beatsPerBar) + grid.beatsPerBar) % grid.beatsPerBar === 0;
}

/** Whole beats whose time is in [from, to). */
export function beatsBetween(grid: BeatGrid, from: number, to: number): number[] {
  const first = Math.ceil(beatAt(grid, from) - 1e-9) || 0; // no -0
  const out: number[] = [];
  for (let b = first; beatTime(grid, b) < to; b++) out.push(b);
  return out;
}
