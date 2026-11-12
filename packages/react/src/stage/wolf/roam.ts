/**
 * Where the mascot goes when it lives on the spectrum city: a small state
 * machine in pixel-art cells, stepped on every animation frame.
 *
 * The wolf sits on a roof, and every few seconds (never frantic) picks a
 * destination and walks there along the roofline: it climbs the wall when
 * the next roof is higher (a real climb, not a teleport) and hops down when
 * it is lower. The roofs move with the music, so a growing building lifts
 * it and a sinking one makes it hop down. Now and then it goes to hide
 * behind the building of the lowest band (left) or of the highest one
 * (right), chosen by what the music does: heavy bass sends it to the treble
 * end and the other way round, a very loud passage to the nearest end; only
 * its ears and eyes show while it is loud, its whole head when it is quiet.
 * A big attack (the brain's jump or tumble) knocks it off its roof: it falls
 * with gravity, bounces once on the ground, sits dazed, then climbs back up.
 *
 * Pure and deterministic given `random`: no React, no DOM, testable in Node.
 * Positions are the top-left cell of the 16 × 16 sprite.
 */

export type RoamMode = "sit" | "walk" | "climb" | "hop" | "fall" | "dazed" | "hide";
/** The building it hides behind: lowest band (left) or highest band (right). */
export type HideEnd = "low" | "high";

/** The city as the wolf sees it, in cells. */
export interface RoamWorld {
  /** Width of the area. */
  width: number;
  /** The floor line (the bottom of the city). */
  ground: number;
  /** Top of the roof over cell column `x` (any column; clamp inside). */
  roofAt(x: number): number;
  /** Loudness 0 … 1 of each building, lowest band first (may be empty). */
  bands: readonly number[];
}

/** What the music does, for the moves. */
export interface RoamMusic {
  playing: boolean;
  /** Loudness 0 … 1 (the sensor's level). */
  level: number;
  /** A big attack this frame: the brain's "jump" or "tumble", else null. */
  knock: "jump" | "tumble" | null;
  /** May start a move (not asleep or howling). */
  free: boolean;
}

export interface RoamState {
  mode: RoamMode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 1 = facing right. */
  facing: 1 | -1;
  /** Where it walks to, or null. */
  target: number | null;
  /** Height it climbs to. */
  climbTo: number;
  /** Hiding there, or walking there to hide. */
  hide: HideEnd | null;
  /** Hidden: rows of the sprite above the roof (16 = standing on it). */
  peek: number;
  modeAt: number;
  nextMoveAt: number;
  hideUntil: number;
  /** A jump cannot knock it off before this time, a tumble before `graceUntil`. */
  safeUntil: number;
  graceUntil: number;
  /** Climbing back after a fall (cannot be knocked off the wall). */
  recovering: boolean;
  /** Last landing (for the dust), -Infinity before. */
  landedAt: number;
  bounced: boolean;
  /** The current fall comes from a hit (dazed at the end). */
  knocked: boolean;
}

export interface RoamOptions {
  /** Walking speed, cells per second. Default 5 (20 CSS px/s at 4 px cells). */
  walkSpeed?: number;
  /** Climbing speed, cells per second. Default 14. */
  climbSpeed?: number;
  /** Gravity, cells per second². Default 90. */
  gravity?: number;
  /** Pause between two moves, seconds (min, max). Default [5, 12]. */
  pauseSeconds?: readonly [number, number];
  /**
   * After it got back on a roof, time before a jump can knock it off again.
   * A tumble (the loudest attack) knocks it after 2 s already. Default 8.
   */
  fallGapSeconds?: number;
  /** Time sitting dazed after a fall. Default 1.6. */
  dazedSeconds?: number;
  /** Time hidden, seconds (min, max). Default [7, 14]. */
  hideSeconds?: readonly [number, number];
  /** Chance that a move is a hide when the music gives a reason. Default 0.45. */
  hideChance?: number;
  /** Highest roof step walked over without climbing or hopping, cells. Default 2. */
  stepUp?: number;
}

