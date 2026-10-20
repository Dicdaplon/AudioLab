import { useCallback, useMemo, useRef, useState } from "react";
import { beatAt, beatTime, type BeatGrid } from "@audiolab/core";
import {
  fitPattern,
  playedBeats,
  rhythmLength,
  scoreSigmaFor,
  TIMING_TOLERANCE_DEFAULTS,
  toleranceFromUncertainty,
  type PatternFit,
  type TimingTier,
} from "@audiolab/core/rhythm";
import {
  ScoreCard,
  SelectField,
  StaffNotation,
  Switch,
  type ScoredNote,
  type StaffDot,
} from "@audiolab/react";

import type { ExerciseEnv } from "./env";
import { BEATS_PER_BAR, RHYTHM_PATTERNS, patternEvents } from "./exercises";
import { useOnsetBus } from "./onsetBus";
import { staffStates } from "./staffState";

/** Silence that ends a free-tempo take once a few notes were played, in seconds. */
const END_SILENCE_SECONDS = 2.5;

/**
 * A written rhythm, two bars on a staff counted "1 & 2 & …". With the
 * metronome: a one-bar count-in, a cursor that moves along the bars, each
 * note graded against the beat. At your own pace: no metronome, the rhythm
 * is graded against your own steady tempo. Red dots show when each note was
 * heard.
 */
