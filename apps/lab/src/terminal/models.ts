/**
 * The small models the terminal can boot, all run in the browser by
 * transformers.js (WebGPU when there is one, WebAssembly otherwise). Every
 * repo below was checked for its ONNX files; sizes are the download of the
 * WebAssembly weights, the heavier case. The first one is the default.
 */
export interface TerminalModel {
  /** Hugging Face repo id. */
  id: string;
  /** Shown in the picker. */
  label: string;
  /** Approximate download, for the picker. */
  size: string;
  /** Weights to load on WebGPU (needs shader-f16 for the f16 ones) and on WebAssembly. */
  dtype: { webgpu: string; wasm: string };
  /**
   * A plain conversation model with no instructions slot: it gets the turns
   * as text, without the system prompt, and stays itself.
   */
  plain?: boolean;
}

export const TERMINAL_MODELS: readonly TerminalModel[] = [
  {
    id: "HuggingFaceTB/SmolLM2-135M-Instruct",
    label: "LT-135 · barely awake",
    size: "137 MB",
    dtype: { webgpu: "q4f16", wasm: "q8" },
  },
  {
    id: "onnx-community/Minueza-2-96M-Instruct-Variant-10-ONNX",
    label: "LT-96 · corrupted memory banks",
    size: "96 MB",
    dtype: { webgpu: "q4f16", wasm: "q8" },
  },
  {
    id: "onnx-community/Falcon-H1-Tiny-90M-Instruct-ONNX",
    label: "LT-90H · experimental hybrid",
    size: "137 MB",
    dtype: { webgpu: "q4f16", wasm: "q4" },
  },
  {
    id: "onnx-community/SmolLM2-135M-humanized-ONNX",
    label: "LT-135H · thinks it is human",
    size: "136 MB",
    dtype: { webgpu: "q4f16", wasm: "q8" },
  },
  {
    id: "HuggingFaceTB/SmolLM2-360M-Instruct",
    label: "LT-360 · half awake",
    size: "365 MB",
    dtype: { webgpu: "q4f16", wasm: "q8" },
  },
  {
    id: "onnx-community/gemma-3-270m-it-ONNX",
    label: "LT-270G · terse",
    size: "343 MB",
    dtype: { webgpu: "q4f16", wasm: "q4" },
  },
  {
    id: "onnx-community/DialoGPT-medium-Rick-from-RickAndMorty-ONNX",
    label: "LT-C137 · rogue core, ignores orders",
    size: "412 MB",
    dtype: { webgpu: "q8", wasm: "q8" },
    plain: true,
  },
  {
    id: "onnx-community/Qwen2.5-0.5B-Instruct",
    label: "LT-500 · almost sane (desktop)",
    size: "512 MB",
    dtype: { webgpu: "q4f16", wasm: "q8" },
  },
];
