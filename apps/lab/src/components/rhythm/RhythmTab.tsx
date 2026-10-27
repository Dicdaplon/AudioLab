import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadCrepeModelCached,
  type ChromaMethod,
  type CrepeModel,
  type MicSource,
} from "@audiolab/core";
import {
  MicPrompt,
  Panel,
  SelectField,
  useLatencyTest,
  useMetronome,
  useOnsetAnalysis,
  usePlayAlong,
} from "@audiolab/react";

import { PlayAlongHow } from "../../how/explanations";
import {
  CREPE_MODEL_URL,
  LABEL_CHROMA_METHODS,
  ONSET_METHODS,
  PITCH_METHODS,
  type OnsetMethodId,
  type PitchMethodId,
} from "../../methods";
import { MethodPicker } from "../MethodPicker";
import type { ExerciseEnv } from "./env";
import { useStoredLatency } from "./latencyStore";
import { LatencyTest } from "./LatencyTest";
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
  const [onsetMethod, setOnsetMethod] = useState<OnsetMethodId>("classic");
  const [noteMethod, setNoteMethod] = useState<PitchMethodId>("mpm");
  const [labelChroma, setLabelChroma] = useState<ChromaMethod>("nearest");
  const [crepe, setCrepe] = useState<{ model: CrepeModel | null; error: Error | null }>({
    model: null,
    error: null,
  });
  const [bpm, setBpm] = useState(70);
  const bus = useMemo(createOnsetBus, []);
  const metronome = useMetronome(mic?.context ?? null);
  const play = usePlayAlong();
  const latencyTest = useLatencyTest(mic?.context ?? null);
  const [latency, setLatency] = useStoredLatency();

  const { snapshot, budget, analysis, captureMethod } = useOnsetAnalysis(mic, {
    method: onsetMethod,
    strummed: exercise === "chords",
    reference: metronome.sound ? "audio" : "visual",
    roundTripMs: play.roundTripMs,
    roundTripSpreadMs: play.roundTripSpreadMs,
    // Set by ear, with the click: it applies when the click sounds.
    calibration: latency,
    onOnset: (onset, history) => {
      play.onOnset(onset);
      latencyTest.onOnset(onset);
      bus.emitOnset(onset, history);
    },
    onBatch: (history, analysedTime) => {
      play.onBatch(history, analysedTime);
      latencyTest.onBatch(history, analysedTime);
      bus.emitBatch(history, analysedTime);
    },
  });

  // The CREPE model, fetched once when its note method is picked.
  useEffect(() => {
    if (noteMethod !== "crepe" || crepe.model) return;
    let live = true;
    loadCrepeModelCached(CREPE_MODEL_URL).then(
      (model) => live && setCrepe({ model, error: null }),
      (error: unknown) =>
        live &&
        setCrepe({ model: null, error: error instanceof Error ? error : Error(String(error)) }),
    );
    return () => {
      live = false;
    };
  }, [noteMethod, crepe.model]);
  // Until the model is there, the notes are named by MPM.
  const noteLabelMethod = noteMethod === "crepe" && !crepe.model ? "mpm" : noteMethod;

  // The metronome stops with the exercise.
  const stopMetronome = metronome.stop;
  useEffect(() => {
    if (play.done) stopMetronome();
  }, [play.done, stopMetronome]);

  // What is drawn follows what is heard: with Bluetooth headphones the click
  // comes late, so the lanes and lights are drawn that much later.
  const visualDelayRef = useRef(0);
  visualDelayRef.current = budget?.visualDelayMs ?? 0;
  const now = useCallback(() => {
    const t = analysis?.clock.perfMsToContextTime(performance.now());
    return t === undefined || t === null ? null : t - visualDelayRef.current / 1000;
  }, [analysis]);

  // An exercise started during the latency test ends the test.
  const stopLatencyTest = latencyTest.stop;
  useEffect(() => {
    if (play.active) stopLatencyTest();
  }, [play.active, stopLatencyTest]);

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
    noteLabel: { method: noteLabelMethod, crepeModel: crepe.model ?? undefined },
    chordLabel: { chromaMethod: labelChroma },
  };

  const changeExercise = (next: Exercise) => {
    play.stop();
    metronome.stop();
    setExercise(next);
  };

  return (
    <div className="rhythm">
      {!running && <MicPrompt message="Start the microphone, then play along." onStart={onStart} />}

      <MethodPicker
        name="onset-method"
        title="Onset detection method"
        choices={ONSET_METHODS}
        value={onsetMethod}
        onChange={setOnsetMethod}
      />
      {exercise === "notes" && (
        <MethodPicker
          name="note-label-method"
          title="Note recognition method"
          choices={PITCH_METHODS}
          value={noteMethod}
          onChange={setNoteMethod}
          note={
            noteMethod !== "crepe"
              ? undefined
              : crepe.error
                ? `The AI model could not load (${crepe.error.message}): MPM names the notes.`
                : crepe.model
                  ? undefined
                  : "Loading the AI model (1 MB, once): MPM names the notes meanwhile."
          }
        />
      )}
      {exercise === "chords" && (
        <MethodPicker
          name="chord-label-method"
          title="Chord recognition method"
          choices={LABEL_CHROMA_METHODS}
          value={labelChroma}
          onChange={setLabelChroma}
        />
      )}

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
        {(metronome.sound || latencyTest.active) && (
          <LatencyTest
            test={latencyTest}
            stored={latency}
            onStore={setLatency}
            running={running}
            onStart={() => {
              play.stop();
              metronome.stop();
            }}
            now={now}
          />
        )}
        {exercise === "lane" && <RhythmLane key="lane" env={env} />}
        {exercise === "written" && <WrittenRhythm key="written" env={env} />}
        {(exercise === "notes" || exercise === "chords") && (
          <ScrollingLane key={exercise} mode={exercise} env={env} />
        )}
        <PlayAlongHow />
      </Panel>

      <div className="rhythm__diagnostics">
        <ListeningPanel snapshot={snapshot} analysis={analysis} />
        <TimingPanel snapshot={snapshot} budget={budget} captureMethod={captureMethod} />
      </div>
    </div>
  );
}
