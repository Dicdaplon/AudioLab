"use client";

import { Segments } from "./Segments";

export type Mode = "maj" | "min";

interface ReadoutProps {
  /** Small caps label above the value, e.g. "Estimated key". */
  label: string;
  /** Mono annotation after the label, e.g. "30 s". */
  meta?: string;
  /** The value said out loud: "G", "Am". Null while waiting for signal. */
  value: string | null;
  /** The word that follows the value in italics: "major" / "minor". */
  qualifier?: string;
  /** Tints the filet and the qualifier; always doubled by the word. */
  mode?: Mode;
  /** Probability in [0, 1]; drives the confidence segments. */
  probability?: number;
  /** Smaller display for secondary readouts. */
  compact?: boolean;
}

const CONFIDENCE_SEGMENTS = 5;

/**
 * The hero display: the detected key or chord in the voice of the book.
 * A meter, not an animation: the value changes without easing.
 */
export function Readout({
  label,
  meta,
  value,
  qualifier,
  mode,
  probability,
  compact = false,
}: ReadoutProps) {
  const waiting = value === null;
  const confidence =
    probability === undefined ? null : Math.min(CONFIDENCE_SEGMENTS, Math.floor(probability * 5));
  return (
    <div
      className={compact ? "al-readout al-readout--compact" : "al-readout"}
      data-mode={waiting ? undefined : mode}
      role="group"
      aria-label={label}
    >
      <span className="al-readout__label al-surtitre">
        {label}
        {meta && <span className="al-readout__meta al-num"> · {meta}</span>}
      </span>
      <strong className="al-readout__value">
        {waiting ? (
          <span className="al-readout__empty" aria-label="no value yet">
            —
          </span>
        ) : (
          <>
            {value}
            {qualifier && <em className="al-readout__qualifier"> {qualifier}</em>}
          </>
        )}
      </strong>
      {waiting ? (
        <span className="al-readout__hint">Waiting for signal…</span>
      ) : (
        probability !== undefined && (
          <span className="al-readout__prob">
            <span className="al-num">{(probability * 100).toFixed(1)} %</span>
            <Segments
              className="al-segments--small al-readout__confidence"
              count={CONFIDENCE_SEGMENTS}
              filled={confidence ?? 0}
              label={`confidence ${confidence} of ${CONFIDENCE_SEGMENTS}`}
            />
          </span>
        )
      )}
    </div>
  );
}
