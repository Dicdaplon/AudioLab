import type { CSSProperties } from "react";

/** Text style with the hard outline and pixel shadow used for stage values. */
export function outlined(size: number, colour: string, font: string): CSSProperties {
  const stroke = Math.max(2, Math.round(size * 0.06));
  return {
    font: `${size}px/1 ${font}`,
    color: colour,
    WebkitTextStroke: `${stroke}px #090c0b`,
    paintOrder: "stroke fill",
    textShadow: `${Math.max(2, Math.round(size / 28))}px ${Math.max(2, Math.round(size / 28))}px 0 rgba(0, 0, 0, 0.55)`,
  };
}
