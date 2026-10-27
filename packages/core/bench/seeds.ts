/**
 * Seeds of the benchmark: a hash of the item, not a shared random stream,
 * so adding or removing an item never changes the others.
 */

/** Bump when anything that changes the numbers changes (items, conditions, metrics). */
export const BENCH_VERSION = "2";

/** FNV-1a, 32 bits. */
export function fnv1a32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Seed of an item for a noise family ("pink", "bar", "bad-mic") or a generator. */
export function seedFor(itemId: string, family: string): number {
  return fnv1a32(`${BENCH_VERSION}|${itemId}|${family}`);
}
