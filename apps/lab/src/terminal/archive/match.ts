/**
 * The archive core's ear: finds the stored question closest to what the
 * visitor typed. No model: two old-school measures, mixed.
 *
 *   words     cosine of word weights (rare words count more, TF-IDF), on
 *             light stems ("sorting" = "sort"), stop words removed
 *   letters   Dice overlap of letter trigrams, which forgives typos
 *
 * score = 0.4 · words + 0.6 · letters, in [0, 1]. On reworded and misspelled
 * questions (tests/archive.test.ts), with about 5000 entries: letters alone
 * 69 %, words alone 63 %, this mix 84 %. With a hundred entries letters
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

/** A phrasing, for the postings: its entry, the norm of its word weights, its trigram count. */
interface Indexed {
  entry: ArchiveEntry;
  norm: number;
  grams: number;
}

export interface ArchiveIndex {
  find(question: string): ArchiveMatch | null;
}

/**
 * Indexes every phrasing of every entry once. A search then walks inverted
 * lists (which phrasings hold this trigram, this word) and scores only the
 * phrasings that share something with the question: well under 1 ms for 16 000.
 * Phrasings sharing nothing would score 0; ties go to the earlier phrasing.
 */
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

  const indexed: Indexed[] = [];
  const wordPostings = new Map<string, { at: number; weight: number }[]>();
  const gramPostings = new Map<string, number[]>();
  phrasings.forEach(({ entry, q }, at) => {
    const { vector, norm } = vectorOf(tokenised[at]);
    const grams = trigrams(q);
    indexed.push({ entry, norm, grams: grams.size });
    for (const [t, weight] of vector) {
      const list = wordPostings.get(t);
      if (list) list.push({ at, weight });
      else wordPostings.set(t, [{ at, weight }]);
    }
    for (const g of grams) {
      const list = gramPostings.get(g);
      if (list) list.push(at);
      else gramPostings.set(g, [at]);
    }
  });

  // Scratch space reused by every search.
  const shared = new Uint16Array(indexed.length);
  const dots = new Float64Array(indexed.length);
  const seen = new Uint8Array(indexed.length);

  return {
    find(question) {
      const { vector, norm } = vectorOf(words(question));
      const grams = trigrams(question);
      const touched: number[] = [];
      const touch = (at: number) => {
        if (!seen[at]) {
          seen[at] = 1;
          touched.push(at);
        }
      };
      for (const g of grams)
        for (const at of gramPostings.get(g) ?? []) {
          touch(at);
          shared[at]++;
        }
      for (const [t, w] of vector)
        for (const { at, weight } of wordPostings.get(t) ?? []) {
          touch(at);
          dots[at] += w * weight;
        }

      let best: ArchiveMatch | null = null;
      let bestAt = Infinity;
      for (const at of touched) {
        const item = indexed[at];
        const cosine = norm > 0 && item.norm > 0 ? dots[at] / (norm * item.norm) : 0;
        const total = grams.size + item.grams;
        const dice = total > 0 ? (2 * shared[at]) / total : 0;
        const score = weights.words * cosine + weights.letters * dice;
        if (!best || score > best.score || (score === best.score && at < bestAt)) {
          best = { entry: item.entry, score };
          bestAt = at;
        }
        shared[at] = 0;
        dots[at] = 0;
        seen[at] = 0;
      }
      return best;
    },
  };
}
