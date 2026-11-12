"use client";

/**
 * Note constellation: the melody drawn as stars on the circle of fifths.
 *
 * Every stable played note lights a star at its pitch class's angle on the
 * same wheel as the FifthsMandala (tonic at the top, same rotation), nudged
 * by its cents (0.3° per cent: an out-of-tune note visibly sits off its
 * spoke). Low notes sit near the centre, high ones near the rim. A star
 * grows while the note is held (in steps) and gains diagonal rays after a
 * second; a dotted link joins it to the previous star, so a phrase leaves
 * a path. A green ring marks a note of the current chord (a target note of
 * the improvisation), a coral ring a note outside the key. Stars live 10 s
 * after the note stops and fade in five steps.
 *
 * Designed to sit over a FifthsMandala of the same size (or alone); all
 * shapes are whole cells, links are 2-on/2-off cell dots.
 */

import { useRef, type RefObject } from "react";

import { CHORD_QUALITY_INTERVALS, fifthsIndex, scaleDegree } from "@audiolab/core";

import { approachAngle, TAU } from "../draw";
import { StageCanvas, type StageFrame } from "../StageCanvas";
import { STAGE_THEME, type StageTheme } from "../theme";
import type { StageSignals } from "../useStageSignals";

export interface NoteConstellationProps {
  signals: RefObject<StageSignals | null>;
  /** Width and height in CSS px (the mandala's diameter when stacked on one). */
  size: number;
  /** Cell size. Default 4. */
  pixel?: number;
  theme?: StageTheme;
}

const SEC = TAU / 12;
const MAX_STARS = 40;
/** Seconds a star lives after its note stops; the last FADE of them fade in steps. */
const LIFE = 10;
const FADE = 4;
const FADE_STEPS = 5;
/** Note must hold this long (s) before it lights a star, unless it follows an attack. */
const STABLE = 0.12;
const DEG = Math.PI / 180;

interface Star {
  alive: boolean;
  seq: number;
  pc: number;
  midi: number;
  cents: number;
  born: number;
  lastSeen: number;
  /** 0 none, 1 chord tone, 2 outside the key. */
  ring: 0 | 1 | 2;
  /** Slot and seq of the star born before this one (the link), or -1. */
  prev: number;
  prevSeq: number;
}

interface ConstellationState {
  rotation: number;
  stars: Star[];
  /** Slot of the newest star, -1 before the first. */
  newest: number;
  seq: number;
  candidate: number;
  candidateSince: number;
  lastBirth: number;
  seenOnsets: number;
  /** Cached ring offsets (dx, dy pairs) per radius in cells. */
  rings: Map<number, Int8Array>;
  /** Per-slot cell position and alpha of this frame. */
  xs: Float32Array;
  ys: Float32Array;
  alphas: Float32Array;
}

function targetRotation(signals: StageSignals): number {
  const key = signals.key.key;
  return key ? -Math.PI / 2 - fifthsIndex(key.tonic) * SEC : -Math.PI / 2;
}

/** One-cell-thick pixel circle, each cell once (no double alpha). */
function ringOffsets(cache: Map<number, Int8Array>, r: number): Int8Array {
  let offsets = cache.get(r);
  if (offsets) return offsets;
  const cells: number[] = [];
  for (let dy = -r - 1; dy <= r + 1; dy++) {
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      if (Math.abs(Math.hypot(dx, dy) - r) < 0.5) cells.push(dx, dy);
    }
  }
  offsets = Int8Array.from(cells);
  cache.set(r, offsets);
  return offsets;
}

function slotOfSeq(stars: readonly Star[], seq: number): number {
  for (let i = 0; i < stars.length; i++) if (stars[i].alive && stars[i].seq === seq) return i;
  return -1;
}

