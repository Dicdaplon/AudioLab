/**
 * CREPE tiny pitch estimation, inference only, in plain TypeScript.
 *
 * CREPE (Kim, Salamon, Li & Bello 2018, "CREPE: A Convolutional
 * Representation for Pitch Estimation", ICASSP) is a 1-D convolutional
 * network that reads 1024 raw samples at 16 kHz (64 ms) and outputs 360
 * sigmoid activations, one per 20-cent bin from about 32 Hz to 2 kHz. The
 * pitch is the activation-weighted average of the bins around the strongest
 * one; the confidence is the strongest activation. Weights: the "tiny"
 * model of github.com/marl/crepe (MIT, © 2018 Jong Wook Kim), converted
 * once by `scripts/convertCrepeModel.ts` into the compact file read by
 * `loadCrepeModel` (see `parseCrepeModel` for the format).
 *
 * Network: 6 × [conv "same" + ReLU → batch norm → max-pool 2] then a dense
 * layer of 360 sigmoids. Kernels 512 (stride 4) then 64; channels
 * 128, 16, 16, 16, 32, 64; about 37 M multiply-adds per frame done
 * directly (28 M once the zero padding is skipped), which plain JavaScript
 * runs at ~1.5 G/s: ~20 ms.
 *
 * Inference (the speed comes from here):
 *
 * - Each layer is computed either directly or through FFTs, whichever
 *   costs fewer operations (chosen once at load). The first two layers
 *   (90 % of the work) go through FFTs: one FFT per pair of input
 *   channels, a complex multiply-add per (output, input, bin) with the
 *   kernel spectra precomputed at load, one inverse FFT per pair of output
 *   channels. The stride 4 of the first layer is applied in the frequency
 *   domain (the 4 aliases of each bin are summed, then a 4× shorter
 *   inverse FFT). Only the bins a real output needs are kept.
 * - The direct layers keep activations time-major in buffers that already
 *   hold the zero padding, so the receptive field of output t is one
 *   contiguous slice and every output is a dot product ("implicit
 *   im2col"), computed in 4 channels × 4 times register tiles that skip
 *   the padding.
 * - Bias, ReLU, the folded batch norm and the max-pool are fused into the
 *   write of each layer's output into the next layer's padded input. All
 *   buffers are allocated once per model.
 *
 * `CrepePitch` wraps one frame: resampling of the caller's window to
 * 16 kHz (a windowed-sinc matrix precomputed per window length), the
 * network, the decoding, and an MPM refinement of the cents (CREPE decides
 * whether there is a note and which one, the NSDF peak near that period
 * gives the cents, which CREPE's 20-cent bins do not resolve well).
 */

import { fftInPlace } from "./fft";
import {
  frequencyToPitch,
  refineFrequencyNear,
  smoothPitchHistory,
  type PitchEstimate,
} from "./pitch";
import { A4_FREQ } from "../utils/notes";

/** Sample rate the network was trained at. */
export const CREPE_SAMPLE_RATE = 16000;
/** Samples per network frame, at 16 kHz. */
export const CREPE_FRAME = 1024;
/** Number of output bins (20 cents each). */
export const CREPE_BINS = 360;

const MAGIC = "CREP";
const BN_EPSILON = 0.001;

interface TensorEntry {
  name: string;
  shape: number[];
  /** Offset in elements from the start of the data section. */
  offset: number;
}

interface ModelHeader {
  format: string;
  version: number;
  dtype: "float16" | "float32";
  tensors: TensorEntry[];
}

interface ConvLayer {
  k: number;
  cin: number;
  cout: number;
  stride: number;
  /** Taps per output: k · cin. */
  taps: number;
  /** [cout][k·cin], tap index j·cin + i. */
  w: Float32Array;
  bias: Float32Array;
  /** Batch norm folded: y = relu(conv)·scale + shift. */
  scale: Float32Array;
  shift: Float32Array;
  inLen: number;
  outLen: number;
  padBefore: number;
  /** Padded input, [(padBefore + inLen + padAfter)][cin], padding stays 0. */
  input: Float32Array;
  /** Set when the layer runs through FFTs. */
  fft: FftConv | null;
}

/**
 * FFT form of a conv layer: y_o[t] = Σ_i Σ_j w[o][j][i] · xp_i[stride·t + j]
 * is a circular correlation of length n (no wrap: n ≥ the padded length),
 * decimated by `stride`: Y_o[k] = Σ_m Σ_i conj(W_oi[k + m·M]) · X_i[k + m·M],
 * M = n / stride, then a real inverse FFT of length M. Bins k = 0..M/2.
 */
