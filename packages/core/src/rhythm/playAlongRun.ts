/**
 * A play-along run attached to a running onset analysis, without React:
 * the whole cycle of an exercise (onsets in, results out, the end, the
 * measured round trip) in one object.
 *
 *   const analysis = await startOnsetAnalysis(ctx, mic.source, { historySeconds: 3 });
 *   const run = attachPlayAlong(analysis, notes, { endTime, tolerance, offsetMs, clicks });
 *   run.subscribe((e) => { if (e.type === "results") draw(run.results); });
 *   const results = await run.finished;
 *
 * The caller owns the context, the microphone and the analysis (keep one
 * analysis for a whole lesson: its gate and its clock map stay learnt). The
 * run only subscribes to it and unsubscribes when it ends, on `finish()` or
 * on `stop()`. It has no timer of its own: it advances with the capture's
 * batches, so if the capture stops (a suspended context, a background tab)
 * the run waits; `finish()` ends it.
 *
 * Structural input (`PlayAlongSource`): an `OnsetAnalysis` from the main
 * entry fits it, and so does any source that delivers onsets and batches the
 * same way. This subpath imports nothing from the main entry.
 */

import type { StreamHistory } from "../analysis/onset/afterOnset";
import {
  PlayAlongSession,
  type PlayAlongOnset,
  type PlayAlongOptions,
  type PlayedOnsetView,
} from "./playAlong";
import type { ExpectedNote, NoteResult } from "./timingScorer";

/** What a run needs from an onset analysis (`OnsetAnalysis` fits). */
export interface PlayAlongSource {
  readonly sampleRate: number;
  /** Sample history, needed with `clicks` or a `labeler` (`historySeconds`). */
  readonly history: StreamHistory | null;
  subscribe(listener: (onset: PlayAlongOnset) => void): () => void;
  subscribeBatch(
    listener: (history: StreamHistory | null, analysedTime: number) => void,
  ): () => void;
}

export interface PlayAlongRunOptions extends Omit<PlayAlongOptions, "sampleRate"> {
  /** AudioContext time after the last note's window: the run ends there. */
  endTime: number;
}

export type PlayAlongEvent =
  | { type: "results"; changed: readonly NoteResult[] }
  | { type: "roundTrip"; ms: number | null; spreadMs: number }
  | { type: "done"; results: readonly NoteResult[]; reason: "end" | "finish" };

export type PlayAlongRunState = "running" | "done" | "stopped";

export interface PlayAlongRun {
  readonly state: PlayAlongRunState;
  readonly results: readonly NoteResult[];
  /** Detected onsets with their played time (for a lane or a score). */
  readonly onsets: readonly PlayedOnsetView[];
  /** Sounds outside every note's window (`exerciseScore(scores, run.strays)`). */
  readonly strays: number;
  /** Measured speaker → microphone round trip, in ms (audible clicks only). */
  readonly roundTripMs: number | null;
  /** Bias learnt so far, in ms (`adaptiveBias`). */
  readonly biasMs: number;
  /** Resolves with the results when the run ends or is finished; rejects on `stop()`. */
  readonly finished: Promise<readonly NoteResult[]>;
  /** Listen to the run; returns an unsubscribe function. */
  subscribe(listener: (event: PlayAlongEvent) => void): () => void;
  /** End now, grade what is left (missed), detach. Idempotent. */
  finish(): readonly NoteResult[];
  /** Cancel without grading, detach. Idempotent. */
  stop(): void;
}

export class PlayAlongStoppedError extends Error {
  constructor() {
    super("play-along run stopped");
    this.name = "PlayAlongStoppedError";
  }
}

export function attachPlayAlong(
  source: PlayAlongSource,
  notes: readonly ExpectedNote[],
  options: PlayAlongRunOptions,
): PlayAlongRun {
  const { endTime, ...sessionOptions } = options;
  if ((options.clicks || options.labeler) && source.history === null) {
    throw new Error(
      "attachPlayAlong: click echoes and labels need a sample history (startOnsetAnalysis({ historySeconds: 3 }))",
    );
  }
  const session = new PlayAlongSession(notes, { ...sessionOptions, sampleRate: source.sampleRate });
  const listeners = new Set<(event: PlayAlongEvent) => void>();
  let state: PlayAlongRunState = "running";
  let lastRoundTrip: number | null = session.roundTripMs;
  let resolveFinished!: (results: readonly NoteResult[]) => void;
  let rejectFinished!: (err: Error) => void;
  const finished = new Promise<readonly NoteResult[]>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });
  // A caller that never awaits `finished` must not get an unhandled rejection.
  finished.catch(() => undefined);

  const emit = (event: PlayAlongEvent) => {
    for (const l of listeners) {
      try {
        l(event);
      } catch (err) {
        if (typeof console !== "undefined") console.error(err);
      }
    }
  };

  const unsubscribeOnsets = source.subscribe((onset) => {
    if (state === "running") session.onset(onset);
  });
  const unsubscribeBatches = source.subscribeBatch((history, analysedTime) => {
    if (state !== "running" || !history) return;
    const changed = session.update(history, analysedTime);
    if (changed.length > 0) emit({ type: "results", changed });
    const rt = session.roundTripMs;
    if (rt !== lastRoundTrip) {
      lastRoundTrip = rt;
      emit({ type: "roundTrip", ms: rt, spreadMs: session.roundTripSpreadMs });
    }
    if (analysedTime > endTime && session.done) end("end");
  });

  function detach() {
    unsubscribeOnsets();
    unsubscribeBatches();
  }

  function end(reason: "end" | "finish") {
    state = "done";
    detach();
    emit({ type: "done", results: session.results, reason });
    listeners.clear();
    resolveFinished(session.results);
  }

  return {
    get state() {
      return state;
    },
    get results() {
      return session.results;
    },
    get onsets() {
      return session.onsets;
    },
    get strays() {
      return session.strays;
    },
    get roundTripMs() {
      return session.roundTripMs;
    },
    get biasMs() {
      return session.biasMs;
    },
    finished,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    finish() {
      if (state !== "running") return session.results;
      const changed = session.finish();
      if (changed.length > 0) emit({ type: "results", changed });
      end("finish");
      return session.results;
    },
    stop() {
      if (state !== "running") return;
      state = "stopped";
      detach();
      listeners.clear();
      rejectFinished(new PlayAlongStoppedError());
    },
  };
}
