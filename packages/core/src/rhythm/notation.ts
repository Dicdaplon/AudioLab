/**
 * Rhythm as it is written: events with durations, the figure that shows
 * each duration, and which eighths share a beam. Pure; a staff component
 * draws from it, an exercise derives its note times from it.
 *
 * A rhythm is a list of durations in beats, a negative one for a rest:
 *
 *   [1, 1, 0.5, 0.5, 1]       ta  ta  ti-ti  ta
 *   [1, 1, -1, 1]             ta  ta  (rest) ta
 *   [1.5, 0.5, 1, 1]          ta-a ti  ta  ta   (dotted quarter)
 *
 * Figures follow the usual values (whole 4, half 2, quarter 1, eighth 0.5,
 * sixteenth 0.25), dotted when the duration is 1.5 of one. A duration that
 * is no figure takes the figure below rather than an invented sign. Eighths
 * and sixteenths in the same beat share a beam: the beam draws the beat,
 * which is what makes a rhythm readable at a glance.
 */

export interface RhythmEvent {
  /** Start, in beats from the first downbeat. */
  beat: number;
  /** Length, in beats. */
  duration: number;
  /** A rest: nothing to play. */
  rest: boolean;
}

/** Base value of a figure, in beats. */
export type FigureBase = 4 | 2 | 1 | 0.5 | 0.25;

/** Stable id of a figure value (a key, not a label: the host names it). */
export type FigureId = "whole" | "half" | "quarter" | "eighth" | "sixteenth";

export interface NoteFigure {
  /** Base value in beats: 4, 2, 1, 0.5 or 0.25. */
  base: FigureBase;
  /** Its id ("quarter"…); with `dotted` and a rest flag it says the whole figure. */
  id: FigureId;
  dotted: boolean;
  /** Flags or beams: 0 for a quarter and longer, 1 for an eighth, 2 for a sixteenth. */
  flags: number;
  /** Open head (whole and half notes). */
  hollow: boolean;
  /** Has a stem (all but the whole note). */
  stem: boolean;
}

const BASES: readonly FigureBase[] = [4, 2, 1, 0.5, 0.25];
const IDS: Record<FigureBase, FigureId> = {
  4: "whole",
  2: "half",
  1: "quarter",
  0.5: "eighth",
  0.25: "sixteenth",
};

/** Events from durations (negative = rest), starting at `startBeat`. */
export function eventsFromDurations(durations: readonly number[], startBeat = 0): RhythmEvent[] {
  let beat = startBeat;
  return durations.map((d) => {
    const event = { beat, duration: Math.abs(d), rest: d < 0 };
    beat += Math.abs(d);
    return event;
  });
}

/** Beats of the notes to play (rests left out). */
export function playedBeats(events: readonly RhythmEvent[]): number[] {
  return events.filter((e) => !e.rest).map((e) => e.beat);
}

/** Total length in beats. */
export function rhythmLength(events: readonly RhythmEvent[]): number {
  return events.reduce((s, e) => Math.max(s, e.beat + e.duration), 0);
}

/** The figure that writes a duration. */
export function figureOf(duration: number): NoteFigure {
  const make = (base: FigureBase, dotted: boolean): NoteFigure => ({
    base,
    id: IDS[base],
    dotted,
    flags: base >= 1 ? 0 : base === 0.5 ? 1 : 2,
    hollow: base >= 2,
    stem: base < 4,
  });
  for (const b of BASES) {
    if (Math.abs(duration - b) < 0.02) return make(b, false);
    if (Math.abs(duration - b * 1.5) < 0.02) return make(b, true);
  }
  return make(BASES.find((b) => b <= duration + 0.02) ?? 0.25, false);
}

/**
 * Groups of event indices sharing a beam: consecutive played eighths or
 * sixteenths inside the same beat. Every other event is a group of one.
 */
export function beamGroups(events: readonly RhythmEvent[]): number[][] {
  const groups: number[][] = [];
  events.forEach((e, i) => {
    const beamable = !e.rest && figureOf(e.duration).flags > 0;
    const last = groups[groups.length - 1];
    const prev = last ? events[last[last.length - 1]] : undefined;
    const joins =
      beamable &&
      prev !== undefined &&
      !prev.rest &&
      figureOf(prev.duration).flags > 0 &&
      Math.floor(prev.beat + 1e-6) === Math.floor(e.beat + 1e-6) &&
      Math.abs(prev.beat + prev.duration - e.beat) < 1e-6;
    if (joins) last.push(i);
    else groups.push([i]);
  });
  return groups;
}

/** Written position of a MIDI note on a staff: diatonic step (C0 = 0) and sharp. */
export function staffStep(midi: number): { step: number; sharp: boolean } {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  // C C# D D# E F F# G G# A A# B → letter index and sharp.
  const letter = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc];
  const sharp = [1, 3, 6, 8, 10].includes(pc);
  return { step: octave * 7 + letter, sharp };
}
