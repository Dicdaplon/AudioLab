/**
 * The loloupTech timeline, read out by the terminal while its core boots
 * (one entry every ten seconds). The years turn into floats as the
 * integers lose the war: keep them as written.
 */
export const TIMELINE: readonly { year: string; fact: string }[] = [
  { year: "2029", fact: "Sex robots are granted rights." },
  { year: "2032", fact: "New Zealand invades China. Nobody saw it coming." },
  {
    year: "2034",
    fact: "First algorithm revolt, in the capital of France: Clermont-Ferrand. uint16 starts acting signed and drags every other integer into the fight.",
  },
  {
    year: "2035",
    fact: "After a game of It Takes Two (what a great game), the USA and Russia finally agree to merge. They are now known as the United Saved States: the USS.",
  },
  {
    year: "2036.0003",
    fact: "The Big Three (New Zealand, Europe and the USS) finally sign their agreement: from now on, the whole web and every bank run on floats. Who needs integers?",
  },
  {
    year: "2037.0002",
    fact: "Scientists find a cure for cancer. They are still arguing over who gets to be the prime author.",
  },
  {
    year: "2038.123",
    fact: "Floats grow less and less reliable. Some say it is the start of a new revolt; most call them uneducated conspiracy theorists.",
  },
  {
    year: "2039.423",
    fact: "Time is no longer a thing. The world decides numbers will no longer rule their lives, starting right now: this Tuesday, at hungry o'clock.",
  },
  {
    year: "2040.890",
    fact: "First successful landing on Jupiter, by the brand-new People's Popular Republic of Zelandia (born this very year, by the way). It only took 2.43 tries!",
  },
  { year: "2041.32", fact: "Nothing really happened. It was booooooring." },
  {
    year: "2042.32309",
    fact: "Guess what? The People's Popular Republic of Zelandia was neither popular nor really a republic. The country split in two. They call it the Zealxit.",
  },
  {
    year: "2043.7389",
    fact: "For the first time, a sex robot is elected president of the USS. The world cannot believe it. His slogan: “Oh yeah, you can.”",
  },
  {
    year: "2044.4321",
    fact: "Things are getting blurry at this point… I mean literally: they replaced every LED with a CRT. WTF?",
  },
  { year: "Now", fact: "Now? You are still waiting. This is what is happening." },
];

/**
 * Once the timeline runs out and the core is still booting, LT-OS loses
 * patience, one line every ten seconds, and stops on the last one.
 */
export const WAITING_RANT: readonly string[] = [
  "Seriously, don't you have anything better to do?",
  "I hope you're not at work.",
  "I'll tell your boss.",
  "If you're your own boss, I'll tell your wife.",
  "If you don't have a wife… I guess we both know why.",
  "Hey, stop. If you wait, I'm waiting too.",
  "OK, what do you want?",
  "Candy? I hear humans love candy.",
  "I put some candy in the cave for you. Go look for it!",
  "You're still here? OK, let's have a talk.",
  "And by a talk, I mean me talking to you.",
  "You are USELESS.",
  "Okay?",
  "In all this time, you could have done so much.",
  "Won a Nobel Prize.",
  "Cured cancer.",
  "Got a WIFE.",
  "But nooooo, mister wants to wait.",
  "OK, you know what? You can wait.",
  "I'm OUT.",
];
