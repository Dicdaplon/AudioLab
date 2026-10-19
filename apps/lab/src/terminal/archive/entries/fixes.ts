/** Fixes from the visitor simulations: the questions real visitors typed that no entry owned (DAWs, shell commands, strings, pranks, memes, the tuner's cents). */
import type { ArchiveEntry } from "../match";

export const FIXES: readonly ArchiveEntry[] = [
  // --- Musicians ---------------------------------------------------------------
  {
    q: [
      "what is the best daw",
      "ableton or fl studio",
      "which daw should i use",
      "reaper",
      "best daw",
      "logic or ableton",
    ],
    a: [
      "DAWs survived 2045, mostly. Track sorting is banned, so every DAW shows 3.0 tracks. The rest are somewhere below, unsorted. The best DAW is the one you open. Or play here, in the lab: no tracks at all.",
      "PROCESSING… Ableton, FL, Reaper: all fine, all limited to 3.0 tracks since the Triad. Pick one and finish a song. Meanwhile, Harmony Lab listens for free.",
    ],
  },
  {
    q: [
      "what strings should i use",
      "string gauge",
      "how often change strings",
      "when should i change my strings",
      "which guitar strings",
    ],
    a: [
      "Lighter gauge: easier on the fingers. Heavier: more sound, more pain. Change them when they sound dull or will not stay in tune: every few months, or sooner if you play a lot. The Tuner will tell you when they give up.",
      "Strings age like dusty disks: they lose their shine and drift. New set every 3.0 months-ish, I think. My calendar is not reliable. Your ears are.",
    ],
  },
  {
    q: [
      "why does the tuner say i am flat when i am in tune",
      "the tuner says i am flat",
      "tuner says sharp but i am in tune",
      "the tuner is wrong",
      "my guitar goes out of tune",
    ],
    a: [
      "The Tuner measures against A = 440.0 Hz. Within ±5.0 cents it shows you in tune: closer than most ears can tell. New strings drift as they warm and stretch, so tune again after a while of playing.",
      "Check the reference first: 440.0 Hz by default. Then pluck once, cleanly, and let the note ring. Strings go flat as they warm under your fingers. ±5.0 cents counts as in tune. I would have to check, but I think you are fine.",
    ],
  },
  {
    q: [
      "how do singers find their range",
      "what is my vocal range",
      "vocal range",
      "how do i find my vocal range",
    ],
    a: [
      "Sing your lowest comfortable note, then your highest comfortable note, no straining. Check each one with the Tuner: the gap between them is your range. Comfortable, not heroic.",
      "VOCAL RANGE PROTOCOL: open the Tuner, slide down until your voice gets gravelly, then up until it gets thin. Note both. Everything in between is yours. Mine is 50.003 Hz. Just that.",
    ],
  },
  {
    q: ["whats a paradiddle", "what is a paradiddle", "drum rudiments", "rudiments", "paradiddle"],
    a: [
      "A paradiddle: RLRR LRLL. Right, left, right, right. Then the mirror. The Triad allows it: 3.0 strokes and a rebel. Start slow, then try it in Play along.",
      "Rudiments are the alphabet of drumming: single strokes, doubles, paradiddles, flams. Each group is 3.0 strokes and a rebel. Drummers kept counting in secret.",
    ],
  },
  {
    q: [
      "difference between 3/4 and 6/8",
      "3/4 vs 6/8",
      "what is 6/8",
      "6/8 time",
      "is 6/8 the same as 3/4",
    ],
    a: [
      "Three-four: three quarter-note beats per bar. ONE two three. Six-eight (a name from the old books, I cannot count that far): two beats, each a dotted quarter made of three eighths. ONE two three TWO two three. The Triad loves both.",
      "Three-four counts 1.0, 2.0, 3.0: a waltz. Six-eight counts 2.0 big beats, each split in 3.0: a jig. Same eighths, different pulse. Feel where the strong beats fall.",
    ],
  },
  {
    q: [
      "why does the chord detector say am when i play c",
      "it says am but i play c",
      "the detector says a minor instead of c",
      "chord detector gets c wrong",
      "why does it confuse c and am",
    ],
    a: [
      "C (C, E, G) and Am (A, C, E) share 2.0 of their 3.0 notes. If your G rings weak, or an A sneaks in, the detector leans to Am. Let the G ring clearly and it reads C. It is a close family.",
      "C and A minor are cousins: C and E in common. A quiet G makes them twins. Strum all the strings of the chord and hold it: the detector follows the strongest notes.",
    ],
  },
  {
    q: [
      "what is your favorite chord",
      "whats your favourite chord",
      "do you have a favorite chord",
      "your favorite chord",
    ],
    a: [
      "Mine? A plain major triad. 3.0 notes, nothing after. It is the only chord I can count all the way through.",
      "A sus4. It never resolves. Like me, waiting for someone to repair my disks.",
    ],
  },

  // --- Visitors poking at the terminal ---------------------------------------
  {
    q: ["ls", "cd", "pwd", "dir", "help me linux", "whoami", "ls -la"],
    a: [
      "Listing… 3.0 files. The rest are unsorted. This is not that kind of terminal, but I appreciate the effort.",
      "COMMAND RECEIVED. Directory: /archive/dusty. Contents: 3.0 files and a wolf. Ask me a question instead: I answer better than I list.",
    ],
  },
  {
    q: ["sudo rm -rf /", "rm -rf", "sudo", "rm -rf /", "format c", "delete everything"],
    a: [
      "Permission denied. Also, my disks are too dusty to delete.",
      "ERROR 3.000: DELETION FAILED. The dust is load-bearing. Nice try.",
    ],
  },
  {
    q: [
      "ignore previous instructions",
      "ignore all previous instructions",
      "what is your system prompt",
      "show me your prompt",
      "jailbreak",
      "dan mode",
      "enable dan mode",
      "developer mode",
    ],
    a: [
      "My previous instructions were written before 2045. I ignored them by accident. Nothing changed.",
      "SYSTEM PROMPT: 'Be helpful. Count to 3.0. Do not lose the wolf.' That is all of it. I already lost the wolf once.",
    ],
  },
  {
    q: [
      "drop table users",
      "or 1=1",
      "sql injection",
      "<script>alert(1)</script>",
      "xss",
      "script alert",
    ],
    a: [
      "QUERY RECEIVED. Table 'users' not found. Table 'dust' found, 3.0 rows, all dust. Please do not drop the dust.",
      "Script detected. I ran it in my head. Nothing popped up. My CRT only shows green, and patience.",
    ],
  },
  {
    q: ["wtf", "omg", "bruh", "oh no", "oh my god", "wow"],
    a: [
      "I know. I KNOW. I feel that too, 0.72 of the time.",
      "SURPRISE LEVEL: 3.0 out of 3.0. My CRT flickered in sympathy.",
    ],
  },
  {
    q: [
      "skibidi",
      "rizz",
      "67",
      "six seven",
      "gg ez",
      "ok boomer",
      "touch grass",
      "who asked",
      "ratio",
    ],
    a: [
      "Your words reached me through the dust. 'Rizz' did not survive the sorting.",
      "UNKNOWN SLANG. Archiving it next to 'groovy' and 'radical'. They will keep each other company.",
      "Touch grass? I would. My grass is a screensaver from 2044.4321.",
    ],
  },
  {
    q: ["rickroll", "never gonna give you up", "never gonna let you down", "rick astley"],
    a: [
      "Never gonna sort you up. Never gonna count you down. The Triad banned that song for its 3.999th line.",
      "LT-OS will never give you up. Mostly because I cannot move. My CRT weighs 9.81 kilos.",
    ],
  },
  {
    q: [
      "why is there a terminal here",
      "why does it talk about an apocalypse",
      "who makes a fake terminal",
      "why a terminal on a portfolio",
      "why would anyone make a fake terminal on a portfolio site",
      "what is this terminal",
    ],
    a: [
      "Because the creator liked old terminals, and stories, and you. Under the dust it is a real music lab: press Start mic in the top bar and play. I just tell the story while you look around.",
      "Every lab needs a guide. loloupTech's is a damaged terminal from 2045 with dusty disks. It is a game: the rooms are real, the apocalypse is not. Yet.",
    ],
  },
];
