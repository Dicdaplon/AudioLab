import type { OnsetAnalysisSnapshot, TimingBudget, TimingComponent } from "@audiolab/core";
import { toleranceFromUncertainty } from "@audiolab/core/rhythm";
import { Panel } from "@audiolab/react";
import { LatencyHow } from "../../how/explanations";

const COMPONENT_LABELS: Record<string, string> = {
  input: "Microphone → audio thread",
  display: "Screen (draw → seen)",
  output: "Audio out → speaker",
  roundTrip: "Speaker → microphone (measured from the click)",
  clock: "Audio ↔ page clock",
  detector: "Onset detector",
  strum: "Strum spread",
  calibration: "Click → your note (set by ear)",
};

const SOURCE_LABELS: Record<TimingComponent["source"], string> = {
  measured: "measured",
  reported: "reported",
  assumed: "assumed",
};

const ms = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : `${v.toFixed(digits)} ms`;

interface TimingPanelProps {
  snapshot: OnsetAnalysisSnapshot | null;
  budget: TimingBudget | null;
  captureMethod: string | null;
}

/** Latency diagnostics: what the capture measured and the timing budget built from it. */
export function TimingPanel({ snapshot, budget, captureMethod }: TimingPanelProps) {
  const clock = snapshot?.clock;
  const tolerance = budget ? toleranceFromUncertainty(budget.uncertaintyMs) : null;
  const reaction =
    clock && snapshot ? clock.batchMs + clock.medianDelayMs + snapshot.decisionLatencyMs : null;

  return (
    <Panel
      title="Timing"
      meta={
        captureMethod
          ? `${captureMethod}${snapshot?.exactTiming === false ? " · estimated frames" : ""}`
          : undefined
      }
      as="section"
    >
      <dl className="al-stat-grid rhythm__stats">
        <div className="al-stat">
          <dt className="al-stat__label">Start → first audio</dt>
          <dd className="al-stat__value">{ms(clock?.startupMs)}</dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">Start → first sound</dt>
          <dd className="al-stat__value">{ms(clock?.firstSignalMs)}</dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">Batch delivery (median / p95)</dt>
          <dd className="al-stat__value">
            {clock ? `${clock.medianDelayMs.toFixed(1)} / ${clock.p95DelayMs.toFixed(1)} ms` : "—"}
          </dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">Reaction delay</dt>
          <dd className="al-stat__value">{ms(reaction)}</dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">Gaps in the audio</dt>
          <dd className="al-stat__value">{clock ? clock.gaps : "—"}</dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">On-time window</dt>
          <dd className="al-stat__value">
            {tolerance ? `± ${tolerance.onTimeMs.toFixed(0)} ms` : "—"}
          </dd>
        </div>
        <div className="al-stat">
          <dt className="al-stat__label">Screen held back (to match the click)</dt>
          <dd className="al-stat__value">{ms(budget?.visualDelayMs)}</dd>
        </div>
      </dl>

      {budget && (
        <table className="rhythm__budget">
          <caption className="al-surtitre">Latency budget</caption>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Delay</th>
              <th scope="col">± (1σ)</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {budget.components.map((c) => (
              <tr key={c.id}>
                <th scope="row">{COMPONENT_LABELS[c.id] ?? c.id}</th>
                <td className="al-num">{ms(c.offsetMs, 1)}</td>
                <td className="al-num">{ms(c.uncertaintyMs, 1)}</td>
                <td data-source={c.source}>{SOURCE_LABELS[c.source]}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td className="al-num">{ms(budget.offsetMs, 1)}</td>
              <td className="al-num">{ms(budget.uncertaintyMs, 1)}</td>
              <td>{budget.calibrated ? "calibrated" : "estimated"}</td>
            </tr>
          </tfoot>
        </table>
      )}

      <LatencyHow />
    </Panel>
  );
}
