/**
 * Chord and key methods measured on GuitarSet, printed as markdown.
 *
 *   npm run measure:guitarset -w packages/core -- --guitarset <dir> [--sweep] [--limit n]
 *
 * GuitarSet (Xi, Bittner, Pauwels, Ye, Bello, ISMIR 2018; CC BY 4.0) is 360
 * excerpts of 6 guitarists on an acoustic guitar, with time-aligned chord,
 * beat and key annotations. Only the 180 accompaniment ("comp") excerpts are
 * used, with their microphone recording (`audio_mono-mic`). `<dir>` holds
 * `annotations/jams/*.jams` and `audio/*_mic.wav`.
 *
 * References: the lead sheet given to the player (first "chord" annotation)
 * and the chords actually performed (second one, transcribed from the
 * notes); the gap between the two is annotation noise. Scored in the MIREX
 * "majmin" vocabulary (G7 → G, Bm7b5 left out), at every frame, on what the
 * player would see (the latency counts). Every method goes through the live
 * path (AnalyserNode emulation, 10 fps, 16384-point FFT at 44.1 kHz).
 *
 * Splits and uncertainty: players 00–02 tune, players 03–05 test. All six
 * players play the same 30 lead sheets, so the test split holds out the
 * playing and the recording, not the music; intervals are bootstraps over
 * the 30 lead sheets (clusters), and method differences are paired.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { CHORD_QUALITIES } from "../src/analysis/chordDetection";
import { GAUSSIAN_LOG_CHROMA } from "../src/analysis/chroma";
import type { TonalityEngineConfig } from "../src/analysis/engine/tonalityEngine";
import type { KeyProfileName, KeyScore } from "../src/analysis/keyDetection";
import { decodeAudioFile } from "../src/offline/decodeAudio";
import { analyzeOverall, computeChromaSequence } from "../src/offline/offlinePipeline";
import { majMin, parseHarte, parseHarteKey, type HarteChord } from "../tests/helpers/harte";
import {
  runFrames,
  scoreProgression,
  summarise,
  type FrameAnswer,
  type Progression,
  type ProgressionChord,
  type ProgressionScore,
  type ShownChord,
} from "../tests/helpers/progressions";
import { analyserFrames, mulberry32 } from "../tests/helpers/synth";

const FFT = 16_384;
const FPS = 10;

interface Method {
  cfg: Partial<TonalityEngineConfig>;
  holdFrames?: number;
  /** Reduce the detected chord to majmin before showing it. */
  showMajMin?: boolean;
  /** Scored exactly against the full reference instead of majmin. */
  exact?: boolean;
}

const HMM_G = { chordSmoothing: "hmm", chromaMethod: "gaussian-log" } as const;

export const METHODS: Record<string, Method> = {
  "window 1 s (default)": { cfg: {} },
  "window 0.5 s": { cfg: { chordWindowSeconds: 0.5 } },
  "window 0.5 s + hold 2 frames": { cfg: { chordWindowSeconds: 0.5 }, holdFrames: 2 },
  "gaussian-log chroma": { cfg: { chromaMethod: "gaussian-log" } },
  hmm: { cfg: { chordSmoothing: "hmm" } },
  "hmm + gaussian-log": { cfg: { ...HMM_G } },
  "all qualities → majmin, window 1 s": {
    cfg: { chordQualities: CHORD_QUALITIES },
    showMajMin: true,
  },
  "all qualities → majmin, hmm + gaussian-log": {
    cfg: { ...HMM_G, chordQualities: CHORD_QUALITIES },
    showMajMin: true,
  },
  "all qualities, exact, window 1 s": { cfg: { chordQualities: CHORD_QUALITIES }, exact: true },
  "all qualities, exact, hmm + gaussian-log": {
    cfg: { ...HMM_G, chordQualities: CHORD_QUALITIES },
    exact: true,
  },
};

const DEFAULT = "window 1 s (default)";

