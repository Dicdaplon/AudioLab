import { useState } from "react";

import { ChordGame } from "./components/ChordGame";
import { ChordView } from "./components/ChordView";
import { ChromaView } from "./components/ChromaView";
import { KeyProbabilities } from "./components/KeyProbabilities";
import { MicCapture } from "./components/MicCapture";
import {
  SettingsPanel,
  type ToneBaseSettings,
} from "./components/SettingsPanel";
import { ToneBaseTonalityView } from "./components/ToneBaseTonalityView";
import { WolfJumper } from "./components/WolfJumper";
import { FftTab } from "./components/FftTab";
import { type FftSettings } from "./components/FftSettingsPanel";
import { useTonality } from "./hooks/useTonality";
import "./App.css";

/**
 * Defaults tuned by `npm run sweep` against the project's samples.
 */
const DEFAULT_SETTINGS: ToneBaseSettings = {
  liveAcquisitionSeconds: 8,
  tonalityAcquisitionSeconds: 30,
  maxFilterTolerancy: 0.35,
  maxFilterMemory: 3,
  maxFilterMode: "mean",
};

const DEFAULT_FFT_SETTINGS: FftSettings = {
  noiseMethod: "median",
  lowpassCutoffHz: 2,
  showDerivative: false,
  showScaleNotes: true,
};

type Tab = "detector" | "game" | "jumper" | "fft";

export default function App() {
  const [tab, setTab] = useState<Tab>("detector");
  const [settings, setSettings] = useState<ToneBaseSettings>(DEFAULT_SETTINGS);
  const [fftSettings, setFftSettings] = useState<FftSettings>(DEFAULT_FFT_SETTINGS);

  const tonality = useTonality({
    liveAcquisitionSeconds: settings.liveAcquisitionSeconds,
    tonalityAcquisitionSeconds: settings.tonalityAcquisitionSeconds,
    chordWindowSeconds: 1,
    framesPerSecond: 10,
    fftSize: 16384,
    maxFilterTolerancy: settings.maxFilterTolerancy,
    maxFilterMemory: settings.maxFilterMemory,
    maxFilterMode: settings.maxFilterMode,
    fftEnabled: tab === "fft",
    noiseMethod: fftSettings.noiseMethod,
    lowpassCutoffHz: fftSettings.lowpassCutoffHz,
  });

  return (
    <div className="app">
      <header>
        <h1>Tonality Detector</h1>
        <p className="subtitle">
          3 fenêtres en parallèle · accord (template matching) · tonalité
          (Krumhansl-Schmuckler maj+min) · ToneBaseTonality (présence)
        </p>
        <nav className="tabs">
          <button
            type="button"
            className={`tab-btn ${tab === "detector" ? "active" : ""}`}
            onClick={() => setTab("detector")}
          >
            Détecteur
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === "game" ? "active" : ""}`}
            onClick={() => setTab("game")}
          >
            🎮 Jeu d'accords
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === "jumper" ? "active" : ""}`}
            onClick={() => setTab("jumper")}
          >
            🐺 Wolf Jumper
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === "fft" ? "active" : ""}`}
            onClick={() => setTab("fft")}
          >
            📊 FFT
          </button>
        </nav>
      </header>

      <MicCapture
        running={tonality.running}
        error={tonality.error}
        onStart={tonality.start}
        onStop={tonality.stop}
        onReset={tonality.reset}
      />

      {tab === "detector" && (
        <>
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            currentThreshold={tonality.filterThreshold}
            lastPeak={tonality.filterLastPeak}
          />

          <section className="chroma-panels">
            <ChromaView
              title="Chroma instantané"
              chroma={tonality.instantaneousChroma}
            />
            <ChromaView
              title={`Chord window (${tonality.config.chordWindowSeconds}s)`}
              chroma={tonality.chordChroma}
            />
            <ChromaView
              title={`Live acquisition (${tonality.config.liveAcquisitionSeconds}s)`}
              chroma={tonality.liveAcquisitionChroma}
            />
            <ChromaView
              title={`Tonality acquisition (${tonality.config.tonalityAcquisitionSeconds}s)`}
              chroma={tonality.tonalityAcquisitionChroma}
            />
          </section>

          <section className="result-panels">
            <ChordView
              chords={tonality.chords}
              windowSeconds={tonality.config.chordWindowSeconds}
              topN={6}
            />
            <KeyProbabilities
              label="Live acquisition"
              keys={tonality.liveKeys}
              windowSeconds={tonality.config.liveAcquisitionSeconds}
              topN={5}
            />
            <KeyProbabilities
              label="Tonality acquisition"
              keys={tonality.tonalityKeys}
              windowSeconds={tonality.config.tonalityAcquisitionSeconds}
              topN={5}
            />
          </section>

          <section className="tone-base-section">
            <ToneBaseTonalityView
              presence={tonality.presenceHistogram}
              filteredLiveChroma={tonality.filteredLiveChroma}
              presenceIndicator={tonality.presenceIndicator}
              keys={tonality.presenceKeys}
              liveSeconds={tonality.config.liveAcquisitionSeconds}
              tonalitySeconds={tonality.config.tonalityAcquisitionSeconds}
              topN={6}
            />
          </section>
        </>
      )}

      {tab === "game" && (
        <ChordGame
          chords={tonality.chords}
          running={tonality.running}
          onStart={tonality.start}
        />
      )}

      {tab === "jumper" && (
        <WolfJumper
          instantaneousChroma={tonality.instantaneousChroma}
          chords={tonality.chords}
          running={tonality.running}
          signalLevelDb={tonality.signalLevelDb}
          onStart={tonality.start}
        />
      )}

      {tab === "fft" && (
        <FftTab
          spectrumDb={tonality.fft.spectrumDb}
          binHz={tonality.fft.binHz}
          noiseFloorDb={tonality.fft.noiseFloorDb}
          noiseMethod={tonality.fft.noiseMethod}
          tempoEnvelopeDb={tonality.tempoAnalysis.envelopeDb}
          lowpassCutoffHz={tonality.tempoAnalysis.lowpassCutoffHz}
          timeSignal={tonality.tempoAnalysis.timeSignal}
          sampleRate={tonality.tempoAnalysis.sampleRate}
          settings={fftSettings}
          onSettingsChange={setFftSettings}
        />
      )}
    </div>
  );
}
