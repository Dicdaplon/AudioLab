/**
 * The proof-of-concept dataset: short, diverse, and kept apart from the
 * benchmark's test material.
 *
 *   GuitarSet players 00–02 (the tuning split; the benchmark tests on
 *   03–05), the first two lead sheets of each style (BN, Funk, Jazz, Rock,
 *   SS): 10 accompaniment excerpts (chords, key, tempo, onsets) and the 10
 *   solo excerpts of the same sheets (onsets, pitch), cut to 20 s;
 *   the 5 trusted backing tracks, 2 clips each (key) and the 3 with a tempo
 *   (30 s); a few synthetic items with exact answers.
 *
 * POC_SPLIT=tune30 widens the tuning set to players 00–02 on all 30 lead
 * sheets (the 2-sheet POC set proved too small to rank methods).
 * POC_SPLIT=test switches to the confirmation set: players 03–05 on all 30
 * lead sheets (the benchmark's bench30 rotation) and two other clips per
 * backing track, to check out of sample what looked good on the POC set.
 *
 * Under four conditions: clean, pink-20 (noisy room), bar-10 (busy bar),
 * bad-mic (phone-grade microphone), from bench/augment.ts.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { CONDITIONS, applyCondition, type Condition } from "../bench/augment";
import type { KeyRef } from "../bench/metrics";
import { DEFAULT_BACKING, DEFAULT_GUITARSET, mergedOnsets } from "../bench/sources";
import { decodeAudioFile } from "../src/offline/decodeAudio";
import { majMin, parseHarte, parseHarteKey } from "../tests/helpers/harte";
import type { Progression } from "../tests/helpers/progressions";
import { concat } from "../tests/helpers/synth";

export const POC_CONDITIONS: readonly Condition[] = ["clean", "pink-20", "bar-10", "bad-mic"].map(
  (id) => CONDITIONS.find((c) => c.id === id)!,
);

const SECONDS = 20;

export interface PocItem {
  id: string;
  /** Style (GuitarSet), "backing" or "synthetic". */
  group: string;
  samples: Float32Array;
  sampleRate: number;
  chords?: Progression;
  key?: KeyRef;
  bpm?: number;
  beats?: number[];
  onsets?: number[];
  /** Reference f0 per 10 ms frame (Hz, 0 = unvoiced, NaN = several strings: skipped). */
  pitch?: Float32Array;
}

type Annotation = { time: number; duration: number; value: unknown }[];
interface Jams {
  file_metadata: { duration: number };
  annotations: {
    namespace: string;
    data: Annotation;
    annotation_metadata?: { data_source?: string };
  }[];
}

const styleOf = (sheet: string) => sheet.split("-")[0].replace(/\d+$/, "");

function chordRef(ann: Annotation, end: number): Progression {
  const chords: Progression["chords"] = [];
  for (const d of ann) {
    const r = majMin(parseHarte(String(d.value)));
    if (!r || d.time >= end) continue;
    const stop = Math.min(end, d.time + d.duration);
    const last = chords.at(-1);
    if (
      last &&
      last.root === r.root &&
      last.quality === r.quality &&
      Math.abs(last.end - d.time) < 1e-6
    ) {
      last.end = stop;
    } else chords.push({ name: "", root: r.root, quality: r.quality, start: d.time, end: stop });
  }
  return { signal: new Float32Array(0), chords, seconds: end };
}

/** f0 every 10 ms from the per-string pitch contours: one voiced string → its f0. */
function pitchRef(jams: Jams, seconds: number): Float32Array {
  const frames = Math.floor(seconds * 100);
  const voiced = Array.from({ length: frames }, () => [] as number[]);
  for (const a of jams.annotations) {
    if (a.namespace !== "pitch_contour") continue;
    const d = a.data as unknown as {
      time: number[];
      value: { voiced: boolean; frequency: number }[];
    };
    const times = d.time;
    for (let i = 0; i < times.length; i++) {
      const f = Math.round(times[i] * 100);
      if (f >= frames || !d.value[i].voiced || !(d.value[i].frequency > 0)) continue;
      const list = voiced[f];
      if (
        !list.length ||
        Math.abs(1200 * Math.log2(list[list.length - 1] / d.value[i].frequency)) > 1
      ) {
        list.push(d.value[i].frequency);
      }
    }
  }
  return Float32Array.from(voiced, (l) => (l.length === 0 ? 0 : l.length === 1 ? l[0] : NaN));
}

let cache: PocItem[] | null = null;

