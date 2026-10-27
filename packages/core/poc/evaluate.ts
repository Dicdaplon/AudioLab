/**
 * Proof-of-concept evaluation: every method is a plain function from audio
 * to an answer, scored on the POC dataset under the POC conditions. Scores
 * are averaged per group (style, backing, synthetic), then over groups
 * (each style weighs the same). No intervals: a POC says where to look,
 * the benchmark (bench/) decides.
 */
import { chordPitchClasses, type ChordQuality } from "../src/analysis/chordDetection";
import {
  keyMerged,
  keyStrict,
  onsetScore,
  tempoAcc1,
  tempoAcc2,
  type KeyRef,
} from "../bench/metrics";
import { scoreProgression } from "../tests/helpers/progressions";
import { POC_CONDITIONS, pocItems, underCondition, type PocItem } from "./data";

export type OnsetMethod = (samples: Float32Array, sampleRate: number) => number[];
/** Tempo readings, one a second once 8 s have been heard (NaN for none). */
export type TempoMethod = (samples: Float32Array, sampleRate: number) => number[];
export interface ShownChord {
  root: number;
  quality: ChordQuality;
}
/** The chord shown at each display frame (10 fps), with the frame time. */
export type ChordMethod = (
  samples: Float32Array,
  sampleRate: number,
  item: PocItem,
) => Frames | Promise<Frames>;
type Frames = { time: number; chord: ShownChord | null }[];
export type KeyMethod = (
  samples: Float32Array,
  sampleRate: number,
) => KeyRef | null | Promise<KeyRef | null>;
/** f0 in Hz every 10 ms (frame i centred at i·10 ms), 0 when unvoiced. */
export type PitchMethod = (samples: Float32Array, sampleRate: number) => Float32Array;

export interface Scores {
  /** condition → metric → macro score over groups. */
  byCondition: Record<string, Record<string, number>>;
  /** group → metric → score, clean only. */
  byGroup: Record<string, Record<string, number>>;
  seconds: number;
}

type Tally = Map<string, Map<string, { sum: number; weight: number }>>; // group → metric

function add(t: Tally, group: string, metric: string, x: number, w = 1): void {
  if (!Number.isFinite(x)) return;
  if (!t.has(group)) t.set(group, new Map());
  const m = t.get(group)!;
  const e = m.get(metric) ?? { sum: 0, weight: 0 };
  e.sum += x * w;
  e.weight += w;
  m.set(metric, e);
}

function macro(t: Tally): Record<string, number> {
  const out: Record<string, number[]> = {};
  for (const m of t.values()) {
    for (const [metric, e] of m) (out[metric] ??= []).push(e.sum / e.weight);
  }
  return Object.fromEntries(
    Object.entries(out).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]),
  );
}

function perGroup(t: Tally): Record<string, Record<string, number>> {
  return Object.fromEntries(
    [...t].map(([g, m]) => [g, Object.fromEntries([...m].map(([k, e]) => [k, e.sum / e.weight]))]),
  );
}

async function run(
  select: (item: PocItem) => boolean,
  score: (item: PocItem, samples: Float32Array, tally: Tally) => void | Promise<void>,
  conditions = POC_CONDITIONS,
): Promise<Scores> {
  const started = Date.now();
  const items = (await pocItems()).filter(select);
  const byCondition: Scores["byCondition"] = {};
  let byGroup: Scores["byGroup"] = {};
  for (const c of conditions) {
    const tally: Tally = new Map();
    for (const item of items) {
      const s = await underCondition(item, c);
      if (s) await score(item, s, tally);
    }
    if (tally.size === 0) continue;
    byCondition[c.id] = macro(tally);
    if (c.id === "clean") byGroup = perGroup(tally);
  }
  return { byCondition, byGroup, seconds: (Date.now() - started) / 1000 };
}

export function evalOnsets(method: OnsetMethod): Promise<Scores> {
  return run(
    (i) => !!i.onsets,
    (item, s, t) => {
      const r = onsetScore(item.onsets!, method(s, item.sampleRate));
      const n = item.onsets!.length;
      const part = item.id.endsWith("_solo") ? "solo" : "comp";
      add(t, item.group, "F", r.f, n);
      add(t, item.group, "P", r.precision, n);
      add(t, item.group, "R", r.recall, n);
      add(t, item.group, `F ${part}`, r.f, n);
    },
  );
}

