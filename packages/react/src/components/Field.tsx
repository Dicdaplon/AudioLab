"use client";

import type { CSSProperties, ReactNode } from "react";

interface RangeFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Formats the value for the readout. Default: the value as is. */
  format?: (value: number) => string;
  /** Unit appended after the formatted value. */
  unit?: string;
}

/** A labelled slider with its value read out in mono. */
export function RangeField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = String,
  unit,
}: RangeFieldProps) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="al-field">
      <label className="al-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="al-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
      <span className="al-field__value al-num">
        {format(value)}
        {unit && <span className="al-field__unit">{unit}</span>}
      </span>
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

/** A labelled native select. */
export function SelectField({ id, label, value, onChange, children }: SelectFieldProps) {
  return (
    <div className="al-field al-field--select">
      <label className="al-field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="al-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}

/** A checkbox drawn as a rocker switch. The text is always shown. */
export function Switch({ id, checked, onChange, children }: SwitchProps) {
  return (
    <label className="al-switch" htmlFor={id}>
      <input
        id={id}
        className="al-switch__input"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="al-switch__track" aria-hidden="true" />
      <span className="al-switch__text">{children}</span>
    </label>
  );
}
