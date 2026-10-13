"use client";

import type { Mode } from "./Readout";

export interface RankRow {
  key: string;
  name: string;
  mode?: Mode;
  /** In [0, 1]. */
  probability: number;
  /** Mono statistic shown after the percentage, e.g. "r=0.83". */
  stat: string;
}

interface RankListProps {
  rows: RankRow[];
  /** Accessible name of the list. */
  label: string;
}

/** Ranked candidates with a probability bar tinted by mode. */
export function RankList({ rows, label }: RankListProps) {
  return (
    <ol className="al-ranklist" aria-label={label}>
      {rows.map((row, i) => (
        <li
          key={row.key}
          className="al-ranklist__row"
          data-mode={row.mode}
          aria-current={i === 0 ? "true" : undefined}
        >
          <span className="al-ranklist__name">{row.name}</span>
          <span className="al-ranklist__bar" aria-hidden="true">
            <span
              className="al-ranklist__fill"
              style={{ width: `${(row.probability * 100).toFixed(2)}%` }}
            />
          </span>
          <span className="al-ranklist__pct al-num">{(row.probability * 100).toFixed(1)} %</span>
          <span className="al-ranklist__stat al-num">{row.stat}</span>
        </li>
      ))}
    </ol>
  );
}
