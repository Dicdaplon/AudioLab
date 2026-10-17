import { useMemo, useState } from "react";
import type { MicSource } from "@audiolab/core";
import { MicPrompt, Panel, SelectField, useOnsetAnalysis } from "@audiolab/react";

import { ListeningPanel } from "./ListeningPanel";
import { createOnsetBus } from "./onsetBus";
import { ScrollingLane } from "./ScrollingLane";
import { TimingPanel } from "./TimingPanel";
import { WrittenRhythm } from "./WrittenRhythm";

type Exercise = "written" | "notes" | "chords";

const EXERCISES: ReadonlyArray<{ id: Exercise; label: string }> = [
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
 * Onset timing showcase: latency diagnostics, the automatic gate and three
 * exercises (a written rhythm at a free tempo, notes and chords to play on
 * a line), all on one live onset analysis.
 */
export function RhythmTab({ mic, running, onStart }: RhythmTabProps) {
  const [exercise, setExercise] = useState<Exercise>("written");
  const bus = useMemo(createOnsetBus, []);
  const { snapshot, budget, analysis, captureMethod } = useOnsetAnalysis(mic, {
    strummed: exercise === "chords",
    onOnset: (onset, history) => bus.emitOnset(onset, history),
    onBatch: (history, analysedTime) => bus.emitBatch(history, analysedTime),
  });

  return (
    <div className="rhythm">
      {!running && <MicPrompt message="Start the microphone, then play along." onStart={onStart} />}

      <Panel title="Play in time" as="section" className="rhythm__play">
        <SelectField
          id="rhythm-exercise"
          label="Exercise"
          value={exercise}
          onChange={(v) => setExercise(v as Exercise)}
        >
          {EXERCISES.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </SelectField>
        {exercise === "written" ? (
          <WrittenRhythm bus={bus} running={running} />
        ) : (
          <ScrollingLane
            mode={exercise}
            bus={bus}
            analysis={analysis}
            budget={budget}
            sampleRate={mic?.context.sampleRate ?? 48000}
            running={running}
          />
        )}
      </Panel>

      <div className="rhythm__diagnostics">
        <ListeningPanel snapshot={snapshot} analysis={analysis} />
        <TimingPanel snapshot={snapshot} budget={budget} captureMethod={captureMethod} />
      </div>
    </div>
  );
}
