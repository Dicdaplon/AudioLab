"use client";

/**
 * A rhythm (or a melody) written as on a score, in SVG.
 *
 * Without pitches it is the one-line rhythm staff: only durations matter,
 * and a single line is what has always been written for that. With pitches
 * it is a five-line treble staff with the guitar's "8" (written an octave
 * above the sound). Chord symbols can sit above the notes, and the count
 * ("1 & 2 & …") below.
 *
 * Time is proportional: a beat is always the same width, so the notes sit
 * above the beats of a play-along lane or a counting row, and the scale is
 * isotropic (the SVG keeps its viewBox ratio), so a note head stays round at
 * every width. Long rhythms wrap every `barsPerLine` bars.
 *
 * Live parts are drawn without re-rendering: `cursor()` (the current beat)
 * moves a line, `dots()` (the beats where notes were heard) places red dots,
 * both read on every animation frame. `states` colours each note with its
 * verdict.
 */

import { useEffect, useRef } from "react";

import {
  beamGroups,
  figureName,
  figureOf,
  staffStep,
  type NoteFigure,
  type RhythmEvent,
} from "@audiolab/core/rhythm";
import type { LaneTargetState } from "../ui/laneDraw";

const BEAT = 100;
const HEAD_RX = 11;
const HEAD_RY = 8;
const STEM = 46;
const BEAM_GAP = 12;
const SPACE = 12; // between two lines of the five-line staff
const E4 = 4 * 7 + 2; // written bottom line of the treble staff

export interface StaffDot {
  /** Beat where a note was heard. */
  beat: number;
  /** A metronome click, not a note (grey). */
  echo?: boolean;
}

export interface StaffNotationProps {
  events: readonly RhythmEvent[];
  /** Beats per bar. Default 4. */
  beatsPerBar?: number;
  /** Sounding MIDI note of each event (null for rests): five-line staff. */
  pitches?: readonly (number | null)[];
  /** Written = sounding + transpose, in semitones. Default 12 (guitar, treble 8). */
  transpose?: number;
  /** Chord symbols above events ("Em", "C"…), by event index. */
  symbols?: readonly (string | undefined)[];
  /** Verdict of each event, by event index. */
  states?: readonly (LaneTargetState | undefined)[];
  /** Bars per line. Default 4. */
  barsPerLine?: number;
  /** Write "1 & 2 & …" under the staff. Default false. */
  count?: boolean;
  /** Current beat, read every frame (a cursor line), or null. */
  cursor?: () => number | null;
  /** Beats where notes were heard, read every frame (red dots). */
  dots?: () => readonly StaffDot[];
  /** Accessible name. Default: the figures, in order. */
  label?: string;
  className?: string;
}

interface Placed {
  index: number;
  event: RhythmEvent;
  figure: NoteFigure;
  x: number;
  /** Head centre y. */
  y: number;
  /** Stem goes up. */
  up: boolean;
  sharp: boolean;
  /** Written diatonic step (five-line only). */
  step: number | null;
}

function restGlyph(x: number, line: number, f: NoteFigure, key: string) {
  if (f.base >= 4) {
    return (
      <rect
        key={key}
        className="al-staff__rest-block"
        x={x - 11}
        y={line - 12}
        width={22}
        height={7}
      />
    );
  }
  if (f.base >= 2) {
    return (
      <rect
        key={key}
        className="al-staff__rest-block"
        x={x - 11}
        y={line - 7}
        width={22}
        height={7}
      />
    );
  }
  if (f.base >= 1) {
    return (
      <polyline
        key={key}
        className="al-staff__rest"
        points={`${x - 5},${line - 22} ${x + 5},${line - 9} ${x - 4},${line + 1} ${x + 5},${line + 13}`}
      />
    );
  }
  return (
    <g key={key} className="al-staff__rest-short">
      <line x1={x + 5} y1={line - 14} x2={x - 3} y2={line + 14} />
      {Array.from({ length: f.flags }, (_, c) => (
        <circle key={c} cx={x - 3} cy={line - 11 + c * 10} r={4} />
      ))}
    </g>
  );
}

