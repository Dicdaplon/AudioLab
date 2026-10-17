import { useEffect, useRef, type CSSProperties } from "react";
import type { OnsetAnalysis, OnsetAnalysisSnapshot } from "@audiolab/core";
import { Panel, useVizTheme } from "@audiolab/react";

const METER_MIN_DB = -90;
const METER_RANGE_DB = 80;
const STRIP_SECONDS = 5;

const fraction = (db: number) => Math.min(1, Math.max(0, (db - METER_MIN_DB) / METER_RANGE_DB));
const percent = (f: number) => `${(f * 100).toFixed(1)}%`;

interface ListeningPanelProps {
  snapshot: OnsetAnalysisSnapshot | null;
  analysis: OnsetAnalysis | null;
}

/** The automatic gate (level, learnt floor, threshold) and the last onsets on a timeline. */
export function ListeningPanel({ snapshot, analysis }: ListeningPanelProps) {
  const gate = snapshot?.gate;
  let status = "Waiting for the microphone…";
  if (gate?.warmingUp) status = "Listening to the room…";
  else if (gate?.noisy) status = "This room is noisy: play closer to the microphone.";
  else if (gate?.open) status = "Hearing you.";
  else if (gate) status = "Quiet. Play a note.";

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
                <div
                  className="rhythm__floor"
                  style={{ "--floor": percent(fraction(gate.floorDb)) } as CSSProperties}
                  title="Background level (learnt)"
                />
                <div
                  className="al-meter__gate"
                  data-open={gate.open ? "" : undefined}
                  style={{ "--gate": percent(fraction(gate.openThresholdDb)) } as CSSProperties}
                  title="Threshold: background + 6 dB"
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
      </div>

      <OnsetStrip snapshot={snapshot} analysis={analysis} />

      <p className="al-hint">
        No threshold to set: the gate learns the background (the quietest level of the last 6 s),
        opens 6 dB above it and lets each note ring for 250 ms before closing. An onset counts when
        its attack rises 6 dB above the background. Onsets come from a SuperFlux spectral flux (21
        ms window, 2.7 ms hop) with online peak picking, then the attack start is found on a 0.7 ms
        level envelope.
      </p>
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
