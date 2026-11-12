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
 */

import { useEffect, useRef, useState, type RefObject } from "react";

import type { Notation } from "../names";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";
import { WolfBrain, type WolfBrainOptions, type WolfPhrase, type WolfPose } from "./brain";
import type { WolfPhrases } from "./phrases";
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
}

const PIXEL = 4;
/** Brain steps per second. */
const STEP_MS = 200;
const JUMP_CELLS = 6;
const TUMBLE_CELLS = 4;

interface MoodRef {
  pose: WolfPose;
  poseAt: number;
  bubbleAt: number;
}

function nowSeconds(): number {
  return performance.now() / 1000;
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
}: WolfBuddyProps) {
  const brainRef = useRef<WolfBrain | null>(null);
  brainRef.current ??= new WolfBrain({ ...brainOptions, phrases });
  const sensorRef = useRef<WolfSensor | null>(null);
  sensorRef.current ??= new WolfSensor(notation);
  const moodRef = useRef<MoodRef>({ pose: "sit", poseAt: 0, bubbleAt: -Infinity });
  const [bubble, setBubble] = useState<WolfPhrase | null>(null);

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
      const mood = brain.step(sensor.read(s, now), now);
      const m = moodRef.current;
      m.pose = mood.pose;
      m.poseAt = mood.poseAt;
      if (mood.bubble !== shown) {
        shown = mood.bubble;
        if (shown) m.bubbleAt = shown.at;
        setBubble(shown);
      }
    };
    const id = setInterval(tick, STEP_MS);
    return () => clearInterval(id);
  }, [signals]);

  const flip = side === "left";
  const draw = (ctx: CanvasRenderingContext2D, { now, width: W, height: H }: StageFrame) => {
    const m = moodRef.current;
    const t = now - m.poseAt;
    const colours: WolfColours = {
      outline: theme.night,
      fur: theme.inkMuted,
      rim: theme.ink,
      eye: theme.night,
    };
    const baseX = flip ? W - WOLF_CELLS - 1 : 1;
    const baseY = H - WOLF_CELLS - 1;
    const blink = now % 4.3 < 0.15;
    const talking = now - m.bubbleAt < 1.2 && Math.floor(now / 0.15) % 2 === 0;
    let head: WolfHead = talking ? "talk" : "sit";
    let tail: WolfTail = "down";

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
            boxSizing: "border-box",
            padding: "4px 16px 8px",
            background: theme.plate,
            border: `4px solid ${theme.plateBorder}`,
            boxShadow: `4px 4px 0 rgba(0, 0, 0, 0.55)`,
            color: theme.ink,
            font: `${textSize}px/1 ${theme.fonts.hero}`,
            whiteSpace: "nowrap",
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
