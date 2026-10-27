/**
 * Sample-rate conversion for the note models, which expect a fixed rate
 * (Basic Pitch: 22050 Hz) while a microphone runs at 44.1 or 48 kHz.
 *
 * Windowed-sinc interpolation: each output sample is a weighted sum of the
 * input samples around its position, the weights being a sinc low-pass
 * (cut at 0.97 × the lower of the two Nyquist frequencies, so nothing above
 * the new Nyquist folds back) tapered by a Blackman window over 32 zero
 * crossings. The kernel is tabulated (512 points per input sample, linear
 * interpolation between them) and the weights are normalised by their sum,
 * so a constant stays constant, also near the ends of a finite signal.
 *
 * `StreamResampler` produces the same samples as `resampleAudio` on the same
 * input, block by block: an output sample is emitted as soon as all the
 * input samples under its kernel have arrived (a delay of 32 / cutoff input
 * samples, ~1.5 ms from 48 kHz to 22050 Hz), and `flush` emits the tail.
 */

const ZERO_CROSSINGS = 32;
const TABLE_STEPS = 512;
const CUTOFF = 0.97;

interface Kernel {
  table: Float32Array;
  /** Half-width of the kernel, in input samples. */
  half: number;
}

const kernels = new Map<number, Kernel>();

/** Tabulated Blackman-windowed sinc for an output/input rate ratio. */
function kernelFor(ratio: number): Kernel {
  let k = kernels.get(ratio);
  if (k) return k;
  const cutoff = Math.min(1, ratio) * CUTOFF; // relative to the input Nyquist
  const half = Math.ceil(ZERO_CROSSINGS / cutoff);
  const table = new Float32Array(half * TABLE_STEPS + 2);
  for (let i = 0; i < table.length; i++) {
    const d = i / TABLE_STEPS;
    const u = d * cutoff;
    const sinc = u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
    const p = (d / half + 1) / 2; // 0.5..1 across the symmetric window
    const w =
      p >= 1 ? 0 : 0.42 - 0.5 * Math.cos(2 * Math.PI * p) + 0.08 * Math.cos(4 * Math.PI * p);
    table[i] = cutoff * sinc * w;
  }
  k = { table, half };
  kernels.set(ratio, k);
  return k;
}

function checkRates(from: number, to: number): void {
  if (!(from > 0 && to > 0 && Number.isFinite(from) && Number.isFinite(to))) {
    throw new Error(`resample: invalid sample rates ${from} → ${to}`);
  }
}

/** Incremental resampler: push blocks of input, get the output samples they complete. */
export class StreamResampler {
  readonly fromRate: number;
  readonly toRate: number;
  private readonly ratio: number;
  private readonly kernel: Kernel | null;
  /** Input samples still needed, `buf[0]` being input index `bufStart`. */
  private buf = new Float32Array(0);
  private bufLength = 0;
  private bufStart = 0;
  /** Input samples received so far. */
  private received = 0;
  /** Index of the next output sample. */
  private next = 0;

  constructor(fromRate: number, toRate: number) {
    checkRates(fromRate, toRate);
    this.fromRate = fromRate;
    this.toRate = toRate;
    this.ratio = toRate / fromRate;
    this.kernel = fromRate === toRate ? null : kernelFor(this.ratio);
  }

  /** Input samples an output sample waits for after its own position. */
  get delaySamples(): number {
    return this.kernel ? this.kernel.half : 0;
  }

  /** Append input; returns the output samples now complete (possibly none). */
  push(input: ArrayLike<number>): Float32Array {
    if (!this.kernel) {
      this.received += input.length;
      this.next += input.length;
      return Float32Array.from(input);
    }
    this.append(input);
    return this.produce(false);
  }

  /** End of stream: emit the remaining outputs, the missing future treated as absent. */
  flush(): Float32Array {
    return this.kernel ? this.produce(true) : new Float32Array(0);
  }

  reset(): void {
    this.buf = new Float32Array(0);
    this.bufLength = 0;
    this.bufStart = 0;
    this.received = 0;
    this.next = 0;
  }

  private append(input: ArrayLike<number>): void {
    const needed = this.bufLength + input.length;
    if (needed > this.buf.length) {
      const grown = new Float32Array(Math.max(needed, 2 * this.buf.length, 4096));
      grown.set(this.buf.subarray(0, this.bufLength));
      this.buf = grown;
    }
    for (let i = 0; i < input.length; i++) this.buf[this.bufLength + i] = input[i];
    this.bufLength += input.length;
    this.received += input.length;
  }

  private produce(final: boolean): Float32Array {
    const { table, half } = this.kernel!;
    const ratio = this.ratio;
    const last = this.received - 1;
    const total = Math.floor(this.received * ratio);
    const out: number[] = [];
    for (;;) {
      const i = this.next;
      if (i >= total) break;
      const t = i / ratio;
      const c = Math.floor(t);
      if (!final && c + half > last) break;
      let acc = 0;
      let wsum = 0;
      const k0 = Math.max(0, c - half + 1);
      const k1 = Math.min(last, c + half);
      for (let k = k0; k <= k1; k++) {
        const pos = Math.abs(t - k) * TABLE_STEPS;
        const ip = Math.floor(pos);
        if (ip >= table.length - 1) continue;
        const h = table[ip] + (pos - ip) * (table[ip + 1] - table[ip]);
        acc += this.buf[k - this.bufStart] * h;
        wsum += h;
      }
      out.push(wsum > 0 ? acc / wsum : 0);
      this.next++;
    }
    // Drop the input no future output can reach.
    const keepFrom = Math.max(0, Math.floor(this.next / ratio) - half + 1);
    const drop = Math.min(this.bufLength, keepFrom - this.bufStart);
    if (drop > 0) {
      this.buf.copyWithin(0, drop, this.bufLength);
      this.bufLength -= drop;
      this.bufStart += drop;
    }
    return Float32Array.from(out);
  }
}

/** Resample a whole signal (`floor(length × to / from)` samples). Returns a copy. */
export function resampleAudio(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  const r = new StreamResampler(fromRate, toRate);
  const head = r.push(input);
  const tail = r.flush();
  if (tail.length === 0) return head;
  const out = new Float32Array(head.length + tail.length);
  out.set(head);
  out.set(tail, head.length);
  return out;
}
