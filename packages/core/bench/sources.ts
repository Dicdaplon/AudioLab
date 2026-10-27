/**
 * The items of the benchmark: real recordings with their references, and
 * synthetic signals whose answer is known by construction.
 *
 * Real
 *   GuitarSet "bench30"  one accompaniment excerpt per lead sheet (30), the
 *                        player rotating over 03–05 (the players nothing
 *                        was tuned on): 6 per style, 10 per player
 *   GuitarSet solo/comp  short excerpts for the onsets
 *   backing-tracks       AILab clips: 8 per trusted track for the key, 30 s
 *                        of the 3 tracks with a tempo in their title
 *   fixtures             tests/Sample Tona, FLStudio, Backing (key only)
 * Synthetic
 *   chords               guitar progressions, steady and fast
 *   keys                 three chord loops in all 24 keys
 *   rhythm               strums and syncopated notes at six tempos, plus
 *                        the onset cases of scripts/measureOnsets.ts
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decodeAudioFile } from "../src/offline/decodeAudio";
import { strum } from "../tests/helpers/guitar";
import { majMin, parseHarte, parseHarteKey } from "../tests/helpers/harte";
import { melody, performance, strums, strumsSpread, type NoteHit } from "../tests/helpers/onsets";
import { syntheticProgression, type Progression } from "../tests/helpers/progressions";
import { concat, mulberry32 } from "../tests/helpers/synth";
import type { KeyRef } from "./metrics";
import { seedFor } from "./seeds";

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SAMPLES_DIR = path.join(CORE, "tests", "Sample");
export const DEFAULT_GUITARSET = path.resolve(CORE, "../../../AILab/datasets/public/guitarset");
export const DEFAULT_BACKING = path.resolve(CORE, "../../../AILab/datasets/backing-tracks");

export interface Audio {
  samples: Float32Array;
  sampleRate: number;
}

/** What every item carries for the aggregation. */
export interface ItemBase {
  id: string;
  source: string;
  stratum: string;
  cluster: string;
}

export interface ChordItem extends ItemBase {
  audio: Audio;
  reference: Progression;
}
export interface KeyItem extends ItemBase {
  audio: Audio;
  key: KeyRef;
}
export interface TempoItem extends ItemBase {
  audio: Audio;
  bpm: number;
}
export interface OnsetItem extends ItemBase {
  audio: Audio;
  /** GuitarSet part ("comp": strummed accompaniment, "solo": single-note lines). */
  part?: "comp" | "solo";
  /** Reference onset times, in seconds. */
  onsets: number[];
}

export interface PitchItem extends ItemBase {
  audio: Audio;
  /** Reference f0 every 10 ms (Hz; 0 = silence; NaN = skipped: several strings or a fading note). */
  f0: Float32Array;
}

export interface Sources {
  chords: { synthetic: ChordItem[]; real: ChordItem[] };
  keys: { synthetic: KeyItem[]; real: KeyItem[] };
  tempo: { synthetic: TempoItem[]; real: TempoItem[] };
  onsets: { synthetic: OnsetItem[]; real: OnsetItem[] };
  pitch: { synthetic: PitchItem[]; real: PitchItem[] };
  /** What was found, for the report header. */
  found: Record<string, string>;
}

// --- GuitarSet -----------------------------------------------------------------

type Annotation = { time: number; duration: number; value: unknown }[];

interface Jams {
  file_metadata: { duration: number };
  annotations: { namespace: string; data: Annotation }[];
}

/** The 30 lead sheets ("BN1-129-Eb_comp" without the player), sorted. */
function leadSheets(jamsDir: string): string[] {
  return readdirSync(jamsDir)
    .filter((f) => f.startsWith("00_") && f.endsWith("_comp.jams"))
    .map((f) => f.slice(3, -"_comp.jams".length))
    .sort();
}

const styleOf = (sheet: string) => sheet.split("-")[0].replace(/\d+$/, "");

/**
 * bench30: the excerpt of player 3 + (rank mod 3) for each lead sheet. Quick
 * mode keeps the first two sheets of each style.
 */
export function bench30(jamsDir: string, quick: boolean): { sheet: string; player: number }[] {
  const sheets = leadSheets(jamsDir);
  const all = sheets.map((sheet, rank) => ({ sheet, player: 3 + (rank % 3) }));
  if (!quick) return all;
  const kept = new Map<string, number>();
  return all.filter(({ sheet }) => {
    const n = kept.get(styleOf(sheet)) ?? 0;
    kept.set(styleOf(sheet), n + 1);
    return n < 2;
  });
}

