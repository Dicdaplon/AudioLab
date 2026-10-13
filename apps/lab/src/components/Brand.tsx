/**
 * The wordmark: loup(e). The sign is two strokes of lengths 3 and 2, the
 * second offset and in the accent — the same mark as the favicon. No wolf.
 */
export function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="mark"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="6" width="15" height="2" rx="1" fill="currentColor" />
      <rect className="mark__accent" x="3" y="11" width="10" height="2" rx="1" />
    </svg>
  );
}

export function Brand() {
  return (
    <a className="brand" href="./" aria-label="loup(e) — audio lab, home">
      <Mark />
      <span className="brand__word" aria-hidden="true">
        loup<span className="brand__e">(e)</span>
      </span>
    </a>
  );
}
