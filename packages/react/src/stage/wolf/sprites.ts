/**
 * The wolf's pixel art: 16 × 16 cells, facing right, one character per cell
 * (`#` fur, `o` open eye, `c` closed eye, `n` nose, `.` empty). The tail is drawn
 * apart so it can wag. `drawWolf` paints a sprite with a 1-cell night
 * outline (readable on any background) and a light rim on its top edges:
 * bold cells only, nothing thinner than a cell.
 */

export const WOLF_CELLS = 16;

type Rows = readonly string[];

const HEAD_SIT: Rows = [
  "........#..#....",
  "........##.##...",
  "........######..",
  ".......#######..",
  ".......##o#####n",
  ".......########.",
  "........######..",
];
const HEAD_TALK: Rows = [
  "........#..#....",
  "........##.##...",
  "........######..",
  ".......#######..",
  ".......##o#####n",
  ".......####.....",
  "........#######.",
];
const HEAD_TILT: Rows = [
  ".............n..",
  "........#...###.",
  "........##.###..",
  "........######..",
  ".......##o###...",
  ".......######...",
  "........####....",
];
const HEAD_HOWL: Rows = [
  "...........n....",
  "..........###...",
  ".........####...",
  ".......#.####...",
  ".......##o###...",
  "........#####...",
  "........####....",
];
const BODY: Rows = [
  "......######....",
  ".....#######....",
  "....########....",
  "....#########...",
  "...##########...",
  "...#####.###....",
  "...#####.###....",
  "...####..###....",
  ".######.####....",
];

export type WolfHead = "sit" | "talk" | "tilt" | "howl";
const HEADS: Readonly<Record<WolfHead, Rows>> = {
  sit: HEAD_SIT,
  talk: HEAD_TALK,
  tilt: HEAD_TILT,
  howl: HEAD_HOWL,
};

export type WolfTail = "down" | "mid" | "up";
/** Tail cells [x, y] for each position. */
const TAILS: Readonly<Record<WolfTail, readonly (readonly [number, number])[]>> = {
  down: [
    [0, 13],
    [1, 13],
    [0, 14],
    [1, 14],
    [2, 14],
  ],
  mid: [
    [0, 12],
    [1, 12],
    [1, 13],
    [2, 13],
  ],
  up: [
    [0, 10],
    [0, 11],
    [1, 11],
    [1, 12],
    [2, 12],
  ],
};

/** Lying wolf, asleep (two breathing frames). */
const LYING: readonly Rows[] = [
  [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...........#.#..",
    "....#####.#####.",
    "..##########c##n",
    ".###############",
    "##############..",
    ".#############..",
  ],
  [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....####........",
    "...######..#.#..",
    "..#######.#####.",
    "..##########c##n",
    ".###############",
    "##############..",
    ".#############..",
  ],
];

/** Muzzle tip of the howling head (where the sound arcs start). */
export const WOLF_MUZZLE = { x: 11, y: 0 };

export interface SitSpriteOptions {
  head: WolfHead;
  tail: WolfTail;
  blink?: boolean;
  /** One ear folds back for a moment. */
  earTwitch?: boolean;
}

/** A sitting wolf as a 16 × 16 character grid. */
export function sitSprite({
  head,
  tail,
  blink = false,
  earTwitch = false,
}: SitSpriteOptions): string[] {
  const rows = [...HEADS[head], ...BODY].map((r) => r.split(""));
  if (blink) for (const r of rows) for (let x = 0; x < r.length; x++) if (r[x] === "o") r[x] = "c";
  if (earTwitch && head === "sit") rows[0][11] = ".";
  for (const [x, y] of TAILS[tail]) rows[y][x] = "#";
  return rows.map((r) => r.join(""));
}

/** The sleeping wolf, breathing in (1) or out (0). */
export function lyingSprite(breath: 0 | 1): readonly string[] {
  return LYING[breath];
}

/** The grid turned by `quarter` quarter-turns clockwise (exact on cells). */
export function rotateSprite(rows: readonly string[], quarter: number): string[] {
  const n = rows.length;
  const q = ((quarter % 4) + 4) % 4;
  if (q === 0) return [...rows];
  const out: string[] = [];
  for (let y = 0; y < n; y++) {
    let line = "";
    for (let x = 0; x < n; x++) {
      const [sx, sy] = q === 1 ? [y, n - 1 - x] : q === 2 ? [n - 1 - x, n - 1 - y] : [n - 1 - y, x];
      line += rows[sy][sx] ?? ".";
    }
    out.push(line);
  }
  return out;
}

export interface WolfColours {
  outline: string;
  fur: string;
  rim: string;
  eye: string;
}

/**
 * Paint `rows` with its top-left cell at (x, y), mirrored when `flip` (to
 * face left). Cells outside the canvas are simply clipped by the canvas.
 */
export function drawWolf(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  x: number,
  y: number,
  flip: boolean,
  colours: WolfColours,
): void {
  const n = rows.length;
  const filled = (cx: number, cy: number) =>
    cy >= 0 && cy < n && cx >= 0 && cx < rows[cy].length && rows[cy][cx] !== ".";
  const at = (cx: number) => (flip ? x + n - 1 - cx : x + cx);
  // Outline: every empty cell touching the wolf.
  ctx.fillStyle = colours.outline;
  for (let cy = -1; cy <= n; cy++) {
    for (let cx = -1; cx <= n; cx++) {
      if (filled(cx, cy)) continue;
      if (filled(cx - 1, cy) || filled(cx + 1, cy) || filled(cx, cy - 1) || filled(cx, cy + 1))
        ctx.fillRect(at(cx), y + cy, 1, 1);
    }
  }
  for (let cy = 0; cy < n; cy++) {
    const row = rows[cy];
    for (let cx = 0; cx < row.length; cx++) {
      const c = row[cx];
      if (c === ".") continue;
      ctx.fillStyle =
        c === "o" || c === "c" || c === "n"
          ? colours.eye
          : !filled(cx, cy - 1)
            ? colours.rim
            : colours.fur;
      ctx.fillRect(at(cx), y + cy, 1, 1);
    }
  }
}

/** A 4 × 4 "Z" for the sleeping wolf. */
export const Z_GLYPH: readonly string[] = ["####", "..#.", ".#..", "####"];

export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: readonly string[],
  x: number,
  y: number,
  fill: string,
  outline: string,
): void {
  const h = glyph.length;
  const on = (cx: number, cy: number) => cy >= 0 && cy < h && glyph[cy][cx] === "#";
  ctx.fillStyle = outline;
  for (let cy = -1; cy <= h; cy++)
    for (let cx = -1; cx <= glyph[0].length; cx++)
      if (!on(cx, cy) && (on(cx - 1, cy) || on(cx + 1, cy) || on(cx, cy - 1) || on(cx, cy + 1)))
        ctx.fillRect(x + cx, y + cy, 1, 1);
  ctx.fillStyle = fill;
  for (let cy = 0; cy < h; cy++)
    for (let cx = 0; cx < glyph[cy].length; cx++)
      if (on(cx, cy)) ctx.fillRect(x + cx, y + cy, 1, 1);
}
