import { useEffect, useMemo, useRef, useState } from "react";
import { beatAt, beatTime, type BeatGrid } from "@audiolab/core";
import {
  fitPattern,
  toleranceFromUncertainty,
  type PatternFit,
  type TimingTier,
} from "@audiolab/core/rhythm";
import { SelectField, Switch } from "@audiolab/react";

import type { ExerciseEnv } from "./env";
import { BEATS_PER_BAR, PATTERN_BARS, RHYTHM_PATTERNS, countLabel } from "./exercises";
import { useOnsetBus } from "./onsetBus";

const TOTAL_BEATS = BEATS_PER_BAR * PATTERN_BARS;
/** Silence that ends a free-tempo take once a few notes were played, in seconds. */
const END_SILENCE_SECONDS = 2.5;

const TIER_TEXT: Record<TimingTier, string> = {
  onTime: "in time",
  early: "early",
  late: "late",
  missed: "missed",
};

const left = (beat: number) => `${(beat / TOTAL_BEATS) * 100}%`;

/**
 * A written rhythm, two bars counted "1 & 2 & …". With the metronome: a
 * one-bar count-in, a cursor that moves along the bars, each note graded
 * against the beat. At your own pace: no metronome, the rhythm is graded
 * against your own steady tempo. Red dots show when each note was heard.
 */
export function WrittenRhythm({ env }: { env: ExerciseEnv }) {
  const { bus, play, budget, sampleRate, running, now, bpm, metronome } = env;
  const [patternId, setPatternId] = useState(RHYTHM_PATTERNS[1].id);
  const pattern = RHYTHM_PATTERNS.find((p) => p.id === patternId) ?? RHYTHM_PATTERNS[0];
  const [ownPace, setOwnPace] = useState(false);
  const grid: BeatGrid | null = metronome.metronome?.grid ?? null;
  // The grid of the last take, kept for its verdicts once the metronome stops.
  const [takeGrid, setTakeGrid] = useState<BeatGrid | null>(null);

  // --- At your own pace ---------------------------------------------------
  const [freeOnsets, setFreeOnsets] = useState<number[] | null>(null);
  const [freeDone, setFreeDone] = useState(false);
  const freeRef = useRef<number[] | null>(null);
  const fit: PatternFit | null = useMemo(
    () => (freeOnsets && freeOnsets.length >= 2 ? fitPattern(pattern.beats, freeOnsets) : null),
    [freeOnsets, pattern],
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
      if (freeRef.current.length >= pattern.beats.length + 3) endFree();
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
      pattern.beats.map((b, i) => ({ id: i, time: beatTime(m.grid, b) })),
      {
        sampleRate,
        tolerance: toleranceFromUncertainty(budget.uncertaintyMs),
        offsetMs: budget.offsetMs,
        adaptiveBias: !budget.calibrated,
        clickTimes: () => m.clickTimes,
      },
      beatTime(m.grid, TOTAL_BEATS),
    );
  };

  // Moving cursor over the bars.
  const scoreRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = scoreRef.current;
    if (!el || !grid || typeof requestAnimationFrame !== "function") return;
    let handle = 0;
    const frame = () => {
      const t = now();
      const beat = t === null ? -1 : beatAt(grid, t);
      el.style.setProperty("--cursor", left(Math.min(TOTAL_BEATS, Math.max(0, beat))));
      el.dataset.cursor = beat >= 0 && beat <= TOTAL_BEATS ? "on" : "off";
      handle = requestAnimationFrame(frame);
    };
    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, [grid, now]);

  // Verdicts and dots of the current mode.
  let tiers: (TimingTier | undefined)[] = [];
  let dots: { beat: number; echo: boolean }[] = [];
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
    tiers = pattern.beats.map((_, i) => {
      const n = fit?.notes[i];
      return n && n.beat <= lastHeard ? n.tier : undefined;
    });
    if (fit) {
      const spb = 60 / fit.tempoBpm;
      dots = (freeOnsets ?? []).map((t) => ({ beat: (t - fit.startTime) / spb, echo: false }));
    }
    if (playing)
      message = `Listening… ${freeOnsets?.length ?? 0} of ${pattern.beats.length} notes.`;
    else if (freeDone && fit) {
      const inTime = fit.notes.filter((n) => n.tier === "onTime").length;
      message = `${inTime} of ${fit.notes.length} notes in time, at about ${Math.round(fit.tempoBpm)} BPM. ${
        fit.stats.jitterMs < 35 ? "Steady." : "A bit uneven: try it slower."
      }`;
    } else if (freeDone) message = "Not enough notes heard. Try again.";
  } else {
    const results = play.results;
    playing = play.active;
    tiers = (results ?? []).map((r) => (r.resolved ? (r.tier ?? undefined) : undefined));
    if (takeGrid && results) {
      dots = play.onsets().map((o) => ({ beat: beatAt(takeGrid, o.time), echo: o.echo }));
    }
    if (play.done && results) {
      const inTime = results.filter((r) => r.tier === "onTime").length;
      message = `${inTime} of ${results.length} notes in time.`;
    }
  }
  if (!running) message = "Start the microphone, then play the rhythm.";

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

      <div className="rhythm__sheet">
        <ol
          className="rhythm__score"
          ref={scoreRef}
          aria-label={`${pattern.name}, two bars of 4/4`}
        >
          {pattern.beats.map((beat, i) => (
            <li
              key={beat}
              className="rhythm__note"
              data-tier={tiers[i]}
              style={{ left: left(beat) }}
              title={tiers[i] ? TIER_TEXT[tiers[i]!] : undefined}
            >
              <span className="al-visually-hidden">
                {countLabel(beat * 2)}
                {tiers[i] ? `: ${TIER_TEXT[tiers[i]!]}` : ""}
              </span>
            </li>
          ))}
          {Array.from({ length: TOTAL_BEATS + 1 }, (_, b) => (
            <li
              key={`beat-${b}`}
              className="rhythm__beat"
              data-bar={b % BEATS_PER_BAR === 0 ? "" : undefined}
              style={{ left: left(b) }}
              aria-hidden="true"
            />
          ))}
          {dots
            .filter((d) => d.beat > -0.5 && d.beat < TOTAL_BEATS + 0.5)
            .map((d, i) => (
              <li
                key={`dot-${i}`}
                className="rhythm__dot"
                data-echo={d.echo ? "" : undefined}
                style={{ left: left(d.beat) }}
                aria-hidden="true"
              />
            ))}
          <li className="rhythm__cursor" aria-hidden="true" />
        </ol>
        <ol className="rhythm__count" aria-hidden="true">
          {Array.from({ length: TOTAL_BEATS * 2 }, (_, slot) => (
            <li
              key={slot}
              style={{ left: left(slot / 2) }}
              data-beat={slot % 2 === 0 ? "" : undefined}
            >
              {countLabel(slot)}
            </li>
          ))}
        </ol>
      </div>
      <p className="rhythm__legend">Red dot: when your note was heard.</p>
      <p className="rhythm__message" role="status">
        {message}
      </p>
    </div>
  );
}
