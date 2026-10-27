import { useCallback, useState } from "react";
import { beatAt, beatTime, chordName, pitchClassName, type BeatGrid } from "@audiolab/core";
import { chordKey } from "@audiolab/core/games";
import {
  chordLabeler,
  noteLabel,
  noteLabeler,
  rhythmLength,
  scoreSigmaFor,
  TIMING_TOLERANCE_DEFAULTS,
  toleranceFromUncertainty,
} from "@audiolab/core/rhythm";
import { PlayAlongLane, ScoreCard, StaffNotation, laneTarget } from "@audiolab/react";

import { VERDICT_TEXT, type ExerciseEnv } from "./env";
import { SCROLL_SEQUENCES, type ScrollMode } from "./exercises";
import { staffStates } from "./staffState";

/**
 * Notes (or chords) scroll to the line, written above as on a score; each
 * is graded on timing and on what was played.
 */
export function ScrollingLane({ mode, env }: { mode: ScrollMode; env: ExerciseEnv }) {
  const { play, budget, sampleRate, running, now, bpm, metronome } = env;
  const sequence = SCROLL_SEQUENCES[mode];
  const { events } = sequence;
  const noun = mode === "notes" ? "note" : "chord";
  const grid = metronome.metronome?.grid ?? null;
  const [runGrid, setRunGrid] = useState<BeatGrid | null>(null);
  const tolerance = budget ? toleranceFromUncertainty(budget.uncertaintyMs) : null;
  const names = events.map((_, i) =>
    sequence.chords
      ? chordName(sequence.chords[i].root, sequence.chords[i].quality)
      : pitchClassName(sequence.midi![i] % 12),
  );

  const cursor = useCallback(() => {
    const t = now();
    return grid && t !== null ? beatAt(grid, t) : null;
  }, [grid, now]);
  const dots = useCallback(
    () =>
      runGrid ? play.onsets().map((o) => ({ beat: beatAt(runGrid, o.time), echo: o.echo })) : [],
    [runGrid, play],
  );

  const start = () => {
    if (!budget) return;
    const m = metronome.start({ bpm, beatsPerBar: 4, sound: metronome.sound });
    if (!m) return;
    setRunGrid(m.grid);
    play.start(
      events.map((e, i) => ({
        id: i,
        time: beatTime(m.grid, e.beat),
        label: sequence.chords ? chordKey(sequence.chords[i]) : noteLabel(sequence.midi![i]),
      })),
      {
        sampleRate,
        tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
        offsetMs: budget.offsetMs,
        adaptiveBias: !budget.calibrated,
        labeler:
          mode === "notes"
            ? noteLabeler(sampleRate, env.noteLabel)
            : chordLabeler(sampleRate, env.chordLabel),
        clickTimes: () => m.clickTimes,
      },
      beatTime(m.grid, rhythmLength(events)),
    );
  };

  const stop = () => {
    play.stop();
    metronome.stop();
  };

  const results = play.results;
  let message =
    mode === "notes"
      ? "Play each note when it reaches the line."
      : "Strum each chord when it reaches the line.";
  if (!running) message = "Start the microphone first.";
  else if (play.done && results) {
    const onTime = results.filter((r) => r.tier === "onTime").length;
    const right = results.filter((r) => r.label === "correct").length;
    message = `${onTime} of ${results.length} on time, ${right} right ${noun}s.`;
  } else if (results) {
    const last = results.filter((r) => r.resolved).at(-1);
    if (last) {
      const verdict = VERDICT_TEXT[last.tier ?? "missed"];
      const label =
        last.label === "wrong"
          ? `, wrong ${noun}`
          : last.label === "unheard"
            ? `, ${noun} unclear`
            : "";
      message = `${verdict}${label}.`;
    }
  }

  return (
    <div className="rhythm__exercise">
      <div className="rhythm__controls">
        <button
          type="button"
          className="al-btn al-btn--accent"
          onClick={play.active ? stop : start}
          disabled={!running || !budget}
        >
          {play.active ? "Stop" : results ? "Again" : "Start"}
        </button>
      </div>
      <StaffNotation
        events={events}
        pitches={sequence.midi}
        symbols={sequence.chords ? names : undefined}
        states={staffStates(events, results)}
        cursor={cursor}
        dots={dots}
        barsPerLine={mode === "notes" ? 3 : 4}
        label={mode === "notes" ? `Open strings: ${names.join(" ")}` : `Chords: ${names.join(" ")}`}
      />
      <PlayAlongLane
        now={now}
        grid={grid}
        tolerance={tolerance}
        onsets={play.onsets}
        targets={(results ?? []).map((r, i) => laneTarget(r, names[i]))}
        geometry={mode === "chords" ? { targetRadius: 22 } : undefined}
        label={`${noun}s scroll to the line`}
      />
      <p className="rhythm__legend">
        Band: the on-time zone. Red dot: when your {noun} was heard. Red ring: a wrong {noun}.
      </p>
      <p className="rhythm__message" role="status">
        {message}
      </p>
      {results && (
        <ScoreCard
          results={results}
          strays={play.strays}
          sigmaMs={scoreSigmaFor(tolerance ?? TIMING_TOLERANCE_DEFAULTS)}
          done={play.done}
          labels={names}
        />
      )}
    </div>
  );
}
