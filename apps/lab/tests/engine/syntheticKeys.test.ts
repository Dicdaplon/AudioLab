/**
 * End-to-end key detection on generated cadences (no fixtures), through
 * the live-path rig (AnalyserNode emulation → TonalityEngine).
 */
import { describe, expect, it } from "vitest";

import { NOTE_NAMES } from "../../src/utils/notes";
import { cadence, runLive } from "../helpers/liveRig";

describe("synthetic keys (cadences)", () => {
  it.each(NOTE_NAMES.map((name, pc) => ({ name, tonic: 48 + pc })))(
    "I–IV–V–I in $name major: every key path ranks $name first",
    ({ name, tonic }) => {
      const frame = runLive(cadence(tonic, false));
      expect(frame.liveKeys[0].shortName).toBe(name);
      expect(frame.tonalityKeys[0].shortName).toBe(name);
      expect(frame.presenceKeys[0].shortName).toBe(name);
    },
  );

  it.each(NOTE_NAMES.map((name, pc) => ({ name: `${name}m`, tonic: 48 + pc })))(
    "i–iv–V–i in $name: every key path ranks $name first",
    ({ name, tonic }) => {
      const frame = runLive(cadence(tonic, true));
      expect(frame.liveKeys[0].shortName).toBe(name);
      expect(frame.tonalityKeys[0].shortName).toBe(name);
      expect(frame.presenceKeys[0].shortName).toBe(name);
    },
  );

  it.each([-30, -15, 15, 30])("D major survives a %i cent tuning offset", (cents) => {
    // Pitch classes are assigned by rounding to the nearest semitone, so
    // the hard limit is ±50 cents.
    const frame = runLive(cadence(50, false, cents));
    expect(frame.tonalityKeys[0].shortName).toBe("D");
    expect(frame.presenceKeys[0].shortName).toBe("D");
  });
});
