import { useMemo, useState } from "react";
import { matchScales, pitchClassName, SCALE_NAMES_EN, type ScaleMatch } from "@audiolab/core";
import { ChromaBars, MicPrompt, Panel, RangeField, RankList, type RankRow } from "@audiolab/react";
import { ScalesHow } from "../how/explanations";

const TOP_N = 8;
const DEFAULT_THRESHOLD = 0.25;

interface ScalesTabProps {
  /** Mean presence of each pitch class over the tonality window (∈ [0, 1]). */
  presence: Float32Array;
  windowSeconds: number;
  running: boolean;
  onStart?: () => void;
  colourByPitch?: boolean;
}

const notes = (pcs: number[]) => pcs.map(pitchClassName).join(" ");

function scaleRows(matches: ScaleMatch[]): RankRow[] {
  return matches.map((m) => {
    const parts: string[] = [];
    if (m.missing.length > 0) parts.push(`missing ${notes(m.missing)}`);
    if (m.outside.length > 0) parts.push(`outside ${notes(m.outside)}`);
    return {
      key: `${m.scaleId}-${m.tonic}`,
      name: `${pitchClassName(m.tonic)} ${SCALE_NAMES_EN[m.scaleId] ?? m.scaleId}`,
      probability: m.score,
      stat: parts.length > 0 ? parts.join(" · ") : "complete",
    };
  });
}

/** Which scales contain the notes heard over the long window. */
export function ScalesTab({
  presence,
  windowSeconds,
  running,
  onStart,
  colourByPitch,
}: ScalesTabProps) {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const matches = useMemo(
    () => matchScales(presence, undefined, { threshold, topN: TOP_N }),
    [presence, threshold],
  );
  const played = useMemo(() => {
    const flags = new Float32Array(12);
    for (let pc = 0; pc < 12; pc++) flags[pc] = presence[pc] > threshold ? 1 : 0;
    return flags;
  }, [presence, threshold]);
  const best = matches[0];

  return (
    <div className="scales">
      {!running && (
        <MicPrompt message="Start the microphone and play a few notes." onStart={onStart} />
      )}

      <Panel title="Notes heard" meta={`${windowSeconds} s`} as="section">
        <div className="scales__bars">
          <figure className="al-chroma-figure">
            <figcaption className="al-surtitre">Presence over {windowSeconds} s</figcaption>
            <ChromaBars
              values={presence}
              max={1}
              label={`presence over ${windowSeconds} seconds`}
              colourByPitch={colourByPitch}
              tonic={best?.tonic}
            />
          </figure>
          <figure className="al-chroma-figure">
            <figcaption className="al-surtitre">Counted as played (above the threshold)</figcaption>
            <ChromaBars
              values={played}
              max={1}
              binary
              label="pitch classes counted as played"
              colourByPitch={colourByPitch}
              tonic={best?.tonic}
            />
          </figure>
        </div>
        <RangeField
          id="scale-threshold"
          label="Presence threshold"
          min={0}
          max={0.9}
          step={0.05}
          value={threshold}
          onChange={setThreshold}
          format={(v) => v.toFixed(2)}
        />
      </Panel>

      <Panel title="Matching scales" meta={`top ${TOP_N}`} as="section">
        {best ? (
          <RankList rows={scaleRows(matches)} label="Matching scales" />
        ) : (
          <p className="al-waiting">Waiting for signal…</p>
        )}
        <ScalesHow />
      </Panel>
    </div>
  );
}
