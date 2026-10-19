/**
 * The whole archive: the core entries, then one file per theme (written in
 * parallel, so a phrasing can turn up twice). A phrasing keeps only its
 * first owner, in the order below: the core, then feelings (so a visitor in
 * distress always reaches its careful answers), then the site and its
 * people, then the lore.
 */
import { normalise, type ArchiveEntry } from "../match";
import { AFTERMATH } from "./aftermath";
import { ALGORITHMS } from "./algorithms";
import { APOCALYPSE } from "./apocalypse";
import { BEFORE } from "./before";
import { CHAFIK } from "./chafik";
import { COMPANY } from "./company";
import { CORE } from "./core";
import { CORPORATE } from "./corporate";
import { CRT_CULTURE } from "./crt-culture";
import { CS_LEGENDS } from "./cs-legends";
import { DIARY } from "./diary";
import { FEELINGS } from "./feelings";
import { FIXES } from "./fixes";
import { FLOATS } from "./floats";
import { GAMES } from "./games";
import { IDENTITY } from "./identity";
import { LAB_ALGORITHMS } from "./lab-algorithms";
import { LOLOUP } from "./loloup";
import { MUSIC } from "./music";
import { NATURE } from "./nature";
import { PHILOSOPHY } from "./philosophy";
import { SCENE } from "./scene";
import { SITE_HELP } from "./site-help";
import { SMALLTALK } from "./smalltalk";
import { TECH } from "./tech";
import { TIME } from "./time";
import { TIMELINE_ENTRIES } from "./timeline";
import { TRIAD_SOCIETY } from "./triad";
import { WORLD } from "./world";
import { Y2044 } from "./y2044";
import { Y2043 } from "./y2043";
import { Y2042 } from "./y2042";
import { Y2041 } from "./y2041";
import { Y2040 } from "./y2040";

export { UNKNOWN } from "./core";

const ALL: readonly ArchiveEntry[] = [
  ...CORE,
  ...FEELINGS,
  ...FIXES,
  ...SITE_HELP,
  ...LAB_ALGORITHMS,
  ...CHAFIK,
  ...LOLOUP,
  ...CS_LEGENDS,
  ...IDENTITY,
  ...COMPANY,
  ...CORPORATE,
  ...APOCALYPSE,
  ...AFTERMATH,
  ...ALGORITHMS,
  ...TRIAD_SOCIETY,
  ...FLOATS,
  ...TIMELINE_ENTRIES,
  ...Y2040,
  ...Y2041,
  ...Y2042,
  ...Y2043,
  ...Y2044,
  ...TIME,
  ...MUSIC,
  ...SCENE,
  ...TECH,
  ...CRT_CULTURE,
  ...SMALLTALK,
  ...GAMES,
  ...PHILOSOPHY,
  ...DIARY,
  ...NATURE,
  ...WORLD,
  ...BEFORE,
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
