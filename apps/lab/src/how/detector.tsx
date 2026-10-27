/**
 * The small "How?" sheets of the detector: one per window, folded at the
 * foot of its panel. Same voice as the big sheets, shorter: what it shows,
 * how it is computed, what it gets wrong. The numbers follow the settings,
 * so they are passed in.
 */

import { HowPanel, SketchBars, SketchChain, SketchLabel } from "@audiolab/react";

const NOTES = ["C", "", "D", "", "E", "F", "", "G", "", "A", "", "B"];
const C_MAJOR = [0.9, 0.08, 0.2, 0.06, 0.75, 0.15, 0.05, 0.85, 0.07, 0.25, 0.05, 0.18];

const KK_SOURCE = { label: "Krumhansl & Kessler, Psychological Review, 1982" };

export interface DetectorHowOptions {
  /** Live window, seconds. */
  live: number;
  /** Tonality window, seconds. */
  long: number;
  /** Sevenths, sus, 6 and diminished are switched on. */
  extended: boolean;
  /** The key comes from the chords vote, not from the note profile. */
  keyFromChords?: boolean;
}

/** The page's two answers: the chord now, the key of the song. */
export function PageHow({ long }: DetectorHowOptions) {
  return (
    <HowPanel
      compact
      topic="how this page reads"
      diagram={
        <SketchChain
          label="The notes, a chord, then a key"
          items={[
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "notes heard",
            },
            { sketch: <SketchLabel text="C" sub="the chord" />, caption: "now" },
            { sketch: <SketchLabel text="C major" sub="or A minor" />, caption: `over ${long} s` },
          ]}
        />
      }
      algorithm={`The chord comes from the method picked under "Chord detection method", on about the last second. The key comes from "Key detection method", over the last ${long} s: the chords I named vote for their keys, or the notes are matched against the habits of each key. The small line under the key is its relative: same notes, same key signature.`}
      limits="In silence there is nothing to name, and both stay blank. The relative is not a second guess: it shares every note, and which of the two is home depends on where the music comes to rest."
      aside="Notes are written with sharps only (A#, D#): I work on twelve sounds, not on spelled notes. A# major is B♭ major."
    >
      <p>
        Two answers. The chord follows your hand, it changes within a second. The key takes its
        time, like an ear that waits a few bars before saying where home is. Change the method below
        and watch both answers change with it.
      </p>
    </HowPanel>
  );
}

/** The one chroma left on the page: the notes of the last second. */
export function NotesHeardHow() {
  return (
    <HowPanel
      compact
      topic="the notes I hear"
      diagram={
        <SketchChain
          label="A spectrum folded into twelve notes"
          items={[
            {
              sketch: <SketchBars values={[0.2, 0.9, 0.3, 0.6, 0.25, 0.5, 0.2, 0.3]} />,
              caption: "frequencies",
            },
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "12 notes, 1 s",
            },
          ]}
        />
      }
      algorithm="Ten times a second the sound is split into its frequencies, and each one is poured into its note, octaves folded together. The last second of these pictures is averaged: that is what the chord is read from. The method you picked decides how sharp the picture is (the constant-Q one gives each note its own window)."
      limits="Harmonics count too: a low C also lights up G and E a little. With the AI method the chord comes from the notes the model writes down, not from these bars."
    >
      <p>
        Twelve bars, one per note name, whatever the octave. Strum a C and three bars stand up: C,
        E, G. If a fourth one rises, look at the chord list: it may have heard a seventh.
      </p>
    </HowPanel>
  );
}

/** Under the hood: the chain of memories behind the answers. */
export function ReadoutsHow({ live, long }: DetectorHowOptions) {
  return (
    <HowPanel
      compact
      topic="the machinery, top to bottom"
      algorithm={`One chain, top to bottom. The first window turns the sound into a chroma: 12 bars, how much of each note is sounding. The next three keep that picture in memory for 1 s, ${live} s and ${long} s. Each memory feeds one answer: the chord (1 s), the live key (${live} s), the estimated key (${long} s). Presence, at the bottom, is a second road to the key: it counts which notes showed up, not how loud they were.`}
      limits="The percentage is a share, not a certainty: the scores of all candidates add up to 100. In silence they all tie and the name means nothing."
    >
      <p>
        Same notes, three memories: the short one follows you, the long one is sure of itself. Read
        the short one while you change chords, the long one for the key of a whole song. When the
        three agree, trust them. When they don&apos;t, the passage really is ambiguous.
      </p>
    </HowPanel>
  );
}

