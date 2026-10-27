/**
 * The AudioLab benchmark: onsets, tempo, chords and key, on synthetic and
 * real material, clean and under noise. See docs/BENCHMARKS.md.
 *
 *   npm run bench [-- --quick] [--conditions clean,pink-20] [--tasks chords,keys]
 *                 [--guitarset <dir>] [--backing <dir>] [--out <file.json>]
 *
 * Writes one JSON with every elementary measurement (records), then run
 * `npm run bench:report` to turn it into the tables of docs/BENCHMARKS.md.
 * Official runs (full, from a clean git tree) go to bench/results/, the
 * others to bench/results/local/ (ignored by git).
 */
import { execSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BAR_NOISE_FILE, CONDITIONS, applyCondition, loadBarNoise, noiseOnly } from "./augment";
import { BENCH_VERSION } from "./seeds";
import { DEFAULT_BACKING, DEFAULT_GUITARSET, loadSources } from "./sources";
import type { Rec } from "./stats";
import {
  PRE_ROLL,
  runChords,
  runKeys,
  runNoiseControl,
  runOnsets,
  runPitch,
  runTempo,
  type ChordDetail,
  type NoiseControl,
  type OnsetDetail,
} from "./tasks";

export const SCHEMA_VERSION = 1;
const BENCH_DIR = path.dirname(fileURLToPath(import.meta.url));
const QUICK_CONDITIONS = ["clean", "pink-20", "bar-10", "bad-mic"];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function git(cmd: string): string {
  try {
    return execSync(`git ${cmd}`, { cwd: BENCH_DIR, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const log = (msg: string) => process.stderr.write(`${msg}\n`);

async function main(): Promise<void> {
  const quick = process.argv.includes("--quick");
  const tasks = new Set((arg("tasks") ?? "onsets,tempo,chords,keys,pitch").split(","));
  const started = Date.now();
  const sources = await loadSources({
    quick,
    guitarset: path.resolve(arg("guitarset") ?? DEFAULT_GUITARSET),
    backing: path.resolve(arg("backing") ?? DEFAULT_BACKING),
  });
  const bar = await loadBarNoise();
  sources.found.bar = bar
    ? `${(bar.samples.length / bar.sampleRate).toFixed(0)} s (local)`
    : "absent";
  log(
    `sources: ${JSON.stringify(sources.found)} (${((Date.now() - started) / 1000).toFixed(0)} s)`,
  );

  let conditions = CONDITIONS.filter((c) => !quick || QUICK_CONDITIONS.includes(c.id));
  const only = arg("conditions");
  if (only) conditions = conditions.filter((c) => only.split(",").includes(c.id));
  const skipped: Record<string, string> = {};
  if (!bar) {
    for (const c of conditions) if (c.kind === "bar") skipped[c.id] = "bar recording not found";
    conditions = conditions.filter((c) => c.kind !== "bar");
    if (quick && !conditions.some((c) => c.id === "pink-10")) {
      conditions.splice(
        2,
        0,
        CONDITIONS.find((c) => c.id === "pink-10")!,
      );
    }
  }

  const records: Rec[] = [];
  const chordDetails: ChordDetail[] = [];
  const onsetDetails: OnsetDetail[] = [];
  const controls: NoiseControl[] = [];
  const realisations: Record<string, Record<string, unknown>> = {};
  const durations: Record<string, number> = {};

  for (const condition of conditions) {
    const t0 = Date.now();
    const note = (id: string, meta: Record<string, unknown>) => {
      if (Object.keys(meta).length) (realisations[condition.id] ??= {})[id] = meta;
    };
    const augmented = async (id: string, samples: Float32Array, sr: number) => {
      const a = await applyCondition(samples, sr, condition, id);
      if (!a) throw new Error(`condition ${condition.id} unavailable`);
      note(id, a.meta);
      return a.signal;
    };
    for (const split of ["synthetic", "real"] as const) {
      const ctx = { condition: condition.id, split };
      if (tasks.has("chords")) {
        for (const item of sources.chords[split]) {
          const s = await augmented(item.id, item.audio.samples, item.audio.sampleRate);
          const r = await runChords(item, s, ctx);
          records.push(...r.recs);
          chordDetails.push(...r.details);
        }
      }
      if (tasks.has("keys")) {
        for (const item of sources.keys[split]) {
          records.push(
            ...runKeys(
              item,
              await augmented(item.id, item.audio.samples, item.audio.sampleRate),
              ctx,
            ),
          );
        }
      }
      if (tasks.has("tempo")) {
        for (const item of sources.tempo[split]) {
          records.push(
            ...runTempo(
              item,
              await augmented(item.id, item.audio.samples, item.audio.sampleRate),
              ctx,
            ),
          );
        }
      }
      if (tasks.has("pitch")) {
        for (const item of sources.pitch[split]) {
          records.push(
            ...runPitch(
              item,
              await augmented(`${item.id}#pitch`, item.audio.samples, item.audio.sampleRate),
              ctx,
            ),
          );
        }
      }
      if (tasks.has("onsets")) {
        for (const item of sources.onsets[split]) {
          const sr = item.audio.sampleRate;
          const preRoll = condition.kind === "clean" ? 0 : PRE_ROLL;
          const padded = new Float32Array(item.audio.samples.length + Math.round(preRoll * sr));
          padded.set(item.audio.samples, Math.round(preRoll * sr));
          const r = runOnsets(item, await augmented(`${item.id}#onsets`, padded, sr), preRoll, ctx);
          records.push(...r.recs);
          onsetDetails.push(r.detail);
        }
      }
    }
    if (condition.kind !== "clean") {
      const noise = await noiseOnly(30, 44_100, condition, `noise-only`);
      if (noise) controls.push(runNoiseControl(noise, 44_100, condition.id));
    }
    durations[condition.id] = Math.round((Date.now() - t0) / 100) / 10;
    log(`${condition.id}: ${durations[condition.id]} s`);
  }

  const sha = git("rev-parse --short HEAD");
  const dirty = git("status --porcelain") !== "";
  const official = !quick && !dirty && !only && !arg("tasks");
  const date = new Date().toISOString();
  const outFile = path.resolve(
    arg("out") ??
      path.join(
        BENCH_DIR,
        "results",
        official ? "" : "local",
        `bench-${date.slice(0, 10)}-${sha}${quick ? "-quick" : ""}.json`,
      ),
  );
  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(
    outFile,
    JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      benchVersion: BENCH_VERSION,
      date,
      git: { sha, dirty },
      node: process.version,
      os: `${os.type()} ${os.release()}`,
      cpu: os.cpus()[0]?.model ?? "unknown",
      mode: quick ? "quick" : "full",
      args: process.argv.slice(2),
      sources: sources.found,
      barFile: bar ? path.basename(BAR_NOISE_FILE) : null,
      conditions: conditions.map((c) => ({ id: c.id, label: c.label })),
      skipped,
      durations,
      totalSeconds: Math.round((Date.now() - started) / 1000),
      records,
      chordDetails: chordDetails.map((d) => ({ ...d, score: { ...d.score } })),
      onsetDetails,
      controls,
      realisations,
    }),
  );
  log(`\n${records.length} records → ${outFile}`);
}

/**
 * --jobs N: run the conditions in N child processes (each loads the sources
 * and writes a partial JSON), then merge. The numbers are the same as a
 * serial run: every item and condition is seeded on its own.
 */
async function parallel(jobs: number): Promise<void> {
  const quick = process.argv.includes("--quick");
  const all = CONDITIONS.filter((c) => !quick || QUICK_CONDITIONS.includes(c.id)).map((c) => c.id);
  const groups: string[][] = Array.from({ length: jobs }, () => []);
  all.forEach((id, i) => groups[i % jobs].push(id));
  const base = process.argv
    .slice(2)
    .filter((a, i, arr) => a !== "--jobs" && arr[i - 1] !== "--jobs");
  const tmp = path.join(BENCH_DIR, ".cache", `partials-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  const started = Date.now();
  const parts = await Promise.all(
    groups
      .filter((g) => g.length)
      .map(
        (g, i) =>
          new Promise<string>((resolve, reject) => {
            const out = path.join(tmp, `part-${i}.json`);
            const child = spawn(
              process.execPath,
              [
                ...process.execArgv,
                fileURLToPath(import.meta.url),
                ...base,
                "--conditions",
                g.join(","),
                "--out",
                out,
                "--child",
              ],
              { stdio: ["ignore", "inherit", "inherit"] },
            );
            child.on("exit", (code) =>
              code === 0 ? resolve(out) : reject(new Error(`job ${i} exited ${code}`)),
            );
          }),
      ),
  );
  const runs = parts.map((f) => JSON.parse(readFileSync(f, "utf8")));
  const merged = { ...runs[0] };
  for (const key of ["records", "chordDetails", "onsetDetails", "controls"]) {
    merged[key] = runs.flatMap((r) => r[key]);
  }
  merged.conditions = all.flatMap((id) =>
    runs.flatMap((r) => r.conditions).filter((c: { id: string }) => c.id === id),
  );
  merged.durations = Object.assign({}, ...runs.map((r) => r.durations));
  merged.skipped = Object.assign({}, ...runs.map((r) => r.skipped));
  merged.realisations = Object.assign({}, ...runs.map((r) => r.realisations));
  merged.args = process.argv.slice(2);
  merged.totalSeconds = Math.round((Date.now() - started) / 1000);
  const sha = git("rev-parse --short HEAD");
  const dirty = git("status --porcelain") !== "";
  const official = !quick && !dirty && !arg("conditions") && !arg("tasks");
  const outFile = path.resolve(
    arg("out") ??
      path.join(
        BENCH_DIR,
        "results",
        official ? "" : "local",
        `bench-${merged.date.slice(0, 10)}-${sha}${quick ? "-quick" : ""}.json`,
      ),
  );
  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(merged));
  rmSync(tmp, { recursive: true, force: true });
  log(`
${merged.records.length} records → ${outFile}`);
}

const jobs = Number(arg("jobs") ?? 1);
(jobs > 1 && !process.argv.includes("--child") ? parallel(jobs) : main()).catch((err) => {
  console.error(err);
  process.exit(1);
});
