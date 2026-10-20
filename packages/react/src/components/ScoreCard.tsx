/**
 * The score of a rhythm run, for players: a ring with the final score (notes
 * earned minus stray sounds), the bell curve every note is scored on with
 * each note placed where it landed, and one bar per note.
 *
 *   <ScoreCard results={play.results} strays={play.strays} sigmaMs={σ} />
 *
 * Live, it shows the notes graded so far; `done` shows the final score. No
 * jargon on screen: early, on the beat, late, missed, stray sounds.
 */

import type { CSSProperties } from "react";

import {
  exerciseScore,
  SCORE_PASS,
  STRAY_PENALTY,
  timingScore,
  type NoteResult,
} from "@audiolab/core/rhythm";

/** What the card reads of a note: `NoteResult`, or a free-tempo `FittedNote` mapped to it. */
export type ScoredNote = Pick<NoteResult, "resolved" | "tier" | "deltaMs" | "score">;

export interface ScoreCardProps {
  results: readonly ScoredNote[] | null;
  /** Sounds outside every note's window (`usePlayAlong().strays`). */
  strays: number;
  /** σ of the scores' bell curve, in ms (`scorerSigmaMs(config)`). */
  sigmaMs: number;
  /** True once the run is over: the final score. */
  done?: boolean;
  /** What a stray sound costs, as a share of a perfect note. Default `STRAY_PENALTY`. */
  strayPenalty?: number;
  /** A name per note (a chord, a note), shown under its bar. */
  labels?: readonly string[];
  className?: string;
}

type Grade = "great" | "good" | "low";

function gradeOf(score: number): Grade {
  if (score >= SCORE_PASS * 100) return "great";
  if (score >= 50) return "good";
  return "low";
}

const W = 300;
const H = 92;
const BASE = 74;
const TOP = 10;

/** The bell curve over ±2.5σ, with the notes on it. */
function Bell({ results, sigmaMs }: { results: readonly ScoredNote[]; sigmaMs: number }) {
  const span = 2.5 * sigmaMs;
  const x = (deltaMs: number) =>
    W / 2 + (Math.max(-span, Math.min(span, deltaMs)) / span) * (W / 2 - 12);
  const y = (score: number) => BASE - score * (BASE - TOP);
  const steps = 60;
  let path = "";
  for (let i = 0; i <= steps; i++) {
    const d = -span + (2 * span * i) / steps;
    path += `${i === 0 ? "M" : "L"}${x(d).toFixed(1)},${y(timingScore(d, sigmaMs)).toFixed(1)}`;
  }
  const passHalf = sigmaMs * Math.sqrt(2 * Math.log(1 / SCORE_PASS));
  return (
    <svg
      className="al-score__bell"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Where each note landed: the closer to the top, the more it scored"
    >
      <rect
        className="al-score__pass"
        x={x(-passHalf)}
        y={TOP - 4}
        width={x(passHalf) - x(-passHalf)}
        height={BASE - TOP + 4}
      />
      <path className="al-score__curve" d={`${path}L${x(span)},${BASE}L${x(-span)},${BASE}Z`} />
      <line className="al-score__axis" x1={8} x2={W - 8} y1={BASE} y2={BASE} />
      {results.map((r, i) =>
        r.resolved && r.deltaMs !== null && r.score !== null ? (
          <circle
            key={i}
            className="al-score__dot"
            data-grade={gradeOf(r.score * 100)}
            cx={x(r.deltaMs)}
            cy={y(r.score)}
            r={5}
          />
        ) : null,
      )}
      <text className="al-score__tick" x={12} y={H - 3}>
        early
      </text>
      <text className="al-score__tick" x={W / 2} y={H - 3} textAnchor="middle">
        on the beat
      </text>
      <text className="al-score__tick" x={W - 12} y={H - 3} textAnchor="end">
        late
      </text>
    </svg>
  );
}

export function ScoreCard({
  results,
  strays,
  sigmaMs,
  done = false,
  strayPenalty = STRAY_PENALTY,
  labels,
  className,
}: ScoreCardProps) {
  const list = results ?? [];
  const graded = list.filter((r) => r.resolved);
  // Live: the notes graded so far; done: all of them.
  const counted = done ? list : graded;
  const s = exerciseScore(
    counted.map((r) => r.score),
    strays,
    strayPenalty,
  );
  const score = Math.round(s.score);
  const missed = graded.filter((r) => r.tier === "missed").length;
  const ringStyle = { "--al-score": `${s.score}` } as CSSProperties;

  return (
    <section
      className={["al-score", className].filter(Boolean).join(" ")}
      data-done={done || undefined}
      aria-label="Score"
    >
      <div className="al-score__head">
        <div className="al-score__ring" data-grade={gradeOf(s.score)} style={ringStyle}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle className="al-score__track" cx={50} cy={50} r={42} pathLength={100} />
            <circle className="al-score__fill" cx={50} cy={50} r={42} pathLength={100} />
          </svg>
          <span className="al-score__value">
            {counted.length > 0 ? score : "–"}
            <small>/100</small>
          </span>
        </div>
        <dl className="al-score__sum">
          <div>
            <dt>Notes</dt>
            <dd>+{Math.round(s.notes)}</dd>
          </div>
          <div data-negative={strays > 0 || undefined}>
            <dt>
              Stray sounds <span className="al-score__count">×{strays}</span>
            </dt>
            <dd>−{Math.round(s.penalty)}</dd>
          </div>
          <div className="al-score__note">
            <dt className="al-visually-hidden">Summary</dt>
            <dd>
              {done
                ? `${s.passed} of ${s.total} notes right on`
                : `${graded.length} of ${list.length} notes played`}
              {missed > 0 ? `, ${missed} missed` : ""}
            </dd>
          </div>
        </dl>
      </div>

      <Bell results={list} sigmaMs={sigmaMs} />

      <ol className="al-score__notes" aria-label="Each note">
        {list.map((r, i) => {
          const value = r.score === null ? null : Math.round(r.score * 100);
          return (
            <li
              key={i}
              className="al-score__bar"
              data-grade={value === null ? undefined : r.tier === "missed" ? "low" : gradeOf(value)}
              style={{ "--al-bar": `${value ?? 0}` } as CSSProperties}
              title={
                value === null ? "not played yet" : r.tier === "missed" ? "missed" : `${value}`
              }
            >
              <span className="al-score__box">
                <span className="al-score__bar-fill" aria-hidden="true" />
                <span className="al-score__bar-value">
                  {value === null ? "·" : r.tier === "missed" ? "✕" : value}
                </span>
              </span>
              {labels?.[i] && <span className="al-score__bar-label">{labels[i]}</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
