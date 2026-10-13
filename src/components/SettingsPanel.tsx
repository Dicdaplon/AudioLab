import {
  HIGH_WATER_MARK_MEMORY_MAX,
  HIGH_WATER_MARK_MEMORY_MIN,
  type HighWaterMarkMode,
} from "../analysis/highWaterMark";

export interface ToneBaseSettings {
  liveAcquisitionSeconds: number;
  tonalityAcquisitionSeconds: number;
  maxFilterTolerancy: number;
  maxFilterMemory: number;
  maxFilterMode: HighWaterMarkMode;
}

interface SettingsPanelProps {
  settings: ToneBaseSettings;
  onChange: (next: ToneBaseSettings) => void;
  /** Current threshold value (informational). */
  currentThreshold?: number;
  /** Last observed peak value (informational). */
  lastPeak?: number;
}

export function SettingsPanel({
  settings,
  onChange,
  currentThreshold = 0,
  lastPeak = 0,
}: SettingsPanelProps) {
  const update = (patch: Partial<ToneBaseSettings>): void => {
    onChange({ ...settings, ...patch });
  };

  return (
    <div className="settings-panel">
      <h3>ToneBaseTonality — réglages</h3>

      <div className="settings-row">
        <label htmlFor="live-sec">Live acquisition (s)</label>
        <input
          id="live-sec"
          type="range"
          min={1}
          max={30}
          step={1}
          value={settings.liveAcquisitionSeconds}
          onChange={(e) => update({ liveAcquisitionSeconds: Number(e.target.value) })}
        />
        <span className="value">{settings.liveAcquisitionSeconds} s</span>
      </div>

      <div className="settings-row">
        <label htmlFor="ton-sec">Tonality acquisition (s)</label>
        <input
          id="ton-sec"
          type="range"
          min={5}
          max={120}
          step={1}
          value={settings.tonalityAcquisitionSeconds}
          onChange={(e) => update({ tonalityAcquisitionSeconds: Number(e.target.value) })}
        />
        <span className="value">{settings.tonalityAcquisitionSeconds} s</span>
      </div>

      <div className="settings-row">
        <label htmlFor="tol">Max filter tolerancy</label>
        <input
          id="tol"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.maxFilterTolerancy}
          onChange={(e) => update({ maxFilterTolerancy: Number(e.target.value) })}
        />
        <span className="value">{(settings.maxFilterTolerancy * 100).toFixed(0)} %</span>
      </div>

      <div className="settings-row">
        <label htmlFor="mem">Max memory</label>
        <input
          id="mem"
          type="range"
          min={HIGH_WATER_MARK_MEMORY_MIN}
          max={HIGH_WATER_MARK_MEMORY_MAX}
          step={1}
          value={settings.maxFilterMemory}
          onChange={(e) => update({ maxFilterMemory: Number(e.target.value) })}
        />
        <span className="value">{settings.maxFilterMemory}</span>
      </div>

      <div className="settings-row">
        <label htmlFor="mode">Peak aggregator</label>
        <select
          id="mode"
          value={settings.maxFilterMode}
          onChange={(e) => update({ maxFilterMode: e.target.value as HighWaterMarkMode })}
        >
          <option value="mean">Mean (default)</option>
          <option value="median">Median (more robust)</option>
        </select>
        <span className="value">&nbsp;</span>
      </div>

      <div className="settings-info">
        <span>seuil actuel : {currentThreshold.toFixed(4)}</span>
        <span>dernier pic : {lastPeak.toFixed(4)}</span>
      </div>
    </div>
  );
}
