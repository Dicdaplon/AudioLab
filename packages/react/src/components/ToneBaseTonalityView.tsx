"use client";

import type { ReactNode } from "react";
import type { KeyScore } from "@audiolab/core";
import { keyRows, splitKeyName } from "../ui/rankRows";
import { ChromaBars } from "./ChromaBars";
import { Panel } from "./Panel";
import { RankList } from "./RankList";
import { Readout } from "./Readout";

interface ToneBaseTonalityViewProps {
  /** Mean presence histogram (∈ [0, 1] per pitch class). */
  presence: Float32Array;
  /** Filtered live chroma (values that passed the high-water-mark threshold). */
  filteredLiveChroma: Float32Array;
  /** Binary presence indicator from the current frame. */
  presenceIndicator: Float32Array;
  /** Tonality ranking derived from the presence histogram. */
  keys: KeyScore[];
  liveSeconds: number;
  tonalitySeconds: number;
  topN?: number;
  colourByPitch?: boolean;
  className?: string;
  /** A compact "How?" sheet; it replaces the technical hint. */
  how?: ReactNode;
}

/**
 * The presence-based key estimate: which pitch classes were present at
 * all over the long window, rather than how much energy they carried.
 */
export function ToneBaseTonalityView({
  presence,
  filteredLiveChroma,
  presenceIndicator,
  keys,
  liveSeconds,
  tonalitySeconds,
  topN = 5,
  colourByPitch,
  className,
  how,
}: ToneBaseTonalityViewProps) {
  const top = keys[0];
  const topName = top ? splitKeyName(top.name) : null;

  return (
    <Panel
      title="Presence tonality"
      meta={`${liveSeconds} s → ${tonalitySeconds} s`}
      as="section"
      className={className}
      how={how}
    >
      <div className="al-tonebase__bars">
        <figure className="al-chroma-figure">
          <figcaption className="al-surtitre">Filtered live chroma</figcaption>
          <ChromaBars
            values={filteredLiveChroma}
            label="filtered live chroma"
            colourByPitch={colourByPitch}
          />
        </figure>
        <figure className="al-chroma-figure">
          <figcaption className="al-surtitre">Current indicator (0 / 1)</figcaption>
          <ChromaBars
            values={presenceIndicator}
            max={1}
            binary
            label="current presence indicator"
            colourByPitch={colourByPitch}
          />
        </figure>
        <figure className="al-chroma-figure">
          <figcaption className="al-surtitre">Presence over {tonalitySeconds} s</figcaption>
          <ChromaBars
            values={presence}
            max={1}
            label={`presence over ${tonalitySeconds} seconds`}
            colourByPitch={colourByPitch}
            tonic={top?.tonic}
          />
        </figure>
      </div>

      <div className="al-tonebase__result">
        <Readout
          compact
          label="Key by presence"
          value={topName?.tonic ?? null}
          qualifier={topName?.mode}
          mode={top?.mode}
          probability={top?.probability}
        />
        {top ? (
          <RankList rows={keyRows(keys, topN)} label="Key candidates by presence" />
        ) : (
          <p className="al-waiting">Waiting for signal…</p>
        )}
      </div>

      {!how && (
        <p className="al-hint">
          Top {topN} of 24 candidates — Krumhansl-Schmuckler correlation on the presence histogram
          (which notes were there), not on the energy.
        </p>
      )}
    </Panel>
  );
}