export function InstantChromaHow() {
  return (
    <HowPanel
      compact
      topic="what a chroma is"
      diagram={
        <SketchChain
          label="A spectrum folded into twelve notes"
          items={[
            {
              sketch: <SketchBars values={[0.2, 0.9, 0.3, 0.6, 0.25, 0.5, 0.2, 0.3]} />,
              caption: "frequencies",
            },
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "12 notes",
            },
          ]}
        />
      }
      algorithm="Ten times a second, an FFT of 16384 points splits the sound into its frequencies, like a prism. Each one from 55 Hz to 5 kHz is poured into its nearest note (A = 440 Hz), octaves folded together, the total scaled to 1."
      limits="Below about 150 Hz a bass note spills into its neighbours. Harmonics count too: a low C also lights up G and E a little."
    >
      <p>
        Twelve bars, one per note name, whatever the octave: how much of each note is sounding right
        now. Everything else on this page is built from it.
      </p>
    </HowPanel>
  );
}

export function WindowHow({ seconds, use }: { seconds: number; use: string }) {
  return (
    <HowPanel
      compact
      topic={`same notes, last ${seconds} s`}
      algorithm={`The average of the last ${seconds * 10} chromas (ten a second), scaled back to 1. Every reading weighs the same, loud or soft.`}
      limits="Silence and hiss count as much as a chord: stop playing and the picture slowly fades into noise."
    >
      <p>{use}</p>
    </HowPanel>
  );
}

export function ChordsHow({ extended }: DetectorHowOptions) {
  return (
    <HowPanel
      compact
      topic="ranking the chords"
      algorithm={`Each chord is a stencil, one hole per note. cos, the fit, says how much of what rings falls in the holes (1 = all of it). ${
        extended
          ? "Every quality is on: up to 132 stencils, dim and m7♭5 slightly held back so a D7 isn't read as F#dim."
          : "24 stencils: 12 major and 12 minor triads."
      }`}
      limits="Same notes, one name: C6 and Am7 are the same stencil, and I name it after the loudest note. No bass detection, so inversions count as the plain chord."
      aside="A note's fifth harmonic (one of the quiet higher tones it always carries) is its major third: a minor chord can lean major."
    >
      <p>The chords whose notes best fit the last second, best first.</p>
    </HowPanel>
  );
}

export function KeysHow({ seconds, byChords = false }: { seconds: number; byChords?: boolean }) {
  return (
    <HowPanel
      compact
      topic="ranking the keys"
      algorithm={
        byChords
          ? `Over the last ${seconds} s, every chord I named votes for the keys it belongs to, the home chord and its dominant loudest; the note profile of each key adds half a vote. The percentages share 100 between them.`
          : `The ${seconds} s chroma is compared with the profile of each of the 24 major and minor keys: how much each note weighs in that key, as listeners rated it. r is that resemblance (1 = same shape); the percentages share 100 between them.`
      }
      limits="Only major and minor: a dorian or mixolydian vamp lands on the major or minor key with the same notes. Relative keys (C major, A minor) are told apart only by how heavy the home note is."
      sources={[KK_SOURCE]}
    >
      <p>
        A key has a shape: the tonic and the fifth heavy, the notes outside almost empty. I look for
        the key whose shape matches what you played.
      </p>
    </HowPanel>
  );
}

export function PresenceHow({ live, long }: DetectorHowOptions) {
  return (
    <HowPanel
      compact
      topic="who showed up, not who was loud"
      diagram={
        <SketchChain
          label="Strong notes marked present, then counted over time"
          items={[
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} threshold={0.3} />,
              caption: `${live} s, cut`,
            },
            {
              sketch: <SketchBars values={[1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]} labels={NOTES} />,
              caption: "0 or 1",
            },
            { sketch: <SketchLabel text="C" sub="by presence" />, caption: `over ${long} s` },
          ]}
        />
      }
      algorithm={`Ten times a second, every note above 35 % of the strongest one in the ${live} s chroma is marked present (1), the rest absent (0). Over ${long} s, each bar is the share of time the note was present. The same key profiles then read those shares instead of the loudness.`}
      limits="A short passing note may never be marked. And since the seven notes of a scale all end up about equally present, relative major and minor get even harder to tell apart."
      sources={[{ label: "No paper: my own adaptation of Krumhansl–Schmuckler" }]}
      aside="This is also what the Scales page reads: a note counts as played when it was present more than a quarter of the time."
    >
      <p>
        A loud bass or an open string ringing all along shouldn&apos;t vote ten times. So I stop
        weighing the notes and just take attendance: who was there, how often. Trust it over the
        loudness reading when one note drones.
      </p>
    </HowPanel>
  );
}

export function SettingsHow() {
  return (
    <HowPanel
      compact
      topic="what the knobs change"
      algorithm="“Present above … % of loudest”: how strong a note must be, next to the loudest one, to count. Under Fine tuning, the memory (how many recent readings set “the loudest”) and how they're combined: mean, the default, counts every reading; median ignores one odd loud one. The cut line and the loudest note are shares of everything heard, not volumes."
      limits="Turn it up and only the core notes remain; down, passing notes and ringing harmonics come in too."
      aside="The defaults (35 %, 3, mean) were picked by a grid search on my recordings. For 95 % of uses, leave them alone."
    >
      <p>
        The two windows set how far back the live and the estimated key listen. The peak settings
        only move the presence panel.
      </p>
    </HowPanel>
  );
}