/** Every POC item (decoded once). */
export async function pocItems(
  guitarset = DEFAULT_GUITARSET,
  backing = DEFAULT_BACKING,
): Promise<PocItem[]> {
  if (cache) return cache;
  const items: PocItem[] = [];
  const jamsDir = path.join(guitarset, "annotations", "jams");
  if (existsSync(jamsDir)) {
    const sheets = readdirSync(jamsDir)
      .filter((f) => f.startsWith("00_") && f.endsWith("_comp.jams"))
      .map((f) => f.slice(3, -"_comp.jams".length))
      .sort();
    // "test": players 03–05 on all 30 sheets; "tune30": players 00–02 on all 30 sheets.
    const test = process.env.POC_SPLIT === "test";
    const all30 = test || process.env.POC_SPLIT === "tune30";
    const perStyle = new Map<string, number>();
    let rank = 0;
    for (const sheet of sheets) {
      const style = styleOf(sheet);
      if (!all30 && (perStyle.get(style) ?? 0) >= 2) continue;
      perStyle.set(style, (perStyle.get(style) ?? 0) + 1);
      const player = (test ? 3 : 0) + (rank++ % 3);
      for (const part of ["comp", "solo"] as const) {
        const id = `0${player}_${sheet}_${part}`;
        const jams = JSON.parse(readFileSync(path.join(jamsDir, `${id}.jams`), "utf8")) as Jams;
        const a = await decodeAudioFile(path.join(guitarset, "audio", `${id}_mic.wav`));
        const samples = a.samples.slice(0, SECONDS * a.sampleRate);
        const item: PocItem = {
          id,
          group: style,
          samples,
          sampleRate: a.sampleRate,
          onsets: mergedOnsets(jams, SECONDS),
          beats: jams.annotations
            .find((x) => x.namespace === "beat_position")
            ?.data.map((d) => d.time)
            .filter((t) => t < SECONDS),
        };
        if (part === "comp") {
          item.chords = chordRef(
            jams.annotations.filter((x) => x.namespace === "chord")[0].data,
            SECONDS,
          );
          const k = jams.annotations.find((x) => x.namespace === "key_mode");
          item.key = (k && parseHarteKey(String(k.data[0].value))) ?? undefined;
          const t = jams.annotations.find((x) => x.namespace === "tempo");
          if (t) item.bpm = Number(t.data[0].value);
        } else {
          item.pitch = pitchRef(jams, SECONDS);
        }
        items.push(item);
      }
    }
  }
  const manifest = path.join(backing, "manifest.jsonl");
  if (existsSync(manifest)) {
    const rows = readFileSync(manifest, "utf8")
      .trim()
      .split("\n")
      .map(
        (l) =>
          JSON.parse(l) as {
            clip_id: string;
            path: string;
            track_id: string;
            clip_index: number;
            key: { tonic_pc: number; mode: string };
            bpm: number | null;
            label_status: string;
          },
      );
    const byTrack = new Map<string, typeof rows>();
    for (const r of rows) byTrack.set(r.track_id, [...(byTrack.get(r.track_id) ?? []), r]);
    for (const [track, clips] of byTrack) {
      clips.sort((a, b) => a.clip_index - b.clip_index);
      const decode = async (r: (typeof rows)[number]) =>
        (await decodeAudioFile(path.join(backing, r.path))).samples;
      if (clips[0].label_status !== "suspect") {
        const at = process.env.POC_SPLIT === "test" ? [1 / 6, 5 / 6] : [1 / 3, 2 / 3];
        for (const r of at.map((q) => clips[Math.floor(q * clips.length)])) {
          items.push({
            id: r.clip_id,
            group: "backing",
            samples: await decode(r),
            sampleRate: 44100,
            key: { tonic: r.key.tonic_pc, mode: r.key.mode === "major" ? "maj" : "min" },
          });
        }
      }
      if (clips[0].bpm) {
        const mid = Math.floor(clips.length / 2) - 1;
        const parts: Float32Array[] = [];
        for (const r of clips.slice(mid, mid + 3)) parts.push(await decode(r));
        items.push({
          id: `${track}__30s`,
          group: "backing",
          samples: concat(parts),
          sampleRate: 44100,
          bpm: clips[0].bpm,
        });
      }
    }
  }
  cache = items;
  return items;
}

const conditioned = new Map<string, Float32Array>();

/** An item's samples under a condition (memoised); null when the condition is unavailable. */
export async function underCondition(
  item: PocItem,
  condition: Condition,
): Promise<Float32Array | null> {
  const key = `${item.id}|${condition.id}`;
  const hit = conditioned.get(key);
  if (hit) return hit;
  const a = await applyCondition(item.samples, item.sampleRate, condition, `poc:${item.id}`);
  if (!a) return null;
  conditioned.set(key, a.signal);
  return a.signal;
}
