/**
 * A `NoteModelRunner` for Basic Pitch on onnxruntime-web, in a worker.
 * Import this module lazily (`await import("./ml/basicPitchRunner")`) when
 * the AI listening method is chosen: the runtime (~10 MB of WebAssembly)
 * and the model (230 KB, public/models/basic-pitch/) load only then.
 *
 *   const runner = await createBasicPitchRunner();
 *   const live = useNoteModelChords(mic, { runner });
 *   // later: runner.dispose();
 */
import { BASIC_PITCH, type NoteModelOutput, type NoteModelRunner } from "@audiolab/core";

import type { BasicPitchWorkerIn, BasicPitchWorkerOut } from "./basicPitch.worker";

export interface BasicPitchRunner extends NoteModelRunner {
  /** Session creation time in the worker, ms. */
  readonly loadMs: number;
  /** Inference time of the last window inside the worker, ms (no message overhead). */
  readonly lastRunMs: number | null;
  /** Stop the worker; pending runs reject. */
  dispose(): void;
}

/** Where the model is served: public/models/basic-pitch/nmp.onnx, under the site base. */
export function basicPitchModelUrl(): string {
  return new URL(`${import.meta.env.BASE_URL}models/basic-pitch/nmp.onnx`, document.baseURI).href;
}

function rows(flat: Float32Array): Float32Array[] {
  const { windowFrames, keys } = BASIC_PITCH;
  const out: Float32Array[] = [];
  for (let f = 0; f < windowFrames; f++) out.push(flat.subarray(f * keys, (f + 1) * keys));
  return out;
}

/** Start the worker and load the model; resolves once the model is ready. */
export function createBasicPitchRunner(
  modelUrl: string = basicPitchModelUrl(),
): Promise<BasicPitchRunner> {
  const worker = new Worker(new URL("./basicPitch.worker.ts", import.meta.url), {
    type: "module",
  });
  const pending = new Map<
    number,
    { resolve: (o: NoteModelOutput) => void; reject: (e: Error) => void }
  >();
  let nextId = 0;
  let lastRunMs: number | null = null;
  let disposed = false;

  const failAll = (error: Error) => {
    for (const p of pending.values()) p.reject(error);
    pending.clear();
  };

  return new Promise<BasicPitchRunner>((resolveReady, rejectReady) => {
    worker.onerror = (event) => {
      const error = new Error(`Basic Pitch worker: ${event.message || "failed to start"}`);
      rejectReady(error);
      failAll(error);
    };
    worker.onmessage = (event: MessageEvent<BasicPitchWorkerOut>) => {
      const m = event.data;
      if (m.type === "ready") {
        resolveReady({
          loadMs: m.loadMs,
          get lastRunMs() {
            return lastRunMs;
          },
          run(window: Float32Array): Promise<NoteModelOutput> {
            if (disposed) return Promise.reject(new Error("Basic Pitch runner disposed"));
            const id = nextId++;
            return new Promise<NoteModelOutput>((resolve, reject) => {
              pending.set(id, { resolve, reject });
              // A copy is transferred: the caller keeps its window.
              const copy = window.slice();
              const message: BasicPitchWorkerIn = { type: "run", id, window: copy };
              worker.postMessage(message, [copy.buffer]);
            });
          },
          dispose() {
            if (disposed) return;
            disposed = true;
            worker.terminate();
            failAll(new Error("Basic Pitch runner disposed"));
          },
        });
      } else if (m.type === "result") {
        lastRunMs = m.ms;
        pending.get(m.id)?.resolve({ notes: rows(m.notes), onsets: rows(m.onsets) });
        pending.delete(m.id);
      } else if (m.id === undefined) {
        worker.terminate();
        rejectReady(new Error(m.message));
      } else {
        pending.get(m.id)?.reject(new Error(m.message));
        pending.delete(m.id);
      }
    };
    const init: BasicPitchWorkerIn = { type: "init", modelUrl };
    worker.postMessage(init);
  });
}
