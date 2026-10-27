/**
 * The "How?" sheets of the listening methods: one per method a page lets
 * you pick, shown under the picker for the method selected. Longer than the
 * feature sheets (about twice): the idea, a bit of history, the trick, what
 * it gets wrong, and what we measured. Voice: the MusicalBook harmony
 * chapters, in English — down to earth, one image per idea, honest.
 */

import {
  HowPanel,
  SketchBars,
  SketchChain,
  SketchCurve,
  SketchLabel,
  SketchWave,
} from "@audiolab/react";

const NOTES = ["C", "", "D", "", "E", "F", "", "G", "", "A", "", "B"];
const C_MAJOR = [0.9, 0.05, 0.1, 0.05, 0.7, 0.1, 0.05, 0.8, 0.05, 0.15, 0.05, 0.1];
const C_MAJOR_SHARP = [0.9, 0, 0.02, 0, 0.75, 0.03, 0, 0.85, 0, 0.05, 0, 0.03];

/** A curve with bumps at `xs` (heights 0.85), base `low`, width `w`. */
function bumps(xs: number[], w = 0.03, low = 0.08): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const x = i / 60;
    let y = low;
    for (const c of xs) y = Math.max(y, low + 0.8 * Math.exp(-((x - c) ** 2) / (2 * w * w)));
    pts.push([x, y]);
  }
  return pts;
}

// --- chords --------------------------------------------------------------------------

export function ChordClassicHow() {
  return (
    <HowPanel
      topic="chroma templates"
      diagram={
        <SketchChain
          label="One second of notes compared with a stencil for each chord"
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
              caption: "C major stencil",
            },
            { sketch: <SketchLabel text="C" sub="closest stencil" />, caption: "answer" },
          ]}
        />
      }
      algorithm="Ten times a second, an FFT (a prism that splits the sound into its frequencies) is folded into the 12 notes: how much C, how much C#, … octaves merged. I average the last second of that, then measure how well it fits each chord's stencil: three holes for a triad, four for a seventh. The fits become shares that add up to 100 %, and the best one wins. That's all."
      limits="A second is a long time: I answer about 0.7 s after you change chord, and when chords go by fast I flicker between the old one, the new one, and a mix of both. Each note also carries quiet higher tones (harmonics), and the fifth harmonic of a note is its major third: a minor chord can lean major."
      sources={[{ label: "Fujishima, Realtime chord recognition of musical sound, ICMC 1999" }]}
      aside="On real guitar recordings this gets about one frame in two right, from 80 % on singer-songwriter strumming down to 25 % on jazz voicings. It is the reference every other method here is measured against."
    >
      <p>
        Let's start with the classic. A chord is a handful of notes ringing together, nothing more
        mysterious than that. So I listen to which notes ring, and I hold a stencil of every chord
        against them: the stencil whose holes are filled best is my answer.
      </p>
      <p>
        <strong>The original method is a stencil and a stopwatch.</strong> It is simple, it is
        steady, and its flaws are the flaws of the stopwatch: one second at a time.
      </p>
    </HowPanel>
  );
}

