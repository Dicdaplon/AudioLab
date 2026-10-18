/**
 * The "How?" sheets of the lab: one per feature, a miniature diagram and a
 * few lines in plain words (algorithm, limits, sources, one thing worth
 * knowing). Kept here, out of the SDK components, so a host can write its
 * own. Voice: direct, one image per idea, honest about limits.
 */

import {
  HowPanel,
  SketchBars,
  SketchChain,
  SketchCurve,
  SketchLabel,
  SketchMeter,
  SketchTimeline,
  SketchWave,
} from "@audiolab/react";

const NOTES = ["C", "", "D", "", "E", "F", "", "G", "", "A", "", "B"];
/** A C major chroma: C, E and G stand out. */
const C_MAJOR = [0.9, 0.08, 0.2, 0.06, 0.75, 0.15, 0.05, 0.85, 0.07, 0.25, 0.05, 0.18];

/** Points of a decaying curve with peaks, for correlation and flux sketches. */
function peaks(at: readonly number[], width = 0.03, floor = 0.08): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const x = i / 60;
    let y = floor;
    for (const p of at)
      y = Math.max(y, Math.exp(-((x - p) ** 2) / (2 * width * width)) * (1 - p * 0.4));
    out.push([x, y]);
  }
  return out;
}

export function KeyHow() {
  return (
    <HowPanel
      topic="finding the key"
      diagram={
        <SketchChain
          label="Sound, folded into twelve notes, compared with 24 key profiles"
          items={[
            { sketch: <SketchWave kind="pluck" />, caption: "what you play" },
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "12 notes, short and long",
            },
            { sketch: <SketchLabel text="C" sub="major" />, caption: "best of 24 keys" },
          ]}
        />
      }
      algorithm="FFT of the sound, energy folded into 12 pitch classes (the chroma), then a correlation with the profile of each of the 24 major and minor keys. The best correlation wins (Krumhansl–Schmuckler)."
      limits="Relative keys (C major, A minor) share all their notes: only the weight of the tonic tells them apart. Modal or very chromatic music confuses it."
      sources={[
        { label: "Krumhansl & Kessler, Psychological Review, 1982" },
        { label: "Krumhansl, Cognitive Foundations of Musical Pitch, 1990" },
      ]}
      aside="The profiles come from listeners rating how well each note fits once a key is set. The algorithm literally uses human ears as its template."
    >
      <p>
        A key is a family of notes that keep coming back. So I don&apos;t hunt for one note: I
        measure how much of each of the twelve notes the music holds, and ask which key has the same
        shape.
      </p>
    </HowPanel>
  );
}

export function ChordHow() {
  return (
    <HowPanel
      topic="naming the chord"
      diagram={
        <SketchChain
          label="One second of chroma compared with a template for each chord"
          items={[
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "last second",
            },
            {
              sketch: (
                <SketchBars
                  values={[1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]}
                  highlight={[0, 4, 7]}
                  labels={NOTES}
                />
              ),
              caption: "C major template",
            },
            { sketch: <SketchLabel text="C" sub="closest template" />, caption: "winner" },
          ]}
        />
      }
      algorithm="Cosine similarity between the last second of chroma and a 0/1 template per chord (24 triads, plus sevenths, sus and diminished when switched on), turned into scores with a softmax."
      limits="The 5th harmonic of a note is its major third, so a minor chord can lean major. Chords with the same notes (C6 and Am7) can't be told apart without knowing the bass."
      sources={[{ label: "Fujishima, Realtime chord recognition, ICMC 1999" }]}
      aside="One second is a trade-off: shorter and a ringing strum flickers between names, longer and chord changes lag behind."
    >
      <p>
        A chord is a handful of notes ringing together. I compare what rings with a stencil of every
        chord, one hole per note, and keep the stencil that fits best.
      </p>
    </HowPanel>
  );
}

