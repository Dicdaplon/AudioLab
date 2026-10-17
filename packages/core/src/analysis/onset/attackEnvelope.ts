/**
 * Fine level envelope and attack localisation. Pure TypeScript.
 *
 * The onset detection function says *that* a note started somewhere in
 * its last window (21 ms); this envelope says *where*. It keeps the RMS
 * level, in dBFS, of short blocks (`blockSize`, default 32 samples ≈
 * 0.7 ms at 48 kHz) over the last `historySeconds`, and `locate()` walks
 * back from a detection to the start of the level rise:
 *
 *   peak     = first block, after the quietest one of the search range,
 *              within `peakToleranceDb` of the loudest (a strum: its first string)
 *   baseline = quietest block in the `baselineSeconds` before the peak
 *   attack   = start of the run of blocks, ending at the peak, whose level is at least
 *              baseline + `riseFraction` · (peak − baseline)       (in dB)
 *
 * When the rise is smaller than `minRiseDb` (a hammer-on, a legato change,
 * a note over a louder ringing one) the level carries no usable attack and
 * `locate()` returns null: the caller keeps the detection frame.
 *
 * This is the "backtracking" step of onset detectors used for timing, e.g.
 * librosa's `onset_backtrack`, refined on an energy envelope finer than the
 * spectral frames.
 */

import { resolveConfig } from "../../utils/resolveConfig";
import { ENVELOPE_FLOOR_DB, rmsToDb } from "../levels";

export interface AttackEnvelopeConfig {
  sampleRate: number;
  /** Samples per envelope block. Default 32. */
  blockSize: number;
  /** Envelope kept, in seconds. Default 0.2. */
  historySeconds: number;
  /** Search for the baseline this long before the peak, in seconds. Default 0.03. */
  baselineSeconds: number;
  /** Fraction of the dB rise that marks the attack. Default 0.3. */
  riseFraction: number;
  /** Minimum rise for a localisation, in dB. Default 4. */
  minRiseDb: number;
  /**
   * First-order pre-emphasis y[n] = x[n] − a·x[n−1] before the level. It
   * tilts the envelope towards the broadband pick transient and away from
   * the low partials of strings still ringing. Default 0.97; 0 disables it.
   */
  preEmphasis: number;
  /** Rise counted at most, in dB, so a near-silent baseline does not stretch the target. Default 30. */
  maxRiseDb: number;
  /** The attack peak is the first block this close to the loudest one, in dB. Default 6. */
  peakToleranceDb: number;
}

export const ATTACK_ENVELOPE_DEFAULTS: Omit<AttackEnvelopeConfig, "sampleRate"> = {
  blockSize: 32,
  historySeconds: 0.2,
  baselineSeconds: 0.03,
  riseFraction: 0.3,
  minRiseDb: 4,
  preEmphasis: 0.97,
  maxRiseDb: 30,
  peakToleranceDb: 6,
};

export type AttackEnvelopeOptions = Partial<AttackEnvelopeConfig> & { sampleRate: number };

export interface LocatedAttack {
  /** Stream frame of the first sample of the attack block. */
  frame: number;
  /** Level of the loudest block, in dBFS. */
  peakDb: number;
  /** Level before the attack, in dBFS. */
  baselineDb: number;
}

export class AttackEnvelope {
  readonly config: Readonly<AttackEnvelopeConfig>;
  private readonly levels: Float32Array;
  private sumSquares = 0;
  private previous = 0;
  private inBlock = 0;
  /** Number of complete blocks since the stream start. */
  private blocks = 0;
  /** Stream frame of block 0. */
  private origin = 0;
  private nextFrame: number | null = null;

  constructor(options: AttackEnvelopeOptions) {
    if (!(options.sampleRate > 0)) throw new Error("sampleRate must be > 0");
    const cfg: AttackEnvelopeConfig = resolveConfig(
      { ...ATTACK_ENVELOPE_DEFAULTS, sampleRate: options.sampleRate },
      options,
    );
    if (!(cfg.blockSize >= 1)) throw new Error("blockSize must be ≥ 1");
    this.config = cfg;
    const length = Math.max(8, Math.ceil((cfg.historySeconds * cfg.sampleRate) / cfg.blockSize));
    this.levels = new Float32Array(length).fill(ENVELOPE_FLOOR_DB);
  }