export function NoteConstellation({
  signals,
  size,
  pixel = 4,
  theme = STAGE_THEME,
}: NoteConstellationProps) {
  const state = useRef<ConstellationState>({
    rotation: -Math.PI / 2,
    stars: Array.from({ length: MAX_STARS }, () => ({
      alive: false,
      seq: 0,
      pc: 0,
      midi: 0,
      cents: 0,
      born: 0,
      lastSeen: 0,
      ring: 0 as const,
      prev: -1,
      prevSeq: 0,
    })),
    newest: -1,
    seq: 0,
    candidate: -1,
    candidateSince: 0,
    lastBirth: -Infinity,
    seenOnsets: 0,
    rings: new Map(),
    xs: new Float32Array(MAX_STARS),
    ys: new Float32Array(MAX_STARS),
    alphas: new Float32Array(MAX_STARS),
  });

  const listen = (s: StageSignals, now: number) => {
    const st = state.current;
    const note = s.note;
    const clear = note !== null && note.clarity >= 0.8;
    if (clear && note.midi !== st.candidate) {
      st.candidate = note.midi;
      st.candidateSince = now;
    } else if (!note || note.clarity < 0.6) {
      st.candidate = -1;
    }

    // The newest star stays "held" while its note keeps sounding.
    const cur = st.newest >= 0 ? st.stars[st.newest] : null;
    const held = cur !== null && cur.alive && now - cur.lastSeen < 0.25;
    if (held && note && note.midi === cur.midi && note.clarity >= 0.6) {
      cur.lastSeen = now;
      cur.cents += (note.cents - cur.cents) * 0.1;
    }
    if (!clear || now - st.lastBirth < 0.1) return;

    const lastOnset = s.onsets.length ? s.onsets[s.onsets.length - 1].time : -Infinity;
    const attacked = s.onsetCount !== st.seenOnsets && now - lastOnset < 0.15;
    const differs = !held || note.midi !== cur.midi;
    const stable = now - st.candidateSince >= STABLE;
    if (!differs || !(stable || attacked)) return;

    // Birth: reuse a dead slot, else the oldest.
    let slot = st.stars.findIndex((x) => !x.alive);
    if (slot < 0) {
      slot = 0;
      for (let i = 1; i < MAX_STARS; i++) if (st.stars[i].seq < st.stars[slot].seq) slot = i;
    }
    const chord = s.chord.current;
    const key = s.key.key;
    const inChord =
      chord !== null &&
      !s.chord.silent &&
      CHORD_QUALITY_INTERVALS[chord.quality].some((i) => (chord.root + i) % 12 === note.pitchClass);
    const outOfKey = key !== null && scaleDegree(note.pitchClass, key.tonic, key.mode) === null;
    const star = st.stars[slot];
    star.prev = st.newest;
    star.prevSeq = st.seq;
    star.alive = true;
    star.seq = ++st.seq;
    star.pc = note.pitchClass;
    star.midi = note.midi;
    star.cents = note.cents;
    star.born = now;
    star.lastSeen = now;
    star.ring = inChord ? 1 : outOfKey ? 2 : 0;
    st.newest = slot;
    st.lastBirth = now;
    st.seenOnsets = s.onsetCount;
  };

  const draw = (ctx: CanvasRenderingContext2D, f: StageFrame) => {
    const s = signals.current;
    if (!s) return;
    const st = state.current;
    st.rotation = approachAngle(st.rotation, targetRotation(s), f.dt, 0.6);
    listen(s, f.now);

    const cx = f.width / 2;
    const cy = f.height / 2;
    // Same wheel radius as a labelled FifthsMandala of this size.
    const R = (Math.min(f.width, f.height) / 2) * 0.8;
    const { xs, ys, alphas } = st;

    for (let i = 0; i < MAX_STARS; i++) {
      const star = st.stars[i];
      if (!star.alive) continue;
      const age = f.now - star.lastSeen;
      if (age >= LIFE) {
        star.alive = false;
        continue;
      }
      const fadeStep = Math.floor((age - (LIFE - FADE)) / (FADE / FADE_STEPS));
      alphas[i] = fadeStep < 0 ? 1 : 1 - (fadeStep + 1) / (FADE_STEPS + 1);
      const octave = Math.floor(star.midi / 12) - 1;
      const r = R * Math.min(0.9, Math.max(0.3, 0.3 + 0.12 * (octave - 2)));
      const a = st.rotation + fifthsIndex(star.pc) * SEC + star.cents * 0.3 * DEG;
      xs[i] = Math.round(cx + r * Math.cos(a));
      ys[i] = Math.round(cy + r * Math.sin(a));
    }

    // Links to the previous star (by birth order): 2-on / 2-off dots.
    ctx.fillStyle = theme.ink;
    for (let i = 0; i < MAX_STARS; i++) {
      const star = st.stars[i];
      if (!star.alive) continue;
      const prev = star.prev;
      if (prev < 0 || !st.stars[prev].alive || st.stars[prev].seq !== star.prevSeq) continue;
      // The last few links of the phrase at 40 %, older ones fainter.
      ctx.globalAlpha = (st.seq - star.seq < 8 ? 0.4 : 0.2) * Math.min(alphas[i], alphas[prev]);
      const dx = xs[i] - xs[prev];
      const dy = ys[i] - ys[prev];
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      for (let k = 3; k <= steps - 3; k++) {
        if ((k >> 1) & 1) continue;
        ctx.fillRect(
          Math.round(xs[prev] + (dx * k) / steps),
          Math.round(ys[prev] + (dy * k) / steps),
          1,
          1,
        );
      }
    }

    // Stars, oldest first so the newest lands on top (the slots are reused out of order).
    const first = st.seq - MAX_STARS;
    for (let n = Math.max(1, first + 1); n <= st.seq; n++) {
      const i = slotOfSeq(st.stars, n);
      if (i < 0) continue;
      const star = st.stars[i];
      const heldFor = star.lastSeen - star.born;
      // Grows while held: a 3-, 5- then 7-cell cross (12 → 28 px), in 250 ms steps; then a solid core.
      const arm = Math.min(3, 1 + Math.floor(heldFor / 0.25));
      const fat = arm === 3;
      const rays = heldFor >= 1;
      const x = xs[i];
      const y = ys[i];
      ctx.globalAlpha = alphas[i];
      if (star.ring) {
        ctx.fillStyle = star.ring === 1 ? theme.good : theme.bad;
        const off = ringOffsets(st.rings, arm + 2);
        for (let k = 0; k < off.length; k += 2) ctx.fillRect(x + off[k], y + off[k + 1], 1, 1);
      }
      // Night outline one cell around every bar, then the colour.
      for (let pass = 0; pass < 2; pass++) {
        const o = pass === 0 ? 1 : 0;
        ctx.fillStyle = pass === 0 ? theme.night : theme.pitchBright[star.pc];
        ctx.fillRect(x - arm - o, y - o, 2 * arm + 1 + 2 * o, 1 + 2 * o);
        ctx.fillRect(x - o, y - arm - o, 1 + 2 * o, 2 * arm + 1 + 2 * o);
        if (fat) ctx.fillRect(x - 1 - o, y - 1 - o, 3 + 2 * o, 3 + 2 * o);
        if (rays) {
          for (let k = 2; k < arm + 1; k++) {
            ctx.fillRect(x - k - o, y - k - o, 1 + 2 * o, 1 + 2 * o);
            ctx.fillRect(x + k - o, y - k - o, 1 + 2 * o, 1 + 2 * o);
            ctx.fillRect(x - k - o, y + k - o, 1 + 2 * o, 1 + 2 * o);
            ctx.fillRect(x + k - o, y + k - o, 1 + 2 * o, 1 + 2 * o);
          }
        }
      }
      if (fat) {
        // A light core: the star's twinkle point.
        ctx.fillStyle = theme.ink;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  };

  return (
    <StageCanvas
      width={size}
      height={size}
      pixel={pixel}
      draw={draw}
      label="Constellation of the played notes"
    />
  );
}
