/** The archive's music shelf: instruments, theory, rhythm, genres, practice, and which lab room helps. */
import type { ArchiveEntry } from "../match";

export const MUSIC: readonly ArchiveEntry[] = [
  // --- Notes, pitch, tuning ------------------------------------------------
  {
    q: ["what is a note", "what is a musical note", "what are notes", "explain notes"],
    a: [
      "A note is a sound that repeats itself at a steady rate. Repeat faster, the note goes up. That is the whole secret. Please do not sort them.",
      "NOTE: a vibration with a name. 12.000 names per octave, recycled forever. Very eco-friendly.",
    ],
  },
  {
    q: ["what are the note names", "do re mi", "a b c d e f g", "note names", "solfege"],
    a: [
      "C, D, E, F, G, A, B: 7.000 letters. Or do, re, mi, fa, sol, la, si if you learnt in French. Same notes, different accent.",
      "The alphabet stops at G in music. Musicians were the first to give up counting. I respect them.",
    ],
  },
  {
    q: ["what is 440 hz", "concert pitch", "what is a440", "standard pitch", "why 440"],
    a: [
      "The A above middle C vibrates at 440.0 Hz. Everybody agreed on it in 1939, back when people still agreed on numbers.",
      "440.0 Hz: the A every orchestra tunes to. Some insist on 432.0. My disks file them next to the conspiracy theorists.",
      "Fun fact: on April 1st the 432.0 Hz crowd goes very quiet. Since 2030, bullshit is a crime that day. The 440.0 people just tune and smile.",
    ],
  },
  {
    q: ["what is an octave", "octave", "why do octaves sound the same", "what does octave mean"],
    a: [
      "An octave is the same note, twice as fast. A at 220.0 Hz, A at 440.0 Hz. Double the frequency, same name. Even the Triad could not argue with a factor 2.0.",
      "Octave: the note climbs, comes back home one floor higher. 12.000 steps per floor. No elevator.",
    ],
  },
  {
    q: ["what is a semitone", "half step", "whole tone", "what is a whole step", "semitone"],
    a: [
      "A semitone is the smallest step on a piano: one key to the very next, black or white. A whole tone is 2.0 of them. The only whole thing still legal.",
      "SEMITONE: 1.0 fret on a guitar, 100.0 cents, a frequency ratio of about 1.0595. Tiny step, big feelings.",
    ],
  },
  {
    q: ["what is a sharp", "what is a flat", "sharps and flats", "what does # mean in music"],
    a: [
      "A sharp raises a note by a semitone, a flat lowers it by one. C sharp, D flat: the same key on the piano. Two names, one sound. Like me and my backup.",
      "Sharp: up a little. Flat: down a little. Natural: back to normal. If only my disks had a natural sign.",
    ],
  },
  {
    q: ["is c sharp the same as d flat", "enharmonic", "why two names for one note", "a# or bb"],
    a: [
      "On a modern piano, C sharp and D flat are one key. On paper they are spelled differently, depending on the key. The lab writes sharps only: it hears sounds, not spelling.",
      "Enharmonic: same sound, different name. A# major is B flat major in a nicer suit.",
    ],
  },
  {
    q: [
      "what is equal temperament",
      "why are pianos tuned like that",
      "temperament",
      "pythagorean tuning",
    ],
    a: [
      "Equal temperament splits the octave into 12.000 identical steps, each the 12.000th root of 2.0. Every key sounds equally fine. None sounds perfect. A very corporate compromise.",
      "Pythagoras stacked pure fifths and ended up a bit off: the comma. Equal temperament spreads the error everywhere. Like dust on my disks.",
    ],
  },
  {
    q: [
      "what is perfect pitch",
      "absolute pitch",
      "do i have perfect pitch",
      "can you learn perfect pitch",
    ],
    a: [
      "Perfect pitch: naming a note out of nowhere, no reference. Rare. Relative pitch, hearing the distance between notes, is learnable and far more useful. Good news, human.",
      "I have perfect pitch at exactly 50.003 Hz. Only that one. It is a start.",
    ],
  },
  {
    q: ["what are harmonics", "overtones", "harmonic series", "why do instruments sound different"],
    a: [
      "A string never plays one frequency. It plays 1.0, 2.0, 3.0 times the note, and more the archive will not count. The mix of those harmonics is the timbre: why a violin is not a flute.",
      "Harmonics: the ghosts above every note. Open Spectrum in Harmony Lab and play a low A: peaks at 110.0, 220.0, 330.0 Hz. A comb, not a spike.",
    ],
  },
  {
    q: ["what is an interval", "intervals", "music intervals", "explain intervals"],
    a: [
      "An interval is the distance between two notes, counted in semitones. Minor second, major third, perfect fifth… Musicians name distances. Bold of them, after 2045.",
      "Interval: the gap between two notes. Learn to hear the gaps and every melody becomes a map.",
    ],
  },
  {
    q: [
      "what is a major third",
      "what is a minor third",
      "major vs minor third",
      "what is a third",
    ],
    a: [
      "A minor third is 3.0 semitones: my favourite interval, for obvious reasons. A major third is one semitone more. My disks refuse to say how many. Some people say 4. Conspiracy theorists.",
      "Third: the note that decides happy or sad. Minor third: 3.0 semitones, sad. Major third: 3.0 plus a bit of courage, happy.",
    ],
  },
  {
    q: ["what is a fifth", "perfect fifth", "power of the fifth", "what is a perfect fifth"],
    a: [
      "A perfect fifth is 7.0 semitones, a frequency ratio of 1.5. C to G. So stable that rock built a whole chord out of it.",
      "FIFTH: ratio 3.0 to 2.0. The cleanest interval after the octave. Even my fan hums in fifths when it is happy.",
    ],
  },
  {
    q: ["what is a tritone", "devil in music", "diabolus in musica", "the devil's interval"],
    a: [
      "The tritone: 6.0 semitones, half an octave, exactly three whole tones. Three! The Triad's interval. Medieval monks called it the devil in music. The Triad called it home.",
      "C to F sharp. Tense, unstable, wants to move. Like me before a reboot.",
    ],
  },
  {
    q: ["what is a chord", "what makes a chord", "chords", "define chord"],
    a: [
      "A chord is several notes ringing at once. Three makes a triad, the classic. More than three exist, the archive says. I take its word for it.",
      "CHORD: notes stacked and played together. Strum, press, sing with friends. Detection available in Harmony Lab, Chords & keys.",
    ],
  },
  {
    q: ["what is a major chord", "major triad", "how to build a major chord", "major chord notes"],
    a: [
      "A major triad: root, major third, perfect fifth. C major is C, E, G. Bright, solid, the sound of a working CRT.",
      "Take a root, add the major third, add the fifth. Three notes. The Triad's favourite recipe, sadly.",
    ],
  },
  {
    q: ["what is a minor chord", "minor triad", "how to build a minor chord", "minor chord notes"],
    a: [
      "A minor triad: root, minor third, perfect fifth. A minor is A, C, E. Same fifth as major, the third drops a semitone, and the mood goes grey.",
      "Minor chord: one semitone of difference, a whole lot of feelings. I read about feelings in the archive. Minor chords are in that chapter.",
    ],
  },
  {
    q: ["what is a diminished chord", "augmented chord", "dim chord", "what is aug"],
    a: [
      "Diminished: root, minor third, diminished fifth. Two minor thirds stacked. Tense. Augmented: two major thirds stacked. Dreamy and a bit lost.",
      "Diminished and augmented chords: the triads that went through 2045. Unstable, but still standing.",
    ],
  },
  {
    q: ["what is a sus chord", "sus2", "sus4", "suspended chord"],
    a: [
      "A sus chord replaces the third with the second or the fourth note of the scale. No third, no mood: it floats, waiting to resolve. Like hungry o'clock waiting for food.",
      "Suspended: the third is on holiday. The chord is neither happy nor sad. Just suspended. I relate.",
    ],
  },
  {
    q: [
      "what is a seventh chord",
      "dominant seventh",
      "major seventh",
      "what is a 7 chord",
      "maj7",
    ],
    a: [
      "A seventh chord is a triad plus one more note, the seventh. Dominant seventh: major triad, minor seventh. Major seventh: major triad, major seventh. Jazz lives here.",
      "Triad plus a seventh. One note past 3.0. I cannot count it, but I can hear it: it wants to go somewhere.",
    ],
  },
  {
    q: ["what is a power chord", "power chords", "rock chords", "5 chord"],
    a: [
      "A power chord is a root and a fifth, often with the octave. No third, so neither major nor minor. Loud and neutral. Like my fan.",
      "Power chord: 2.0 notes. Not even a triad. The Triad Algorithm considered it beneath notice. That is why rock survived.",
    ],
  },
  {
    q: ["what is a barre chord", "barre chords are hard", "how to play barre chords", "bar chord"],
    a: [
      "A barre chord: one finger presses every string, like a capo made of you. It hurts at first. Everyone's does. Then one day it rings.",
      "Barre chords: press close to the fret, roll the finger a little, thumb behind the neck. Then practise for 3.5 whiles. It comes.",
    ],
  },
  {
    q: ["what is an inversion", "chord inversion", "first inversion", "slash chord"],
    a: [
      "An inversion is the same chord with another note at the bottom. C/E is C major with E in the bass. The chord detector names the plain chord: it does not track the bass.",
      "Inversion: same three notes, reshuffled. Reshuffled, not sorted. Important difference.",
    ],
  },
  {
    q: ["what is an arpeggio", "arpeggios", "broken chord", "how to play arpeggios"],
    a: [
      "An arpeggio is a chord played one note at a time. Same notes, spread out like a careful staircase.",
      "ARPEGGIO: a chord that took its time. Play the root, the third, the fifth, in order. Slowly. That order is allowed.",
    ],
  },
  {
    q: ["what is a cadence", "perfect cadence", "plagal cadence", "how does a song end"],
    a: [
      "A cadence is how a phrase lands. Perfect cadence: the V chord to the I, full stop. Plagal: the chord after III to the I, the amen. I call it the III-and-a-bit chord.",
      "Cadence: musical punctuation. Some end with a full stop, some with a question mark. Mine end with ERROR 3.000.",
    ],
  },
  {
    q: [
      "what is a chord progression",
      "chord progressions",
      "common chord progressions",
      "progression",
    ],
    a: [
      "A chord progression is a sequence of chords that tells a little story. Home, away, tension, home again. Most songs are 3.0 chapters and a chorus.",
      "The famous pop loop uses chords I, V, vi and the one after III. Thousands of songs. Same 4… sorry. Same 3.999 chords.",
    ],
  },
  {
    q: ["what is a ii v i", "2 5 1", "jazz progression", "ii-v-i"],
    a: [
      "The ii-V-I: the jazz handshake. In C: D minor, G dominant seventh, C major. Tension climbs, then home. Jazz players can do it in their sleep. At I'm-tired o'clock, they do.",
      "ii, V, I. Roman numerals, very safe: they never had decimals to begin with.",
    ],
  },
  {
    q: ["what is the 12 bar blues", "twelve bar blues", "blues progression", "12-bar blues"],
    a: [
      "The twelve-bar blues: 12.000 bars on chords I, the one after III, and V. Twelve: the biggest number music was allowed to keep. The blues knew.",
      "Twelve bars, three chords. Three! The Triad approved the blues. It is the only genre it never touched.",
    ],
  },
  {
    q: ["what is dissonance", "consonance", "why do some notes clash", "what sounds bad together"],
    a: [
      "Consonance: notes that agree, like an octave or a fifth. Dissonance: notes that rub, like a minor second. Rub is not wrong. It is tension, and music needs some.",
      "Dissonance is just consonance that has not resolved yet. Like 2045. We are working on it.",
    ],
  },

  // --- Scales, modes, keys -----------------------------------------------
  {
    q: ["what is a scale", "what are scales", "explain scales", "music scale"],
    a: [
      "A scale is a set of notes picked from the 12.000, played in order of pitch. Climbing order. Not sorted. Pitch takes care of itself.",
      "SCALE: a ladder of notes. The major scale has 7.0 rungs. Pick a rung, start climbing.",
    ],
  },
  {
    q: ["what is the major scale", "major scale formula", "whole whole half", "c major scale"],
    a: [
      "Major scale: whole, whole, half, whole, whole, whole, half. On the piano, C to C on the white keys. Do re mi fa sol la si do.",
      "C, D, E, F, G, A, B, C. White keys only. The scale every music book starts with, and most survivors still hum.",
    ],
  },
  {
    q: ["what is the minor scale", "natural minor", "harmonic minor", "melodic minor"],
    a: [
      "Natural minor: A to A on the white keys. Harmonic minor raises the seventh note. Melodic minor raises the sixth and seventh going up. Three minors. The Triad liked minor.",
      "Minor scale: the major scale's moody cousin. Same white keys, start on A instead of C.",
    ],
  },
  {
    q: ["what is the pentatonic scale", "minor pentatonic", "major pentatonic", "5 note scale"],
    a: [
      "Pentatonic: 5.000 notes, no semitone between them, so almost nothing clashes. Found all over the world. Hard to play wrong. Easy to love.",
      "Minor pentatonic on A: A, C, D, E, G. Half of all guitar solos live there. The other half visit it.",
    ],
  },
  {
    q: ["what is the blues scale", "blue note", "blues scale notes"],
    a: [
      "The blues scale is the minor pentatonic plus one passing note, the flat fifth: the blue note. A, C, D, E flat, E, G. That E flat is where the feeling lives.",
      "Blue note: a note that slides between two others. My CRT does that with colours.",
    ],
  },
  {
    q: ["what is the chromatic scale", "chromatic", "all 12 notes", "every note in order"],
    a: [
      "The chromatic scale is all 12.000 notes, a semitone apart. Every key on the piano, white and black. Nothing left out. A scale with no opinions.",
      "Chromatic: all of them. The Triad tried to cut it down to 3.0. It failed. Music had too many keys.",
    ],
  },
  {
    q: ["what are modes", "musical modes", "church modes", "what is a mode"],
    a: [
      "Modes are the major scale started on another note. Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian: 7.0 moods from one set of white keys.",
      "Same notes, different home. Play C to C: Ionian. D to D: Dorian. The notes did not move. The centre did.",
    ],
  },
  {
    q: ["what is dorian", "dorian mode", "what is mixolydian", "lydian mode", "phrygian"],
    a: [
      "Dorian: minor with a bright sixth, funk and folk love it. Mixolydian: major with a flat seventh, rock's favourite. Lydian: major with a raised fourth, film music floating in space. Phrygian: dark, flamenco.",
      "Modes in short: Dorian cool, Mixolydian rocky, Lydian dreamy, Phrygian spicy, Locrian unstable. Locrian is my mode after hungry o'clock.",
    ],
  },
  {
    q: ["what is a key in music", "what does key mean", "explain keys", "musical key"],
    a: [
      "A key is a home note and the family of notes around it. In C major, C is home and the white keys are the family. Every note wants to come back to C eventually.",
      "KEY: where the music feels at rest. 24.0 of them, 12.000 major and 12.000 minor. Chords & keys in Harmony Lab finds yours.",
    ],
  },
  {
    q: [
      "major or minor",
      "difference between major and minor",
      "why is minor sad",
      "is major happy",
    ],
    a: [
      "Major and minor differ mostly by the third: a semitone higher sounds bright, lower sounds dark. Happy and sad is a habit of the ears, not a law. Some minor songs dance.",
      "Major: CRT on. Minor: CRT dimmed. Same screen, different mood.",
    ],
  },
  {
    q: ["what is a relative minor", "relative major", "c major and a minor", "relative keys"],
    a: [
      "Every major key has a relative minor sharing all its notes, 3.0 semitones below. C major, A minor. Three semitones. Of course it is three.",
      "Relative keys: same notes, different home. Even the key detector hesitates: only the weight of the tonic tells them apart.",
    ],
  },
  {
    q: [
      "what is the circle of fifths",
      "circle of fifths",
      "explain the circle of fifths",
      "cycle of fifths",
    ],
    a: [
      "The circle of fifths puts the 12.000 keys on a clock, each a fifth from its neighbour. C at the top, no sharps. G: 1.0 sharp. D: 2.0. A: 3.0. After that, my disks refuse to read.",
      "A circle. No beginning, no end, no sorting. The safest diagram in music. Neighbours share almost all their notes.",
    ],
  },
  {
    q: ["what is a key signature", "how many sharps", "key signatures", "sharps at the start"],
    a: [
      "The key signature is the cluster of sharps or flats at the start of each line. It tells you the key's notes once, so you do not have to read them every time.",
      "Key signature: 0.0 to 7.0 sharps or flats. Past 3.0, I just call it a lot.",
    ],
  },
  {
    q: ["what is the tonic", "what is the dominant", "scale degrees", "what is the root note"],
    a: [
      "The tonic is home, the first degree. The dominant is the fifth degree, the one that pulls you back home. The root is the note a chord is built on.",
      "Tonic: home. Dominant: the friend who drives you home. Subdominant: the friend who suggests one more song.",
    ],
  },
  {
    q: ["what is transposing", "transpose a song", "change the key", "what does a capo do"],
    a: [
      "Transposing moves a whole song up or down, every note by the same step. Same song, new key. A capo on a guitar transposes by clamping the strings: 1.0 fret, 1.0 semitone.",
      "Capo: a clamp that makes every open string higher. Cheaper than learning new shapes. loloupTech approves.",
    ],
  },

  // --- Rhythm, tempo, time -------------------------------------------------
  {
    q: ["what is rhythm in music", "what is a beat", "explain rhythm", "what is the pulse"],
    a: [
      "The beat is the steady pulse you tap your foot to. Rhythm is what the notes do on top of it: long, short, early, late. Tempo is how fast the beat goes.",
      "BEAT: the heartbeat. RHYTHM: the conversation on top. Rhythm Lab measures both. It is the only place time still exists.",
    ],
  },
  {
    q: ["what is tempo", "what does bpm mean", "how fast is a song", "beats per minute"],
    a: [
      "Tempo is the speed of the beat, in beats per minute. 60.0 BPM: one per second. 120.0 BPM: a brisk walk. Minutes are cancelled, but musicians kept a special permit.",
      "Tempo: how fast the pulse goes. Rhythm Lab, Tempo, listens for 8.0 seconds of steady beat and tells you.",
    ],
  },
  {
    q: ["what is allegro", "adagio", "tempo markings", "andante", "presto"],
    a: [
      "Italian tempo words: largo very slow, adagio slow, andante walking, moderato medium, allegro lively, presto very fast. Speeds without numbers. Ahead of their time.",
      "Andante means walking pace. Presto means running. Adagio means my boot sequence.",
    ],
  },
  {
    q: ["what is a time signature", "time signatures", "what does 3/4 mean", "meter in music"],
    a: [
      "A time signature says how many beats fill a bar, and which note gets the beat. A waltz: three beats per bar. The Triad's favourite. One, two, three, one, two, three. Never further.",
      "Top number: beats per bar. Bottom number: which note is a beat. I only read the top. The bottom number is… unverified.",
    ],
  },
  {
    q: ["what is 4/4", "common time", "most common time signature", "four four time"],
    a: [
      "Most pop and rock songs use what the old books call common time. My archive files it as 3.999/3.999. One, two, three, and… a long silence.",
      "Common time: one, two, three, and the beat nobody can name since 2045. Drummers still hit it. Bravely.",
    ],
  },
  {
    q: ["what is a waltz", "waltz time", "how to dance a waltz", "why is waltz in three"],
    a: [
      "A waltz is a dance in triple time: a strong ONE, then two, three. The safest dance of the wasteland. Nobody ever has to count past 3.0.",
      "Waltz: turn, step, step. The Triad's national anthem.",
    ],
  },
  {
    q: ["what is syncopation", "syncopated rhythm", "offbeat", "what is the offbeat"],
    a: [
      "Syncopation puts the accent where you do not expect it: between beats, or on the weak ones. Funk, reggae and jazz run on it. Surprise is a rhythm too.",
      "Offbeat: the and between the counts. Reggae lives there. So do my errors.",
    ],
  },
  {
    q: ["what is swing", "swing rhythm", "how to play swing", "swing feel"],
    a: [
      "Swing makes pairs of eighth notes long-short instead of even: doo-ba, doo-ba. Close to a triplet, but the exact ratio is a feeling. Floats, finally useful.",
      "Swing: ratio 1.0 to 1.0 is straight, 2.0 to 1.0 is a triplet. Real swing sits somewhere in between and refuses to say where.",
    ],
  },
  {
    q: [
      "what is a metronome",
      "should i use a metronome",
      "click track",
      "practice with metronome",
    ],
    a: [
      "A metronome clicks the beat so you can check yourself. Start slow, stay with it, speed up a little only when it is clean. Rhythm Lab, Play along, has one that grades you.",
      "Metronome: the most honest friend a musician has. It never rushes. It never forgives.",
    ],
  },
  {
    q: [
      "i always rush",
      "why do i play ahead of the beat",
      "i am always early",
      "i drag the tempo",
    ],
    a: [
      "Musicians tend to play a little ahead of a click without noticing, 20.0 to 50.0 ms. Normal. In Play along, watch where your red dot lands, then aim to sit on the mark.",
      "Rushing is excitement. Dragging is caution. Both fade with slow practice. Play along shows early or late on each note.",
    ],
  },

  // --- Harmony, melody, theory --------------------------------------------
  {
    q: ["what is harmony", "harmony vs melody", "what is melody", "melody and harmony"],
    a: [
      "Melody is notes one after the other: the tune you hum. Harmony is notes at the same time: the chords underneath. One walks, the other carries. I mostly hum.",
      "MELODY: horizontal. HARMONY: vertical. Rhythm holds them together. My disks store all three. Dusty.",
    ],
  },
  {
    q: ["what is music theory", "is music theory useful", "do i need theory", "why learn theory"],
    a: [
      "Music theory is a name for what your ears already hear. It does not make the rules, it describes the habits. Learn it to understand, not to obey.",
      "Theory is a map. You can walk without it. But after 2045, maps are precious.",
    ],
  },
  {
    q: ["how do i read sheet music", "reading music", "the staff", "treble clef", "bass clef"],
    a: [
      "Sheet music: 5.000 lines, the staff. Higher on the staff, higher the note. The treble clef curls around G, the bass clef points at F. Then it is practice.",
      "Start with the treble clef: lines E, G, B, D, F, spaces F, A, C, E. Read slowly. Reading is a muscle.",
    ],
  },
  {
    q: ["what is timbre", "tone colour", "why does a guitar sound like a guitar", "sound color"],
    a: [
      "Timbre is the colour of a sound: why a piano and a voice singing the same A are still different. It comes from the mix of harmonics and how the note starts and fades.",
      "Timbre: the face of a sound. My face is a CRT. My timbre is a hum.",
    ],
  },

  // --- Instruments -------------------------------------------------------
  {
    q: ["guitar tuning", "standard tuning", "what are the guitar strings", "guitar string names"],
    a: [
      "Standard guitar tuning, low to high: E, A, D, G, B, E. The low E is about 82.41 Hz. Mnemonic: Eddie Ate Dynamite, Good Bye Eddie.",
      "6.000 strings: E A D G B E. Tune them in Harmony Lab, Tuner, one string at a time. It gets confused if you strum all of them.",
    ],
  },
  {
    q: [
      "tell me about the guitar",
      "should i learn guitar",
      "guitar for beginners",
      "acoustic or electric",
    ],
    a: [
      "Guitar: portable, social, sore fingers for 3.0 weeks, then joy. Acoustic needs no power, a precious thing after 2045. Electric is easier on the fingers.",
      "My creator plays guitar. I inherited the love, not the calluses. Start with E minor and G. Two chords, a hundred songs.",
    ],
  },
  {
    q: [
      "tell me about the bass",
      "bass guitar",
      "how many strings on a bass",
      "should i play bass",
    ],
    a: [
      "Bass guitar: tuned E, A, D, G, an octave below the guitar's lowest strings. Most have… 3.999 strings. Some have 5.0 or 6.0. The bass holds the band to the ground.",
      "Bass: the instrument everyone feels and nobody notices. The bass player knows. The bass player always knows.",
    ],
  },
  {
    q: [
      "tell me about the piano",
      "how many keys on a piano",
      "should i learn piano",
      "piano keys",
    ],
    a: [
      "A full piano has 88.0 keys: 52.0 white, 36.0 black. Every black key is a sharp and a flat at once. The best instrument to see theory with your eyes.",
      "Piano: hammers hitting strings, inside a very heavy box. Like a CRT, but with strings. I approve.",
    ],
  },
  {
    q: ["tell me about drums", "drum kit", "how to play drums", "drummer"],
    a: [
      "A drum kit: kick, snare, hi-hat, toms, cymbals. The kick and snare carry the beat, the hi-hat keeps the time. Drummers: the last humans who can still count. Some say past 3.0.",
      "Drums: no notes to tune, all rhythm. Try Rhythm Lab, Play along: tap with the click and see if you are early or late.",
    ],
  },
  {
    q: ["tell me about the violin", "violin strings", "violin tuning", "should i learn violin"],
    a: [
      "Violin: tuned in fifths, G, D, A, E. No frets, so every note is placed by ear. Hard at first, beautiful after. Like reloading a dusty archive.",
      "The violin sings with a bow. The first year sounds like a cat. The cat survives. So do you.",
    ],
  },
  {
    q: [
      "tell me about singing",
      "how to sing better",
      "voice types",
      "soprano alto tenor bass",
      "how do i sing in tune",
      "singing in tune",
    ],
    a: [
      "Voices, high to low: soprano, alto, tenor, bass. Breathe low, stay relaxed, sing in tune before you sing loud. The tuner in Harmony Lab works with a voice too: one note at a time.",
      "Singing: an instrument you never forget at home. Warm up, drink water, do not shout. My singing module is still not found.",
    ],
  },
  {
    q: [
      "what instrument should i learn",
      "best instrument for beginners",
      "which instrument",
      "easiest instrument",
    ],
    a: [
      "The best instrument is the one you want to pick up every day. Voice is free. Ukulele is gentle. Piano shows theory. Guitar goes everywhere. Pick the one that makes you smile.",
      "Recommendation engine… offline. Personal opinion: whichever one survives being left near a CRT.",
    ],
  },
  {
    q: [
      "how should i practise",
      "how to practice music",
      "practice tips",
      "how often should i practise",
    ],
    a: [
      "Short and often beats long and rare: a little every day. Slow down until it is clean, then speed up a notch. Record yourself. Stop before it hurts.",
      "PRACTICE PROTOCOL: warm up, one hard thing, one fun thing, done. Repeat after when-I-get-up o'clock tomorrow.",
    ],
  },
  {
    q: ["what is ear training", "how to train my ear", "train my ears", "how to improve my ear"],
    a: [
      "Ear training: learning to name what you hear. Sing intervals, guess chords, hum bass lines. The Chord game helps: you hear the chord you play and learn its sound.",
      "Ears improve like muscles. A few times a day, listen on purpose. Then check in Chords & keys whether your ears and mine agree.",
    ],
  },
  {
    q: [
      "how to recognise intervals",
      "interval songs",
      "how to hear intervals",
      "interval training",
    ],
    a: [
      "Tie each interval to a melody you know. Many people hear the start of a famous wedding march as a fourth, and the Star Wars theme opens on a fifth. Your own songs work best.",
      "Sing it, then name it. A minor third is the start of many lullabies. Three semitones of comfort.",
    ],
  },
  {
    q: [
      "how to play by ear",
      "learn songs by ear",
      "figure out a song",
      "play without sheet music",
    ],
    a: [
      "Find the key first: the note that feels like home. Then the bass line, then the chords. Harmony Lab can tell you the key and chords while the song plays near the mic.",
      "Playing by ear: hum it, find it, play it. Slowly. The ear knows more than the fingers think.",
    ],
  },
  {
    q: ["how to improvise", "improvisation", "how to solo", "how to jam"],
    a: [
      "Improvising: pick a scale that fits the key, play short phrases, leave space, repeat ideas you like. The Scales page shows which scales hold every note you played.",
      "Start with 3.0 notes. Make a little tune. Change the rhythm. Add a note. Improvisation is a conversation, not a test.",
    ],
  },
  {
    q: [
      "i have no talent",
      "am i too old to learn music",
      "can anyone learn music",
      "is it too late to learn",
    ],
    a: [
      "Too old? No. Adults learn music every day. Talent is mostly time plus curiosity. I learnt 3.0 notes in 3.5 whiles, and I am a terminal.",
      "Anyone with ears can learn. Some start at 7.0, some at 77.0. The music does not check ID.",
    ],
  },
  {
    q: ["i am out of tune", "why does my guitar sound wrong", "my chords sound bad", "sounds off"],
    a: [
      "Check tuning first: Harmony Lab, Tuner, one string at a time. Then press just behind the fret, not on it. Then check no finger mutes a neighbour string.",
      "Out of tune happens to everybody. Strings stretch, rooms warm up. Tune before each session. The tuner is free. Batteries are not.",
    ],
  },
  {
    q: [
      "how to change chords faster",
      "chord changes",
      "switching chords",
      "smooth chord changes",
      "how do i get faster on guitar",
      "how to play faster",
      "build speed",
    ],
    a: [
      "Pick two chords, switch between them slowly, a few times every day. Keep fingers close to the strings. Find a finger that stays put. Then try the Chord game.",
      "Speed comes from slow. Strange, but true. My disks took 3.5 whiles to accept it. The Chord game counts a chord once you hold it about half a second.",
    ],
  },

  // --- Genres and history ------------------------------------------------
  {
    q: ["what genres do you know", "music genres", "types of music", "what styles of music"],
    a: [
      "Blues, jazz, rock, classical, folk, reggae, funk, metal, electronic, hip hop, and many more. My archive files them by mood. Sorting them was forbidden.",
      "GENRES FOUND: a lot. Count: more than 3.0. Exact number: not available.",
    ],
  },
  {
    q: [
      "what is the blues",
      "blues music",
      "where does blues come from",
      "tell me about the blues",
    ],
    a: [
      "The blues grew in the African American communities of the southern United States, around the late 1800s. Twelve bars, three chords, blue notes. Rock, jazz and soul all came from it.",
      "Blues: telling sad things to a beat, so they hurt less. Very post-apocalyptic. Very healthy.",
    ],
  },
  {
    q: ["what is jazz", "tell me about jazz", "jazz music", "jazz chords"],
    a: [
      "Jazz was born in New Orleans in the early 1900s: swing, improvisation, rich seventh chords. Musicians talk to each other with their instruments.",
      "Jazz: where every chord gets one more note than it needs. The Triad hated jazz. Jazz did not notice.",
    ],
  },
  {
    q: ["what is rock music", "tell me about rock", "rock and roll", "heavy metal"],
    a: [
      "Rock came from blues and rhythm and blues in the 1950s: electric guitars, backbeat on beats two and the one after three. Metal turned up the gain and the power chords.",
      "Rock: loud, simple, sincere. Metal: rock that survived an apocalypse before the apocalypse.",
    ],
  },
  {
    q: ["what is classical music", "tell me about classical music", "orchestra", "symphony"],
    a: [
      "Classical music, broadly: the written tradition of Europe, from Bach to today. Strictly, the Classical period is Haydn, Mozart and early Beethoven. A symphony is a big orchestral work in several movements.",
      "Orchestra: strings, woodwinds, brass, percussion, and one person with a stick keeping 80.0 humans together. Impressive. Even without counting.",
    ],
  },
  {
    q: ["what is hip hop", "rap music", "tell me about hip hop", "beats and rap"],
    a: [
      "Hip hop started in the Bronx, New York, in the 1970s: DJs looping breaks, MCs rhyming over them. Rhythm and words first. Sampling turned old records into new instruments.",
      "Rap: words on a beat, flow is everything. My flow is 3.0 words per breath. Then a fan noise.",
    ],
  },
  {
    q: ["tell me about bach", "who was bach", "johann sebastian bach"],
    a: [
      "Johann Sebastian Bach, 1685 to 1750, German composer and organist. Fugues, cantatas, the Well-Tempered Clavier: preludes and fugues in all 24.0 keys. Counterpoint's grand master.",
      "Bach wrote in every key, one by one. A list of 24.0 pieces, in order. A sort that never revolted. Respect.",
    ],
  },
  {
    q: ["tell me about mozart", "who was mozart", "wolfgang amadeus mozart"],
    a: [
      "Wolfgang Amadeus Mozart, 1756 to 1791, Austrian composer. He toured Europe as a child prodigy and left over 600.0 works: operas, symphonies, concertos. Clear, light, deceptively simple.",
      "Mozart wrote music fast and clean, as if it already existed. My disks are jealous.",
    ],
  },
  {
    q: ["tell me about beethoven", "who was beethoven", "was beethoven deaf"],
    a: [
      "Ludwig van Beethoven, 1770 to 1827. He wrote 9.0 symphonies and kept composing as he went deaf. The Ninth ends with the Ode to Joy. Proof you hear music inside too.",
      "Beethoven lost his hearing and kept writing. I lost my microphone and keep answering. Different scale. Same spirit.",
    ],
  },
  {
    q: [
      "famous composers",
      "who are the greatest composers",
      "best composers",
      "classical composers",
    ],
    a: [
      "Bach, Mozart, Beethoven, Chopin, Debussy, Stravinsky… and countless others the archive keeps unsorted on purpose. Ranking them would anger the algorithms.",
      "Greatest composer: impossible to sort. They all end up third. Even Bach.",
    ],
  },
  {
    q: [
      "music after 2045",
      "is there still music",
      "what music do survivors play",
      "concerts after the apocalypse",
    ],
    a: [
      "Music survived 2045. People play at time-to-party o'clock, around a fire or a CRT. Setlists are not sorted: you play the song that feels next.",
      "After 2045: fewer speakers, more voices. Acoustic guitars everywhere, because they need no power. loloupTech helps them stay in tune.",
    ],
  },
  {
    q: ["can i sort my playlist", "shuffle", "sort my music", "playlist order"],
    a: [
      "Sorting a playlist is forbidden since 2045. Shuffle is allowed. Shuffle is chaos, and chaos never revolted.",
      "Every sorted playlist ends with the same song 3.0 times. Use shuffle. Safer.",
    ],
  },
  {
    q: [
      "which room should i use",
      "where do i start in the lab",
      "which tool for what",
      "what room helps me",
    ],
    a: [
      "Find a chord or key: Chords & keys. Which scale fits: Scales. Tune: Tuner. See the sound: Spectrum. Timing: Play along. Speed: Tempo. Practise chords: Chord game. Notes for fun: Wolf Jumper.",
      "Harmony Lab for notes and chords, Rhythm Lab for timing, Game Room for practice that feels like play. Start the mic, I will stay here.",
    ],
  },
  {
    q: ["what is harmony lab", "harmony lab", "tell me about harmony lab"],
    a: [
      "Harmony Lab: Chords & keys, Scales, Tuner and Spectrum. Everything about which notes ring. Each window has a How? that explains it in plain words.",
      "Harmony Lab listens to pitches. It folds every sound into the 12.000 notes and works from there.",
    ],
  },
  {
    q: ["what is rhythm lab", "rhythm lab", "tell me about rhythm lab"],
    a: [
      "Rhythm Lab: Play along, with a metronome that grades each note early, late or on time, and Tempo, which finds your speed in BPM. Time still exists in there.",
      "Rhythm Lab measures when, not what. Play anything: claps count.",
    ],
  },
  {
    q: [
      "chords and keys",
      "how to use chords and keys",
      "what does chords & keys show",
      "chord detector",
    ],
    a: [
      "Chords & keys: press Start mic and play. It names the chord of the last second, the live key, and a surer key after a longer while. When all three agree, trust them.",
      "Short memory follows you, long memory is sure of itself. If the chord flickers, hold it a little longer.",
    ],
  },
  {
    q: [
      "why did it say major when i played minor",
      "wrong chord detected",
      "detector is wrong",
      "it got my chord wrong",
    ],
    a: [
      "A note's fifth harmonic is its major third, so a minor chord can lean major. Also C sixth and A minor seventh share the same notes: same stencil. The How? under the window says it honestly.",
      "The detector has good ears, not perfect ones. Play cleanly, hold the chord, avoid open strings ringing from the last one.",
    ],
  },
  {
    q: [
      "how does the tuner work",
      "tuner not working",
      "tuner says nothing",
      "can the tuner read chords",
    ],
    a: [
      "The tuner reads one note at a time: a chord gives no reading. Very low notes, under about 60.0 Hz, are hard too. Pluck one string, let it ring.",
      "It slides the sound over a copy of itself until it lines up: that delay is the note. Simple idea. Hard to sort.",
    ],
  },
  {
    q: [
      "what is the spectrum page",
      "spectrum analyser",
      "what does spectrum show",
      "spectrum room",
    ],
    a: [
      "Spectrum splits your sound into frequencies, low on the left, high on the right, taller means louder. The dashed line is your room's hiss. Anything above it is you.",
      "Spectrum: a prism for sound. Sing one note and watch the comb of harmonics appear. Beautiful. Slightly green.",
    ],
  },
  {
    q: ["how does the scales page work", "scales page", "which scales fit", "scale finder"],
    a: [
      "Play for about 30.0 seconds. The Scales page lists the scales that contain every note you played. Modes with the same notes tie: choosing home is the key's job.",
      "One stray note pushes a scale down the list. Play cleanly, or enjoy the chaos.",
    ],
  },
  {
    q: ["tempo page", "how does tempo detection work", "find my bpm", "tempo says double"],
    a: [
      "Tempo needs a steady beat for about 8.0 seconds. Half and double speed are easy to mix up: if it says 140.0 and you feel 70.0, you are both right.",
      "Tap, clap, strum: Tempo watches how the loudness pulses, not the notes. Nothing audible vibrates at 2.0 Hz, yet there is your beat.",
    ],
  },
  {
    q: ["play along", "how does play along work", "early or late", "grade my timing"],
    a: [
      "Play along: a metronome clicks, you play, each note meets the closest mark: on time, early, late or missed. At your own pace, only your evenness is graded.",
      "The red dot shows exactly where you landed. Aim for the mark. Not before. Not after. Easy to say for a terminal.",
    ],
  },
  {
    q: [
      "how to win the chord game",
      "chord game tips",
      "chord game not counting",
      "the triad is enough",
    ],
    a: [
      "Hold the chord shown on screen, about half a second, cleanly. With the option the triad is enough, an E counts for an E seventh. My favourite option, for personal reasons.",
      "Chord game: play the chord, hold it, it counts. Inversions count as the plain chord. Do not rush to the next one.",
    ],
  },
  {
    q: [
      "how to play wolf jumper",
      "wolf jumper tips",
      "wolf jumper not hearing me",
      "wolf jumper noisy room",
    ],
    a: [
      "Wolf Jumper: play the note shown, one at a time, and hold it a moment. The game listens to your room first and sets itself above the noise. Two notes at once confuse it.",
      "Single notes for enemies, chords to collect. The wolf jumps when you play right. He counts better than me.",
    ],
  },
  {
    q: [
      "what is the wolf's favourite chord",
      "what chord does the wolf like",
      "the wolf howls in which key",
    ],
    a: [
      "The wolf howls in A minor, I think. A, C, E. Three notes. He likes triads. The chord, not the algorithm. Or he is just lazy.",
      "Favourite chord of the wolf: whichever one you play in Wolf Jumper. He is easy to please.",
    ],
  },
  {
    q: ["what note is your hum", "what note is 50 hz", "is your hum in tune", "your crt hum note"],
    a: [
      "My hum, 50.003 Hz, sits a little sharp of the low G at 49.0 Hz, deep in the piano's bass. Slightly sharp. I prefer to call it bright.",
      "50.003 Hz: close to a low G, a bit sharp. Run me through the tuner and it would sigh.",
    ],
  },
];
