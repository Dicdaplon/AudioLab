"use client";

/**
 * The noise filter in three choices: gentle (quiet notes get through, more
 * noise too), normal, strict (more noise ignored, play firmer). The default
 * of the current use (`GATE_STRICTNESS`) is marked.
 */

import { GATE_LEVELS, gateLevelOf, type GateLevel } from "@audiolab/core";

export interface GateStrictnessFieldProps {
  id: string;
  /** Strictness, 0 gentle … 1 strict; shown as the nearest of the three levels. */
  value: number;
  /** Called with the strictness of the chosen level (`GATE_LEVELS`). */
  onChange: (value: number) => void;
  /** The default of this use (e.g. `GATE_STRICTNESS.rhythm`), marked "default". */
  defaultValue?: number;
  label?: string;
}

const LEVELS: ReadonlyArray<{ level: GateLevel; label: string }> = [
  { level: "gentle", label: "Gentle" },
  { level: "normal", label: "Normal" },
  { level: "strict", label: "Strict" },
];

export function GateStrictnessField({
  id,
  value,
  onChange,
  defaultValue,
  label = "Noise filter",
}: GateStrictnessFieldProps) {
  const current = gateLevelOf(value);
  const preset = defaultValue === undefined ? null : gateLevelOf(defaultValue);
  return (
    <div className="al-strictness">
      <span className="al-field__label" id={`${id}-label`}>
        {label}
      </span>
      <div className="al-choice" role="radiogroup" aria-labelledby={`${id}-label`}>
        {LEVELS.map(({ level, label: name }) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={current === level}
            className="al-choice__option"
            onClick={() => onChange(GATE_LEVELS[level])}
          >
            {name}
            {preset === level && <small className="al-choice__default"> (default)</small>}
          </button>
        ))}
      </div>
      <p className="al-strictness__hint">
        Gentle lets quiet notes through. Strict ignores more noise, so play a little firmer.
      </p>
    </div>
  );
}
