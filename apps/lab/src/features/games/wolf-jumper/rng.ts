/**
 * Small seeded PRNG (mulberry32). The game state stores only the 32-bit seed,
 * which keeps the reducer pure and every game reproducible from its seed.
 */

/** Returns a float in [0, 1) and the seed to use for the next draw. */
export function nextRandom(seed: number): [value: number, nextSeed: number] {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Local, mutable cursor over a seed, for use inside a single reducer call. */
export class SeededRandom {
  seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    const [value, seed] = nextRandom(this.seed);
    this.seed = seed;
    return value;
  }

  /** Uniform integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }
}

/** A fresh 32-bit seed from `Math.random`, for production games. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32) | 0;
}
