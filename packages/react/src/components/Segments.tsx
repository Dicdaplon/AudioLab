"use client";

interface SegmentsProps {
  /** Total number of segments. */
  count: number;
  /** Segments filled from the left. */
  filled: number;
  /** Accessible description, e.g. "confidence 2 of 5". */
  label: string;
  /** Extra classes: segments--small, segments--hp. */
  className?: string;
}

/** Discrete progress drawn as segments filled left to right. */
export function Segments({ count, filled, label, className }: SegmentsProps) {
  const n = Math.max(0, Math.round(count));
  const on = Math.max(0, Math.min(n, Math.round(filled)));
  return (
    <span
      className={className ? `al-segments ${className}` : "al-segments"}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className="al-segments__seg" data-filled={i < on ? "" : undefined} />
      ))}
    </span>
  );
}
