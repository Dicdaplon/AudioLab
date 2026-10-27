/**
 * Key methods compared on the backing-tracks dataset, printed as markdown.
 *
 *   npm run measure:keys -w packages/core -- --dataset <AILab>/datasets/backing-tracks
 *
 * Every 10 s clip of `manifest.jsonl` is decoded, framed like the sample
 * suite (8192-point Hann FFT, hop 2048) and ranked by the energy key path
 * (whole clip) for each chroma front-end × key-profile set. Reported per
 * track:
 *
 *   accepted  top-1 is one of the clip's `accepted_keys` (tonic key,
 *             relative major, parent major of a mode)
 *   MIREX     weighted score against the title key: 1 same key, 0.5 a fifth
 *             away (same mode), 0.3 relative, 0.2 parallel, 0 otherwise
 *
 * The labels come from the titles and are per track, not per clip: a clip
 * sitting on the IV chord of a blues is "wrong" by this count. Tracks with
 * `label_status: "suspect"` are shown but left out of the totals.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { GAUSSIAN_LOG_CHROMA } from "../src/analysis/chroma";
import type { KeyProfileName, KeyScore } from "../src/analysis/keyDetection";
import { decodeAudioFile } from "../src/offline/decodeAudio";
import { analyzeOverall, computeChromaSequence } from "../src/offline/offlinePipeline";
import { NOTE_NAMES } from "../src/utils/notes";

interface ClipRow {
  clip_id: string;
  path: string;
  track_id: string;
  key: { tonic: string; mode: "major" | "minor" };
  accepted_keys: string[];
  label_status: "title_unverified" | "suspect" | "ear_verified";
}

const FRONT_ENDS = {
  nearest: undefined,
  "gaussian-log": GAUSSIAN_LOG_CHROMA,
} as const;
const PROFILES: KeyProfileName[] = ["krumhansl", "temperley", "kostkaPayne"];

/** MIREX key score of a detected key against the reference. */
export function mirexKeyScore(detected: KeyScore, tonic: number, minor: boolean): number {
  const mode = minor ? "min" : "maj";
  if (detected.tonic === tonic && detected.mode === mode) return 1;
  if (
    detected.mode === mode &&
    (detected.tonic === (tonic + 7) % 12 || detected.tonic === (tonic + 5) % 12)
  ) {
    return 0.5;
  }
  const relative = minor ? (tonic + 3) % 12 : (tonic + 9) % 12;
  if (detected.tonic === relative && detected.mode !== mode) return 0.3;
  if (detected.tonic === tonic && detected.mode !== mode) return 0.2;
  return 0;
}

async function main(): Promise<void> {
  const i = process.argv.indexOf("--dataset");
  if (i < 0) throw new Error("--dataset <dir> is required");
  const dir = path.resolve(process.argv[i + 1]);
  const rows = readFileSync(path.join(dir, "manifest.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as ClipRow);
  const tracks = [...new Set(rows.map((r) => r.track_id))];

  type Tally = { n: number; accepted: number; mirex: number };
  const tally = new Map<string, Tally>(); // `${method}|${track}`
  const methods: string[] = [];
  for (const fe of Object.keys(FRONT_ENDS)) for (const p of PROFILES) methods.push(`${fe} + ${p}`);

  for (const row of rows) {
    const audio = await decodeAudioFile(path.join(dir, row.path));
    const tonic = NOTE_NAMES.indexOf(row.key.tonic);
    for (const [fe, chroma] of Object.entries(FRONT_ENDS)) {
      const chromas = computeChromaSequence(audio, {
        fftSize: 8192,
        hopSize: 2048,
        minFreq: 55,
        maxFreq: 5000,
        chroma,
      });
      for (const profile of PROFILES) {
        const top = analyzeOverall(chromas, 0, profile).keys[0];
        const k = `${fe} + ${profile}|${row.track_id}`;
        const t = tally.get(k) ?? { n: 0, accepted: 0, mirex: 0 };
        t.n++;
        if (row.accepted_keys.includes(top.shortName)) t.accepted++;
        t.mirex += mirexKeyScore(top, tonic, row.key.mode === "minor");
        tally.set(k, t);
      }
    }
  }

  const suspect = new Set(rows.filter((r) => r.label_status === "suspect").map((r) => r.track_id));
  const pct = (x: number) => `${Math.round(100 * x)}`;
  console.log(`### Key, energy path, ${rows.length} clips of 10 s\n`);
  console.log(
    "Accepted top-1 % / MIREX score %, per track. * = label suspect, left out of the total.\n",
  );
  console.log(
    `| Method | ${tracks.map((t) => (suspect.has(t) ? `${t} *` : t)).join(" | ")} | Total |`,
  );
  console.log(`| --- | ${tracks.map(() => "---").join(" | ")} | --- |`);
  for (const m of methods) {
    const cells = tracks.map((t) => {
      const x = tally.get(`${m}|${t}`)!;
      return `${pct(x.accepted / x.n)} / ${pct(x.mirex / x.n)}`;
    });
    const kept = tracks.filter((t) => !suspect.has(t)).map((t) => tally.get(`${m}|${t}`)!);
    const n = kept.reduce((s, x) => s + x.n, 0);
    const total = `${pct(kept.reduce((s, x) => s + x.accepted, 0) / n)} / ${pct(kept.reduce((s, x) => s + x.mirex, 0) / n)}`;
    console.log(`| ${m} | ${cells.join(" | ")} | ${total} |`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
