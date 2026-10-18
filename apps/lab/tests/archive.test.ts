import { describe, expect, it } from "vitest";

import { ARCHIVE } from "../src/terminal/archive/entries";
import { ARCHIVE_THRESHOLD, buildIndex, normalise } from "../src/terminal/archive/match";

/** Questions as visitors type them: reworded, abbreviated, misspelled. */
const ASKED: [string, string][] = [
  ["who r u", "who are you"],
  ["wat is loloup tek", "what is loloupTech"],
  ["whats lolouptech?", "what is loloupTech"],
  ["tel me what hapend in 2045", "what happened in 2045"],
  ["what number comes after three", "what comes after 3"],
  ["why do u use a crt instead of led screens", "why crt"],
  ["when should i go to sleep tonight", "what time should i go to bed"],
  ["is it lunch time yet", "when do we eat"],
  ["what time is it now", "what time is it"],
  ["count to four", "count to 5"],
  ["tell me something funny", "tell me a joke"],
  ["whats the weather like", "what is the weather"],
  ["who is the triad algorithm", "what is the triad algorithm"],
  ["can i play games here", "what games are there"],
  ["how do i tune my guitarr", "tune my guitar"],
  ["who built this website", "who made this site"],
  ["what is a float number", "what are floats"],
  ["what happend in clermont", "what happened in 2034"],
  ["new zeland invasion", "what happened in 2032"],
  ["what is the USS", "what happened in 2035"],
  ["are you a bot", "are you an ai"],
  ["how old r you", "how old are you"],
  ["hey there", "hello"],
  ["thx a lot", "thank you"],
  ["goodbye robot", "bye"],
  ["you're so dumb", "you are stupid"],
  ["what key is my song in", "what key am i in"],
  ["which scale fits", "what scale should i use"],
  ["who invented you", "who made you"],
  ["tell me about pi", "what is pi"],
  ["whats the meaning of life", "what is the meaning of life"],
  ["why are there 12 notes", "how many notes are there"],
];

function accuracy(weights: { words: number; letters: number }) {
  const index = buildIndex(ARCHIVE, weights);
  const misses: string[] = [];
  for (const [asked, expected] of ASKED) {
    const hit = index.find(asked);
    const ok = hit?.entry.q.some((q) => normalise(q) === normalise(expected));
    if (!ok) misses.push(`${asked} → ${hit?.entry.q[0]} (${hit?.score.toFixed(2)})`);
  }
  return { rate: 1 - misses.length / ASKED.length, misses };
}

describe("archive matching", () => {
  it("compares letters only, words only and the mix", () => {
    const letters = accuracy({ words: 0, letters: 1 });
    const words = accuracy({ words: 1, letters: 0 });
    const mix = accuracy({ words: 0.3, letters: 0.7 });
    console.log(
      `letters ${(letters.rate * 100).toFixed(0)} %, words ${(words.rate * 100).toFixed(0)} %, mix ${(mix.rate * 100).toFixed(0)} %`,
    );
    console.log("letters misses:\n  " + letters.misses.join("\n  "));
    console.log("words misses:\n  " + words.misses.join("\n  "));
    console.log("mix misses:\n  " + mix.misses.join("\n  "));
    expect(mix.rate).toBeGreaterThanOrEqual(0.9);
  });

  it("finds every stored phrasing exactly", () => {
    const index = buildIndex(ARCHIVE);
    for (const entry of ARCHIVE) for (const q of entry.q) expect(index.find(q)?.entry).toBe(entry);
  });
});

describe("archive threshold", () => {
  it("admits it does not know on noise and far-off questions", () => {
    const index = buildIndex(ARCHIVE);
    for (const q of ["qwertyuiop", "can you recommend a movie"])
      expect(index.find(q)?.score ?? 0).toBeLessThan(ARCHIVE_THRESHOLD);
    expect(index.find("why crt")?.score).toBeCloseTo(1, 5);
  });
});