export const WOLF_ROAM_DEFAULTS: Required<RoamOptions> = {
  walkSpeed: 5,
  climbSpeed: 14,
  gravity: 90,
  pauseSeconds: [5, 12],
  fallGapSeconds: 8,
  dazedSeconds: 1.6,
  hideSeconds: [7, 14],
  hideChance: 0.45,
  stepUp: 2,
};

/** Sprite size in cells. */
export const ROAM_SPRITE = 16;
/** Columns of the sprite its paws stand on. */
const FEET = [3, 12] as const;
/** Cells of the sprite hanging out of the area at a hiding place (its back). */
const HIDE_OUT = 5;
/** Rows above the roof when hidden: ears and eyes (loud), the whole head (quiet). */
export const PEEK_EARS = 6;
export const PEEK_HEAD = 9;
const PEEK_SPEED = 12;
/** Longest walk, cells (about 13 s at the default speed). */
const MAX_WALK = 64;
/** Running to a hiding place: this many times the walking speed. */
const RUN = 3;
/** Back on a roof after a fall: no tumble knocks it off again before this. */
const RECOVER_GRACE = 2;
const SCARED_PEEK = 5;
const BAND_GAP = 0.15;
/** Chance to hide anyway (playing, no strong reason) or to peek out (silence). */
const CURIOUS = 0.25;
const VERY_LOUD = 0.85;
const LOUD_HIDE = 0.5;

function between(random: () => number, [a, b]: readonly [number, number]): number {
  return a + (b - a) * random();
}

/** Top of the sprite standing at `x`: paws on the highest roof under them, never under the ground. */
export function standY(world: RoamWorld, x: number): number {
  let top = world.ground;
  const from = Math.max(0, Math.round(x) + FEET[0]);
  const to = Math.min(world.width - 1, Math.round(x) + FEET[1]);
  for (let c = from; c <= to; c++) top = Math.min(top, world.roofAt(c));
  return top - ROAM_SPRITE;
}

/** Left of the sprite at a hiding place: its back out of the area, its head over the end building. */
export function hideX(world: RoamWorld, end: HideEnd): number {
  return end === "low" ? -HIDE_OUT : world.width - ROAM_SPRITE + HIDE_OUT;
}

/** Top of the hidden sprite showing `peek` rows above the end building's roof. */
export function hideY(world: RoamWorld, end: HideEnd, peek: number): number {
  const column = end === "low" ? 3 : world.width - 4;
  return Math.min(world.roofAt(column), world.ground) - peek;
}

/** Mean loudness of the lowest and highest thirds of the bands. */
export function bandBalance(bands: readonly number[]): { bass: number; treble: number } {
  const third = Math.max(1, Math.floor(bands.length / 3));
  if (bands.length === 0) return { bass: 0, treble: 0 };
  let bass = 0;
  let treble = 0;
  for (let i = 0; i < third; i++) {
    bass += bands[i];
    treble += bands[bands.length - 1 - i];
  }
  return { bass: bass / third, treble: treble / third };
}

/**
 * Where to hide, if the music gives a reason: heavy bass → the treble end
 * (it runs away from the bass), heavy treble → the bass end, very loud → the
 * nearest end, else now and then the end away from the louder one; in a
 * silence, now and then, either end to peek out. Null: just wander.
 */
export function chooseHide(
  world: RoamWorld,
  music: Pick<RoamMusic, "playing" | "level">,
  x: number,
  random: () => number,
): HideEnd | null {
  if (music.playing) {
    const { bass, treble } = bandBalance(world.bands);
    if (bass - treble >= BAND_GAP) return "high";
    if (treble - bass >= BAND_GAP) return "low";
    if (music.level >= VERY_LOUD) return x + ROAM_SPRITE / 2 < world.width / 2 ? "low" : "high";
    // No strong reason: now and then, away from the louder end.
    return random() < CURIOUS ? (bass > treble ? "high" : "low") : null;
  }
  const r = random();
  return r < CURIOUS / 2 ? "low" : r < CURIOUS ? "high" : null;
}

