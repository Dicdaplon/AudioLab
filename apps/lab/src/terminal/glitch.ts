/**
 * Damage for the terminal AI's output: a worn machine drops spaces, prints
 * unknown glyphs, stutters and shouts. Pure and seeded, so a reply keeps the
 * same scars when it is drawn again.
 */

const GLYPHS = ["�", "▒", "░", "#", "¤", "§", "¿", "∆", "▯", "%"];

/** A small deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Corrupts `text` at `rate` (0 = clean, 0.05 = a few scars per sentence).
 * Each character may become an unknown glyph, stutter, flip case, or lose
 * its space; line breaks are kept.
 */
export function glitch(text: string, rate = 0.04, seed = 2045): string {
  const random = rng(seed);
  let out = "";
  for (const ch of text) {
    const r = random();
    if (ch === "\n" || r >= rate) {
      out += ch;
      continue;
    }
    const kind = random();
    if (ch === " ") out += kind < 0.5 ? "" : "  ";
    else if (kind < 0.45) out += GLYPHS[Math.floor(random() * GLYPHS.length)];
    else if (kind < 0.7) out += ch + ch;
    else out += ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase();
  }
  return out;
}
