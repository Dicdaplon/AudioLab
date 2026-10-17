import { useEffect, useRef, useState } from "react";
import {
  chordAfterOnset,
  chordName,
  chordReadyAt,
  noteAfterOnset,
  noteReadyAt,
  pitchClassName,
  type OnsetAnalysis,
  type StreamHistory,
  type TimingBudget,
} from "@audiolab/core";
import { chordKey } from "@audiolab/core/games";
import {
  TimingScorer,
  toleranceFromUncertainty,
  type ExpectedNote,
  type NoteResult,
} from "@audiolab/core/rhythm";
import { useVizTheme } from "@audiolab/react";

import { SCROLL_SEQUENCES, type ScrollMode } from "./exercises";
import { useOnsetBus, type OnsetBus } from "./onsetBus";

/** Seconds between Start and the first note reaching the line. */
const LEAD_SECONDS = 3;
/** Horizontal speed of the notes, in px per second. */
const PX_PER_SECOND = 140;
const HIT_X = 64;

interface PendingLabel {
  onsetId: number;
  frame: number;
  readyAt: number;
}

interface Run {
  scorer: TimingScorer;
  notes: ExpectedNote[];
  text: Map<string | number, string>;
  pending: PendingLabel[];
}

const VERDICT_TEXT: Record<string, string> = {
  onTime: "On time",
  early: "Early",
  late: "Late",
  missed: "Missed",
};

interface ScrollingLaneProps {
  mode: ScrollMode;
  bus: OnsetBus;
  analysis: OnsetAnalysis | null;
  budget: TimingBudget | null;
  sampleRate: number;
  running: boolean;
}

/** Notes (or chords) travel to a line; each one is graded on timing and on what was played. */
export function ScrollingLane({
  mode,
  bus,
  analysis,
  budget,
  sampleRate,
  running,
}: ScrollingLaneProps) {
  const runRef = useRef<Run | null>(null);
  const [results, setResults] = useState<readonly NoteResult[] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useVizTheme();
  const sequence = SCROLL_SEQUENCES[mode];
  const noun = mode === "notes" ? "note" : "chord";

  // A new mode or a lost microphone ends the run.
  useEffect(() => {
    runRef.current = null;
    setResults(null);
  }, [mode, analysis]);

  const start = () => {
    const now = analysis?.clock.perfMsToContextTime(performance.now());
    if (now === null || now === undefined || !budget) return;
    const beat = 60 / sequence.bpm;
    const notes: ExpectedNote[] = sequence.steps.map((step, i) => ({
      id: i,
      time: now + LEAD_SECONDS + step.beat * beat,
      label: step.chord ? chordKey(step.chord) : String(step.note),
    }));
    const text = new Map(
      sequence.steps.map((step, i) => [
        i,
        step.chord ? chordName(step.chord.root, step.chord.quality) : pitchClassName(step.note!),
      ]),
    );
    runRef.current = {
      scorer: new TimingScorer(notes, {
        tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
        offsetMs: budget.offsetMs,
        adaptiveBias: true,
      }),
      notes,
      text,
      pending: [],
    };
    setResults(runRef.current.scorer.results);
  };

  const labelOf = (history: StreamHistory, frame: number): string | null => {
    if (mode === "notes") {
      const pitch = noteAfterOnset(history, frame, sampleRate);
      return pitch ? String(pitch.pitchClass) : null;
    }
    const best = chordAfterOnset(history, frame, sampleRate)[0];
    return best ? chordKey(best) : null;
  };

  useOnsetBus(bus, {
    onOnset: (onset) => {
      const run = runRef.current;
      if (!run) return;
      const changed = run.scorer.onset({ id: onset.id, time: onset.time });
      const readyAt =
        mode === "notes"
          ? noteReadyAt(onset.frame, sampleRate)
          : chordReadyAt(onset.frame, sampleRate);
      run.pending.push({ onsetId: onset.id, frame: onset.frame, readyAt });
      if (changed.length > 0) setResults(run.scorer.results);
    },
    onBatch: (history, analysedTime) => {
      const run = runRef.current;
      if (!run) return;
      let changed = false;
      const available = history.range.to;
      run.pending = run.pending.filter((p) => {
        if (p.readyAt > available) return true;
        changed = run.scorer.label(p.onsetId, labelOf(history, p.frame)).length > 0 || changed;
        return false;
      });
      if (run.scorer.advance(analysedTime).length > 0) changed = true;
      if (changed) setResults(run.scorer.results);
    },
  });

  // Draw the lane on every animation frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || typeof requestAnimationFrame !== "function") return;
    let handle = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
      if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = theme.bed;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = theme.gridStrong;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(HIT_X, 8);
      ctx.lineTo(HIT_X, height - 8);
      ctx.stroke();

      const run = runRef.current;
      const now = analysis?.clock.perfMsToContextTime(performance.now()) ?? null;
      if (run && now !== null) {
        const mid = height / 2;
        const radius = mode === "notes" ? 16 : 20;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `600 13px ${theme.fontUi}`;
        run.notes.forEach((note, i) => {
          const x = HIT_X + (note.time - now) * PX_PER_SECOND;
          if (x < -radius || x > width + radius) return;
          const r = run.scorer.results[i];
          let fill = theme.signal;
          if (r.resolved) {
            fill =
              r.tier === "onTime" && r.label !== "wrong"
                ? theme.modeMajor
                : r.tier === "missed"
                  ? theme.danger
                  : theme.threshold;
          }
          ctx.globalAlpha = r.resolved ? 0.55 : 1;
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(x, mid, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = theme.bed;
          ctx.fillText(run.text.get(note.id) ?? "", x, mid);
        });
      }
      handle = requestAnimationFrame(draw);
    };
    handle = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(handle);
  }, [analysis, theme, mode]);

  const last = results?.filter((r) => r.resolved).at(-1);
  const done = results !== null && results.every((r) => r.resolved);
  let message =
    mode === "notes"
      ? "Play each note when it reaches the line."
      : "Strum each chord when it reaches the line.";
  if (!running) message = "Start the microphone first.";
  else if (done && results) {
    const onTime = results.filter((r) => r.tier === "onTime").length;
    const right = results.filter((r) => r.label === "correct").length;
    message = `${onTime} of ${results.length} on time, ${right} right ${noun}s.`;
  } else if (last) {
    const verdict = VERDICT_TEXT[last.tier ?? "missed"];
    const label =
      last.label === "wrong"
        ? `, wrong ${noun}`
        : last.label === "unheard"
          ? `, ${noun} unclear`
          : "";
    message = `${verdict}${label}.`;
  }

  return (
    <div className="rhythm__exercise">
      <div className="rhythm__controls">
        <button
          type="button"
          className="al-btn al-btn--accent"
          onClick={start}
          disabled={!running || !analysis || !budget}
        >
          {results ? "Again" : "Start"}
        </button>
        <span className="al-hint rhythm__tempo">{sequence.bpm} BPM</span>
      </div>
      <canvas ref={canvasRef} className="rhythm__lane" aria-hidden="true" />
      <p className="rhythm__message" role="status">
        {message}
      </p>
    </div>
  );
}
