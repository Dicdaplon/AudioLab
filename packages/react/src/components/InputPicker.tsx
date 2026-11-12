"use client";

import { memo } from "react";

import type { AudioInput } from "@audiolab/core";

/** Ids Chrome uses for aliases of a real device; the empty value stands for them. */
const ALIAS_IDS = new Set(["default", "communications"]);

interface InputPickerProps {
  /** From `useAudioInputs().inputs`. */
  inputs: readonly AudioInput[];
  /** Selected device id, "" for the browser's default input. */
  value: string;
  onChange: (deviceId: string) => void;
  id?: string;
}

/**
 * Compact audio input selector for a top bar, next to `MicTransport`.
 * Before permission the browser hides the labels, so inputs are numbered.
 * Hidden while there is nothing to choose between.
 */
export const InputPicker = memo(function InputPicker({
  inputs,
  value,
  onChange,
  id = "al-input-picker",
}: InputPickerProps) {
  const real = inputs.filter((i) => !ALIAS_IDS.has(i.deviceId));
  if (real.length < 2 && value === "") return null;
  return (
    <div className="al-input-picker">
      <label className="al-visually-hidden" htmlFor={id}>
        Audio input
      </label>
      <select
        id={id}
        className="al-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title="Audio input analysed by the lab"
      >
        <option value="">Default input</option>
        {real.map((input, n) => (
          <option key={input.deviceId} value={input.deviceId}>
            {input.label || `Input ${n + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
});
