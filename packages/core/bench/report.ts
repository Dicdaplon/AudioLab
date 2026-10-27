/**
 * Turn a benchmark JSON into the generated part of docs/BENCHMARKS.md
 * (between the `<!-- bench:begin -->` and `<!-- bench:end -->` markers).
 *
 *   npm run bench:report [-- <results.json>]     default: the newest run
 *
 * Every headline is the style-balanced score (each style or scenario weighs
 * the same, sources weighted by their number of independent units); the
 * volume-weighted score is shown next to it. Intervals: 95 % bootstrap
 * over the independent units inside each style; differences are paired.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { summarise, type ProgressionScore } from "../tests/helpers/progressions";
import { aggregate, clusterLayout, resamples, type Rec, type Sample } from "./stats";
import type { NoiseControl } from "./tasks";

const BENCH_DIR = path.dirname(fileURLToPath(import.meta.url));
const DOC = path.resolve(BENCH_DIR, "..", "..", "..", "docs", "BENCHMARKS.md");
const BEGIN = "<!-- bench:begin -->";
const END = "<!-- bench:end -->";

interface Run {
  benchVersion: string;
  date: string;
  git: { sha: string; dirty: boolean };
  node: string;
  os: string;
  cpu: string;
  mode: string;
  sources: Record<string, string>;
  conditions: { id: string; label: string }[];
  skipped: Record<string, string>;
  durations: Record<string, number>;
  totalSeconds: number;
  records: Rec[];
  chordDetails: { condition: string; split: string; method: string; score: ProgressionScore }[];
  onsetDetails: { condition: string; split: string; errors: number[] }[];
  controls: NoiseControl[];
}

function newest(): string {
  const dirs = [path.join(BENCH_DIR, "results"), path.join(BENCH_DIR, "results", "local")];
  const files = dirs.filter(existsSync).flatMap((d) =>
    readdirSync(d)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(d, f)),
  );
  if (!files.length) throw new Error("no benchmark results: run `npm run bench` first");
  return files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

const pct = (x: number | null | undefined) =>
  x === null || x === undefined || !Number.isFinite(x) ? "–" : (100 * x).toFixed(1);
const ci = (r: [number, number] | null) => (r ? ` [${pct(r[0])}–${pct(r[1])}]` : "");
const delta = (d: number | null, r: [number, number] | null) =>
  d === null || !Number.isFinite(d)
    ? "–"
    : `${d >= 0 ? "+" : "−"}${pct(Math.abs(d))}${r ? ` [${r[0] >= 0 ? "+" : "−"}${pct(Math.abs(r[0]))}, ${r[1] >= 0 ? "+" : "−"}${pct(Math.abs(r[1]))}]` : ""}`;

type Stat = "synthetic" | "real" | "pooled" | "realVolume";

/** Point values and bootstrap replicates of one cell (task, metric, method, condition). */
class Cells {
  private cache = new Map<
    string,
    { point: ReturnType<typeof aggregate>; boots: Record<Stat, number | null>[] }
  >();
  private samples: Sample[];
  constructor(
    private readonly recs: readonly Rec[],
    private readonly task: Rec["task"],
  ) {
    this.samples = resamples(clusterLayout(recs.filter((r) => r.task === task)), 1000);
  }
  get(metric: string, method: string, condition: string) {
    const key = `${metric}|${method}|${condition}`;
    let c = this.cache.get(key);
    if (!c) {
      const sel = this.recs.filter(
        (r) =>
          r.task === this.task &&
          r.metric === metric &&
          r.method === method &&
          r.condition === condition,
      );
      c = {
        point: aggregate(sel),
        boots: this.samples.map((s) => {
          const a = aggregate(sel, s);
          return {
            synthetic: a.synthetic,
            real: a.real,
            pooled: a.pooled,
            realVolume: a.realVolume,
          };
        }),
      };
      this.cache.set(key, c);
    }
    return c;
  }
  /** No interval when a stratum behind the statistic has fewer than 3 independent units. */
  private thin(cell: ReturnType<Cells["get"]>, stat: Stat): boolean {
    return cell.point.strata.some(
      (s) =>
        s.clusters < 3 &&
        (stat === "pooled" || (stat === "synthetic") === (s.split === "synthetic")),
    );
  }
  ci(metric: string, method: string, condition: string, stat: Stat): [number, number] | null {
    const cell = this.get(metric, method, condition);
    if (this.thin(cell, stat)) return null;
    const v = cell.boots
      .map((b) => b[stat])
      .filter((x): x is number => x !== null && Number.isFinite(x))
      .sort((a, b) => a - b);
    if (v.length < 500) return null;
    return [v[Math.floor(0.025 * v.length)], v[Math.floor(0.975 * v.length)]];
  }
  /** Paired difference a − b of one statistic, with its interval. */
  diff(a: [string, string, string], b: [string, string, string], stat: Stat) {
    const ca = this.get(...a);
    const cb = this.get(...b);
    const pa = ca.point[stat];
    const pb = cb.point[stat];
    const d = pa === null || pb === null ? null : pa - pb;
    const values = ca.boots
      .map((x, i) =>
        x[stat] === null || cb.boots[i][stat] === null ? null : x[stat]! - cb.boots[i][stat]!,
      )
      .filter((v): v is number => v !== null)
      .sort((x, y) => x - y);
    const r: [number, number] | null =
      !this.thin(ca, stat) && values.length > 10
        ? [values[Math.floor(0.025 * values.length)], values[Math.floor(0.975 * values.length)]]
        : null;
    return { d, r };
  }
}

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");
}

