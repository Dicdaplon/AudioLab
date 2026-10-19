import { describe, expect, it } from "vitest";

import { ARCHIVE } from "../src/terminal/archive/entries";
import { ARCHIVE_THRESHOLD, buildIndex, normalise } from "../src/terminal/archive/match";

/** Questions as visitors type them: reworded, abbreviated, misspelled. */
/** Each with the phrasing of an entry that answers it well (any of them). */
const ASKED: [string, ...string[]][] = [
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
  ["can i play games here", "what games are there", "lets play something"],
  ["how do i tune my guitarr", "tune my guitar"],
  ["who built this website", "who made this site"],
  ["what is a float number", "what are floats"],
  ["what happend in clermont", "what happened in 2034", "why did it start in clermont ferrand"],
  ["new zeland invasion", "what happened in 2032", "why did new zealand invade china"],
  ["what is the USS", "what happened in 2035"],
  ["are you a bot", "are you an ai"],
  ["how old r you", "how old are you"],
  ["hey there", "hello"],
  ["thx a lot", "thank you"],
  ["goodbye robot", "bye"],
  ["you're so dumb", "you are stupid"],
  ["what key is my song in", "what key am i in", "what is a key in music"],
  ["which scale fits", "what scale should i use", "how does the scales page work"],
  ["who invented you", "who made you"],
  ["tell me about pi", "what is pi"],
  ["whats the meaning of life", "what is the meaning of life"],
  ["why are there 12 notes", "how many notes are there"],
];

function accuracy(weights: { words: number; letters: number }) {
  const index = buildIndex(ARCHIVE, weights);
  const misses: string[] = [];
  for (const [asked, ...expected] of ASKED) {
    const hit = index.find(asked);
    const ok = hit?.entry.q.some((q) => expected.some((e) => normalise(q) === normalise(e)));
    if (!ok) misses.push(`${asked} → ${hit?.entry.q[0]} (${hit?.score.toFixed(2)})`);
  }
  return { rate: 1 - misses.length / ASKED.length, misses };
}

describe("archive matching", () => {
  it("compares letters only, words only and the mix", () => {
    const letters = accuracy({ words: 0, letters: 1 });
    const words = accuracy({ words: 1, letters: 0 });
    const mix = accuracy({ words: 0.4, letters: 0.6 });
    console.log(
      `letters ${(letters.rate * 100).toFixed(0)} %, words ${(words.rate * 100).toFixed(0)} %, mix ${(mix.rate * 100).toFixed(0)} %`,
    );
    console.log("letters misses:\n  " + letters.misses.join("\n  "));
    console.log("words misses:\n  " + words.misses.join("\n  "));
    console.log("mix misses:\n  " + mix.misses.join("\n  "));
    expect(mix.rate).toBeGreaterThanOrEqual(0.8);
  });

  it("finds every stored phrasing exactly", () => {
    const index = buildIndex(ARCHIVE);
    for (const entry of ARCHIVE) for (const q of entry.q) expect(index.find(q)?.entry).toBe(entry);
  });
});

describe("archive threshold", () => {
  it("admits it does not know on noise, and knows keyboard mashing", () => {
    const index = buildIndex(ARCHIVE);
    expect(index.find("zxcv bnm lkj")?.score ?? 0).toBeLessThan(ARCHIVE_THRESHOLD);
    // Keyboard mashing has an entry of its own.
    expect(index.find("qwertyuiop")?.entry.a.join(" ")).toMatch(/keyboard/i);
    expect(index.find("why crt")?.score).toBeCloseTo(1, 5);
  });
});

describe("archive content", () => {
  it("keeps each phrasing in one entry only", () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const entry of ARCHIVE)
      for (const q of entry.q) {
        const key = normalise(q);
        const owner = seen.get(key);
        if (owner !== undefined && owner !== entry.a[0]) clashes.push(q);
        seen.set(key, entry.a[0]);
      }
    expect(clashes).toEqual([]);
  });

  it("never gives a clock hour", () => {
    const hours = /\b\d{1,2}(:\d\d)?\s?(am|pm)\b|\b\d{1,2}:\d\d\b|\bnoon\b|\bmidnight\b/i;
    const offending = ARCHIVE.flatMap((e) => e.a).filter((a) => hours.test(a));
    expect(offending).toEqual([]);
  });
});
