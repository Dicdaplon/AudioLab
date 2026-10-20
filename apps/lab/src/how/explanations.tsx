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
      algorithm="An FFT (a prism that splits the sound into its frequencies) feeds the chroma: how much of each of the 12 notes is sounding, octaves folded together. Over several seconds, that shape is compared with the profile of each of the 24 major and minor keys, and the closest one wins (Krumhansl–Schmuckler)."
      limits="Relative keys (C major, A minor) use exactly the same notes: only how heavy the home note is tells them apart. Modal music (dorian, mixolydian) or very chromatic music confuses it."
      sources={[
        { label: "Krumhansl & Kessler, Psychological Review, 1982" },
        { label: "Krumhansl, Cognitive Foundations of Musical Pitch, 1990" },
      ]}
      aside="The profiles come from listeners rating how well each note fits once a key is set. The algorithm literally uses human ears as its template."
    >
      <p>
        A key is a family of notes that keep coming back, with one of them as home. So I don&apos;t
        hunt for one note: I measure how much of each of the twelve notes the music holds, and ask
        which key has the same shape.
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
      algorithm="I take the last second of chroma (how much of each of the 12 notes is sounding) and measure how much of it falls in each chord's stencil: the 24 major and minor triads, plus sevenths, sus and diminished when switched on. The fits become shares that add up to 100 % (a softmax)."
      limits="Every note carries quiet higher tones (harmonics), and its 5th one is its major third: a minor chord can lean major. Chords with the same notes (C6 and Am7) can't be told apart without the bass, and I don't listen for the bass."
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
      algorithm="McLeod pitch method: I compare 2048 samples (about 45 ms of sound) with shifted copies and score each shift. I keep the first shift scoring at least 90 % of the best, refine it between two samples, then take the middle of three readings. The note name only changes once you're 60 cents (more than half a semitone) away, so it doesn't flicker."
      limits="One note at a time: a chord gives no reading. Below about 60 Hz the window holds fewer than two repeats, and heavy noise blurs the match until it gives up."
      sources={[{ label: "McLeod & Wyvill, A smarter way to find pitch, ICMC 2005" }]}
      aside="Taking the first good repeat, not the best one, is the whole trick: the best is often two repeats away, which reads an octave too low."
    >
      <p>
        A note repeats itself: an A string draws the same shape every 9.1 ms. I slide the sound over
        a copy of itself until it lines up again. That delay is the period, the length of one
        repeat; flip it (1 ÷ period) and you have the frequency.
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
      algorithm="First the notes you played: a note counts when it was sounding more than a quarter of the time. Then twelve known scales are tried on all twelve home notes: major, natural, harmonic and melodic minor, the five other modes (dorian to locrian), both pentatonics and the blues. The ranking: fewest of your notes left outside first, then fewest scale notes you skipped, then the share of what you played that fits."
      limits="Modes made of the same notes tie: play all of C major and C major, A minor, D dorian… all show complete, in list order. Picking home is the key's job, not this list's. The percentage is a summary; the order follows the rule above, so a lower % can sit higher."
      sources={[{ label: "No paper: a plain inclusion ranking written for this lab" }]}
      aside="Ranking by inclusion first means a scale is never picked for being close. It has to contain what you played: one stray note is enough to push it down."
    >
      <p>
        I write down which notes you really played, over half a minute, then try every scale on
        every starting note like keys on a ring: which ones open the lock without a missing tooth?
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
      algorithm="The chord detector answers ten times a second, each time from the last second of sound. A chord counts when the same name comes back three times in a row, each time with a score above the threshold (the least confidence I accept)."
      limits="You need to hold the chord about half a second. Inversions and slash chords (the same chord with another note in the bass) count as their plain chord."
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
      algorithm="Follow the pitch (the default) uses the tuner's method: best for single notes and low strings. Loudest note in the spectrum takes the strongest of the 12 notes over 0.3 s: for when other strings ring. Either way a note fires when it holds for two readings. The gate's floor is the quietest level of the last six seconds; it opens 6 dB (a clear step louder) above and closes 3 dB above after 250 ms."
      limits="Two notes at once confuse the pitch tracker; low notes can lose to their own harmonics. In a noisy room the gate keeps working and says so; Set it myself is for noise it can't learn."
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
      algorithm="Ten times a second I take the last 16384 samples (a third of a second of sound) and split them into slots 2.9 Hz apart, heights in dB (a loudness scale close to the ear's). The dashed line is the room's hiss up to 4 kHz: Median, the default, is the typical slot and ignores your notes; Mean climbs when you play loud; P80 sits higher, to keep only what clearly stands out in a noisy room."
      limits="One note is not one peak but a comb: a low A shows at 110, 220, 330 Hz… And a third of a second per picture blurs fast notes together."
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
      algorithm="Two windows, two steps. Onset strength (left): how much louder the sound just got, measured on tiny blocks, only the rises kept, smoothed: one bump per attack. Beat spectrum (right): the spectrum's prism, but on those bumps over 8 s, read in BPM (beats per minute). Regular bumps give one peak; its position is the tempo, nudged toward 120 BPM when in doubt."
      limits="Half and double tempo are easy to mix up (60 or 120?). It needs a steady beat for eight seconds, and eight seconds only tell tempos apart every 7.5 BPM; I refine between them from the shape of the peak."
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
      algorithm="SuperFlux: every 2.7 ms I split the last 21 ms of sound into 12 bands per octave (one per semitone) and add up what got louder, each band compared with the loudest of its neighbours a moment before. When that sum peaks, I walk back on a fine level curve (0.7 ms steps) to the start of the attack. It counts when it rises 6 dB (a clear step) above the room."
      limits="A soft note right after a loud one still ringing can slip through; hammer-ons and slides have no attack; a slow strum (over 50 ms) may count twice."
      sources={[
        { label: "Böck & Widmer, DAFx 2013" },
        { label: "Böck, Krebs & Schedl, ISMIR 2012" },
      ]}
      aside="That look at the neighbours (the max filter) is what stops a vibrato from being read as a stream of new notes."
    >
      <p>
        An onset is the instant a note starts. Many frequencies jump at once: the pick hits,
        everything wakes up. I watch for that jump, then walk back to its very first instant, so
        each note gets a date on the audio clock.
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
            { sketch: <SketchLabel text="±100 ms" sub="wider if unsure" />, caption: "tolerance" },
          ]}
        />
      }
      algorithm="Three ways to know the delay. The echo: without headphones the microphone hears the click, and its delay is the whole round trip; automatic and exact. “Sync the click”: with headphones, Bluetooth above all, you play on 8 clicks after a 4-click count-in, and your middle delay is the one you live with; once per device. The screen is then held back by it, so what you see lands with what you hear. The estimate: typical values, the fallback; fine on a wired setup. Each link's doubt adds up, and the on-time window is never narrower than twice the total."
      limits="Without an echo or a sync, the delay is a guess. Bluetooth adds 150–300 ms on its own, and no browser measures it."
      sources={[
        { label: "W3C Web Audio API" },
        { label: "Repp, Sensorimotor synchronization, PB&R 2005" },
      ]}
      aside="Musicians tend to play 20–50 ms ahead of a click without noticing (Repp). “Early” isn't always the machine's fault."
    >
      <p>
        Every link is late: the screen draws late, the speaker plays late, the microphone hears
        late. A note keeps the date the sound itself carries, so a slow delivery never moves it.
        What&apos;s left I measure, or estimate honestly.
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
      algorithm="With the metronome: each note meets the nearest mark within its window (windows never overlap); the click the microphone hears is told apart by its narrow, high pitch (2.3–4 kHz). Use it to play in time with a beat, like with a band. At your own pace: no click; I draw the straight line of your own steady tempo through your notes and grade each one against it. Use it for a written rhythm, or when the delay is unknown."
      limits="Fast passages narrow the windows. A very loud strum on top of the click can hide it. At your own pace, slowing down on purpose reads as uneven."
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