/** Next stop of a walk: a calm distance (a sixth to a half of the width, 64 cells at most) to the left or right. */
export function chooseDestination(world: RoamWorld, x: number, random: () => number): number {
  const span = Math.max(0, world.width - ROAM_SPRITE);
  if (span === 0) return 0;
  const distance = Math.max(8, Math.min(MAX_WALK, span * (0.16 + 0.34 * random())));
  let dir = random() < 0.5 ? -1 : 1;
  const room = (d: number) => (d < 0 ? x : span - x);
  if (room(dir) < Math.min(distance, span / 4)) dir = -dir;
  return Math.round(Math.max(0, Math.min(span, x + dir * distance)));
}

/**
 * A big attack knocks the wolf off when it stands or walks above the ground
 * (not while it climbs back after a fall, and a jump only `fallGapSeconds`
 * after it got back on a roof).
 */
export function shouldFall(
  state: RoamState,
  world: RoamWorld,
  music: Pick<RoamMusic, "knock">,
  time: number,
): boolean {
  if (!music.knock) return false;
  const climbing = state.mode === "climb" && !state.recovering;
  if (state.mode !== "sit" && state.mode !== "walk" && !climbing) return false;
  if (state.y + ROAM_SPRITE >= world.ground - 2) return false;
  return time >= (music.knock === "tumble" ? state.graceUntil : state.safeUntil);
}

/** A wolf sitting near the middle of the city, ready to move after a few seconds. */
export function createRoam(world: RoamWorld, time: number): RoamState {
  const x = Math.round(Math.max(0, world.width - ROAM_SPRITE) * 0.45);
  return {
    mode: "sit",
    x,
    y: standY(world, x),
    vx: 0,
    vy: 0,
    facing: -1,
    target: null,
    climbTo: 0,
    hide: null,
    peek: ROAM_SPRITE,
    modeAt: time,
    nextMoveAt: time + 3,
    hideUntil: 0,
    safeUntil: -Infinity,
    graceUntil: -Infinity,
    recovering: false,
    landedAt: -Infinity,
    bounced: false,
    knocked: false,
  };
}