export function ChordFollowHow() {
  return (
    <HowPanel
      topic="templates + HMM"
      diagram={
        <SketchChain
          label="Ten guesses a second, then a patient listener decides"
          items={[
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "every 0.1 s",
            },
            {
              sketch: (
                <SketchCurve
                  points={[
                    [0, 0.25],
                    [0.57, 0.25],
                    [0.6, 0.8],
                    [1, 0.8],
                  ]}
                  dashed={[
                    [0, 0.3],
                    [0.1, 0.15],
                    [0.2, 0.35],
                    [0.3, 0.62],
                    [0.4, 0.2],
                    [0.5, 0.3],
                    [0.55, 0.75],
                    [0.65, 0.88],
                    [0.75, 0.68],
                    [0.9, 0.86],
                    [1, 0.8],
                  ]}
                  marks={[0.6]}
                />
              ),
              caption: "switch once sure",
            },
            { sketch: <SketchLabel text="Am" sub="no flicker" />, caption: "answer" },
          ]}
        />
      }
      algorithm="I stop averaging. Every tenth of a second I make a quick guess with the stencils, and a hidden Markov model weighs those guesses: it knows a chord usually lasts about a second, so changing costs something. One odd guess is outvoted by its neighbours; a real change keeps winning, frame after frame, and gets through after a few of them. There is also a 'no chord' answer, for silence and noise."
      limits="A chord shorter than a few tenths of a second can be skipped: the model doubts it before it believes it. In a loud room the 'no chord' answer can come up too often (we measured it on 12 % of the frames in a busy bar)."
      sources={[
        {
          label:
            "Sheh & Ellis, Chord segmentation and recognition using EM-trained HMMs, ISMIR 2003",
        },
        { label: "Rabiner, A tutorial on hidden Markov models, Proc. IEEE 1989" },
      ]}
      aside="On 46 minutes of real guitar this answers in 0.47 s instead of 0.67 s, with fewer wrong flickers, for the same accuracy within a couple of points."
    >
      <p>
        Picture a friend listening with you. They don't shout a new chord name at every strum: they
        wait to be sure, and they don't change their mind because of one wrong note. That patience
        is the whole idea.
      </p>
      <p>
        <strong>Fast guesses, slow decisions.</strong> The guessing is the same stencil game as the
        original; what changes is who decides.
      </p>
    </HowPanel>
  );
}

export function ChordSharperHow() {
  return (
    <HowPanel
      topic="log chroma + HMM"
      diagram={
        <SketchChain
          label="The same notes, cleaned before the stencils"
          items={[
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "raw notes",
            },
            {
              sketch: <SketchBars values={C_MAJOR_SHARP} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "sharper",
            },
            { sketch: <SketchLabel text="C" sub="then follow" />, caption: "answer" },
          ]}
        />
      }
      algorithm="Two changes before the stencils, then the patient listener of 'follow the changes'. One: a frequency that falls between two notes is shared between them with a bell-shaped weight, instead of being thrown whole into the nearest one; what sits right on a note counts most. Two: loud frequencies are squashed with a logarithm (the knee sits 20 dB under the loudest), so a booming bass string no longer drowns the quiet notes on top."
      limits="Squashing the loud also lifts the noise: in a very noisy room this can do worse than the original. On modal music (a dorian groove) it lost the key the original found: the bass that anchored the tonic got squashed too."
      sources={[{ label: "Müller, Fundamentals of Music Processing, Springer 2015 (§3.1, §5.2)" }]}
      aside="This is the same trick as a compressor on a mixing desk: you don't hear the quiet parts better because they got louder, but because the loud ones stopped hogging the room."
    >
      <p>
        Before naming a chord, I clean the picture. Think of a photo taken against the light: the
        sky is so bright you can't see the faces. Turn the bright parts down, and the faces appear.
      </p>
      <p>
        <strong>Here the faces are the quiet notes of the chord</strong>, and the sky is the loud
        bass string with its harmonics.
      </p>
    </HowPanel>
  );
}

export function ChordCqtHow() {
  return (
    <HowPanel
      topic="constant-Q + HMM"
      diagram={
        <SketchChain
          label="Long windows for low notes, short ones for high notes"
          items={[
            { sketch: <SketchWave kind="sine" />, caption: "low E: 0.7 s" },
            { sketch: <SketchWave kind="pluck" />, caption: "high E: 0.04 s" },
            { sketch: <SketchLabel text="C" sub="then follow" />, caption: "answer" },
          ]}
        />
      }
      algorithm="A constant-Q transform. For each quarter tone from the low E (82 Hz) up, I measure how much of that exact note is in the sound, over a window that always holds the same number of vibrations (about 68): about 0.7 s for the low E, a few hundredths of a second up high. The windows all end now, so nothing waits for the future. The result is folded into the 12 notes, squashed like 'sharper notes', and handed to the patient listener."
      limits="It needs the raw sound, not just the spectrum, and costs more to compute (about 3 % of a laptop core). The low notes still take their 0.7 s to be sure, so a fast bass line blurs."
      sources={[
        { label: "Brown, Calculation of a constant Q spectral transform, JASA 1991" },
        {
          label:
            "Schörkhuber & Klapuri, Constant-Q transform toolbox for music processing, SMC 2010",
        },
      ]}
      aside="Measured on two separate groups of guitarists, this was the only change that won on both: about +6 points over the original, and it answers in half a second."
    >
      <p>
        Here's the problem with the classic prism: it looks at every note through the same window, a
        third of a second. That is far too short to tell two low notes apart (the low E and F are
        only 5 Hz away), and far too long for the high ones, which change faster than that.
      </p>
      <p>
        <strong>So each note gets its own window, cut to its size.</strong> Low notes are listened
        to patiently, high notes quickly. Our ears do something quite similar.
      </p>
    </HowPanel>
  );
}