export function evalTempo(method: TempoMethod): Promise<Scores> {
  return run(
    (i) => !!i.bpm,
    (item, s, t) => {
      const reads = method(s, item.sampleRate);
      if (!reads.length) return;
      const share = (f: (b: number) => boolean) =>
        reads.filter((b) => Number.isFinite(b) && f(b)).length / reads.length;
      add(
        t,
        item.group,
        "Acc1",
        share((b) => tempoAcc1(b, item.bpm!)),
      );
      add(
        t,
        item.group,
        "Acc2",
        share((b) => tempoAcc2(b, item.bpm!)),
      );
    },
  );
}

const pitchSet = (c: ShownChord | null) =>
  c ? chordPitchClasses(c.root, c.quality).join(",") : null;

export function evalChords(method: ChordMethod): Promise<Scores> {
  return run(
    (i) => !!i.chords,
    async (item, s, t) => {
      const out = (await method(s, item.sampleRate, item)).map((o) => ({
        time: o.time,
        answer: pitchSet(o.chord),
      }));
      const sc = scoreProgression(item.chords!, out);
      if (!sc.frames) return;
      add(t, item.group, "acc", sc.correct / sc.frames, sc.frames);
      add(
        t,
        item.group,
        "wrong/min",
        (sc.wrongInTransition + sc.wrongSteady) / (sc.seconds / 60),
        sc.seconds,
      );
      const d = [...sc.delays].sort((a, b) => a - b);
      if (d.length) add(t, item.group, "delay", d[Math.floor(d.length / 2)], d.length);
      add(t, item.group, "missed", sc.missed / Math.max(1, sc.changes), sc.changes);
    },
  );
}

export function evalKeys(method: KeyMethod): Promise<Scores> {
  return run(
    (i) => !!i.key,
    async (item, s, t) => {
      const k = await method(s, item.sampleRate);
      add(t, item.group, "strict", k && keyStrict(k, item.key!) ? 1 : 0);
      add(t, item.group, "merged", k && keyMerged(k, item.key!) ? 1 : 0);
    },
  );
}

export function evalPitch(method: PitchMethod): Promise<Scores> {
  return run(
    (i) => !!i.pitch,
    (item, s, t) => {
      const raw = method(s, item.sampleRate);
      // POC_PITCH_HOLD=N: answer every N frames and hold (a display rate), same for every method.
      const hold = Math.max(1, Number(process.env.POC_PITCH_HOLD ?? 1));
      const est = hold > 1 ? raw.map((_, i) => raw[i - (i % hold)]) : raw;
      const ref = item.pitch!;
      let voiced = 0;
      let within50 = 0;
      let within10 = 0;
      let octave = 0;
      let unvoiced = 0;
      let falseAlarm = 0;
      for (let i = 0; i < Math.min(ref.length, est.length); i++) {
        const r = ref[i];
        if (Number.isNaN(r)) continue;
        if (r === 0) {
          unvoiced++;
          if (est[i] > 0) falseAlarm++;
          continue;
        }
        voiced++;
        if (!(est[i] > 0)) continue;
        const cents = Math.abs(1200 * Math.log2(est[i] / r));
        if (cents <= 50) within50++;
        if (cents <= 10) within10++;
        const octaveCents = Math.abs(cents - 1200);
        if (octaveCents <= 50 || Math.abs(cents - 1902) <= 50) octave++;
      }
      if (!voiced) return;
      add(t, item.group, "RPA50", within50 / voiced, voiced);
      add(t, item.group, "RPA10", within10 / voiced, voiced);
      add(t, item.group, "octave", octave / voiced, voiced);
      if (unvoiced) add(t, item.group, "falseVoice", falseAlarm / unvoiced, unvoiced);
    },
  );
}

/** One markdown row per method: the main metric per condition, then the other metrics clean. */
export function table(results: Record<string, Scores>, main: string, extra: string[]): string {
  const conds = POC_CONDITIONS.map((c) => c.id).filter((c) =>
    Object.values(results).some((r) => r.byCondition[c]),
  );
  const pct = (x: number | undefined, m = main) =>
    x === undefined
      ? "–"
      : ["delay"].includes(m)
        ? `${Math.round(1000 * x)} ms`
        : m.includes("/min")
          ? x.toFixed(1)
          : (100 * x).toFixed(1);
  const head = [
    "Method",
    ...conds.map((c) => `${main} ${c}`),
    ...extra.map((e) => `${e} clean`),
    "s",
  ];
  const rows = Object.entries(results).map(([name, r]) => [
    name,
    ...conds.map((c) => pct(r.byCondition[c]?.[main])),
    ...extra.map((e) => pct(r.byCondition.clean?.[e], e)),
    r.seconds.toFixed(0),
  ]);
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}