/** One step of `dt` seconds; returns the new state (the old one is not changed). */
export function stepRoam(
  state: RoamState,
  world: RoamWorld,
  music: RoamMusic,
  time: number,
  dt: number,
  random: () => number = Math.random,
  options: RoamOptions = {},
): RoamState {
  const o = { ...WOLF_ROAM_DEFAULTS, ...options };
  const s: RoamState = { ...state };
  const floor = world.ground - ROAM_SPRITE;
  const span = Math.max(0, world.width - ROAM_SPRITE);
  const setMode = (mode: RoamMode) => {
    s.mode = mode;
    s.modeAt = time;
  };
  const rest = () => {
    s.target = null;
    setMode("sit");
    s.nextMoveAt = time + between(random, o.pauseSeconds);
  };

  if (shouldFall(s, world, music, time)) {
    setMode("fall");
    s.knocked = true;
    s.bounced = false;
    s.hide = null;
    s.target = null;
    s.vy = music.knock === "tumble" ? -20 : -14;
    s.vx = -s.facing * (music.knock === "tumble" ? 7 : 4);
  } else if (music.knock && s.mode === "hide") {
    // Scared: it ducks a little more and stays hidden a little longer.
    s.peek = Math.min(s.peek, SCARED_PEEK);
    s.hideUntil = Math.max(s.hideUntil, time + 3);
  }

  switch (s.mode) {
    case "sit": {
      const y = standY(world, s.x);
      if (y > s.y + o.stepUp) {
        // The roof sank under it: a small hop down.
        setMode("hop");
        s.knocked = false;
        s.vx = 0;
        s.vy = 0;
        break;
      }
      s.y = y;
      if (music.free && time >= s.nextMoveAt) {
        const end = chooseHide(world, music, s.x, random);
        if (end && random() < o.hideChance) {
          s.hide = end;
          s.target = hideX(world, end);
        } else {
          s.hide = null;
          s.target = chooseDestination(world, s.x, random);
        }
        setMode("walk");
      }
      break;
    }
    case "walk": {
      const target = s.target ?? s.x;
      const dir = Math.sign(target - s.x);
      if (dir !== 0) s.facing = dir > 0 ? 1 : -1;
      // It runs to its hiding place.
      const speed = s.hide ? o.walkSpeed * RUN : o.walkSpeed;
      const stride = speed * dt;
      const nx = Math.abs(target - s.x) <= stride ? target : s.x + dir * stride;
      const y = standY(world, nx);
      if (y < s.y - o.stepUp) {
        setMode("climb");
        s.climbTo = y;
        break;
      }
      s.x = nx;
      if (y > s.y + o.stepUp) {
        setMode("hop");
        s.knocked = false;
        s.vx = dir * speed;
        s.vy = -8;
        break;
      }
      s.y = y;
      if (s.x === target) {
        if (s.hide) {
          setMode("hide");
          s.facing = s.hide === "low" ? 1 : -1;
          s.peek = ROAM_SPRITE;
          s.hideUntil = time + between(random, o.hideSeconds);
        } else rest();
      }
      break;
    }
    case "climb": {
      // The roof may move while it climbs: aim at it again.
      const ahead = s.target === null ? s.x : s.x + s.facing;
      s.climbTo = standY(world, ahead);
      s.y -= o.climbSpeed * dt;
      if (s.y <= s.climbTo) {
        s.y = s.climbTo;
        if (s.recovering) {
          s.recovering = false;
          s.safeUntil = time + o.fallGapSeconds;
          s.graceUntil = time + RECOVER_GRACE;
        }
        if (s.target === null) rest();
        else setMode("walk");
      }
      break;
    }
    case "hop":
    case "fall": {
      s.vy += o.gravity * dt;
      const reach = s.knocked ? 0 : HIDE_OUT;
      s.x = Math.max(-reach, Math.min(span + reach, s.x + s.vx * dt));
      s.y += s.vy * dt;
      const land = s.knocked ? floor : Math.min(standY(world, s.x), floor);
      if (s.vy > 0 && s.y >= land) {
        s.y = land;
        s.landedAt = time;
        if (s.knocked && !s.bounced && s.vy > 20) {
          s.bounced = true;
          s.vy = -s.vy * 0.3;
          s.vx *= 0.5;
        } else if (s.knocked) {
          s.vx = s.vy = 0;
          setMode("dazed");
        } else {
          s.vx = s.vy = 0;
          if (s.target !== null) setMode("walk");
          else {
            setMode("sit");
            s.nextMoveAt = Math.max(s.nextMoveAt, time + 1);
          }
        }
      }
      break;
    }
    case "dazed": {
      s.y = floor;
      if (time - s.modeAt >= o.dazedSeconds) {
        s.knocked = false;
        s.target = null;
        s.climbTo = standY(world, s.x);
        s.recovering = true;
        setMode("climb");
      }
      break;
    }
    case "hide": {
      const end = s.hide ?? "low";
      s.x = hideX(world, end);
      s.facing = end === "low" ? 1 : -1;
      const out = time >= s.hideUntil;
      const want = out
        ? ROAM_SPRITE
        : music.playing && music.level >= LOUD_HIDE
          ? PEEK_EARS
          : PEEK_HEAD;
      const step = PEEK_SPEED * dt;
      s.peek += Math.max(-step, Math.min(step, want - s.peek));
      s.y = hideY(world, end, s.peek);
      if (out && s.peek >= ROAM_SPRITE) {
        s.hide = null;
        s.target = chooseDestination(world, Math.max(0, Math.min(span, s.x)), random);
        setMode("walk");
      }
      break;
    }
  }
  return s;
}
