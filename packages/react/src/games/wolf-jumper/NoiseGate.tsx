"use client";

/**
 * Signal meter with the noise gate. Automatic by default: the threshold
 * follows the room (background + a margin set by the "Noise filter" slider)
 * and the player has nothing else to set.
 * "Set it myself" switches to the manual slider.
 */

import type { CSSProperties } from "react";

import { GATE_STRICTNESS, type NoiseGateState } from "@audiolab/core";
import { RangeField, Switch } from "../../components/Field";
import { GateStrictnessField } from "../../components/GateStrictnessField";
import type { GateSetting } from "./useWolfJumper";

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
  /** Manual threshold, in dB. */
  thresholdDb: number;
  gateOpen: boolean;
  onThresholdChange: (db: number) => void;
  /** Gate mode. Default "auto", as in `WolfJumper`. */
  mode?: GateSetting;
  onModeChange?: (mode: GateSetting) => void;
  /** Automatic gate state, to draw its threshold and the learnt background. */
  gate?: NoiseGateState | null;
  /** Strictness of the automatic gate, 0 gentle … 1 strict; given with its setter, a slider. */
  strictness?: number;
  onStrictnessChange?: (value: number) => void;
}

export function NoiseGate({
  signalLevelDb,
  thresholdDb,
  gateOpen,
  onThresholdChange,
  mode = "auto",
  onModeChange,
  gate,
  strictness,
  onStrictnessChange,
}: NoiseGateProps) {
  const level = Math.round(signalLevelDb);
  const auto = mode === "auto";
  const shownThreshold = auto ? gate?.openThresholdDb : thresholdDb;
  return (
    <div className="al-gate">
      <div className="al-gate__head">
        <span className="al-surtitre">Noise gate</span>
        <span className="al-gate__value al-num">
          {auto ? "Auto" : `${thresholdDb.toFixed(0)} dB`}
        </span>
      </div>
      <div
        className="al-meter"
        role="meter"
        aria-valuemin={METER_MIN_DB}
        aria-valuemax={METER_MIN_DB + METER_RANGE_DB}
        aria-valuenow={Math.max(METER_MIN_DB, Math.min(METER_MIN_DB + METER_RANGE_DB, level))}
        aria-valuetext={`${level} dB`}
        aria-label="signal level"
      >
        <div className="al-meter__track">
          <div
            className="al-meter__fill"
            style={{ "--level": percent(meterFraction(signalLevelDb)) } as CSSProperties}
          />
          {auto && gate && (
            <div
              className="al-meter__floor"
              style={{ "--floor": percent(meterFraction(gate.floorDb)) } as CSSProperties}
              title="Room background"
            />
          )}
          {shownThreshold !== undefined && (
            <div
              className="al-meter__gate"
              data-open={gateOpen ? "" : undefined}
              style={{ "--gate": percent(meterFraction(shownThreshold)) } as CSSProperties}
              title="Noise gate threshold"
            />
          )}
        </div>
        <span className="al-meter__value al-num">{level} dB</span>
      </div>
      {onModeChange && (
        <Switch
          id="gate-manual"
          checked={!auto}
          onChange={(manual) => onModeChange(manual ? "manual" : "auto")}
        >
          Set it myself
        </Switch>
      )}
      {auto ? (
        <>
          <p className="al-gate__hint">
            {gate?.noisy
              ? "Noisy room: play close to the microphone."
              : "Adjusts to your room by itself."}
          </p>
          {strictness !== undefined && onStrictnessChange && (
            <GateStrictnessField
              id="gate-strictness"
              value={strictness}
              onChange={onStrictnessChange}
              defaultValue={GATE_STRICTNESS.game}
            />
          )}
        </>
      ) : (
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
      )}
    </div>
  );
}
