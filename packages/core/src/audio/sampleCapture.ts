/**
 * Continuous time-domain capture of an audio source.
 *
 * Preferred path: an AudioWorklet (`sampleCapture.worklet.ts`, shipped as a
 * bundled string and loaded from a Blob URL) that runs on the audio thread
 * and posts every sample exactly once, in 2048-sample batches. This is
 * gapless by construction and unaffected by main-thread timer jitter or
 * background-tab throttling.
 *
 * Fallback (no AudioWorklet, or the module failed to load): poll an
 * AnalyserNode's time-domain window. The number of new samples per poll is
 * measured from `context.currentTime`, not assumed from the timer period,
 * so a late tick does not duplicate or drop audio; the residual error is
 * the 128-sample render-quantum alignment of the analyser's buffer, which
 * is negligible at envelope level but not sample-accurate. If the gap
 * exceeds the analyser window (throttled tab), zeros are inserted so the
 * timeline keeps its length instead of compressing.
 */

import { SAMPLE_CAPTURE_WORKLET_SOURCE } from "./sampleCaptureWorklet.source";
import { createWorkletModuleUrl, revokeWorkletModuleUrl } from "./workletModuleUrl";

/** Must match the name registered by the worklet. */
const PROCESSOR_NAME = "sample-capture";

export type SampleListener = (samples: Float32Array) => void;

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
      return await startWorkletCapture(context, source, onSamples);
    } catch {
      // Module failed to load or the node could not be created: fall back.
    }
  }
  return startAnalyserCapture(context, source, onSamples, options);
}

async function startWorkletCapture(
  context: AudioContext,
  source: AudioNode,
  onSamples: SampleListener,
): Promise<SampleCapture> {
  const moduleUrl = createWorkletModuleUrl(SAMPLE_CAPTURE_WORKLET_SOURCE);
  try {
    await context.audioWorklet.addModule(moduleUrl);
  } finally {
    revokeWorkletModuleUrl(moduleUrl);
  }
  const node = new AudioWorkletNode(context, PROCESSOR_NAME, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
    channelCountMode: "explicit",
  });
  let stopped = false;
  node.port.onmessage = (event: MessageEvent) => {
    if (!stopped && event.data instanceof Float32Array) onSamples(event.data);
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
    if (advance > fftSize) {
      // The tab was throttled: fill the unobserved gap with silence.
      onSamples(new Float32Array(advance - fftSize));
      onSamples(window.slice());
    } else {
      onSamples(window.slice(fftSize - advance));
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