function methodsOf(recs: readonly Rec[], task: Rec["task"]): string[] {
  return [...new Set(recs.filter((r) => r.task === task).map((r) => r.method))];
}

function report(run: Run, file: string): string {
  const out: string[] = [];
  const conds = run.conditions;
  const label = (id: string) => conds.find((c) => c.id === id)?.label ?? id;
  const has = (id: string) => conds.some((c) => c.id === id);
  const detailConds = ["clean", "pink-20", "bar-10", "bad-mic"].filter(has);

  out.push(
    `Run of ${run.date.slice(0, 10)}, commit \`${run.git.sha}\`${run.git.dirty ? " (uncommitted changes)" : ""}, ` +
      `mode **${run.mode}**, benchmark version ${run.benchVersion}, ${run.totalSeconds} s on ${run.cpu} (Node ${run.node}). ` +
      `File: \`${path.relative(path.resolve(BENCH_DIR, "..", "..", ".."), file).replace(/\\/g, "/")}\`.`,
    "",
    table(
      ["Source", "Found"],
      Object.entries(run.sources).map(([k, v]) => [k, v]),
    ),
    "",
  );
  if (Object.keys(run.skipped).length) {
    out.push(
      `Skipped: ${Object.entries(run.skipped)
        .map(([k, v]) => `${k} (${v})`)
        .join(", ")}.`,
      "",
    );
  }

  const realCell = (cells: Cells, metric: string, method: string, cond: string) =>
    `${pct(cells.get(metric, method, cond).point.real)}${ci(cells.ci(metric, method, cond, "real"))}`;

  /**
   * The tables of one task: real (style-balanced, with intervals) per method
   * and condition; each opt-in method minus the default, paired; synthetic
   * and both; then the scores by style for a few conditions.
   */
  const section = (
    task: Rec["task"],
    title: string,
    intro: string,
    metric: string,
    metricName: string,
  ): Cells | null => {
    if (!run.records.some((r) => r.task === task)) return null;
    const cells = new Cells(run.records, task);
    const methods = methodsOf(run.records, task);
    const [def, ...others] = methods;
    out.push(`### ${title}`, "", intro, "");
    out.push(
      `**${metricName}, real recordings** (style-balanced, 95 % interval):`,
      "",
      table(
        ["Condition", ...methods],
        conds.map((c) => [label(c.id), ...methods.map((m) => realCell(cells, metric, m, c.id))]),
      ),
      "",
    );
    if (others.length) {
      out.push(
        `**Each method minus the default (${def}), real, paired points:**`,
        "",
        table(
          ["Condition", ...others],
          conds.map((c) => [
            label(c.id),
            ...others.map((m) => {
              const d = cells.diff([metric, m, c.id], [metric, def, c.id], "real");
              return delta(d.d, d.r);
            }),
          ]),
        ),
        "",
      );
    }
    out.push(
      `**${metricName}: synthetic / real by volume / both** (both = synthetic and real averaged):`,
      "",
      table(
        ["Condition", ...methods],
        conds.map((c) => [
          label(c.id),
          ...methods.map((m) => {
            const p = cells.get(metric, m, c.id).point;
            return `${pct(p.synthetic)} / ${pct(p.realVolume)} / ${pct(p.pooled)}`;
          }),
        ]),
      ),
      "",
    );
    const rows = new Map<string, string[]>();
    for (const c of detailConds) {
      for (const m of methods) {
        for (const st of cells.get(metric, m, c).point.strata) {
          const k = `${st.split === "real" ? st.source : "synthetic"} · ${st.stratum}`;
          if (!rows.has(k)) rows.set(k, [k, String(st.clusters)]);
          rows.get(k)!.push(pct(st.score));
        }
      }
    }
    out.push(
      `**${metricName} by style (real) and scenario (synthetic)**, methods numbered in the order above:`,
      "",
      table(
        [
          "Stratum",
          "Units",
          ...detailConds.flatMap((c) => methods.map((_, i) => `${c} #${i + 1}`)),
        ],
        [...rows.values()],
      ),
      "",
    );
    return cells;
  };

  // --- onsets
  const onsetCells = section(
    "onsets",
    "Rhythm: note onsets",
    "F-measure (±50 ms) of the note starts found, mir_eval conventions.",
    "f",
    "F",
  );
  if (onsetCells) {
    const methods = methodsOf(run.records, "onsets");
    out.push(
      "**Precision / recall, real, by method:**",
      "",
      table(
        ["Condition", ...methods],
        conds.map((c) => [
          label(c.id),
          ...methods.map(
            (m) =>
              `${pct(onsetCells.get("precision", m, c.id).point.real)} / ${pct(onsetCells.get("recall", m, c.id).point.real)}`,
          ),
        ]),
      ),
      "",
      "**Strums (comp) / single notes (solo), real F:**",
      "",
      table(
        ["Condition", ...methods],
        conds.map((c) => [
          label(c.id),
          ...methods.map(
            (m) =>
              `${pct(onsetCells.get("f:comp", m, c.id).point.real)} / ${pct(onsetCells.get("f:solo", m, c.id).point.real)}`,
          ),
        ]),
      ),
      "",
    );
  }

  // --- tempo
  const tempoCells = section(
    "tempo",
    "Rhythm: tempo",
    "Share of the live readings (one a second once 8 s are heard) within 4 % of the reference (Acc1). Acc2 also accepts ×2, ×½, ×3, ×⅓ (octave and 3:1 errors).",
    "acc1",
    "Acc1",
  );
  if (tempoCells) {
    const methods = methodsOf(run.records, "tempo");
    out.push(
      "**Acc2 / octave errors, real:**",
      "",
      table(
        ["Condition", ...methods],
        conds.map((c) => [
          label(c.id),
          ...methods.map(
            (m) =>
              `${pct(tempoCells.get("acc2", m, c.id).point.real)} / ${pct(tempoCells.get("octave", m, c.id).point.real)}`,
          ),
        ]),
      ),
      "",
      "Beat tracking: not measured (the SDK has no beat tracker; the beat grid comes from the metronome of the app).",
      "",
    );
  }

  // --- chords
  const chordCells = section(
    "chords",
    "Chords",
    "Share of frames (10 a second, what the player sees, latency included) showing the right chord, MIREX majmin (G7 counts as G; m7b5 frames left out). Real: GuitarSet bench30, against the lead sheet.",
    "accuracy",
    "Accuracy",
  );
  if (chordCells) {
    const methods = methodsOf(run.records, "chords");
    out.push(
      "**Reaction and flicker, real** (delay to the new chord held two frames, on the changes caught; read it with the missed share):",
      "",
      table(
        [
          "Condition",
          "Method",
          "Delay median / p90",
          "Missed changes %",
          "Wrong switches / min",
          "Nothing shown %",
        ],
        detailConds.flatMap((c) =>
          methods.map((m) => {
            const sc = summarise(
              run.chordDetails
                .filter((d) => d.condition === c && d.split === "real" && d.method === m)
                .map((d) => d.score),
            );
            const ms = (x: number) => (Number.isFinite(x) ? `${Math.round(1000 * x)} ms` : "–");
            return [
              label(c),
              m,
              `${ms(sc.medianDelay)} / ${ms(sc.p90Delay)}`,
              pct(sc.missedShare),
              sc.wrongSwitchesPerMinute.toFixed(1),
              pct(sc.silentShare),
            ];
          }),
        ),
      ),
      "",
    );
  }

  // --- keys
  const keyCells = section(
    "keys",
    "Key, strict (C major is not A minor)",
    "Top-ranked key of the whole item. Real: GuitarSet bench30 + backing tracks (5 trusted, minor) + the tests/Sample fixtures. The live engine rows run the TonalityEngine as the site does (10 frames a second, its long window over the whole item).",
    "strict",
    "Strict",
  );
  if (keyCells) {
    const methods = methodsOf(run.records, "keys");
    section(
      "keys",
      "Key, merged (C major = A minor)",
      "The key or its relative counts: the same key signature.",
      "merged",
      "Merged",
    );
    out.push(
      "**Major / minor references apart (strict, clean, real) and MIREX score (clean, real):**",
      "",
      table(
        ["Method", "Major", "Minor", "MIREX"],
        methods.map((m) => [
          m,
          pct(keyCells.get("strict:maj", m, "clean").point.real),
          pct(keyCells.get("strict:min", m, "clean").point.real),
          pct(keyCells.get("mirex", m, "clean").point.real),
        ]),
      ),
      "",
    );
  }

  // --- pitch
  const pitchCells = section(
    "pitch",
    "Pitch (the tuner)",
    "Each tracker as the tuner runs it, read ten times a second: share of the voiced moments where the reading is within 50 cents (RPA50). Real: GuitarSet solo lines (one string sounding); synthetic: single plucked notes.",
    "rpa50",
    "RPA50",
  );
  if (pitchCells) {
    const methods = methodsOf(run.records, "pitch");
    const pc = ["clean", "bar-10"].filter(has);
    out.push(
      "**Within 10 cents / octave errors / readings on silence, real:**",
      "",
      table(
        ["Method", ...pc.map(label)],
        methods.map((m) => [
          m,
          ...pc.map(
            (c) =>
              `${pct(pitchCells.get("rpa10", m, c).point.real)} / ${pct(pitchCells.get("octave", m, c).point.real)} / ${pct(pitchCells.get("falseVoice", m, c).point.real)}`,
          ),
        ]),
      ),
      "",
    );
  }

  // --- noise alone ------------------------------------------------------------------------
  if (run.controls.length) {
    const methods = Object.keys(run.controls[0].chordShown);
    out.push(
      "### Noise alone (no music)",
      "",
      "30 s of each noise at the level it would have under music played at −20 dBFS: what the detectors report when " +
        "nobody plays.",
      "",
      table(
        [
          "Condition",
          "Onsets / min",
          ...methods.map((m) => `Chord shown %, ${m}`),
          "Tempo read",
          "Key read",
        ],
        run.controls.map((c) => [
          label(c.condition),
          String(c.onsetsPerMinute),
          ...methods.map((m) => pct(c.chordShown[m])),
          c.tempo.bpm ? `${c.tempo.bpm} BPM (confidence ${c.tempo.confidence})` : "none",
          c.key ? `${c.key.name} (${pct(c.key.probability)} %)` : "none",
        ]),
      ),
      "",
    );
  }

  out.push(
    "Durations per condition (s): " +
      Object.entries(run.durations)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ") +
      ".",
  );
  return out.join("\n");
}

function main(): void {
  const file = path.resolve(process.argv[2] ?? newest());
  const run = JSON.parse(readFileSync(file, "utf8")) as Run;
  const generated = report(run, file);
  const doc = existsSync(DOC) ? readFileSync(DOC, "utf8") : `# Benchmarks\n\n${BEGIN}\n${END}\n`;
  // The markers on a line of their own (the prose may quote them).
  const i = doc.search(/^<!-- bench:begin -->$/m);
  const j = doc.search(/^<!-- bench:end -->$/m);
  if (i < 0 || j < 0) throw new Error(`${DOC}: markers ${BEGIN} / ${END} not found`);
  writeFileSync(DOC, `${doc.slice(0, i + BEGIN.length)}\n\n${generated}\n\n${doc.slice(j)}`);
  process.stderr.write(`report → ${DOC}\n`);
}

main();
