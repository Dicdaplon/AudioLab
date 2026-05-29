import { SpectrumPlot } from "./SpectrumPlot";
import { FftSettingsPanel, type FftSettings } from "./FftSettingsPanel";

interface FftTabProps {
  spectrumDb: Float32Array;
  binHz: number;
  noiseFloorDb: number;
  noiseMethod: string;
  tempoEnvelopeDb: Float32Array;
  lowpassCutoffHz: number;
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
  settings,
  onSettingsChange,
}: FftTabProps) {
  return (
    <div className="fft-tab">
      <FftSettingsPanel settings={settings} onChange={onSettingsChange} />

      <section className="fft-section-1">
        <h3>Section 1: FFT Magnitude Spectrum</h3>
        <p className="section-description">
          Shows the magnitude spectrum (dB) of the last 1 second of audio.
          Red dashed line indicates the noise floor ({noiseMethod} method: {noiseFloorDb.toFixed(1)} dB).
        </p>
        <SpectrumPlot
          spectrumDb={spectrumDb}
          binHz={binHz}
          noiseFloorDb={noiseFloorDb}
          title="FFT Magnitude (dB)"
          height={300}
        />
      </section>

      <section className="fft-section-2">
        <h3>Section 2: Temporal Envelope (Lowpass @ {lowpassCutoffHz.toFixed(2)} Hz)</h3>
        <p className="section-description">
          Shows the low-frequency envelope extracted by lowpass filtering the spectral magnitude
          across time. Used for tempo analysis and transient detection.
        </p>
        <SpectrumPlot
          spectrumDb={tempoEnvelopeDb}
          binHz={binHz}
          noiseFloorDb={-100}
          title="Spectral Envelope (dB)"
          height={250}
        />
      </section>
    </div>
  );
}
