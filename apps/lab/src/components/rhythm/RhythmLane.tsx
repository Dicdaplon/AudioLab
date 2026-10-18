import { useState } from "react";
import { beatTime } from "@audiolab/core";
import { medianOf, toleranceFromUncertainty } from "@audiolab/core/rhythm";
import { PlayAlongLane, SelectField, laneTarget } from "@audiolab/react";

import { VERDICT_TEXT, type ExerciseEnv } from "./env";
import { RHYTHM_PATTERNS, repeatPattern } from "./exercises";

/** A rhythm scrolls to the line: play (or tap) each mark as it reaches it. */
export function RhythmLane({ env }: { env: ExerciseEnv }) {
  const { play, budget, sampleRate, running, now, bpm, metronome } = env;
  const [patternId, setPatternId] = useState(RHYTHM_PATTERNS[1].id);
  const pattern = RHYTHM_PATTERNS.find((p) => p.id === patternId) ?? RHYTHM_PATTERNS[0];
  const tolerance = budget ? toleranceFromUncertainty(budget.uncertaintyMs) : null;
  const grid = metronome.metronome?.grid ?? null;

  const start = () => {
    if (!budget) return;
    const m = metronome.start({ bpm, beatsPerBar: 4, sound: metronome.sound });
    if (!m) return;
    const beats = repeatPattern(pattern.beats, 2);
    play.start(
      beats.map((b, i) => ({ id: i, time: beatTime(m.grid, b) })),
      {
        sampleRate,
        tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
        offsetMs: budget.offsetMs,
        // Without a measured offset, the first notes correct it.
        adaptiveBias: !budget.calibrated,
        clickTimes: () => m.clickTimes,
      },
      beatTime(m.grid, beats[beats.length - 1] + 1),
    );
  };

  const stop = () => {
    play.stop();
    metronome.stop();
  };

  const results = play.results;
  let message =
    "Play each mark as it reaches the line. Muted strums or taps on the guitar are fine.";
  if (!running) message = "Start the microphone first.";
  else if (play.active && results && !results.some((r) => r.resolved)) {
    message = "Listen to the count-in, then play from the next bar.";
  } else if (play.done && results) {
    const onTime = results.filter((r) => r.tier === "onTime").length;
    const deltas = results.flatMap((r) => (r.deltaMs === null ? [] : [r.deltaMs]));
    const tendency = medianOf(deltas);
    let hint = "";
    if (budget?.calibrated && deltas.length >= 4 && Math.abs(tendency) > 25) {
      hint = tendency < 0 ? " You tend to rush." : " You tend to drag.";
    }
    message = `${onTime} of ${results.length} on time.${hint}`;
  } else if (results) {
    const last = results.filter((r) => r.resolved).at(-1);
    if (last) message = `${VERDICT_TEXT[last.tier ?? "missed"]}.`;
  }

  return (
    <div className="rhythm__exercise">
      <div className="rhythm__controls">
        <SelectField
          id="rhythm-lane-pattern"
          label="Rhythm"
          value={patternId}
          onChange={(v) => {
            stop();
            setPatternId(v);
          }}
        >
          {RHYTHM_PATTERNS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
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
        targets={(results ?? []).map((r) => laneTarget(r))}
        label="Rhythm lane: marks scroll to the line"
      />
      <p className="rhythm__legend">
        Band: the on-time zone. Red dot: when your note was heard.
        {metronome.sound ? " Grey dot: the click, heard by the microphone." : ""}
      </p>
      <p className="rhythm__message" role="status">
        {message}
      </p>
    </div>
  );
}