interface FftConv {
  n: number;
  /** n / stride. */
  m: number;
  /** Bins kept per (output, input): stride · (m/2 + 1), index a·(m/2+1) + k ↔ frequency k + a·m. */
  bins: number;
  /** Conjugated kernel spectra, [cout][cin][bins] interleaved re/im. */
  spectra: Float32Array;
  /** Input spectra of the frame, [cin][bins] interleaved re/im. */
  x: Float64Array;
  /** Accumulated output spectrum of one channel, [bins] re/im. */
  acc: Float64Array;
  /** Folded spectra of two output channels, [m/2+1] re/im each. */
  da: Float64Array;
  db: Float64Array;
  re: Float64Array;
  im: Float64Array;
}

function buildFftConv(
  w: Float32Array,
  k: number,
  cin: number,
  cout: number,
  stride: number,
  paddedLen: number,
): FftConv {
  let n = 2;
  while (n < paddedLen) n *= 2;
  const m = n / stride;
  const half = m / 2 + 1;
  const bins = stride * half;
  const spectra = new Float32Array(cout * cin * bins * 2);
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  const taps = k * cin;
  for (let o = 0; o < cout; o++) {
    for (let i = 0; i < cin; i++) {
      re.fill(0);
      im.fill(0);
      for (let j = 0; j < k; j++) re[j] = w[o * taps + j * cin + i];
      fftInPlace(re, im);
      const base = (o * cin + i) * bins * 2;
      for (let a = 0; a < stride; a++) {
        for (let b = 0; b < half; b++) {
          const f = b + a * m;
          const p = base + (a * half + b) * 2;
          spectra[p] = re[f];
          spectra[p + 1] = -im[f]; // conjugate: correlation
        }
      }
    }
  }
  return {
    n,
    m,
    bins,
    spectra,
    x: new Float64Array(cin * bins * 2),
    acc: new Float64Array(bins * 2),
    da: new Float64Array(half * 2),
    db: new Float64Array(half * 2),
    re,
    im,
  };
}

/** Rough operation counts of the two ways to run a layer. */
function preferFft(k: number, cin: number, cout: number, stride: number, inLen: number): boolean {
  const outLen = Math.ceil(inLen / stride);
  const padTotal = Math.max(0, (outLen - 1) * stride + k - inLen);
  const padBefore = Math.floor(padTotal / 2);
  let valid = 0;
  for (let t = 0; t < outLen; t++) {
    const s0 = t * stride - padBefore;
    valid += Math.min(k, inLen - s0) - Math.max(0, -s0);
  }
  const direct = valid * cin * cout;
  let n = 2;
  while (n < inLen + padTotal) n *= 2;
  const m = n / stride;
  const ffts =
    Math.ceil(cin / 2) * n * Math.log2(n) * 2.5 + Math.ceil(cout / 2) * m * Math.log2(m) * 2.5;
  const products = cout * cin * stride * (m / 2 + 1) * 4;
  return ffts + products < direct;
}

/**
 * A loaded CREPE model: weights in inference layout and the work buffers.
 * Not safe to share between concurrent callers (one frame at a time).
 */
export interface CrepeModel {
  /** Number of parameters. */
  readonly parameters: number;
  /** @internal */
  readonly layers: readonly ConvLayer[];
  /** @internal [360][256] */
  readonly dense: Float32Array;
  /** @internal */
  readonly denseBias: Float32Array;
  /** @internal last layer's pooled output, flattened [time][channel] */
  readonly flat: Float32Array;
}

export interface CrepeModelOptions {
  /**
   * Run every layer as a direct convolution (no FFT). Slower (~20 ms per
   * frame instead of a few); the two give the same activations to ~1e-6.
   * Default false.
   */
  directConvolution?: boolean;
}

/** IEEE 754 half → float. */
function halfToFloat(h: number): number {
  const sign = h & 0x8000 ? -1 : 1;
  const exp = (h >> 10) & 0x1f;
  const frac = h & 0x3ff;
  if (exp === 0) return sign * frac * 2 ** -24;
  if (exp === 31) return frac ? NaN : sign * Infinity;
  return sign * (1 + frac / 1024) * 2 ** (exp - 15);
}

