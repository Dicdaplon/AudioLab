import { useMemo, useRef, useState } from "react";
import { fitPattern, type FittedNote, type PatternFit } from "@audiolab/core/rhythm";
import { SelectField } from "@audiolab/react";

import { BEATS_PER_BAR, PATTERN_BARS, RHYTHM_PATTERNS } from "./exercises";
import { useOnsetBus, type OnsetBus } from "./onsetBus";

/** Silence that ends a take once a few notes were played, in seconds. */
const END_SILENCE_SECONDS = 2.5;

type Phase = "idle" | "listening" | "done";

const TIER_TEXT: Record<FittedNote["tier"], string> = {
  onTime: "in time",
  early: "early",
  late: "late",
  missed: "missed",
};

interface WrittenRhythmProps {
  bus: OnsetBus;
  running: boolean;
}

/**
 * Written rhythm at the player's own tempo: the onsets are fitted to the
 * pattern (`fitPattern`), so the speed and any latency do not matter, only
 * the evenness of the rhythm.
 */
export function WrittenRhythm({ bus, running }: WrittenRhythmProps) {
  const [patternId, setPatternId] = useState(RHYTHM_PATTERNS[1].id);
  const pattern = RHYTHM_PATTERNS.find((p) => p.id === patternId) ?? RHYTHM_PATTERNS[0];
  const [phase, setPhase] = useState<Phase>("idle");
  const [onsets, setOnsets] = useState<number[]>([]);
  const onsetsRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const fit: PatternFit | null = useMemo(
    () => (onsets.length >= 2 ? fitPattern(pattern.beats, onsets) : null),
    [onsets, pattern],
  );

  const finish = () => setPhase("done");

  useOnsetBus(bus, {
    onOnset: (onset) => {
      if (phaseRef.current !== "listening") return;
      onsetsRef.current = [...onsetsRef.current, onset.time];
      setOnsets(onsetsRef.current);
      if (onsetsRef.current.length >= pattern.beats.length + 3) finish();
    },
    onBatch: (_history, analysedTime) => {
      if (phaseRef.current !== "listening") return;
      const last = onsetsRef.current.at(-1);
      if (
        last !== undefined &&
        onsetsRef.current.length >= 3 &&
        analysedTime - last > END_SILENCE_SECONDS
      ) {
        finish();
      }
    },
  });

  const start = () => {
    onsetsRef.current = [];
    setOnsets([]);
    setPhase("listening");
  };

  const totalBeats = BEATS_PER_BAR * PATTERN_BARS;
  // While listening, only the notes up to the last one heard are graded.
  const lastHeardBeat =
    fit && phase === "listening"
      ? Math.max(...fit.notes.filter((n) => n.onsetTime !== null).map((n) => n.beat), -1)
      : Infinity;

  let message = "Play this rhythm at your own steady pace. The first notes set the tempo.";
  if (!running) message = "Start the microphone, then play this rhythm at your own pace.";
  else if (phase === "listening")
    message = `Listening… ${onsets.length} of ${pattern.beats.length} notes.`;
  else if (phase === "done" && fit) {
    const inTime = fit.notes.filter((n) => n.tier === "onTime").length;
    const steady = fit.stats.jitterMs < 35;
    message = `${inTime} of ${fit.notes.length} notes in time, at about ${Math.round(fit.tempoBpm)} BPM. ${
      steady ? "Steady." : "A bit uneven: try it slower."
    }`;
  } else if (phase === "done") message = "Not enough notes heard. Try again.";

  return (
    <div className="rhythm__exercise">
      <div className="rhythm__controls">
        <SelectField
          id="rhythm-pattern"
          label="Rhythm"
          value={patternId}
          onChange={(v) => {
            setPatternId(v);
            setPhase("idle");
            setOnsets([]);
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
          onClick={phase === "listening" ? finish : start}
          disabled={!running}
        >
          {phase === "listening" ? "Stop" : phase === "done" ? "Again" : "Start"}
        </button>
      </div>

      <ol className="rhythm__score" aria-label={`${pattern.name}, two bars of 4/4`}>
        {pattern.beats.map((beat, i) => {
          const note = fit?.notes[i];
          const graded = note && note.beat <= lastHeardBeat ? note.tier : undefined;
          return (
            <li
              key={beat}
              className="rhythm__note"
              data-tier={graded}
              style={{ left: `${(beat / totalBeats) * 100}%` }}
              title={graded ? TIER_TEXT[graded] : undefined}
            >
              <span className="al-visually-hidden">
                Beat {beat + 1}
                {graded ? `: ${TIER_TEXT[graded]}` : ""}
              </span>
            </li>
          );
        })}
        {Array.from({ length: totalBeats + 1 }, (_, b) => (
          <li
            key={`bar-${b}`}
            className="rhythm__beat"
            data-bar={b % BEATS_PER_BAR === 0 ? "" : undefined}
            style={{ left: `${(b / totalBeats) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </ol>
      <p className="rhythm__message" role="status">
        {message}
      </p>
    </div>
  );
}