function reference(ann: Annotation, duration: number, shift: number, end: number): Progression {
  const chords: Progression["chords"] = [];
  for (const d of ann) {
    const r = majMin(parseHarte(String(d.value)));
    if (!r) continue;
    const start = d.time + shift;
    const stop = Math.min(end, d.time + d.duration + shift);
    if (stop <= start) continue;
    const last = chords.at(-1);
    if (
      last &&
      last.root === r.root &&
      last.quality === r.quality &&
      Math.abs(last.end - start) < 1e-6
    ) {
      last.end = stop;
    } else {
      chords.push({ name: "", root: r.root, quality: r.quality, start, end: stop });
    }
  }
  return { signal: new Float32Array(0), chords, seconds: duration };
}

/** f0 every 10 ms from GuitarSet's per-string pitch contours: one string sounding → its f0. */
export function pitchReference(jams: Jams, seconds: number): Float32Array {
  const frames = Math.floor(seconds * 100);
  const voiced = Array.from({ length: frames }, () => [] as number[]);
  for (const a of jams.annotations) {
    if (a.namespace !== "pitch_contour") continue;
    const d = a.data as unknown as {
      time: number[];
      value: { voiced: boolean; frequency: number }[];
    };
    for (let i = 0; i < d.time.length; i++) {
      const f = Math.round(d.time[i] * 100);
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

/** Note onsets of the six strings, merged when within 50 ms of the first of a group. */
export function mergedOnsets(jams: Jams, maxSeconds = Infinity): number[] {
  const times = jams.annotations
    .filter((a) => a.namespace === "note_midi")
    .flatMap((a) => a.data.map((d) => d.time))
    .filter((t) => t < maxSeconds)
    .sort((a, b) => a - b);
  const events: number[] = [];
  for (const t of times) if (!events.length || t - events[events.length - 1] > 0.05) events.push(t);
  return events;
}

async function loadGuitarSet(dir: string, quick: boolean) {
  const jamsDir = path.join(dir, "annotations", "jams");
  const audioDir = path.join(dir, "audio");
  const out = {
    chords: [] as ChordItem[],
    keys: [] as KeyItem[],
    tempo: [] as TempoItem[],
    onsets: [] as OnsetItem[],
    pitch: [] as PitchItem[],
  };
  if (!existsSync(jamsDir) || !existsSync(audioDir)) return null;
  const read = (id: string) =>
    JSON.parse(readFileSync(path.join(jamsDir, `${id}.jams`), "utf8")) as Jams;
  const picks = bench30(jamsDir, quick);
  for (const { sheet, player } of picks) {
    const id = `0${player}_${sheet}_comp`;
    const jams = read(id);
    const a = await decodeAudioFile(path.join(audioDir, `${id}_mic.wav`));
    const audio = { samples: a.samples, sampleRate: a.sampleRate };
    const base = { source: "guitarset", stratum: styleOf(sheet), cluster: sheet };
    const chordAnn = jams.annotations.filter((x) => x.namespace === "chord")[0].data;
    out.chords.push({
      ...base,
      id,
      audio,
      reference: reference(chordAnn, a.durationSeconds, 0, Infinity),
    });
    const keyAnn = jams.annotations.find((x) => x.namespace === "key_mode");
    const key = keyAnn && parseHarteKey(String(keyAnn.data[0].value));
    if (key) out.keys.push({ ...base, id, audio, key });
    const tempo = jams.annotations.find((x) => x.namespace === "tempo");
    if (tempo) out.tempo.push({ ...base, id, audio, bpm: Number(tempo.data[0].value) });
  }
  // Onsets: comp and solo of four sheets per style (one in quick mode), 15 s (10 s).
  const seconds = quick ? 10 : 15;
  const perStyle = quick ? 1 : 4;
  const count = new Map<string, number>();
  for (const { sheet, player } of picks) {
    const n = count.get(styleOf(sheet)) ?? 0;
    if (n >= perStyle) continue;
    count.set(styleOf(sheet), n + 1);
    for (const part of ["comp", "solo"] as const) {
      const id = `0${player}_${sheet}_${part}`;
      const a = await decodeAudioFile(path.join(audioDir, `${id}_mic.wav`));
      const samples = a.samples.slice(0, Math.round(seconds * a.sampleRate));
      out.onsets.push({
        id,
        source: "guitarset",
        stratum: styleOf(sheet),
        part,
        cluster: sheet,
        audio: { samples, sampleRate: a.sampleRate },
        onsets: mergedOnsets(read(id), seconds),
      });
      if (part === "solo") {
        out.pitch.push({
          id,
          source: "guitarset",
          stratum: styleOf(sheet),
          cluster: sheet,
          audio: { samples, sampleRate: a.sampleRate },
          f0: pitchReference(read(id), seconds),
        });
      }
    }
  }
  return out;
}

// --- backing tracks -------------------------------------------------------------

interface ClipRow {
  clip_id: string;
  path: string;
  track_id: string;
  clip_index: number;
  key: { tonic_pc: number; mode: "major" | "minor" };
  bpm: number | null;
  styles: string[];
  label_status: string;
}

async function loadBacking(dir: string, quick: boolean) {
  const manifest = path.join(dir, "manifest.jsonl");
  if (!existsSync(manifest) || !existsSync(path.join(dir, "audio"))) return null;
  const rows = readFileSync(manifest, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as ClipRow);
  const byTrack = new Map<string, ClipRow[]>();
  for (const r of rows) byTrack.set(r.track_id, [...(byTrack.get(r.track_id) ?? []), r]);
  const keys: KeyItem[] = [];
  const tempo: TempoItem[] = [];
  const decode = async (r: ClipRow) => decodeAudioFile(path.join(dir, r.path));
  for (const [track, clips] of byTrack) {
    clips.sort((a, b) => a.clip_index - b.clip_index);
    // One stratum, the tracks as its units: a track alone cannot give an interval.
    const base = { source: "backing", stratum: "tracks", cluster: track };
    if (clips[0].label_status !== "suspect") {
      const n = quick ? 3 : 8;
      for (let k = 0; k < n; k++) {
        const r = clips[Math.floor(((k + 0.5) * clips.length) / n)];
        const a = await decode(r);
        keys.push({
          ...base,
          id: r.clip_id,
          audio: { samples: a.samples, sampleRate: a.sampleRate },
          key: { tonic: r.key.tonic_pc, mode: r.key.mode === "major" ? "maj" : "min" },
        });
      }
    }
    if (clips[0].bpm) {
      const mid = Math.floor(clips.length / 2) - 1;
      const parts = [];
      for (const r of clips.slice(mid, mid + 3)) parts.push((await decode(r)).samples);
      tempo.push({
        ...base,
        id: `${track}__30s`,
        audio: { samples: concat(parts), sampleRate: 44100 },
        bpm: clips[0].bpm,
      });
    }
  }
  return { keys, tempo };
}

// --- fixtures (tests/Sample, committed) ----------------------------------------------

const FIXTURE_KEYS: { file: string; family: string; cluster: string; key: KeyRef }[] = [
  { file: "AmTona.mp3", family: "Tona", cluster: "AmTona", key: { tonic: 9, mode: "min" } },
  { file: "BmTona.mp3", family: "Tona", cluster: "BmTona", key: { tonic: 11, mode: "min" } },
  { file: "F#mTona.mp3", family: "Tona", cluster: "F#mTona", key: { tonic: 6, mode: "min" } },
  ...[1, 2, 3].flatMap((k) => [
    {
      file: `FLStudio/CAmDmG_0_${k}.mp3`,
      family: "FLStudio",
      cluster: "C",
      key: { tonic: 0, mode: "maj" as const },
    },
    {
      file: `FLStudio/CAmDmG_2_${k}.mp3`,
      family: "FLStudio",
      cluster: "D",
      key: { tonic: 2, mode: "maj" as const },
    },
  ]),
  ...["a", "b", "c"].flatMap((k) => [
    {
      file: `Backing/BackingBm1_${k}.wav`,
      family: "Backing",
      cluster: "Bm1",
      key: { tonic: 11, mode: "min" as const },
    },
    {
      file: `Backing/BackingDm1_${k}.wav`,
      family: "Backing",
      cluster: "Dm1",
      key: { tonic: 2, mode: "min" as const },
    },
  ]),
];

async function loadFixtures(): Promise<KeyItem[]> {
  const out: KeyItem[] = [];
  for (const f of FIXTURE_KEYS) {
    const p = path.join(SAMPLES_DIR, f.file);
    if (!existsSync(p)) continue;
    const a = await decodeAudioFile(p);
    out.push({
      id: f.file,
      source: "fixtures",
      stratum: "fixtures",
      cluster: `${f.family} ${f.cluster}`,
      audio: { samples: a.samples, sampleRate: a.sampleRate },
      key: f.key,
    });
  }
  return out;
}

// --- synthetic ----------------------------------------------------------------------------

/** Chord progressions on the model guitar, no noise of their own (the conditions add it). */
function syntheticChords(quick: boolean): ChordItem[] {
  const seeds = quick ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const scenarios = {
    steady: { bpm: 100, minBeats: 2, maxBeats: 4 },
    fast: { bpm: 140, minBeats: 1, maxBeats: 2 },
  };
  return Object.entries(scenarios).flatMap(([name, sc]) =>
    seeds.map((seed) => {
      const reference = syntheticProgression({ seed, snrDb: Infinity, ...sc });
      return {
        id: `synth-chords-${name}-${seed}`,
        source: "synthetic",
        stratum: name,
        cluster: `${name}-${seed}`,
        audio: { samples: reference.signal, sampleRate: 12_000 },
        reference,
      };
    }),
  );
}

const KEY_SR = 22_050;
/** Chord loops by scale degree: [semitones above the tonic, quality]. */
const KEY_TEMPLATES: Record<string, { mode: "maj" | "min"; chords: [number, "maj" | "min"][] }> = {
  "I–V–vi–IV (major)": {
    mode: "maj",
    chords: [
      [0, "maj"],
      [7, "maj"],
      [9, "min"],
      [5, "maj"],
    ],
  },
  "i–iv–V–i (harmonic minor)": {
    mode: "min",
    chords: [
      [0, "min"],
      [5, "min"],
      [7, "maj"],
      [0, "min"],
    ],
  },
  "i–VI–III–VII (natural minor)": {
    mode: "min",
    chords: [
      [0, "min"],
      [8, "maj"],
      [3, "maj"],
      [10, "maj"],
    ],
  },
};

/** A guitar-like voicing: the root in the bass (E2–D#3), the triad around E3–D#4. */
function voicing(root: number, quality: "maj" | "min"): number[] {
  const bass = 40 + ((root - 4 + 12) % 12);
  const third = quality === "maj" ? 4 : 3;
  const base = 52 + ((root - 4 + 12) % 12);
  return [bass, base, base + third, base + 7, base + 12];
}

function syntheticKeys(quick: boolean): KeyItem[] {
  const names = Object.keys(KEY_TEMPLATES);
  const items: KeyItem[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const [t, name] of names.entries()) {
      // Quick: one template per tonic, rotating.
      if (quick && t !== tonic % names.length) continue;
      const tpl = KEY_TEMPLATES[name];
      const id = `synth-key-${tonic}-${t}`;
      const parts: Float32Array[] = [];
      for (let round = 0; round < 2; round++) {
        tpl.chords.forEach(([deg, q], c) => {
          parts.push(
            strum(voicing((tonic + deg) % 12, q), {
              sampleRate: KEY_SR,
              seconds: 2,
              seed: seedFor(id, `strum-${round}-${c}`) % 100_000,
            }),
          );
        });
      }
      items.push({
        id,
        source: "synthetic",
        stratum: name,
        cluster: id,
        audio: { samples: concat(parts), sampleRate: KEY_SR },
        key: { tonic, mode: tpl.mode },
      });
    }
  }
  return items;
}

const RHYTHM_SR = 44_100;

/** Quarter-note strums with an accented downbeat, or syncopated eighth notes. */
function rhythmHits(
  pattern: "strums" | "syncopated",
  bpm: number,
  seconds: number,
  seed: number,
): NoteHit[] {
  const beat = 60 / bpm;
  const rand = mulberry32(seed);
  const hits: NoteHit[] = [];
  const shapes = [
    [40, 47, 52, 55, 59, 64],
    [45, 52, 57, 60, 64],
    [43, 47, 50, 55, 59, 67],
    [50, 57, 62, 66],
  ];
  if (pattern === "strums") {
    for (let i = 0, t = 0.5; t < seconds - 0.5; i++, t += beat) {
      hits.push({
        time: t,
        midi: shapes[Math.floor(i / 4) % shapes.length],
        amplitude: i % 4 === 0 ? 0.35 : 0.2,
        strumMs: 4 + 6 * rand(),
      });
    }
  } else {
    // Eighths, skipping the "and" of 2 and the downbeat of 3 (a common syncopation).
    const pool = [40, 45, 50, 55, 59, 64, 52, 57];
    for (let i = 0, t = 0.5; t < seconds - 0.5; i++, t += beat / 2) {
      if (i % 8 === 3 || i % 8 === 4) continue;
      hits.push({
        time: t,
        midi: pool[Math.floor(rand() * pool.length)],
        amplitude: 0.1 + 0.2 * rand(),
      });
    }
  }
  return hits;
}

/** Single plucked notes with known pitch: the note sounds 0.4 s, its fading tail is skipped. */
function syntheticPitch(quick: boolean): PitchItem[] {
  const seeds = quick ? [1, 2] : [1, 2, 3, 4, 5, 6];
  return seeds.map((seed) => {
    const id = `synth-pitch-${seed}`;
    const hits = melody(30, 0.45, seed);
    const seconds = 0.5 + 30 * 0.45 + 0.5;
    const { signal } = performance(hits, {
      sampleRate: RHYTHM_SR,
      seconds,
      seed: seedFor(id, "tone") % 100_000,
    });
    const f0 = new Float32Array(Math.floor(seconds * 100)).fill(0);
    for (const h of hits) {
      const midi = typeof h.midi === "number" ? h.midi : h.midi[0];
      const hz = 440 * Math.pow(2, (midi - 69) / 12);
      const a = Math.round(h.time * 100);
      for (let i = a; i < Math.min(f0.length, a + 45); i++) f0[i] = i < a + 40 ? hz : NaN;
    }
    return {
      id,
      source: "synthetic",
      stratum: "single plucked notes",
      cluster: id,
      audio: { samples: signal, sampleRate: RHYTHM_SR },
      f0,
    };
  });
}

function syntheticRhythm(quick: boolean): { tempo: TempoItem[]; onsets: OnsetItem[] } {
  const tempos = quick ? [65, 125, 175] : [65, 85, 105, 125, 150, 175];
  const seconds = 15;
  const tempo: TempoItem[] = [];
  const onsets: OnsetItem[] = [];
  for (const pattern of ["strums", "syncopated"] as const) {
    for (const bpm of tempos) {
      const id = `synth-rhythm-${pattern}-${bpm}`;
      const { signal, startFrames } = performance(
        rhythmHits(pattern, bpm, seconds, seedFor(id, "hits")),
        {
          sampleRate: RHYTHM_SR,
          seconds,
          seed: seedFor(id, "tone") % 100_000,
        },
      );
      const base = { id, source: "synthetic", stratum: pattern, cluster: id };
      const audio = { samples: signal, sampleRate: RHYTHM_SR };
      tempo.push({ ...base, audio, bpm });
      onsets.push({ ...base, audio, onsets: startFrames.map((f) => f / RHYTHM_SR) });
    }
  }
  // The onset cases of measure:onsets, without their own noise floor.
  const cases: [string, NoteHit[], number, object?][] = [
    ["single notes", melody(40, 0.45, 1), 19],
    ["fast notes (eighths at 160 BPM)", melody(40, 0.1875, 4), 8.5],
    ["same note repeated", melody(30, 0.4, 5, 52), 13],
    ["soft attacks (no pick)", melody(40, 0.45, 6), 19, { attackMs: 15, pick: false }],
    ["strummed chords", strums(24, 7), 20],
    ["slow strums (60–100 ms)", strumsSpread(24, 8, 12, 20), 20],
  ];
  for (const [name, hits, seconds2, extra] of quick ? cases.slice(0, 3) : cases) {
    const { signal, startFrames } = performance(hits, {
      sampleRate: RHYTHM_SR,
      seconds: seconds2,
      ...extra,
    });
    onsets.push({
      id: `synth-onsets-${name}`,
      source: "synthetic",
      stratum: "measure:onsets cases",
      cluster: name,
      audio: { samples: signal, sampleRate: RHYTHM_SR },
      onsets: startFrames.map((f) => f / RHYTHM_SR),
    });
  }
  return { tempo, onsets };
}

// --- everything ------------------------------------------------------------------------------

export async function loadSources(opts: {
  quick: boolean;
  guitarset: string;
  backing: string;
}): Promise<Sources> {
  const found: Record<string, string> = {};
  const gs = await loadGuitarSet(opts.guitarset, opts.quick);
  found.guitarset = gs
    ? `${gs.chords.length} comp excerpts (bench30${opts.quick ? " quick" : ""}), ${gs.onsets.length} onset excerpts`
    : "absent";
  const bt = await loadBacking(opts.backing, opts.quick);
  found.backing = bt ? `${bt.keys.length} key clips, ${bt.tempo.length} tempo excerpts` : "absent";
  const fx = await loadFixtures();
  found.fixtures = `${fx.length} files`;
  const rhythm = syntheticRhythm(opts.quick);
  const sources: Sources = {
    chords: { synthetic: syntheticChords(opts.quick), real: gs?.chords ?? [] },
    keys: {
      synthetic: syntheticKeys(opts.quick),
      real: [...(gs?.keys ?? []), ...(bt?.keys ?? []), ...fx],
    },
    tempo: { synthetic: rhythm.tempo, real: [...(gs?.tempo ?? []), ...(bt?.tempo ?? [])] },
    onsets: { synthetic: rhythm.onsets, real: gs?.onsets ?? [] },
    pitch: { synthetic: syntheticPitch(opts.quick), real: gs?.pitch ?? [] },
    found,
  };
  return sources;
}