export function ChordAiHow() {
  return (
    <HowPanel
      topic="Basic Pitch"
      diagram={
        <SketchChain
          label="A small neural network writes the notes, the notes make the chord"
          items={[
            { sketch: <SketchWave kind="pluck" />, caption: "two seconds" },
            {
              sketch: (
                <SketchBars
                  values={[0.9, 0, 0, 0, 0.8, 0, 0, 0.85, 0, 0, 0, 0]}
                  highlight={[0, 4, 7]}
                  labels={NOTES}
                />
              ),
              caption: "notes it heard",
            },
            { sketch: <SketchLabel text="C" sub="from the notes" />, caption: "answer" },
          ]}
        />
      }
      algorithm="Basic Pitch is a small neural network from Spotify (a 230 KB model, Apache-2.0 licence), trained to write down which notes are being played, several at once, about 86 times a second. I run it on the last two seconds, four times a second, in your browser. Its notes are folded into the 12 notes, the low ones also into a separate 'bass' picture that pulls the chord whose root is in the bass, and the patient listener decides."
      limits="It needs to hear a little ahead (about 0.2 s) and the first answer takes a moment while the model loads. In noise its notes fade: in a loud bar or through a bad microphone it falls behind the classic methods."
      sources={[
        {
          label:
            "Bittner, Bosch, Rubinstein, Meseguer-Brocal & Ewert, A lightweight instrument-agnostic model for polyphonic note transcription, ICASSP 2022",
        },
      ]}
      aside="In a quiet room it was the best of all on our test guitarists: about +11 points over the original. It is the 'AI' option, and like most AI it is brilliant in the conditions it was trained for."
    >
      <p>
        Every other method here looks for chords in the raw sound. This one cheats a little: it asks
        a trained ear to write down the notes first, the way you would transcribe a recording, and
        only then recognises the chord from the notes.
      </p>
      <p>
        <strong>Notes first, chord second.</strong> When the notes are right, the chord is easy.
      </p>
    </HowPanel>
  );
}

// --- key -------------------------------------------------------------------------------

export function KeyProfileHow() {
  return (
    <HowPanel
      topic="key profiles"
      diagram={
        <SketchChain
          label="Notes over several seconds compared with each key's profile"
          items={[
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "last seconds",
            },
            {
              sketch: (
                <SketchBars
                  values={[0.9, 0.2, 0.5, 0.2, 0.65, 0.6, 0.25, 0.8, 0.25, 0.55, 0.2, 0.4]}
                  labels={NOTES}
                />
              ),
              caption: "C major profile",
            },
            { sketch: <SketchLabel text="C major" sub="best match" />, caption: "answer" },
          ]}
        />
      }
      algorithm="I add up which notes rang over the last 8 seconds (and 30 seconds for the long-term key). Each of the 24 keys has a profile: how much each of the 12 notes 'belongs' in it, measured on listeners by Krumhansl and Kessler. I compare my notes with the 24 profiles rotated to every tonic, and the closest one is the key."
      limits="C major and A minor use the same notes: their profiles differ only in which note feels like home, so I often name the relative. A key that changes, or a song that stays on one chord, confuses me."
      sources={[
        {
          label:
            "Krumhansl & Kessler, Tracing the dynamic changes in perceived tonal organisation, Psych. Review 1982",
        },
        { label: "Krumhansl, Cognitive Foundations of Musical Pitch, OUP 1990" },
      ]}
      aside="On real guitar the key signature is found far more often than the key itself: the notes are right, the 'home' note is the hard part."
    >
      <p>
        A key is a pool of notes made to work together, each with its role: a home note, its close
        friends, a few guests. Play long enough and the pool shows: some notes keep coming back,
        others never.
      </p>
      <p>
        <strong>So I count the notes, and I match the count against each key's habits.</strong> No
        chords involved: just which notes, how often.
      </p>
    </HowPanel>
  );
}