/** The tuning grid of `--sweep`, on the triad vocabulary. */
function sweepGrid(): Record<string, Method> {
  const grid: Record<string, Method> = {};
  for (const w of [0.3, 0.5, 0.7, 1]) grid[`window ${w} s`] = { cfg: { chordWindowSeconds: w } };
  for (const chroma of ["nearest", "gaussian-log"] as const) {
    for (const mean of [0.5, 0.75, 1, 1.5, 2, 3]) {
      for (const kappa of [0.25, 0.4, 0.6, 0.8, 1]) {
        grid[`hmm ${chroma} D=${mean} κ=${kappa}`] = {
          cfg: {
            chordSmoothing: "hmm",
            chromaMethod: chroma,
            chordHmm: { meanChordSeconds: mean, emissionExponent: kappa },
          },
        };
      }
    }
  }
  return grid;
}

type Annotation = { time: number; duration: number; value: unknown }[];

interface Excerpt {
  id: string;
  /** Lead sheet: the id without the player ("Rock3-148-C_comp"), the bootstrap cluster. */
  sheet: string;
  player: number;
  style: string;
  leadSheet: Annotation;
  performed: Annotation;
  key: { tonic: number; mode: "maj" | "min" } | null;
  duration: number;
}

function loadExcerpt(jamsPath: string): Excerpt {
  const j = JSON.parse(readFileSync(jamsPath, "utf8")) as {
    file_metadata: { title: string; duration: number };
    annotations: { namespace: string; data: Annotation }[];
  };
  const chordAnns = j.annotations.filter((a) => a.namespace === "chord");
  const keyAnn = j.annotations.find((a) => a.namespace === "key_mode");
  const id = j.file_metadata.title;
  return {
    id,
    sheet: id.slice(3),
    player: Number.parseInt(id.slice(0, 2), 10),
    style: id.split("_")[1].split("-")[0].replace(/\d+$/, ""),
    leadSheet: chordAnns[0].data,
    performed: chordAnns[1].data,
    key: keyAnn ? parseHarteKey(String(keyAnn.data[0].value)) : null,
    duration: j.file_metadata.duration,
  };
}

/** An annotation as a scored progression: majmin-reduced (or exact), equal neighbours merged. */
function reference(ann: Annotation, duration: number, exact: boolean): Progression {
  const chords: ProgressionChord[] = [];
  for (const d of ann) {
    const c = parseHarte(String(d.value));
    const r: HarteChord | null = exact ? c : majMin(c);
    if (!r) continue; // left out of the scoring
    const start = d.time;
    const end = d.time + d.duration;
    const last = chords.at(-1);
    if (
      last &&
      last.root === r.root &&
      last.quality === r.quality &&
      Math.abs(last.end - start) < 1e-6
    ) {
      last.end = end;
    } else {
      chords.push({ name: "", root: r.root, quality: r.quality, start, end });
    }
  }
  return { signal: new Float32Array(0), chords, seconds: duration };
}

/** MIREX key score: 1 same, 0.5 fifth (same mode), 0.3 relative, 0.2 parallel. */
function mirex(k: KeyScore, tonic: number, mode: "maj" | "min"): number {
  if (k.tonic === tonic && k.mode === mode) return 1;
  if (k.mode === mode && (k.tonic === (tonic + 7) % 12 || k.tonic === (tonic + 5) % 12)) return 0.5;
  const relative = mode === "min" ? (tonic + 3) % 12 : (tonic + 9) % 12;
  if (k.tonic === relative && k.mode !== mode) return 0.3;
  if (k.tonic === tonic && k.mode !== mode) return 0.2;
  return 0;
}

/** Kind of a wrong majmin answer against the reference chord. */
function errorKind(shown: ShownChord | null, truth: ProgressionChord): string {
  if (!shown) return "nothing shown";
  if (shown.root === truth.root) return "right root, wrong quality";
  const relative = truth.quality === "maj" ? (truth.root + 9) % 12 : (truth.root + 3) % 12;
  if (shown.root === relative && shown.quality !== truth.quality) return "relative (C ↔ Am)";
  // Shares two notes: the mediant / submediant neighbours (C ↔ Em, C ↔ Am covered above).
  const third = truth.quality === "maj" ? (truth.root + 4) % 12 : (truth.root + 8) % 12;
  if (shown.root === third && shown.quality !== truth.quality) return "third-related (C ↔ Em)";
  if (shown.root === (truth.root + 7) % 12 || shown.root === (truth.root + 5) % 12) {
    return "a fifth away (C ↔ G, F)";
  }
  return "other";
}

interface Run {
  sheet: string;
  player: number;
  style: string;
  lead: ProgressionScore;
  performed: ProgressionScore;
}

