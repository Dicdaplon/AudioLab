"use client";

/**
 * Sketch: miniature explanatory diagrams in SVG, styled by the Loupe tokens
 * (light and dark themes follow automatically). Each primitive draws one
 * idea in a small fixed box; `SketchChain` lines them up with arrows and
 * captions to tell a pipeline: "sound → chroma → key".
 *
 *   <SketchChain
 *     items={[
 *       { sketch: <SketchWave kind="pluck" />, caption: "sound" },
 *       { sketch: <SketchBars values={chroma} highlight={[0, 4, 7]} />, caption: "12 notes" },
 *       { sketch: <SketchLabel text="C" sub="major" />, caption: "best match" },
 *     ]}
 *   />
 *
 * Colours come from classes (`.al-sketch__*`) that read `--al-viz-*`
 * tokens, so a sketch never hard-codes a colour. Every sketch is decorative
 * by default; pass `label` for a text alternative.
 */

import type { ReactNode } from "react";

const W = 120;
const H = 64;

interface SketchFrameProps {
  label?: string;
  children: ReactNode;
  width?: number;
  height?: number;
}

/** The SVG box every primitive draws in (120 × 64 units by default). */
export function Sketch({ label, children, width = W, height = H }: SketchFrameProps) {
  return (
    <svg
      className="al-sketch"
      viewBox={`0 0 ${width} ${height}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}

const pathOf = (points: readonly (readonly [number, number])[]) =>
  points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export interface SketchWaveProps {
  /** "sine": a steady tone; "pluck": an attack that decays; "noise": hiss; "click": a short burst. */
  kind?: "sine" | "pluck" | "noise" | "click";
  /** Cycles across the box. Default 6. */
  cycles?: number;
  label?: string;
}

/** A waveform. */
export function SketchWave({ kind = "sine", cycles = 6, label }: SketchWaveProps) {
  const points: [number, number][] = [];
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i <= 120; i++) {
    const x = i;
    const t = i / 120;
    let env = 1;
    let y = Math.sin(2 * Math.PI * cycles * t);
    if (kind === "pluck") env = t < 0.08 ? t / 0.08 : Math.exp(-(t - 0.08) * 3.2);
    if (kind === "noise") y = rand() * 0.6;
    if (kind === "click") env = t > 0.4 && t < 0.55 ? Math.exp(-(t - 0.4) * 30) : 0;
    points.push([x, H / 2 - y * env * 24]);
  }
  return (
    <Sketch label={label}>
      <line className="al-sketch__axis" x1={0} y1={H / 2} x2={W} y2={H / 2} />
      <path className="al-sketch__line" d={pathOf(points)} />
    </Sketch>
  );
}

export interface SketchBarsProps {
  /** Bar heights in [0, 1]. */
  values: readonly number[];
  /** Indices drawn in the accent colour. */
  highlight?: readonly number[];
  /** A horizontal threshold in [0, 1], dashed. */
  threshold?: number;
  /** Tiny labels under the bars (keep them to one or two characters). */
  labels?: readonly string[];
  label?: string;
}

/** Bars: a spectrum, a chroma, a histogram. */
export function SketchBars({ values, highlight = [], threshold, labels, label }: SketchBarsProps) {
  const n = Math.max(1, values.length);
  const base = labels ? H - 12 : H - 4;
  const slot = (W - 8) / n;
  return (
    <Sketch label={label}>
      {values.map((v, i) => {
        const h = Math.max(1, Math.min(1, v) * (base - 4));
        return (
          <rect
            key={i}
            className={
              highlight.includes(i) ? "al-sketch__bar al-sketch__bar--on" : "al-sketch__bar"
            }
            x={4 + i * slot + slot * 0.15}
            y={base - h}
            width={slot * 0.7}
            height={h}
            rx={1}
          />
        );
      })}
      {threshold !== undefined && (
        <line
          className="al-sketch__threshold"
          x1={2}
          x2={W - 2}
          y1={base - threshold * (base - 4)}
          y2={base - threshold * (base - 4)}
        />
      )}
      {labels?.map((t, i) => (
        <text
          key={i}
          className="al-sketch__tick"
          x={4 + (i + 0.5) * slot}
          y={H - 2}
          textAnchor="middle"
        >
          {t}
        </text>
      ))}
    </Sketch>
  );
}

export interface SketchCurveProps {
  /** Points in [0, 1] × [0, 1] (y up). */
  points: readonly (readonly [number, number])[];
  /** x positions in [0, 1] marked by a dot on the curve. */
  marks?: readonly number[];
  /** A second, dashed curve (e.g. a threshold that moves). */
  dashed?: readonly (readonly [number, number])[];
  label?: string;
}

/** A curve: an envelope, a correlation, a flux. */
export function SketchCurve({ points, marks = [], dashed, label }: SketchCurveProps) {
  const toBox = (p: readonly [number, number]): [number, number] => [
    4 + p[0] * (W - 8),
    H - 6 - p[1] * (H - 12),
  ];
  const at = (x: number) => {
    let best = points[0];
    for (const p of points) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
    return toBox(best);
  };
  return (
    <Sketch label={label}>
      <line className="al-sketch__axis" x1={4} y1={H - 6} x2={W - 4} y2={H - 6} />
      {dashed && <path className="al-sketch__threshold" d={pathOf(dashed.map(toBox))} />}
      <path className="al-sketch__line" d={pathOf(points.map(toBox))} />
      {marks.map((x, i) => {
        const [cx, cy] = at(x);
        return <circle key={i} className="al-sketch__mark" cx={cx} cy={cy} r={2.6} />;
      })}
    </Sketch>
  );
}

export interface SketchTimelineProps {
  /** Wider box (200 × 64), for a lane with several targets. */
  wide?: boolean;
  /** Target times in [0, 1]. */
  targets: readonly number[];
  /** Detected onsets in [0, 1] (red dots). */
  dots?: readonly number[];
  /** Half width of the tolerance band around the hit line, in [0, 1]. */
  band?: number;
  /** x of the hit line in [0, 1]. Default 0.25. */
  hit?: number;
  /** Beat lines in [0, 1]. */
  beats?: readonly number[];
  label?: string;
}

/** A play-along lane: targets, the hit line and its band, onsets as dots. */
export function SketchTimeline({
  targets,
  dots = [],
  band,
  hit = 0.25,
  beats = [],
  wide = false,
  label,
}: SketchTimelineProps) {
  const width = wide ? 200 : W;
  const x = (t: number) => 4 + t * (width - 8);
  const mid = H / 2;
  return (
    <Sketch label={label} width={width}>
      {beats.map((b, i) => (
        <line key={i} className="al-sketch__axis" x1={x(b)} x2={x(b)} y1={8} y2={H - 8} />
      ))}
      {band !== undefined && (
        <rect
          className="al-sketch__band"
          x={x(hit - band)}
          y={6}
          width={x(hit + band) - x(hit - band)}
          height={H - 12}
          rx={2}
        />
      )}
      <line className="al-sketch__hit" x1={x(hit)} x2={x(hit)} y1={4} y2={H - 4} />
      {targets.map((t, i) => (
        <rect
          key={i}
          className="al-sketch__bar al-sketch__bar--on"
          x={x(t) - 2.5}
          y={mid - 10}
          width={5}
          height={20}
          rx={1.5}
        />
      ))}
      {dots.map((t, i) => (
        <circle key={i} className="al-sketch__dot" cx={x(t)} cy={mid + 17} r={2.6} />
      ))}
    </Sketch>
  );
}

export interface SketchMeterProps {
  /** Level, background and threshold in [0, 1] along the meter. */
  level: number;
  floor?: number;
  threshold?: number;
  label?: string;
}

/** A level meter with the learnt background and the threshold above it. */
export function SketchMeter({ level, floor, threshold, label }: SketchMeterProps) {
  const x = (v: number) => 6 + v * (W - 12);
  return (
    <Sketch label={label}>
      <rect className="al-sketch__track" x={6} y={H / 2 - 6} width={W - 12} height={12} rx={3} />
      <rect
        className="al-sketch__fill"
        x={6}
        y={H / 2 - 6}
        width={x(level) - 6}
        height={12}
        rx={3}
      />
      {floor !== undefined && (
        <line
          className="al-sketch__floor"
          x1={x(floor)}
          x2={x(floor)}
          y1={H / 2 - 11}
          y2={H / 2 + 11}
        />
      )}
      {threshold !== undefined && (
        <line
          className="al-sketch__hit"
          x1={x(threshold)}
          x2={x(threshold)}
          y1={H / 2 - 13}
          y2={H / 2 + 13}
        />
      )}
    </Sketch>
  );
}

export interface SketchLabelProps {
  /** Main text (a note, a key, a number). */
  text: string;
  /** Smaller text under it. */
  sub?: string;
  label?: string;
}

/** A result in big type: "C major", "82 Hz", "+12 ms". */
export function SketchLabel({ text, sub, label }: SketchLabelProps) {
  return (
    <Sketch label={label}>
      <text
        className="al-sketch__big"
        x={W / 2}
        y={sub ? H / 2 + 2 : H / 2 + 8}
        textAnchor="middle"
      >
        {text}
      </text>
      {sub && (
        <text className="al-sketch__sub" x={W / 2} y={H / 2 + 18} textAnchor="middle">
          {sub}
        </text>
      )}
    </Sketch>
  );
}

export interface SketchChainItem {
  sketch: ReactNode;
  caption?: string;
  /** Give the step more room (a wide timeline). */
  wide?: boolean;
}

export interface SketchChainProps {
  items: readonly SketchChainItem[];
  /** Text alternative for the whole chain. */
  label?: string;
}

/** Sketches in a row, joined by arrows, each with a caption. Wraps on narrow screens. */
export function SketchChain({ items, label }: SketchChainProps) {
  return (
    <figure className="al-sketch-chain" role={label ? "img" : undefined} aria-label={label}>
      {items.map((item, i) => (
        <div
          className={
            item.wide
              ? "al-sketch-chain__step al-sketch-chain__step--wide"
              : "al-sketch-chain__step"
          }
          key={i}
        >
          {i > 0 && (
            <span className="al-sketch-chain__arrow" aria-hidden="true">
              →
            </span>
          )}
          <div className="al-sketch-chain__cell">
            {item.sketch}
            {item.caption && <span className="al-sketch-chain__caption">{item.caption}</span>}
          </div>
        </div>
      ))}
    </figure>
  );
}