/**
 * Parse a converted CREPE model file:
 *
 *   "CREP" | u32 LE header length H | H bytes of UTF-8 JSON header |
 *   zero padding to a multiple of 4 | tensor data (little-endian)
 *
 * The header is `{ format: "audiolab-crepe", version: 1, dtype: "float16" |
 * "float32", tensors: [{ name, shape, offset }] }` with the Keras tensor
 * names and shapes of the original model (`crepe_conv1/kernel`
 * [512, 1, 1, 128], `crepe_conv1_BN/gamma`, …, `crepe_classifier/kernel`
 * [256, 360]) and offsets in elements.
 */
export function parseCrepeModel(buffer: ArrayBuffer, options: CrepeModelOptions = {}): CrepeModel {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (bytes.length < 8 || String.fromCharCode(...bytes.subarray(0, 4)) !== MAGIC) {
    throw new Error("Not a CREPE model file (bad magic)");
  }
  const headerLength = view.getUint32(4, true);
  if (8 + headerLength > bytes.length) throw new Error("Truncated CREPE model header");
  const header = JSON.parse(
    new TextDecoder().decode(bytes.subarray(8, 8 + headerLength)),
  ) as ModelHeader;
  if (header.format !== "audiolab-crepe" || header.version !== 1) {
    throw new Error(`Unsupported CREPE model format ${header.format} v${header.version}`);
  }
  const dataStart = Math.ceil((8 + headerLength) / 4) * 4;
  const width = header.dtype === "float16" ? 2 : 4;

  const tensors = new Map<string, { shape: number[]; data: Float32Array }>();
  for (const t of header.tensors) {
    const n = t.shape.reduce((a, b) => a * b, 1);
    const start = dataStart + t.offset * width;
    if (start + n * width > bytes.length) throw new Error(`Truncated CREPE tensor ${t.name}`);
    const data = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      data[i] =
        width === 2
          ? halfToFloat(view.getUint16(start + 2 * i, true))
          : view.getFloat32(start + 4 * i, true);
    }
    tensors.set(t.name, { shape: t.shape, data });
  }
  return buildModel(tensors, options.directConvolution ?? false);
}

function buildModel(
  tensors: Map<string, { shape: number[]; data: Float32Array }>,
  forceDirect: boolean,
): CrepeModel {
  const get = (name: string) => {
    const t = tensors.get(name);
    if (!t) throw new Error(`CREPE weight ${name} missing`);
    return t;
  };
  let parameters = 0;
  for (const t of tensors.values()) parameters += t.data.length;

  const layers: ConvLayer[] = [];
  let len = CREPE_FRAME;
  for (let l = 1; l <= 6; l++) {
    const kern = get(`crepe_conv${l}/kernel`); // [k, 1, cin, cout]
    const [k, , cin, cout] = kern.shape;
    if (cout % 4 !== 0) throw new Error("CREPE layer widths must be multiples of 4");
    const taps = k * cin;
    const w = new Float32Array(cout * taps);
    for (let j = 0; j < k; j++)
      for (let i = 0; i < cin; i++)
        for (let o = 0; o < cout; o++)
          w[o * taps + j * cin + i] = kern.data[(j * cin + i) * cout + o];
    const gamma = get(`crepe_conv${l}_BN/gamma`).data;
    const beta = get(`crepe_conv${l}_BN/beta`).data;
    const mean = get(`crepe_conv${l}_BN/moving_mean`).data;
    const variance = get(`crepe_conv${l}_BN/moving_variance`).data;
    const scale = new Float32Array(cout);
    const shift = new Float32Array(cout);
    for (let o = 0; o < cout; o++) {
      scale[o] = gamma[o] / Math.sqrt(variance[o] + BN_EPSILON);
      shift[o] = beta[o] - mean[o] * scale[o];
    }
    const stride = l === 1 ? 4 : 1;
    const outLen = Math.ceil(len / stride);
    const padTotal = Math.max(0, (outLen - 1) * stride + k - len);
    const viaFft = forceDirect ? false : preferFft(k, cin, cout, stride, len);
    layers.push({
      fft: viaFft ? buildFftConv(w, k, cin, cout, stride, len + padTotal) : null,
      k,
      cin,
      cout,
      stride,
      taps,
      w,
      bias: get(`crepe_conv${l}/bias`).data,
      scale,
      shift,
      inLen: len,
      outLen,
      padBefore: Math.floor(padTotal / 2),
      input: new Float32Array((len + padTotal) * cin),
    });
    if (outLen % 4 !== 0) throw new Error("CREPE layer lengths must be multiples of 4");
    len = outLen / 2;
  }
  const last = layers[layers.length - 1];
  const kd = get("crepe_classifier/kernel"); // [256, 360]
  const [nIn, nOut] = kd.shape;
  if (nIn !== len * last.cout || nOut !== CREPE_BINS)
    throw new Error("Unexpected CREPE classifier");
  const dense = new Float32Array(nOut * nIn);
  for (let i = 0; i < nIn; i++)
    for (let o = 0; o < nOut; o++) dense[o * nIn + i] = kd.data[i * nOut + o];
  return {
    parameters,
    layers,
    dense,
    denseBias: get("crepe_classifier/bias").data,
    flat: new Float32Array(nIn),
  };
}

