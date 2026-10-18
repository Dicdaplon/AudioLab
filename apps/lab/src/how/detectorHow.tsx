/** The detector's compact sheets, one per window, for DetectorTab's `how` prop. */

import type { DetectorHow } from "@audiolab/react";

import {
  ChordsHow,
  InstantChromaHow,
  KeysHow,
  PresenceHow,
  ReadoutsHow,
  SettingsHow,
  WindowHow,
  type DetectorHowOptions,
} from "./detector";

/** One compact sheet per detector window. */
export function detectorHow(options: DetectorHowOptions): DetectorHow {
  return {
    readouts: <ReadoutsHow {...options} />,
    instantChroma: <InstantChromaHow />,
    chordChroma: (
      <WindowHow seconds={1} use="About one chord long: this is what the chord list reads." />
    ),
    liveChroma: (
      <WindowHow
        seconds={options.live}
        use="About a phrase: it follows you when the music changes key."
      />
    ),
    tonalityChroma: (
      <WindowHow
        seconds={options.long}
        use="About a section: slow to move, sure of itself. The estimated key reads it."
      />
    ),
    chords: <ChordsHow {...options} />,
    liveKeys: <KeysHow seconds={options.live} />,
    keys: <KeysHow seconds={options.long} />,
    presence: <PresenceHow {...options} />,
    settings: <SettingsHow />,
  };
}
