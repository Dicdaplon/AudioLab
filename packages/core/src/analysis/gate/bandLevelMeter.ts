/**
 * Band-limited level meter: high-pass filter, then the RMS level of short
 * blocks in dBFS. Pure TypeScript.
 *
 * The high-pass (2nd-order Butterworth, default 80 Hz, just below a
 * guitar's low E at 82 Hz) attenuates desk thumps, the rumble of fans and
 * traffic and the fundamental of mains hum (−8 dB at 50 Hz, −3 dB at the
 * low E), which otherwise dominate the broadband level of a laptop
 * microphone and hide quiet notes. Its slope is gentle on purpose: a
 * steeper filter would also eat the low E. The filter is the RBJ
 * "Audio EQ Cookbook" high-pass with Q = 1/√2.
 */

import { ENVELOPE_FLOOR_DB } from "../onset/attackEnvelope";

export interface BandLevelMeterConfig {
  sampleRate: number;
  /** High-pass cutoff in Hz; 0 disables the filter. Default 80. */
  highPassHz: number;
  /** Block length in seconds. Default 0.01. */
  blockSeconds: number;
}

export type BandLevelMeterOptions = Partial<BandLevelMeterConfig> & { sampleRate: number };

/** One block level. `endFrame` is the stream frame just after the block. */
export interface LevelBlock {
  endFrame: number;
  levelDb: number;
}

export class BandLevelMeter {
  readonly config: Readonly<BandLevelMeterConfig>;
  readonly blockSize: number;
  private readonly b0: number;
  private readonly b1: number;
  private readonly b2: number;
  private readonly a1: number;
  private readonly a2: number;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  private sumSquares = 0;
  private inBlock = 0;
  private nextFrame: number | null = null;

  constructor(options: BandLevelMeterOptions) {
    if (!(options.sampleRate > 0)) throw new Error("sampleRate must be > 0");
    const cfg: BandLevelMeterConfig = {
      sampleRate: options.sampleRate,
      highPassHz: options.highPassHz ?? 80,
      blockSeconds: options.blockSeconds ?? 0.01,
    };
    this.config = cfg;
    this.blockSize = Math.max(1, Math.round(cfg.blockSeconds * cfg.sampleRate));
    if (cfg.highPassHz > 0 && cfg.highPassHz < cfg.sampleRate / 2) {
      const w0 = (2 * Math.PI * cfg.highPassHz) / cfg.sampleRate;
      const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
      const cos = Math.cos(w0);
      const a0 = 1 + alpha;
      this.b0 = (1 + cos) / 2 / a0;
      this.b1 = -(1 + cos) / a0;
      this.b2 = (1 + cos) / 2 / a0;
      this.a1 = (-2 * cos) / a0;
      this.a2 = (1 - alpha) / a0;
    } else {
      this.b0 = 1;
      this.b1 = this.b2 = this.a1 = this.a2 = 0;
    }
  }

  reset(): void {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.sumSquares = 0;
    this.inBlock = 0;
    this.nextFrame = null;
  }

  /** Feed samples; returns the levels of the blocks completed by them. */
  push(samples: ArrayLike<number>, startFrame?: number): LevelBlock[] {
    if (this.nextFrame === null || startFrame !== undefined) {
      this.nextFrame = startFrame ?? this.nextFrame ?? 0;
    }
    const out: LevelBlock[] = [];
    for (let i = 0; i < samples.length; i++) {
      const x = samples[i];
      const y =
        this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
      this.x2 = this.x1;
      this.x1 = x;
      this.y2 = this.y1;
      this.y1 = y;
      this.sumSquares += y * y;
      this.inBlock++;
      if (this.inBlock === this.blockSize) {
        const rms = Math.sqrt(this.sumSquares / this.blockSize);
        out.push({
          endFrame: this.nextFrame + i + 1,
          levelDb: rms > 0 ? Math.max(ENVELOPE_FLOOR_DB, 20 * Math.log10(rms)) : ENVELOPE_FLOOR_DB,
        });
        this.sumSquares = 0;
        this.inBlock = 0;
      }
    }
    this.nextFrame += samples.length;
    return out;
  }
}