const pct = (x: number) => (100 * x).toFixed(1);
const ms = (x: number) => (Number.isFinite(x) ? `${Math.round(1000 * x)}` : "–");

/** Pooled accuracy of a set of runs. */
const accuracy = (runs: Run[], which: "lead" | "performed" = "lead") =>
  summarise(runs.map((r) => r[which])).accuracy;

/**
 * 95 % interval of `stat` by resampling lead sheets (clusters). `stat`
 * receives, for each resampled sheet, its index into `sheets`.
 */
function clusterBootstrap(
  sheets: string[],
  stat: (sample: string[]) => number,
  rounds = 1000,
): [number, number] {
  const rand = mulberry32(11);
  const values: number[] = [];
  for (let r = 0; r < rounds; r++) {
    values.push(stat(sheets.map(() => sheets[Math.floor(rand() * sheets.length)])));
  }
  values.sort((a, b) => a - b);
  return [values[Math.floor(0.025 * rounds)], values[Math.floor(0.975 * rounds)]];
}

/** Runs of `name` restricted to a multiset of sheets (a bootstrap sample). */
function pick(runs: Run[], sample: string[]): Run[] {
  const bySheet = new Map<string, Run[]>();
  for (const r of runs) bySheet.set(r.sheet, [...(bySheet.get(r.sheet) ?? []), r]);
  return sample.flatMap((s) => bySheet.get(s) ?? []);
}

function chordTable(title: string, rows: [string, Run[]][], baseline?: Run[]): void {
  console.log(`### ${title}\n`);
  console.log(
    "| Method | Accuracy % [95 % CI] | vs default, points [95 % CI] | vs performed chords % | " +
      "Delay median / p90 (ms) | Missed % | Wrong switches / min |",
  );
  console.log("| --- | --- | --- | --- | --- | --- | --- |");
  for (const [name, runs] of rows) {
    const s = summarise(runs.map((r) => r.lead));
    const sheets = [...new Set(runs.map((r) => r.sheet))];
    const [lo, hi] = clusterBootstrap(sheets, (smp) => accuracy(pick(runs, smp)));
    let diff = "–";
    if (baseline && runs !== baseline) {
      const d = s.accuracy - accuracy(baseline);
      const [dlo, dhi] = clusterBootstrap(
        sheets,
        (smp) => accuracy(pick(runs, smp)) - accuracy(pick(baseline, smp)),
      );
      diff = `${d >= 0 ? "+" : ""}${pct(d)} [${pct(dlo)}, ${pct(dhi)}]`;
    }
    console.log(
      `| ${name} | ${pct(s.accuracy)} [${pct(lo)}–${pct(hi)}] | ${diff} | ${pct(accuracy(runs, "performed"))} | ` +
        `${ms(s.medianDelay)} / ${ms(s.p90Delay)} | ${pct(s.missedShare)} | ` +
        `${s.wrongSwitchesPerMinute.toFixed(1)} |`,
    );
  }
  console.log("");
}

