/**
 * Tell the metronome's own clicks from the player's notes, and measure the
 * speaker → microphone delay while doing it. Pure.
 *
 * Without headphones the microphone hears the click. Two ways to recognise
 * its echo:
 *
 * - **By its band** (from the first click, nothing to learn): an onset is
 *   the click's echo when it comes within `maxDelayMs` after a scheduled
 *   click and its new energy sits in the click band (`bandShare` ≥
 *   `minBandShare`). Right for the SDK's sine clicks, whose energy is all in
 *   one narrow band. A noisy click (a clave, a wood block) spreads beyond
 *   any band and is missed one time in four or more.
 * - **By ear, learnt during the count-in** (`learn`): the player waits, so
 *   every onset there is an echo. Its delay (up to `learnMaxDelayMs`) and
 *   the shape of its spectrum (`SpectralRise.bands`) are kept. Afterwards an
 *   onset is an echo when it comes at that delay (± `delayToleranceMs`),
 *   and has the learnt click's shape (`riseSimilarity` ≥ `minSimilarity`),
 *   at any loudness. Any click sound works, and so does a round trip longer
 *   than 400 ms (Android). A note played on the echo changes the shape as
 *   soon as the guitar is about as loud as the echo in the microphone; a
 *   much quieter note right on the echo stays hidden in it.
 *
 * Each echo is a free loopback measurement: the delay from the click's
 * scheduled time to its detection is the whole round trip (output buffers,
 * speaker, air, microphone, input buffers), which is exactly the offset to
 * subtract from a player who plays with what they hear. Its median over the
 * last echoes is `roundTripMs`; with headphones there is no echo and it
 * stays null.
 */

import { riseSimilarity, type SpectralRise } from "../analysis/onset/afterOnset";

/** Band that holds the metronome's clicks (2640 and 3520 Hz), in Hz. */
export const CLICK_BAND_HZ: readonly [number, number] = [2300, 4000];

export interface ClickEchoConfig {
  /** Longest delay accepted between a click and its echo (by band), in ms. Default 400. */
  maxDelayMs: number;
  /** Smallest share of new energy in the click band for an echo. Default 0.6. */
  minBandShare: number;
  /** Echoes in the round-trip median, and count-in echoes kept. Default 8. */
  echoWindow: number;
  /** Longest delay learnt during the count-in, in ms. Default 800. */
  learnMaxDelayMs: number;
  /** Onsets this far from the learnt delay are not echoes, in ms. Default 40. */
  delayToleranceMs: number;
  /** Smallest likeness to the learnt click for an echo. Default 0.4 (a guitar attack alone stays under 0.25; an echo over strings still ringing scores 0.4–1). */
  minSimilarity: number;
  /** Count-in echoes that must agree before recognising by ear. Default 2. */
  minLearnt: number;
}

export const CLICK_ECHO_DEFAULTS: Readonly<ClickEchoConfig> = {
  maxDelayMs: 400,
  minBandShare: 0.6,
  echoWindow: 8,
  learnMaxDelayMs: 800,
  delayToleranceMs: 40,
  minSimilarity: 0.4,
  minLearnt: 2,
};

export interface ClickEchoVerdict {
  /** True when the onset is the echo of a click. */
  echo: boolean;
  /** Delay after the click it was compared with, in ms, or null if none in range. */
  delayMs: number | null;
}

interface LearntEcho {
  delayMs: number;
  bands: readonly number[];
}

