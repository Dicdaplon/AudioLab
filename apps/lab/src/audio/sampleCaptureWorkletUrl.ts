/**
 * URL of the bundled capture worklet. Isolated in its own module so tests
 * can mock it without going through Vite's worker pipeline.
 */
import workletUrl from "./sampleCapture.worklet.ts?worker&url";

export default workletUrl;
