/**
 * English names of the figures, for screen readers. Core gives ids
 * (`FigureId`); a host passes its own names (`StaffNotation figureNames`).
 */

import type { FigureId, NoteFigure } from "@audiolab/core/rhythm";

export const FIGURE_NAMES_EN: Record<FigureId, string> = {
  whole: "whole",
  half: "half",
  quarter: "quarter",
  eighth: "eighth",
  sixteenth: "sixteenth",
};

export interface FigureWords {
  names: Record<FigureId, string>;
  /** "rest" in "quarter rest". */
  rest: string;
  /** "dotted" in "dotted quarter". */
  dotted: string;
  /** Build the phrase from its parts. Default: "dotted quarter rest". */
  compose?: (parts: { name: string; dotted: string | null; rest: string | null }) => string;
}

export const FIGURE_WORDS_EN: FigureWords = {
  names: FIGURE_NAMES_EN,
  rest: "rest",
  dotted: "dotted",
};

/** "quarter", "dotted eighth rest"… */
export function figureLabel(
  figure: NoteFigure,
  rest: boolean,
  words: FigureWords = FIGURE_WORDS_EN,
): string {
  const parts = {
    name: words.names[figure.id],
    dotted: figure.dotted ? words.dotted : null,
    rest: rest ? words.rest : null,
  };
  if (words.compose) return words.compose(parts);
  return [parts.dotted, parts.name, parts.rest].filter(Boolean).join(" ");
}
