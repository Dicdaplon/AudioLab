import { useCallback, useMemo, useState } from "react";
import { beatAt, beatTime, type BeatGrid } from "@audiolab/core";
import {
  medianOf,
  playedBeats,
  rhythmLength,
  toleranceFromUncertainty,
} from "@audiolab/core/rhythm";
import { PlayAlongLane, SelectField, StaffNotation, laneTarget } from "@audiolab/react";

import { VERDICT_TEXT, type ExerciseEnv } from "./env";
import { RHYTHM_PATTERNS, patternEvents } from "./exercises";
import { staffStates } from "./staffState";

/** A rhythm scrolls to the line, written above as on a score: play each mark as it reaches the line. */
export function RhythmLane({ env }: { env: ExerciseEnv }) {
  const { play, budget, sampleRate, running, now, bpm, metronome } = env;
  const [patternId, setPatternId] = useState(RHYTHM_PATTERNS[2].id);
  const pattern = RHYTHM_PATTERNS.find((p) => p.id === patternId) ?? RHYTHM_PATTERNS[0];
  const events = useMemo(() => patternEvents(pattern, 2), [pattern]);
  const tolerance = budget ? toleranceFromUncertainty(budget.uncertaintyMs) : null;
  // The grid of the current (or last) run, kept once the metronome stops.
  const [runGrid, setRunGrid] = useState<BeatGrid | null>(null);
  const grid = metronome.metronome?.grid ?? null;

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
      playedBeats(events).map((b, i) => ({ id: i, time: beatTime(m.grid, b) })),
      {
        sampleRate,
        tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
        offsetMs: budget.offsetMs,
        // Without a measured offset, the first notes correct it.
        adaptiveBias: !budget.calibrated,
        clickTimes: () => m.clickTimes,
      },
      beatTime(m.grid, rhythmLength(events) + 0.5),
    );
  };

  const stop = () => {
    play.stop();
    metronome.stop();
  };

  const results = play.results;
  let message =
    "Play each note as it reaches the line. Muted strums or taps on the guitar are fine.";
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
      <StaffNotation
        events={events}
        states={staffStates(events, results)}
        cursor={cursor}
        dots={dots}
        count
        label={`${pattern.name}, played twice`}
      />
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
