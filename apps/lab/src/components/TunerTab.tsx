import { useState } from "react";
import { A4_FREQ, type MicSource, pitchClassName } from "@audiolab/core";
import { MicPrompt, Panel, RangeField, Segments, usePitch } from "@audiolab/react";
import { TunerHow } from "../how/explanations";
import { PITCH_METHODS, type PitchMethodId } from "../methods";
import { MethodPicker } from "./MethodPicker";

/** The CREPE tiny model shipped with the lab (MIT, public/models/crepe-tiny/). */
const CREPE_MODEL_URL = `${import.meta.env.BASE_URL}models/crepe-tiny/crepe-tiny.bin`;

const A4_MIN = 415;
const A4_MAX = 466;
/** Within this many cents the note is shown as in tune. */
const IN_TUNE_CENTS = 5;
const CLARITY_SEGMENTS = 5;

interface TunerTabProps {
  mic: MicSource | null;
  running: boolean;
  onStart?: () => void;
}

/** Scientific pitch octave of a MIDI note (A4 = 69 → 4). */
function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/** Chromatic tuner: note name, cents needle, frequency and the A4 reference. */
export function TunerTab({ mic, running, onStart }: TunerTabProps) {
  const [referenceA4, setReferenceA4] = useState(A4_FREQ);
  const [method, setMethod] = useState<PitchMethodId>("mpm");
  const { estimate, captureMethod } = usePitch(mic, {
    referenceA4,
    method,
    crepeModelUrl: CREPE_MODEL_URL,
  });
  const cents = estimate?.cents ?? 0;
  const inTune = estimate !== null && Math.abs(cents) <= IN_TUNE_CENTS;
  const needle = Math.max(-60, Math.min(60, cents));

  return (
    <div className="tuner">
      {!running && <MicPrompt message="Start the microphone to tune." onStart={onStart} />}

      <MethodPicker
        name="pitch-method"
        title="Pitch detection method"
        choices={PITCH_METHODS}
        value={method}
        onChange={setMethod}
        note={
          method === "crepe" ? "The AI model (1 MB) loads the first time you pick it." : undefined
        }
      />

      <Panel title="Tuner" meta={captureMethod ? `${captureMethod} · 2048` : "2048"} as="section">
        <div
          className="al-readout tuner__readout"
          data-intune={inTune ? "" : undefined}
          role="group"
          aria-label="Detected note"
        >
          <span className="al-readout__label al-surtitre">
            Note
            <span className="al-readout__meta al-num"> · A4 = {referenceA4} Hz</span>
          </span>
          <strong className="al-readout__value">
            {estimate ? (
              <>
                {pitchClassName(estimate.pitchClass)}
                <sub className="tuner__octave al-num">{octaveOf(estimate.midi)}</sub>
              </>
            ) : (
              <span className="al-readout__empty" aria-label="no value yet">
                —
              </span>
            )}
          </strong>
          {estimate ? (
            <span className="al-readout__prob">
              <span className="al-num">
                {cents >= 0 ? "+" : "−"}
                {Math.abs(cents).toFixed(1)} cents
              </span>
              <Segments
                className="al-segments--small al-readout__confidence"
                count={CLARITY_SEGMENTS}
                filled={Math.round(estimate.clarity * CLARITY_SEGMENTS)}
                label={`clarity ${(estimate.clarity * 100).toFixed(0)} %`}
              />
            </span>
          ) : (
            <span className="al-readout__hint">
              {running ? "Play one note…" : "Waiting for signal…"}
            </span>
          )}
        </div>

        <div
          className="tuner__meter"
          role="meter"
          aria-label="deviation in cents"
          aria-valuemin={-50}
          aria-valuemax={50}
          aria-valuenow={estimate ? Math.round(cents) : undefined}
          aria-valuetext={estimate ? `${cents.toFixed(1)} cents` : "no note"}
          data-active={estimate ? "" : undefined}
          data-intune={inTune ? "" : undefined}
          style={{ "--cents": needle } as React.CSSProperties}
        >
          <div className="tuner__scale" aria-hidden="true">
            {[-50, -25, 0, 25, 50].map((tick) => (
              <span
                key={tick}
                className="tuner__tick"
                data-zero={tick === 0 ? "" : undefined}
                style={{ left: `${50 + tick}%` }}
              >
                <span className="tuner__tick-label al-num">{tick > 0 ? `+${tick}` : tick}</span>
              </span>
            ))}
            <span className="tuner__zone" />
          </div>
          <span className="tuner__needle" />
        </div>

        <dl className="al-stat-grid tuner__stats">
          <div className="al-stat">
            <dt className="al-stat__label">Frequency</dt>
            <dd className="al-stat__value">
              {estimate ? estimate.frequency.toFixed(1) : "—"}
              <span className="tuner__unit"> Hz</span>
            </dd>
          </div>
          <div className="al-stat">
            <dt className="al-stat__label">MIDI</dt>
            <dd className="al-stat__value">{estimate ? estimate.midi : "—"}</dd>
          </div>
          <div className="al-stat">
            <dt className="al-stat__label">Clarity</dt>
            <dd className="al-stat__value">
              {estimate ? (estimate.clarity * 100).toFixed(0) : "—"}
              <span className="tuner__unit"> %</span>
            </dd>
          </div>
        </dl>

        <RangeField
          id="a4"
          label="Reference A4"
          min={A4_MIN}
          max={A4_MAX}
          step={1}
          value={referenceA4}
          onChange={setReferenceA4}
          unit="Hz"
        />

        <TunerHow />
      </Panel>
    </div>
  );
}
