import { memo, useState } from "react";

import { ChordGame } from "./features/games/chord-game/ChordGame";
import { ChordView } from "./components/ChordView";
import { ChromaView } from "./components/ChromaView";
import { KeyProbabilities } from "./components/KeyProbabilities";
import { MicCapture } from "./components/MicCapture";
import { SettingsPanel } from "./components/SettingsPanel";
import { ToneBaseTonalityView } from "./components/ToneBaseTonalityView";
import { WolfJumper } from "./features/games/wolf-jumper/WolfJumper";
import { FftTab } from "./components/FftTab";
import {
  ANALYSIS_DEFAULTS,
  DEFAULT_DETECTOR_SETTINGS,
  DEFAULT_FFT_SETTINGS,
  type DetectorSettings,
  type FftSettings,
} from "./config/settings";
import { useMicrophone } from "./hooks/useMicrophone";
import { useTonality } from "./hooks/useTonality";
import "./App.css";

type Tab = "detector" | "game" | "jumper" | "fft";

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: "detector", label: "Détecteur" },
  { id: "game", label: "🎮 Jeu d'accords" },
  { id: "jumper", label: "🐺 Wolf Jumper" },
  { id: "fft", label: "📊 FFT" },
];

/** Static tab strip; re-renders only when the active tab changes. */
const TabBar = memo(function TabBar({
  active,
  onSelect,
}: {
  active: Tab;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <nav className="tabs">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`tab-btn ${active === id ? "active" : ""}`}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
});

export default function App() {
  const [tab, setTab] = useState<Tab>("detector");
  const [settings, setSettings] = useState<DetectorSettings>(DEFAULT_DETECTOR_SETTINGS);
  const [fftSettings, setFftSettings] = useState<FftSettings>(DEFAULT_FFT_SETTINGS);

  const microphone = useMicrophone();
  const tonality = useTonality(microphone.mic, {
    liveAcquisitionSeconds: settings.liveAcquisitionSeconds,
    tonalityAcquisitionSeconds: settings.tonalityAcquisitionSeconds,
    chordWindowSeconds: ANALYSIS_DEFAULTS.chordWindowSeconds,
    framesPerSecond: ANALYSIS_DEFAULTS.framesPerSecond,
    fftSize: ANALYSIS_DEFAULTS.fftSize,
    maxFilterTolerancy: settings.maxFilterTolerancy,
    maxFilterMemory: settings.maxFilterMemory,
    maxFilterMode: settings.maxFilterMode,
    fftEnabled: tab === "fft",
    noiseMethod: fftSettings.noiseMethod,
  });

  return (
    <div className="app">
      <header>
        <h1>Tonality Detector</h1>
        <p className="subtitle">
          3 fenêtres en parallèle · accord (template matching) · tonalité (Krumhansl-Schmuckler
          maj+min) · ToneBaseTonality (présence)
        </p>
        <TabBar active={tab} onSelect={setTab} />
      </header>

      <MicCapture
        running={microphone.running}
        error={microphone.error}
        onStart={microphone.start}
        onStop={microphone.stop}
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
            <ChromaView title="Chroma instantané" chroma={tonality.instantaneousChroma} />
            <ChromaView
              title={`Chord window (${ANALYSIS_DEFAULTS.chordWindowSeconds}s)`}
              chroma={tonality.chordChroma}
            />
            <ChromaView
              title={`Live acquisition (${settings.liveAcquisitionSeconds}s)`}
              chroma={tonality.liveAcquisitionChroma}
            />
            <ChromaView
              title={`Tonality acquisition (${settings.tonalityAcquisitionSeconds}s)`}
              chroma={tonality.tonalityAcquisitionChroma}
            />
          </section>

          <section className="result-panels">
            <ChordView
              chords={tonality.chords}
              windowSeconds={ANALYSIS_DEFAULTS.chordWindowSeconds}
              topN={6}
            />
            <KeyProbabilities
              label="Live acquisition"
              keys={tonality.liveKeys}
              windowSeconds={settings.liveAcquisitionSeconds}
              topN={5}
            />
            <KeyProbabilities
              label="Tonality acquisition"
              keys={tonality.tonalityKeys}
              windowSeconds={settings.tonalityAcquisitionSeconds}
              topN={5}
            />
          </section>

          <section className="tone-base-section">
            <ToneBaseTonalityView
              presence={tonality.presenceHistogram}
              filteredLiveChroma={tonality.filteredLiveChroma}
              presenceIndicator={tonality.presenceIndicator}
              keys={tonality.presenceKeys}
              liveSeconds={settings.liveAcquisitionSeconds}
              tonalitySeconds={settings.tonalityAcquisitionSeconds}
              topN={6}
            />
          </section>
        </>
      )}

      {tab === "game" && (
        <ChordGame
          chords={tonality.chords}
          running={microphone.running}
          onStart={microphone.start}
        />
      )}

      {tab === "jumper" && (
        <WolfJumper
          instantaneousChroma={tonality.instantaneousChroma}
          chords={tonality.chords}
          running={microphone.running}
          signalLevelDb={tonality.signalLevelDb}
          onStart={microphone.start}
        />
      )}

      {tab === "fft" && (
        <FftTab
          spectrumDb={tonality.fft.spectrumDb}
          binHz={tonality.fft.binHz}
          noiseFloorDb={tonality.fft.noiseFloorDb}
          noiseMethod={tonality.fft.noiseMethod}
          tempoEnvelopeDb={new Float32Array(0)}
          lowpassCutoffHz={fftSettings.lowpassCutoffHz}
          timeSignal={new Float32Array(0)}
          sampleRate={microphone.mic?.context.sampleRate ?? 0}
          settings={fftSettings}
          onSettingsChange={setFftSettings}
        />
      )}
    </div>
  );
}