export function KeyChordsHow() {
  return (
    <HowPanel
      topic="chord vote"
      diagram={
        <SketchChain
          label="The chords found vote for the keys they belong to"
          items={[
            { sketch: <SketchLabel text="C F G Am" sub="chords heard" />, caption: "the chords" },
            {
              sketch: (
                <SketchBars
                  values={[0.95, 0.1, 0.2, 0.1, 0.3, 0.55, 0.1, 0.6, 0.1, 0.4, 0.1, 0.2]}
                  labels={NOTES}
                />
              ),
              caption: "votes",
            },
            { sketch: <SketchLabel text="C major" sub="most votes" />, caption: "answer" },
          ]}
        />
      }
      algorithm="I keep the chord found at each moment of the last seconds. Every key then counts its votes: C major is made of C, F, G, Dm, Em and Am, so each of those chords votes for it, the home chord and its dominant (I and V) loudest. Minor keys get their own family (with the major V of the harmonic minor). The note profile of 'key profiles' still gets a say, at half weight, as a tie-breaker."
      limits="It is only as good as the chords it hears: on dense jazz voicings, wrong chords vote. And a progression that sits on two chords can belong to several keys."
      sources={[
        { label: "Noland & Sandler, Key estimation using a hidden Markov model, ISMIR 2006" },
      ]}
      aside="This was the clearest win on the key: about +6 points on clean guitar and +15 through a bad microphone, and it tells C major from A minor better, because the home chord gets the loudest vote."
    >
      <p>
        Here's the trick: a wrong chord usually still belongs to the right key. Hear an Em instead
        of a C? Both live in C major. So instead of asking the notes, I ask the chords, and I let
        them vote.
      </p>
      <p>
        <strong>A key is a family of chords</strong>, and families are easier to recognise than
        their members.
      </p>
    </HowPanel>
  );
}

// --- pitch -----------------------------------------------------------------------------

export function PitchMpmHow() {
  return (
    <HowPanel
      topic="MPM"
      diagram={
        <SketchChain
          label="The wave compared with itself, shifted"
          items={[
            { sketch: <SketchWave kind="pluck" />, caption: "the wave" },
            {
              sketch: <SketchCurve points={bumps([0.25, 0.5, 0.75], 0.025, 0.1)} marks={[0.25]} />,
              caption: "self-match",
            },
            { sketch: <SketchLabel text="A2" sub="110 Hz" />, caption: "note" },
          ]}
        />
      }
      algorithm="McLeod's pitch method. I slide the last 2048 samples over themselves and measure how well they match at each shift: a string at 110 Hz matches itself every 9.1 ms. The first strong match is the period, refined between samples with a parabola. The height of that match, its 'clarity', says how sure I am; below 0.8, I say nothing."
      limits="A string whose fundamental is weak can be read an octave high, and in a noisy room the matches blur: the tuner hesitates or goes quiet."
      sources={[{ label: "McLeod & Wyvill, A smarter way to find pitch, ICMC 2005" }]}
      aside="It is precise to a fraction of a cent on a clean note: perfect for tuning, as long as the room lets it hear."
    >
      <p>
        A note is a wave that repeats itself. Find how long it takes to repeat, and you have the
        note: that's what a tuner does, nothing more.
      </p>
      <p>
        <strong>I look for the moment the wave starts again.</strong> The rest is bookkeeping.
      </p>
    </HowPanel>
  );
}

