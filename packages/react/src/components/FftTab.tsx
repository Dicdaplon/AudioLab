"use client";

import type { ReactNode } from "react";

import { SpectrumPlot } from "./SpectrumPlot";
import { TempoPlot } from "./TempoPlot";
import { TimeSignalPlot } from "./TimeSignalPlot";
import { FftSettingsPanel } from "./FftSettingsPanel";
import { Panel } from "./Panel";
import { SettingsRail } from "./SettingsRail";
import {
  FFT_DISPLAY_MAX_HZ,
  type FftSettings,
  type MicSource,
  type TempoAnalyzerMethod,
} from "@audiolab/core";
import { useTempoAnalysis } from "../hooks/useTempoAnalysis";
import type { SpectrumState } from "../hooks/useTonality";
import { BREAKPOINTS, useMediaQuery } from "../ui/useMediaQuery";

interface FftTabProps {
  /** Open microphone session, or null when stopped. */
  mic: MicSource | null;
  /** AnalyserNode spectrum of the last frame (from useTonality). */
  spectrum: SpectrumState;
  settings: FftSettings;
  onSettingsChange: (settings: FftSettings) => void;
  /** Which half to show: both (default), the spectrum, or the tempo. */
  view?: "all" | "spectrum" | "tempo";
  /** Compact "How?" sheets closing each panel; a sheet replaces the hint. */
  how?: { spectrum?: ReactNode; tempo?: ReactNode };
  /** Tempo method of the tempo half (`useTempoAnalysis`). Default "envelope". */
  tempoMethod?: TempoAnalyzerMethod;
}

const EMPTY = new Float32Array(0);

/**
 * FFT-centric analysis tab.
 *
 * Spectrum: AnalyserNode magnitude spectrum with noise floor estimation.
 * Tempo: onset-strength envelope of the last 8 s and its spectrum on a
 * BPM axis, with the estimated beat rate. The tempo capture and analysis
 * run only while the tempo half is shown.
 */
export function FftTab({
  mic,
  spectrum,
  settings,
  onSettingsChange,
  view = "all",
  how = {},
  tempoMethod,
}: FftTabProps) {
  const showSpectrum = view !== "tempo";
  const showTempo = view !== "spectrum";
  const tempo = useTempoAnalysis(showTempo ? mic : null, {
    lowpassCutoffHz: settings.onsetLowpassHz,
    method: tempoMethod,
  });
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
  const windowLabel = windowSeconds > 0 ? windowSeconds.toFixed(0) : "8";
  // Plots are shorter on a phone so the tempo pair fits one screen.
  const compact = !useMediaQuery(BREAKPOINTS.sm);

  return (
    <div className="al-fft">
      <div className="al-fft__settings">
        <SettingsRail>
          <FftSettingsPanel settings={settings} onChange={onSettingsChange} />
        </SettingsRail>
      </div>

      {showSpectrum && (
        <Panel className="al-panel--bed al-fft__spectrum" as="section" how={how.spectrum}>
          <SpectrumPlot
            spectrumDb={spectrum.spectrumDb}
            binHz={spectrum.binHz}
            noiseFloorDb={spectrum.noiseFloorDb}
            title="Magnitude spectrum"
            meta={`${spectrum.noiseMethod} floor ${spectrum.noiseFloorDb.toFixed(1)} dB`}
            height={compact ? 220 : 280}
            showSlope={settings.showSlope}
            showScaleNotes={settings.showScaleNotes}
            minFreqHz={0}
            maxFreqHz={FFT_DISPLAY_MAX_HZ}
          />
          {!how.spectrum && (
            <p className="al-hint">
              Magnitude spectrum (dB) from the AnalyserNode, 0–{FFT_DISPLAY_MAX_HZ / 1000} kHz. The
              dashed line is the noise floor ({spectrum.noiseMethod} method over the displayed
              band).
            </p>
          )}
        </Panel>
      )}

      {showTempo && (
        <Panel
          how={how.tempo}
          title="Tempo"
          meta={`last ${windowLabel} s`}
          className="al-panel--bed al-fft__tempo-panel"
          as="section"
        >
          <p className="al-fft__status" role="status">
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

          <div className="al-fft__tempo">
            <TimeSignalPlot
              signal={frame?.onsetEnvelope ?? EMPTY}
              sampleRate={frame?.envelopeRate ?? 0}
              title="Onset strength"
              yLabel="Onset strength"
              height={compact ? 140 : 160}
            />
            <TempoPlot
              spectrum={frame?.spectrum ?? EMPTY}
              bpmAxis={frame?.bpmAxis ?? EMPTY}
              estimate={estimate}
              title="Beat spectrum (40–240 BPM)"
              height={compact ? 160 : 180}
            />
          </div>

          {!how.tempo && (
            <p className="al-hint">
              The loudness envelope of the last {windowLabel} s is turned into an onset-strength
              signal (RMS per block, log compression, half-wave rectified difference, lowpass at{" "}
              {settings.onsetLowpassHz.toFixed(1)} Hz). Its spectrum shows the dominant beat rates;
              the estimate is the peak weighted by a tempo prior centred on 120 BPM. Estimates can
              be off by a factor of two (octave ambiguity).
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}
