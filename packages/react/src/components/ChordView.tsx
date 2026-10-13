"use client";

import type { ChordScore } from "@audiolab/core";
import { chordRows } from "../ui/rankRows";
import { Panel } from "./Panel";
import { RankList } from "./RankList";

interface ChordViewProps {
  chords: ChordScore[];
  windowSeconds: number;
  /** How many ranked chords to list. */
  topN?: number;
}

/** Ranked chord candidates of the short window. */
export function ChordView({ chords, windowSeconds, topN = 6 }: ChordViewProps) {
  return (
    <Panel title="Chord candidates" meta={`${windowSeconds} s`}>
      {chords.length === 0 ? (
        <p className="al-waiting">Waiting for signal…</p>
      ) : (
        <RankList rows={chordRows(chords, topN)} label="Chord candidates" />
      )}
      <p className="al-hint">
        Top {topN} of 24 chord templates (12 major + 12 minor) by cosine similarity <code>cos</code>{" "}
        with the window's chroma, turned into a probability by a softmax.
      </p>
    </Panel>
  );
}
