/**
 * A play-along session: expected notes on a timeline, live onsets in, and
 * everything an exercise screen needs out. Pure (no Web Audio): the caller
 * feeds it the onsets and, after every captured batch, the sample history
 * and the time up to which onsets are known (`useOnsetAnalysis` gives both).
 *
 *   onset() ──► queue ──► click echo? (metronome heard by the microphone)
 *                │            └─ yes: dropped, measures the round trip
 *                └─► TimingScorer.onset ──► label when its audio is in
 *   update(history, analysedTime) runs the queue, then advances the scorer
 *
 * Onsets wait until the samples just after them are captured (the echo
 * check reads them), and the scorer advances only once the queue is empty,
 * so a note is never closed before its onset is in.
 *
 * The onset detector merges attacks closer than 50 ms, so a note played
 * 15–45 ms after the click's echo would hide inside the echo's onset.
 * Before an echo is dropped, the next 45 ms are searched for a broadband
 * rise (`spectralRise`); if there is one, a note is graded there.
 *
 * `onsets` lists every detected onset with its played time (latency and
 * learnt bias removed, as the scorer sees it), for a display that shows
 * where each one landed against its target.
 */

/** Delays after an echo searched for a hidden note, in ms. */
const AFTER_ECHO_MS = [15, 30, 45];
/** A hidden note raises the broadband level by at least this, in dB. */
const HIDDEN_NOTE_RISE_DB = 3;

import { clickWindowLength, spectralRise, type StreamHistory } from "../analysis/onset/afterOnset";
import { CLICK_BAND_HZ, ClickEchoFilter, type LearntClick } from "../timing/clickEcho";
import {
  TimingScorer,
  type ExpectedNote,
  type NoteResult,
  type TimingScorerConfig,
} from "./timingScorer";

/** An onset as `OnsetEvent` / `TimedOnset` carry it. */
export interface PlayAlongOnset {
  id: number;
  /** AudioContext seconds. */
  time: number;
  /** Stream frame of the attack. */
  frame: number;
}

/** Names what was played at an onset, from the samples after it. */
export interface OnsetLabeler {
  /** First stream frame at which `label` can answer. */
  readyAt(onsetFrame: number): number;
  label(history: StreamHistory, onsetFrame: number): string | null;
}

export interface PlayAlongClicks {
  /** Scheduled click times, ascending (e.g. `metronome.clickTimes`). */
  times: () => readonly number[];
  /** Filter to use (share one across sessions to keep the round trip). Default a new one. */
  filter?: ClickEchoFilter;
  /** Band of the click, in Hz. Default `CLICK_BAND_HZ`. */
  band?: readonly [number, number];
}

export interface PlayAlongOptions extends Partial<TimingScorerConfig> {
  sampleRate: number;
  /** Set when an audible metronome plays: its echoes are not notes. */
  clicks?: PlayAlongClicks;
  /** Set to grade the note or chord played, not only the timing. */
  labeler?: OnsetLabeler;
}

export interface PlayedOnsetView {
  id: number;
  /** Played time as graded (latency and bias removed), in s. */
  time: number;
  /** A metronome click picked up by the microphone. */
  echo: boolean;
  /** A sound outside every note's window: it costs points (`exerciseScore`). */
  stray: boolean;
}

interface PendingLabel {
  id: number;
  frame: number;
  readyAt: number;
}

export class PlayAlongSession {
  private readonly scorer: TimingScorer;
  private readonly echoFilter: ClickEchoFilter | null;
  private readonly sampleRate: number;
  private readonly clicks: PlayAlongClicks | undefined;
  private readonly labeler: OnsetLabeler | undefined;
  private readonly queue: PlayAlongOnset[] = [];
  private pendingLabels: PendingLabel[] = [];
  private readonly views: PlayedOnsetView[] = [];
  /** Detected onsets before this time (s) belong to the count-in: the player waits. */
  private readonly countInEnd: number;

  constructor(notes: readonly ExpectedNote[], options: PlayAlongOptions) {
    const { sampleRate, clicks, labeler, ...scorer } = options;
    this.scorer = new TimingScorer(notes, scorer);
    this.sampleRate = sampleRate;
    this.clicks = clicks;
    this.labeler = labeler;
    this.echoFilter = clicks ? (clicks.filter ?? new ClickEchoFilter()) : null;
    const { offsetMs, tolerance } = this.scorer.config;
    const first = notes.reduce((t, n) => Math.min(t, n.time), Infinity);
    this.countInEnd = first + (offsetMs - tolerance.windowMs) / 1000;
  }

  /** The click learnt from its echoes during the count-in, or null (headphones, too few). */
  get learntClick(): LearntClick | null {
    return this.echoFilter?.learntClick ?? null;
  }

  /** The resolved scoring configuration (tolerance, offset, bias settings). */
  get config(): Readonly<TimingScorerConfig> {
    return this.scorer.config;
  }

