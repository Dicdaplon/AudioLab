/**
 * Confusion bookkeeping shared by the measurement tests and scripts:
 * played label → detected label counts, plus named outcome counters, and
 * a markdown rendering for the README.
 */

export class Confusion {
  readonly rows = new Map<string, Map<string, number>>();
  readonly counters = new Map<string, number>();
  takes = 0;

  add(played: string, detected: string, outcomes: Record<string, boolean> = {}): void {
    let row = this.rows.get(played);
    if (!row) this.rows.set(played, (row = new Map()));
    row.set(detected, (row.get(detected) ?? 0) + 1);
    this.takes++;
    for (const [name, hit] of Object.entries(outcomes)) {
      if (hit) this.counters.set(name, (this.counters.get(name) ?? 0) + 1);
    }
  }

  count(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  rate(name: string): number {
    return this.takes === 0 ? 0 : this.count(name) / this.takes;
  }

  /** How often `played` was read as `detected`, in [0, 1]. */
  share(played: string, detected: string): number {
    const row = this.rows.get(played);
    if (!row) return 0;
    let total = 0;
    for (const n of row.values()) total += n;
    return (row.get(detected) ?? 0) / total;
  }

  /** One line per played label: the detections, most frequent first. */
  toMarkdown(playedHeader = "Played", detectedHeader = "Detected"): string {
    const lines = [`| ${playedHeader} | ${detectedHeader} |`, "| --- | --- |"];
    for (const [played, row] of this.rows) {
      const total = [...row.values()].reduce((a, b) => a + b, 0);
      const cells = [...row.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, n]) => {
          const pct = `${Math.round((100 * n) / total)} %`;
          return name === played ? `**${name}** ${pct}` : `${name} ${pct}`;
        });
      lines.push(`| ${played} | ${cells.join(", ")} |`);
    }
    return lines.join("\n");
  }
}

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}
