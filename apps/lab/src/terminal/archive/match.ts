/**
 * The archive core's ear: finds the stored question closest to what the
 * visitor typed. No model: two old-school measures, mixed.
 *
 *   words     cosine of word weights (rare words count more, TF-IDF), on
 *             light stems ("sorting" = "sort"), stop words removed
 *   letters   Dice overlap of letter trigrams, which forgives typos
 *
 * score = 0.4 · words + 0.6 · letters, in [0, 1]. On reworded and misspelled
 * questions (tests/archive.test.ts), with about 1000 entries: letters alone
 * 78 %, words alone 81 %, this mix 88 %. With a hundred entries letters
 * alone were best (94 %): the more entries, the more the words must weigh. Under `ARCHIVE_THRESHOLD`
 * the archive admits it does not know.
 */

/** Below this score the archive answers that it does not know. */
export const ARCHIVE_THRESHOLD = 0.3;

export interface ArchiveEntry {
  /** A few ways to ask it. */
  q: readonly string[];
  /** One or more answers; one is picked at random. */
  a: readonly string[];
}

export interface ArchiveMatch {
  entry: ArchiveEntry;
  score: number;
}

const STOP = new Set(
  (
    "a an the is are was were be been am i you your me my we our it its of to in on at for and or " +
    "do does did can could would should will shall what whats which who whom how why when where " +
    "this that these those there here please tell about with from by as so just some any"
  ).split(" "),
);

/** Lower case, no accents, letters, digits and spaces only. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/(?<!\d)\.|\.(?!\d)/g, " ")
    .trim();
}

/** A very light stemmer: enough to meet "sorting", "sorted" and "sorts". */
function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function words(text: string): string[] {
  return normalise(text)
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

function trigrams(text: string): Set<string> {
  const s = ` ${normalise(text)} `;
  const out = new Set<string>();
  for (let i = 0; i + 3 <= s.length; i++) out.add(s.slice(i, i + 3));
  return out;
}

interface Indexed {
  entry: ArchiveEntry;
  vector: Map<string, number>;
  norm: number;
  grams: Set<string>;
}

export interface ArchiveIndex {
  find(question: string): ArchiveMatch | null;
}

/** Indexes every phrasing of every entry once; `find` is then a few ms for thousands. */
export function buildIndex(
  entries: readonly ArchiveEntry[],
  weights: { words: number; letters: number } = { words: 0.4, letters: 0.6 },
): ArchiveIndex {
  const phrasings = entries.flatMap((entry) => entry.q.map((q) => ({ entry, q })));
  const df = new Map<string, number>();
  const tokenised = phrasings.map(({ q }) => words(q));
  for (const tokens of tokenised) for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = (t: string) => Math.log(1 + phrasings.length / (df.get(t) ?? 0.5));

  const vectorOf = (tokens: string[]) => {
    const v = new Map<string, number>();
    for (const t of tokens) v.set(t, (v.get(t) ?? 0) + idf(t));
    let n = 0;
    for (const x of v.values()) n += x * x;
    return { vector: v, norm: Math.sqrt(n) };
  };

  const indexed: Indexed[] = phrasings.map(({ entry, q }, i) => ({
    entry,
    ...vectorOf(tokenised[i]),
    grams: trigrams(q),
  }));

  return {
    find(question) {
      const { vector, norm } = vectorOf(words(question));
      const grams = trigrams(question);
      let best: ArchiveMatch | null = null;
      for (const item of indexed) {
        let dot = 0;
        for (const [t, w] of vector) dot += w * (item.vector.get(t) ?? 0);
        const cosine = norm > 0 && item.norm > 0 ? dot / (norm * item.norm) : 0;
        let shared = 0;
        for (const g of grams) if (item.grams.has(g)) shared++;
        const dice =
          grams.size + item.grams.size > 0 ? (2 * shared) / (grams.size + item.grams.size) : 0;
        const score = weights.words * cosine + weights.letters * dice;
        if (!best || score > best.score) best = { entry: item.entry, score };
      }
      return best;
    },
  };
}
