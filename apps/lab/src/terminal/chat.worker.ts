/**
 * Runs the terminal AI off the main thread, so the page (and its live
 * plots) stay smooth while a model loads or writes. One model at a time;
 * loading another drops the previous one.
 *
 * In:  { type: "load", model }  |  { type: "generate", messages }
 * Out: { type: "progress", loaded, total } | { type: "ready", device }
 *      | { type: "token", text } | { type: "done" } | { type: "error", message }
 */
import {
  pipeline,
  TextStreamer,
  type ProgressInfo,
  type TextGenerationPipeline,
} from "@huggingface/transformers";

import type { TerminalModel } from "./models";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type WorkerIn =
  { type: "load"; model: TerminalModel } | { type: "generate"; messages: ChatMessage[] };

export type WorkerOut =
  | { type: "progress"; loaded: number; total: number }
  | { type: "ready"; device: "webgpu" | "wasm" }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

const post = (message: WorkerOut) => self.postMessage(message);

let generator: TextGenerationPipeline | null = null;
let current: TerminalModel | null = null;

type Gpu = { requestAdapter(): Promise<{ features: { has(name: string): boolean } } | null> };

/** No WebGPU, WebGPU without 16-bit floats, or the full thing. */
async function gpuSupport(): Promise<"none" | "f32" | "f16"> {
  const gpu = (navigator as Navigator & { gpu?: Gpu }).gpu;
  if (!gpu) return "none";
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return "none";
    return adapter.features.has("shader-f16") ? "f16" : "f32";
  } catch {
    return "none";
  }
}

/**
 * Loads run one at a time (two sessions building at once can stall the
 * GPU): a request made during a load waits for it, then the latest one
 * wins, and the model it replaces is released first.
 */
let wanted: TerminalModel | null = null;
let busy = false;

async function requestLoad(model: TerminalModel) {
  wanted = model;
  if (busy) return;
  busy = true;
  try {
    while (wanted && wanted !== current) {
      const next = wanted;
      await generator?.dispose();
      generator = null;
      current = null;
      await load(next);
    }
  } finally {
    busy = false;
  }
}

async function load(model: TerminalModel) {
  const gpu = await gpuSupport();
  const device = gpu === "none" ? "wasm" : "webgpu";
  // f16 weights need shader-f16; without it the GPU takes the CPU weights.
  const dtype = gpu === "f16" ? model.dtype.webgpu : model.dtype.wasm;
  const progress_callback = (info: ProgressInfo) => {
    if (info.status === "progress_total")
      post({ type: "progress", loaded: info.loaded, total: info.total });
  };
  const loaded = (await pipeline("text-generation", model.id, {
    device,
    dtype,
    progress_callback,
  } as never)) as TextGenerationPipeline;
  generator = loaded;
  current = model;
  // Only the model last asked for says it is ready.
  if (wanted === model) post({ type: "ready", device });
}

async function generate(messages: ChatMessage[]) {
  if (!generator) throw new Error("NO MODEL LOADED");
  const streamer = new TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (text: string) => post({ type: "token", text }),
  });
  // A plain model gets the turns as text, each closed by its end token.
  const eos = generator.tokenizer.eos_token ?? "";
  const input = current?.plain
    ? messages
        .filter((m) => m.role !== "system")
        .map((m) => m.content + eos)
        .join("")
    : messages;
  await generator(
    input as never,
    {
      max_new_tokens: 96,
      do_sample: true,
      temperature: 0.8,
      top_p: 0.9,
      repetition_penalty: 1.2,
      return_full_text: false,
      streamer,
    } as never,
  );
  post({ type: "done" });
}

self.onmessage = (event: MessageEvent<WorkerIn>) => {
  const message = event.data;
  const run = message.type === "load" ? requestLoad(message.model) : generate(message.messages);
  run.catch((error: unknown) =>
    post({ type: "error", message: error instanceof Error ? error.message : String(error) }),
  );
};
