import { beatTime, chordName, pitchClassName } from "@audiolab/core";
import { chordKey } from "@audiolab/core/games";
import {
  chordLabeler,
  noteLabel,
  noteLabeler,
  toleranceFromUncertainty,
} from "@audiolab/core/rhythm";
import { PlayAlongLane, laneTarget } from "@audiolab/react";

import { VERDICT_TEXT, type ExerciseEnv } from "./env";
import { SCROLL_SEQUENCES, type ScrollMode } from "./exercises";

/** Notes (or chords) scroll to the line; each is graded on timing and on what was played. */
export function ScrollingLane({ mode, env }: { mode: ScrollMode; env: ExerciseEnv }) {
  const { play, budget, sampleRate, running, now, bpm, metronome } = env;
  const sequence = SCROLL_SEQUENCES[mode];
  const noun = mode === "notes" ? "note" : "chord";
  const grid = metronome.metronome?.grid ?? null;
  const tolerance = budget ? toleranceFromUncertainty(budget.uncertaintyMs) : null;
  const names = sequence.steps.map((step) =>
    step.chord ? chordName(step.chord.root, step.chord.quality) : pitchClassName(step.note!),
  );

  const start = () => {
    if (!budget) return;
    const m = metronome.start({ bpm, beatsPerBar: 4, sound: metronome.sound });
    if (!m) return;
    const lastBeat = sequence.steps[sequence.steps.length - 1].beat;
    play.start(
      sequence.steps.map((step, i) => ({
        id: i,
        time: beatTime(m.grid, step.beat),
        label: step.chord ? chordKey(step.chord) : noteLabel(step.note!),
      })),
      {
        sampleRate,
        tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
        offsetMs: budget.offsetMs,
        adaptiveBias: !budget.calibrated,
        labeler: mode === "notes" ? noteLabeler(sampleRate) : chordLabeler(sampleRate),
        clickTimes: () => m.clickTimes,
      },
      beatTime(m.grid, lastBeat + 1),
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
    </div>
  );
}
