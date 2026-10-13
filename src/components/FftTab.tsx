import { SpectrumPlot } from "./SpectrumPlot";
import { TempoPlot } from "./TempoPlot";
import { TimeSignalPlot } from "./TimeSignalPlot";
import { FftSettingsPanel } from "./FftSettingsPanel";
import type { MicSource } from "../audio/micStream";
import { FFT_DISPLAY_MAX_HZ, type FftSettings } from "../config/settings";
import { useTempoAnalysis } from "../hooks/useTempoAnalysis";
import type { SpectrumState } from "../hooks/useTonality";

interface FftTabProps {
  /** Open microphone session, or null when stopped. */
  mic: MicSource | null;
  /** AnalyserNode spectrum of the last frame (from useTonality). */
  spectrum: SpectrumState;
  settings: FftSettings;
  onSettingsChange: (settings: FftSettings) => void;
}

const EMPTY = new Float32Array(0);

/**
 * FFT-centric analysis tab.
 *
 * Section 1: AnalyserNode magnitude spectrum with noise floor estimation.
 * Section 2: tempo analysis — onset-strength envelope of the last 8 s and
 * its spectrum on a BPM axis, with the estimated beat rate. The tempo
 * capture and analysis run only while this tab is mounted.
 */
export function FftTab({ mic, spectrum, settings, onSettingsChange }: FftTabProps) {
  const tempo = useTempoAnalysis(mic, { lowpassCutoffHz: settings.onsetLowpassHz });
  const frame = tempo.frame;
  const estimate = frame?.estimate ?? null;

  let tempoStatus: string;
  if (!mic) {
    tempoStatus = "Start the microphone to analyse the tempo.";
  } else if (!frame) {
    tempoStatus = "Starting capture…";
  } else if (estimate) {
    tempoStatus = `Estimated tempo: ${estimate.bpm.toFixed(1)} BPM (confidence ${(
      estimate.confidence * 100
    ).toFixed(0)} %)`;
  } else {
    tempoStatus = "No beat detected yet.";
  }
  const windowSeconds = frame ? frame.onsetEnvelope.length / frame.envelopeRate : 0;

  return (
    <div className="fft-tab">
      <FftSettingsPanel settings={settings} onChange={onSettingsChange} />

      <section className="fft-section-1">
        <h3>Section 1: FFT Magnitude Spectrum</h3>
        <p className="section-description">
          Magnitude spectrum (dB) from the AnalyserNode, 0–{FFT_DISPLAY_MAX_HZ / 1000} kHz. Red
          dashed line: noise floor ({spectrum.noiseMethod} method,{" "}
          {spectrum.noiseFloorDb.toFixed(1)} dB over the displayed band).
        </p>
        <SpectrumPlot
          spectrumDb={spectrum.spectrumDb}
          binHz={spectrum.binHz}
          noiseFloorDb={spectrum.noiseFloorDb}
          title="FFT Magnitude (dB)"
          height={300}
          showSlope={settings.showSlope}
          showScaleNotes={settings.showScaleNotes}
          minFreqHz={0}
          maxFreqHz={FFT_DISPLAY_MAX_HZ}
        />
      </section>

      <section className="fft-section-2">
        <h3>Section 2: Tempo Analysis (onset envelope)</h3>
        <p className="section-description">
          The loudness envelope of the last {windowSeconds > 0 ? windowSeconds.toFixed(0) : 8} s is
          turned into an onset-strength signal (RMS per block, log compression, half-wave rectified
          difference, lowpass at {settings.onsetLowpassHz.toFixed(1)} Hz). Its spectrum shows the
          dominant beat rates; the estimate is the peak weighted by a tempo prior centred on 120
          BPM. Estimates can be off by a factor of two (octave ambiguity).
        </p>
        <p className="section-description" role="status">
          {tempoStatus}
          {frame && frame.filledSeconds < windowSeconds && (
            <>
              {" "}
              — {frame.filledSeconds.toFixed(1)} s of {windowSeconds.toFixed(0)} s captured
            </>
          )}
          {tempo.captureMethod && (
            <>
              {" "}
              · capture:{" "}
              {tempo.captureMethod === "worklet"
                ? "AudioWorklet (sample-accurate)"
                : "AnalyserNode fallback (envelope-accurate)"}
            </>
          )}
        </p>

        <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Onset strength (last 8 s)</h4>
        <TimeSignalPlot
          signal={frame?.onsetEnvelope ?? EMPTY}
          sampleRate={frame?.envelopeRate ?? 0}
          title="Onset strength"
          yLabel="Onset strength"
          height={180}
        />

        <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Beat spectrum (40–240 BPM)</h4>
        <TempoPlot
          spectrum={frame?.spectrum ?? EMPTY}
          bpmAxis={frame?.bpmAxis ?? EMPTY}
          estimate={estimate}
          title="Envelope spectrum"
          height={220}
        />
      </section>
    </div>
  );
}
