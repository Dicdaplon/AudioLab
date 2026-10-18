import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { OnsetAnalysis, OnsetAnalysisSnapshot } from "@audiolab/core";
import { Panel, RangeField, Switch, useVizTheme } from "@audiolab/react";
import { OnsetHow } from "../../how/explanations";

const METER_MIN_DB = -90;
const METER_RANGE_DB = 80;
const STRIP_SECONDS = 5;
/** Range of the hand-set threshold, in dB. */
const MANUAL_MIN_DB = -80;
const MANUAL_MAX_DB = -20;

const fraction = (db: number) => Math.min(1, Math.max(0, (db - METER_MIN_DB) / METER_RANGE_DB));
const percent = (f: number) => `${(f * 100).toFixed(1)}%`;

interface ListeningPanelProps {
  snapshot: OnsetAnalysisSnapshot | null;
  analysis: OnsetAnalysis | null;
}

/**
 * The gate (level, learnt floor, threshold) and the last onsets on a
 * timeline. The threshold follows the room by itself; "Set it myself"
 * replaces it with a slider.
 */
export function ListeningPanel({ snapshot, analysis }: ListeningPanelProps) {
  const [manual, setManual] = useState(false);
  const [manualDb, setManualDb] = useState(-50);
  useEffect(() => {
    if (analysis?.pipeline) analysis.pipeline.manualThresholdDb = manual ? manualDb : null;
  }, [analysis, manual, manualDb]);

  const gate = snapshot?.gate;
  const thresholdDb = manual ? manualDb : gate?.openThresholdDb;
  const open = manual ? (gate?.levelDb ?? -Infinity) >= manualDb : gate?.open;
  let status = "Waiting for the microphone…";
  if (!manual && gate?.warmingUp) status = "Listening to the room…";
  else if (!manual && gate?.noisy) status = "This room is noisy: play closer to the microphone.";
  else if (gate && open) status = "Hearing you.";
  else if (gate) status = manual ? "Quiet, or under your threshold." : "Quiet. Play a note.";

  return (
    <Panel
      title="Listening"
      meta={snapshot ? `${snapshot.counts.accepted} onsets` : undefined}
      as="section"
    >
      <div className="rhythm__gate">
        <div
          className="al-meter"
          role="meter"
          aria-label="signal level"
          aria-valuemin={METER_MIN_DB}
          aria-valuemax={METER_MIN_DB + METER_RANGE_DB}
          aria-valuenow={gate ? Math.round(Math.max(METER_MIN_DB, gate.levelDb)) : undefined}
          aria-valuetext={gate ? `${Math.round(gate.levelDb)} dB` : "no signal"}
        >
          <div className="al-meter__track">
            <div
              className="al-meter__fill"
              style={{ "--level": percent(gate ? fraction(gate.levelDb) : 0) } as CSSProperties}
            />
            {gate && (
              <>
                {!manual && (
                  <div
                    className="rhythm__floor"
                    style={{ "--floor": percent(fraction(gate.floorDb)) } as CSSProperties}
                    title="Background level (learnt)"
                  />
                )}
                <div
                  className="al-meter__gate"
                  data-open={open ? "" : undefined}
                  style={
                    { "--gate": percent(fraction(thresholdDb ?? METER_MIN_DB)) } as CSSProperties
                  }
                  title={manual ? "Threshold: set by hand" : "Threshold: background + 6 dB"}
                />
              </>
            )}
          </div>
          <span className="al-meter__value al-num">
            {gate ? `${Math.round(gate.levelDb)} dB` : "—"}
          </span>
        </div>
        <p className="rhythm__status" role="status">
          {status}
        </p>
        <Switch id="onset-gate-manual" checked={manual} onChange={setManual}>
          Set the threshold myself
        </Switch>
        {manual ? (
          <RangeField
            id="onset-gate"
            label="Count a note above"
            min={MANUAL_MIN_DB}
            max={MANUAL_MAX_DB}
            step={1}
            value={manualDb}
            onChange={setManualDb}
            format={(v) => v.toFixed(0)}
            unit="dB"
          />
        ) : (
          <p className="al-hint">
            Adjusts to your room by itself: a note counts when it is clearly louder than the
            background.
          </p>
        )}
      </div>

      <OnsetStrip snapshot={snapshot} analysis={analysis} />

      <OnsetHow />
    </Panel>
  );
}

/** Canvas timeline of the last onsets, drawn on every animation frame. */
function OnsetStrip({ snapshot, analysis }: ListeningPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useVizTheme();
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || typeof requestAnimationFrame !== "function") return;
    let handle = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
      if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = theme.bed;
      ctx.fillRect(0, 0, width, height);

      const now = analysis?.clock.perfMsToContextTime(performance.now()) ?? null;
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      for (let s = 1; s < STRIP_SECONDS; s++) {
        const x = Math.round(width - (s / STRIP_SECONDS) * width) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      const onsets = snapshotRef.current?.recentOnsets ?? [];
      if (now !== null) {
        for (const o of onsets) {
          const age = now - o.time;
          if (age < 0 || age > STRIP_SECONDS) continue;
          const x = width - (age / STRIP_SECONDS) * width;
          const h = Math.max(6, fraction(o.levelDb) * (height - 8));
          ctx.fillStyle = o.localized ? theme.signalStrong : theme.threshold;
          ctx.fillRect(x - 1.5, height - h, 3, h);
        }
      } else {
        ctx.fillStyle = theme.emptyText;
        ctx.font = `12px ${theme.fontUi}`;
        ctx.fillText("Waiting for signal…", 8, height / 2 + 4);
      }
      handle = requestAnimationFrame(draw);
    };
    handle = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(handle);
  }, [analysis, theme]);

  return (
    <figure className="rhythm__strip">
      <figcaption className="al-surtitre">Onsets, last {STRIP_SECONDS} s</figcaption>
      <canvas ref={canvasRef} className="rhythm__strip-canvas" aria-hidden="true" />
    </figure>
  );
}
