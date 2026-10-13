"use client";

import { WOLF_ASPECT, WOLF_PATHS, WOLF_TRANSFORM, WOLF_VIEWBOX } from "./wolfArt";

/** The running wolf, drawn in the theme's ink with an ember eye. */
export function WolfSprite({ width }: { width: number }) {
  return (
    <svg
      className="al-wolf"
      viewBox={WOLF_VIEWBOX}
      width={width}
      height={width * WOLF_ASPECT}
      aria-hidden="true"
      focusable="false"
    >
      <g transform={WOLF_TRANSFORM}>
        {WOLF_PATHS.map((p, i) => (
          <path key={i} className={`al-wolf__${p.role}`} d={p.d} />
        ))}
      </g>
    </svg>
  );
}
