"use client";

import { memo, type ReactNode } from "react";

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
  /** A compact "How?" sheet; it replaces the technical hint. */
  how?: ReactNode;
}

/** A share of the chroma as a percentage, or a dash before any sound. */
const share = (v: number) => (v > 0 ? `${(v * 100).toFixed(1)} %` : "—");

export const SettingsPanel = memo(function SettingsPanel({
  settings,
  onChange,
  currentThreshold = 0,
  lastPeak = 0,
  colourByPitch,
  onColourByPitchChange,
  how,
}: SettingsPanelProps) {
  const update = (patch: Partial<DetectorSettings>): void => {
    onChange({ ...settings, ...patch });
  };

  return (
    <Panel title="Settings" className="al-panel--settings" as="section" how={how}>
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
        label="A note is present above"
        min={0}
        max={1}
        step={0.05}
        value={settings.maxFilterTolerancy}
        onChange={(v) => update({ maxFilterTolerancy: v })}
        format={(v) => (v * 100).toFixed(0)}
        unit="% of the loudest"
      />
      <details className="al-settings-more">
        <summary className="al-settings-more__summary">Fine tuning</summary>
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

        <dl className="al-stat-grid al-stat-grid--2">
          <div className="al-stat">
            <dt className="al-stat__label">Cut line</dt>
            <dd className="al-stat__value">{share(currentThreshold)}</dd>
          </div>
          <div className="al-stat">
            <dt className="al-stat__label">Loudest note</dt>
            <dd className="al-stat__value">{share(lastPeak)}</dd>
          </div>
        </dl>
      </details>

      <Switch id="colour-by-pitch" checked={colourByPitch} onChange={onColourByPitchChange}>
        Colour chroma bars by pitch class
      </Switch>

      {!how && (
        <p className="al-hint">
          A note counts as present when it holds at least this share of the loudest note (averaged
          over the last few readings, see Fine tuning). The cut line and the loudest note are shares
          of everything heard, not volumes.
        </p>
      )}
    </Panel>
  );
});