export function TunerHow() {
  return (
    <HowPanel
      topic="reading the pitch"
      diagram={
        <SketchChain
          label="A periodic wave, its self-similarity curve, the frequency"
          items={[
            { sketch: <SketchWave kind="sine" cycles={4} />, caption: "a string" },
            {
              sketch: <SketchCurve points={peaks([0.25, 0.5, 0.75])} marks={[0.25]} />,
              caption: "first good repeat",
            },
            { sketch: <SketchLabel text="110 Hz" sub="A2, +2 cents" />, caption: "pitch" },
          ]}
        />
      }
      algorithm="McLeod pitch method: normalised square difference of 2048 samples with a shifted copy, first peak above 90 % of the highest, parabolic interpolation, median of three readings, a 60-cent hysteresis on the note name."
      limits="One note at a time: a chord gives no reading. Below about 60 Hz the window holds fewer than two periods, and heavy noise lowers the clarity until it gives up."
      sources={[{ label: "McLeod & Wyvill, A smarter way to find pitch, ICMC 2005" }]}
      aside="Taking the first good peak, not the highest one, is the whole trick against answering an octave too low."
    >
      <p>
        A note repeats itself: an A string draws the same shape every 9.1 ms. I slide the sound over
        a copy of itself until it lines up again. That delay is the period; flip it and you have the
        frequency.
      </p>
    </HowPanel>
  );
}

export function ScalesHow() {
  return (
    <HowPanel
      topic="matching scales"
      diagram={
        <SketchChain
          label="Notes played over 30 seconds, then the scales that contain them all"
          items={[
            {
              sketch: (
                <SketchBars
                  values={[1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0]}
                  highlight={[0, 3, 5, 7, 10]}
                  labels={NOTES}
                />
              ),
              caption: "notes you played",
            },
            { sketch: <SketchLabel text="C" sub="minor pentatonic" />, caption: "holds them all" },
          ]}
        />
      }
      algorithm="The notes you played come from the presence histogram (a note counts when it was there more than a quarter of the time). Twelve known scales are tried on all twelve tonics: major, natural, harmonic and melodic minor, the five other modes (dorian to locrian), both pentatonics and the blues. The ranking: fewest notes outside first, then fewest notes skipped, then the share of what you played inside."
      limits="Modes of the same notes tie: play all of C major and C major, A minor, D dorian… all show complete, in list order. Picking home is the key's job, not this list's. The percentage is a summary; the order comes from the rule above, so a lower % can sit higher."
      sources={[{ label: "No paper: a plain inclusion ranking written for this lab" }]}
      aside="Ranking by inclusion first means a scale is never picked for being close. It has to contain what you played: one stray note is enough to push it down."
    >
      <p>
        I write down which notes you really played, over half a minute, then try every scale on
        every tonic like keys on a ring: which ones open the lock without a missing tooth?
      </p>
    </HowPanel>
  );
}

export function ChordGameHow() {
  return (
    <HowPanel
      topic="when a chord counts"
      diagram={
        <SketchChain
          label="A wobbly answer, steadied over a few readings"
          items={[
            {
              sketch: (
                <SketchBars
                  values={[0.4, 0.8, 0.85, 0.9, 0.88]}
                  highlight={[1, 2, 3]}
                  threshold={0.6}
                />
              ),
              caption: "answers, ten a second",
            },
            { sketch: <SketchLabel text="G" sub="three in a row" />, caption: "counted" },
          ]}
        />
      }
      algorithm="The chord detector answers ten times a second from its one-second window. A chord counts when the same name comes back three times in a row with a score above the threshold."
      limits="You need to hold the chord about half a second. Inversions and slash chords count as their plain chord."
      sources={[{ label: "Debouncing, a classic of control systems" }]}
      aside="With “the triad is enough”, an E counts for an E7 target: same root, same third, same fifth."
    >
      <p>
        The detector wobbles, like a friend who mishears. So I wait until it says the same chord
        three times in a row before writing it down.
      </p>
    </HowPanel>
  );
}