  reset(): void {
    this.levels.fill(ENVELOPE_FLOOR_DB);
    this.sumSquares = 0;
    this.previous = 0;
    this.inBlock = 0;
    this.blocks = 0;
    this.origin = 0;
    this.nextFrame = null;
  }

  /** Same clock convention as `SuperFluxOdf.push`: a discontinuity restarts. */
  push(samples: ArrayLike<number>, startFrame?: number): void {
    if (startFrame !== undefined && this.nextFrame !== null && startFrame !== this.nextFrame) {
      this.reset();
    }
    if (this.nextFrame === null) {
      this.nextFrame = startFrame ?? 0;
      this.origin = this.nextFrame;
    }
    const { blockSize } = this.config;
    for (let i = 0; i < samples.length; i++) {
      const x = samples[i] - this.config.preEmphasis * this.previous;
      this.previous = samples[i];
      this.sumSquares += x * x;
      this.inBlock++;
      if (this.inBlock === blockSize) {
        const rms = Math.sqrt(this.sumSquares / blockSize);
        this.levels[this.blocks % this.levels.length] = rmsToDb(rms);
        this.blocks++;
        this.sumSquares = 0;
        this.inBlock = 0;
      }
    }
    this.nextFrame += samples.length;
  }

  /** Level of the last complete block, in dBFS. */
  get levelDb(): number {
    return this.blocks === 0
      ? ENVELOPE_FLOOR_DB
      : this.levels[(this.blocks - 1) % this.levels.length];
  }

  /**
   * Find the attack whose rise ends before `endFrame` and lies within
   * `searchFrames` before it. Returns null when the range is not in the
   * history any more, or the level does not rise by `minRiseDb`.
   */
  locate(endFrame: number, searchFrames: number): LocatedAttack | null {
    const { blockSize, sampleRate, baselineSeconds, riseFraction, minRiseDb } = this.config;
    const oldest = Math.max(0, this.blocks - this.levels.length);
    const last = Math.min(this.blocks, Math.floor((endFrame - this.origin) / blockSize)) - 1;
    const first = Math.max(oldest, Math.floor((endFrame - searchFrames - this.origin) / blockSize));
    if (last < first) return null;
    const level = (b: number) => this.levels[b % this.levels.length];

    // The rise starts after the quietest block of the range; its peak is
    // the FIRST block within `peakToleranceDb` of the loudest one after it,
    // so a strum peaks at its first string rather than at the loudest.
    let maxBlock = first;
    for (let b = first; b <= last; b++) if (level(b) > level(maxBlock)) maxBlock = b;
    let minBlock = first;
    for (let b = first; b <= maxBlock; b++) if (level(b) < level(minBlock)) minBlock = b;
    let peakBlock = maxBlock;
    for (let b = minBlock; b <= maxBlock; b++) {
      if (level(b) >= level(maxBlock) - this.config.peakToleranceDb) {
        peakBlock = b;
        break;
      }
    }
    const baselineBlocks = Math.max(1, Math.round((baselineSeconds * sampleRate) / blockSize));
    const baseFrom = Math.max(oldest, peakBlock - baselineBlocks);
    let baseBlock = peakBlock;
    for (let b = baseFrom; b <= peakBlock; b++) if (level(b) < level(baseBlock)) baseBlock = b;

    const peakDb = level(maxBlock);
    const baselineDb = level(baseBlock);
    if (peakDb - baselineDb < minRiseDb) return null;
    // A digital-silence baseline would put the target below any real
    // background and let the walk-back run through a ringing note.
    const reference = Math.max(baselineDb, level(peakBlock) - this.config.maxRiseDb);
    const target = reference + riseFraction * (level(peakBlock) - reference);
    // Walk back from the peak: the attack is the start of the rise that
    // leads to it, not an earlier bump of a ringing note.
    let attack = peakBlock;
    while (attack > baseBlock + 1 && level(attack - 1) >= target) attack--;
    return { frame: this.origin + attack * blockSize, peakDb, baselineDb };
  }
}
