"use client";

import type { CSSProperties } from "react";

import { NOTE_NAMES } from "@audiolab/core";

interface ChromaBarsProps {
  /** Twelve values, one per pitch class (C first). */
  values: Float32Array;
  /** Fixed scale maximum; defaults to the largest value (relative view). */
  max?: number;
  /** Accessible description of what is shown, e.g. "instantaneous chroma". */
  label: string;
  /** Colour each bar by pitch class instead of magnitude. */
  colourByPitch?: boolean;
  /** Binary indicator: bars are on or off and empty slots keep an outline. */
  binary?: boolean;
  /** Pitch class to underline as the tonic. */
  tonic?: number;
}

/**
 * Twelve chroma bars. The default colour job is magnitude → one hue, the
 * strongest bar in the stronger tint. Pitch-class colour is opt-in and
 * always doubled by the note name under every bar.
 */
export function ChromaBars({
  values,
  max,
  label,
  colourByPitch = false,
  binary = false,
  tonic,
}: ChromaBarsProps) {
  let peak = 0;
  let argmax = -1;
  for (let i = 0; i < 12; i++) {
    const v = values[i] ?? 0;
    if (v > peak) {
      peak = v;
      argmax = i;
    }
  }
  const scale = max ?? Math.max(1e-9, peak);
  const strongest = argmax >= 0 ? NOTE_NAMES[argmax] : "none";
  const className = binary ? "chroma chroma--binary" : "chroma";

  return (
    <div
      className={className}
      data-colour={colourByPitch ? "pitch" : "single"}
      role="img"
      aria-label={`${label}, strongest ${strongest}`}
    >
      {NOTE_NAMES.map((name, i) => {
        const v = Math.min(1, Math.max(0, (values[i] ?? 0) / scale));
        const style = {
          "--v": v.toFixed(3),
          "--pc": `var(--viz-pc-${i})`,
        } as CSSProperties;
        return (
          <div
            key={name}
            className="chroma__bar"
            data-pc={i}
            data-max={i === argmax && peak > 0 ? "" : undefined}
            data-tonic={i === tonic ? "" : undefined}
            data-sharp={name.length > 1 ? "" : undefined}
            style={style}
          >
            <span className="chroma__track">
              <i className="chroma__fill" />
            </span>
            <span className="chroma__label">{name}</span>
          </div>
        );
      })}
    </div>
  );
}
