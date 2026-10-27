/**
 * Aggregation and uncertainty of the benchmark.
 *
 * Every measurement is a record: one item (an excerpt, a clip, a generated
 * signal) scored `x` with a mass `m` (frames for chords, reference onsets
 * for onsets, 1 for tempo and key), inside a stratum (a style of a source,
 * or a scenario of the synthetic set) and a cluster (the independent unit:
 * a GuitarSet lead sheet, a backing track, a fixture family, a generated
 * item).
 *
 *   stratum score    s_g = Σ m·x / Σ m over its items (volume-weighted)
 *   source score     mean of its strata (each style weighs the same)
 *   real             sources weighted by their number of clusters
 *   synthetic        the synthetic source score (mean of its scenarios)
 *   pooled           mean of synthetic and real (equal weight)
 *   realVolume       Σ m·x / Σ m over every real item (as the data is composed)
 *
 * Intervals: a bootstrap that resamples clusters inside each stratum
 * (1000 rounds, fixed seed, 95 % percentile). The composition in styles
 * stays fixed, and two quantities computed on the same resample are paired.
 */
import { mulberry32 } from "../tests/helpers/synth";

export type Split = "synthetic" | "real";

export interface Rec {
  task: "onsets" | "tempo" | "chords" | "keys" | "pitch";
  metric: string;
  method: string;
  condition: string;
  split: Split;
  source: string;
  stratum: string;
  cluster: string;
  item: string;
  x: number;
  m: number;
}

const stratumKey = (r: Rec) => `${r.split}|${r.source}|${r.stratum}`;

/** Resampled clusters per stratum (with repetition). */
export type Sample = Map<string, string[]>;

/** The distinct clusters of each stratum. */
export function clusterLayout(recs: readonly Rec[]): Map<string, string[]> {
  const layout = new Map<string, Set<string>>();
  for (const r of recs) {
    const k = stratumKey(r);
    if (!layout.has(k)) layout.set(k, new Set());
    layout.get(k)!.add(r.cluster);
  }
  return new Map([...layout].map(([k, s]) => [k, [...s].sort()]));
}

export interface StratumStat {
  split: Split;
  source: string;
  stratum: string;
  score: number;
  /** Σ m: frames, onsets or items. */
  mass: number;
  clusters: number;
  /** Lowest and highest cluster score. */
  min: number;
  max: number;
}

export interface Aggregate {
  synthetic: number | null;
  real: number | null;
  realVolume: number | null;
  pooled: number | null;
  sources: Record<string, number>;
  strata: StratumStat[];
}

/** The aggregates of a set of records (one task, metric, method, condition). */
export function aggregate(recs: readonly Rec[], sample?: Sample): Aggregate {
  const byStratum = new Map<string, Map<string, Rec[]>>();
  for (const r of recs) {
    const k = stratumKey(r);
    if (!byStratum.has(k)) byStratum.set(k, new Map());
    const clusters = byStratum.get(k)!;
    if (!clusters.has(r.cluster)) clusters.set(r.cluster, []);
    clusters.get(r.cluster)!.push(r);
  }
  const strata: StratumStat[] = [];
  const clusterCount = new Map<string, Set<string>>(); // per split|source
  for (const [k, clusters] of byStratum) {
    const [split, source, stratum] = k.split("|") as [Split, string, string];
    const chosen = sample?.get(k) ?? [...clusters.keys()];
    let mx = 0;
    let m = 0;
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of chosen) {
      const items = clusters.get(c);
      if (!items) continue;
      let cmx = 0;
      let cm = 0;
      for (const r of items) {
        cmx += r.m * r.x;
        cm += r.m;
      }
      mx += cmx;
      m += cm;
      if (cm > 0) {
        lo = Math.min(lo, cmx / cm);
        hi = Math.max(hi, cmx / cm);
      }
    }
    if (m === 0) continue;
    strata.push({
      split,
      source,
      stratum,
      score: mx / m,
      mass: m,
      clusters: clusters.size,
      min: lo,
      max: hi,
    });
    const sk = `${split}|${source}`;
    if (!clusterCount.has(sk)) clusterCount.set(sk, new Set());
    for (const c of clusters.keys()) clusterCount.get(sk)!.add(`${stratum}/${c}`);
  }

  const sources: Record<string, number> = {};
  const bySource = new Map<string, StratumStat[]>();
  for (const s of strata) {
    const sk = `${s.split}|${s.source}`;
    if (!bySource.has(sk)) bySource.set(sk, []);
    bySource.get(sk)!.push(s);
  }
  let realNum = 0;
  let realDen = 0;
  let synthetic: number | null = null;
  for (const [sk, list] of bySource) {
    const score = list.reduce((a, s) => a + s.score, 0) / list.length;
    sources[sk] = score;
    if (sk.startsWith("synthetic|")) synthetic = score;
    else {
      const w = clusterCount.get(sk)!.size;
      realNum += w * score;
      realDen += w;
    }
  }
  const real = realDen > 0 ? realNum / realDen : null;
  let vmx = 0;
  let vm = 0;
  for (const s of strata) {
    if (s.split !== "real") continue;
    vmx += s.score * s.mass;
    vm += s.mass;
  }
  const parts = [synthetic, real].filter((v): v is number => v !== null);
  return {
    synthetic,
    real,
    realVolume: vm > 0 ? vmx / vm : null,
    pooled: parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null,
    sources,
    strata,
  };
}

/** `rounds` resamples of the clusters of every stratum, from a fixed seed. */
export function resamples(layout: Map<string, string[]>, rounds = 1000, seed = 2026): Sample[] {
  const rand = mulberry32(seed);
  const out: Sample[] = [];
  for (let r = 0; r < rounds; r++) {
    const s: Sample = new Map();
    for (const [k, clusters] of layout) {
      s.set(
        k,
        clusters.map(() => clusters[Math.floor(rand() * clusters.length)]),
      );
    }
    out.push(s);
  }
  return out;
}

/** 95 % percentile interval of a statistic over the resamples (null values dropped). */
export function interval(
  samples: readonly Sample[],
  stat: (s: Sample) => number | null,
): [number, number] | null {
  const values = samples.map(stat).filter((v): v is number => v !== null && Number.isFinite(v));
  if (values.length < samples.length / 2) return null;
  values.sort((a, b) => a - b);
  return [values[Math.floor(0.025 * values.length)], values[Math.floor(0.975 * values.length)]];
}
