/**
 * Continuous time-domain capture of an audio source.
 *
 * Preferred path: an AudioWorklet (`sampleCapture.worklet.ts`, shipped as a
 * bundled string and loaded from a Blob URL) that runs on the audio thread
 * and posts every sample exactly once, in batches of `batchSize` samples
 * (default 2048) tagged with their AudioContext frame. This is gapless by
 * construction, unaffected by main-thread timer jitter or background-tab
 * throttling, and every batch can be placed exactly on the audio clock
 * however late it arrives (`SampleBatchInfo`). The module is added once
 * per AudioContext; later captures on the same context reuse it.
 *
 * Fallback (no AudioWorklet, or the module failed to load): poll an
 * AnalyserNode's time-domain window. The number of new samples per poll is
 * measured from `context.currentTime`, not assumed from the timer period,
 * so a late tick does not duplicate or drop audio; the residual error is
 * the 128-sample render-quantum alignment of the analyser's buffer, which
 * is negligible at envelope level but not sample-accurate. If the gap
 * exceeds the analyser window (throttled tab), zeros are inserted so the
 * timeline keeps its length instead of compressing. Its start frames are
 * derived from `currentTime` and flagged `exact: false`.
 */

import { SAMPLE_CAPTURE_WORKLET_SOURCE } from "./sampleCaptureWorklet.source";
import { createWorkletModuleUrl, revokeWorkletModuleUrl } from "./workletModuleUrl";

/** Must match the name registered by the worklet. */
export const SAMPLE_CAPTURE_PROCESSOR = "audiolab-sample-capture-2";

/** Where a batch sits on the audio clock and when it reached the main thread. */
export interface SampleBatchInfo {
  /** AudioContext frame of the batch's first sample. */
  startFrame: number;
  sampleRate: number;
  /** `performance.now()` when the batch was received (0 where unavailable). */
  receivedAtMs: number;
  /** False on the analyser fallback, whose frames are estimated from `currentTime`. */
  exact: boolean;
}

/**
 * Receives each batch. Listeners may ignore the second argument: a
 * one-parameter callback stays valid.
 */
export type SampleListener = (samples: Float32Array, info: SampleBatchInfo) => void;

export type CaptureMethod = "worklet" | "analyser";

export interface SampleCapture {
  method: CaptureMethod;
  /** Disconnect and stop delivering samples. Idempotent. */
  stop(): void;
}

export interface SampleCaptureOptions {
  /** Try the AudioWorklet first. Default true. */
  preferWorklet?: boolean;
  /** Fallback polling interval in ms. Default 20. */
  pollIntervalMs?: number;
  /** Fallback analyser window (power of two). Default 4096. */
  analyserFftSize?: number;
  /**
   * Worklet batch size in samples (≥ 128). Default 2048 (43 ms at 48 kHz).
   * Smaller batches make results reach the page sooner (live feedback);
   * they change no timestamp.
   */
  batchSize?: number;
}

export async function startSampleCapture(
  context: AudioContext,
  source: AudioNode,
  onSamples: SampleListener,
  options: SampleCaptureOptions = {},
): Promise<SampleCapture> {
  const preferWorklet = options.preferWorklet ?? true;
  if (preferWorklet && context.audioWorklet && typeof AudioWorkletNode === "function") {
    try {
      return await startWorkletCapture(context, source, onSamples, options.batchSize);
    } catch {
      // Module failed to load or the node could not be created: fall back.
    }
  }
  return startAnalyserCapture(context, source, onSamples, options);
}

/** One module load per context: registering the processor twice throws. */
const moduleLoads = new WeakMap<BaseAudioContext, Promise<void>>();

function loadCaptureModule(context: AudioContext): Promise<void> {
  let load = moduleLoads.get(context);
  if (!load) {
    const moduleUrl = createWorkletModuleUrl(SAMPLE_CAPTURE_WORKLET_SOURCE);
    load = context.audioWorklet
      .addModule(moduleUrl)
      .finally(() => revokeWorkletModuleUrl(moduleUrl));
    // A failed load may succeed on a later attempt: forget it.
    load.catch(() => moduleLoads.delete(context));
    moduleLoads.set(context, load);
  }
  return load;
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : 0;
}

function isBatchMessage(data: unknown): data is { samples: Float32Array; startFrame: number } {
  if (typeof data !== "object" || data === null) return false;
  const d = data as { samples?: unknown; startFrame?: unknown };
  return d.samples instanceof Float32Array && typeof d.startFrame === "number";
}

async function startWorkletCapture(
  context: AudioContext,
  source: AudioNode,
  onSamples: SampleListener,
  batchSize: number | undefined,
): Promise<SampleCapture> {
  await loadCaptureModule(context);
  const node = new AudioWorkletNode(context, SAMPLE_CAPTURE_PROCESSOR, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
    channelCountMode: "explicit",
    processorOptions: batchSize !== undefined ? { batchSize } : {},
  });
  let stopped = false;
  let nextFrame = 0;
  node.port.onmessage = (event: MessageEvent) => {
    if (stopped) return;
    const data = event.data as unknown;
    const receivedAtMs = nowMs();
    const sampleRate = context.sampleRate;
    if (isBatchMessage(data)) {
      onSamples(data.samples, {
        startFrame: data.startFrame,
        sampleRate,
        receivedAtMs,
        exact: true,
      });
      nextFrame = data.startFrame + data.samples.length;
    } else if (data instanceof Float32Array) {
      // A bare batch carries no frame: count the samples instead.
      onSamples(data, { startFrame: nextFrame, sampleRate, receivedAtMs, exact: false });
      nextFrame += data.length;
    }
  };
  source.connect(node);
  // A worklet is only rendered while it reaches the destination; its
  // output is silence, so nothing is heard.
  node.connect(context.destination);
  return {
    method: "worklet",
    stop() {
      if (stopped) return;
      stopped = true;
      node.port.onmessage = null;
      try {
        source.disconnect(node);
        node.disconnect();
      } catch {
        // Already disconnected (context closed).
      }
    },
  };
}

function startAnalyserCapture(
  context: AudioContext,
  source: AudioNode,
  onSamples: SampleListener,
  options: SampleCaptureOptions,
): SampleCapture {
  const fftSize = options.analyserFftSize ?? 4096;
  const pollMs = options.pollIntervalMs ?? 20;
  const analyser = context.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);

  const window = new Float32Array(fftSize);
  let lastTime = context.currentTime;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    const now = context.currentTime;
    const advance = Math.round((now - lastTime) * context.sampleRate);
    lastTime = now;
    if (advance <= 0) return;
    analyser.getFloatTimeDomainData(window);
    const sampleRate = context.sampleRate;
    const end = Math.round(now * sampleRate);
    const receivedAtMs = nowMs();
    const info = (startFrame: number): SampleBatchInfo => ({
      startFrame,
      sampleRate,
      receivedAtMs,
      exact: false,
    });
    if (advance > fftSize) {
      // The tab was throttled: fill the unobserved gap with silence.
      onSamples(new Float32Array(advance - fftSize), info(end - advance));
      onSamples(window.slice(), info(end - fftSize));
    } else {
      onSamples(window.slice(fftSize - advance), info(end - advance));
    }
  };

  const timer = setInterval(tick, pollMs);
  return {
    method: "analyser",
    stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      try {
        source.disconnect(analyser);
      } catch {
        // Already disconnected (context closed).
      }
    },
  };
}
