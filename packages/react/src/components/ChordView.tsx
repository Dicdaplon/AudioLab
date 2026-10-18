"use client";

import type { ReactNode } from "react";
import type { ChordScore } from "@audiolab/core";
import { chordRows } from "../ui/rankRows";
import { Panel } from "./Panel";
import { RankList } from "./RankList";

interface ChordViewProps {
  chords: ChordScore[];
  windowSeconds: number;
  /** How many ranked chords to list. */
  topN?: number;
  /** A compact "How?" sheet; it replaces the technical hint. */
  how?: ReactNode;
}

/** Ranked chord candidates of the short window. */
export function ChordView({ chords, windowSeconds, topN = 6, how }: ChordViewProps) {
  return (
    <Panel title="Chord candidates" meta={`${windowSeconds} s`} how={how}>
      {chords.length === 0 ? (
        <p className="al-waiting">Waiting for signal…</p>
      ) : (
        <RankList rows={chordRows(chords, topN)} label="Chord candidates" />
      )}
      {!how && (
        <p className="al-hint">
          Top {topN} chord templates (24 triads, more with the extended qualities) by cosine
          similarity <code>cos</code> with the window's chroma, turned into a score by a softmax.
        </p>
      )}
    </Panel>
  );
}
