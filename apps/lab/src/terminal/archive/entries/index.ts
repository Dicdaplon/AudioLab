/**
 * The whole archive: the core entries, then one file per theme (written in
 * parallel, so a phrasing can turn up twice). A phrasing keeps only its
 * first owner: the core, then the themes in the order below.
 */
import { normalise, type ArchiveEntry } from "../match";
import { ALGORITHMS } from "./algorithms";
import { APOCALYPSE } from "./apocalypse";
import { COMPANY } from "./company";
import { CORE } from "./core";
import { IDENTITY } from "./identity";
import { MUSIC } from "./music";
import { SMALLTALK } from "./smalltalk";
import { TECH } from "./tech";
import { TIME } from "./time";
import { TIMELINE_ENTRIES } from "./timeline";

export { UNKNOWN } from "./core";

const ALL: readonly ArchiveEntry[] = [
  ...CORE,
  ...IDENTITY,
  ...COMPANY,
  ...APOCALYPSE,
  ...ALGORITHMS,
  ...TIMELINE_ENTRIES,
  ...TIME,
  ...MUSIC,
  ...TECH,
  ...SMALLTALK,
];

/** Drops a phrasing already owned by an earlier entry, and entries left without any. */
function firstOwnerWins(entries: readonly ArchiveEntry[]): ArchiveEntry[] {
  const seen = new Set<string>();
  const out: ArchiveEntry[] = [];
  for (const entry of entries) {
    const q = entry.q.filter((phrasing) => {
      const key = normalise(phrasing);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (q.length > 0) out.push(q.length === entry.q.length ? entry : { ...entry, q });
  }
  return out;
}

export const ARCHIVE: readonly ArchiveEntry[] = firstOwnerWins(ALL);
