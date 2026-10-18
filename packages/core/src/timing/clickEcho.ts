/**
 * Tell the metronome's own clicks from the player's notes, and measure the
 * speaker → microphone delay while doing it. Pure.
 *
 * Without headphones the microphone hears the click. An onset is the
 * click's echo when it comes within `maxDelayMs` after a scheduled click
 * and its new energy sits in the click band (`clickBandShare` ≥
 * `minBandShare`). A guitar note played on the beat merges with the echo
 * into one onset whose energy is broadband: it stays a note.
 *
 * Each echo is a free loopback measurement: the delay from the click's
 * scheduled time to its detection is the whole round trip (output buffers,
 * speaker, air, microphone, input buffers), which is exactly the offset to
 * subtract from a player who plays with what they hear. Its median over the
 * last echoes is `roundTripMs`; with headphones there is no echo and it
 * stays null.
 */

/** Band that holds the metronome's clicks (2640 and 3520 Hz), in Hz. */
export const CLICK_BAND_HZ: readonly [number, number] = [2300, 4000];

export interface ClickEchoConfig {
  /** Longest delay accepted between a click and its echo, in ms. Default 400. */
  maxDelayMs: number;
  /** Smallest share of new energy in the click band for an echo. Default 0.6. */
  minBandShare: number;
  /** Echoes in the round-trip median. Default 8. */
  echoWindow: number;
}

export const CLICK_ECHO_DEFAULTS: Readonly<ClickEchoConfig> = {
  maxDelayMs: 400,
  minBandShare: 0.6,
  echoWindow: 8,
};

export interface ClickEchoVerdict {
  /** True when the onset is the echo of a click. */
  echo: boolean;
  /** Delay after the closest earlier click, in ms, or null if none in range. */
  delayMs: number | null;
}

export class ClickEchoFilter {
  readonly config: ClickEchoConfig;
  private readonly delays: number[] = [];

  constructor(config: Partial<ClickEchoConfig> = {}) {
    this.config = { ...CLICK_ECHO_DEFAULTS, ...config };
  }

  /**
   * Classify an onset (time in s, band share from `clickBandShare`, or null
   * when unknown) against the scheduled click times (s, ascending).
   */
  check(
    onsetTime: number,
    bandShare: number | null,
    clickTimes: readonly number[],
  ): ClickEchoVerdict {
    // Candidate clicks: every one in range before the onset. With a long
    // round trip and a fast tempo the echo of click n can come after click
    // n + 1, so once a round trip is known take the click whose delay is
    // closest to it; before that, the latest one.
    const reference = this.roundTripMs;
    let delayMs: number | null = null;
    for (let i = clickTimes.length - 1; i >= 0; i--) {
      const d = (onsetTime - clickTimes[i]) * 1000;
      if (d < 0) continue;
      if (d > this.config.maxDelayMs) break;
      if (delayMs === null) delayMs = d;
      if (reference === null) break;
      if (Math.abs(d - reference) < Math.abs(delayMs - reference)) delayMs = d;
    }
    const echo = delayMs !== null && bandShare !== null && bandShare >= this.config.minBandShare;
    if (echo) {
      this.delays.push(delayMs!);
      if (this.delays.length > this.config.echoWindow) this.delays.shift();
    }
    return { echo, delayMs };
  }

  /** Measured speaker → microphone round trip, in ms, or null before the first echo. */
  get roundTripMs(): number | null {
    if (this.delays.length === 0) return null;
    const s = [...this.delays].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  /** Spread of the measured delays (half the range), in ms. */
  get spreadMs(): number {
    if (this.delays.length < 2) return 0;
    return (Math.max(...this.delays) - Math.min(...this.delays)) / 2;
  }

  /** Echoes measured so far (in the window). */
  get echoes(): number {
    return this.delays.length;
  }

  reset(): void {
    this.delays.length = 0;
  }
}
