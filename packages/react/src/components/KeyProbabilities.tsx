"use client";

import type { KeyScore } from "@audiolab/core";
import { keyRows } from "../ui/rankRows";
import { Panel } from "./Panel";
import { RankList } from "./RankList";

interface KeyProbabilitiesProps {
  keys: KeyScore[];
  windowSeconds: number;
  /** How many ranked keys to list. Default 12. */
  topN?: number;
  /** Panel title, e.g. "Live key candidates". */
  title: string;
}

/** Ranked key candidates of one acquisition window. */
export function KeyProbabilities({ keys, windowSeconds, topN = 12, title }: KeyProbabilitiesProps) {
  return (
    <Panel title={title} meta={`${windowSeconds} s`}>
      {keys.length === 0 ? (
        <p className="waiting">Waiting for signal…</p>
      ) : (
        <RankList rows={keyRows(keys, topN)} label={title} />
      )}
      <p className="hint">
        Top {topN} of 24 candidate keys (12 major + 12 minor), ranked by probability (softmax over
        the Pearson correlation <code>r</code> with the Krumhansl-Schmuckler profiles).
      </p>
    </Panel>
  );
}
