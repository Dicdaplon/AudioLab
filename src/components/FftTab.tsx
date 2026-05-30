import { SpectrumPlot } from "./SpectrumPlot";
import { TimeSignalPlot } from "./TimeSignalPlot";
import { FftSettingsPanel, type FftSettings } from "./FftSettingsPanel";

interface FftTabProps {
  spectrumDb: Float32Array;
  binHz: number;
  noiseFloorDb: number;
  noiseMethod: string;
  tempoEnvelopeDb: Float32Array;
  lowpassCutoffHz: number;
  timeSignal: Float32Array;
  sampleRate: number;
  settings: FftSettings;
  onSettingsChange: (settings: FftSettings) => void;
}

/**
 * FFT-centric analysis tab (Phases 4-5).
 *
 * Section 1: FFT magnitude spectrum with noise floor estimation.
 * Section 2: Temporal envelope analysis via lowpass filtering.
 */
export function FftTab({
  spectrumDb,
  binHz,
  noiseFloorDb,
  noiseMethod,
  tempoEnvelopeDb,
  lowpassCutoffHz,
  timeSignal,
  sampleRate,
  settings,
  onSettingsChange,
}: FftTabProps) {
  return (
    <div className="fft-tab">
      <FftSettingsPanel settings={settings} onChange={onSettingsChange} />

      <section className="fft-section-1">
        <h3>Section 1: FFT Magnitude Spectrum</h3>
        <p className="section-description">
          Shows the magnitude spectrum (dB) of the audio.
          Red dashed line: noise floor ({noiseMethod} method, {noiseFloorDb.toFixed(1)} dB).
        </p>
        <SpectrumPlot
          spectrumDb={spectrumDb}
          binHz={binHz}
          noiseFloorDb={noiseFloorDb}
          title="FFT Magnitude (dB)"
          height={300}
          showDerivative={settings.showDerivative}
          showScaleNotes={settings.showScaleNotes}
          minFreqHz={0}
          maxFreqHz={4000}
        />
      </section>

      <section className="fft-section-2">
        <h3>Section 2: Tempo Analysis (Lowpass @ {lowpassCutoffHz.toFixed(2)} Hz)</h3>
        <p className="section-description">
          The time-domain signal (8s) is lowpass-filtered, then its FFT is shown
          over 0-50 Hz to reveal low-frequency modulation.
        </p>

        <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Filtered Time Signal (8s)</h4>
        <TimeSignalPlot signal={timeSignal} sampleRate={sampleRate} title="Filtered Signal" height={180} />

        <h4 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Filtered Signal Spectrum (0-50 Hz)</h4>
        <SpectrumPlot
          spectrumDb={tempoEnvelopeDb}
          binHz={binHz}
          noiseFloorDb={-100}
          title="FFT of Filtered Signal (dB)"
          height={200}
          showDerivative={false}
          showScaleNotes={false}
          minFreqHz={0}
          maxFreqHz={50}
        />
      </section>
    </div>
  );
}
