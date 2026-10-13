import { memo } from "react";

import { isNoiseFloorMethod } from "../analysis/noiseFloor";
import { ONSET_LOWPASS_RANGE, type FftSettings } from "../config/settings";

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
    <section className="fft-settings-panel">
      <h3>FFT Settings</h3>
      <div className="settings-group">
        <label>
          Noise Floor Method:
          <select
            value={settings.noiseMethod}
            onChange={(e) => {
              if (isNoiseFloorMethod(e.target.value)) {
                onChange({ ...settings, noiseMethod: e.target.value });
              }
            }}
          >
            <option value="median">Median (robust)</option>
            <option value="mean">Mean (average)</option>
            <option value="p80">P80 (80th percentile)</option>
          </select>
        </label>
      </div>

      <div className="settings-group">
        <label>
          Onset envelope lowpass (Hz): <strong>{settings.onsetLowpassHz.toFixed(1)}</strong>
          <input
            type="range"
            min={ONSET_LOWPASS_RANGE.min}
            max={ONSET_LOWPASS_RANGE.max}
            step={ONSET_LOWPASS_RANGE.step}
            value={settings.onsetLowpassHz}
            onChange={(e) =>
              onChange({
                ...settings,
                onsetLowpassHz: parseFloat(e.target.value),
              })
            }
          />
        </label>
        <small>Smooths the onset strength before the tempo analysis (Section 2)</small>
      </div>

      <div className="settings-group">
        <label>
          <input
            type="checkbox"
            checked={settings.showSlope}
            onChange={(e) => onChange({ ...settings, showSlope: e.target.checked })}
          />
          Show spectrum slope (dB/Hz)
        </label>
      </div>

      <div className="settings-group">
        <label>
          <input
            type="checkbox"
            checked={settings.showScaleNotes}
            onChange={(e) => onChange({ ...settings, showScaleNotes: e.target.checked })}
          />
          Show A minor pentatonic notes (A, C, D, E, G)
        </label>
      </div>
    </section>
  );
});