export function PitchPyinHow() {
  return (
    <HowPanel
      topic="pYIN"
      diagram={
        <SketchChain
          label="Several candidate pitches, then the most plausible path"
          items={[
            {
              sketch: <SketchCurve points={bumps([0.25, 0.5], 0.03, 0.1)} marks={[0.25, 0.5]} />,
              caption: "candidates",
            },
            {
              sketch: (
                <SketchCurve
                  points={[
                    [0, 0.5],
                    [0.4, 0.5],
                    [0.45, 0.7],
                    [1, 0.7],
                  ]}
                />
              ),
              caption: "plausible path",
            },
            { sketch: <SketchLabel text="A2" sub="110 Hz" />, caption: "note" },
          ]}
        />
      }
      algorithm="pYIN. YIN compares the wave with itself, like the original, but with a threshold to decide what 'repeats' means. pYIN tries a whole spread of thresholds and keeps every candidate with a probability. Then a hidden Markov model follows the most plausible line through time: notes don't jump an octave for one frame and come back. It looks 50 ms ahead to decide."
      limits="It answers more often, including when nothing is played (it can hum along with the room), and its decision comes 50 ms later."
      sources={[
        { label: "de Cheveigné & Kawahara, YIN, a fundamental frequency estimator, JASA 2002" },
        { label: "Mauch & Dixon, pYIN, ICASSP 2014" },
      ]}
      aside="In a busy bar it kept about 14 more points of the notes than the original, and halved the octave mistakes."
    >
      <p>
        When you are not sure what you heard, you don't pick one answer and forget the rest: you
        keep a few in mind, and the next seconds tell you which one was right.
      </p>
      <p>
        <strong>That is pYIN: several guesses, and time to settle them.</strong>
      </p>
    </HowPanel>
  );
}

export function PitchCrepeHow() {
  return (
    <HowPanel
      topic="CREPE tiny"
      diagram={
        <SketchChain
          label="A small neural network reads the pitch from the raw wave"
          items={[
            { sketch: <SketchWave kind="noise" />, caption: "noisy wave" },
            {
              sketch: <SketchCurve points={bumps([0.42], 0.02, 0.05)} marks={[0.42]} />,
              caption: "360 pitch bins",
            },
            { sketch: <SketchLabel text="A2" sub="sure: 92 %" />, caption: "note" },
          ]}
        />
      }
      algorithm="CREPE is a neural network trained on thousands of recordings to read the pitch straight from 64 ms of sound. I use its 'tiny' version (MIT licence). It gives a probability for 360 pitches, so it also says how sure it is; when it is sure, the original method measures the exact cents around its answer. It runs about ten times a second."
      limits="It is heavier than everything else on this site: on a small phone the tuner refreshes less often. It also learned on voices and instruments in general, not on your guitar."
      sources={[
        {
          label:
            "Kim, Salamon, Li & Bello, CREPE: a convolutional representation for pitch estimation, ICASSP 2018",
        },
      ]}
      aside="Through a busy bar's noise it kept 61 % of the notes where the original kept 41 %, and almost never mistakes an octave."
    >
      <p>
        Instead of writing the rules of pitch by hand, someone showed a small network thousands of
        examples until it learned to hear the note on its own. It is less precise to the cent, but
        much harder to fool.
      </p>
      <p>
        <strong>It decides which note; the classic method measures how in tune.</strong> Each does
        what it does best.
      </p>
    </HowPanel>
  );
}

// --- onsets ------------------------------------------------------------------------------

