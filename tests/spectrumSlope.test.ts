// @vitest-environment node
import { describe, it, expect } from "vitest";

import { spectrumSlopeDbPerHz } from "../src/analysis/spectrumSlope";

describe("spectrumSlopeDbPerHz", () => {
  it("is zero for a flat spectrum", () => {
    const s = spectrumSlopeDbPerHz(new Float32Array(16).fill(-40), 2.93);
    expect(Array.from(s).every((v) => v === 0)).toBe(true);
  });

  it("returns the slope in dB per Hz (centred difference)", () => {
    // +3 dB per bin at 2 Hz/bin → 1.5 dB/Hz.
    const spectrum = Array.from({ length: 10 }, (_, k) => -60 + 3 * k);
    const s = spectrumSlopeDbPerHz(spectrum, 2);
    for (let k = 0; k < 10; k++) expect(s[k]).toBeCloseTo(1.5, 6);
  });

  it("treats -Infinity bins as the floor instead of producing NaN", () => {
    const s = spectrumSlopeDbPerHz([-Infinity, -50, -Infinity], 1, -100);
    expect(Array.from(s)).toEqual([50, 0, -50]);
  });

  it("returns zeros for degenerate inputs", () => {
    expect(Array.from(spectrumSlopeDbPerHz([-10], 1))).toEqual([0]);
    expect(Array.from(spectrumSlopeDbPerHz([-10, -20], 0))).toEqual([0, 0]);
  });
});