export function WrittenRhythm({ env }: { env: ExerciseEnv }) {
  const { bus, play, budget, sampleRate, running, now, bpm, metronome } = env;
  const [patternId, setPatternId] = useState(RHYTHM_PATTERNS[2].id);
  const pattern = RHYTHM_PATTERNS.find((p) => p.id === patternId) ?? RHYTHM_PATTERNS[0];
  const events = useMemo(() => patternEvents(pattern), [pattern]);
  const beats = useMemo(() => playedBeats(events), [events]);
  const [ownPace, setOwnPace] = useState(false);
  const grid: BeatGrid | null = metronome.metronome?.grid ?? null;
  // The grid of the last take, kept for its verdicts once the metronome stops.
  const [takeGrid, setTakeGrid] = useState<BeatGrid | null>(null);

  // --- At your own pace ---------------------------------------------------
  const [freeOnsets, setFreeOnsets] = useState<number[] | null>(null);
  const [freeDone, setFreeDone] = useState(false);
  const freeRef = useRef<number[] | null>(null);
  const fit: PatternFit | null = useMemo(
    () => (freeOnsets && freeOnsets.length >= 2 ? fitPattern(beats, freeOnsets) : null),
    [freeOnsets, beats],
  );
  const endFree = () => {
    freeRef.current = null;
    setFreeDone(true);
  };
  useOnsetBus(bus, {
    onOnset: (onset) => {
      if (!freeRef.current) return;
      freeRef.current = [...freeRef.current, onset.time];
      setFreeOnsets(freeRef.current);
      if (freeRef.current.length >= beats.length + 3) endFree();
    },
    onBatch: (_h, analysedTime) => {
      const list = freeRef.current;
      const last = list?.at(-1);
      if (
        list &&
        last !== undefined &&
        list.length >= 3 &&
        analysedTime - last > END_SILENCE_SECONDS
      ) {
        endFree();
      }
    },
  });

  const resetAll = () => {
    play.stop();
    metronome.stop();
    freeRef.current = null;
    setFreeOnsets(null);
    setFreeDone(false);
  };

  /** End the take and grade what was played. */
  const finish = () => {
    if (ownPace) {
      endFree();
    } else {
      play.stop();
      metronome.stop();
    }
  };

  const start = () => {
    resetAll();
    if (ownPace) {
      freeRef.current = [];
      setFreeOnsets([]);
      return;
    }
    if (!budget) return;
    const m = metronome.start({ bpm, beatsPerBar: BEATS_PER_BAR, sound: metronome.sound });
    if (!m) return;
    setTakeGrid(m.grid);
    play.start(
      beats.map((b, i) => ({ id: i, time: beatTime(m.grid, b) })),
      {
        sampleRate,
        tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
        offsetMs: budget.offsetMs,
        adaptiveBias: !budget.calibrated,
        clickTimes: () => m.clickTimes,
      },
      beatTime(m.grid, rhythmLength(events)),
    );
  };

  const cursor = useCallback(() => {
    const t = now();
    return grid && t !== null ? beatAt(grid, t) : null;
  }, [grid, now]);

  // Verdicts and dots of the current mode.
  let states: (TimingTier | undefined)[] = [];
  let dotList: StaffDot[] = [];
  let playing = false;
  let message = ownPace
    ? "Play this rhythm at your own steady pace. The first notes set the tempo."
    : "Listen to the count-in, then play the rhythm from the next bar.";
  if (ownPace) {
    playing = freeOnsets !== null && !freeDone;
    const lastHeard =
      fit && playing
        ? Math.max(...fit.notes.filter((n) => n.onsetTime !== null).map((n) => n.beat), -1)
        : Infinity;
    let k = 0;
    states = events.map((e) => {
      if (e.rest) return undefined;
      const n = fit?.notes[k++];
      return n && n.beat <= lastHeard ? n.tier : undefined;
    });
    if (fit) {
      const spb = 60 / fit.tempoBpm;
      dotList = (freeOnsets ?? []).map((t) => ({ beat: (t - fit.startTime) / spb }));
    }
    if (playing) message = `Listening… ${freeOnsets?.length ?? 0} of ${beats.length} notes.`;
    else if (freeDone && fit) {
      const inTime = fit.notes.filter((n) => n.tier === "onTime").length;
      message = `${inTime} of ${fit.notes.length} notes in time, at about ${Math.round(fit.tempoBpm)} BPM. ${
        fit.stats.jitterMs < 35 ? "Steady." : "A bit uneven: try it slower."
      }`;
    } else if (freeDone) message = "Not enough notes heard. Try again.";
  } else {
    const results = play.results;
    playing = play.active;
    states = staffStates(events, results).map((s) => (s === "pending" ? undefined : s));
    if (takeGrid && results) {
      dotList = play.onsets().map((o) => ({ beat: beatAt(takeGrid, o.time), echo: o.echo }));
    }
    if (play.done && results) {
      const inTime = results.filter((r) => r.tier === "onTime").length;
      message = `${inTime} of ${results.length} notes in time.`;
    }
  }
  // The score card: the metronome run, or the free-tempo fit once the take ends.
  let card: {
    notes: readonly ScoredNote[];
    strays: number;
    done: boolean;
    sigmaMs: number;
  } | null = null;
  if (ownPace) {
    if (freeDone && fit) {
      card = {
        notes: fit.notes.map((n) => ({
          resolved: true,
          tier: n.tier,
          deltaMs: n.residualMs,
          score: n.onsetTime === null ? 0 : n.score,
        })),
        strays: fit.extras.length,
        done: true,
        sigmaMs: scoreSigmaFor(TIMING_TOLERANCE_DEFAULTS),
      };
    }
  } else if (play.results) {
    card = {
      notes: play.results,
      strays: play.strays,
      done: play.done,
      sigmaMs: scoreSigmaFor(
        budget ? toleranceFromUncertainty(budget.uncertaintyMs) : TIMING_TOLERANCE_DEFAULTS,
      ),
    };
  }
  if (!running) message = "Start the microphone, then play the rhythm.";
  const dotsRef = useRef(dotList);
  dotsRef.current = dotList;
  const dots = useCallback(() => dotsRef.current, []);

  return (
    <div className="rhythm__exercise">
      <div className="rhythm__controls">
        <SelectField
          id="rhythm-pattern"
          label="Rhythm"
          value={patternId}
          onChange={(v) => {
            resetAll();
            setPatternId(v);
          }}
        >
          {RHYTHM_PATTERNS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <Switch
          id="rhythm-own-pace"
          checked={ownPace}
          onChange={(v) => {
            resetAll();
            setOwnPace(v);
          }}
        >
          My own pace (no metronome)
        </Switch>
        <button
          type="button"
          className="al-btn al-btn--accent"
          onClick={playing ? finish : start}
          disabled={!running || (!ownPace && !budget)}
        >
          {playing ? "Stop" : play.done || freeDone ? "Again" : "Start"}
        </button>
      </div>

      <StaffNotation
        className="rhythm__written"
        events={events}
        states={states}
        cursor={ownPace ? undefined : cursor}
        dots={dots}
        count
        label={`${pattern.name}, two bars of 4/4`}
      />
      <p className="rhythm__legend">Red dot: when your note was heard.</p>
      <p className="rhythm__message" role="status">
        {message}
      </p>
      {card && (
        <ScoreCard
          results={card.notes}
          strays={card.strays}
          sigmaMs={card.sigmaMs}
          done={card.done}
        />
      )}
    </div>
  );
}
