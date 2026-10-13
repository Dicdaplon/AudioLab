/** Signal meter with an adjustable noise-gate threshold. */

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
  return (
    <div className="jumper-noisegate">
      <div className="jumper-noisegate-header">
        <label htmlFor="gate">Noise gate</label>
        <span className="jumper-noisegate-value">{thresholdDb.toFixed(0)} dB</span>
      </div>
      <div className="jumper-noisegate-meter">
        <div
          className="jumper-noisegate-bar"
          style={{ width: percent(meterFraction(signalLevelDb)) }}
        />
        <div
          className={`jumper-noisegate-threshold ${gateOpen ? "open" : "closed"}`}
          style={{ left: percent(meterFraction(thresholdDb)) }}
          title="Noise gate threshold"
        />
        <span className="jumper-noisegate-current">{signalLevelDb.toFixed(0)} dB</span>
      </div>
      <input
        id="gate"
        type="range"
        min={GATE_MIN_DB}
        max={GATE_MAX_DB}
        step={1}
        value={thresholdDb}
        onChange={(e) => onThresholdChange(Number(e.target.value))}
      />
    </div>
  );
}
