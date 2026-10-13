/**
 * Turns worklet source text into a URL `audioWorklet.addModule()` accepts.
 *
 * The processor ships inside the library as a string (built by
 * `scripts/buildWorklet.ts`), so it loads the same way under every bundler
 * and needs no copied asset: a Blob URL where object URLs exist, otherwise a
 * `data:` URL. Hosts with a strict Content Security Policy must allow
 * `blob:` in `script-src` / `worker-src`; when they do not, `addModule`
 * rejects and `startSampleCapture` falls back to AnalyserNode polling.
 */

const MIME = "text/javascript";

export function createWorkletModuleUrl(source: string): string {
  if (typeof Blob === "function" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(new Blob([source], { type: MIME }));
  }
  return `data:${MIME};charset=utf-8,${encodeURIComponent(source)}`;
}

/** Release a URL from `createWorkletModuleUrl` once the module is loaded. */
export function revokeWorkletModuleUrl(url: string): void {
  if (url.startsWith("blob:") && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}
