"use client";

import { memo } from "react";

import {
  type DetectorSettings,
  HIGH_WATER_MARK_MEMORY_MAX,
  HIGH_WATER_MARK_MEMORY_MIN,
} from "@audiolab/core";
import { RangeField, SelectField, Switch } from "./Field";
import { Panel } from "./Panel";

interface SettingsPanelProps {
  settings: DetectorSettings;
  onChange: (next: DetectorSettings) => void;
  /** Current threshold value (informational). */
  currentThreshold?: number;
  /** Last observed peak value (informational). */
  lastPeak?: number;
  /** Colour the chroma bars by pitch class instead of magnitude. */
  colourByPitch: boolean;
  onColourByPitchChange: (value: boolean) => void;
}

export const SettingsPanel = memo(function SettingsPanel({
  settings,
  onChange,
  currentThreshold = 0,
  lastPeak = 0,
  colourByPitch,
  onColourByPitchChange,
}: SettingsPanelProps) {
  const update = (patch: Partial<DetectorSettings>): void => {
    onChange({ ...settings, ...patch });
  };

  return (
    <Panel title="Settings" className="panel--settings" as="section">
      <RangeField
        id="live-sec"
        label="Live window"
        min={1}
        max={30}
        step={1}
        value={settings.liveAcquisitionSeconds}
        onChange={(v) => update({ liveAcquisitionSeconds: v })}
        unit="s"
      />
      <RangeField
        id="ton-sec"
        label="Tonality window"
        min={5}
        max={120}
        step={1}
        value={settings.tonalityAcquisitionSeconds}
        onChange={(v) => update({ tonalityAcquisitionSeconds: v })}
        unit="s"
      />
      <RangeField
        id="tol"
        label="Peak tolerance"
        min={0}
        max={1}
        step={0.05}
        value={settings.maxFilterTolerancy}
        onChange={(v) => update({ maxFilterTolerancy: v })}
        format={(v) => (v * 100).toFixed(0)}
        unit="%"
      />
      <RangeField
        id="mem"
        label="Peak memory"
        min={HIGH_WATER_MARK_MEMORY_MIN}
        max={HIGH_WATER_MARK_MEMORY_MAX}
        step={1}
        value={settings.maxFilterMemory}
        onChange={(v) => update({ maxFilterMemory: v })}
      />
      <SelectField
        id="mode"
        label="Peak aggregator"
        value={settings.maxFilterMode}
        onChange={(v) => update({ maxFilterMode: v === "median" ? "median" : "mean" })}
      >
        <option value="mean">Mean (default)</option>
        <option value="median">Median (more robust)</option>
      </SelectField>

      <dl className="stat-grid stat-grid--2">
        <div className="stat">
          <dt className="stat__label">Current threshold</dt>
          <dd className="stat__value">{currentThreshold.toFixed(4)}</dd>
        </div>
        <div className="stat">
          <dt className="stat__label">Last peak</dt>
          <dd className="stat__value">{lastPeak.toFixed(4)}</dd>
        </div>
      </dl>

      <Switch id="colour-by-pitch" checked={colourByPitch} onChange={onColourByPitchChange}>
        Colour chroma bars by pitch class
      </Switch>

      <p className="hint">
        The presence filter keeps only the chroma bins above a fraction (the tolerance) of the
        recent peaks; the memory sets how many peaks are averaged. The threshold follows how
        concentrated the chroma is, not how loud the signal is.
      </p>
    </Panel>
  );
});