/**
 * Load a converted CREPE model from its bytes or from a URL (fetched with
 * the global `fetch`).
 */
export async function loadCrepeModel(
  source: ArrayBuffer | string,
  options: CrepeModelOptions = {},
): Promise<CrepeModel> {
  if (typeof source !== "string") return parseCrepeModel(source, options);
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Could not load the CREPE model (${response.status})`);
  return parseCrepeModel(await response.arrayBuffer(), options);
}

/**
 * One conv layer through FFTs (see `FftConv`), fused with ReLU, batch norm
 * and max-pool 2, written into `out` at `(outPad + t) · cout + o`.
 */
function runFftConv(c: ConvLayer, f: FftConv, out: Float32Array, outPad: number): void {
  const { cin, cout, stride, inLen, padBefore, outLen, bias, scale, shift } = c;
  const { n, m, bins, spectra, x: xs, acc, da, db, re, im } = f;
  const input = c.input;
  const half = m / 2 + 1;

  // Input spectra, two real channels per complex FFT.
  for (let i = 0; i < cin; i += 2) {
    const pair = i + 1 < cin;
    re.fill(0);
    im.fill(0);
    for (let t = 0; t < inLen; t++) {
      const p = (padBefore + t) * cin + i;
      re[padBefore + t] = input[p];
      if (pair) im[padBefore + t] = input[p + 1];
    }
    fftInPlace(re, im);
    const ba = i * bins * 2;
    const bb = ba + bins * 2;
    for (let a = 0; a < stride; a++) {
      for (let b = 0; b < half; b++) {
        const fq = b + a * m;
        const fn = (n - fq) & (n - 1);
        const zr = re[fq];
        const zi = im[fq];
        const nr = re[fn];
        const ni = im[fn];
        const q = (a * half + b) * 2;
        if (pair) {
          xs[ba + q] = (zr + nr) / 2;
          xs[ba + q + 1] = (zi - ni) / 2;
          xs[bb + q] = (zi + ni) / 2;
          xs[bb + q + 1] = (nr - zr) / 2;
        } else {
          xs[ba + q] = zr;
          xs[ba + q + 1] = zi;
        }
      }
    }
  }

  const len2 = bins * 2;
  const inv = 1 / n;
  for (let o = 0; o < cout; o += 2) {
    // Folded output spectra of channels o and o + 1.
    for (let h = 0; h < 2; h++) {
      const d = h === 0 ? da : db;
      d.fill(0);
      if (o + h >= cout) continue;
      acc.fill(0);
      let wb = (o + h) * cin * len2;
      for (let i = 0; i < cin; i++, wb += len2) {
        const xb = i * len2;
        for (let q = 0; q < len2; q += 2) {
          const wr = spectra[wb + q];
          const wi = spectra[wb + q + 1];
          const xr = xs[xb + q];
          const xi = xs[xb + q + 1];
          acc[q] += wr * xr - wi * xi;
          acc[q + 1] += wr * xi + wi * xr;
        }
      }
      for (let a = 0; a < stride; a++) {
        for (let b = 0; b < half; b++) {
          d[2 * b] += acc[(a * half + b) * 2];
          d[2 * b + 1] += acc[(a * half + b) * 2 + 1];
        }
      }
    }
    // Z = Da + i·Db over the full length m (Hermitian halves), inverse FFT
    // as conj(FFT(conj(Z))): real part → channel o, imaginary → o + 1.
    for (let b = 0; b < m; b++) {
      let ar, ai, br, bi;
      if (b < half) {
        ar = da[2 * b];
        ai = da[2 * b + 1];
        br = db[2 * b];
        bi = db[2 * b + 1];
      } else {
        const r = m - b;
        ar = da[2 * r];
        ai = -da[2 * r + 1];
        br = db[2 * r];
        bi = -db[2 * r + 1];
      }
      re[b] = ar - bi;
      im[b] = -(ai + br);
    }
    const rs = re.subarray(0, m);
    const is = im.subarray(0, m);
    fftInPlace(rs, is);
    for (let h = 0; h < 2 && o + h < cout; h++) {
      const ch = o + h;
      const sign = h === 0 ? inv : -inv;
      const src = h === 0 ? rs : is;
      for (let t = 0; t < outLen; t += 2) {
        const v0 = src[t] * sign + bias[ch];
        const v1 = src[t + 1] * sign + bias[ch];
        const y0 = (v0 > 0 ? v0 : 0) * scale[ch] + shift[ch];
        const y1 = (v1 > 0 ? v1 : 0) * scale[ch] + shift[ch];
        out[(outPad + t / 2) * cout + ch] = y0 > y1 ? y0 : y1;
      }
    }
  }
}

/**
 * One conv layer computed directly, fused with ReLU, batch norm and
 * max-pool 2, written into `out` (the next layer's padded input, or the
 * flat output) at `(outPad + t) · cout + o`.
 */
function runDirectConv(c: ConvLayer, out: Float32Array, outPad: number): void {
  const { k, cin, cout, stride, taps, w, bias, scale, shift, outLen, padBefore, inLen } = c;
  const x = c.input;
  const step = stride * cin;
  const validEnd = padBefore + inLen; // first padded index after the signal (time)
  for (let t = 0; t < outLen; t += 4) {
    // Taps that reach the signal for at least one of the 4 times.
    const jFrom = Math.max(0, padBefore - (t + 3) * stride);
    const jTo = Math.min(k, validEnd - t * stride);
    const rFrom = jFrom * cin;
    const rTo = jTo * cin;
    const x0 = t * step;
    const x1 = x0 + step;
    const x2 = x1 + step;
    const x3 = x2 + step;
    for (let o = 0; o < cout; o += 4) {
      const w0 = o * taps;
      const w1 = w0 + taps;
      const w2 = w1 + taps;
      const w3 = w2 + taps;
      let a00 = 0,
        a01 = 0,
        a02 = 0,
        a03 = 0;
      let a10 = 0,
        a11 = 0,
        a12 = 0,
        a13 = 0;
      let a20 = 0,
        a21 = 0,
        a22 = 0,
        a23 = 0;
      let a30 = 0,
        a31 = 0,
        a32 = 0,
        a33 = 0;
      for (let r = rFrom; r < rTo; r++) {
        const v0 = x[x0 + r];
        const v1 = x[x1 + r];
        const v2 = x[x2 + r];
        const v3 = x[x3 + r];
        const k0 = w[w0 + r];
        const k1 = w[w1 + r];
        const k2 = w[w2 + r];
        const k3 = w[w3 + r];
        a00 += k0 * v0;
        a01 += k0 * v1;
        a02 += k0 * v2;
        a03 += k0 * v3;
        a10 += k1 * v0;
        a11 += k1 * v1;
        a12 += k1 * v2;
        a13 += k1 * v3;
        a20 += k2 * v0;
        a21 += k2 * v1;
        a22 += k2 * v2;
        a23 += k2 * v3;
        a30 += k3 * v0;
        a31 += k3 * v1;
        a32 += k3 * v2;
        a33 += k3 * v3;
      }
      const p0 = (outPad + t / 2) * cout + o;
      const p1 = p0 + cout;
      out[p0] = Math.max(act(a00, o, bias, scale, shift), act(a01, o, bias, scale, shift));
      out[p1] = Math.max(act(a02, o, bias, scale, shift), act(a03, o, bias, scale, shift));
      out[p0 + 1] = Math.max(
        act(a10, o + 1, bias, scale, shift),
        act(a11, o + 1, bias, scale, shift),
      );
      out[p1 + 1] = Math.max(
        act(a12, o + 1, bias, scale, shift),
        act(a13, o + 1, bias, scale, shift),
      );
      out[p0 + 2] = Math.max(
        act(a20, o + 2, bias, scale, shift),
        act(a21, o + 2, bias, scale, shift),
      );
      out[p1 + 2] = Math.max(
        act(a22, o + 2, bias, scale, shift),
        act(a23, o + 2, bias, scale, shift),
      );
      out[p0 + 3] = Math.max(
        act(a30, o + 3, bias, scale, shift),
        act(a31, o + 3, bias, scale, shift),
      );
      out[p1 + 3] = Math.max(
        act(a32, o + 3, bias, scale, shift),
        act(a33, o + 3, bias, scale, shift),
      );
    }
  }
}

/** Bias, ReLU, folded batch norm of one output. */
function act(
  acc: number,
  o: number,
  bias: Float32Array,
  scale: Float32Array,
  shift: Float32Array,
): number {
  const v = acc + bias[o];
  return (v > 0 ? v : 0) * scale[o] + shift[o];
}

/**
 * The network on one frame of 1024 samples at 16 kHz (normalised inside to
 * zero mean, unit variance, as CREPE does). Writes the 360 activations to
 * `out` (allocated when omitted) and returns it.
 */
export function crepeActivations(
  model: CrepeModel,
  frame: ArrayLike<number>,
  out: Float32Array = new Float32Array(CREPE_BINS),
): Float32Array {
  if (frame.length !== CREPE_FRAME) throw new Error(`CREPE needs ${CREPE_FRAME} samples`);
  const { layers } = model;
  let mean = 0;
  for (let i = 0; i < CREPE_FRAME; i++) mean += frame[i];
  mean /= CREPE_FRAME;
  let sd = 0;
  for (let i = 0; i < CREPE_FRAME; i++) sd += (frame[i] - mean) * (frame[i] - mean);
  sd = Math.max(1e-8, Math.sqrt(sd / CREPE_FRAME));
  const first = layers[0];
  const x = first.input;
  for (let i = 0; i < CREPE_FRAME; i++) x[first.padBefore + i] = (frame[i] - mean) / sd;

  for (let l = 0; l < layers.length; l++) {
    const layer = layers[l];
    const next = layers[l + 1];
    const out = next ? next.input : model.flat;
    const pad = next ? next.padBefore : 0;
    if (layer.fft) runFftConv(layer, layer.fft, out, pad);
    else runDirectConv(layer, out, pad);
  }

  const { dense, denseBias, flat } = model;
  const n = flat.length;
  for (let o = 0; o < CREPE_BINS; o++) {
    let acc = denseBias[o];
    const wo = o * n;
    for (let i = 0; i < n; i++) acc += dense[wo + i] * flat[i];
    out[o] = 1 / (1 + Math.exp(-acc));
  }
  return out;
}

/** Cents (re 10 Hz) of each output bin. */
const BIN_CENTS = Float64Array.from(
  { length: CREPE_BINS },
  (_, i) => 1997.3794084376191 + (7180 * i) / (CREPE_BINS - 1),
);

export interface CrepeResult {
  /** Pitch in Hz (MPM-refined when possible); meaningful when `confidence` is high. */
  frequency: number;
  /** Height of the strongest activation, in [0, 1]. */
  confidence: number;
}

/** CREPE's decoding: weighted average of ±4 bins around the strongest one. */
export function decodeCrepeActivations(activations: ArrayLike<number>): CrepeResult {
  let c = 0;
  for (let i = 1; i < CREPE_BINS; i++) if (activations[i] > activations[c]) c = i;
  let sum = 0;
  let weight = 0;
  for (let i = Math.max(0, c - 4); i < Math.min(CREPE_BINS, c + 5); i++) {
    sum += activations[i] * BIN_CENTS[i];
    weight += activations[i];
  }
  const cents = weight > 0 ? sum / weight : BIN_CENTS[c];
  return { frequency: 10 * Math.pow(2, cents / 1200), confidence: activations[c] };
}

interface ResampleMatrix {
  /** First input index of each output sample. */
  start: Int32Array;
  /** Taps per output sample (row length of `weights`). */
  taps: number;
  weights: Float32Array;
}

/**
 * Windowed-sinc resampling of the centre of an input window to 1024
 * samples at 16 kHz (Hann-windowed sinc, cut-off 0.95 × the lower Nyquist),
 * as a precomputed sparse matrix: output i sits at the input position
 * centre + (i − 512)·sr/16000; input samples outside the window weigh 0.
 */
function resampleMatrix(inputLength: number, sampleRate: number): ResampleMatrix {
  const ratio = CREPE_SAMPLE_RATE / sampleRate;
  const fc = 0.95 * Math.min(1, ratio) * 0.5; // cycles per input sample
  const half = Math.ceil(16 / (2 * fc));
  const taps = 2 * half;
  const start = new Int32Array(CREPE_FRAME);
  const weights = new Float32Array(CREPE_FRAME * taps);
  const centre = inputLength / 2;
  for (let i = 0; i < CREPE_FRAME; i++) {
    const c = centre + (i - CREPE_FRAME / 2) / ratio;
    const c0 = Math.floor(c);
    const from = c0 - half + 1;
    start[i] = from;
    for (let m = 0; m < taps; m++) {
      const j = from + m;
      if (j < 0 || j >= inputLength) continue;
      const d = j - c;
      const win = 0.5 + 0.5 * Math.cos((Math.PI * d) / half);
      const s = d === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * d) / (Math.PI * d);
      weights[i * taps + m] = s * win;
    }
  }
  return { start, taps, weights };
}

export interface CrepePitchOptions {
  /** Sample rate of the windows passed to `analyze`. */
  sampleRate: number;
  /**
   * Samples (at `sampleRate`, centred in the window) the MPM refinement of
   * the cents reads; 0 disables it. Default 2048.
   */
  refineWindow?: number;
}

/**
 * CREPE on windows at any sample rate. `analyze(window)` resamples the
 * centre of the window to 1024 samples at 16 kHz (64 ms; a window shorter
 * than `inputLength` is zero-padded), runs the network and decodes it.
 * When the window allows it, the frequency is then re-measured on the
 * MPM's NSDF peak within ±60 cents of CREPE's, kept if within 50 cents.
 */
export class CrepePitch {
  readonly sampleRate: number;
  /** Input samples that cover the 64 ms CREPE frame and its resampling filter. */
  readonly inputLength: number;
  private readonly refineWindow: number;
  private readonly frame = new Float32Array(CREPE_FRAME);
  private readonly activations = new Float32Array(CREPE_BINS);
  private matrix: { length: number; m: ResampleMatrix } | null = null;

  constructor(
    readonly model: CrepeModel,
    options: CrepePitchOptions,
  ) {
    if (!(options.sampleRate > 0)) throw new Error("CrepePitch needs a sample rate");
    this.sampleRate = options.sampleRate;
    this.refineWindow = options.refineWindow ?? 2048;
    const span = (CREPE_FRAME * options.sampleRate) / CREPE_SAMPLE_RATE;
    const fc = 0.95 * Math.min(1, CREPE_SAMPLE_RATE / options.sampleRate) * 0.5;
    this.inputLength = Math.ceil(span) + 2 * Math.ceil(16 / (2 * fc));
  }

  /** The 360 activations of the last `analyze` call (a view, overwritten). */
  get lastActivations(): Float32Array {
    return this.activations;
  }

  analyze(window: ArrayLike<number>): CrepeResult {
    this.fillFrame(window);
    crepeActivations(this.model, this.frame, this.activations);
    const decoded = decodeCrepeActivations(this.activations);
    const r = Math.min(this.refineWindow, window.length);
    if (r >= 64) {
      const from = Math.floor((window.length - r) / 2);
      const centre =
        window instanceof Float32Array
          ? window.subarray(from, from + r)
          : Float32Array.from({ length: r }, (_, i) => window[from + i]);
      const refined = refineFrequencyNear(centre, this.sampleRate, decoded.frequency);
      if (refined > 0 && Math.abs(1200 * Math.log2(refined / decoded.frequency)) <= 50) {
        return { frequency: refined, confidence: decoded.confidence };
      }
    }
    return decoded;
  }

  private fillFrame(window: ArrayLike<number>): void {
    const frame = this.frame;
    if (this.sampleRate === CREPE_SAMPLE_RATE) {
      const offset = Math.floor((window.length - CREPE_FRAME) / 2);
      for (let i = 0; i < CREPE_FRAME; i++) {
        const j = offset + i;
        frame[i] = j >= 0 && j < window.length ? window[j] : 0;
      }
      return;
    }
    if (this.matrix?.length !== window.length) {
      this.matrix = { length: window.length, m: resampleMatrix(window.length, this.sampleRate) };
    }
    const { start, taps, weights } = this.matrix.m;
    const n = window.length;
    for (let i = 0; i < CREPE_FRAME; i++) {
      const s = start[i];
      const wo = i * taps;
      let acc = 0;
      if (s >= 0 && s + taps <= n) {
        for (let m = 0; m < taps; m++) acc += weights[wo + m] * window[s + m];
      } else {
        for (let m = 0; m < taps; m++) {
          const j = s + m;
          if (j >= 0 && j < n) acc += weights[wo + m] * window[j];
        }
      }
      frame[i] = acc;
    }
  }
}

export interface CrepeTrackerOptions {
  sampleRate: number;
  /** Frequency of A4 in Hz. Default 440. */
  referenceA4?: number;
  /** Samples between two network runs. Default a tenth of a second. */
  hopSize?: number;
  /** Below this confidence the frame is unvoiced. Default 0.6. */
  confidenceThreshold?: number;
  /** Lowest reported frequency in Hz. Default 60. */
  minFrequency?: number;
  /** Highest reported frequency in Hz. Default 2000. */
  maxFrequency?: number;
  /** Windows whose RMS is below this value are silence (the network is not run). Default 0.001. */
  silenceRms?: number;
  /** Cents band that keeps the displayed note's name (as `PitchTracker`). Default 10. */
  hysteresisCents?: number;
  /** MPM refinement window (see `CrepePitchOptions`). Default 2048. */
  refineWindow?: number;
}

/**
 * Streaming CREPE for a tuner, with `PitchTracker`'s interface: push
 * samples, read `estimate`. The network runs every `hopSize` samples (10
 * times a second by default: it costs a few milliseconds per run) on the
 * latest `inputLength` samples. `clarity` is CREPE's confidence. No median:
 * at 10 Hz it would add 100 ms of latency; the note name keeps the
 * hysteresis.
 */
export class CrepeTracker {
  private readonly pitch: CrepePitch;
  private readonly ring: Float32Array;
  private readonly window: Float32Array;
  private readonly hopSize: number;
  private readonly threshold: number;
  private readonly minFrequency: number;
  private readonly maxFrequency: number;
  private readonly silenceRms: number;
  private readonly hysteresisCents: number;
  private referenceA4: number;
  private writeIndex = 0;
  private filled = 0;
  private sinceAnalysis = 0;
  private current: PitchEstimate | null = null;
  private lastResult: CrepeResult | null = null;

  constructor(model: CrepeModel, options: CrepeTrackerOptions) {
    this.pitch = new CrepePitch(model, {
      sampleRate: options.sampleRate,
      refineWindow: options.refineWindow,
    });
    const length = Math.max(this.pitch.inputLength, options.refineWindow ?? 2048);
    this.ring = new Float32Array(length);
    this.window = new Float32Array(length);
    this.hopSize = Math.max(1, options.hopSize ?? Math.round(options.sampleRate / 10));
    this.threshold = options.confidenceThreshold ?? 0.6;
    this.minFrequency = options.minFrequency ?? 60;
    this.maxFrequency = options.maxFrequency ?? 2000;
    this.silenceRms = options.silenceRms ?? 0.001;
    this.hysteresisCents = options.hysteresisCents ?? 10;
    this.referenceA4 = options.referenceA4 ?? A4_FREQ;
  }

  /** Latest estimate, or `null` while idle, on silence or below the confidence threshold. */
  get estimate(): PitchEstimate | null {
    return this.current;
  }

  /** Raw output of the latest network run (frequency and confidence), or `null`. */
  get lastCrepe(): CrepeResult | null {
    return this.lastResult;
  }

  setReferenceA4(hz: number): void {
    this.referenceA4 = hz;
  }

  reset(): void {
    this.writeIndex = 0;
    this.filled = 0;
    this.sinceAnalysis = 0;
    this.current = null;
    this.lastResult = null;
  }

  push(samples: ArrayLike<number>): void {
    const n = this.ring.length;
    for (let i = 0; i < samples.length; i++) {
      this.ring[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % n;
      if (this.filled < n) this.filled++;
      this.sinceAnalysis++;
      if (this.filled === n && this.sinceAnalysis >= this.hopSize) {
        this.sinceAnalysis = 0;
        this.analyse();
      }
    }
  }

  private analyse(): void {
    const head = this.ring.subarray(this.writeIndex);
    this.window.set(head);
    this.window.set(this.ring.subarray(0, this.writeIndex), head.length);
    let energy = 0;
    for (let i = 0; i < this.window.length; i++) energy += this.window[i] * this.window[i];
    if (Math.sqrt(energy / this.window.length) < this.silenceRms) {
      this.lastResult = null;
      this.current = null;
      return;
    }
    const r = this.pitch.analyze(this.window);
    this.lastResult = r;
    if (
      r.confidence < this.threshold ||
      r.frequency < this.minFrequency ||
      r.frequency > this.maxFrequency
    ) {
      this.current = null;
      return;
    }
    const fresh = frequencyToPitch(r.frequency, r.confidence, this.referenceA4);
    this.current = smoothPitchHistory([fresh], this.current, {
      medianFrames: 1,
      hysteresisCents: this.hysteresisCents,
      referenceA4: this.referenceA4,
    });
  }
}
