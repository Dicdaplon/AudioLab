/**
 * Audio clock ↔ page clock, measured from the capture itself. Pure.
 *
 * Onsets are timestamped in AudioContext time (sample-exact); a game draws
 * its notes with requestAnimationFrame in `performance.now()` time. This
 * class links the two clocks without any sound played, from what the
 * capture already delivers: each batch says which context frames it holds
 * (`startFrame`, `length`) and the caller notes when it arrived
 * (`receivedAtMs`, from `performance.now()`).
 *
 *   d = receivedAtMs − 1000 · (startFrame + length) / sampleRate
 *
 * A batch cannot arrive before its last sample has been processed, so d is
 * the clock offset plus a non-negative delivery delay (audio thread → main
 * thread, main-thread busy, timer throttling). The lower envelope of d —
 * its minimum over the last `windowMs` — is the offset; what a batch adds
 * on top of it is its delivery delay. The window slides, so a slow drift
 * between the two clocks (crystals differ by tens of ppm) is followed.
 *
 * It also measures what makes the capture feel slow to start: the time
 * from `markStart()` to the first batch and to the first batch with signal,
 * the delay with which batches arrive, and gaps in the frame sequence.
 *
 * What it cannot see: the hardware/driver input latency (microphone →
 * audio thread). No web API measures it without a loopback; it is an
 * explicit, assumed component of `estimateTimingBudget`.
 */

import { resolveConfig } from "../utils/resolveConfig";

export interface ClockSyncConfig {
  /** Memory of the offset envelope and of the delay statistics, in ms. Default 5000. */
  windowMs: number;
}

export const CLOCK_SYNC_DEFAULTS: ClockSyncConfig = { windowMs: 5000 };

export interface CaptureBatchInfo {
  /** Context frame of the batch's first sample. */
  startFrame: number;
  /** Samples in the batch. */
  length: number;
  sampleRate: number;
  /** `performance.now()` when the batch reached the main thread. */
  receivedAtMs: number;
  /** True when the batch holds signal (not digital silence). Default true. */
  hasSignal?: boolean;
}

export interface ClockSyncStats {
  /** Batches observed. */
  batches: number;
  /** perfMs = 1000 · contextTime + offsetMs; null before the first batch. */
  offsetMs: number | null;
  /** How much the offset moved within the window, in ms (drift and jumps). */
  offsetSpreadMs: number;
  /** Delivery delay of the last batch beyond the best case, in ms. */
  lastDelayMs: number;
  /** Median and 95th percentile of the delivery delay over the window, in ms. */
  medianDelayMs: number;
  p95DelayMs: number;
  maxDelayMs: number;
  /** Mean batch duration, in ms (the capture's own buffering). */
  batchMs: number;
  /** From `markStart()` to the first batch, in ms; null until both happened. */
  startupMs: number | null;
  /** From `markStart()` to the first batch with signal, in ms. */
  firstSignalMs: number | null;
  /** Discontinuities in the frame sequence, and frames missing in total. */
  gaps: number;
  missingFrames: number;
}

interface Observation {
  receivedAtMs: number;
  d: number;
  durationMs: number;
}

export class AudioClockSync {
  readonly config: ClockSyncConfig;
  private readonly recent: Observation[] = [];
  private batches = 0;
  private startMs: number | null = null;
  private startupMs: number | null = null;
  private firstSignalMs: number | null = null;
  private nextFrame: number | null = null;
  private gaps = 0;
  private missingFrames = 0;
  private lastD = 0;

  constructor(config: Partial<ClockSyncConfig> = {}) {
    this.config = resolveConfig(CLOCK_SYNC_DEFAULTS, config);
  }

  /** Note when the capture was requested (for the startup measures). */
  markStart(atMs: number): void {
    this.startMs = atMs;
    this.startupMs = null;
    this.firstSignalMs = null;
  }

  observeBatch(batch: CaptureBatchInfo): void {
    const { startFrame, length, sampleRate, receivedAtMs } = batch;
    if (!(sampleRate > 0) || !(length > 0)) return;
    if (this.nextFrame !== null && startFrame !== this.nextFrame) {
      this.gaps++;
      if (startFrame > this.nextFrame) this.missingFrames += startFrame - this.nextFrame;
    }
    this.nextFrame = startFrame + length;
    this.batches++;
    if (this.startMs !== null) {
      this.startupMs ??= receivedAtMs - this.startMs;
      if (batch.hasSignal !== false) this.firstSignalMs ??= receivedAtMs - this.startMs;
    }

    const d = receivedAtMs - (1000 * (startFrame + length)) / sampleRate;
    this.lastD = d;
    this.recent.push({ receivedAtMs, d, durationMs: (1000 * length) / sampleRate });
    const horizon = receivedAtMs - this.config.windowMs;
    while (this.recent.length > 1 && this.recent[0].receivedAtMs < horizon) this.recent.shift();
  }

  /** Clock offset (perfMs − 1000·contextTime), or null before the first batch. */
  get offsetMs(): number | null {
    if (this.recent.length === 0) return null;
    let m = Infinity;
    for (const o of this.recent) if (o.d < m) m = o.d;
    return m;
  }

  /** AudioContext seconds → performance.now() milliseconds (null before the first batch). */
  contextTimeToPerfMs(contextTime: number): number | null {
    const offset = this.offsetMs;
    return offset === null ? null : 1000 * contextTime + offset;
  }

  /** performance.now() milliseconds → AudioContext seconds (null before the first batch). */
  perfMsToContextTime(perfMs: number): number | null {
    const offset = this.offsetMs;
    return offset === null ? null : (perfMs - offset) / 1000;
  }

  stats(): ClockSyncStats {
    const offset = this.offsetMs;
    const delays = this.recent.map((o) => o.d - (offset ?? o.d)).sort((a, b) => a - b);
    const pick = (q: number) =>
      delays.length === 0 ? 0 : delays[Math.min(delays.length - 1, Math.floor(q * delays.length))];
    // Offset movement: minimum of the older half vs the newer half.
    let spread = 0;
    if (this.recent.length >= 4) {
      const half = Math.floor(this.recent.length / 2);
      let a = Infinity;
      let b = Infinity;
      this.recent.forEach((o, i) => {
        if (i < half) a = Math.min(a, o.d);
        else b = Math.min(b, o.d);
      });
      spread = Math.abs(a - b);
    }
    const batchMs =
      this.recent.length === 0
        ? 0
        : this.recent.reduce((s, o) => s + o.durationMs, 0) / this.recent.length;
    return {
      batches: this.batches,
      offsetMs: offset,
      offsetSpreadMs: spread,
      lastDelayMs: offset === null ? 0 : this.lastD - offset,
      medianDelayMs: pick(0.5),
      p95DelayMs: pick(0.95),
      maxDelayMs: delays.length === 0 ? 0 : delays[delays.length - 1],
      batchMs,
      startupMs: this.startupMs,
      firstSignalMs: this.firstSignalMs,
      gaps: this.gaps,
      missingFrames: this.missingFrames,
    };
  }

  reset(): void {
    this.recent.length = 0;
    this.batches = 0;
    this.startMs = null;
    this.startupMs = null;
    this.firstSignalMs = null;
    this.nextFrame = null;
    this.gaps = 0;
    this.missingFrames = 0;
    this.lastD = 0;
  }
}