export function WolfJumperHow() {
  return (
    <HowPanel
      topic="notes, and a gate with no knob"
      diagram={
        <SketchChain
          label="The room level, its learnt floor, the threshold above it"
          items={[
            { sketch: <SketchWave kind="noise" />, caption: "your room" },
            {
              sketch: <SketchMeter level={0.62} floor={0.3} threshold={0.42} />,
              caption: "floor + 6 dB",
            },
            { sketch: <SketchLabel text="E" sub="note fired" />, caption: "enemy down" },
          ]}
        />
      }
      algorithm="The note comes from the pitch tracker (or the chroma) and fires when it holds for two readings. The gate's floor is the quietest level of the last six seconds; it falls at once, climbs at most 6 dB a second, opens 6 dB above and closes 3 dB above after 250 ms."
      limits="Two notes at once confuse the pitch tracker. In a room louder than −45 dBFS the gate keeps working but says the room is noisy."
      sources={[
        { label: "Martin, minimum statistics, IEEE TSAP 2001" },
        { label: "McLeod & Wyvill, ICMC 2005" },
      ]}
      aside="The floor falls instantly but climbs slowly: a player who starts playing straight away is never mistaken for background noise."
    >
      <p>
        The gate listens to your room first, the fridge, the fan, and sets itself just above them.
        Nothing to tune: if the room gets louder, it follows.
      </p>
    </HowPanel>
  );
}

export function SpectrumHow() {
  return (
    <HowPanel
      topic="the spectrum"
      diagram={
        <SketchChain
          label="A sound split into frequencies, with its noise floor"
          items={[
            { sketch: <SketchWave kind="pluck" cycles={9} />, caption: "a third of a second" },
            {
              sketch: (
                <SketchBars
                  values={[0.3, 0.9, 0.35, 0.6, 0.3, 0.45, 0.25, 0.3, 0.22, 0.2]}
                  highlight={[1, 3, 5]}
                  threshold={0.28}
                />
              ),
              caption: "frequencies, floor",
            },
          ]}
        />
      }
      algorithm="Every third of a second I take the last 16384 samples and split them with an FFT into slots 2.9 Hz apart, drawn in dB. The dashed line is the typical level of all slots up to 4 kHz (their median): the room's hiss. Anything well above it is you."
      limits="One note is not one peak but a comb: a low A shows at 110, 220, 330 Hz… And a third of a second per picture means this view reacts slowly."
      sources={[
        { label: "Cooley & Tukey, FFT, 1965" },
        { label: "Harris, windows for the DFT, Proc. IEEE 1978" },
      ]}
      aside="This is the raw material of Chords & keys: its first window folds this picture into twelve notes."
    >
      <p>
        Every sound is a stack of vibrations. The FFT is a prism: it splits the sound into them. Low
        pitches on the left, high on the right; the taller, the louder.
      </p>
    </HowPanel>
  );
}

export function TempoHow() {
  return (
    <HowPanel
      topic="the tempo"
      diagram={
        <SketchChain
          label="Loudness pulses, their spectrum, a tempo"
          items={[
            {
              sketch: <SketchCurve points={peaks([0.1, 0.35, 0.6, 0.85], 0.02, 0.05)} />,
              caption: "how much louder",
            },
            {
              sketch: <SketchCurve points={peaks([0.5], 0.05, 0.1)} marks={[0.5]} />,
              caption: "beat spectrum",
            },
            { sketch: <SketchLabel text="120" sub="BPM" />, caption: "tempo" },
          ]}
        />
      }
      algorithm="Two windows, two steps. Onset strength: how much louder the sound just got (level of tiny blocks, only the rises kept, smoothed), one bump per attack. Beat spectrum: an FFT of those bumps over 8 s, read in BPM; regular bumps give one peak, and its position is the tempo (nudged toward 120 BPM when in doubt)."
      limits="Half and double tempo are easy to mix up; it needs a steady beat over eight seconds; the raw resolution is 7.5 BPM, refined by interpolation."
      sources={[{ label: "Ellis, Beat tracking by dynamic programming, JNMR 2007" }]}
      aside="The tempo isn't in the sound's spectrum at all: nothing audible vibrates at 2 Hz. It lives in how the loudness pulses."
    >
      <p>
        First I mark when the sound gets louder: that is the left window. Then I look at how
        regularly those marks come back: that is the right one. A steady beat gives one clear peak.
      </p>
    </HowPanel>
  );
}

