/**
 * Fret placer: picks a plausible string and fret for each played note, for a
 * tablature-style display. A pitch can be played in up to five places on a
 * guitar; a teacher reads a line in one hand position, so the placer keeps
 * a position (the fret under the index finger, covering `position − 1` to
 * `position + 3`) and, for each note, picks the place that costs least:
 *
 *   - 4 per fret outside the hand's window (a shift is expensive),
 *   - 0.6 per string jumped from the previous note,
 *   - 2 above `maxFret` (the comfortable range),
 *   - an open string is a bonus in first position and a small cost higher
 *     up, where a player would fret the note instead.
 *
 * The hand moves only after two notes in a row fall outside the window, so
 * one stray note does not drag the whole reading up the neck. A song can
 * start in the pentatonic box of its key (`startInKey`): A minor reads at the
 * 5th fret, where a guitarist would play it.
 */

/** Standard tuning, low E first (MIDI). */
export const STANDARD_TUNING: readonly number[] = [40, 45, 50, 55, 59, 64];

export interface FretPlacerOptions {
  /** Open-string pitches, lowest string first. Default standard tuning. */
  tuning?: readonly number[];
  /** Highest fret considered. Default 15. */
  frets?: number;
  /** Frets above this cost extra. Default 12. */
  maxFret?: number;
}

export interface FretPosition {
  /** String index, 0 = lowest (low E in standard tuning). */
  string: number;
  fret: number;
}

const WINDOW_BELOW = 1;
const WINDOW_ABOVE = 3;

export class FretPlacer {
  private readonly tuning: readonly number[];
  private readonly frets: number;
  private readonly maxFret: number;
  /** Fret under the index finger; 0 or 1 is first position. */
  private position = 1;
  private lastString: number | null = null;
  private outside = 0;

  constructor(options: FretPlacerOptions = {}) {
    this.tuning = options.tuning ?? STANDARD_TUNING;
    this.frets = options.frets ?? 15;
    this.maxFret = options.maxFret ?? 12;
  }

  /** Every place a MIDI note can be played, lowest string first. */
  positions(midi: number): FretPosition[] {
    const out: FretPosition[] = [];
    this.tuning.forEach((open, string) => {
      const fret = midi - open;
      if (fret >= 0 && fret <= this.frets) out.push({ string, fret });
    });
    return out;
  }

  /** Put the hand on the pentatonic box of a key: its tonic on the lowest string. */
  startInKey(tonic: number): void {
    const fret = (((tonic - this.tuning[0]) % 12) + 12) % 12;
    this.position = fret === 0 ? 12 : fret;
    this.lastString = null;
    this.outside = 0;
  }

  /** The place to show for `midi`, or null when the guitar cannot play it. */
  place(midi: number): FretPosition | null {
    const options = this.positions(midi);
    if (options.length === 0) return null;
    let best = options[0];
    let bestCost = Infinity;
    for (const p of options) {
      const cost = this.cost(p);
      if (cost < bestCost) {
        best = p;
        bestCost = cost;
      }
    }
    this.lastString = best.string;
    if (best.fret > 0 && this.shiftFor(best.fret) > 0) {
      this.outside += 1;
      if (this.outside >= 2) {
        this.position =
          best.fret < this.position
            ? Math.max(1, best.fret + WINDOW_BELOW)
            : best.fret - WINDOW_ABOVE;
        this.outside = 0;
      }
    } else {
      this.outside = 0;
    }
    return best;
  }

  /** Back to first position. */
  reset(): void {
    this.position = 1;
    this.lastString = null;
    this.outside = 0;
  }

  private shiftFor(fret: number): number {
    const low = this.position - WINDOW_BELOW;
    const high = this.position + WINDOW_ABOVE;
    return fret < low ? low - fret : fret > high ? fret - high : 0;
  }

  private cost(p: FretPosition): number {
    const jump = this.lastString === null ? 0 : 0.6 * Math.abs(p.string - this.lastString);
    if (p.fret === 0) return jump + (this.position <= 2 ? -0.5 : 1);
    return 4 * this.shiftFor(p.fret) + jump + (p.fret > this.maxFret ? 2 : 0);
  }
}
