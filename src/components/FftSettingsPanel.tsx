import { NoiseFloorMethod } from "../analysis/noiseFloor";

export interface FftSettings {
  noiseMethod: NoiseFloorMethod;
  lowpassCutoffHz: number;
  showDerivative: boolean;
  showScaleNotes: boolean;
}

interface FftSettingsPanelProps {
  settings: FftSettings;
  onChange: (settings: FftSettings) => void;
}

/**
 * Settings panel for FFT visualization (Section 1 + Section 2).
 */
export function FftSettingsPanel({ settings, onChange }: FftSettingsPanelProps) {
  return (
    <section className="fft-settings-panel">
      <h3>FFT Settings</h3>
      <div className="settings-group">
        <label>
          Noise Floor Method:
          <select
            value={settings.noiseMethod}
            onChange={(e) =>
              onChange({
                ...settings,
                noiseMethod: e.target.value as NoiseFloorMethod,
              })
            }
          >
            <option value="median">Median (robust)</option>
            <option value="mean">Mean (average)</option>
            <option value="p80">P80 (80th percentile)</option>
          </select>
        </label>
      </div>

      <div className="settings-group">
        <label>
          Lowpass Cutoff (Hz): <strong>{settings.lowpassCutoffHz.toFixed(2)}</strong>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.1"
            value={settings.lowpassCutoffHz}
            onChange={(e) =>
              onChange({
                ...settings,
                lowpassCutoffHz: parseFloat(e.target.value),
              })
            }
          />
        </label>
        <small>Controls tempo envelope analysis (Section 2)</small>
      </div>

      <div className="settings-group">
        <label>
          <input
            type="checkbox"
            checked={settings.showDerivative}
            onChange={(e) =>
              onChange({
                ...settings,
                showDerivative: e.target.checked,
              })
            }
          />
          Show FFT Derivative (dB/Hz)
        </label>
      </div>

      <div className="settings-group">
        <label>
          <input
            type="checkbox"
            checked={settings.showScaleNotes}
            onChange={(e) =>
              onChange({
                ...settings,
                showScaleNotes: e.target.checked,
              })
            }
          />
          Show Major Scale Notes (A, C, D, E, G)
        </label>
      </div>
    </section>
  );
}
