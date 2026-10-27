/**
 * Runs the Basic Pitch network (Spotify, Apache-2.0, see
 * public/models/basic-pitch/NOTICE) on onnxruntime-web's WebAssembly
 * backend, off the main thread: ~0.1 s per 2 s window would otherwise
 * stutter the live plots.
 *
 * In:  { type: "init", modelUrl } | { type: "run", id, window }
 * Out: { type: "ready", loadMs } | { type: "result", id, notes, onsets, ms }
 *      | { type: "error", id?, message }
 *
 * `window` is 43 844 samples at 22050 Hz; `notes` / `onsets` come back
 * flat, 172 frames × 88 keys, their buffers transferred.
 */
import * as ort from "onnxruntime-web/wasm";

export type BasicPitchWorkerIn =
  { type: "init"; modelUrl: string } | { type: "run"; id: number; window: Float32Array };

export type BasicPitchWorkerOut =
  | { type: "ready"; loadMs: number }
  | { type: "result"; id: number; notes: Float32Array; onsets: Float32Array; ms: number }
  | { type: "error"; id?: number; message: string };

/** Output names of the official export (basic-pitch inference.py). */
const NOTE_OUTPUT = "StatefulPartitionedCall:1";
const ONSET_OUTPUT = "StatefulPartitionedCall:2";

// One thread: the page is not cross-origin isolated on GitHub Pages, and
// this worker already keeps the main thread free.
ort.env.wasm.numThreads = 1;

const post = (message: BasicPitchWorkerOut, transfer: Transferable[] = []) =>
  self.postMessage(message, { transfer });

let session: Promise<ort.InferenceSession> | null = null;

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function init(modelUrl: string) {
  const t0 = performance.now();
  session = ort.InferenceSession.create(modelUrl, { executionProviders: ["wasm"] });
  try {
    await session;
    post({ type: "ready", loadMs: performance.now() - t0 });
  } catch (err) {
    post({ type: "error", message: `model failed to load: ${errorText(err)}` });
  }
}

async function run(id: number, window: Float32Array) {
  try {
    if (!session) throw new Error("model not initialised");
    const s = await session;
    const t0 = performance.now();
    const out = await s.run({
      [s.inputNames[0]]: new ort.Tensor("float32", window, [1, window.length, 1]),
    });
    const notes = out[NOTE_OUTPUT].data as Float32Array;
    const onsets = out[ONSET_OUTPUT].data as Float32Array;
    post({ type: "result", id, notes, onsets, ms: performance.now() - t0 }, [
      notes.buffer,
      onsets.buffer,
    ]);
  } catch (err) {
    post({ type: "error", id, message: errorText(err) });
  }
}

self.onmessage = (event: MessageEvent<BasicPitchWorkerIn>) => {
  const message = event.data;
  if (message.type === "init") void init(message.modelUrl);
  else void run(message.id, message.window);
};