async function main(): Promise<void> {
  const arg = (name: string) => {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const dir = path.resolve(arg("guitarset") ?? "../../../AILab/datasets/public/guitarset");
  const limit = Number(arg("limit") ?? Infinity);
  const sweep = process.argv.includes("--sweep");
  const jamsDir = path.join(dir, "annotations", "jams");
  const files = readdirSync(jamsDir)
    .filter((f) => f.endsWith("_comp.jams"))
    .sort()
    .slice(0, limit);

  const grid = sweep ? sweepGrid() : {};
  const all = { ...METHODS, ...grid };
  const runs = new Map<string, Run[]>();
  const errors = new Map<string, Map<string, number>>();
  const profiles: KeyProfileName[] = ["krumhansl", "temperley", "kostkaPayne"];
  const keyRuns = new Map<
    string,
    { sheet: string; exact: number; mirex: number; minor: boolean }[]
  >();

  const started = Date.now();
  for (const [i, f] of files.entries()) {
    const ex = loadExcerpt(path.join(jamsDir, f));
    const audio = await decodeAudioFile(path.join(dir, "audio", f.replace(".jams", "_mic.wav")));
    const frames = analyserFrames(audio.samples, FFT, Math.round(audio.sampleRate / FPS));
    const refs = {
      lead: reference(ex.leadSheet, ex.duration, false),
      performed: reference(ex.performed, ex.duration, false),
      leadExact: reference(ex.leadSheet, ex.duration, true),
      performedExact: reference(ex.performed, ex.duration, true),
    };

    for (const [name, m] of Object.entries(all)) {
      const out: FrameAnswer[] = runFrames(frames, m.cfg, {
        sampleRate: audio.sampleRate,
        fftSize: FFT,
        fps: FPS,
        holdFrames: m.holdFrames,
        ...(m.showMajMin && { display: (c: ShownChord) => majMin(c) }),
      });
      const run: Run = {
        sheet: ex.sheet,
        player: ex.player,
        style: ex.style,
        lead: scoreProgression(m.exact ? refs.leadExact : refs.lead, out),
        performed: scoreProgression(m.exact ? refs.performedExact : refs.performed, out),
      };
      runs.set(name, [...(runs.get(name) ?? []), run]);

      if (name === DEFAULT || name === "hmm + gaussian-log") {
        const tally = errors.get(name) ?? new Map<string, number>();
        for (const o of out) {
          const truth = refs.lead.chords.find((c) => o.time >= c.start && o.time < c.end);
          if (!truth) continue;
          const right = o.chord && o.chord.root === truth.root && o.chord.quality === truth.quality;
          const kind = right ? "right" : errorKind(o.chord, truth);
          tally.set(kind, (tally.get(kind) ?? 0) + 1);
        }
        errors.set(name, tally);
      }
    }

    if (ex.key) {
      for (const [fe, chroma] of [
        ["nearest", undefined],
        ["gaussian-log", GAUSSIAN_LOG_CHROMA],
      ] as const) {
        const chromas = computeChromaSequence(audio, {
          fftSize: 8192,
          hopSize: 2048,
          minFreq: 55,
          maxFreq: 5000,
          chroma,
        });
        for (const profile of profiles) {
          const top = analyzeOverall(chromas, 0, profile).keys[0];
          const k = `${fe} + ${profile}`;
          keyRuns.set(k, [
            ...(keyRuns.get(k) ?? []),
            {
              sheet: ex.sheet,
              exact: top.tonic === ex.key.tonic && top.mode === ex.key.mode ? 1 : 0,
              mirex: mirex(top, ex.key.tonic, ex.key.mode),
              minor: ex.key.mode === "min",
            },
          ]);
        }
      }
    }
    process.stderr.write(
      `\r${i + 1}/${files.length} excerpts, ${((Date.now() - started) / 1000).toFixed(0)} s`,
    );
  }
  process.stderr.write("\n");

  const test = (name: string) => runs.get(name)!.filter((r) => r.player >= 3);
  const tune = (name: string) => runs.get(name)!.filter((r) => r.player <= 2);
  const testMinutes = test(DEFAULT).reduce((s, r) => s + r.lead.seconds, 0) / 60;
  console.log(
    `GuitarSet comp excerpts: ${files.length}, ${new Set(runs.get(DEFAULT)!.map((r) => r.sheet)).size} ` +
      `lead sheets. Test split: ${test(DEFAULT).length} excerpts, ${testMinutes.toFixed(1)} min.\n`,
  );
  chordTable(
    "Chords, test split (players 03–05), majmin against the lead sheet (exact rows: maj, min, 7, m7b5)",
    Object.keys(METHODS).map((n) => [n, test(n)]),
    test(DEFAULT),
  );

  console.log("### Per test player: hmm + gaussian-log minus default, accuracy points\n");
  console.log("| Player | Default % | hmm + gaussian-log % | Difference |");
  console.log("| --- | --- | --- | --- |");
  for (const p of [3, 4, 5]) {
    const a = accuracy(test(DEFAULT).filter((r) => r.player === p));
    const b = accuracy(test("hmm + gaussian-log").filter((r) => r.player === p));
    console.log(`| 0${p} | ${pct(a)} | ${pct(b)} | ${b - a >= 0 ? "+" : ""}${pct(b - a)} |`);
  }
  console.log("");

  console.log("### Per style, all players: default vs hmm + gaussian-log\n");
  console.log("| Style | Default % | hmm + gaussian-log % | Difference |");
  console.log("| --- | --- | --- | --- |");
  for (const st of [...new Set(runs.get(DEFAULT)!.map((r) => r.style))].sort()) {
    const a = accuracy(runs.get(DEFAULT)!.filter((r) => r.style === st));
    const b = accuracy(runs.get("hmm + gaussian-log")!.filter((r) => r.style === st));
    console.log(`| ${st} | ${pct(a)} | ${pct(b)} | ${b - a >= 0 ? "+" : ""}${pct(b - a)} |`);
  }
  console.log("");

  console.log("### What the wrong frames are (all players, lead sheet, majmin)\n");
  const kinds = [
    "right",
    "right root, wrong quality",
    "relative (C ↔ Am)",
    "third-related (C ↔ Em)",
    "a fifth away (C ↔ G, F)",
    "other",
    "nothing shown",
  ];
  console.log(`| Method | ${kinds.join(" | ")} |`);
  console.log(`| --- | ${kinds.map(() => "---").join(" | ")} |`);
  for (const [name, tally] of errors) {
    const total = [...tally.values()].reduce((a, b) => a + b, 0);
    console.log(`| ${name} | ${kinds.map((k) => pct((tally.get(k) ?? 0) / total)).join(" | ")} |`);
  }
  console.log("");

  if (sweep) {
    const flickerWeight = 0.1; // 10 wrong switches a minute cost one point
    const rank = (key: (s: ReturnType<typeof summarise>) => number) =>
      Object.keys(grid)
        .map((n) => ({ n, s: summarise(tune(n).map((r) => r.lead)) }))
        .sort((a, b) => key(b.s) - key(a.s));
    const byAccuracy = rank((s) => s.accuracy);
    const byCombined = rank((s) => 100 * s.accuracy - flickerWeight * s.wrongSwitchesPerMinute);
    console.log("### Sweep on the tuning split (players 00–02)\n");
    console.log(
      "| Rank | Best by accuracy | Accuracy %, wrong / min | Best by accuracy − 0.1 × flicker | Accuracy %, wrong / min |",
    );
    console.log("| --- | --- | --- | --- | --- |");
    for (let k = 0; k < 8; k++) {
      const a = byAccuracy[k];
      const c = byCombined[k];
      console.log(
        `| ${k + 1} | ${a.n} | ${pct(a.s.accuracy)}, ${a.s.wrongSwitchesPerMinute.toFixed(1)} | ` +
          `${c.n} | ${pct(c.s.accuracy)}, ${c.s.wrongSwitchesPerMinute.toFixed(1)} |`,
      );
    }
    console.log("");
    const picks: [string, Run[]][] = [
      [DEFAULT, test(DEFAULT)],
      ["hmm (current defaults)", test("hmm")],
      ["hmm + gaussian-log (current defaults)", test("hmm + gaussian-log")],
      [`${byAccuracy[0].n} (best accuracy)`, test(byAccuracy[0].n)],
      [`${byCombined[0].n} (best combined)`, test(byCombined[0].n)],
      [
        `${byAccuracy.find((r) => r.n.startsWith("window"))!.n} (best window)`,
        test(byAccuracy.find((r) => r.n.startsWith("window"))!.n),
      ],
    ];
    chordTable("Sweep winners, measured on the test split", picks, test(DEFAULT));
  }

  console.log(
    "### Keys, all comp excerpts (energy path, whole excerpt; 30 lead sheets × 6 players)\n",
  );
  console.log(
    "| Front-end + profile | Exact % [95 % CI over lead sheets] | Exact % on minor keys | MIREX % |",
  );
  console.log("| --- | --- | --- | --- |");
  for (const [k, list] of keyRuns) {
    const mean = (l: typeof list, f: (x: (typeof list)[number]) => number) =>
      l.reduce((s, x) => s + f(x), 0) / Math.max(1, l.length);
    const sheets = [...new Set(list.map((x) => x.sheet))];
    const bySheet = new Map<string, typeof list>();
    for (const x of list) bySheet.set(x.sheet, [...(bySheet.get(x.sheet) ?? []), x]);
    const [lo, hi] = clusterBootstrap(sheets, (smp) =>
      mean(
        smp.flatMap((s) => bySheet.get(s)!),
        (x) => x.exact,
      ),
    );
    const minor = list.filter((x) => x.minor);
    console.log(
      `| ${k} | ${pct(mean(list, (x) => x.exact))} [${pct(lo)}–${pct(hi)}] | ` +
        `${pct(mean(minor, (x) => x.exact))} | ${pct(mean(list, (x) => x.mirex))} |`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
