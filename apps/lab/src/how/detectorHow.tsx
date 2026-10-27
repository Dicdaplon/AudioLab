/** The detector's compact sheets, one per window, for DetectorTab's `how` prop. */

import type { ReactNode } from "react";
import type { DetectorHow } from "@audiolab/react";

import {
  ChordsHow,
  InstantChromaHow,
  KeysHow,
  NotesHeardHow,
  PageHow,
  PresenceHow,
  ReadoutsHow,
  SettingsHow,
  WindowHow,
  type DetectorHowOptions,
} from "./detector";

/** The Chords & keys page: its two front sheets, then one per window under the hood. */
export interface ChordsKeysHow extends DetectorHow {
  page: ReactNode;
  notes: ReactNode;
}

/** One compact sheet per detector window. */
export function detectorHow(options: DetectorHowOptions): ChordsKeysHow {
  return {
    page: <PageHow {...options} />,
    notes: <NotesHeardHow />,
    readouts: <ReadoutsHow {...options} />,
    instantChroma: <InstantChromaHow />,
    chordChroma: (
      <WindowHow
        seconds={1}
        use="The first window, kept for 1 s: about one chord. It feeds the chord answer and the chord list: watch it while you change chords."
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
        use={`The first window, kept for ${options.long} s: about a section. It feeds the estimated key: slow to move, sure of itself, the one to read for a whole song.`}
      />
    ),
    chords: <ChordsHow {...options} />,
    liveKeys: <KeysHow seconds={options.live} byChords={options.keyFromChords} />,
    keys: <KeysHow seconds={options.long} byChords={options.keyFromChords} />,
    presence: <PresenceHow {...options} />,
    settings: <SettingsHow />,
  };
}
