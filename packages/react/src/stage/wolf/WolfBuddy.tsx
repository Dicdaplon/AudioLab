"use client";

/**
 * WolfBuddy: the stream's mascot, a small pixel wolf in a corner of the
 * overlay that reacts to the music. It listens (ear twitches, tail wags),
 * jumps on a big attack, tumbles on a huge one, dances on a steady beat,
 * howls when the key settles, falls asleep after a long silence, and now and
 * then says a short line in a speech bubble ("Too strong!", "Mhhh, you
 * sure?", "A minor, classy.").
 *
 * The decisions come from `WolfBrain`, fed five times per second by
 * `WolfSensor` from `signals.current`; React state changes only when a
 * bubble appears or goes. The sprite is drawn on a `StageCanvas` (4 px
 * cells) in its own animation loop; the bubble is DOM, so its VT323 text
 * stays sharp. The wolf sits at the bottom corner opposite to `side`, facing
 * the bubble.
 *
 * Given the `roofline` of a `SpectrumCity` drawn in the same box (`area`),
 * the wolf lives on the city instead (moves from `roam.ts`): it wanders
 * along the roofs, climbs and hops, hides behind the bass or the treble
 * building with only its ears and eyes showing (the buildings clip it), and
 * a big attack knocks it off: it falls, bounces in a puff of dust, sits
 * dazed under two turning stars and climbs back. The bubble follows it,
 * above its head when there is room, else beside it, always inside the box.
 */

import { useEffect, useRef, useState, type RefObject } from "react";