export function OnsetHow() {
  return (
    <HowPanel
      topic="when a note starts"
      diagram={
        <SketchChain
          label="A pluck, the spectral flux peak, the dated onset"
          items={[
            { sketch: <SketchWave kind="pluck" cycles={10} />, caption: "a pluck" },
            {
              sketch: <SketchCurve points={peaks([0.3], 0.025, 0.05)} marks={[0.3]} />,
              caption: "new energy",
            },
            {
              sketch: <SketchTimeline targets={[]} dots={[0.3]} hit={0.3} />,
              caption: "dated to 0.7 ms",
            },
          ]}
        />
      }
      algorithm="SuperFlux: a log spectrogram on 12 bands per octave (21 ms window, a frame every 2.7 ms), a max filter across bands, the positive difference. Online peak picking, then a walk back on a 0.7 ms level curve to the start of the attack. An onset counts when it rises 6 dB above the room."
      limits="A soft note right after a loud one still ringing can slip through; hammer-ons and slides have no attack; a slow strum (over 50 ms) may count twice."
      sources={[
        { label: "Böck & Widmer, DAFx 2013" },
        { label: "Böck, Krebs & Schedl, ISMIR 2012" },
      ]}
      aside="The max filter is what stops a vibrato from being read as a stream of new notes."
    >
      <p>
        A note starts when many frequencies jump at once: the pick hits, everything wakes up. I
        watch for that jump, then walk back to its very first instant, so each note gets a date on
        the audio clock.
      </p>
    </HowPanel>
  );
}

export function LatencyHow() {
  return (
    <HowPanel
      topic="latency and tolerance"
      diagram={
        <SketchChain
          label="Delays add up; the window is never narrower than their uncertainty"
          items={[
            { sketch: <SketchWave kind="click" />, caption: "click, screen, mic" },
            {
              sketch: (
                <SketchTimeline
                  wide
                  targets={[0.3, 0.7]}
                  dots={[0.33, 0.66]}
                  band={0.08}
                  hit={0.3}
                  beats={[0.3, 0.7]}
                />
              ),
              wide: true,
              caption: "on-time band",
            },
            { sketch: <SketchLabel text="±100 ms" sub="never below 2σ" />, caption: "tolerance" },
          ]}
        />
      }
      algorithm="Each audio batch carries its sample number, so the page clock is mapped onto the audio clock from arrival times. Delays add, uncertainties add in quadrature, and the on-time window is at least twice the result. With the click in the microphone, its echo measures the round trip directly."
      limits="Without the click reaching the microphone, the input delay is an estimate. Bluetooth adds 150–300 ms on its own."
      sources={[
        { label: "W3C Web Audio API" },
        { label: "Repp, Sensorimotor synchronization, PB&R 2005" },
      ]}
      aside="Musicians tend to play 20–50 ms ahead of a click without noticing (Repp). “Early” isn't always the machine's fault."
    >
      <p>
        Every link is late: the screen draws late, the speaker plays late, the microphone hears
        late. A note keeps its own date, so a slow delivery never moves it. What&apos;s left I
        measure, or estimate honestly.
      </p>
    </HowPanel>
  );
}

export function PlayAlongHow() {
  return (
    <HowPanel
      topic="grading the timing"
      diagram={
        <SketchChain
          label="Marks on a beat grid, each onset matched to the nearest mark"
          items={[
            {
              sketch: (
                <SketchTimeline
                  wide
                  targets={[0.3, 0.55, 0.8]}
                  dots={[0.28, 0.6]}
                  band={0.06}
                  hit={0.3}
                  beats={[0.3, 0.55, 0.8]}
                />
              ),
              wide: true,
              caption: "marks, band, your notes",
            },
            { sketch: <SketchLabel text="early" sub="−30 ms" />, caption: "verdict" },
          ]}
        />
      }
      algorithm="The metronome schedules its clicks ahead on the audio clock. Each note you play is matched to the nearest mark within its window (windows never overlap). The click heard by the microphone is told apart by its narrow 2.3–4 kHz signature. At your own pace, a straight line t = a + b·beat is fitted to your notes."
      limits="Fast passages narrow the windows. A very loud strum on top of the click can hide it."
      sources={[{ label: "Sen, Theil–Sen slope, JASA 1968" }, { label: "Repp 2005" }]}
      aside="At your own pace the latency cancels out completely: only how even your rhythm is gets graded."
    >
      <p>
        Every mark sits on the metronome&apos;s grid. Your note lands on the same clock, delay
        removed, and meets the closest mark: on time, early, late or missed. The red dot shows
        exactly where you landed.
      </p>
    </HowPanel>
  );
}
