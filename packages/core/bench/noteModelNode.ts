/**
 * Basic Pitch for the benchmark, in Node: the model shipped with the lab
 * (apps/lab/public/models/basic-pitch/nmp.onnx, Apache-2.0) on
 * onnxruntime-node. onnxruntime-node is not a dependency of the repository:
 * point BASIC_PITCH_DIR at a folder holding its node_modules (npm i
 * onnxruntime-node there). When it is missing the AI chord method is
 * skipped, and the report says so.
 */
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BASIC_PITCH, type NoteModelOutput, type NoteModelRunner } from "../src/analysis/notes";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MODEL = path.join(REPO, "apps", "lab", "public", "models", "basic-pitch", "nmp.onnx");

interface OrtTensor {
  data: Float32Array;
}
interface Ort {
  Tensor: new (type: "float32", data: Float32Array, dims: readonly number[]) => OrtTensor;
  InferenceSession: {
    create(
      path: string,
      opts?: Record<string, unknown>,
    ): Promise<{ run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>> }>;
  };
}

let cached: Promise<NoteModelRunner | null> | undefined;

/** A NoteModelRunner on onnxruntime-node, or null when the runtime or the model is absent. */
export function nodeBasicPitchRunner(): Promise<NoteModelRunner | null> {
  cached ??= (async () => {
    const dir = process.env.BASIC_PITCH_DIR;
    if (
      !dir ||
      !existsSync(path.join(dir, "node_modules", "onnxruntime-node")) ||
      !existsSync(MODEL)
    ) {
      return null;
    }
    const ort = createRequire(path.join(dir, "package.json"))("onnxruntime-node") as Ort;
    const session = await ort.InferenceSession.create(MODEL, { executionProviders: ["cpu"] });
    const { windowSamples, windowFrames, keys } = BASIC_PITCH;
    return {
      async run(window: Float32Array): Promise<NoteModelOutput> {
        const r = await session.run({
          "serving_default_input_2:0": new ort.Tensor("float32", window, [1, windowSamples, 1]),
        });
        // Output order per basic-pitch: :1 note, :2 onset, :0 contour.
        const note = r["StatefulPartitionedCall:1"].data;
        const onset = r["StatefulPartitionedCall:2"].data;
        const rows = (flat: Float32Array) =>
          Array.from({ length: windowFrames }, (_, f) => flat.slice(f * keys, (f + 1) * keys));
        return { notes: rows(note), onsets: rows(onset) };
      },
    };
  })().catch(() => null);
  return cached;
}
