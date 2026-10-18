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
];
