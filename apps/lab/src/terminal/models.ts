/**
 * The neural core: the lightest model that still writes sentences, run in
 * the browser by transformers.js (WebGPU when there is one, WebAssembly
 * otherwise). Heavier ones (LFM2-700M, Gemma 3 1B, Llama 3.2 1B…) were
 * tried: more coherent, still off-script, and 0.5–1.1 GB to download.
 */
export interface TerminalModel {
  /** Hugging Face repo id. */
  id: string;
  /** Shown in the terminal's head. */
  label: string;
  /** Approximate download. */
  size: string;
  /**
   * Weights to load on WebGPU (needs shader-f16 for the f16 ones) and on
   * WebAssembly. q4f16 printed garbage on WebGPU for some models (16-bit
   * overflow); those take q4, 32-bit maths on 4-bit weights.
   */
  dtype: { webgpu: string; wasm: string };
  /**
   * A plain conversation model with no instructions slot: it gets the turns
   * as text, without the system prompt, and stays itself.
   */
  plain?: boolean;
}

export const NEURAL_MODEL: TerminalModel = {
  id: "HuggingFaceTB/SmolLM2-135M-Instruct",
  label: "neural core LT-135",
  size: "137 MB",
  dtype: { webgpu: "q4f16", wasm: "q8" },
};