export function OnsetClassicHow() {
  return (
    <HowPanel
      topic="SuperFlux"
      diagram={
        <SketchChain
          label="A pluck, the sudden change in the spectrum, the dated note"
          items={[
            { sketch: <SketchWave kind="pluck" />, caption: "a pluck" },
            {
              sketch: <SketchCurve points={bumps([0.35], 0.03)} marks={[0.35]} />,
              caption: "spectral change",
            },
            { sketch: <SketchLabel text="0.35 s" sub="note start" />, caption: "dated" },
          ]}
        />
      }
      algorithm="SuperFlux. Every few milliseconds I compare the spectrum with the one just before and add up only what got louder, after a small trick (a maximum filter across frequencies) so a vibrato does not count as a new note. A new note makes that sum jump; a peak above the recent average by a set margin is a note start, then dated precisely on the attack. A gate that learns the room's noise sits on top."
      limits="The margin is careful: soft notes and the strings of a strum can hide under it. In our measures this method rarely invents a note but misses about a third of them."
      sources={[
        {
          label: "Böck & Widmer, Maximum filter vibrato suppression for onset detection, DAFx 2013",
        },
      ]}
      aside="The gate was suspected first, but its three settings change almost nothing: the notes are lost earlier, at the margin of the peak picker."
    >
      <p>
        A note starting is a little shock: the sound changes all at once. So I don't listen for
        loud, I listen for <em>sudden</em>.
      </p>
      <p>
        <strong>The original method is careful.</strong> When it says a note started, it is almost
        always right.
      </p>
    </HowPanel>
  );
}

export function OnsetSensitiveHow() {
  return (
    <HowPanel
      topic="SuperFlux, low threshold"
      diagram={
        <SketchChain
          label="The same change curve, a lower margin"
          items={[
            {
              sketch: (
                <SketchCurve
                  points={bumps([0.2, 0.45, 0.7], 0.03)}
                  dashed={[
                    [0, 0.6],
                    [1, 0.6],
                  ]}
                />
              ),
              caption: "original bar",
            },
            {
              sketch: (
                <SketchCurve
                  points={bumps([0.2, 0.45, 0.7], 0.03)}
                  dashed={[
                    [0, 0.3],
                    [1, 0.3],
                  ]}
                  marks={[0.2, 0.45, 0.7]}
                />
              ),
              caption: "lower bar",
            },
            { sketch: <SketchLabel text="3 / 3" sub="notes found" />, caption: "answer" },
          ]}
        />
      }
      algorithm="Exactly the original method, with one number changed: the margin a peak must clear above the recent average goes from 0.03 to 0.01. Everything else stays: the same change curve, the same dating, the same gate."
      limits="A lower bar lets a little more through: precision drops from about 91 % to 77 %. In a busy room, some cutlery will count as a note."
      sources={[
        {
          label:
            "Böck, Krebs & Schedl, Evaluating the online capabilities of onset detection methods, ISMIR 2012",
        },
      ]}
      aside="One number, and on our test guitarists 9 more points of notes found in a quiet room, 21 more through a bad microphone. Sometimes the best fix is a screwdriver, not a new engine."
    >
      <p>
        If the original misses notes, maybe it is not deaf, maybe it is too shy. So I lower the bar
        a note must clear before I believe it.
      </p>
      <p>
        <strong>Fewer missed notes, a few more false alarms</strong>: that is the whole trade.
      </p>
    </HowPanel>
  );
}

export function OnsetPhaseHow() {
  return (
    <HowPanel
      topic="SuperFlux + complex domain"
      diagram={
        <SketchChain
          label="A prediction of the next moment, and the surprise when a note starts"
          items={[
            { sketch: <SketchWave kind="sine" />, caption: "predictable" },
            {
              sketch: <SketchCurve points={bumps([0.55], 0.025)} marks={[0.55]} />,
              caption: "surprise",
            },
            { sketch: <SketchLabel text="0.55 s" sub="soft note" />, caption: "found" },
          ]}
        />
      }
      algorithm="Two detectors summed. The first is SuperFlux (what got louder). The second is the complex domain: a steady note is predictable, each frequency keeps its strength and turns at a steady pace, so I predict the next moment from the last two and measure the surprise. A new note breaks the prediction even when it is not louder. Both curves are scaled to their recent maximum, added, and peaks are picked."
      limits="It costs about twice the original. It answers to every new note, so a fast strum can count as two."
      sources={[
        { label: "Duxbury, Bello, Davies & Sandler, Complex domain onset detection, DAFx 2003" },
        { label: "Bello et al., A tutorial on onset detection in music signals, IEEE TSAP 2005" },
      ]}
      aside="The best of everything we tried: about 15 more points of notes in a quiet room and 21 more in a busy bar than the original."
    >
      <p>
        Some notes start without getting louder: a hammer-on, a soft finger, a note under a ringing
        chord. Loudness misses them. But they still change something: the rhythm of the wave itself.
      </p>
      <p>
        <strong>So I also listen for surprises in the timing of the wave</strong>, not only in its
        strength.
      </p>
    </HowPanel>
  );
}

