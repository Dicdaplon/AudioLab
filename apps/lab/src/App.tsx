import { useState } from "react";
import {
  ANALYSIS_DEFAULTS,
  DEFAULT_DETECTOR_SETTINGS,
  DEFAULT_FFT_SETTINGS,
  type DetectorSettings,
  type FftSettings,
} from "@audiolab/core";

import {
  ChordGame,
  DetectorTab,
  LoupeRoot,
  FftTab,
  MicNotice,
  MicTransport,
  TabBar,
  ThemeToggle,
  WolfJumper,
  panelId,
  tabId,
  useMicrophone,
  useTonality,
  type MicState,
  type TabDef,
} from "@audiolab/react";

import { About } from "./components/About";
import { Brand } from "./components/Brand";
import { ScalesTab } from "./components/ScalesTab";
import { TunerTab } from "./components/TunerTab";

type Tab = "detector" | "tuner" | "scales" | "game" | "jumper" | "fft" | "about";

const TABS: ReadonlyArray<TabDef<Tab>> = [
  { id: "detector", label: "Detector" },
  { id: "tuner", label: "Tuner" },
  { id: "scales", label: "Scales" },
  { id: "game", label: "Chord game" },
  { id: "jumper", label: "Wolf Jumper" },
  { id: "fft", label: "FFT" },
  { id: "about", label: "About" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("detector");
  const [settings, setSettings] = useState<DetectorSettings>(DEFAULT_DETECTOR_SETTINGS);
  const [fftSettings, setFftSettings] = useState<FftSettings>(DEFAULT_FFT_SETTINGS);
  const [colourByPitch, setColourByPitch] = useState(false);

  // Environment check (secure context, getUserMedia, AudioContext), after mount.
  const microphone = useMicrophone();
  const unsupported = microphone.unsupported;
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

  let micState: MicState = "idle";
  if (unsupported) micState = "unsupported";
  else if (microphone.error) micState = "error";
  else if (microphone.running) micState = "live";
  else if (microphone.starting) micState = "starting";
  const micError = unsupported?.message ?? microphone.error;

  return (
    <LoupeRoot className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__brand">
            <Brand />
          </div>
          <nav className="topbar__tabs">
            <TabBar tabs={TABS} active={tab} onSelect={setTab} label="Sections" />
          </nav>
          <div className="topbar__transport">
            <MicTransport
              state={micState}
              onStart={microphone.start}
              onStop={microphone.stop}
              onReset={tonality.reset}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="main">
        <h1 className="al-visually-hidden">loup(e) — audio lab</h1>

        {micError && (
          <MicNotice
            message={micError}
            kind={unsupported ? "unsupported" : "error"}
            onRetry={microphone.start}
          />
        )}

        <section
          className="tabpanel"
          role="tabpanel"
          id={panelId(tab)}
          aria-labelledby={tabId(tab)}
          tabIndex={-1}
        >
          {tab === "detector" && (
            <DetectorTab
              data={tonality}
              settings={settings}
              onSettingsChange={setSettings}
              colourByPitch={colourByPitch}
              onColourByPitchChange={setColourByPitch}
            />
          )}

          {tab === "tuner" && (
            <TunerTab
              mic={microphone.mic}
              running={microphone.running}
              onStart={microphone.start}
            />
          )}

          {tab === "scales" && (
            <ScalesTab
              presence={tonality.presenceHistogram}
              windowSeconds={settings.tonalityAcquisitionSeconds}
              running={microphone.running}
              onStart={microphone.start}
              colourByPitch={colourByPitch}
            />
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
              mic={microphone.mic}
              spectrum={tonality.fft}
              settings={fftSettings}
              onSettingsChange={setFftSettings}
            />
          )}

          {tab === "about" && <About />}
        </section>
      </main>
    </LoupeRoot>
  );
}
