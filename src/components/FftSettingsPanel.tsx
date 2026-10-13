import { isNoiseFloorMethod, type NoiseFloorMethod } from "../analysis/noiseFloor";

export interface FftSettings {
  noiseMethod: NoiseFloorMethod;
  lowpassCutoffHz: number;
  /** Overlay the frequency slope (dB/Hz) of the spectrum. */
  showSlope: boolean;
  /** Overlay the A minor pentatonic reference notes. */
  showScaleNotes: boolean;
}

interface FftSettingsPanelProps {
  settings: FftSettings;
  onChange: (settings: FftSettings) => void;
}

/**
 * Settings panel for the FFT tab (spectrum view + tempo analysis).
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
        <small>Controls the tempo analysis (Section 2)</small>
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
}