// --- tempo -------------------------------------------------------------------------------

export function TempoEnvelopeHow() {
  return (
    <HowPanel
      topic="RMS envelope"
      diagram={
        <SketchChain
          label="Loudness pulses, their spectrum, a tempo"
          items={[
            {
              sketch: <SketchCurve points={bumps([0.1, 0.35, 0.6, 0.85], 0.02, 0.05)} />,
              caption: "how much louder",
            },
            {
              sketch: <SketchCurve points={bumps([0.5], 0.05, 0.1)} marks={[0.5]} />,
              caption: "beat spectrum",
            },
            { sketch: <SketchLabel text="120" sub="BPM" />, caption: "tempo" },
          ]}
        />
      }
      algorithm="I follow how loud the whole sound is, keep only the rises, and smooth them: one bump per attack. Then I look at those bumps over 8 seconds through a prism (a Fourier transform), read in beats per minute. Regular bumps give one peak, nudged toward 120 BPM when in doubt."
      limits="On a strummed guitar the overall loudness barely moves between strums: the bumps drown, and the tempo wanders. On our test recordings it was right about one reading in seven."
      sources={[{ label: "Ellis, Beat tracking by dynamic programming, JNMR 2007" }]}
      aside="It is excellent on a metronome click, which is why it looked fine for so long."
    >
      <p>
        The tempo isn't a note: nothing in the sound vibrates at two beats a second. It lives in how
        the sound pulses. So first I find the pulses, then how regularly they come back.
      </p>
      <p>
        <strong>The original listens to the loudness pulsing</strong>: clear on drums, fragile on a
        strummed guitar.
      </p>
    </HowPanel>
  );
}

export function TempoFluxHow() {
  return (
    <HowPanel
      topic="spectral flux"
      diagram={
        <SketchChain
          label="Spectral changes, their self-similarity, a tempo"
          items={[
            {
              sketch: <SketchCurve points={bumps([0.12, 0.37, 0.62, 0.87], 0.015, 0.05)} />,
              caption: "what changed",
            },
            {
              sketch: <SketchCurve points={bumps([0.25, 0.5, 0.75], 0.03, 0.1)} marks={[0.5]} />,
              caption: "repeats every beat",
            },
            { sketch: <SketchLabel text="120" sub="BPM" />, caption: "tempo" },
          ]}
        />
      }
      algorithm="Two changes. First the pulses: instead of the overall loudness, I add up, a hundred times a second, every frequency that just got louder (the spectral flux). A strum lights up six strings' worth of frequencies even when the total barely moves. Then the regularity: I compare the last 8 seconds of pulses with themselves, shifted (an autocorrelation); a shift of one beat matches best. Shifts of two and four beats back it up, a bell curve around 120 BPM settles the doubtful cases, and each reading is smoothed with the last ones."
      limits="Swing and shuffle can be read as 3/2 or 4/3 of the tempo, and a very fast jazz tune at half its tempo. It needs 8 seconds of steady playing."
      sources={[
        { label: "Ellis, Beat tracking by dynamic programming, JNMR 2007" },
        { label: "Percival & Tzanetakis, Streamlined tempo estimation, IEEE/ACM TASLP 2014" },
      ]}
      aside="The biggest win of all our tests: on real strummed guitar, right on about 70 % of the readings instead of 14 %, and barely affected by a noisy room."
    >
      <p>
        Same idea as the original, different ears. The beat of a guitar isn't in how loud it is,
        it's in how its sound changes: each strum adds new frequencies, even when the volume stays
        put.
      </p>
      <p>
        <strong>Listen to the changes, not the volume</strong>, and the beat comes out.
      </p>
    </HowPanel>
  );
}

// --- chords at an onset (play-along) -------------------------------------------------------

