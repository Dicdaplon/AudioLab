/**
 * The browser's own AudioContext behind a wrapper.
 *
 * Tone.js runs on standardized-audio-context: `Tone.getContext().rawContext`
 * is that library's wrapper, not the native context. Native nodes
 * (`AudioWorkletNode`, which the sample capture needs for exact timing)
 * cannot be created on the wrapper, and the capture then falls back to
 * polling an AnalyserNode: it still works, but timestamps are estimated.
 *
 * `nativeAudioContext(ctx)` returns the native context the wrapper holds
 * (its `_nativeAudioContext` field), or `ctx` itself when it is already
 * native. It reads a private field of a third-party library, on purpose and
 * in one place: if a future version renames it, `ctx` is returned unchanged
 * and the fallback warning of `startSampleCapture` says so.
 *
 * Use the native context for the SDK and keep the wrapper for Tone; both
 * run on the same clock, so times passed by Tone callbacks are valid
 * AudioContext times for the SDK.
 */
export function nativeAudioContext<T extends BaseAudioContext>(ctx: T): T {
  const inner = (ctx as unknown as { _nativeAudioContext?: unknown })._nativeAudioContext;
  return inner && typeof inner === "object" && "currentTime" in inner ? (inner as T) : ctx;
}
