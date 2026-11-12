/**
 * Song break: tells a display that a song has ended, from a long enough
 * silence, so it can start the song key over instead of carrying the last
 * song's key into the next one.
 *
 * Fires once per silence, on the frame the silence reaches `seconds`; the
 * next sound re-arms it. Quiet passages inside a song are far shorter than
 * the default 8 s.
 */

export interface SongBreakOptions {
  /** Seconds of silence that end a song. Default 8. */
  seconds?: number;
  /** Silence threshold, on the `TonalityFrame.signalLevelDb` scale. Default −90. */
  silenceDb?: number;
}

export class SongBreak {
  private readonly seconds: number;
  private readonly silenceDb: number;
  private quietSince: number | null = null;
  private fired = false;

  constructor(options: SongBreakOptions = {}) {
    this.seconds = options.seconds ?? 8;
    this.silenceDb = options.silenceDb ?? -90;
  }

  /** Feed one frame; true on the frame a song break is detected. */
  push(levelDb: number, timeSeconds: number): boolean {
    if (levelDb >= this.silenceDb) {
      this.quietSince = null;
      this.fired = false;
      return false;
    }
    this.quietSince ??= timeSeconds;
    if (!this.fired && timeSeconds - this.quietSince >= this.seconds) {
      this.fired = true;
      return true;
    }
    return false;
  }
}
