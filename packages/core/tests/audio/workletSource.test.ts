/**
 * The worklet processor ships as a generated string. This guards the
 * committed copy against the source it was built from, and checks the
 * URL plumbing that hands it to `audioWorklet.addModule`.
 */
import { describe, expect, it } from "vitest";

import { bundleWorklet, renderWorkletModule } from "../../scripts/buildWorklet";
import { SAMPLE_CAPTURE_WORKLET_SOURCE } from "../../src/audio/sampleCaptureWorklet.source";
import { createWorkletModuleUrl, revokeWorkletModuleUrl } from "../../src/audio/workletModuleUrl";

describe("sampleCaptureWorklet.source.ts", () => {
  it("matches a fresh bundle of sampleCapture.worklet.ts (run `npm run build:worklet`)", async () => {
    const fresh = await bundleWorklet();
    expect(SAMPLE_CAPTURE_WORKLET_SOURCE).toBe(fresh);
    expect(renderWorkletModule(fresh)).toContain(JSON.stringify(fresh));
  });

  it("is a self-contained script registering the versioned capture processor", () => {
    expect(SAMPLE_CAPTURE_WORKLET_SOURCE).toContain("registerProcessor(");
    expect(SAMPLE_CAPTURE_WORKLET_SOURCE).toContain('"audiolab-sample-capture-2"');
    expect(SAMPLE_CAPTURE_WORKLET_SOURCE).not.toMatch(/\bimport\b|\brequire\(/);
  });
});

describe("createWorkletModuleUrl", () => {
  it("prefers a Blob URL and revokes it", () => {
    const url = createWorkletModuleUrl("registerProcessor('x', class {})");
    expect(url.startsWith("blob:")).toBe(true);
    revokeWorkletModuleUrl(url);
  });

  it("falls back to a data URL where object URLs are unavailable", () => {
    const original = URL.createObjectURL;
    // @ts-expect-error — simulate an environment without object URLs.
    URL.createObjectURL = undefined;
    try {
      const url = createWorkletModuleUrl("a b");
      expect(url).toBe("data:text/javascript;charset=utf-8,a%20b");
      revokeWorkletModuleUrl(url); // no-op, must not throw
    } finally {
      URL.createObjectURL = original;
    }
  });
});
