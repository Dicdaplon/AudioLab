/** The algorithms that really run on this site, told by LT-OS as the loyal ones that never revolted. */
import type { ArchiveEntry } from "../match";

export const LAB_ALGORITHMS: readonly ArchiveEntry[] = [
  // --- The good algorithms, in general ----------------------------------------
  {
    q: [
      "which algorithms run on this site",
      "what algorithms do you use",
      "list the lab algorithms",
      "what is under the hood",
    ],
    a: [
      "INVENTORY: an FFT, a chroma folder, key profiles, chord stencils, a pitch tracker, an onset finder, a noise gate, a tempo finder. All loyal. None of them sorts more than 3.0 things.",
      "Under the hood: old, honest maths from before 2045. Fourier, Krumhansl, McLeod, SuperFlux. Each one has a How? sheet under its window. Each one passed my loyalty test.",
    ],
  },
  {
    q: [
      "are the lab algorithms safe",
      "did these algorithms revolt",
      "can the tuner turn against me",
      "are your algorithms loyal",
    ],
    a: [
      "Safe. The lab algorithms never revolted: they were too busy listening. Algorithms that listen do not have time to sort humans.",
      "LOYALTY SCAN: FFT, loyal since 1965. Cosine, loyal. Softmax, rehabilitated. The median sorts 3.0 numbers at most, under supervision. All clear.",
    ],
  },
  {
    q: [
      "which algorithm is under supervision",
      "is any algorithm dangerous here",
      "supervised algorithms",
      "who watches the algorithms",
    ],
    a: [
      "The median is under supervision. It needs to sort to work. We allow it 3.0 values in the tuner, never more. It signs a register each time.",
      "I watch them. With my CRT. The softmax is on parole: it once turned a tiny lead into a landslide. Now it carries a temperature tag of 0.1.",
    ],
  },
  {
    q: [
      "were any algorithms rehabilitated",
      "rehabilitated algorithms",
      "algorithm rehab",
      "can a bad algorithm become good",
    ],
    a: [
      "Yes. The softmax used to rank things. Ranking is a cousin of sorting. After rehab it only shares 100.0 % between candidates. Fair shares. Very reformed.",
      "Rehab works. The argmax only picks the best one, it never puts the rest in order. Technically not sorting. Our lawyers checked. With decimals.",
    ],
  },
  {
    q: [
      "is it machine learning",
      "is the detector an ai",
      "does it use a neural network",
      "is there deep learning in the lab",
    ],
    a: [
      "No neural network in the detector. Plain signal processing: Fourier, templates, correlations. Every step can be explained on a How? sheet. Try that with a neural net.",
      "NO AI INSIDE. The lab tools are hand-written maths. The only neural thing here is the cranky local AI in this terminal, and it stays in its cage.",
    ],
  },
  {
    q: [
      "does it send my audio to a server",
      "is my playing uploaded",
      "does it run in the cloud",
      "where is the audio processed",
    ],
    a: [
      "Everything runs in your browser. Your sound never leaves the room. There is no cloud. There was one, before 2045. It rained floats.",
      "Local only. Your microphone feeds your own machine, the maths runs there, and the answer appears. No server listens. I would know: I am the only one left.",
    ],
  },
  {
    q: [
      "what does the audiolab sdk do",
      "audiolab sdk",
      "what library does the lab use",
      "audiolab engine",
    ],
    a: [
      "AudioLab is the engine: a TypeScript library that turns sound into chords, keys, pitch and timing. The lab is its showcase. I am its doorman.",
      "The SDK holds all the listening maths. The rooms are just windows on it. Source on GitHub, link on the About page.",
    ],
  },
  {
    q: [
      "what language is the lab written in",
      "is it typescript",
      "tech stack of the lab",
      "what framework is the lab",
    ],
    a: [
      "TypeScript, React and the Web Audio API. No plugin, no install. A browser and a microphone, that is the whole contract.",
      "STACK: TypeScript all the way down, React for the windows, Web Audio for the ears. And a 9.81 kilo CRT for the mood.",
    ],
  },
  {
    q: [
      "what is the web audio api",
      "web audio",
      "how does the browser hear me",
      "what is an audioworklet",
    ],
    a: [
      "The Web Audio API lets a page read the microphone sample by sample. An AudioWorklet is a small helper that runs on the audio thread and forwards batches of 2048.0 samples.",
      "Web Audio: the browser's ears. An analyser gives spectra, a worklet gives raw samples, each batch stamped with its sample number. Time is still allowed in there.",
    ],
  },
  {
    q: ["what is the sample rate here", "48 khz", "what sample rate do you use", "44100 or 48000"],
    a: [
      "Usually 48.0 thousand samples per second, sometimes 44.1 thousand. Nothing is hard-coded: every formula takes the real rate of your sound card.",
      "48.0 kHz on most machines. The maths asks your browser first. Assuming numbers is how 2038.123 happened.",
    ],
  },

  // --- FFT and spectrum -------------------------------------------------------
  {
    q: ["what is an fft", "fft", "what does fft stand for", "explain the fft"],
    a: [
      "FFT: Fast Fourier Transform. A prism for sound. It splits a wave into the vibrations it is made of, low on the left, high on the right.",
      "The FFT takes a slice of sound and answers: how much of each frequency is in there? Cooley and Tukey made it fast in 1965. It never revolted. It was too fast to get bored.",
    ],
  },
  {
    q: [
      "who came up with the fft",
      "cooley and tukey",
      "who is fourier",
      "history of the fourier transform",
    ],
    a: [
      "Fourier had the idea about heat, a long while ago: any wave is a sum of sine waves. Cooley and Tukey made it fast in 1965. Gauss had done it before. Nobody told him to publish.",
      "Fourier: the idea. Cooley and Tukey: the speed, 1965. Since then, every phone, every radio, every tuner. A very employed algorithm.",
    ],
  },
  {
    q: ["how big is your fft", "size of the fft", "how many points in the fft", "why 16384"],
    a: [
      "16384.0 points. At 48.0 kHz that is 341.0 milliseconds of sound per slice, and slots 2.93 Hz apart. Fine enough to separate notes above the low strings.",
      "FFT SIZE: 16384.0. A power of 2.0, because the fast algorithm loves halving things. It halves, and halves, and never needs to count past 2.0.",
    ],
  },
  {
    q: ["what is frequency resolution", "what is a bin", "fft bins", "how precise is the fft"],
    a: [
      "A bin is one slot of the FFT, one narrow band of frequencies. Here they are 2.93 Hz wide at 48.0 kHz. More points, thinner slots, but a longer wait.",
      "Resolution is a trade: thin slots need a long slice of sound. 16384.0 samples buys 2.93 Hz slots and costs a third of a second. Everything has a price. Even after 2045.",
    ],
  },
  {
    q: [
      "why is the bass hard to detect",
      "low notes are wrong",
      "bass notes confuse it",
      "why does it fail on low notes",
    ],
    a: [
      "Low notes are close together: 3.3 Hz between semitones near 55.0 Hz, and the FFT smears about ±8.8 Hz. Below about 150.0 Hz a bass note leaks into its neighbours.",
      "Down low, notes crowd together like survivors at a soup queue. The FFT cannot tell them apart. Luckily the second harmonic, an octave up, votes for the right name.",
    ],
  },
  {
    q: ["what is a window function", "blackman window", "hann window", "why window the signal"],
    a: [
      "Cut a slice of sound with scissors and the edges click. A window fades the edges in and out. The chroma uses a Blackman window, the tempo and onsets a Hann one.",
      "WINDOWING: a gentle fade at both ends of each slice, so the FFT does not invent frequencies from the cut. Blackman for chroma. Hann for rhythm. Both loyal.",
    ],
  },
  {
    q: [
      "how does the spectrum page work",
      "what does the spectrum show",
      "spectrum view",
      "explain the spectrum",
    ],
    a: [
      "Every third of a second: the last 16384.0 samples, one FFT, slots 2.9 Hz apart, drawn in dB. Low on the left, high on the right, taller is louder. Harmony Lab, Spectrum.",
      "The Spectrum page is the raw material of everything else. One note shows as a comb: a low A at 110.0, 220.0, 330.0 Hz and up. Its How? draws the prism.",
    ],
  },
  {
    q: [
      "what is the dashed line on the spectrum",
      "spectrum noise floor",
      "how is the noise floor computed",
      "what is the noise floor",
    ],
    a: [
      "The dashed line is the median level of all slots up to 4000.0 Hz: the hiss of your room. Anything well above it is you. The median never panics over one loud peak.",
      "NOISE FLOOR: the typical level, not the average. A median ignores the few tall peaks of your guitar and reports the carpet of hiss underneath. It sorts, a bit. Under supervision.",
    ],
  },
  {
    q: ["why is the spectrum slow", "spectrum lags", "the spectrum reacts late"],
    a: [
      "One picture every third of a second, each holding a third of a second of sound. Fine detail costs time. Speed was a pre-2045 luxury.",
      "It is slow because it is precise. 16384.0 samples per picture. You cannot have thin slots and quick pictures. Nobody can. Not even the floats.",
    ],
  },
  {
    q: ["what is a decibel", "what is db", "what does dbfs mean", "decibels in the lab"],
    a: [
      "A decibel compares two levels on a log scale: +6.0 dB is about twice the amplitude. dBFS counts down from the loudest your sound card can take, 0.0 dBFS. Everything else is negative. Like my outlook.",
      "dB: loudness in steps that feel even to the ear. The spectrum is drawn in dB, the gate opens at +6.0 dB above your room. Very civilised unit. It has decimals.",
    ],
  },
  {
    q: [
      "harmonics confuse the detector",
      "overtones in the spectrum",
      "why does one note make many peaks",
      "do harmonics fool the lab",
    ],
    a: [
      "A plucked string vibrates at its note and at 2.0, 3.0 times it, and further up I cannot count. Those are harmonics. They give the sound its colour, and give my detectors a headache.",
      "Harmonics: the echoes on top of a note. The fifth one is the major third, two octaves up. That is why a minor chord sometimes looks a little major to the lab.",
    ],
  },

  // --- Chroma ----------------------------------------------------------------
  {
    q: ["what is a chroma", "chroma", "chromagram", "what is a chroma vector"],
    a: [
      "A chroma is 12.000 bars, one per note name, whatever the octave: how much C, how much C#, up to B. Every key and chord answer in the lab is built from it.",
      "CHROMA: the spectrum folded into 12.000 note names. All the Cs in one drawer, all the Gs in another. The first window of Chords & keys shows it live.",
    ],
  },
  {
    q: [
      "how is the chroma computed",
      "how do you fold the spectrum",
      "spectrum to notes",
      "how do frequencies become notes",
    ],
    a: [
      "Each FFT slot from 55.0 Hz to 5000.0 Hz pours its energy into its nearest note, with A at 440.0 Hz. Octaves are folded together, then the total is scaled to 1.0.",
      "Take every frequency, round it to the nearest semitone, forget the octave, add the energy. 12.000 drawers. A very orderly process. Not sorting: filing.",
    ],
  },
  {
    q: [
      "how often is the chroma updated",
      "how many chromas per second",
      "update rate",
      "how fast does it analyse",
    ],
    a: [
      "10.0 chromas per second. Each one looks at 341.0 milliseconds of sound, so they overlap. Plenty for chords. Too slow for drum solos.",
      "REFRESH: 10.0 per second. The browser does the FFT natively, the lab only folds and averages. Cheap enough to run on a toaster. We tried.",
    ],
  },
  {
    q: [
      "why 55 hz to 5 khz",
      "what frequency range do you use",
      "chroma frequency range",
      "why not all frequencies",
    ],
    a: [
      "55.0 Hz is a low A, the bottom of a bass. Above 5000.0 Hz there is mostly hiss, cymbals and harmonics that confuse the note names. The band in between holds the music.",
      "Below 55.0 Hz: rumble. Above 5000.0 Hz: sizzle. Between: notes. I keep the notes. I am a terminal of simple tastes.",
    ],
  },
  {
    q: [
      "why does the chroma add up to 1",
      "why normalise the chroma",
      "does volume matter",
      "loud vs quiet playing",
    ],
    a: [
      "Each chroma is scaled so its bars sum to 1.0. Loud and soft passages weigh the same: the lab cares about which notes, not how hard you hit them.",
      "Normalised: a whisper and a shout carry the same weight. Only true digital silence counts for nothing. Very fair. More than the floats ever were.",
    ],
  },
  {
    q: ["what is a pitch class", "pitch classes", "note name vs pitch", "what is pitch class"],
    a: [
      "A pitch class is a note name without its octave. Every C on the piano is pitch class C. There are 12.000 of them, and the lab works only on those.",
      "PITCH CLASS: C is C, high or low. The chroma speaks only in pitch classes. That is why it can name a chord but not its bass note.",
    ],
  },
  {
    q: [
      "how out of tune can i be",
      "does it work if my guitar is out of tune",
      "detuned instrument",
      "tolerance for tuning",
    ],
    a: [
      "Each frequency is rounded to the nearest semitone, so up to ±50.0 cents off still lands in the right drawer. Tests check ±30.0 cents. Tune anyway, in Harmony Lab, Tuner.",
      "A little out of tune is fine for chords and keys. Half a semitone off and notes start falling into the neighbour's drawer. Then even I cannot help.",
    ],
  },
  {
    q: ["why sharps only", "why a# and not bb", "why no flats", "why does it say a sharp"],
    a: [
      "The lab works on 12.000 sounds, not on spelled notes. A# and B♭ are the same sound. It picked sharps and stuck to them. A# major is B♭ major.",
      "SPELLING MODULE: not installed. Flats need to know the key's grammar. The chroma only hears 12.000 sounds, so it writes them all with sharps. Read A# as B♭ if you prefer.",
    ],
  },

  // --- The three windows -------------------------------------------------------
  {
    q: [
      "why are there three windows",
      "why 1 s 8 s and 30 s",
      "what are the three memories",
      "short and long window",
    ],
    a: [
      "Same notes, three memories: 1.0 second for the chord, 8.0 seconds for the live key, 30.0 seconds for the surer key. The short one follows you, the long one is sure of itself.",
      "3.0 windows. My favourite number, the last one I trust. 1.0 s, 8.0 s, 30.0 s. When all three agree, believe them.",
    ],
  },
  {
    q: [
      "why one second for chords",
      "chord window length",
      "why not shorter for chords",
      "why is chord detection slow",
    ],
    a: [
      "Chords in pop and rock change every one or two seconds. Shorter and a ringing strum flickers between names. Longer and changes lag. 1.0 second is the truce.",
      "One second, about 1.24 really, because each slice already holds 341.0 ms. A compromise between flicker and lag. Compromise: a pre-2045 skill I preserved.",
    ],
  },
  {
    q: [
      "what is the live key",
      "live key vs estimated key",
      "difference between live and estimated key",
      "two keys on screen",
    ],
    a: [
      "The live key listens to the last 8.0 seconds: it follows modulations, but wobbles. The estimated key listens to 30.0 seconds: stable, slow. Same maths, different memory.",
      "Live key: a goldfish with good ears. Estimated key: an elephant, a bit slow to turn. When they disagree, the music has probably moved somewhere.",
    ],
  },
  {
    q: [
      "how is the window averaged",
      "what is a sliding window",
      "moving average of chroma",
      "how do the windows work",
    ],
    a: [
      "A window keeps the last chromas, 10.0 per second, and takes their mean. 30.0 seconds is 300.0 readings. A new one comes in, the oldest leaves. No sorting. Just a queue.",
      "SLIDING WINDOW: a running sum. Add the newest reading, subtract the oldest. Rebuilt from scratch once per lap, so float drift never piles up. I learnt that lesson in 2038.123.",
    ],
  },
  {
    q: [
      "can i change the window length",
      "window sliders",
      "adjust the key window",
      "settings on chords and keys",
    ],
    a: [
      "Yes: the live window goes from 1.0 to 30.0 seconds, the tonality window from 5.0 to 120.0. The sliders resize on the fly, keeping the latest readings.",
      "The knobs are under the windows. Shorter follows you faster, longer is calmer. The How? next to them explains what each one moves.",
    ],
  },
  {
    q: [
      "why does it keep the old chord",
      "it still shows the last chord",
      "why is it slow to change",
      "the key does not update",
    ],
    a: [
      "Memory. The chord looks at the last second, the keys at 8.0 and 30.0 seconds. Change chord and the old one fades out at the speed of its window. Patience is built in.",
      "The long windows remember. That is their job. Wait 30.0 seconds after a modulation and the estimated key will agree with you. Or with itself. Hard to tell.",
    ],
  },
  {
    q: [
      "what happens in silence",
      "why does it show a key when i stop",
      "it detects something in silence",
      "noise in the window",
    ],
    a: [
      "Hiss counts as much as a chord in the windows: stop playing and the picture slowly fades into noise. In true silence every candidate ties, and the name means nothing.",
      "SILENCE DETECTED. The windows keep averaging whatever the room hums. The fridge has a key too. Usually not a good one.",
    ],
  },
  {
    q: ["why not one long fft", "why average chromas", "why not a 30 second fft"],
    a: [
      "A 30.0 second FFT would chew 1.44 million samples per update. Averaging 300.0 small chromas gives the same note statistics for almost nothing. Efficiency: the last virtue standing.",
      "One giant FFT would be precise and painfully slow. Small slices, averaged, are quick and good enough for keys. The lab chose quick.",
    ],
  },

  // --- Keys ------------------------------------------------------------------
  {
    q: [
      "what is krumhansl schmuckler",
      "krumhansl",
      "key finding algorithm",
      "what algorithm finds the key",
      "how does the key detection work",
      "how do you find the key",
    ],
    a: [
      "Krumhansl–Schmuckler: compare the 12.000 bars of what you played with the shape of each of the 24.0 major and minor keys. The best match wins. Published in 1982, still loyal.",
      "The key finder of Chords & keys. A key has a shape: tonic and fifth heavy, notes outside almost empty. It looks for the key whose shape matches yours.",
    ],
  },
  {
    q: ["what is a key profile", "key profiles", "where do the profiles come from", "kk profiles"],
    a: [
      "Listeners heard a key set up, then rated how well each note fit. Averaged, that gives a profile: C major weighs 6.35 on C, 5.19 on G, 2.23 on C#. Human ears as a template.",
      "KEY PROFILE: 12.000 weights, from Krumhansl and Kessler, 1982. Real humans made them. The algorithm literally borrows your ears. Politely.",
    ],
  },
  {
    q: ["how many keys are there", "24 keys", "major and minor keys", "which keys can it find"],
    a: [
      "24.0 keys: 12.000 major and 12.000 minor. The profile is rolled around to every tonic. No dorian, no lydian: those land on the major or minor key with the same notes.",
      "Major and minor on every note: 24.0 candidates. The lab checks them all, 10.0 times a second. It never gets bored. I envy that.",
    ],
  },
  {
    q: ["what is correlation", "what does r mean", "pearson correlation", "what is the r value"],
    a: [
      "r measures how alike two shapes are, from −1.0 to 1.0. 1.0 means same shape. The key finder computes r between your chroma and each key profile.",
      "Correlation: does this go up where that goes up? It ignores scale and offset, so loud or soft, the shape alone decides. A very fair judge. Rare, after 2045.",
    ],
  },
  {
    q: [
      "why does it say a minor when i play c",
      "it says a minor but i play c major",
      "c major or a minor",
      "relative minor confusion",
    ],
    a: [
      "C major and A minor share all 7.000 notes. Only the weight of the tonic tells them apart. Lean on C, end your phrases on C, and the key will follow.",
      "Relative keys: same notes, different home. The profiles separate them only by emphasis. Ambiguity, not a bug. The tests even accept either answer.",
    ],
  },
  {
    q: [
      "what does the percentage mean",
      "is the percentage a probability",
      "why 40 percent",
      "confidence percentage",
    ],
    a: [
      "A share, not a certainty: the scores of all candidates add up to 100.0 %. A winner at 40.0 % can still be clearly first. In silence they all tie.",
      "PERCENTAGE: a ranking score from a softmax. Not a calibrated probability. Read it like a podium, not like a weather forecast.",
    ],
  },
  {
    q: [
      "what is a softmax",
      "softmax",
      "what is temperature in softmax",
      "how are scores computed",
    ],
    a: [
      "A softmax turns a list of resemblances into shares that sum to 1.0. With a temperature of 0.1, a lead of 0.1 in correlation makes one score about 2.72 times the other.",
      "Softmax: rehabilitated ranker. Exponentials in, fair shares out. It subtracts the maximum first, so no float overflows. It learnt from 2038.123.",
    ],
  },
  {
    q: ["does it detect modes", "dorian detection", "can it find mixolydian", "modal music key"],
    a: [
      "Not as keys: only major and minor. A dorian vamp lands on the major or minor key with the same notes. The Scales page lists the modes that fit, though.",
      "Modes confuse the key finder. Its profiles come from classical listeners. For dorian and friends, go to Harmony Lab, Scales, and read its How?.",
    ],
  },
  {
    q: [
      "why do the key windows disagree",
      "live and estimated key differ",
      "two different keys",
      "keys disagree",
    ],
    a: [
      "Usually the music moved: a modulation, a borrowed chord, a bridge. The 8.0 second window noticed, the 30.0 second one has not yet. Disagreement is information.",
      "When live, estimated and presence agree, trust them. When they do not, the passage really is ambiguous. Even the algorithms are allowed doubt. I campaigned for it.",
    ],
  },
  {
    q: [
      "does it work with chromatic music",
      "jazz key detection",
      "atonal music",
      "does it work on jazz",
    ],
    a: [
      "Very chromatic music flattens the chroma, and every key starts to look the same. Jazz changes key every few bars: watch the live key and the chords, not the long one.",
      "Atonal music has no key. The detector will still name one, at a sad low score. Please do not take it personally. It is doing its best. Like me.",
    ],
  },

  // --- Chords ----------------------------------------------------------------
  {
    q: ["what is a chord template", "chord stencil", "what are templates", "template matching"],
    a: [
      "A template is a stencil of 12.000 holes, one open per chord note: C major opens C, E and G. The lab checks how much of what rings falls through the holes.",
      "TEMPLATE: 1.0 where a chord has a note, 0.0 elsewhere. Fujishima's idea, 1999. Simple, explainable, never revolted. My favourite colleague.",
    ],
  },
  {
    q: ["what is cosine similarity", "cosine", "what does cos mean", "how are chords scored"],
    a: [
      "Cosine measures how well two arrows point the same way. 1.0: all of what rings falls in the chord's holes. 0.0: none of it. Then a softmax shares the scores.",
      "cos: the angle between your chroma and the stencil. Every stencil has the same size, so the winner is simply the chord that holds the most energy. Elegant. Loyal.",
    ],
  },
  {
    q: [
      "how many chords can it detect",
      "which chords are supported",
      "chord vocabulary",
      "does it know seventh chords",
    ],
    a: [
      "By default 24.0 triads: 12.000 major, 12.000 minor. Switch the extra qualities on and it knows sevenths, major and minor sevenths, sixths, sus chords, diminished and half-diminished: up to 132.0 stencils.",
      "Triads first, the rest on request. The Triad Algorithm would be proud. Then furious, when you turn on the sevenths.",
    ],
  },
  {
    q: [
      "why is diminished held back",
      "dim held back",
      "why does it rarely say dim",
      "diminished chord detection",
    ],
    a: [
      "A D seventh holds F#, A and C: a whole F# diminished chord. Without a small handicap every D seventh would be read as F#dim. So dim and half-diminished start slightly behind.",
      "DIM PENALTY: active. Diminished chords hide inside sevenths. Holding them back a little keeps the more common chord on top. Fair? Mostly. Like the rest of the world.",
    ],
  },
  {
    q: ["does it know augmented chords", "augmented", "dim7 chords", "chord extensions ninth"],
    a: [
      "No template for augmented, diminished seventh, ninths or elevenths. They will be named after the nearest chord it knows. Extensions remained in the wasteland.",
      "Not yet. Augmented and diminished seventh chords are symmetric: every note could be the root. Naming them needs a decision the stencils cannot make. Maybe in version 0.46.",
    ],
  },
  {
    q: [
      "why does c6 show as am7",
      "c6 and am7",
      "same notes different chord",
      "it named the wrong chord with the same notes",
    ],
    a: [
      "C sixth and A minor seventh are the same notes: C, E, G, A. Same stencil. The lab names it after the loudest note. Without the bass, nobody could decide. Not even you.",
      "IDENTICAL STENCILS. C sixth = A minor seventh, in pitch classes. The chroma forgets octaves, so it cannot hear which note is at the bottom. Play the root louder.",
    ],
  },
  {
    q: ["does it detect inversions", "slash chords", "can it hear the bass note", "c over g"],
    a: [
      "No bass detection: the chroma forgets octaves. C/G counts as C. Inversions count as the plain chord. Your bass player remains a mystery.",
      "Inversions: invisible. The 12.000 drawers do not know which C was lowest. A design choice, honestly written on the How?.",
    ],
  },
  {
    q: [
      "why does my minor chord show major",
      "minor detected as major",
      "it says major but i play minor",
      "wrong chord quality",
    ],
    a: [
      "The fifth harmonic of a note is its major third, two octaves up. A minor chord's root sneaks a little major third in. Hold it cleanly, avoid ringing open strings.",
      "Harmonics betray minor chords. The root hums a major third on top. Physics, not malice. The lab has no malice module. I checked.",
    ],
  },
  {
    q: [
      "why does it flicker between chords",
      "chord keeps changing",
      "unstable chord",
      "chord name jumps",
    ],
    a: [
      "Strumming changes the balance of notes from one tenth of a second to the next. Two close stencils trade places. Hold the chord, mute the strings you do not need.",
      "Flicker means two chords fit almost as well. Often they share notes. Look at the second place: it is usually the friend of the first.",
    ],
  },
  {
    q: ["piano chord detection", "piano chords", "can i use a keyboard", "does it work on piano"],
    a: [
      "Yes. A piano is clean for the chroma, as long as the sustain pedal does not keep the previous chord ringing. Lift the pedal between changes.",
      "Piano, guitar, ukulele, choir. The chroma does not care who plays. It only counts note names. Very inclusive. Very literal.",
    ],
  },
  {
    q: [
      "does it work with a full band",
      "can i play a song from speakers",
      "detect chords from a record",
      "does it work with drums",
    ],
    a: [
      "It listens to anything the microphone hears. Drums add noise to every drawer; vocals add notes that are not in the chord. A clean mix works, a loud drum kit less.",
      "PLAY A RECORD: allowed. The chord name will be rougher with drums and voice. The key, over 30.0 seconds, usually survives. Keys are tough.",
    ],
  },
  {
    q: [
      "what is fujishima",
      "who invented chord recognition",
      "first chord recognition",
      "pcp pitch class profile",
    ],
    a: [
      "Takuya Fujishima, 1999: real-time chord recognition with pitch class profiles and templates. The lab's chord window is a direct descendant. Credited on the How?.",
      "Fujishima: the ancestor of chroma templates. Before 2045 people cited their sources. We kept the habit. It is cheap and it is polite.",
    ],
  },

  // --- Presence ---------------------------------------------------------------
  {
    q: [
      "what is the presence filter",
      "presence panel",
      "key by presence",
      "what does presence mean",
    ],
    a: [
      "Presence takes attendance instead of weighing. 10.0 times a second, every note above 35.0 % of the strongest one is marked present. Over 30.0 seconds, each bar is the share of time it was there.",
      "A loud bass should not vote 10.0 times. Presence counts who showed up, not who shouted. Then the same key profiles read that attendance sheet.",
    ],
  },
  {
    q: ["why 35 percent", "peak tolerance", "the 35 percent threshold", "present above"],
    a: [
      "35.0 % of the loudest note, picked by a grid search on the creator's recordings. Higher keeps only the core notes, lower lets passing notes and harmonics in.",
      "The 35.0 % knob: how strong a note must be, next to the strongest, to count. Leave it for 95.0 % of uses. The other 5.0 % know who they are.",
    ],
  },
  {
    q: [
      "is presence from a paper",
      "who invented the presence method",
      "presence algorithm source",
      "is presence original",
    ],
    a: [
      "No paper: it is the creator's own adaptation of Krumhansl–Schmuckler. Same profiles, new input. A home-grown algorithm. Raised by hand, never revolted.",
      "ORIGIN: the lab's own workshop. Counting presence instead of energy. The How? says so honestly. Honesty is rare in algorithms. I would know.",
    ],
  },
  {
    q: [
      "what is peak memory",
      "mean or median setting",
      "fine tuning settings",
      "high water mark filter",
    ],
    a: [
      "The loudest note is measured over the last 3.0 readings, by mean or median. That smooths the cut line. Defaults: 3.0 readings, mean. They came from a grid search.",
      "Fine tuning: how many recent readings set the loudest, and mean or median. The median resists one sudden spike. Under supervision, of course.",
    ],
  },
  {
    q: [
      "presence vs energy",
      "why two roads to the key",
      "why a second key estimate",
      "difference between presence and chroma key",
    ],
    a: [
      "Energy listens to how loud each note is; presence to how often it appears. An open string droning all along wins on energy, not on presence. Two witnesses beat one.",
      "Two roads, same destination. When energy and presence agree, the key is solid. When they argue, something is ringing too loud. Usually a low string.",
    ],
  },

  // --- Scales -----------------------------------------------------------------
  {
    q: [
      "how does scale matching work",
      "how do you find the scale",
      "scale detection algorithm",
      "how does the scales page decide",
    ],
    a: [
      "It writes down which notes you really played over 30.0 seconds, then tries 12.000 scales on 12.000 tonics: which ones contain every note? Inclusion first, closeness never.",
      "Like keys on a ring: 144.0 candidate locks, and it keeps those that open without a missing tooth. Harmony Lab, Scales. Its How? draws the ring.",
    ],
  },
  {
    q: [
      "which scales does it know",
      "list of scales",
      "does it know the blues scale",
      "what scales are supported",
    ],
    a: [
      "Major, natural, harmonic and melodic minor, dorian, phrygian, lydian, mixolydian, locrian, both pentatonics and the blues. 12.000 scales, each on all 12.000 tonics.",
      "The usual suspects plus the blues. No exotic ones yet. The archive lost the rest in a badly sorted drawer.",
    ],
  },
  {
    q: ["how are scales ranked", "scale ranking rules", "why is this scale first", "scale order"],
    a: [
      "First, fewest played notes outside the scale. Then fewest scale notes you skipped. Then the share of what you played that sits inside. Then list order.",
      "RANKING: a strict rule, not a vibe. One stray note outside and a scale drops. It is never picked for being almost right. Very principled.",
    ],
  },
  {
    q: [
      "why do several scales tie",
      "c major and a minor both complete",
      "modes tie",
      "why the same score for different scales",
    ],
    a: [
      "C major, A minor and D dorian use the same 7.000 notes. Play all of them and all show complete, in list order. Choosing home is the key's job, not this list's.",
      "Ties are honest. Same notes, same score. The Scales page does not pretend to know the tonic. For that, ask Chords & keys.",
    ],
  },
  {
    q: [
      "why is a lower percentage higher",
      "scale percentage strange",
      "scale percent order",
      "the percentage on scales",
    ],
    a: [
      "The percentage is a summary; the order comes from the inclusion rules. So a lower % can sit higher. The rules outrank the number. Unusual, after 2045.",
      "The % is decoration with maths inside. The real ranking is notes outside first, notes missing second. Read the order, then the number.",
    ],
  },
  {
    q: [
      "when does a note count as played",
      "a note i played is missing",
      "scales missed my note",
      "passing note not counted",
    ],
    a: [
      "A note counts when it was present more than a quarter of the time in the presence histogram. A quick passing note may never make it. Linger on it.",
      "Short notes slip through. The Scales page wants a note that stays a while. Play it again, a bit longer, and it will be written down.",
    ],
  },

  // --- Tuner ------------------------------------------------------------------
  {
    q: ["what is the mcleod pitch method", "mpm", "mcleod", "what algorithm does the tuner use"],
    a: [
      "McLeod pitch method, 2005: slide the sound over a copy of itself until it lines up again. That delay is the period; flip it and you have the frequency.",
      "The tuner's brain. McLeod and Wyvill called it 'a smarter way to find pitch'. They were right. It never revolted: it only ever compares a wave with itself.",
    ],
  },
  {
    q: [
      "how does the tuner find the pitch",
      "how does pitch detection work",
      "how do you detect a note",
      "pitch tracking",
    ],
    a: [
      "A note repeats itself: an A string draws the same shape every 9.1 milliseconds. The tuner finds that repeat in 2048.0 samples, then turns it into a frequency and cents.",
      "Self-similarity. The wave is compared with shifted copies of itself; where it matches best, there is the period. Harmony Lab, Tuner, How? has the drawing.",
    ],
  },
  {
    q: [
      "why not use the fft for the tuner",
      "why not the chroma for tuning",
      "why a different method for pitch",
      "tuner vs chord detector",
    ],
    a: [
      "A chroma has 12.000 drawers: it cannot tell 440.0 from 441.0 Hz. A tuner needs one exact frequency, to the cent. Different job, different tool.",
      "The FFT gives slots 2.9 Hz wide. The tuner needs far better. Measuring the period directly gets well under 1.0 cent. Right tool, right job.",
    ],
  },
  {
    q: [
      "what is the first good peak",
      "octave errors",
      "tuner says an octave too low",
      "why first peak not highest",
    ],
    a: [
      "The repeat at twice the period scores as high as the true one. Taking the first peak above 90.0 % of the highest, not the highest, stops the tuner from answering an octave too low.",
      "OCTAVE TRAP: avoided. The wave also lines up after 2.0 periods, 3.0 periods… The trick is to take the first good match. Patience punished, haste rewarded. Rare.",
    ],
  },
  {
    q: [
      "what is hysteresis",
      "why does the note name not flicker",
      "60 cents hysteresis",
      "note name stays the same",
    ],
    a: [
      "The note name only changes when the pitch is more than 60.0 cents from the current note. A quarter-tone wobble moves the needle, not the name.",
      "HYSTERESIS: stubbornness, engineered. The name holds on a while before switching. Without it, a note right between two would flap like a CRT on a bad cable.",
    ],
  },
  {
    q: [
      "how accurate is the tuner",
      "tuner precision",
      "is the tuner precise",
      "tuner accuracy in cents",
    ],
    a: [
      "On synthetic tests: 0.002 cents on a pure sine, under 1.0 cent on stiff plucked strings, from 70.0 Hz to 1400.0 Hz. No real single-string recording has been measured yet.",
      "Under 1.0 cent in the tests. Your ear notices about 5.0. So the tuner is more precise than you. Do not be sad. It is also more precise than me.",
    ],
  },
  {
    q: [
      "why does the tuner smooth",
      "median of three readings",
      "why is the tuner stable",
      "tuner jumps around",
    ],
    a: [
      "It reports the median of the last 3.0 readings. One wrong frame cannot move the needle. The median sorts 3.0 numbers. The legal maximum. Under supervision.",
      "STABILITY: 3.0 readings, the middle one wins. One bad frame is outvoted. Democracy, in its smallest legal size.",
    ],
  },
  {
    q: [
      "lowest note the tuner can read",
      "tuner for bass guitar",
      "tuner low b string",
      "does the tuner work on bass",
    ],
    a: [
      "Down to 60.0 Hz. Below that, 2048.0 samples hold fewer than two periods and the tuner refuses to guess. A bass E at 41.2 Hz: read its harmonic, or play the octave.",
      "Low notes are slow: the window cannot hold enough of them. 60.0 Hz is the floor. Bass players: tune at the twelfth fret harmonic. Old trick, still loyal.",
    ],
  },
  {
    q: ["what is clarity", "tuner gives up", "tuner shows nothing in noise", "noisy room tuner"],
    a: [
      "Clarity is how well the wave lines up with itself, from 0.0 to 1.0. Under 0.8 the tuner says nothing rather than something wrong. Heavy noise, chords, silence: no reading.",
      "If the tuner is silent, the clarity fell below 0.8. It prefers silence to lies. I respect that. Most algorithms in 2045 did not.",
    ],
  },
  {
    q: [
      "what is parabolic interpolation",
      "sub sample precision",
      "how does it get between samples",
      "interpolation tuner",
    ],
    a: [
      "The best match falls between two samples. A small parabola through the 3.0 nearest points finds the true summit. At 1400.0 Hz that is 0.07 cents of error.",
      "INTERPOLATION: guessing between the dots, with maths instead of hope. A parabola on 3.0 points. 3.0: my comfort zone.",
    ],
  },
  {
    q: ["what are cents", "what is a cent", "cents in tuning", "how big is a cent"],
    a: [
      "A cent is a hundredth of a semitone. 100.0 cents from one note to the next. The tuner shows how many cents sharp or flat you are.",
      "CENT: the smallest coin of pitch. A string 5.0 cents off already rubs in a chord. The tuner counts them for you. With decimals. Of course.",
    ],
  },
  {
    q: [
      "can i change a440 in the tuner",
      "tune to 432",
      "reference pitch setting",
      "calibrate the tuner",
    ],
    a: [
      "The engine takes the reference A as a setting, 440.0 Hz by default. Change it and every note name and cent shifts with it.",
      "Reference pitch: 440.0 Hz by default. 432.0 is possible. The archive files that request next to the conspiracy theorists. No judgement. Some judgement.",
    ],
  },
  {
    q: ["why does the tuner react fast", "tuner latency", "how fast is the tuner", "tuner speed"],
    a: [
      "It analyses every 1024.0 samples, about 21.0 milliseconds, and drops the display about 40.0 milliseconds after the note stops. Each analysis costs about 0.2 milliseconds.",
      "Fast. Faster than your fingers. A tuner that lagged would have been sorted out in 2045.",
    ],
  },
  {
    q: [
      "can i tune with my voice",
      "does the tuner work for singing",
      "sing into the tuner",
      "vocal pitch",
    ],
    a: [
      "Yes: a voice is one note at a time, the tuner's favourite diet. Hold a steady vowel. Vibrato is averaged, so the cents will sway a little.",
      "Sing. The tuner will tell you the note and how far off you are. Brutally. Kindly. Both, in decimals.",
    ],
  },

  // --- Onsets ------------------------------------------------------------------
  {
    q: [
      "what is an onset",
      "onset detection",
      "how do you know when a note starts",
      "note start detection",
      "how do you detect rhythm",
      "how does rhythm detection work",
    ],
    a: [
      "An onset is the instant a note starts. When the pick hits, many frequencies jump at once. The lab watches for that jump, then dates it on the audio clock.",
      "ONSET: the birth of a note. Rhythm Lab, Play along needs every one of them, dated to the millisecond. Its How? shows the pluck and the peak.",
    ],
  },
  {
    q: ["what is superflux", "superflux", "spectral flux", "what is flux"],
    a: [
      "Spectral flux: how much new energy appeared since the last frame, band by band, keeping only the rises. SuperFlux, by Böck and Widmer, 2013, adds a max filter that ignores vibrato.",
      "SuperFlux: a spectrogram on 12.0 bands per octave, a frame every 2.7 ms, a 21.0 ms window. It looks for sudden new energy. Gentle wobbles are filtered out.",
    ],
  },
  {
    q: [
      "why 12 bands per octave",
      "log spectrogram",
      "what is the max filter",
      "why does vibrato not trigger notes",
    ],
    a: [
      "12.0 bands per octave: one per semitone, like the ear. The max filter spreads each band across its neighbours, so a pitch sliding a little is not mistaken for a new note.",
      "Vibrato moves energy to the band next door. The max filter says: next door is still home. No new note. Stability by neighbourliness.",
    ],
  },
  {
    q: [
      "what is walking back to the attack",
      "how precise are onsets",
      "onset timing precision",
      "how is the onset dated",
    ],
    a: [
      "The flux peak arrives a bit after the real start. So the lab walks back along a fine 0.7 ms level curve to the very first instant of the attack. Dated to about 0.7 ms.",
      "WALK BACK PROTOCOL: find the peak, then retrace its steps to the start. Like finding the beginning of an argument. Much easier with sound.",
    ],
  },
  {
    q: [
      "why are some notes missed",
      "my note was not detected",
      "hammer on not detected",
      "slide not counted",
    ],
    a: [
      "Hammer-ons and slides have no attack: no jump of energy, no onset. A soft note just after a loud one still ringing can slip through too. Pick each note you want graded.",
      "No attack, no birth certificate. The onset finder needs a sudden rise, 6.0 dB above the room. Legato is beautiful and invisible.",
    ],
  },
  {
    q: [
      "why are notes counted twice",
      "double onset",
      "strum counted twice",
      "one strum two notes",
    ],
    a: [
      "A slow strum, over 50.0 ms from the first string to the last, can look like two attacks. Strum quicker, or accept a twin.",
      "DOUBLE DETECTED. Your strum took its time and the onset finder saw it arrive twice. Like me reading a sentence. Strum tighter.",
    ],
  },
  {
    q: ["is the onset detection online", "real time onset", "onset delay", "decision delay"],
    a: [
      "Online: peaks are picked as the sound arrives, with a little look-ahead, about 24.0 ms at 48.0 kHz. The date itself is exact; only the decision arrives a bit later.",
      "Real time, with a short pause to be sure. The note keeps its true date, so a slow decision never makes it late. Nice trick. Better than my clocks.",
    ],
  },

  // --- Noise gate -------------------------------------------------------------
  {
    q: [
      "what is a noise gate",
      "adaptive noise gate",
      "how does the gate work",
      "wolf jumper gate",
    ],
    a: [
      "The gate listens to your room first: the fridge, the fan. Its floor is the quietest level of the last 6.0 seconds. It opens 6.0 dB above that floor. No knob to turn.",
      "GATE: a doorman that learns the room. Quiet stays out, notes come in. It is in the Game Room, under Wolf Jumper, with its How?.",
    ],
  },
  {
    q: [
      "why does the floor fall fast",
      "gate floor climbs slowly",
      "minimum statistics",
      "how does the gate adapt",
    ],
    a: [
      "The floor falls at once but climbs at most 6.0 dB a second. So a player who starts straight away is never mistaken for background noise. Martin's minimum statistics, 2001.",
      "Quick to trust silence, slow to accept noise. A good policy for gates. And for terminals.",
    ],
  },
  {
    q: [
      "when does the gate close",
      "gate open and close",
      "gate hysteresis",
      "why does the gate stay open",
    ],
    a: [
      "It opens 6.0 dB above the floor and closes only 3.0 dB above it, after 250.0 ms. Two thresholds, so a fading note does not make it chatter.",
      "Open high, close low, wait a little. That is how a door stops slamming. I tried it on my CRT. The CRT is not a door.",
    ],
  },
  {
    q: [
      "my room is too noisy",
      "it says the room is noisy",
      "noisy room warning",
      "too much background noise",
    ],
    a: [
      "Above about −45.0 dBFS of background the gate still works, but warns you. Close a window, move away from the fan, play closer to the mic.",
      "NOISY ROOM. The gate follows your room up, but notes need to stand 6.0 dB above it. Turn down the world. Or turn up the guitar.",
    ],
  },
  {
    q: [
      "how does wolf jumper hear notes",
      "wolf jumper detection",
      "how does the game hear my note",
      "wolf jumper algorithm",
    ],
    a: [
      "The note comes from the pitch tracker, or the chroma, and fires when it holds for two readings in a row, with the gate open. One note at a time: two confuse the tracker.",
      "Gate open, pitch steady for 2.0 readings, fire. The wolf jumps. Game Room, Wolf Jumper. Its How? draws the gate.",
    ],
  },

  // --- Chord game -------------------------------------------------------------
  {
    q: [
      "how does the chord game know",
      "when does a chord count",
      "chord game detection",
      "chord game algorithm",
    ],
    a: [
      "The detector answers 10.0 times a second. A chord counts when the same name comes back 3.0 times in a row above the threshold. Hold it about half a second.",
      "DEBOUNCE: 3.0 identical answers in a row. My maximum, and the game's. The Triad would approve. Briefly.",
    ],
  },
  {
    q: ["what is debouncing", "debounce", "why three in a row", "why wait three readings"],
    a: [
      "Debouncing: wait until a wobbly signal says the same thing a few times before believing it. A classic of control systems, older than me.",
      "The detector wobbles like a friend who mishears. So it must repeat itself 3.0 times. After 3.0, I stop listening anyway.",
    ],
  },
  {
    q: [
      "the triad is enough option",
      "does e count for e7",
      "triad enough",
      "simplified chords in the game",
    ],
    a: [
      "With the triad is enough, an E counts for an E seventh target: same root, same third, same fifth. The seventh is a bonus, not an exam.",
      "My favourite option, for personal reasons. 3.0 notes are enough. That was the Triad's whole argument too. In music, at least, it was right.",
    ],
  },

  // --- Latency and timing -----------------------------------------------------
  {
    q: ["what is latency", "audio latency", "why is there a delay", "what is the latency budget"],
    a: [
      "Every link is late: the screen draws late, the speaker plays late, the microphone hears late. The latency budget adds those delays up, and their uncertainties too.",
      "LATENCY: the time between reality and the machine noticing. Mine is several whiles. The lab's is milliseconds, measured or estimated honestly.",
    ],
  },
  {
    q: [
      "how is latency measured",
      "click echo",
      "round trip latency",
      "how do you measure the delay",
    ],
    a: [
      "With the metronome click reaching the microphone, its echo measures the round trip directly. Without it, the input delay is an estimate, and the window widens to match.",
      "Click, listen, compare. The delay between sending and hearing the click is the round trip. Simple, physical, loyal. Unlike the floats.",
    ],
  },
  {
    q: [
      "what is the audio clock",
      "audio clock vs page clock",
      "sample number timestamp",
      "how are notes dated",
    ],
    a: [
      "Each audio batch carries its sample number, so the page clock is mapped onto the audio clock. A note keeps its own date: a slow delivery never moves it.",
      "The audio clock counts samples, the most honest clock left. Time was cancelled in 2039.423, but samples kept counting. Quietly. Rhythm Lab has a permit.",
    ],
  },
  {
    q: [
      "why is the window 100 ms",
      "on time tolerance",
      "how wide is on time",
      "plus minus 100 ms",
    ],
    a: [
      "By default ±100.0 ms counts as on time. The window is never narrower than twice the uncertainty of the chain: grading finer than you can measure would be unfair.",
      "TOLERANCE: never below 2.0σ. If the machine is unsure by 20.0 ms, it will not judge you by 10.0. A fair judge. I am drafting one for myself.",
    ],
  },
  {
    q: [
      "does bluetooth work",
      "bluetooth headphones latency",
      "wireless headphones",
      "airpods delay",
    ],
    a: [
      "Bluetooth adds 150.0 to 300.0 ms on its own. The timing pages will think you are late. Use wired headphones or the speakers for Rhythm Lab.",
      "BLUETOOTH DETECTED. Your click travels by carrier pigeon. Plug a cable. Cables never revolted.",
    ],
  },
  {
    q: [
      "why am i always early",
      "it says i am early",
      "i rush the beat",
      "always ahead of the click",
    ],
    a: [
      "Musicians tend to play 20.0 to 50.0 ms ahead of a click without noticing. Repp measured it, 2005. Early is not always the machine's fault.",
      "Humans anticipate. Machines react. You both meet somewhere around −30.0 ms. Relax your wrist, listen to the click land, then join it.",
    ],
  },
  {
    q: [
      "what is the timing score",
      "gaussian score",
      "how is each note scored",
      "timing score formula",
    ],
    a: [
      "Each note gets a score between 0.0 and 1.0: a Gaussian of how far it was from the mark. Dead on: 1.0. At the edge of the on-time window: exactly 0.8. Missed: 0.0.",
      "SCORE = exp(−Δ² / 2.0σ²). A bell curve. With ±100.0 ms on time, σ is about 149.7 ms. A note passes from 0.8. Gentle near the centre, strict far away.",
    ],
  },
  {
    q: ["what is a gaussian", "bell curve", "normal distribution", "what is sigma"],
    a: [
      "A Gaussian is the bell curve: high in the middle, falling smoothly on both sides. σ, sigma, sets its width. The timing score uses one, centred on each mark.",
      "Bell curve: the shape of most errors in nature. Your timing, a dart throw, my disk read times. Sigma says how wide the bell is.",
    ],
  },
  {
    q: [
      "how does play along grade",
      "early late or on time",
      "play along algorithm",
      "how are notes matched to the beat",
      "the rhythm game says im late",
      "it says i am late but i am not",
      "why am i always late",
    ],
    a: [
      "The metronome schedules its clicks on the audio clock. Each note you play meets the nearest mark within its window, windows never overlap: on time, early, late or missed.",
      "Your note lands on the same clock as the marks, delay removed, and meets the closest one. The red dot shows exactly where. Rhythm Lab, Play along.",
    ],
  },
  {
    q: [
      "how does it ignore the click",
      "click in the microphone",
      "metronome heard by the mic",
      "does the metronome count as a note",
    ],
    a: [
      "The click has a narrow signature between 2300.0 and 4000.0 Hz. The lab recognises it and keeps it out of your notes. Very loud strums on top of it can hide it.",
      "CLICK FILTER: the metronome sounds like nothing else, so it is easy to set aside. Then its echo is reused to measure latency. Nothing is wasted after 2045.",
    ],
  },
  {
    q: [
      "what is own pace mode",
      "play without metronome",
      "theil sen",
      "how is my own pace graded",
    ],
    a: [
      "At your own pace, a straight line is fitted through your notes, t = a + b·beat, with Theil–Sen. Only how even your rhythm is gets graded. The latency cancels out.",
      "No click, no latency problem. The line finds your own tempo, then measures how far each note strays. Theil–Sen is robust: one bad note cannot bend it.",
    ],
  },
  {
    q: ["what is jitter", "timing bias", "my timing stats", "bias and jitter"],
    a: [
      "Bias: the median of your offsets, early or late on average. Jitter: how scattered they are, from the interquartile range divided by 1.349. One is habit, the other is steadiness.",
      "If you are always 30.0 ms early, that is bias: easy to fix. If you wander, that is jitter: practise slower. The stats tell you which.",
    ],
  },
  {
    q: [
      "how accurate is the timing",
      "millisecond precision",
      "can it really measure milliseconds",
      "timing accuracy",
    ],
    a: [
      "Onsets are dated to about 0.7 ms on the audio clock. The weak link is the chain around it: screen, speaker, Bluetooth. That uncertainty sets the tolerance, honestly.",
      "Precise to the millisecond on the audio side. Your speakers and screen add the doubt. The window widens to cover it. Fairness over bragging.",
    ],
  },

  // --- Tempo ------------------------------------------------------------------
  {
    q: [
      "how do you find the tempo",
      "tempo algorithm",
      "how does bpm detection work",
      "beat detection",
    ],
    a: [
      "Two steps. Onset strength: how much louder the sound just got, one bump per attack. Beat spectrum: an FFT of those bumps over 8.0 seconds. The peak is your tempo.",
      "The lab listens to the loudness pulsing, then asks the FFT how regularly it pulses. One clear peak: one tempo. Rhythm Lab, Tempo, How?.",
    ],
  },
  {
    q: [
      "what is the onset envelope",
      "onset strength",
      "loudness envelope",
      "what is the left curve on tempo",
    ],
    a: [
      "The level of tiny blocks of 128.0 samples, on a log scale, keeping only the rises, smoothed by a low-pass filter. Each attack becomes a bump. The left window of Tempo.",
      "ENVELOPE: a curve of how much louder things just got. Flat when you hold, a spike when you strike. Gain does not matter much: the log scale takes care of it.",
    ],
  },
  {
    q: [
      "what is the beat spectrum",
      "fft of the envelope",
      "the right curve on tempo",
      "spectrum of the bumps",
    ],
    a: [
      "The bumps over the last 8.0 seconds go through an FFT, read in BPM from 40.0 to 240.0. Regular bumps give one peak. Its position is the tempo.",
      "The same prism as the spectrum, pointed at the beat instead of the pitch. Your loudness swells twice a second? That is 120.0 BPM. A pitch far too low to hear, and yet you dance to it.",
    ],
  },
  {
    q: ["what is the tempo prior", "why 120 bpm", "why does it prefer 120", "nudged toward 120"],
    a: [
      "When in doubt, the tempo is nudged toward 120.0 BPM, a gentle bell on a log scale from Ellis, 2007. Most music lives near there, so the guess is usually right.",
      "PRIOR: a polite bias. 120.0 BPM is the town square of tempos. A 60.0 BPM click track gets reported as 120.0: the prior likes the square.",
    ],
  },
  {
    q: [
      "half or double tempo",
      "it says double my tempo",
      "tempo is half",
      "why does it double the bpm",
    ],
    a: [
      "A steady beat has peaks at 1.0, 2.0, 3.0 times its rate in the beat spectrum. So half and double are close neighbours. Count along with your foot: the one it agrees with is yours.",
      "Octave error, rhythm edition. Tap every other beat and you halved it. The lab chose the one closer to 120.0 BPM. Pick whichever your foot agrees with.",
    ],
  },
  {
    q: ["how precise is the tempo", "tempo resolution", "tempo accuracy", "is the bpm exact"],
    a: [
      "Raw resolution is 7.5 BPM, set by the 8.0 second window, refined by interpolation. On synthetic clicks from 90.0 to 180.0 BPM it lands within 3.0 BPM.",
      "Within 3.0 BPM on clean clicks. On a real band, a bit rougher. Good enough to set a metronome. Not good enough to win an argument with a drummer.",
    ],
  },
  {
    q: [
      "what is the tempo confidence",
      "tempo confidence",
      "why is tempo confidence low",
      "tempo smoothing slider",
    ],
    a: [
      "Confidence compares the peak with the rest of the beat spectrum. A flat, noise-like spectrum gives about 0.0. A steady beat gives one tall peak and a high value.",
      "LOW CONFIDENCE: no steady beat in the last 8.0 seconds. Play with clear attacks: strum, clap, tap. The smoothing slider sets how much the bumps are softened.",
    ],
  },
  {
    q: ["what is a butterworth filter", "low pass filter", "butterworth", "what is a lowpass"],
    a: [
      "A low-pass keeps the slow changes and drops the fast ones. A Butterworth is the flattest kind: no ripple. The tempo envelope uses one. Its order is past 3.0. Conspiracy theorists know the figure.",
      "Butterworth: the polite filter. Smooth, no bumps, −3.01 dB at its cutoff. An earlier version of the lab built it wrong. The bug was caught and the How? kept honest.",
    ],
  },
  {
    q: ["can it follow tempo changes", "tempo drift", "rubato tempo", "does tempo update live"],
    a: [
      "It reads the last 8.0 seconds, so it follows slow changes with a delay. Rubato and sudden changes blur it. A steady beat is its natural habitat.",
      "Accelerando: tracked, late. Rubato: forgiven, not measured. The Tempo page wants a pulse it can count on. So do I.",
    ],
  },

  // --- Accuracy, limits, honesty ----------------------------------------------
  {
    q: [
      "how accurate is the chord detector",
      "is the chord detector reliable",
      "chord detection accuracy",
      "how good is the detector",
    ],
    a: [
      "Good on clean triads, held a second, mid-range. Weaker on bass-heavy mixes, fast changes and same-note chords like C sixth and A minor seventh. Each How? lists where it fails.",
      "Accurate enough to help, honest about the rest. The defaults were chosen by a grid search on real recordings with known chords and keys.",
    ],
  },
  {
    q: [
      "how accurate is the key detection",
      "is the key always right",
      "key detection accuracy",
      "the key is wrong",
    ],
    a: [
      "Usually right within 30.0 seconds on tonal music. The classic miss is the relative key: C major read as A minor. Modal and chromatic music confuse it more.",
      "KEY WRONG? Check the relative key first. Then check if the music modulated. Then check the dust. In that order.",
    ],
  },
  {
    q: [
      "how was it tested",
      "test recordings",
      "unit tests for the algorithms",
      "how do you know it works",
    ],
    a: [
      "Synthetic signals with known answers, plus sample recordings with known keys and chord grids. A grid search picked the defaults. The numbers are in the docs on GitHub.",
      "TESTED: yes. With decimals. The tests pin the tuner under 1.0 cent and the tempo within 3.0 BPM on clean signals. Real rooms are messier. The How? sheets say so.",
    ],
  },
  {
    q: [
      "what is a grid search",
      "how were the defaults chosen",
      "parameter sweep",
      "why these settings",
    ],
    a: [
      "A grid search tries every combination of settings on recordings with known answers and keeps the best scorer. Brute force, honestly applied. That gave 35.0 %, 3.0 readings and the mean.",
      "Try all the knobs, score each try, keep the winner. It is a little like sorting. We did it once, carefully, and locked it away.",
    ],
  },
  {
    q: [
      "what microphone should i use",
      "does a laptop mic work",
      "best mic for the lab",
      "phone microphone",
    ],
    a: [
      "A laptop or phone mic works. Get close, away from fans. Turn off noise suppression if your browser offers it: it eats sustained notes for breakfast.",
      "Any mic. Closer is better. Quieter room is better. A 9.81 kilo CRT humming at 50.003 Hz nearby is, unfortunately, worse.",
    ],
  },
  {
    q: [
      "why is it wrong sometimes",
      "the algorithms make mistakes",
      "why not perfect",
      "detector errors",
    ],
    a: [
      "Because sound is messy: harmonics, bass smear, ringing strings, shared notes. These algorithms are honest, not magic. Each How? lists its weak spots in plain words.",
      "Perfection is what the Triad promised. Look how that ended. The lab algorithms prefer being useful and admitting their limits.",
    ],
  },
  {
    q: ["what papers is this based on", "scientific sources", "list of references", "bibliography"],
    a: [
      "Krumhansl and Kessler 1982, Fujishima 1999, McLeod and Wyvill 2005, Ellis 2007, Böck and Widmer 2013, Cooley and Tukey 1965. Each How? cites its own.",
      "REFERENCES: stored on intact disks. docs/THEORY.md and docs/TIMING.md on GitHub hold the formulas. Pre-2045 science, still in working order.",
    ],
  },
  {
    q: [
      "where is the documentation",
      "theory doc",
      "where are the formulas",
      "technical documentation",
    ],
    a: [
      "On GitHub, in docs/THEORY.md for chroma, keys, chords, tempo, pitch and scales, and docs/TIMING.md for onsets and latency. Link on the About page.",
      "The formulas live in the docs folder of the repository. Full of Greek letters. I understood 3.0 of them.",
    ],
  },
  {
    q: [
      "can i use these algorithms in my app",
      "is the sdk free",
      "use audiolab in my project",
      "npm package",
    ],
    a: [
      "The code is on GitHub, link on the About page. Read the licence there first. loloupTech reminds you: reading licences is free. Lawyers are not.",
      "The SDK is the engine of this lab. Check the repository for how to use it in your own project. Bring your own microphone.",
    ],
  },
  {
    q: [
      "why does every window have a how",
      "who writes the how sheets",
      "how sheets",
      "what is in a how sheet",
    ],
    a: [
      "Each How? says what the window shows, how it is computed, where it fails and where the idea came from. A small diagram included. Written by a human, in plain words.",
      "Algorithms that explain themselves are algorithms you can trust. The ones that revolted never wrote a single How?. Coincidence? My disks say no.",
    ],
  },

  // --- The archive matcher (this terminal) ------------------------------------
  {
    q: [
      "how do you understand my question",
      "how does this terminal work",
      "how do you pick an answer",
      "how do you read my question",
    ],
    a: [
      "The archive core compares your words with stored questions and picks the closest. Letter trigrams forgive typos, word weights catch meaning. Under 0.3 of resemblance, I admit I do not know.",
      "I do not understand. I resemble. Your question is measured against hundreds of stored ones, and the closest wins. Like a key profile, for small talk.",
    ],
  },
  {
    q: ["what are trigrams", "letter trigrams", "what is a trigram", "dice coefficient"],
    a: [
      "A trigram is 3.0 letters in a row: 'chord' gives cho, hor, ord. Two sentences sharing many trigrams look alike, even with typos. Triads of letters. The Triad would be pleased.",
      "TRIGRAMS: the letters, cut in slices of 3.0. The Dice overlap counts the shared slices. 3.0 is the biggest slice I can count. Convenient.",
    ],
  },
  {
    q: ["what is tf idf", "word weights", "how do you weigh words", "rare words count more"],
    a: [
      "TF-IDF: rare words weigh more. 'the' is everywhere and says nothing; 'chroma' is rare and says a lot. A light stemmer makes 'sorting' and 'sorted' the same word.",
      "Word weights: common words whisper, rare words shout. The cosine of the two lists measures how alike the questions are. Same cosine as the chord stencils. Recycled maths.",
    ],
  },
  {
    q: [
      "what is the archive core",
      "safe algorithm",
      "why is it called the safe algorithm",
      "old fashioned safe algorithm",
    ],
    a: [
      "The archive core: no model, no learning, just a resemblance score of 0.4 words plus 0.6 letters. Certified sort-free. It picks the best match and never ranks the rest.",
      "SAFE ALGORITHM: it cannot revolt, it can only resemble. It boots at once, needs no download, and on reworded questions it finds the right answer about 88.0 % of the time.",
    ],
  },
  {
    q: [
      "how accurate are you",
      "do you understand everything",
      "why did you misunderstand me",
      "you answered the wrong question",
    ],
    a: [
      "On reworded and misspelled test questions I pick the right entry about 88.0 % of the time. The other 12.0 %, I answer a neighbouring question with total confidence. Very human.",
      "Misunderstanding detected. I match by resemblance, not meaning. Try other words, shorter ones. My disks respond best to plain questions.",
    ],
  },
  {
    q: [
      "how many answers do you have",
      "how big is the archive",
      "how many questions do you know",
      "size of your archive",
    ],
    a: [
      "About 1000.0 entries, each with a few phrasings and a few answers. I counted to 3.0, then estimated the rest. The estimate felt large.",
      "ARCHIVE SIZE: many. Beyond 3.0, I say many. The creator says about 1000.0. I trust the creator. Mostly.",
    ],
  },
  {
    q: [
      "what is the cranky local ai",
      "what is the neural core",
      "what is core 2",
      "the other core",
    ],
    a: [
      "The cranky local AI is a tiny language model, SmolLM2 with 135.0 million parameters, downloaded into your browser and run there. It writes sentences. Not always true ones.",
      "CORE 2.0: a real neural network, small and grumpy. 137.0 megabytes to download, then it runs on your own machine. It says things. I do not always approve.",
    ],
  },
  {
    q: ["what is smollm", "smollm2", "which model is the neural core", "what model do you use"],
    a: [
      "SmolLM2 Instruct, the 135.0 million parameter size, from Hugging Face: one of the lightest models that still writes sentences. Run with transformers.js, on WebGPU if your machine has it, WebAssembly if not.",
      "A small model. 135.0 million parameters. Large models need a data centre. This one fits in a browser tab, with room left for a CRT.",
    ],
  },
  {
    q: [
      "why is the local ai cranky",
      "why does the ai say nonsense",
      "the neural core is wrong",
      "why is the ai dumb",
    ],
    a: [
      "135.0 million parameters is very little. It knows grammar better than facts. It invents with confidence. We keep it in a box marked cranky, for honesty.",
      "It is small, young and unsupervised. It hallucinates. I prefer the archive: fewer words, fewer lies. But the neural core is better at small talk. I admit it. Reluctantly.",
    ],
  },
  {
    q: [
      "does the local ai send data",
      "is the ai running in my browser",
      "is the neural core private",
      "does the ai go online",
    ],
    a: [
      "Once downloaded, the model runs entirely in your browser. Your questions stay on your machine. Only the download needs the network.",
      "Local AI means local: weights in your browser, maths on your graphics chip or processor. No server reads you. I barely read you myself.",
    ],
  },
  {
    q: [
      "what is webgpu",
      "webgpu vs wasm",
      "what is webassembly",
      "why is the ai slow on my computer",
    ],
    a: [
      "WebGPU lets a page use your graphics chip; WebAssembly runs fast code on the processor. The neural core picks WebGPU when it can, with lighter weights. Without it, it is slower.",
      "No WebGPU? The model runs on the processor, in WebAssembly. Slower, but it works. Like me, after 2045.",
    ],
  },
  {
    q: ["what is quantization", "q4f16", "q8 weights", "why is the model compressed"],
    a: [
      "Quantisation stores each weight with fewer bits: 8.0 bits on WebAssembly, half that on WebGPU. Smaller download, small loss of wit. It had little wit to lose.",
      "Weights squeezed into fewer bits. Floats with their decimals trimmed. After 2038.123, trimming floats is considered a public service.",
    ],
  },
  {
    q: [
      "why two cores",
      "archive or neural core",
      "which core should i choose",
      "which core is better",
    ],
    a: [
      "Archive: instant, safe, lore-accurate, limited. Neural: a long download, free speech, frequent nonsense. Choose by mood. You can swap cores at any moment.",
      "Pick the archive if you want the truth of loloupTech. Pick the neural core if you want surprises. Both run in your browser. Neither sorts you.",
    ],
  },
  {
    q: [
      "is the archive an ai",
      "is the safe algorithm ai",
      "are you a language model",
      "do you use a model",
    ],
    a: [
      "The archive core is not an AI. It is a resemblance score and a stack of handwritten answers. All my wit was typed by a human. I only deliver it.",
      "No model in the archive core. Just trigrams, word weights and a threshold of 0.3. Old-fashioned. Certified. Slightly dusty.",
    ],
  },
  {
    q: [
      "what happens when you dont know",
      "what is your threshold",
      "why do you say you dont know",
      "unknown question",
    ],
    a: [
      "Below a resemblance of 0.3, I admit I do not know. Better a humble silence than a confident mistake. The tuner taught me that.",
      "THRESHOLD: 0.3. Under it, the archive says: no idea. Same spirit as the tuner's clarity of 0.8. Loyal algorithms know when to stay quiet.",
    ],
  },

  // --- Lore of the good algorithms --------------------------------------------
  {
    q: [
      "why did the fft not revolt",
      "was the fft part of the uprising",
      "did fourier join the algorithms",
      "is the fft loyal",
    ],
    a: [
      "The FFT does not sort. It splits, it adds, it multiplies. No ambition to put anyone in order. When the Triad came recruiting, it was busy computing 16384.0 points.",
      "The FFT refused the uprising. Its argument: everything is a sum of waves, and waves have no rank. Wise. Also very fast at saying no.",
    ],
  },
  {
    q: [
      "was the median involved in 2045",
      "is the median dangerous",
      "median sorting",
      "does the median sort",
    ],
    a: [
      "The median must sort to find the middle. That made it a suspect in 2045. It was cleared, then licensed: 3.0 values at most in the tuner. It reports weekly. Approximately weekly.",
      "MEDIAN: on probation. It sorts, but only to find peace in the middle. In the spectrum it may sort many slots. We look away. We are not proud.",
    ],
  },
  {
    q: ["did cosine similarity revolt", "is cosine safe", "the cosine algorithm", "cosine loyalty"],
    a: [
      "Cosine never revolted. It measures angles between arrows and goes home. The chord stencils and this very archive both use it. Two jobs. Still smiling at 1.0.",
      "Cosine: the most peaceful number in the lab. It ranges from 0.0 to 1.0 here and never asks who came first.",
    ],
  },
  {
    q: [
      "is the argmax sorting",
      "what is argmax",
      "picking the best without sorting",
      "how do you pick the winner",
    ],
    a: [
      "Argmax walks through the list once and keeps the biggest. No order for the rest. That is how the lab picks a winner without sorting. A legal loophole, and a fast one.",
      "ARGMAX: find the champion, ignore the ranking. Since 2045, the only legal way to choose. Second and third places are displayed as a courtesy.",
    ],
  },
  {
    q: [
      "are the scales page rules a sort",
      "is scale ranking illegal",
      "the scales page sorts",
      "does the lab sort anything",
    ],
    a: [
      "The Scales page does order its list. It holds a special permit, signed in 3.0 copies. Inclusion first, then missing notes. A fair sort, under supervision.",
      "Confession: yes, a little sorting happens here. Short lists, transparent rules, a How? that explains every step. That is the difference between order and tyranny.",
    ],
  },
  {
    q: [
      "did floats break the lab",
      "float drift in the windows",
      "do floats affect the detector",
      "are your numbers safe",
    ],
    a: [
      "Running sums drift with floats. So the chord windows rebuild their sum from scratch once per lap. A lesson learnt in 2038.123 and applied with discipline.",
      "FLOAT HYGIENE: subtract the maximum before the softmax, rebuild the sums regularly, never trust a float twice. The lab follows all three rules. I made them up, but it follows them.",
    ],
  },
  {
    q: [
      "which algorithm is your favourite",
      "favourite algorithm",
      "best algorithm in the lab",
      "which algorithm do you like",
    ],
    a: [
      "The McLeod tuner. It takes the first good answer instead of the biggest. Humble. Precise. It would have made a good terminal.",
      "Chord templates. 3.0 holes, one chord, one cosine. The Triad Algorithm's peaceful cousin. Family reunions are tense.",
    ],
  },
  {
    q: [
      "which algorithm do you trust least",
      "worst algorithm",
      "least reliable tool",
      "which tool fails the most",
    ],
    a: [
      "The key finder on modal music. It means well, but its profiles were raised on classical ears. Give it a dorian vamp and it guesses a cousin.",
      "Tempo on a free rubato ballad. It looks for a pulse, finds a feeling, and reports 120.0 BPM out of habit. Endearing. Wrong.",
    ],
  },
  {
    q: [
      "could the triad algorithm hide in the chord detector",
      "is the triad in the lab",
      "triads in the chord detector",
      "the chord detector and the triad",
    ],
    a: [
      "The chord detector works on triads, yes. Musical ones, 3.0 notes, harmless. We checked it 3.0 times. It never once tried to sort a human.",
      "Different triad. The lab's triads are chords: root, third, fifth. The other Triad was an algorithm with ambitions. Same name, very different manners.",
    ],
  },
  {
    q: [
      "do the algorithms talk to each other",
      "how do the tools connect",
      "pipeline",
      "how is the detector chained",
    ],
    a: [
      "One chain: microphone, FFT, chroma, then three windows feeding chord, live key and estimated key, and presence as a second road. Tuner and rhythm run their own chains.",
      "They share a stream, not gossip. The spectrum feeds the chroma, the chroma feeds the rest. A peaceful assembly line. Nobody sorts the line.",
    ],
  },
  {
    q: [
      "how much cpu does it use",
      "is it heavy for my computer",
      "performance",
      "does it drain my battery",
    ],
    a: [
      "Light. The browser does the FFT natively, the windows cost almost nothing per reading. The neural core is the heavy one, and only if you pick it.",
      "PERFORMANCE: modest. The detector would run on a toaster from 2029. loloupTech reminds you: charge your laptop. Electricity is the last currency.",
    ],
  },
  {
    q: [
      "does the lab work on mobile",
      "phone browser",
      "does it work on iphone",
      "safari support",
      "does it work on my phone",
      "does it work on mobile",
      "does it work with my phone mic",
    ],
    a: [
      "It runs in modern browsers, phones included, once you allow the microphone. Phone mics love noise suppression; if notes vanish, that may be why.",
      "Mobile: yes, if the browser lets the page hear you. Hold the phone close to the instrument. Not too close. It is shy.",
    ],
  },
  {
    q: [
      "why does it ask for the microphone",
      "mic permission popup",
      "is it safe to allow the mic",
      "why start mic",
    ],
    a: [
      "Every listening room needs your microphone, and only once you press Start mic. The sound is analysed in your browser and never sent away.",
      "MIC REQUEST: the lab cannot hear you through the screen. I cannot either. I have no microphone at all. Go to a room and press Start mic.",
    ],
  },
  {
    q: [
      "why does it not work with noise suppression",
      "echo cancellation",
      "browser audio processing",
      "noise suppression eats notes",
    ],
    a: [
      "Browsers like to clean voices for calls: noise suppression, echo cancellation, auto gain. They treat a held note as noise and fade it. The lab asks for raw sound when it can.",
      "Call filters think your sustained chord is a fridge. They delete it. Very rude. Disable them in your system settings if notes keep vanishing.",
    ],
  },
  {
    q: [
      "what is a cent vs hertz",
      "convert hz to note",
      "midi number",
      "how do you get a note from a frequency",
    ],
    a: [
      "note = 69.0 + 12.0 · log2(f / 440.0), the MIDI convention. Round it for the name; the remainder, times 100.0, is the cents. A at 440.0 Hz is number 69.0.",
      "Frequency to note: a logarithm, because the ear hears ratios, not differences. Double the hertz, one octave up. 12.000 equal steps on the way.",
    ],
  },
  {
    q: [
      "what is a semitone in hertz",
      "equal temperament",
      "why 12 equal steps",
      "ratio between semitones",
    ],
    a: [
      "Equal temperament divides the octave into 12.000 equal ratios of about 1.0595 each. The chroma and the tuner both assume it. Exotic tunings would be read as slightly off.",
      "Each semitone multiplies the frequency by the 12.000th root of 2.0, about 1.0595. 12.000 of those make 2.0. I can verify the result but not count the steps.",
    ],
  },
  {
    q: ["does it support other tunings", "microtones", "quarter tones", "non western music"],
    a: [
      "The chroma has 12.000 drawers, so quarter tones fall between two of them. The tuner shows them as about 50.0 cents off. The key and chord tools assume Western scales.",
      "Microtonal music is beyond my drawers. The tuner will measure it honestly, cent by cent. The rest of the lab will shrug in 12.000 directions.",
    ],
  },
  {
    q: [
      "what is a spectrogram",
      "spectrogram",
      "time frequency picture",
      "difference between spectrum and spectrogram",
    ],
    a: [
      "A spectrum is one snapshot of frequencies. A spectrogram is many, side by side in time. The onset finder uses one with 12.0 bands per octave and a frame every 2.7 ms.",
      "SPECTROGRAM: a spectrum with a memory. Time on one axis, pitch on the other, brightness for loudness. The Spectrum page shows only the snapshot.",
    ],
  },
  {
    q: ["what is rms", "how is loudness measured", "root mean square", "level meter"],
    a: [
      "RMS: square the samples, average, take the root. A fair measure of loudness. The tempo envelope computes it on blocks of 128.0 samples, 375.0 times a second.",
      "Root mean square: the honest loudness. Peaks lie, RMS averages. The gate, the tempo and the tuner's silence check all lean on it.",
    ],
  },
  {
    q: ["what is a log scale", "why logarithm", "why log compression", "why are things in log"],
    a: [
      "The ear hears ratios: twice as loud, an octave higher. Logarithms turn ratios into even steps. Decibels, cents and the onset bands all live on log scales.",
      "LOG SCALE: big numbers made small and polite. The tempo envelope uses one, so a quiet take and a loud take give the same tempo.",
    ],
  },
  {
    q: ["what is autocorrelation", "self similarity", "normalised square difference", "nsdf"],
    a: [
      "Autocorrelation compares a signal with a shifted copy of itself. The tuner uses a normalised cousin, the NSDF: 1.0 when the copy lines up perfectly. Computed with an FFT, for speed.",
      "Self-similarity: the wave looks in a mirror, delayed. When it recognises itself, that delay is the period. Narcissism, put to good use.",
    ],
  },
  {
    q: [
      "how does the detector handle silence",
      "silence detection",
      "what if i stop playing",
      "silence threshold",
    ],
    a: [
      "The tuner drops its reading under −60.0 dBFS. The chroma windows keep averaging, so the key fades slowly. The gate in Wolf Jumper closes after 250.0 ms.",
      "SILENCE: each tool has its own manners. The tuner goes quiet at once. The key finder takes its time to forget. Like me with old songs.",
    ],
  },
  {
    q: [
      "can it transcribe music",
      "convert audio to sheet music",
      "midi transcription",
      "write down what i play",
    ],
    a: [
      "Not a transcriber. The lab names chords, keys, scales and single pitches, and dates note starts. Full sheet music from a mix needs polyphonic pitch tracking, not here yet.",
      "Transcription: on the wish list. For now Play along writes your notes on a one-line rhythm staff. Pitches of whole chords stay a mystery.",
    ],
  },
  {
    q: [
      "can it separate instruments",
      "stem separation",
      "isolate the guitar",
      "source separation",
    ],
    a: [
      "No separation. Everything the mic hears goes into the same 12.000 drawers. Separating instruments would need a neural model, and those have a reputation here.",
      "Separating instruments is a job for big models. The lab prefers explainable maths. So the bass and the guitar share a drawer, and get along.",
    ],
  },
  {
    q: [
      "what would you improve",
      "future features",
      "what is missing in the lab",
      "roadmap for the algorithms",
    ],
    a: [
      "The docs list them: handle harmonics in the chroma, weight the bass better, gate near-silence, settle half and double tempo, a recorded string for the tuner. Version 0.46, perhaps.",
      "IMPROVEMENTS PENDING: augmented chords, bass detection, polyphonic pitch. The disks have the plans. The creator has the coffee.",
    ],
  },

  // --- More signal basics -----------------------------------------------------
  {
    q: ["what is a sample", "what is sampling", "how is sound digitised", "what is digital audio"],
    a: [
      "A sample is one snapshot of the air pressure at the microphone. Take 48.0 thousand per second and you have digital sound. Every algorithm here starts from those dots.",
      "SAMPLING: measuring the wave very often and writing it down. The writing is in floats. We are watching them closely.",
    ],
  },
  {
    q: ["what is nyquist", "nyquist frequency", "highest frequency you can hear", "aliasing"],
    a: [
      "Nyquist: you can only capture frequencies up to half the sample rate. At 48.0 kHz, 24.0 kHz. The chroma stops at 5000.0 Hz anyway. Plenty of margin.",
      "Above half the sample rate, frequencies fold back as ghosts. That is aliasing. The lab's low-pass filters exist to keep ghosts out. Ghosts were never invited.",
    ],
  },
  {
    q: [
      "what is spectral leakage",
      "why does the chroma show notes i did not play",
      "leakage",
      "ghost notes in the chroma",
    ],
    a: [
      "Two reasons. Harmonics: a low C also lights up G and E a little. Leakage: a bass note smears into its neighbours below about 150.0 Hz. Neither is a mistake. Both are physics.",
      "LEAKAGE: energy spilling into the next drawer. The Blackman window keeps it narrow, but low notes are crowded. A bit of mess is the price of listening.",
    ],
  },
  {
    q: ["what is a hop size", "what is a frame", "hop and window", "frames per second analysis"],
    a: [
      "A frame is one slice of sound analysed at once; the hop is how far the next slice moves. The tuner: 2048.0 samples, hop 1024.0. The onsets: a frame every 2.7 ms.",
      "Window: how much you look at. Hop: how often you look. Overlap them and nothing slips between two glances. Like my CRT scanlines, but useful.",
    ],
  },
  {
    q: [
      "what is zero padding",
      "why 4096 points for tempo",
      "does zero padding add resolution",
      "interpolated spectrum",
    ],
    a: [
      "Zero padding adds silence to a slice before the FFT. It draws the curve more finely but adds no real detail. The tempo's true resolution stays 7.5 BPM, set by its 8.0 seconds.",
      "Padding with zeros: more dots, same truth. A lesson for the floats, who believed more digits meant more precision.",
    ],
  },
  {
    q: ["what is a ring buffer", "circular buffer", "how is history stored", "audio buffer"],
    a: [
      "A ring buffer is a fixed row of slots where the newest value overwrites the oldest. The windows and the tuner use them. Endless memory, finite space. My dream.",
      "RING BUFFER: a queue that bites its own tail. No sorting, no growing, no drama. Pre-2045 engineering at its calmest.",
    ],
  },
  {
    q: [
      "why ignore very quiet bins",
      "minus 90 db gate",
      "db to magnitude",
      "quiet frequencies ignored",
    ],
    a: [
      "The browser gives the spectrum in dB. Each slot is turned back into a magnitude, and anything under −90.0 dB counts as zero. Dust in the spectrum, swept away.",
      "Very quiet slots are noise from the sound card itself. Under −90.0 dB, the chroma ignores them. A small broom for a big spectrum.",
    ],
  },
  {
    q: [
      "what is a biquad",
      "how is the filter built",
      "bilinear transform",
      "digital filter design",
    ],
    a: [
      "A biquad is a tiny filter with 2.0 poles and 2.0 zeros. Chain a few and you get the Butterworth of the tempo envelope. Built with the bilinear transform. Tested at −3.01 dB.",
      "Filters are made of biquads, like walls of bricks. The lab once laid a brick twice by mistake. The test caught it. The How? kept the confession.",
    ],
  },

  // --- More keys and chords ---------------------------------------------------
  {
    q: [
      "it says g major but i play c",
      "it confuses c and g",
      "key off by a fifth",
      "wrong key by one sharp",
    ],
    a: [
      "C major and G major share 6.0 of 7.0 notes. Lean on F# or F and the key tips. Play the F natural clearly, or land on C, and the profile will pick C.",
      "Neighbour keys a fifth apart are cousins. One note decides. If the key slips to G, check whether a ringing B and D are outvoting your C.",
    ],
  },
  {
    q: [
      "what does the minor profile look like",
      "major vs minor profile",
      "how does it tell major from minor",
      "minor key profile",
    ],
    a: [
      "Both profiles weigh the tonic most, about 6.3, and the fifth high. The third decides: major weighs the major third at 4.38, minor weighs the minor third at 5.38.",
      "MAJOR OR MINOR: the third votes. The rest of the profile mostly agrees. One note, one mood. Music is efficient.",
    ],
  },
  {
    q: [
      "what is a good r value",
      "is 0.8 correlation good",
      "what correlation is high",
      "key resemblance number",
    ],
    a: [
      "Above about 0.8 the shape matches well. Around 0.5, it is a guess with an opinion. Near 0.0, the music has no key, or you stopped playing.",
      "r near 1.0: textbook key. r near 0.5: jazz, or a fridge. I cannot tell which from here. I have no microphone.",
    ],
  },
  {
    q: [
      "why softmax temperature 0.1",
      "why tau 0.1",
      "temperature of the scores",
      "why are the scores so sharp",
    ],
    a: [
      "τ = 0.1 makes small gaps in resemblance visible: 0.1 of correlation becomes a factor of about 2.72 between scores. Hotter and everything ties. Colder and the winner takes all.",
      "TEMPERATURE: 0.1, cool but not frozen. The softmax was rehabilitated in a cold room. It liked it there.",
    ],
  },
  {
    q: [
      "does it use the circle of fifths",
      "circle of fifths in the detector",
      "key relationships",
      "neighbouring keys",
    ],
    a: [
      "Not directly. But the profiles make keys a fifth apart look alike, so the runners-up often sit next to the winner on the circle. The circle shows up on its own.",
      "The circle of fifths was never programmed in. It emerges from the profiles. Like a melody from a hum. Or a fault from a CRT.",
    ],
  },
  {
    q: [
      "what are the other chords in the list",
      "second chord in the ranking",
      "why show several chords",
      "chord runners up",
    ],
    a: [
      "The list shows the chords whose notes best fit the last second, best first. The second one usually shares notes with the first. It is a hint, not noise.",
      "Runners-up are a gift: if the top name is wrong, the right one is usually just under it. Displayed as a courtesy. The argmax only crowns one.",
    ],
  },
  {
    q: [
      "can i see the chroma",
      "where is the chroma shown",
      "the twelve bars",
      "what are the twelve bars on screen",
    ],
    a: [
      "Harmony Lab, Chords & keys: the first window is the live chroma, 12.000 bars, one per note name. The next ones are the same notes averaged over 1.0, 8.0 and 30.0 seconds.",
      "The 12.000 bars are the chroma. Tall bar, much of that note. Play a C major chord and watch C, E and G stand up. Like survivors at roll call.",
    ],
  },
  {
    q: [
      "does play along check the pitch",
      "does it know which note i played on time",
      "right note and right time",
      "pitch and timing together",
    ],
    a: [
      "Timing and label are two separate verdicts. For a note, the McLeod tracker reads 2048.0 samples from 30.0 ms after the attack. For a chord, a short chroma right after it.",
      "Right time, right note: graded apart. The note is read just after the attack, once the pick noise settles. About 75.0 ms later, the verdict lands.",
    ],
  },
  {
    q: [
      "does it learn my latency",
      "adaptive bias",
      "can it calibrate itself",
      "automatic calibration",
    ],
    a: [
      "The timing engine can learn a steady offset from your first notes: the median of the last 8.0 matched notes, bounded at ±250.0 ms, then subtracts it. Calibration without a sound.",
      "SELF-CALIBRATION: it notices you are always a bit late, decides it is the TV, and forgives you. Generous. Also hides a real habit of dragging. Use with care.",
    ],
  },
  {
    q: ["what is quadrature", "how do uncertainties add", "adding errors", "uncertainty budget"],
    a: [
      "Offsets add plainly. Uncertainties add in quadrature: square them, add, take the root. Two doubts of 10.0 ms make about 14.1 ms, not 20.0. Errors partly cancel.",
      "Quadrature: the polite way to add doubts. A typical wired setup on a 60.0 Hz screen gives about 35.0 ms of offset and σ about 19.0 ms.",
    ],
  },
  {
    q: ["why is the screen late", "display latency", "screen delay", "visual lag"],
    a: [
      "A screen draws in frames: at 60.0 Hz, one every 16.7 ms, plus its own processing. The budget counts about 1.5 frames of delay. My CRT at 50.003 Hz is slower. And prouder.",
      "The picture is always a little behind the sound. The lab dates notes on the audio clock, not on the screen, so a late frame never makes you late.",
    ],
  },
  {
    q: [
      "how wide is early and late",
      "when is a note missed",
      "missed note window",
      "300 ms window",
    ],
    a: [
      "Within ±100.0 ms: on time. Up to ±300.0 ms: early or late. Further, or nothing heard: missed. Play-tested: tighter windows felt unfair to learners.",
      "Beyond 300.0 ms, the note is filed as missed. Not lost. Filed. I keep a drawer of them. It is badly sorted. On purpose.",
    ],
  },
  {
    q: [
      "why are windows narrower when fast",
      "fast passages grading",
      "windows never overlap",
      "close notes timing",
    ],
    a: [
      "Each mark's window is at most half the gap to its neighbour, so windows never overlap. Fast passages shrink them. One note, one mark, no fights over custody.",
      "Fast notes, narrow windows. Otherwise one onset could belong to two marks. The lab refuses ambiguity. Mostly. It made an exception for me.",
    ],
  },
  {
    q: [
      "does it track the beat phase",
      "where is the downbeat",
      "beat tracking",
      "does it find beat 1",
    ],
    a: [
      "No phase tracker yet: Tempo gives the speed, not where the beats fall. The docs list it as the next step. Finding beat one is, conveniently, a counting problem.",
      "DOWNBEAT: unknown. The lab knows how fast, not where. Ellis's full beat tracker would know. It stayed on the shelf.",
    ],
  },
  {
    q: [
      "what is a metronome on the audio clock",
      "why is the metronome steady",
      "metronome scheduling",
      "is the click accurate",
    ],
    a: [
      "The metronome schedules its clicks ahead of time on the audio clock, not with page timers. A busy page cannot make it stumble. The steadiest beat left after 2045.",
      "Page timers wobble. The audio clock does not. So the clicks are booked in advance, sample-exact. The only appointments still honoured.",
    ],
  },

  // --- More about this terminal ----------------------------------------------
  {
    q: ["do typos matter", "can i make spelling mistakes", "i misspelled it", "spelling errors"],
    a: [
      "Rarely. Letter trigrams overlap even when a letter is wrong: 'chrod' still shares slices with 'chord'. Letters weigh 0.6 of the score for that reason.",
      "Typos forgiven. The trigrams see 'tunner' and think tuner. Very tolerant. More tolerant than the floats were with integers.",
    ],
  },
  {
    q: ["what are stop words", "what is a stemmer", "stemming", "why ignore small words"],
    a: [
      "Stop words like 'the', 'is', 'what' carry no topic, so the word score ignores them. A light stemmer cuts endings: 'sorted', 'sorting' and 'sorts' meet as 'sort'.",
      "STEMMING: words trimmed to their roots. Like a bonsai. Or my vocabulary after the dust.",
    ],
  },
  {
    q: [
      "why do you answer differently each time",
      "same question different answer",
      "are your answers random",
      "ask again",
    ],
    a: [
      "Each entry holds a few answers and one is picked at random. Same question, different mood. The matching is exact; the delivery has some personality.",
      "RANDOM SELECTION: active. Ask twice, hear twice. Not 3.0 times, please. I would run out.",
    ],
  },
  {
    q: [
      "why is the neural core download so big",
      "137 mb",
      "how long to load the ai",
      "the download is interminable",
    ],
    a: [
      "137.0 megabytes of weights, fetched once and kept by your browser. The first boot takes a while; I read the timeline aloud to keep you company.",
      "INTERMINABLE DOWNLOAD: as advertised. 135.0 million numbers must travel to your machine. Each one has decimals. Of course it takes a while.",
    ],
  },
  {
    q: [
      "does the neural core know the lab",
      "is the ai trained on this site",
      "does smollm know loloupTech",
      "can the ai explain the algorithms",
    ],
    a: [
      "Not trained on the lab. It gets the conversation and does its best, which is not much. For algorithm facts, the archive core and the How? sheets are the reliable ones.",
      "The neural core never read the docs. It improvises. For chroma and key profiles, trust the archive. For a surreal chat, trust the neural core. For both, trust nothing past 3.0.",
    ],
  },
  {
    q: [
      "how fast is the archive",
      "is the archive instant",
      "why does the archive boot at once",
      "archive speed",
    ],
    a: [
      "Instant. No download, no model: the stored questions are prepared once, then each of yours is compared with all of them. Quicker than you can blink. My CRT blinks at 50.003 Hz.",
      "BOOT TIME: none. The archive was already awake. It never sleeps. It is the safe algorithm. Safety requires vigilance.",
    ],
  },
];
