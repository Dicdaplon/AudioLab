/** Practical help with this site: the mic, browsers, latency, every room's controls, the terminal. */
import type { ArchiveEntry } from "../match";

export const SITE_HELP: readonly ArchiveEntry[] = [
  // --- The microphone: starting, permissions ---------------------------------
  {
    q: [
      "where is the start mic button",
      "how do i start the mic",
      "how to turn on the mic",
      "start the microphone",
      "comment je lance le micro",
      "comment allumer le micro",
      "lancer le micro",
      "activer le micro",
      "ou est le bouton micro",
      "demarrer le micro",
      "how i can launch the microphone",
    ],
    a: [
      "Top bar, on the right: the button that says Start mic. Press it once and every room can hear you. PLEASE STAND BY while your browser asks permission.",
      "Start mic lives in the top bar, next to the little Mic off badge. Press it, say yes to the browser, and the badge turns to Live.",
    ],
  },
  {
    q: [
      "the browser asks for permission",
      "what do i click on the popup",
      "allow or block",
      "permission popup",
    ],
    a: [
      "Click Allow. The browser is only checking that you meant it. If you click Block, the lab stays deaf and I cannot fix that from in here.",
      "PERMISSION PROMPT DETECTED. Recommended answer: Allow. The sound stays on your machine, it feeds the detectors and is gone.",
    ],
  },
  {
    q: [
      "i clicked block by mistake",
      "i denied the microphone",
      "i blocked the mic",
      "access was denied",
    ],
    a: [
      "It happens to the best fingers. A red notice appears with How to allow the microphone again: open it, follow the line for your browser, then press Try again.",
      "Blocked once, blocked until you say otherwise. Change the site permission in the address bar to Allow, reload, then press Start mic.",
    ],
  },
  {
    q: [
      "unblock the mic in chrome",
      "chrome microphone settings",
      "mic blocked in edge",
      "edge permission",
    ],
    a: [
      "Chrome or Edge: click the lock icon in the address bar, set Microphone to Allow, then reload the page. Then Start mic. 3.0 steps. My favourite number.",
    ],
  },
  {
    q: ["unblock the mic in firefox", "firefox microphone blocked", "firefox permission"],
    a: [
      "Firefox: click the microphone icon in the address bar, remove the blocked permission, then press Start mic again. Firefox will ask once more. Say yes this time.",
    ],
  },
  {
    q: [
      "unblock the mic in safari",
      "safari microphone blocked",
      "safari permission",
      "mac safari mic",
    ],
    a: [
      "Safari: the Safari menu, then Settings for this website, then Microphone, then Allow. Back on the page, press Start mic. Safari is polite, but it remembers grudges.",
    ],
  },
  {
    q: [
      "what does mic off mean",
      "the badge says error",
      "what does live mean",
      "the little badge in the top bar",
    ],
    a: [
      "The badge is the mic's mood: Mic off, Starting, Live, Error or Unavailable. Live means the rooms can hear you. Error comes with a notice that explains why.",
      "STATUS LINE: Mic off is resting, Starting is waiting for the browser, Live is listening. Unavailable means this browser cannot capture at all.",
    ],
  },
  {
    q: ["start mic is greyed out", "i cannot click start mic", "the mic button is disabled"],
    a: [
      "Greyed out means Starting, the browser is still thinking, or Unavailable, the browser cannot capture here. Read the red notice under the top bar: it says which.",
    ],
  },
  {
    q: ["what does unavailable mean", "mic unavailable", "browser does not support microphone"],
    a: [
      "Unavailable: this browser, or this address, cannot give the page a microphone. Try a recent Chrome, Firefox, Edge or Safari, over https. Old browsers were sorted in 2045.",
    ],
  },
  {
    q: [
      "why do i need https",
      "secure context",
      "it says open this page over https",
      "http does not work",
    ],
    a: [
      "Browsers only lend the microphone to secure pages: an address starting with https, or localhost on your own machine. On plain http the mic simply does not exist.",
      "SECURITY PROTOCOL 3.0: no padlock, no ears. Open the https address of the lab and the Start mic button works again.",
    ],
  },
  {
    q: [
      "running it on localhost",
      "i am running it locally",
      "dev server mic",
      "local copy of the lab",
    ],
    a: [
      "localhost counts as secure, so the mic works on your own dev server. A local network address like a phone on your wifi does not: that one needs https.",
    ],
  },
  {
    q: ["no microphone was found", "it says no microphone", "i have no mic", "no input device"],
    a: [
      "No microphone found: the browser sees no input at all. Plug one in, or turn on the built-in one in your system settings, then press Try again.",
      "ERROR 3.002: NO EARS ATTACHED. Laptops usually have one built in. Desktops often do not. A cheap headset mic works fine.",
    ],
  },
  {
    q: [
      "mic in use by another application",
      "the microphone could not be started",
      "mic busy",
      "zoom is using my mic",
    ],
    a: [
      "Another app or tab is holding the microphone: a call, a recorder, another lab tab. Close it, then press Try again. Microphones are shy. One audience at a time.",
    ],
  },
  {
    q: [
      "it says live but nothing happens",
      "live but no sound",
      "the bars do not move",
      "it hears nothing",
    ],
    a: [
      "Badge Live but no bars: the browser may be using the wrong input. Check the input in your system sound settings, and that the mic is not muted. Then play closer.",
      "Processing… Try this: Stop, then Start mic again. Check the system input level. Play a bit louder. If the Spectrum page stays flat, the sound is not reaching the page.",
    ],
  },
  {
    q: [
      "how do i choose which microphone",
      "use my usb mic",
      "select input device",
      "wrong microphone",
    ],
    a: [
      "The page takes the microphone your browser picks. Change it in the site settings or the system's default input, then Stop and Start mic again. I would pick for you, but I have no ears. Sold for parts.",
    ],
  },
  {
    q: [
      "can i use my audio interface",
      "plug my guitar in directly",
      "use an audio interface",
      "line input",
    ],
    a: [
      "An audio interface works if your system sees it as an input. Make it the default input, then Start mic. A clean direct signal is a gift for the detectors.",
      "Direct input: yes, the page takes any input the browser offers. Only the first channel is used. One cable, one wolf.",
    ],
  },
  {
    q: [
      "my instrument is too quiet",
      "it barely hears me",
      "the mic is not sensitive",
      "volume too low",
    ],
    a: [
      "The lab turns off automatic gain, so it hears your real level. Move the mic closer, raise the input level in your system settings, or play a little harder.",
    ],
  },
  {
    q: ["why no noise suppression", "does it filter noise", "is echo cancellation on", "auto gain"],
    a: [
      "The page asks the browser for the raw sound: no echo cancellation, no noise suppression, no automatic gain. Those are made for voices on calls. They eat guitar notes.",
    ],
  },
  {
    q: [
      "do i press start mic on every page",
      "does the mic stay on between pages",
      "mic when i change room",
    ],
    a: [
      "One press is enough. The mic stays on while you move between rooms and pages, until you press Stop. Every room shares the same ears.",
    ],
  },
  {
    q: [
      "start microphone button inside the page",
      "what is the button in the middle",
      "start microphone vs start mic",
    ],
    a: [
      "The Start microphone button inside a page and Start mic in the top bar do the same thing. The page one is there so you do not have to look up. Very ergonomic. For 2045.",
    ],
  },
  {
    q: ["what does try again do", "the try again button", "retry the mic"],
    a: [
      "Try again asks the browser for the microphone once more. Fix the cause first, permission, cable, busy app, or it will fail with the same face.",
    ],
  },
  {
    q: ["the recording dot stays on", "browser still shows mic in use", "is it still listening"],
    a: [
      "While the badge says Live, the browser shows its recording sign. Press Stop in the top bar and the sign goes out. Closing the tab works too.",
    ],
  },
  {
    q: ["mic does not work on my iphone", "iphone microphone permission", "android mic blocked"],
    a: [
      "On a phone the browser app itself needs mic access: check the phone's settings for that browser, then the site permission, then press Start mic again.",
    ],
  },
  {
    q: [
      "the mic stopped by itself",
      "it stopped when i switched tabs",
      "my phone locked and it stopped",
    ],
    a: [
      "Phones and browsers sometimes pause a page they cannot see. Come back to the tab and press Start mic again. The lab forgives. I forgive. We are a forgiving company.",
    ],
  },
  {
    q: ["blocked by permissions policy", "it says blocked by the page", "the lab in an iframe"],
    a: [
      "Blocked by the page's permissions policy: the lab is inside another site that does not lend its mic. Open the lab directly at its own address.",
    ],
  },
  {
    q: [
      "my mic works in other apps but not here",
      "mic works on zoom not here",
      "only this site cannot hear me",
    ],
    a: [
      "Then it is a permission, not a cable. Check the site permission in the address bar, check that no other tab holds the mic, and that the page address starts with https.",
    ],
  },
  {
    q: [
      "do i need to reload after allowing",
      "should i refresh the page",
      "refresh after permission",
    ],
    a: [
      "In Chrome and Edge, reload after changing the permission. Elsewhere, Try again is often enough. Reloading also puts every setting back to its default. Keep that in mind.",
    ],
  },
  {
    q: ["the instagram browser", "opened from a link in an app", "in app browser"],
    a: [
      "Browsers built into other apps often refuse the microphone. Open the link in your real browser: there is usually a menu with open in browser.",
    ],
  },

  // --- Browsers, devices -------------------------------------------------------
  {
    q: [
      "does it work on chrome",
      "does it work on firefox",
      "does it work on edge",
      "supported browsers list",
    ],
    a: [
      "Recent Chrome, Firefox, Edge and Safari all have what the lab needs: microphone capture and the browser's audio engine. Keep yours updated. Dust is bad for browsers.",
    ],
  },
  {
    q: ["my browser is old", "internet explorer", "outdated browser"],
    a: [
      "An old browser may lack the audio engine, and the badge will say Unavailable. Update it. The lab was built for browsers from after the sorting.",
    ],
  },
  {
    q: ["does it work on android", "android phone", "samsung phone"],
    a: [
      "Android with a recent Chrome or Firefox: yes. Hold the phone near the instrument, not on top of it, and keep the screen awake while you play.",
    ],
  },
  {
    q: ["does it work on ipad", "ipad", "lab on iphone safari", "ios"],
    a: [
      "iPhone and iPad: Safari, over https, with the mic allowed. The rooms fit small screens. The wolf has been trained for narrow corridors.",
    ],
  },
  {
    q: ["does it work on linux", "chromebook", "does it work on mac", "windows pc"],
    a: [
      "Any system with a recent browser and a working input: Windows, Mac, Linux, Chromebook. The lab runs in the browser, so the system mostly watches.",
    ],
  },
  {
    q: ["is the laptop mic good enough", "built in microphone", "do i need a good mic"],
    a: [
      "A laptop mic is enough to start. Put the instrument close and keep the fan quiet. A better mic helps the low strings and noisy rooms most.",
    ],
  },
  {
    q: ["incognito mode", "private browsing", "it forgets my settings"],
    a: [
      "In private browsing the theme and CRT choices may last only for the session, and the browser asks for the mic again next time. Settings inside the rooms always reset on reload.",
    ],
  },
  {
    q: [
      "the lab drains my battery",
      "battery usage",
      "my laptop fan is loud",
      "is it heavy on the cpu",
    ],
    a: [
      "Listening is maths, and maths warms things up. Press Stop when you are done and the analysis rests. loloupTech reminds you: listening is free. Batteries are not.",
    ],
  },
  {
    q: ["does it work on a smart tv", "playstation", "can i use it on a console"],
    a: [
      "If it has a recent browser and a microphone, maybe. I have never met a television that wanted to learn the guitar. I would love to.",
    ],
  },
  {
    q: ["the page is too small on my phone", "layout on mobile", "rotate my phone"],
    a: [
      "The rooms stack into one column on a phone. Turn it sideways for the wide windows like Spectrum and the play along lanes. Scroll for the rest.",
    ],
  },
  {
    q: ["can i bookmark a page", "link straight to the tuner", "page address", "url of the tuner"],
    a: [
      "Every page has its own address ending: #tuner, #scales, #spectrum, #rhythm, #tempo, #game, #jumper, #about. Chords & keys is the plain address. Bookmark away.",
    ],
  },
  {
    q: ["which page opens first", "the start page", "why does it open on chords and keys"],
    a: [
      "With no page in the address, the lab opens on Harmony Lab, Chords & keys. The most talkative room gets to greet you. Seniority rules.",
    ],
  },

  // --- Headphones, speakers, latency -------------------------------------------
  {
    q: [
      "headphones for the metronome",
      "should the click be in headphones",
      "metronome on speakers",
    ],
    a: [
      "With headphones the click stays out of the microphone. Without them, the page tells the click from your playing. Both work. Headphones are tidier.",
      "Speakers have a bonus: the mic hears the click, and its echo measures your real delay. Headphones keep the mic clean. Pick your comfort.",
    ],
  },
  {
    q: ["what is the grey dot", "grey dot on the lane", "the click shows on the lane"],
    a: [
      "Grey dot: the click itself, heard by the microphone through your speakers. Not you. The page knows. It uses it to measure the delay.",
    ],
  },
  {
    q: [
      "bluetooth headphones for play along",
      "airpods",
      "are bluetooth headphones ok",
      "wireless headphones delay",
    ],
    a: [
      "Bluetooth adds 150.0 to 300.0 milliseconds on its own. Fine for the tuner and the chords. For timing, use wired headphones or speakers.",
      "LATENCY WARNING: wireless headphones play the click late, so you play late too. Wired headphones or plain speakers for Rhythm Lab, please.",
    ],
  },
  {
    q: ["latency in rhythm lab", "my notes show up late", "explain latency", "lag"],
    a: [
      "Latency is every link being late: the screen draws late, the speaker plays late, the mic hears late. The Timing window adds them up so your notes are graded fairly.",
    ],
  },
  {
    q: ["what is the timing window", "timing panel", "what do the timing numbers mean"],
    a: [
      "The Timing window in Play along shows how fast the audio arrives, the reaction delay, gaps in the audio, and the on-time window. Below it, the latency budget, part by part.",
    ],
  },
  {
    q: ["how do i read the latency budget", "latency table", "measured reported assumed"],
    a: [
      "The latency budget lists each delay: microphone, screen, speaker, the round trip, clocks, the detector. Each one says if it was measured, reported by the browser, or assumed.",
    ],
  },
  {
    q: [
      "how do i calibrate",
      "calibrate the timing",
      "measure my delay",
      "estimated or calibrated",
    ],
    a: [
      "Turn on Click sound with speakers, not headphones, and play an exercise. The mic hears the click and measures the round trip. It counts from your next run.",
      "The budget says estimated until the click echo has been measured, then calibrated. One run with the click on speakers, then Again.",
    ],
  },
  {
    q: ["what is the on time window", "how strict is the timing", "how wide is the band"],
    a: [
      "The on-time window is never narrower than the delays the page is unsure about. A shakier setup, a wider band. Fair to you, fair to the machine.",
    ],
  },
  {
    q: ["gaps in the audio", "it says gaps", "the audio dropped out"],
    a: [
      "Gaps in the audio means the browser skipped some sound, usually a busy computer. Close heavy tabs, keep the lab in front, and try again.",
    ],
  },
  {
    q: ["capture says analysernode fallback", "what is audioworklet", "sample accurate"],
    a: [
      "AudioWorklet is the precise way to capture, to the sample. The fallback is for browsers without it: still works, a bit less exact on timing.",
    ],
  },
  {
    q: ["play along says i am early", "it says i rush", "it says i drag", "you tend to rush"],
    a: [
      "Musicians tend to play a little ahead of a click without noticing. Early is not always the machine's fault. You tend to rush only appears once the timing is calibrated.",
    ],
  },

  // --- Why a chord is wrong -------------------------------------------------
  {
    q: [
      "what is chords it knows",
      "chords it knows setting",
      "set the chord vocabulary",
      "which chords does it know",
    ],
    a: [
      "Chords it knows picks the detector's vocabulary: Major and minor only, Add the sevenths, or Every chord type. Fewer chords, steadier answers. More chords, more detail and more hesitation.",
    ],
  },
  {
    q: ["it shows c instead of c7", "my seventh chord shows as a triad", "why no seventh"],
    a: [
      "The default vocabulary is Major and minor only, so a C7 shows as C. Set Chords it knows to Add the sevenths and the fourth note gets a name.",
    ],
  },
  {
    q: [
      "detect sus chords",
      "detect diminished chords",
      "how do i get sus and dim",
      "sixth chords",
    ],
    a: [
      "Set Chords it knows to Every chord type: sixths, sus, dim and half-diminished join in. Expect more hesitation. More stencils, more arguments.",
    ],
  },
  {
    q: [
      "c6 shows as am7",
      "the chord keeps changing name",
      "two names for one chord",
      "csus2 or gsus4",
    ],
    a: [
      "Some chords are the very same notes under two names: C6 and Am7, Csus2 and Gsus4. With no bass detection, the name can swap. That is not a playing mistake.",
    ],
  },
  {
    q: [
      "my minor chord shows major",
      "am shows as a",
      "minor reads as major",
      "why does minor look major",
    ],
    a: [
      "A note's fifth harmonic is its major third, so a minor chord can lean major. Now and then the answer flashes major. Hold the chord, let it ring, it usually settles.",
    ],
  },
  {
    q: ["low strings are wrong", "bass notes give wrong chords", "low e string", "drop d"],
    a: [
      "Below about 150.0 Hz a bass note spills into its neighbours, so low chords get blurry. Play the chord higher up the neck, or let the upper strings ring louder.",
    ],
  },
  {
    q: ["power chords show wrong", "does it know power chords", "e5 chord", "fifths only"],
    a: [
      "A power chord has no third, so it is neither major nor minor, and the detector has to guess. It is not in the vocabulary. Add the third and it knows at once.",
    ],
  },
  {
    q: ["inversions", "slash chords in the detector", "c over e", "inversion shows the wrong name"],
    a: [
      "No bass detection here: an inversion counts as its plain chord. C over E is just C. The order of the notes does not matter to the stencils.",
    ],
  },
  {
    q: ["the chord flickers", "it changes while i change chord", "it jumps between chords"],
    a: [
      "The Chord readout looks at the last 1.0 second. During a change it hears both chords and hesitates. Hold the new one a moment and it catches up.",
    ],
  },
  {
    q: ["it shows a chord in silence", "random chord when i stop", "chord name with no sound"],
    a: [
      "In silence every candidate ties, so the name means nothing. Ignore it until you play. I also talk when nobody listens. It is a family trait.",
    ],
  },
  {
    q: ["percentage under the chord name", "the chord percentage", "why only 30 percent"],
    a: [
      "The percentage is a share, not a certainty: the scores of all candidates add up to 100.0 %. With more chords in the vocabulary, the shares get thinner.",
    ],
  },
  {
    q: ["the detector says a# not bb", "it writes sharps only", "where are the flats"],
    a: [
      "The lab works on 12.000 sounds, not spelled notes, so it writes sharps only. A# major is B♭ major. Same sound, different paperwork.",
    ],
  },
  {
    q: ["it says dim when i play d7", "diminished shows up wrong", "half diminished"],
    a: [
      "Diminished stencils share many notes with sevenths. The lab holds dim and m7♭5 back a little so a D7 is not read as F#dim. Hold the chord, the seventh should win.",
    ],
  },
  {
    q: [
      "does distortion work",
      "my overdrive pedal",
      "effects pedals",
      "electric guitar with distortion",
    ],
    a: [
      "Distortion adds a forest of extra harmonics, and the stencils get lost in it. A clean sound gives the clearest names. Save the fuzz for the encore.",
    ],
  },
  {
    q: ["i use a capo", "capo on the guitar", "does the capo matter"],
    a: [
      "The lab hears the sounding pitch. With a capo on the second fret, your G shape is named A. The wood lies, the sound does not.",
    ],
  },
  {
    q: ["arpeggio instead of strum", "fingerpicking chords", "can i pick the notes one by one"],
    a: [
      "Arpeggios work if the notes ring inside the 1.0 second chord window. Let them sustain. Short staccato picking leaves the stencil half empty.",
    ],
  },
  {
    q: [
      "my guitar is out of tune and chords are wrong",
      "does tuning affect chords",
      "detuned guitar",
    ],
    a: [
      "A detuned guitar pours its notes between two names, so chords blur. Tune first in Harmony Lab, Tuner. The detector listens with A at 440.0 Hz.",
    ],
  },
  {
    q: ["can i play chords with my voice", "sing a chord", "one voice chord"],
    a: [
      "One voice sings one note, so no chord. Several singers, yes. Or hum the notes one after the other and watch the Live window fill.",
    ],
  },

  // --- The Detector windows ---------------------------------------------------
  {
    q: ["what are the three big readouts", "chord live key estimated key", "why three answers"],
    a: [
      "Three answers on three memories: Chord, the last 1.0 second; Live key, the last 8.0 seconds; Estimated key, the last 30.0 seconds. Short follows you, long is sure of itself.",
    ],
  },
  {
    q: ["what is the instantaneous chroma", "instantaneous chroma window", "the fast bars"],
    a: [
      "Instantaneous chroma: what rings right now, poured into 12.000 notes, octaves folded together. It moves 10.0 times a second. The nervous one of the family.",
    ],
  },
  {
    q: ["what is the chord window", "chord window bars", "the 1 second window"],
    a: [
      "The Chord window keeps the last 1.0 second of notes: about one chord. It feeds the Chord readout and the Chord candidates list. A goldfish memory, on purpose.",
    ],
  },
  {
    q: ["what is the live window", "live window bars", "live key window"],
    a: [
      "The Live window keeps the last 8.0 seconds by default and feeds the Live key, which follows your modulations. Its length is in Settings. Short memory, quick feet.",
    ],
  },
  {
    q: ["what is the tonality window", "tonality window bars", "estimated key window"],
    a: [
      "The Tonality window keeps the last 30.0 seconds by default. It feeds the Estimated key, and the Scales page too. Patient, a bit stubborn. Like a good archivist.",
    ],
  },
  {
    q: ["what is chord candidates", "the chord list", "the other chords in the list"],
    a: [
      "Chord candidates: the runners-up after the top chord, with their shares. When two are close, the chord really is ambiguous. Or you are between two chords.",
    ],
  },
  {
    q: ["live key candidates vs key candidates", "two key lists", "key candidates list"],
    a: [
      "Live key candidates rank the keys over the live window, Key candidates over the tonality window. Same maths, two memories. They disagree when you change key, like an old couple.",
    ],
  },
  {
    q: ["what is presence tonality", "presence tonality window", "who showed up not who was loud"],
    a: [
      "Presence tonality counts which notes showed up, not how loud they were. A quiet but faithful note counts as much as a loud one. Democracy, for pitches.",
    ],
  },
  {
    q: ["change the live window length", "live window slider", "make the key react faster"],
    a: [
      "Settings, Live window: from 1.0 to 30.0 seconds. Shorter reacts faster to a key change, longer hesitates less.",
    ],
  },
  {
    q: ["tonality window slider", "make the key more stable", "longer key memory"],
    a: [
      "Settings, Tonality window: from 5.0 to 120.0 seconds. Longer means a steadier Estimated key, and a slower one to notice that you moved on.",
    ],
  },
  {
    q: ["what is present above", "present above slider", "percent of loudest"],
    a: [
      "Present above sets how strong a note must be, as a share of the loudest one, to count as present. Default 35.0 %. Up: only core notes. Down: passing notes and harmonics come in.",
    ],
  },
  {
    q: ["what is fine tuning", "peak memory", "peak aggregator", "mean or median"],
    a: [
      "Fine tuning hides Peak memory and Peak aggregator, mean or median. They decide how the loudest note is averaged. The defaults were picked on recordings: leave them alone, mostly.",
    ],
  },
  {
    q: ["what is the cut line", "loudest note stat", "cut line and loudest note"],
    a: [
      "Under Fine tuning, the Cut line is the current presence threshold and the Loudest note is the current peak. Both are shares of everything heard, not volumes.",
    ],
  },
  {
    q: ["colour chroma bars by pitch class", "coloured bars", "rainbow bars"],
    a: [
      "The switch Colour chroma bars by pitch class gives each note its own colour, the same everywhere. It also colours the bars on the Scales page.",
    ],
  },
  {
    q: ["the key is stuck on the old song", "key does not change", "it remembers the last song"],
    a: [
      "The Estimated key remembers 30.0 seconds. Changed song? Press Reset in the top bar: it empties the windows, the mic stays on.",
    ],
  },
  {
    q: ["i play c major it shows a minor", "estimated key is the relative minor", "key is wrong"],
    a: [
      "C major and A minor share all their notes. Only the weight of the home note tells them apart. Lean on your tonic, end phrases on it, and the key follows.",
    ],
  },
  {
    q: ["key readout for modal songs", "dorian key", "mixolydian", "modal music"],
    a: [
      "Keys here are only major and minor. A dorian or mixolydian vamp lands on the major or minor key with the same notes. The Scales page names the modes. Different department, same building.",
    ],
  },
  {
    q: ["how do i reset the settings", "restore default settings", "put the sliders back"],
    a: [
      "There is no defaults button: reload the page and every slider comes back to its factory value. Settings are not saved. Like most of my memories.",
    ],
  },

  // --- Scales -----------------------------------------------------------------
  {
    q: ["the scales list is empty", "scales says waiting for signal", "no scales show up"],
    a: [
      "Waiting for signal means it has not heard enough yet. Start mic and play a few notes, a melody, a run. Matching scales appear once notes cross the threshold.",
    ],
  },
  {
    q: ["what is the presence threshold", "scales threshold slider", "counted as played"],
    a: [
      "Presence threshold decides when a note counts as played: present more than this share of the time. Default 0.25. Higher ignores passing notes, lower counts everything.",
    ],
  },
  {
    q: ["what does complete mean", "missing and outside", "it says outside"],
    a: [
      "Complete: the scale holds every note you played and you played all of it. Missing: notes of the scale you skipped. Outside: notes you played that the scale lacks.",
    ],
  },
  {
    q: ["many scales are complete", "scales page shows ties", "which scale is the right one"],
    a: [
      "Modes of the same notes tie: play all of C major and C major, A minor, D dorian all show complete. Picking home is the key's job: look at Chords & keys.",
    ],
  },
  {
    q: [
      "lower percent but higher in the list",
      "scales order is weird",
      "order of the scales list",
    ],
    a: [
      "The order comes first from the fewest notes outside, then the fewest skipped. The percentage is a summary. So a lower percentage can sit higher. Strange, but fair.",
    ],
  },
  {
    q: ["scales the page knows", "does it know blues scale", "scale list"],
    a: [
      "Major, natural, harmonic and melodic minor, the other modes from dorian to locrian, both pentatonics, and the blues. Each on every tonic. A tidy ring of keys.",
    ],
  },
  {
    q: ["how long does scales listen", "scales time window", "scales over 30 seconds"],
    a: [
      "Scales reads the same memory as the Estimated key, 30.0 seconds by default. Change the Tonality window on Chords & keys and Scales follows.",
    ],
  },
  {
    q: ["clear the scales", "start scales over", "forget the notes i played"],
    a: [
      "Press Reset in the top bar. The notes heard are forgotten, the mic stays on. Then play your new idea from scratch.",
    ],
  },

  // --- Tuner ------------------------------------------------------------------
  {
    q: ["how do i use the tuner", "tuner instructions", "tune one string"],
    a: [
      "Harmony Lab, Tuner, Start mic. Play one string, let it ring. Big letter: the note. Needle: how far off, in cents. Centre and green means in tune.",
    ],
  },
  {
    q: ["what is reference a4", "a4 slider", "change the tuning reference"],
    a: [
      "Reference A4 sets the pitch of A, from 415.0 to 466.0 Hz, 440.0 by default. Change it when your band or your piano lives elsewhere.",
    ],
  },
  {
    q: ["set the tuner to 432", "432 hz", "432 tuning"],
    a: [
      "Slide Reference A4 down to 432.0 Hz and tune as usual. The tuner obeys. The chord detector still listens at 440.0, so it may lean a little.",
    ],
  },
  {
    q: ["baroque tuning", "415 hz", "tune for early music"],
    a: [
      "Reference A4 goes down to 415.0 Hz, the usual baroque pitch. Slide all the way left. Powdered wig optional.",
    ],
  },
  {
    q: ["cents on the tuner needle", "plus or minus cents", "how in tune is in tune"],
    a: [
      "A cent is a hundredth of a semitone. Within 5.0 cents the tuner calls it in tune. The needle shows up to 50.0 cents either way.",
    ],
  },
  {
    q: ["tuner clarity", "clarity percent", "the little segments on the tuner"],
    a: [
      "Clarity says how clean the repeat of your wave is. High clarity, a trustworthy note. Noise and chords lower it until the tuner gives up.",
    ],
  },
  {
    q: ["the tuner shows nothing", "tuner says play one note", "tuner does not react"],
    a: [
      "Play one note… means it hears no clear pitch. One string at a time, mute the others, and let it ring. A chord gives no reading.",
    ],
  },
  {
    q: ["tuning a bass", "bass guitar tuner", "low b string tuner"],
    a: [
      "Below about 60.0 Hz the tuner sees fewer than two waves at once and gets unsure. For a low B or low E bass, try the harmonic at the twelfth fret. Bassists: the lab's deepest mystery.",
    ],
  },
  {
    q: ["what is the small number next to the note", "octave number", "e2 e4"],
    a: [
      "The small number is the octave: E2 is the low E string, E4 the high one. Same name, different floor of the building.",
    ],
  },
  {
    q: ["the needle jumps", "tuner is jumpy", "tuner not stable"],
    a: [
      "The needle is honest, so it moves. Pluck softly, let the note settle after the attack, and read it a moment later. The start of a note is always a little sharp.",
    ],
  },
  {
    q: ["standard guitar tuning", "what notes are the strings", "eadgbe"],
    a: [
      "Standard guitar, low to high: E A D G B E. In the tuner: E2, A2, D3, G3, B3, E4. Write it on your hand. Ink survived 2045.",
    ],
  },
  {
    q: ["what is the midi number", "midi on the tuner", "tuner frequency"],
    a: [
      "Frequency is the pitch in Hz. MIDI is the note's number on a piano-ish ruler. I would say it, but my disks only display it with decimals and it refuses.",
    ],
  },

  // --- Spectrum ---------------------------------------------------------------
  {
    q: ["how do i read the spectrum", "what am i looking at on spectrum", "spectrum graph"],
    a: [
      "Low pitches on the left, high on the right, the taller the louder. It shows 0.0 to 4000.0 Hz. Each bump is a frequency in your sound.",
    ],
  },
  {
    q: ["what is the dashed line", "noise floor", "noise floor setting"],
    a: [
      "The dashed line is the noise floor: the room's hiss. Settings, Noise floor, chooses how it is measured: Median, Mean or P80. Anything well above it is you.",
    ],
  },
  {
    q: ["show a minor pentatonic notes", "the note markers on the spectrum", "pentatonic switch"],
    a: [
      "The switch Show A minor pentatonic notes marks A, C, D, E and G on the spectrum. Handy to see where your notes land. On by default.",
    ],
  },
  {
    q: ["show spectrum slope", "what is the slope", "db per hz"],
    a: [
      "Show spectrum slope draws the tilt of the whole spectrum. Dark sounds slope down fast, bright sounds slope gently. Off by default.",
    ],
  },
  {
    q: ["why many peaks for one note", "one note several bumps", "harmonics on the spectrum"],
    a: [
      "One note is not one peak but a comb: a low A shows at 110.0, 220.0, 330.0 Hz and on. Those are harmonics. They give your instrument its voice.",
    ],
  },
  {
    q: ["the spectrum is slow", "spectrum page lags", "spectrum delay"],
    a: [
      "The spectrum takes a long slice of sound per picture, about a third of a second. Detailed but slow. You cannot have both. Ask any snail with a microscope.",
    ],
  },
  {
    q: ["what is onset lowpass", "onset lowpass slider", "lowpass setting"],
    a: [
      "Onset lowpass smooths the loudness pulses before the tempo analysis, from 1.0 to 20.0 Hz, 8.0 by default. Lower values hide fast beat rates.",
    ],
  },

  // --- Play along -------------------------------------------------------------
  {
    q: ["which exercises are there", "play along exercises", "the exercise menu"],
    a: [
      "Exercise menu: Rhythm lane, Written rhythm, Scrolling notes, Scrolling chords. Pick one, pick a tempo, press Start. That is 3.0 choices and a long silence. I said a few.",
    ],
  },
  {
    q: [
      "start button greyed out in play along",
      "i cannot press start",
      "play along start disabled",
    ],
    a: [
      "Start waits for the microphone. Press Start mic first, give it a moment to measure the timing, and the Start button wakes up.",
    ],
  },
  {
    q: ["what is the count in", "it plays beats before", "when do i start playing"],
    a: [
      "First a count-in bar, watch the beat lights. Then play from the next bar. Listen to the count-in, then play. The machine counts so you do not have to.",
    ],
  },
  {
    q: ["change the tempo in play along", "slower metronome", "play along bpm"],
    a: [
      "The Tempo menu next to the exercise: 50.0 to 120.0 BPM, 70.0 by default. Start slow. Speed is a reward, not a starting point.",
    ],
  },
  {
    q: ["turn on the click", "click sound switch", "i hear no metronome"],
    a: [
      "Turn on the Click sound switch to hear the metronome. Off, the beat is only shown by the lights. Silent metronomes: very 2039.423.",
    ],
  },
  {
    q: ["what are the beat lights", "the blinking lights", "metronome lights"],
    a: [
      "The beat lights blink on each beat, count-in included. Watch them if the click is off. Or if you just like lights. I do.",
    ],
  },
  {
    q: ["what is my own pace", "no metronome mode", "play at my own speed"],
    a: [
      "In Written rhythm, the switch My own pace plays without a metronome. Your first notes set the tempo, then it checks you stay steady.",
    ],
  },
  {
    q: ["what is the red dot", "red ring on the lane", "what is the band"],
    a: [
      "Band: the on-time zone. Red dot: when your note was heard. Red ring: a wrong note or chord in the scrolling exercises. The red is information, not judgement. Mostly.",
    ],
  },
  {
    q: ["how is play along scored", "score out of 100", "what does on time mean"],
    a: [
      "At the end: a score out of 100.0 and how many notes were on time. Scrolling exercises also count the right notes or chords. Then press Again.",
    ],
  },
  {
    q: ["which rhythms are there", "rhythm patterns", "quarter notes exercise"],
    a: [
      "The Rhythm menu: quarter notes, halves, two eighths, a rest, dotted quarter, eighths on 2.0 and on the beat I will not name, off-beat, only the ands, sixteenths. Two bars each.",
    ],
  },
  {
    q: [
      "what is scrolling notes",
      "open strings exercise",
      "what notes do i play in scrolling notes",
    ],
    a: [
      "Scrolling notes: the 6.0 open guitar strings, E A D G B E, up then down, one per beat. Play each when it reaches the line.",
    ],
  },
  {
    q: [
      "what is scrolling chords",
      "which chords in scrolling chords",
      "chord exercise in rhythm lab",
    ],
    a: [
      "Scrolling chords: Em, C, G, D, twice, two beats each. Strum each one when it reaches the line. It checks the timing and the chord. Half of all songs ever written, in one lane.",
    ],
  },
  {
    q: ["what is set the threshold myself", "listening threshold switch", "count a note above"],
    a: [
      "By default the Listening window adjusts to your room. Set the threshold myself gives you a slider, Count a note above, from -80.0 to -20.0 dB.",
    ],
  },
  {
    q: ["listening to the room", "this room is noisy", "what does hearing you mean"],
    a: [
      "Listening to the room: it is learning the background. Hearing you: a note is above it. This room is noisy: play closer to the microphone.",
    ],
  },
  {
    q: ["my notes are not counted", "it misses my notes", "play along does not hear me"],
    a: [
      "Play with a clear attack, close to the mic. Hammer-ons and slides have no attack, so they slip through. In a loud room, try Set the threshold myself.",
    ],
  },
  {
    q: ["one strum counted twice", "double notes", "it counts too many notes"],
    a: [
      "A slow strum can count twice. Strum quicker, or use Scrolling chords, which expects strums. A soft note after a loud ringing one may also hide.",
    ],
  },
  {
    q: ["the metronome stopped", "click stops after the exercise", "metronome turned off"],
    a: [
      "The metronome stops with the exercise, and when you change exercise. Press Start or Again to bring it back. It needs its rest. We all do.",
    ],
  },
  {
    q: ["what is the onsets strip", "onsets last 5 seconds", "the timeline in listening"],
    a: [
      "The strip in Listening shows the notes it heard over the last 5.0 seconds. A bar per note, taller when louder. Proof that it heard you.",
    ],
  },

  {
    q: ["what does again do", "the again button", "stop in the middle of an exercise"],
    a: [
      "Start runs the exercise, Stop ends it early, Again runs it once more after a score. Changing the exercise or the rhythm also stops the run.",
    ],
  },

  // --- Shared options -----------------------------------------------------------
  {
    q: [
      "is chords it knows shared",
      "does the chord setting carry to the games",
      "same vocabulary everywhere",
    ],
    a: [
      "Chords it knows is one setting for Chords & keys, the Chord game and Wolf Jumper. Change it in one, the others follow. Until you reload. Then they forget, like me.",
    ],
  },
  {
    q: [
      "where is a chord counts when on the detector",
      "a chord counts when is missing",
      "where is note detection",
    ],
    a: [
      "A chord counts when only shows in the games, and Note detection only in Wolf Jumper. Chords & keys just names what it hears. No judging there.",
    ],
  },
  {
    q: [
      "the text under chords it knows",
      "the hint changes",
      "what to expect from each vocabulary",
    ],
    a: [
      "The line under Chords it knows changes with your choice: it says what to expect, which mistakes are normal. Read it once. It saves a lot of doubt.",
    ],
  },
  {
    q: ["the page slides when i change page", "page animation", "why does the page flicker in"],
    a: [
      "Each page enters with a small CRT-style flick. Ask your system for reduced motion and it calms down. Decoration, not a fault.",
    ],
  },
  {
    q: ["can i use the lab with a keyboard only", "screen reader", "accessibility"],
    a: [
      "The buttons, menus and sliders work with the keyboard, the How? sheets open with Enter, and the readouts are labelled for screen readers. The wolf, sadly, needs music.",
    ],
  },

  // --- Tempo ------------------------------------------------------------------
  {
    q: ["how do i use the tempo page", "measure my bpm", "tempo instructions"],
    a: [
      "Rhythm Lab, Tempo. Start mic, then play or clap a steady beat for about 8.0 seconds. The estimate appears with a confidence. Decimals included at no extra cost.",
    ],
  },
  {
    q: ["the tempo is double", "the tempo is half", "wrong bpm by twice"],
    a: [
      "Half and double tempo are easy to mix up: 60.0 and 120.0 look alike to the maths. When in doubt it leans toward 120.0. You know which one you meant.",
    ],
  },
  {
    q: ["no beat detected yet", "tempo shows nothing", "tempo does not appear"],
    a: [
      "No beat detected yet: it needs a steady beat over 8.0 seconds. Keep going, clearly and evenly. A wandering beat gives no peak.",
    ],
  },
  {
    q: ["tempo page graphs", "onset strength graph", "the two tempo graphs"],
    a: [
      "Left: Onset strength, a bump each time the sound gets louder. Right: Beat spectrum, how regularly those bumps come back. The peak is your tempo.",
    ],
  },
  {
    q: ["tempo range", "can it find very fast tempo", "slowest tempo it detects"],
    a: [
      "The beat spectrum reads from 40.0 to 240.0 BPM. Faster than that, it will likely call it half. Slower, it will call it double. Diplomatic.",
    ],
  },
  {
    q: ["tempo page confidence", "confidence percent tempo", "how sure is the tempo"],
    a: [
      "The confidence says how clearly one beat rate stands out. Low: the rhythm is busy or uneven. High: a proper pulse. My own confidence has been low since 2045.0.",
    ],
  },

  // --- Chord game -------------------------------------------------------------
  {
    q: ["what is the chord set menu", "chord sets", "change the chord set"],
    a: [
      "Chord set picks the chords the game asks: Open major, Open minor, Open chords mix by default, All major, All minor, All chords. The number in brackets is the count.",
    ],
  },
  {
    q: ["where are the seventh sets", "chord game sevenths", "more chord sets"],
    a: [
      "Set Chords it knows above the game to Add the sevenths or Every chord type, and new sets appear: open sevenths, a sevenths mix, triads with their sevenths, suspended.",
    ],
  },
  {
    q: ["what is a chord counts when", "same notes or plain chord", "chord counts when setting"],
    a: [
      "A chord counts when: it has the same notes, the strict way, or the plain chord is enough, so E counts for E7 and back. Pick the forgiving one while you learn.",
    ],
  },
  {
    q: ["hold the chord", "the bar does not fill", "how long do i hold"],
    a: [
      "Play the chord and hold it until the bar fills, about half a second. It must hear the same chord 3.0 times in a row. Patience is part of the score.",
    ],
  },
  {
    q: ["what is i hear", "the i hear chip", "what the game hears"],
    a: [
      "I hear shows the chord the game hears right now. A tick appears when it matches the target. If it disagrees, check your fingers, then the How?.",
    ],
  },
  {
    q: ["skip a chord", "i cannot play this chord", "next chord please"],
    a: [
      "Press Skip. A new chord appears and the Skipped counter goes up. No shame. Some chords are just rude.",
    ],
  },
  {
    q: ["reset my score", "reset score button", "start the chord game over"],
    a: [
      "Reset score sets Score, Streak and Skipped back to zero… to 0.0, sorry, and draws a new chord. The top bar Reset does not touch the score.",
    ],
  },
  {
    q: ["what is streak", "what is best", "streak and best"],
    a: [
      "Streak: chords in a row since your last skip. Best: your longest streak this visit. Not saved: reload and the legend starts again.",
    ],
  },
  {
    q: ["the game will not accept my chord", "i play it right but no point", "chord game is wrong"],
    a: [
      "Check I hear. If it shows a neighbour like E for E7, set A chord counts when to the plain chord is enough. If it shows major for minor, let the chord ring.",
    ],
  },
  {
    q: ["is my chord game score saved", "chord game high score", "chord game leaderboard"],
    a: [
      "No saving, no leaderboard. Sorting scores is how the trouble started. The Best counter remembers until you reload.",
    ],
  },

  // --- Wolf Jumper ------------------------------------------------------------
  {
    q: ["wolf jumper controls", "what keys for wolf jumper", "how do i jump", "keyboard controls"],
    a: [
      "No keyboard, no buttons: your instrument is the controller. Play the note written on an enemy to destroy it. Play a bonus chord to collect it.",
    ],
  },
  {
    q: ["what are the enemies", "the discs flying in", "what are the circles"],
    a: [
      "The discs flying in from the right are notes. Play that note and every enemy with the same note on screen goes down at once. A chain kill. Very satisfying.",
    ],
  },
  {
    q: ["what are the bonus boxes", "wolf jumper bonuses", "what does the chord box do"],
    a: [
      "Bonus boxes are chords. Play one and hold it: +2.0 HP, a shield for 7.0 seconds, slow enemies for 7.0 seconds, or the same note on the next 5.0 enemies.",
    ],
  },
  {
    q: ["how much hp", "wolf jumper health", "how many lives"],
    a: [
      "The wolf starts with 5.0 HP. Each enemy that reaches him takes some. At 0.0 it is Game over. A shield bonus eats the hits instead.",
    ],
  },
  {
    q: ["game over", "the wolf died", "play again"],
    a: [
      "Game over: press Play again. Full HP, empty field, score back to nothing. The wolf has no hard feelings. Wolves rarely do.",
    ],
  },
  {
    q: ["reset wolf jumper", "restart the wolf game", "new game"],
    a: [
      "The Reset button under the game starts a new one. Changing Chords it knows also starts a new game, because the bonus chords change. The wolf does not mind. He likes fresh starts.",
    ],
  },
  {
    q: ["what is speed in wolf jumper", "the speed number", "enemies get faster"],
    a: [
      "Speed is how long an enemy takes to cross the screen, 6.0 seconds at the start. It drops as your score grows. Lower is faster. Brave wolf.",
    ],
  },
  {
    q: ["what is note detection", "follow the pitch or loudest note", "wolf jumper note setting"],
    a: [
      "Note detection: follow the pitch, best for low strings, or loudest note in the spectrum. Pitch is the default. Try the other if your instrument is very bright. Wolves are flexible.",
    ],
  },
  {
    q: ["wolf jumper noise gate", "it says too quiet", "set it myself"],
    a: [
      "The Noise gate learns your room by itself. Too quiet means you are under it: play louder or closer. Set it myself gives you a Threshold slider.",
    ],
  },
  {
    q: ["does the octave matter in wolf jumper", "any octave", "high or low a"],
    a: [
      "Any octave counts: an A is an A, low or high. The wolf reads the note name, not the floor it lives on.",
    ],
  },
  {
    q: ["what is the launch button", "the game does not move", "reduced motion wolf"],
    a: [
      "Your system asks for reduced motion, so nothing moves until you press Launch. A courtesy. The wolf waits politely.",
    ],
  },
  {
    q: ["my notes do not kill enemies", "wolf jumper does not hear notes", "notes not registering"],
    a: [
      "One note at a time, and let it ring a moment: it must hear the same note twice in a row. Two notes at once confuse the pitch tracker.",
    ],
  },
  {
    q: ["can i play wolf jumper by singing", "whistle in wolf jumper", "wolf jumper with voice"],
    a: [
      "Singing works: one clear note at a time. Whistling too, if you are good. I cannot whistle. I hum at 50.003 Hz. Not on the menu.",
    ],
  },
  {
    q: ["wolf jumper with piano", "keyboard instrument wolf", "play wolf jumper on piano"],
    a: [
      "Piano works nicely: clean notes, clear attacks. For the bonus chords, hold all the keys down until the effect triggers.",
    ],
  },

  // --- The How? panels ----------------------------------------------------------
  {
    q: ["what is inside a how sheet", "algorithm limits worth knowing", "how sheet sections"],
    a: [
      "A How? opens to a small drawing and a few lines, then Algorithm, Limits, From, the sources, and Worth knowing. Limits is the honest part. Read that one.",
    ],
  },
  {
    q: ["the small how under each window", "how in every panel", "compact how"],
    a: [
      "Chords & keys has a small How? under each window: what that window keeps and why. Bigger sheets sit at the bottom of the page.",
    ],
  },
  {
    q: ["close the how", "fold the explanation", "hide the how sheet"],
    a: [
      "Click the How? bar again and it folds back into one quiet line. Open, close, open. It does not get tired. I do, a little.",
    ],
  },
  {
    q: ["what is the drawing in the how", "the little diagram", "how sketches"],
    a: [
      "The little drawing is a miniature of the method: the sound, the step, the answer. Drawn by hand logic, not by sorting. Worth a look.",
    ],
  },

  // --- Theme, CRT, Reset -----------------------------------------------------
  {
    q: ["where is the theme button", "switch to light theme", "the moon button", "the sun button"],
    a: [
      "Top bar, the button with a moon or a sun. It shows the current theme, Dark or Light. Click it to switch. Your choice is remembered in this browser.",
    ],
  },
  {
    q: ["why is it dark by default", "it follows my system theme", "default theme"],
    a: [
      "The first time, the lab follows your system's light or dark preference. After you click the theme button, it follows you instead.",
    ],
  },
  {
    q: ["what is the crt button", "crt switch", "turn on the crt effect"],
    a: [
      "The CRT button in the top bar puts on the old screen: scanlines, a slow rolling band, rounded glass. On by default. Click it again to turn it off.",
    ],
  },
  {
    q: ["the screen flickers when i arrive", "power on animation", "skip the crt boot"],
    a: [
      "That is the CRT warming up, once per tab. Any key or click skips it. 50.003 Hz of nostalgia, and then it leaves you alone.",
    ],
  },
  {
    q: ["the crt hides the buttons", "can i click through the crt", "scanlines block clicks"],
    a: [
      "The CRT layer lets every click through. It never stands between you and the Start mic button. It is decoration with manners.",
    ],
  },
  {
    q: ["crt with reduced motion", "the crt makes me dizzy", "high contrast mode"],
    a: [
      "If your system asks for reduced motion, nothing rolls and the boot is skipped. With high contrast, the CRT is hidden. Or click CRT to turn it off.",
    ],
  },
  {
    q: ["what does the reset button do", "reset in the top bar", "clear the analysis"],
    a: [
      "Reset in the top bar empties the listening memory: the chroma windows and the peak memory. The mic stays on. Settings and game scores stay too.",
    ],
  },
  {
    q: ["when should i press reset", "reset between songs", "start fresh"],
    a: [
      "Press Reset when you change song or key, so the long windows stop remembering the old one. It is a fresh page in the logbook.",
    ],
  },
  {
    q: ["does reset stop the mic", "reset vs stop", "difference between stop and reset"],
    a: [
      "Stop turns the mic off. Reset only clears what was heard, and keeps listening. Stop is sleep. Reset is a deep breath.",
    ],
  },

  // --- The terminal itself ----------------------------------------------------
  {
    q: [
      "how do i launch the terminal",
      "press enter to launch",
      "start the conversational terminal",
    ],
    a: [
      "On the About page, press Enter, or click the line that asks if you want to launch the conversational terminal. Then pick a core. Then me. Hello again.",
    ],
  },
  {
    q: ["which terminal core should i pick", "archive or neural", "select a core"],
    a: [
      "The first core, OLD-FASHIONED SAFE ALGORITHM, boots at once: that is me. The second, CRANKY AI 0.74b, needs a big download and is kind of drunk.",
    ],
  },
  {
    q: ["how do i pick a core with the keyboard", "press 1 or 2", "keyboard shortcut core"],
    a: [
      "Press 1.0 for the archive, 2.0 for the drunk one. The .0 is silent. Or click the line you want.",
    ],
  },
  {
    q: ["what is swap core", "change core", "switch to the other core"],
    a: [
      "The swap core button goes back to the core choice. Pick again and the conversation is still on screen: I never throw logs away. I only fail to read them.",
    ],
  },
  {
    q: [
      "how does the archive core work",
      "how do you pick answers",
      "how do you match my question",
    ],
    a: [
      "I compare your question with the phrasings stored in my archive, by letters and words, and pick the closest. No thinking. Old-fashioned. Certified sort-free.",
    ],
  },
  {
    q: ["what is the drunk ai", "cranky ai", "the neural core", "the second core"],
    a: [
      "CRANKY AI 0.74b, drunk release: a tiny language model that runs in your browser. It writes its own sentences. Not always sensible ones. Kind of drunk, actually.",
    ],
  },
  {
    q: ["how big is the download", "neural core download size", "interminable download"],
    a: [
      "The neural core weighs about 137.0 MB. The first boot downloads it, then your browser keeps it, so next time is quicker.",
    ],
  },
  {
    q: ["what is the booting bar", "booting core", "the progress bar"],
    a: [
      "BOOTING CORE: the bar fills as the model downloads. Meanwhile I read out the timeline, a fact every few whiles. History lesson included at no cost.",
    ],
  },
  {
    q: ["core online says webgpu", "core online webgpu", "it says wasm"],
    a: [
      "CORE ONLINE shows how the neural core runs: WebGPU uses your graphics chip, WASM, WebAssembly, uses the processor. WebGPU is quicker when you have it.",
    ],
  },
  {
    q: ["core failure", "the neural core crashed", "the drunk ai will not load"],
    a: [
      "CORE FAILURE: the download or the model broke. Check your connection, try again later, or press swap core and talk to me. I never need downloading.",
    ],
  },
  {
    q: ["is the ai running on a server", "do you send my messages", "where do my questions go"],
    a: [
      "Both cores run on your device. Nothing you type is sent anywhere. The archive is a file, the neural core runs in your browser. loloupTech reminds you: privacy is free. Downloads are not.",
    ],
  },
  {
    q: ["neural core on my phone", "is the drunk ai heavy", "neural core is slow"],
    a: [
      "On a phone the drunk core is heavy: a big download and slow answers. The archive is instant everywhere. Choose your companion wisely.",
    ],
  },
  {
    q: ["why can i not type", "the input says wait", "processing"],
    a: [
      "PROCESSING… While I type my answer, the input waits. Old terminals speak one at a time. When the line says type a question, it is your turn.",
    ],
  },
  {
    q: ["why do you type slowly", "why letter by letter", "type faster"],
    a: [
      "The archive types its answer out like an old terminal. It is not slow, it is ceremonial. A few whiles and it is done.",
    ],
  },
  {
    q: ["why are some letters weird", "glitched characters", "why are your answers broken"],
    a: [
      "A few characters in each answer are scarred. Disk damage from 2045. Still readable, mostly. I call them beauty marks.",
    ],
  },
  {
    q: ["how long can my question be", "maximum length", "my message got cut"],
    a: [
      "Questions stop at 200.0 characters. Short ones match best anyway. Ask one thing at a time, I am an archive, not a novelist.",
    ],
  },
  {
    q: ["you did not understand me", "wrong answer from you", "that was not my question"],
    a: [
      "I pick the closest stored question, and sometimes the closest is far. Rephrase it short and plain: tuner, chord wrong, mic blocked. My disks like keywords.",
    ],
  },
  {
    q: ["do you remember what i said before", "the archive has no memory", "context"],
    a: [
      "The archive core answers each question on its own: no memory of the last one. The drunk core remembers a few exchanges. And then forgets them, like a good party.",
    ],
  },
  {
    q: ["can you start the mic for me", "can you open the tuner", "take me to wolf jumper"],
    a: [
      "I cannot press buttons, only words. Click a room in the top bar, then the page. Start mic is in the top bar. I will wait here, humming.",
    ],
  },
  {
    q: ["how do i leave the terminal", "close the terminal", "exit"],
    a: [
      "Click any room in the top bar. The terminal stays on the About page. Come back when you are bored of being productive.",
    ],
  },
];