/** What the count-in taught: the click's delay, shape and loudness. */
export interface LearntClick {
  delayMs: number;
  /** Mean band shape (`SpectralRise.bands`), each echo weighing the same. */
  bands: readonly number[];
  /** Count-in echoes it rests on. */
  echoes: number;
}

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export class ClickEchoFilter {
  readonly config: ClickEchoConfig;
  private readonly delays: number[] = [];
  private readonly learnt: LearntEcho[] = [];
  private cachedClick: LearntClick | null | undefined;

  constructor(config: Partial<ClickEchoConfig> = {}) {
    this.config = { ...CLICK_ECHO_DEFAULTS, ...config };
  }

  /**
   * An onset heard during the count-in, while the player waits: the click's
   * echo, to learn from. Returns false when no click is in range.
   */
  learn(onsetTime: number, rise: SpectralRise | null, clickTimes: readonly number[]): boolean {
    if (!rise) return false;
    let delayMs: number | null = null;
    for (let i = clickTimes.length - 1; i >= 0; i--) {
      const d = (onsetTime - clickTimes[i]) * 1000;
      if (d < 0) continue;
      if (d <= this.config.learnMaxDelayMs) delayMs = d;
      break;
    }
    if (delayMs === null) return false;
    // An echo the band already recognises measures the round trip at once.
    if (delayMs <= this.config.maxDelayMs && rise.bandShare >= this.config.minBandShare) {
      this.remember(delayMs);
    }
    this.learnt.push({ delayMs, bands: rise.bands });
    if (this.learnt.length > this.config.echoWindow) this.learnt.shift();
    this.cachedClick = undefined;
    return true;
  }

  /**
   * The click learnt during the count-in, or null until `minLearnt` echoes
   * agree on a delay. Echoes away from their median delay (a note played
   * during the count-in) are left out.
   */
  get learntClick(): LearntClick | null {
    if (this.cachedClick !== undefined) return this.cachedClick;
    let click: LearntClick | null = null;
    if (this.learnt.length > 0) {
      const delay = median(this.learnt.map((e) => e.delayMs));
      const agree = this.learnt.filter(
        (e) => Math.abs(e.delayMs - delay) <= this.config.delayToleranceMs,
      );
      if (agree.length >= this.config.minLearnt) {
        const bands = new Array<number>(agree[0].bands.length).fill(0);
        for (const e of agree) {
          const total = e.bands.reduce((s, v) => s + v, 0) || 1;
          e.bands.forEach((v, i) => (bands[i] += v / total));
        }
        click = {
          delayMs: median(agree.map((e) => e.delayMs)),
          bands,
          echoes: agree.length,
        };
      }
    }
    this.cachedClick = click;
    return click;
  }

  /**
   * True when a rise has the learnt click's shape, null before anything is
   * learnt. Tells a note hidden just after an echo from the echo's tail.
   */
  looksLikeClick(rise: SpectralRise): boolean | null {
    const click = this.learntClick;
    return click ? riseSimilarity(rise.bands, click.bands) >= this.config.minSimilarity : null;
  }

  /**
   * Classify an onset (time in s) against the scheduled click times (s,
   * ascending). Give the onset's `SpectralRise` to recognise it by ear once a
   * click is learnt; a band share alone (or null when unknown) uses the band.
   */
  check(
    onsetTime: number,
    rise: SpectralRise | number | null,
    clickTimes: readonly number[],
  ): ClickEchoVerdict {
    const spectrum = typeof rise === "object" ? rise : null;
    const click = spectrum ? this.learntClick : null;
    if (spectrum && click) {
      let delayMs: number | null = null;
      for (let i = clickTimes.length - 1; i >= 0; i--) {
        const d = (onsetTime - clickTimes[i]) * 1000;
        if (d < 0) continue;
        if (d > this.config.learnMaxDelayMs + this.config.delayToleranceMs) break;
        const off = Math.abs(d - click.delayMs);
        if (off <= this.config.delayToleranceMs) {
          if (delayMs === null || off < Math.abs(delayMs - click.delayMs)) delayMs = d;
        }
      }
      const echo =
        delayMs !== null &&
        riseSimilarity(spectrum.bands, click.bands) >= this.config.minSimilarity;
      if (echo) this.remember(delayMs!);
      return { echo, delayMs };
    }

    const bandShare = spectrum ? spectrum.bandShare : (rise as number | null);
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
    if (echo) this.remember(delayMs!);
    return { echo, delayMs };
  }

  private remember(delayMs: number): void {
    this.delays.push(delayMs);
    if (this.delays.length > this.config.echoWindow) this.delays.shift();
  }

  /** Measured speaker → microphone round trip, in ms, or null before the first echo. */
  get roundTripMs(): number | null {
    if (this.delays.length > 0) return median(this.delays);
    return this.learntClick?.delayMs ?? null;
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

  /** Forget the round trip and the learnt click. */
  reset(): void {
    this.delays.length = 0;
    this.learnt.length = 0;
    this.cachedClick = undefined;
  }
}