export function StaffNotation({
  events,
  beatsPerBar = 4,
  pitches,
  transpose = 12,
  symbols,
  states,
  barsPerLine = 4,
  count = false,
  cursor,
  dots,
  label,
  className,
}: StaffNotationProps) {
  const fiveLine = pitches !== undefined;
  const lineBeats = beatsPerBar * barsPerLine;
  const total = events.reduce((s, e) => Math.max(s, e.beat + e.duration), 0);
  const lines = Math.max(1, Math.ceil(total / lineBeats - 1e-6));
  const margin = fiveLine ? 88 : 60;
  const top = symbols ? 34 : 14;
  // Staff geometry inside one system.
  const bottomLine = fiveLine ? top + 30 + 4 * SPACE : top + 34; // y of the bottom (or only) line
  const staffTop = fiveLine ? bottomLine - 4 * SPACE : bottomLine;
  const dotY = bottomLine + (fiveLine ? 62 : 26);
  const height = dotY + 12 + (count ? 22 : 0);
  // A single line is as long as the rhythm; several lines share one length.
  const systemBeats =
    lines === 1
      ? Math.max(beatsPerBar, Math.ceil(total / beatsPerBar - 1e-6) * beatsPerBar)
      : lineBeats;
  const width = margin + systemBeats * BEAT + 12;
  const beams = beamGroups(events);
  const groupOf = new Map<number, number[]>();
  for (const g of beams) for (const i of g) groupOf.set(i, g);

  const placed: Placed[] = events.map((event, index) => {
    const figure = figureOf(event.duration);
    const local = event.beat % lineBeats;
    const x = margin + local * BEAT + 24;
    if (!fiveLine || event.rest || pitches?.[index] == null) {
      return { index, event, figure, x, y: bottomLine, up: true, sharp: false, step: null };
    }
    const { step, sharp } = staffStep(pitches[index]! + transpose);
    const y = bottomLine - (step - E4) * (SPACE / 2);
    return { index, event, figure, x, y, up: step < E4 + 4, sharp, step };
  });

  // Stem direction is shared by a beam group (the majority of its notes).
  for (const g of beams) {
    if (g.length < 2) continue;
    const ups = g.filter((i) => placed[i].up).length;
    for (const i of g) placed[i].up = ups * 2 >= g.length;
  }

  const name = label ?? events.map((e) => figureName(figureOf(e.duration), e.rest)).join(", ");

  // Live cursor and dots, drawn imperatively.
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);
  useEffect(() => {
    if ((!cursor && !dots) || typeof requestAnimationFrame !== "function") return;
    let handle = 0;
    let lastDots = "";
    const ns = "http://www.w3.org/2000/svg";
    const frame = () => {
      const beat = cursor?.() ?? null;
      svgRefs.current.forEach((svg, line) => {
        if (!svg) return;
        const c = svg.querySelector<SVGLineElement>(".al-staff__cursor");
        if (c) {
          const local = beat === null ? -1 : beat - line * lineBeats;
          const visible = local >= 0 && local <= lineBeats;
          // On the beat's note heads, which sit 24 units after the beat.
          const x = String(margin + Math.max(0, local) * BEAT + 24);
          c.setAttribute("x1", x);
          c.setAttribute("x2", x);
          c.style.opacity = visible ? "1" : "0";
        }
      });
      const list = dots?.() ?? [];
      const key = list.map((d) => `${d.beat.toFixed(3)}${d.echo ? "e" : ""}`).join(",");
      if (key !== lastDots) {
        lastDots = key;
        svgRefs.current.forEach((svg, line) => {
          const g = svg?.querySelector(".al-staff__dots");
          if (!g) return;
          while (g.firstChild) g.removeChild(g.firstChild);
          for (const d of list) {
            const local = d.beat - line * lineBeats;
            if (local < -0.25 || local > lineBeats + 0.25) continue;
            const circle = document.createElementNS(ns, "circle");
            circle.setAttribute("cx", String(margin + local * BEAT + 24));
            circle.setAttribute("cy", String(dotY));
            circle.setAttribute("r", d.echo ? "3" : "5");
            circle.setAttribute(
              "class",
              d.echo ? "al-staff__dot al-staff__dot--echo" : "al-staff__dot",
            );
            g.appendChild(circle);
          }
        });
      }
      handle = requestAnimationFrame(frame);
    };
    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, [cursor, dots, lineBeats, margin, dotY]);

  return (
    <div className={className ? `al-staff ${className}` : "al-staff"} role="img" aria-label={name}>
      {Array.from({ length: lines }, (_, line) => {
        const from = line * lineBeats;
        const inLine = placed.filter(
          (p) => p.event.beat >= from - 1e-6 && p.event.beat < from + lineBeats - 1e-6,
        );
        const lastBeat = Math.min(lineBeats, total - from);
        const staffRight = margin + lastBeat * BEAT;
        return (
          <svg
            key={line}
            ref={(el) => {
              svgRefs.current[line] = el;
            }}
            className="al-staff__system"
            viewBox={`0 0 ${width} ${height}`}
            style={{ aspectRatio: `${width} / ${height}` }}
            aria-hidden="true"
          >
            {/* Staff lines. */}
            {(fiveLine ? [0, 1, 2, 3, 4] : [0]).map((i) => (
              <line
                key={`l${i}`}
                className="al-staff__line"
                x1={fiveLine ? 4 : margin - 16}
                x2={staffRight}
                y1={staffTop + i * SPACE}
                y2={staffTop + i * SPACE}
              />
            ))}
            {fiveLine ? (
              <g className="al-staff__clef">
                <text x={8} y={bottomLine + 6}>
                  𝄞
                </text>
                <text className="al-staff__clef-eight" x={26} y={bottomLine + 30}>
                  8
                </text>
              </g>
            ) : (
              <g className="al-staff__clef-percussion">
                <rect x={10} y={bottomLine - 12} width={4} height={24} />
                <rect x={18} y={bottomLine - 12} width={4} height={24} />
              </g>
            )}
            {line === 0 && (
              <g className="al-staff__time">
                <text x={margin - 26} y={fiveLine ? staffTop + 2 * SPACE - 1 : bottomLine - 2}>
                  {beatsPerBar}
                </text>
                <text x={margin - 26} y={fiveLine ? bottomLine - 1 : bottomLine + 18}>
                  4
                </text>
              </g>
            )}

            {/* Bar lines. */}
            {Array.from({ length: Math.floor(lastBeat / beatsPerBar) + 1 }, (_, b) => {
              const x = margin + b * beatsPerBar * BEAT;
              if (b === 0) return null;
              return (
                <line
                  key={`b${b}`}
                  className="al-staff__bar"
                  x1={x}
                  x2={x}
                  y1={fiveLine ? staffTop : bottomLine - 22}
                  y2={fiveLine ? bottomLine : bottomLine + 22}
                />
              );
            })}

            {/* Notes, rests, ledger lines, sharps, dots, stems and flags. */}
            {inLine.map((p) => {
              const key = `n${p.index}`;
              const state = states?.[p.index];
              if (p.event.rest) {
                return restGlyph(p.x, fiveLine ? staffTop + 2 * SPACE : bottomLine, p.figure, key);
              }
              const ledgers: number[] = [];
              if (p.step !== null) {
                for (let s = E4 - 2; s >= p.step; s -= 2)
                  ledgers.push(bottomLine + ((E4 - s) * SPACE) / 2);
                for (let s = E4 + 10; s <= p.step; s += 2)
                  ledgers.push(bottomLine - ((s - E4) * SPACE) / 2);
              }
              const group = groupOf.get(p.index) ?? [p.index];
              const beamed = group.length > 1;
              const stemX = p.up ? p.x + HEAD_RX - 1 : p.x - HEAD_RX + 1;
              const stemEnd = p.up ? p.y - STEM : p.y + STEM;
              return (
                <g key={key} className="al-staff__note" data-state={state}>
                  {ledgers.map((ly, i) => (
                    <line
                      key={i}
                      className="al-staff__ledger"
                      x1={p.x - 17}
                      x2={p.x + 17}
                      y1={ly}
                      y2={ly}
                    />
                  ))}
                  {p.sharp && (
                    <text className="al-staff__accidental" x={p.x - 30} y={p.y + 6}>
                      ♯
                    </text>
                  )}
                  <ellipse
                    className={
                      p.figure.hollow ? "al-staff__head al-staff__head--hollow" : "al-staff__head"
                    }
                    cx={p.x}
                    cy={p.y}
                    rx={HEAD_RX}
                    ry={HEAD_RY}
                    transform={`rotate(-20 ${p.x} ${p.y})`}
                  />
                  {p.figure.dotted && (
                    <circle className="al-staff__dot-value" cx={p.x + 19} cy={p.y - 3} r={3} />
                  )}
                  {p.figure.stem && !beamed && (
                    <line className="al-staff__stem" x1={stemX} x2={stemX} y1={p.y} y2={stemEnd} />
                  )}
                  {p.figure.flags > 0 &&
                    !beamed &&
                    Array.from({ length: p.figure.flags }, (_, f) => {
                      const y0 = stemEnd + (p.up ? f * 10 : -f * 10);
                      const dir = p.up ? 1 : -1;
                      return (
                        <path
                          key={f}
                          className="al-staff__flag"
                          d={`M${stemX},${y0} q 14,${6 * dir} 10,${22 * dir}`}
                        />
                      );
                    })}
                  {symbols?.[p.index] && (
                    <text className="al-staff__symbol" x={p.x - 8} y={14}>
                      {symbols[p.index]}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Beams: stems of the group meet one (or two) bars. */}
            {beams
              .filter((g) => g.length > 1 && inLine.some((p) => p.index === g[0]))
              .map((g) => {
                const notes = g.map((i) => placed[i]);
                const up = notes[0].up;
                const ys = notes.map((n) => n.y);
                const beamY = up ? Math.min(...ys) - STEM : Math.max(...ys) + STEM;
                const xs = notes.map((n) => (up ? n.x + HEAD_RX - 1 : n.x - HEAD_RX + 1));
                const levels = Math.max(...notes.map((n) => n.figure.flags));
                return (
                  <g key={`beam${g[0]}`} className="al-staff__beam" data-state={states?.[g[0]]}>
                    {notes.map((n, i) => (
                      <line
                        key={i}
                        className="al-staff__stem"
                        x1={xs[i]}
                        x2={xs[i]}
                        y1={n.y}
                        y2={beamY}
                      />
                    ))}
                    {Array.from({ length: levels }, (_, l) => (
                      <rect
                        key={l}
                        className="al-staff__beam-bar"
                        x={xs[0]}
                        y={up ? beamY + l * BEAM_GAP : beamY - 6 - l * BEAM_GAP}
                        width={xs[xs.length - 1] - xs[0] + 1.5}
                        height={6}
                      />
                    ))}
                  </g>
                );
              })}

            {count &&
              Array.from({ length: lastBeat * 2 }, (_, slot) => (
                <text
                  key={`c${slot}`}
                  className={
                    slot % 2 === 0 ? "al-staff__count al-staff__count--beat" : "al-staff__count"
                  }
                  x={margin + (slot / 2) * BEAT + 24}
                  y={height - 6}
                  textAnchor="middle"
                >
                  {slot % 2 === 0 ? String(((slot / 2) % beatsPerBar) + 1) : "&"}
                </text>
              ))}

            <g className="al-staff__dots" />
            <line
              className="al-staff__cursor"
              x1={margin}
              x2={margin}
              y1={staffTop - 18}
              y2={bottomLine + 18}
            />
          </svg>
        );
      })}
    </div>
  );
}
