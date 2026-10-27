/**
 * Proof-of-concept runner.
 *
 *   npx tsx poc/run.ts --task onsets|tempo|chords|keys|pitch [--only name1,name2]
 *
 * Scores the methods of poc/methods/<task>.ts (and the SDK baselines) on the
 * POC dataset, prints a markdown table, and merges the scores into
 * poc/results/<task>.json.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  evalChords,
  evalKeys,
  evalOnsets,
  evalPitch,
  evalTempo,
  table,
  type Scores,
} from "./evaluate";
import { BASELINES } from "./methods/baselines";

const DIR = path.dirname(fileURLToPath(import.meta.url));

const TASKS = {
  onsets: { evaluate: evalOnsets, main: "F", extra: ["P", "R", "F comp", "F solo"] },
  tempo: { evaluate: evalTempo, main: "Acc1", extra: ["Acc2"] },
  chords: { evaluate: evalChords, main: "acc", extra: ["delay", "wrong/min", "missed"] },
  keys: { evaluate: evalKeys, main: "strict", extra: ["merged"] },
  pitch: { evaluate: evalPitch, main: "RPA50", extra: ["RPA10", "octave", "falseVoice"] },
} as const;

type Task = keyof typeof TASKS;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const task = arg("task") as Task;
  if (!TASKS[task]) throw new Error(`--task one of ${Object.keys(TASKS).join(", ")}`);
  const file = path.join(DIR, "methods", `${task}.ts`);
  const extra = existsSync(file)
    ? ((await import(pathToFileURL(file).href)) as { METHODS: Record<string, unknown> }).METHODS
    : {};
  const all = { ...BASELINES[task], ...extra } as unknown as Record<string, never>;
  const only = arg("only")?.split(",");
  const chosen = Object.entries(all).filter(([n]) => !only || only.some((o) => n.includes(o)));
  const results: Record<string, Scores> = {};
  for (const [name, method] of chosen) {
    process.stderr.write(`${task}: ${name}… `);
    results[name] = await (TASKS[task].evaluate as (m: never) => Promise<Scores>)(method);
    process.stderr.write(`${results[name].seconds.toFixed(0)} s\n`);
  }
  console.log(table(results, TASKS[task].main, [...TASKS[task].extra]));
  const out = path.join(
    DIR,
    "results",
    `${task}${process.env.POC_SPLIT ? `-${process.env.POC_SPLIT}` : ""}.json`,
  );
  mkdirSync(path.dirname(out), { recursive: true });
  const previous = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : {};
  writeFileSync(out, JSON.stringify({ ...previous, ...results }, null, 1));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