import type { Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";
import type { Roofline } from "../visuals/SpectrumCity";
import { WolfBrain, type WolfBrainOptions, type WolfPhrase, type WolfPose } from "./brain";
import type { WolfPhrases } from "./phrases";
import {
  createRoam,
  stepRoam,
  type RoamMusic,
  type RoamOptions,
  type RoamState,
  type RoamWorld,
} from "./roam";
import { WolfSensor } from "./sensor";
import {
  WOLF_CELLS,
  WOLF_MUZZLE,
  Z_GLYPH,
  drawGlyph,
  drawWolf,
  lyingSprite,
  rotateSprite,
  sitSprite,
  walkSprite,
  type WolfColours,
  type WolfHead,
  type WolfTail,
} from "./sprites";

export interface WolfBuddyProps {
  signals: RefObject<StageSignals | null>;
  /** CSS size of the corner (wolf, jumps and bubble). Default 320 × 176. */
  width?: number;
  height?: number;
  /** Where the bubble opens; the wolf sits in the other bottom corner. Default "left". */
  side?: "left" | "right";
  /** Key names in the phrases. Default "en" (the phrases are English). */
  notation?: Notation;
  theme?: StageTheme;
  /** Lines to use instead of `WOLF_PHRASES` (read at mount). */
  phrases?: Partial<WolfPhrases>;
  /** Talk rate, cooldowns and thresholds (read at mount). */
  brain?: Omit<WolfBrainOptions, "phrases">;
  /** Size of the bubble text in px. Default 32. */
  textSize?: number;
  /**
   * Roofline of a `SpectrumCity` drawn over `area`: the wolf lives on its
   * roofs instead of sitting in a corner. The component then covers `area`
   * plus `headroom` above it: place it `headroom` px above the city's top.
   */
  roofline?: RefObject<Roofline | null>;
  /** CSS size of the city box. Default `width` × `height`. */
  area?: { width: number; height: number };
  /** The ground line, CSS px from the top of `area`. Default its bottom. */
  ground?: number;
  /** Room above the city for jumps and the bubble, CSS px. Default 0. */
  headroom?: number;
  /** Walking speed, pauses, falls and hiding (read at mount). */
  roam?: RoamOptions;
  /** Random source for the moves. Default Math.random. */
  random?: () => number;
}

const PIXEL = 4;
/** Brain steps per second. */
const STEP_MS = 200;
const JUMP_CELLS = 6;
const TUMBLE_CELLS = 4;
/** Room left under the bubble for its two-step tail, px. */
const TAIL_PX = 28;

interface MoodRef {
  pose: WolfPose;
  poseAt: number;
  bubbleAt: number;
  playing: boolean;
  level: number;
}

/** A small "+" star, turning around the dazed wolf's head. */
const STAR: readonly string[] = [".#.", "###", ".#."];

function nowSeconds(): number {
  return performance.now() / 1000;
}

/** 0 or 1, alternating every two cells of `v`. */
function every2(v: number): 0 | 1 {
  return ((Math.floor(v / 2) % 2) + 2) % 2 === 0 ? 0 : 1;
}

/** Sound arcs leaving the muzzle (cells), one more every 150 ms. */
function drawArcs(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  t: number,
  flip: boolean,
  colour: string,
): void {
  ctx.fillStyle = colour;
  for (let i = 0; i < 3; i++) {
    const age = t - 0.2 - i * 0.15;
    if (age < 0) continue;
    const r = 3 + 3 * i;
    ctx.globalAlpha = age > 0.8 ? 0.45 : 0.9;
    for (let a = -1.35; a <= 0.25; a += 0.7 / r) {
      const dx = Math.round(r * Math.cos(a));
      ctx.fillRect(ox + (flip ? -dx : dx), Math.round(oy + r * Math.sin(a)), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

export function WolfBuddy({
  signals,
  width = 320,
  height = 176,
  side = "left",
  notation = "en",
  theme = STAGE_THEME,
  phrases,
  brain: brainOptions,
  textSize = 32,
  roofline,
  area,
  ground,
  headroom = 0,
  roam: roamOptions,
  random = Math.random,
}: WolfBuddyProps) {
  const brainRef = useRef<WolfBrain | null>(null);
  brainRef.current ??= new WolfBrain({ ...brainOptions, phrases });
  const sensorRef = useRef<WolfSensor | null>(null);
  sensorRef.current ??= new WolfSensor(notation);
  const moodRef = useRef<MoodRef>({
    pose: "sit",
    poseAt: 0,
    bubbleAt: -Infinity,
    playing: false,
    level: 0,
  });
  const [bubble, setBubble] = useState<WolfPhrase | null>(null);
  const roamRef = useRef<RoamState | null>(null);
  const knockSeen = useRef(-Infinity);
  const roamOpts = useRef(roamOptions);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const roaming = roofline !== undefined;
  const boxW = roaming ? (area?.width ?? width) : width;
  const boxH = roaming ? (area?.height ?? height) + headroom : height;

  useEffect(() => {
    sensorRef.current!.setNotation(notation);
  }, [notation]);

  // The brain looks at the music five times per second.
  useEffect(() => {
    const brain = brainRef.current!;
    const sensor = sensorRef.current!;
    let shown: WolfPhrase | null = null;
    const tick = () => {
      const s = signals.current;
      if (!s) return;
      const now = nowSeconds();
      const snapshot = sensor.read(s, now);
      const mood = brain.step(snapshot, now);
      const m = moodRef.current;
      m.pose = mood.pose;
      m.poseAt = mood.poseAt;
      m.playing = snapshot.playing;
      m.level = snapshot.level;
      if (mood.bubble !== shown) {
        shown = mood.bubble;
        if (shown) m.bubbleAt = shown.at;
        setBubble(shown);
      }
    };
    const id = setInterval(tick, STEP_MS);
    return () => clearInterval(id);
  }, [signals]);

  const colours: WolfColours = {
    outline: theme.night,
    fur: theme.inkMuted,
    rim: theme.ink,
    eye: theme.night,
  };

  /** One roaming step: a big attack (a new jump or tumble of the brain) knocks the wolf. */
  const roamStep = (f: StageFrame, world: RoamWorld): RoamState => {
    const m = moodRef.current;
    let knock: RoamMusic["knock"] = null;
    if ((m.pose === "jump" || m.pose === "tumble") && m.poseAt !== knockSeen.current) {
      knockSeen.current = m.poseAt;
      knock = m.pose;
    }
    const music: RoamMusic = {
      playing: m.playing,
      level: m.level,
      knock,
      free: m.pose !== "sleep" && m.pose !== "howl",
    };
    const prev = roamRef.current ?? createRoam(world, f.now);
    const r = stepRoam(prev, world, music, f.now, f.dt, random, roamOpts.current);
    roamRef.current = r;
    return r;
  };

  /** The bubble over the wolf's head (top-left cell `x`, top row `top`), or beside it. */
  const placeBubble = (x: number, top: number, flip: boolean, W: number, H: number) => {
    const el = bubbleRef.current;
    if (!el) return;
    const cw = W * PIXEL;
    const ch = H * PIXEL;
    const bw = el.offsetWidth;
    const bh = el.offsetHeight;
    const headX = (flip ? x + 4 : x + 11) * PIXEL;
    const topPx = top * PIXEL;
    const clampX = (v: number) => Math.max(0, Math.min(cw - bw, v));
    const tail = tailRef.current;
    let left: number;
    let y: number;
    if (topPx - bh - TAIL_PX >= 0) {
      left = clampX(headX - bw / 2);
      y = topPx - bh - TAIL_PX;
      if (tail) {
        tail.style.display = "block";
        tail.style.left = `${Math.round(Math.max(8, Math.min(bw - 24, headX - left - 6)))}px`;
      }
    } else {
      // No room above the head: beside it, on the side with more room.
      const leftOf = headX > cw / 2;
      left = clampX(leftOf ? (x + 1) * PIXEL - bw - 8 : (x + WOLF_CELLS) * PIXEL + 8);
      y = Math.max(0, Math.min(ch - bh, topPx));
      if (tail) tail.style.display = "none";
    }
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(y)}px`;
    el.style.visibility = "visible";
  };

  const draw = (ctx: CanvasRenderingContext2D, frame: StageFrame) => {
    const { now, width: W, height: H } = frame;
    const m = moodRef.current;
    const t = now - m.poseAt;
    let flip = side === "left";
    let baseX = flip ? W - WOLF_CELLS - 1 : 1;
    let baseY = H - WOLF_CELLS - 1;
    const blink = now % 4.3 < 0.15;
    const talking = now - m.bubbleAt < 1.2 && Math.floor(now / 0.15) % 2 === 0;
    let head: WolfHead = talking ? "talk" : "sit";
    let tail: WolfTail = "down";

    if (roaming) {
      const R = roofline.current;
      if (!R) return;
      const hc = headroom / PIXEL;
      const groundCells = hc + (ground ?? area?.height ?? height) / PIXEL;
      const world: RoamWorld = {
        width: W,
        ground: groundCells,
        roofAt: (c) => Math.min(groundCells, hc + R.roofAt(c * PIXEL + PIXEL / 2) / PIXEL),
        bands: R.bands?.() ?? [],
      };
      const r = roamStep(frame, world);
      const x = Math.round(r.x);
      const y = Math.round(r.y);
      flip = r.facing < 0;
      placeBubble(x, y, flip, W, H);
      // Dust where it landed, spreading for 0.45 s.
      const dust = now - r.landedAt;
      if (dust < 0.45) {
        const k = Math.floor(dust / 0.1);
        ctx.fillStyle = theme.inkFaint;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x + 1 - k, y + WOLF_CELLS - 1 - (k >> 1), 2, 1);
        ctx.fillRect(x + WOLF_CELLS - 3 + k, y + WOLF_CELLS - 1 - (k >> 1), 2, 1);
        ctx.globalAlpha = 1;
      }
      const sinceMode = now - r.modeAt;
      switch (r.mode) {
        case "walk":
          drawWolf(ctx, walkSprite(every2(r.x), blink), x, y, flip, colours);
          return;
        case "hop":
          drawWolf(ctx, walkSprite(1), x, y, flip, colours);
          return;
        case "climb":
          // Nose up, paws on the wall it faces.
          drawWolf(ctx, rotateSprite(walkSprite(every2(r.y)), 3), x, y, flip, colours);
          return;
        case "fall": {
          const sprite = sitSprite({ head: "sit", tail: "up", blink: true });
          const q = Math.floor(sinceMode / 0.1) % 4;
          drawWolf(ctx, rotateSprite(sprite, flip ? 4 - q : q), x, y, flip, colours);
          return;
        }
        case "dazed": {
          drawWolf(
            ctx,
            sitSprite({ head: "tilt", tail: "down", blink: true }),
            x,
            y,
            flip,
            colours,
          );
          const cx = flip ? x + 5 : x + 10;
          for (let i = 0; i < 2; i++) {
            const a = now * 5 + i * Math.PI;
            drawGlyph(
              ctx,
              STAR,
              Math.round(cx + 5 * Math.cos(a)) - 1,
              Math.round(y - 2 + 1.5 * Math.sin(a)) - 1,
              theme.signal,
              theme.night,
            );
          }
          return;
        }
        case "hide": {
          // Behind the end building: the city's roofline clips it.
          const sprite = sitSprite({
            head: "sit",
            tail: "down",
            blink: blink || m.pose === "sleep",
            earTwitch: now % 2.1 < 0.25,
          });
          drawWolf(ctx, sprite, x, y, flip, colours, (cx, cy) => cy < world.roofAt(cx));
          return;
        }
        default:
          baseX = x;
          baseY = y;
      }
    }

    if (m.pose === "sleep") {
      const breath = now % 3 < 1.5 ? 1 : 0;
      drawWolf(ctx, lyingSprite(breath), baseX, baseY, flip, colours);
      // Three "z"s rising from the head, one every 1.2 s.
      for (let i = 0; i < 3; i++) {
        const age = (now + i * 1.2) % 3.6;
        const rise = Math.floor(age / 0.3);
        const zx = baseX + (flip ? 2 : WOLF_CELLS - 6) + (rise % 2) * (flip ? -1 : 1) - i;
        const zy = baseY + 6 - rise;
        if (zy < 0) continue;
        ctx.globalAlpha = age > 2.4 ? 0.5 : 1;
        drawGlyph(ctx, Z_GLYPH, zx, zy, theme.signal, theme.night);
      }
      ctx.globalAlpha = 1;
      return;
    }

    let x = baseX;
    let y = baseY;
    let quarter = 0;
    switch (m.pose) {
      case "jump": {
        const u = Math.min(1, t / 0.4);
        const step = Math.ceil(u * 4) / 4;
        y -= Math.round(JUMP_CELLS * Math.sin(Math.PI * step));
        tail = "up";
        break;
      }
      case "tumble": {
        const u = Math.min(1, t / 0.7);
        quarter = Math.floor(u * 4) % 4;
        const away = flip ? 1 : -1;
        x += Math.round(away * TUMBLE_CELLS * Math.sin(Math.PI * u));
        y -= Math.round(4 * Math.sin(Math.PI * u));
        if (flip) quarter = (4 - quarter) % 4;
        break;
      }
      case "howl":
        head = t < 0.12 || t > 1.45 ? "tilt" : "howl";
        tail = "mid";
        break;
      case "dance": {
        const beat = signals.current?.beatAt(now) ?? null;
        const phase = beat ? beat.phase : (now / 0.5) % 1;
        const count = beat ? beat.beat : Math.floor(now / 0.5);
        if (phase < 0.35) y -= 1;
        tail = count % 2 === 0 ? "up" : "mid";
        if (!talking) head = count % 4 === 3 ? "tilt" : "sit";
        break;
      }
      case "listen":
        tail = Math.floor(now / 0.25) % 2 === 0 ? "mid" : "up";
        break;
      default:
        tail = now % 6 < 0.5 ? (Math.floor(now / 0.25) % 2 === 0 ? "mid" : "down") : "down";
    }
    const earTwitch = m.pose === "listen" && now % 2.7 < 0.2;
    let sprite: readonly string[] = sitSprite({ head, tail, blink, earTwitch });
    if (quarter) sprite = rotateSprite(sprite, quarter);
    drawWolf(ctx, sprite, x, y, flip, colours);

    if (m.pose === "howl" && head === "howl") {
      const tonic = signals.current?.key.key?.tonic;
      const colour = tonic === undefined ? theme.signal : theme.pitchBright[tonic];
      const ox = flip ? x + WOLF_CELLS - 1 - WOLF_MUZZLE.x - 1 : x + WOLF_MUZZLE.x + 1;
      drawArcs(ctx, ox, y + WOLF_MUZZLE.y, t, flip, colour);
    }
  };

  const bubbleLook = {
    boxSizing: "border-box",
    padding: "4px 16px 8px",
    background: theme.plate,
    border: `4px solid ${theme.plateBorder}`,
    boxShadow: `4px 4px 0 rgba(0, 0, 0, 0.55)`,
    color: theme.ink,
    font: `${textSize}px/1 ${theme.fonts.hero}`,
    whiteSpace: "nowrap",
  } as const;

  if (roaming) {
    // The bubble is placed on every frame by `placeBubble` (hidden until then).
    return (
      <div style={{ position: "relative", width: boxW, height: boxH }}>
        <StageCanvas width={boxW} height={boxH} pixel={PIXEL} draw={draw} />
        {bubble && (
          <div
            ref={bubbleRef}
            role="status"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              visibility: "hidden",
              maxWidth: boxW,
              ...bubbleLook,
            }}
          >
            {bubble.text}
            <div
              ref={tailRef}
              aria-hidden
              style={{ position: "absolute", top: "100%", left: 24, width: 16, height: 24 }}
            >
              {[0, 1].map((i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    top: 4 + i * 8,
                    left: i * 4,
                    width: 8,
                    height: 8,
                    background: theme.plateBorder,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // The wolf's head is about 50 px from the corner; the bubble ends 8 px
  // from it and its two-step tail comes down above the head.
  const bubbleBottom = PIXEL + WOLF_CELLS * PIXEL + 24;
  const near = side === "left" ? "right" : "left";

  return (
    <div style={{ position: "relative", width, height }}>
      <StageCanvas width={width} height={height} pixel={PIXEL} draw={draw} />
      {bubble && (
        <div
          role="status"
          style={{
            position: "absolute",
            bottom: bubbleBottom,
            [near]: 8,
            maxWidth: width - 2 * PIXEL,
            ...bubbleLook,
          }}
        >
          {bubble.text}
          {[0, 1].map((i) => (
            <span
              key={i}
              aria-hidden
              style={{
                position: "absolute",
                top: "100%",
                marginTop: 4 + i * 8,
                [near]: 26 + i * 8,
                width: 8,
                height: 8,
                background: theme.plateBorder,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
