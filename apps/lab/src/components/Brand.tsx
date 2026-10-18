/**
 * The mark of loloupTech: a capsule with a wolf's ears, drawn on a 16 × 16
 * pixel grid. The left half is in the theme ink, the right half in the
 * accent, two pixels of the bed for eyes. Same drawing as the favicon.
 * An original homage to the capsules of a certain 1980s manga company: no
 * logo, name or character of theirs, just the idea of a numbered capsule.
 *
 * Drawn with whole-unit rects and crispEdges; shown at 16 or 32 px (1 or 2
 * screen pixels per cell) it stays sharp.
 */
export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg
      className="mark"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {/* Ink half: left ear, then the capsule's rows from top to bottom. */}
      <path
        fill="currentColor"
        d="M3 2h1v1h1v1h1v1h2v1H3zM2 6h6v1H2zM1 7h7v4H1zM2 11h6v1H2zM3 12h5v1H3z"
      />
      {/* Accent half, mirrored. */}
      <path
        className="mark__accent"
        d="M12 2h1v4H8V5h2V4h1V3h1zM8 6h6v1H8zM8 7h7v4H8zM8 11h6v1H8zM8 12h5v1H8z"
      />
      {/* Eyes, and the capsule's push button on top. */}
      <path className="mark__eye" d="M5 8h1v1H5zM10 8h1v1h-1z" />
      <path className="mark__button" d="M7 4h2v1H7z" />
    </svg>
  );
}

export function Brand() {
  return (
    <a className="brand" href="./" aria-label="loloupTech audio lab, home">
      <Mark />
      <span className="brand__text" aria-hidden="true">
        <span className="brand__word">
          loloup<span className="brand__tech">Tech</span>
        </span>
        <span className="brand__tagline">Audio capsules · est. 2026</span>
      </span>
      <span className="brand__no" aria-hidden="true">
        No.1
      </span>
    </a>
  );
}
