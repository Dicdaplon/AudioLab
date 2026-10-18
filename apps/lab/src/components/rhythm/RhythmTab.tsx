import { useCallback, useEffect, useMemo, useState } from "react";
import type { MicSource } from "@audiolab/core";
import {
  MicPrompt,
  Panel,
  SelectField,
  useMetronome,
  useOnsetAnalysis,
  usePlayAlong,
} from "@audiolab/react";

import type { ExerciseEnv } from "./env";
import { ListeningPanel } from "./ListeningPanel";
import { MetronomeBar } from "./MetronomeBar";
import { createOnsetBus } from "./onsetBus";
import { RhythmLane } from "./RhythmLane";
import { ScrollingLane } from "./ScrollingLane";
import { TimingPanel } from "./TimingPanel";
import { WrittenRhythm } from "./WrittenRhythm";

type Exercise = "lane" | "written" | "notes" | "chords";

const EXERCISES: ReadonlyArray<{ id: Exercise; label: string }> = [
  { id: "lane", label: "Rhythm lane" },
  { id: "written", label: "Written rhythm" },
  { id: "notes", label: "Scrolling notes" },
  { id: "chords", label: "Scrolling chords" },
];

interface RhythmTabProps {
  mic: MicSource | null;
  running: boolean;
  onStart?: () => void;
}

/**
 * Onset timing showcase: four play-along exercises on a metronome (visual,
 * or with an audible click), the automatic gate with an onset timeline, and
 * the latency budget, all on one live onset analysis.
 */
export function RhythmTab({ mic, running, onStart }: RhythmTabProps) {
  const [exercise, setExercise] = useState<Exercise>("lane");
  const [bpm, setBpm] = useState(70);
  const bus = useMemo(createOnsetBus, []);
  const metronome = useMetronome(mic?.context ?? null);
  const play = usePlayAlong();

  const { snapshot, budget, analysis, captureMethod } = useOnsetAnalysis(mic, {
    strummed: exercise === "chords",
    reference: metronome.sound ? "audio" : "visual",
    roundTripMs: play.roundTripMs,
    roundTripSpreadMs: play.roundTripSpreadMs,
    onOnset: (onset, history) => {
      play.onOnset(onset);
      bus.emitOnset(onset, history);
    },
    onBatch: (history, analysedTime) => {
      play.onBatch(history, analysedTime);
      bus.emitBatch(history, analysedTime);
    },
  });

  // The metronome stops with the exercise.
  const stopMetronome = metronome.stop;
  useEffect(() => {
    if (play.done) stopMetronome();
  }, [play.done, stopMetronome]);

  const now = useCallback(
    () => analysis?.clock.perfMsToContextTime(performance.now()) ?? null,
    [analysis],
  );

  const env: ExerciseEnv = {
    bus,
    play,
    analysis,
    budget,
    sampleRate: mic?.context.sampleRate ?? 48000,
    running,
    now,
    bpm,
    metronome,
  };

  const changeExercise = (next: Exercise) => {
    play.stop();
    metronome.stop();
    setExercise(next);
  };

  return (
    <div className="rhythm">
      {!running && <MicPrompt message="Start the microphone, then play along." onStart={onStart} />}

      <Panel title="Play in time" as="section" className="rhythm__play">
        <div className="rhythm__setup">
          <SelectField
            id="rhythm-exercise"
            label="Exercise"
            value={exercise}
            onChange={(v) => changeExercise(v as Exercise)}
          >
            {EXERCISES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </SelectField>
          <MetronomeBar
            bpm={bpm}
            onBpmChange={setBpm}
            sound={metronome.sound}
            onSoundChange={metronome.setSound}
            grid={metronome.metronome?.grid ?? null}
            now={now}
          />
        </div>
        {metronome.sound && (
          <p className="rhythm__legend">
            With headphones the click stays out of the microphone. Without them, the page tells the
            click from your playing.
          </p>
        )}
        {exercise === "lane" && <RhythmLane key="lane" env={env} />}
        {exercise === "written" && <WrittenRhythm key="written" env={env} />}
        {(exercise === "notes" || exercise === "chords") && (
          <ScrollingLane key={exercise} mode={exercise} env={env} />
        )}
      </Panel>

      <div className="rhythm__diagnostics">
        <ListeningPanel snapshot={snapshot} analysis={analysis} />
        <TimingPanel snapshot={snapshot} budget={budget} captureMethod={captureMethod} />
      </div>
    </div>
  );
}
