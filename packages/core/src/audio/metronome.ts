/**
 * Metronome on the AudioContext clock: sample-exact clicks, scheduled
 * ahead with the Web Audio "look-ahead" pattern (a main-thread timer every
 * 25 ms schedules the clicks of the next 150 ms with `start(time)`), so
 * main-thread jank never makes a click late. A main thread blocked longer
 * than the look-ahead (or a background tab, whose timers the browser slows
 * down) drops the clicks it could not schedule: silence, never a late click.
 *
 * The click is a short sine burst high in the spectrum (2640 Hz, 3520 Hz
 * on the downbeat, 30 ms): easy to hear over a guitar, and easy to tell
 * from a guitar attack when a microphone picks it up (`clickBandShare`,
 * `ClickEchoFilter`). With `sound: false` nothing is played and the grid
 * still runs, for a visual metronome.
 *
 * `stop()` cancels the timer and the clicks not played yet; the context
 * belongs to the caller.
 */

import { beatTime, isDownbeat, type BeatGrid } from "../timing/beatGrid";

export const CLICK_HZ = 2640;
export const ACCENT_CLICK_HZ = 3520;

export const METRONOME_DEFAULTS = { beatsPerBar: 4, volume: 0.5, sound: true } as const;
const CLICK_SECONDS = 0.03;
const LOOKAHEAD_SECONDS = 0.15;
const TIMER_MS = 25;

export interface MetronomeOptions {
  bpm: number;
  /** Beats per bar. Default 4. */
  beatsPerBar?: number;
  /** AudioContext time of beat 0. Default: one bar from now (a count-in). */
  startTime?: number;
  /** Play the clicks. Default true. */
  sound?: boolean;
  /** Click gain in [0, 1]. Default 0.5. */
  volume?: number;
  /** Where the clicks go. Default `context.destination`. */
  destination?: AudioNode;
}

export interface Metronome {
  readonly grid: Readonly<BeatGrid>;
  /** Turn the sound on or off without moving the grid. */
  setSound(on: boolean): void;
  readonly sound: boolean;
  /** AudioContext times of the clicks played so far, sound on only (for echo filtering). */
  readonly clickTimes: readonly number[];
  /** Stop scheduling and silence the clicks not played yet. Idempotent. */
  stop(): void;
}

export function startMetronome(context: BaseAudioContext, options: MetronomeOptions): Metronome {
  const beatsPerBar = options.beatsPerBar ?? METRONOME_DEFAULTS.beatsPerBar;
  if (!(options.bpm > 0)) throw new Error("bpm must be > 0");
  if (!(Number.isInteger(beatsPerBar) && beatsPerBar >= 1)) {
    throw new Error("beatsPerBar must be an integer ≥ 1");
  }
  const startTime = options.startTime ?? context.currentTime + (beatsPerBar * 60) / options.bpm;
  const grid: Readonly<BeatGrid> = Object.freeze({ startTime, bpm: options.bpm, beatsPerBar });
  const destination = options.destination ?? context.destination;
  const requested = options.volume ?? METRONOME_DEFAULTS.volume;
  const volume = Number.isFinite(requested)
    ? Math.min(1, Math.max(0, requested))
    : METRONOME_DEFAULTS.volume;
  let sound = options.sound ?? METRONOME_DEFAULTS.sound;
  let stopped = false;
  const clickTimes: number[] = [];
  const pending: { osc: OscillatorNode; time: number }[] = [];
  // Next beat to schedule: the count-in bar before beat 0, or the first
  // beat still ahead when the start is in the past.
  let next = Math.max(
    -beatsPerBar,
    Math.ceil(((context.currentTime - startTime) * options.bpm) / 60),
  );

  const click = (time: number, accent: boolean) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.frequency.value = accent ? ACCENT_CLICK_HZ : CLICK_HZ;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + CLICK_SECONDS);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + CLICK_SECONDS + 0.01);
    pending.push({ osc, time });
    clickTimes.push(time);
  };

  const schedule = () => {
    if (stopped) return;
    const horizon = context.currentTime + LOOKAHEAD_SECONDS;
    for (let t = beatTime(grid, next); t < horizon; t = beatTime(grid, ++next)) {
      if (sound && t >= context.currentTime) click(t, isDownbeat(grid, next));
    }
    // Forget clicks already played.
    while (pending.length > 0 && pending[0].time + CLICK_SECONDS < context.currentTime)
      pending.shift();
  };

  schedule();
  const timer = setInterval(schedule, TIMER_MS);

  return {
    grid,
    get sound() {
      return sound;
    },
    setSound(on) {
      sound = on;
    },
    clickTimes,
    stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      for (const p of pending) {
        try {
          p.osc.stop();
        } catch {
          // Already stopped.
        }
      }
      pending.length = 0;
    },
  };
}
