"use client";

import { memo } from "react";

import { type FftSettings, isNoiseFloorMethod, ONSET_LOWPASS_RANGE } from "@audiolab/core";
import { RangeField, SelectField, Switch } from "./Field";
import { Panel } from "./Panel";

interface FftSettingsPanelProps {
  settings: FftSettings;
  onChange: (settings: FftSettings) => void;
}

/**
 * Settings panel for the FFT tab (spectrum view + tempo analysis).
 */
export const FftSettingsPanel = memo(function FftSettingsPanel({
  settings,
  onChange,
}: FftSettingsPanelProps) {
  return (
    <Panel title="Settings" className="panel--settings" as="section">
      <SelectField
        id="noise-method"
        label="Noise floor"
        value={settings.noiseMethod}
        onChange={(v) => {
          if (isNoiseFloorMethod(v)) onChange({ ...settings, noiseMethod: v });
        }}
      >
        <option value="median">Median (robust)</option>
        <option value="mean">Mean (average)</option>
        <option value="p80">P80 (80th percentile)</option>
      </SelectField>

      <RangeField
        id="onset-lowpass"
        label="Onset lowpass"
        min={ONSET_LOWPASS_RANGE.min}
        max={ONSET_LOWPASS_RANGE.max}
        step={ONSET_LOWPASS_RANGE.step}
        value={settings.onsetLowpassHz}
        onChange={(v) => onChange({ ...settings, onsetLowpassHz: v })}
        format={(v) => v.toFixed(1)}
        unit="Hz"
      />

      <Switch
        id="show-slope"
        checked={settings.showSlope}
        onChange={(checked) => onChange({ ...settings, showSlope: checked })}
      >
        Show spectrum slope (dB/Hz)
      </Switch>

      <Switch
        id="show-scale-notes"
        checked={settings.showScaleNotes}
        onChange={(checked) => onChange({ ...settings, showScaleNotes: checked })}
      >
        Show A minor pentatonic notes (A, C, D, E, G)
      </Switch>

      <p className="hint">
        The lowpass smooths the onset-strength envelope before the tempo analysis; lower values
        attenuate fast beat rates.
      </p>
    </Panel>
  );
});