  /** Bias learnt so far, in ms (0 without `adaptiveBias`). */
  get biasMs(): number {
    return this.scorer.state.biasMs;
  }

  get results(): readonly NoteResult[] {
    return this.scorer.results;
  }

  /** True once every note is resolved (and labelled, with a labeler). */
  get done(): boolean {
    return this.results.every((r) => r.resolved && (r.label !== "pending" || r.onsetId === null));
  }

  /** Sounds outside every note's window so far (count them with `exerciseScore`). */
  get strays(): number {
    return this.scorer.state.strays.length;
  }

  /** Every detected onset, for display. */
  get onsets(): readonly PlayedOnsetView[] {
    return this.views;
  }

  /** Measured speaker → microphone round trip, in ms (audible clicks only). */
  get roundTripMs(): number | null {
    return this.echoFilter?.roundTripMs ?? null;
  }

  /** Spread of the round-trip measurements, in ms. */
  get roundTripSpreadMs(): number {
    return this.echoFilter?.spreadMs ?? 0;
  }

  /** Queue an onset; it is graded on the next `update`. */
  onset(onset: PlayAlongOnset): void {
    this.queue.push(onset);
  }

  /**
   * Process the queued onsets with the samples now available, name what was
   * played, then advance to `analysedTime`. Returns the results that changed.
   */
  update(history: StreamHistory, analysedTime: number): NoteResult[] {
    const changed = new Map<string | number, NoteResult>();
    const note = (list: NoteResult[]) => list.forEach((r) => changed.set(r.noteId, r));

    const band = this.clicks?.band ?? CLICK_BAND_HZ;
    // The echo check and the hidden-note search read this much audio after an onset.
    const needed =
      Math.round((AFTER_ECHO_MS[AFTER_ECHO_MS.length - 1] / 1000) * this.sampleRate) +
      clickWindowLength(this.sampleRate);
    while (this.queue.length > 0) {
      const onset = this.queue[0];
      let played: PlayAlongOnset | null = onset;
      if (this.clicks && this.echoFilter) {
        if (history.range.to < onset.frame + needed) break; // wait for the audio
        const rise = spectralRise(history, onset.frame, this.sampleRate, { band });
        if (onset.time < this.countInEnd) {
          // The count-in: the player waits, so what is heard is the click.
          // Learnt from, shown, never graded (not even as an extra).
          const learnt = this.echoFilter.learn(onset.time, rise, this.clicks.times());
          this.addView(onset.id, onset.time, learnt);
          this.queue.shift();
          continue;
        }
        const verdict = this.echoFilter.check(onset.time, rise, this.clicks.times());
        if (verdict.echo) {
          this.addView(onset.id, onset.time, true);
          played = this.hiddenNote(history, onset, band);
        }
      }
      this.queue.shift();
      if (!played) continue;
      this.addView(played.id, played.time, false);
      const strays = this.scorer.state.strays.length;
      note(this.scorer.onset({ id: played.id, time: played.time }));
      if (this.scorer.state.strays.length > strays) this.views[this.views.length - 1].stray = true;
      if (this.labeler) {
        this.pendingLabels.push({
          id: played.id,
          frame: played.frame,
          readyAt: this.labeler.readyAt(played.frame),
        });
      }
    }

    if (this.labeler) {
      const labeler = this.labeler;
      this.pendingLabels = this.pendingLabels.filter((p) => {
        if (p.readyAt > history.range.to) return true;
        note(this.scorer.label(p.id, labeler.label(history, p.frame)));
        return false;
      });
    }
    if (this.queue.length === 0) note(this.scorer.advance(analysedTime));
    return [...changed.values()];
  }

  private addView(id: number, time: number, echo: boolean): void {
    const { offsetMs } = this.scorer.config;
    this.views.push({
      id,
      time: time - (offsetMs + this.scorer.state.biasMs) / 1000,
      echo,
      stray: false,
    });
  }

  /** A note started within 45 ms after an echo, merged into its onset. */
  private hiddenNote(
    history: StreamHistory,
    echo: PlayAlongOnset,
    band: readonly [number, number],
  ): PlayAlongOnset | null {
    const minShare = this.echoFilter?.config.minBandShare ?? 0.6;
    for (const ms of AFTER_ECHO_MS) {
      const frame = echo.frame + Math.round((ms / 1000) * this.sampleRate);
      const rise = spectralRise(history, frame, this.sampleRate, { band });
      if (!rise || rise.riseDb < HIDDEN_NOTE_RISE_DB) continue;
      // Not the click: by the learnt shape once there is one, else by the band.
      const click = this.echoFilter?.looksLikeClick(rise) ?? null;
      if (click === null ? rise.bandShare < minShare : !click) {
        return { id: echo.id, time: echo.time + ms / 1000, frame };
      }
    }
    return null;
  }

  /** Resolve everything left (end of the exercise). */
  finish(): NoteResult[] {
    return this.scorer.finish();
  }
}
