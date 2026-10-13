"use client";

/** Signal meter with an adjustable noise-gate threshold. */

import type { CSSProperties } from "react";

import { RangeField } from "../../components/Field";

const METER_MIN_DB = -90;
const METER_RANGE_DB = 80;
const GATE_MIN_DB = -90;
const GATE_MAX_DB = -20;

function meterFraction(db: number): number {
  return Math.min(1, Math.max(0, (db - METER_MIN_DB) / METER_RANGE_DB));
}

const percent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

interface NoiseGateProps {
  signalLevelDb: number;
  thresholdDb: number;
  gateOpen: boolean;
  onThresholdChange: (db: number) => void;
}

export function NoiseGate({
  signalLevelDb,
  thresholdDb,
  gateOpen,
  onThresholdChange,
}: NoiseGateProps) {
  const level = Math.round(signalLevelDb);
  return (
    <div className="gate">
      <div className="gate__head">
        <span className="surtitre">Noise gate</span>
        <span className="gate__value num">{thresholdDb.toFixed(0)} dB</span>
      </div>
      <div
        className="meter"
        role="meter"
        aria-valuemin={METER_MIN_DB}
        aria-valuemax={METER_MIN_DB + METER_RANGE_DB}
        aria-valuenow={Math.max(METER_MIN_DB, Math.min(METER_MIN_DB + METER_RANGE_DB, level))}
        aria-valuetext={`${level} dB`}
        aria-label="signal level"
      >
        <div className="meter__track">
          <div
            className="meter__fill"
            style={{ "--level": percent(meterFraction(signalLevelDb)) } as CSSProperties}
          />
          <div
            className="meter__gate"
            data-open={gateOpen ? "" : undefined}
            style={{ "--gate": percent(meterFraction(thresholdDb)) } as CSSProperties}
            title="Noise gate threshold"
          />
        </div>
        <span className="meter__value num">{level} dB</span>
      </div>
      <RangeField
        id="gate"
        label="Threshold"
        min={GATE_MIN_DB}
        max={GATE_MAX_DB}
        step={1}
        value={thresholdDb}
        onChange={onThresholdChange}
        format={(v) => v.toFixed(0)}
        unit="dB"
      />
    </div>
  );
}
