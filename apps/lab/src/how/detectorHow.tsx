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
      <WindowHow
        seconds={1}
        use="The first window, kept for 1 s: about one chord. It feeds the chord answer and the chord list."
      />
    ),
    liveChroma: (
      <WindowHow
        seconds={options.live}
        use={`The first window, kept for ${options.live} s: about a phrase. It feeds the live key, which follows you when the music changes key.`}
      />
    ),
    tonalityChroma: (
      <WindowHow
        seconds={options.long}
        use={`The first window, kept for ${options.long} s: about a section. It feeds the estimated key: slow to move, sure of itself.`}
      />
    ),
    chords: <ChordsHow {...options} />,
    liveKeys: <KeysHow seconds={options.live} />,
    keys: <KeysHow seconds={options.long} />,
    presence: <PresenceHow {...options} />,
    settings: <SettingsHow />,
  };
}