export function LabelChromaNearestHow() {
  return (
    <HowPanel
      topic="one look after the strum"
      diagram={
        <SketchChain
          label="The 170 ms after a strum, folded into notes, matched with the stencils"
          items={[
            { sketch: <SketchWave kind="pluck" />, caption: "after the strum" },
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "12 notes",
            },
            { sketch: <SketchLabel text="C" sub="closest stencil" />, caption: "answer" },
          ]}
        />
      }
      algorithm="When a strum is heard, I skip its first 30 ms (the pick noise), take the next 170 ms, run one FFT over them and fold every frequency into its nearest note, from 70 Hz to 2 kHz. Then the chord stencils, as on the chord page, but on that single look instead of a one-second average."
      limits="170 ms is short: the FFT's frequencies are 6 Hz apart, so two neighbouring low notes share a bin and a bass note can leak into its neighbour. A chord with a strong bass can be named after the wrong root."
      sources={[{ label: "Fujishima, Realtime chord recognition of musical sound, ICMC 1999" }]}
      aside="No smoothing here, on purpose: each strum is judged on its own, so changing chord on the beat is never held against you."
    >
      <p>
        On the scrolling chords, I don't listen all the time: I wait for you to strum, and I look
        once, right after. One look per chord, the way a teacher glances at your hand.
      </p>
    </HowPanel>
  );
}

export function LabelChromaLogHow() {
  return (
    <HowPanel
      topic="one sharper look"
      diagram={
        <SketchChain
          label="The same look, cleaned before the stencils"
          items={[
            {
              sketch: <SketchBars values={C_MAJOR} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "raw notes",
            },
            {
              sketch: <SketchBars values={C_MAJOR_SHARP} highlight={[0, 4, 7]} labels={NOTES} />,
              caption: "sharper",
            },
            { sketch: <SketchLabel text="C" sub="closest stencil" />, caption: "answer" },
          ]}
        />
      }
      algorithm="The same 170 ms and the same FFT as the original. A frequency between two notes is shared between them with a bell-shaped weight instead of going whole to the nearest, and the loud frequencies are squashed with a logarithm before the stencils."
      limits="Squashing the loud also lifts the noise. This was measured on the chord page's one-second window, not yet on single strums: try it, and keep the original if it does worse in your room."
      sources={[{ label: "Müller, Fundamentals of Music Processing, Springer 2015 (§3.1, §5.2)" }]}
      aside="A compressor on a mixing desk does the same: the quiet notes come through because the loud ones stop hogging the room."
    >
      <p>
        Same glance after the strum, but I clean the picture first, so a booming bass string no
        longer hides the quiet notes on top.
      </p>
    </HowPanel>
  );
}

export function LabelChromaCqtHow() {
  return (
    <HowPanel
      topic="one constant-Q look"
      diagram={
        <SketchChain
          label="Each note measured with its own window, inside the 170 ms"
          items={[
            { sketch: <SketchWave kind="pluck" />, caption: "after the strum" },
            { sketch: <SketchWave kind="sine" />, caption: "one window per note" },
            { sketch: <SketchLabel text="C" sub="closest stencil" />, caption: "answer" },
          ]}
        />
      }
      algorithm="A constant-Q transform of the same 170 ms: for each quarter tone from the low E (82 Hz) to 2.3 kHz, I measure that exact note over a window of about 68 vibrations, then fold the result into the 12 notes, log-squashed, and match the stencils."
      limits="The low notes would want 0.7 s; here their windows are cut to the 170 ms, so they are no sharper than with the FFT. The gain, if any, is on the middle and high strings. Measured on the chord page's continuous listening, not yet on single strums."
      sources={[
        { label: "Brown, Calculation of a constant Q spectral transform, JASA 1991" },
        {
          label:
            "Schörkhuber & Klapuri, Constant-Q transform toolbox for music processing, SMC 2010",
        },
      ]}
      aside="On the chord page this was the method that won on both groups of guitarists; on a single strum it has less room to shine."
    >
      <p>
        The FFT looks at every note through the same window. Here each note gets a window cut to its
        size, as far as the 170 ms after the strum allow.
      </p>
    </HowPanel>
  );
}
