// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { CrepeTracker, parseCrepeModel } from "../src/analysis/crepe";
import { PitchTracker } from "../src/analysis/pitch";
import { createPitchTracker, loadCrepeModelCached } from "../src/analysis/pitchMethods";
import { PyinTracker } from "../src/analysis/pyin";

const SR = 48000;

const MODEL_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/lab/public/models/crepe-tiny/crepe-tiny.bin",
);

function modelBytes(): ArrayBuffer {
  const b = readFileSync(MODEL_FILE);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function sine(freq: number, length: number, amplitude = 0.3): Float32Array {
  return Float32Array.from(
    { length },
    (_, i) => amplitude * Math.sin((2 * Math.PI * freq * i) / SR),
  );
}

describe("createPitchTracker", () => {
  it("builds the tracker of each method", () => {
    const model = parseCrepeModel(modelBytes());
    expect(createPitchTracker("mpm", { sampleRate: SR })).toBeInstanceOf(PitchTracker);
    expect(createPitchTracker("pyin", { sampleRate: SR })).toBeInstanceOf(PyinTracker);
    expect(createPitchTracker("crepe", { sampleRate: SR }, model)).toBeInstanceOf(CrepeTracker);
    // No model: MPM.
    expect(createPitchTracker("crepe", { sampleRate: SR })).toBeInstanceOf(PitchTracker);
  });

  it("tracks a note behind one interface, reference and reset included", () => {
    const model = parseCrepeModel(modelBytes());
    for (const method of ["mpm", "pyin", "crepe"] as const) {
      const tracker = createPitchTracker(method, { sampleRate: SR, referenceA4: 440 }, model);
      tracker.push(sine(440, SR / 2));
      expect(tracker.estimate?.midi).toBe(69);
      tracker.setReferenceA4(442);
      tracker.push(sine(442, SR / 2));
      expect(Math.abs(tracker.estimate!.cents)).toBeLessThan(2);
      tracker.reset();
      expect(tracker.estimate).toBeNull();
    }
  });

  it("never runs CREPE more often than every 100 ms", () => {
    const model = parseCrepeModel(modelBytes());
    const tracker = createPitchTracker("crepe", { sampleRate: SR, hopSize: 256 }, model);
    const runs = vi.spyOn(tracker as CrepeTracker & { analyse(): void }, "analyse");
    tracker.push(sine(440, SR));
    // One second, a 100 ms hop: about ten runs, not 187.
    expect(runs.mock.calls.length).toBeLessThanOrEqual(10);
  });
});

describe("loadCrepeModelCached", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches a URL once, and again after a failed load", async () => {
    const body = modelBytes();
    let ok = false;
    const fetchMock = vi.fn(async () => ({
      ok,
      status: ok ? 200 : 404,
      arrayBuffer: async () => body,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadCrepeModelCached("cached-test.bin")).rejects.toThrow(/404/);
    ok = true;
    const a = loadCrepeModelCached("cached-test.bin");
    const b = loadCrepeModelCached("cached-test.bin");
    expect(a).toBe(b);
    expect((await a).parameters).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
